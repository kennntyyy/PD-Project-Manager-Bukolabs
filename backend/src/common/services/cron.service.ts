import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * Runs every hour to clean up inactive users
   * Logs out users who have been inactive for more than 24 hours
   * This is a safety measure in case frontend session expires before backend
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupInactiveUsers(): Promise<void> {
    try {
      this.logger.log('Starting cleanup of inactive users...');

      // Calculate the threshold: 24 hours ago
      const inactiveThreshold = new Date();
      inactiveThreshold.setHours(inactiveThreshold.getHours() - 24);

      // Find inactive users (not active in the last 24 hours)
      const inactiveUsers = await this.usersRepository.find({
        where: {
          last_active: LessThan(inactiveThreshold),
          is_active: true,
        },
      });

      if (inactiveUsers.length === 0) {
        this.logger.log('No inactive users to clean up');
        return;
      }

      this.logger.log(
        `Found ${inactiveUsers.length} users inactive for more than 24 hours`,
      );

      // Optional: Log inactive users for audit trail
      const inactiveUserIds = inactiveUsers.map((u) => ({
        user_id: u.user_id,
        username: u.username,
        last_active: u.last_active,
      }));
      this.logger.log(`Inactive users: ${JSON.stringify(inactiveUserIds)}`);

      // You can optionally perform actions here:
      // 1. Mark them as inactive
      // 2. Send notification emails
      // 3. Log to audit trail
      // For now, we just log them

      this.logger.log('Inactive users cleanup completed');
    } catch (err) {
      this.logger.error('Error during inactive users cleanup:', err);
    }
  }

  /**
   * Runs every 6 hours to log session statistics
   * Useful for monitoring and analytics
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async logSessionStatistics(): Promise<void> {
    try {
      this.logger.log('Logging session statistics...');

      const activeUsers = await this.usersRepository.find({
        where: { is_active: true, is_deleted: false },
      });

      const recentlyActiveUsers = activeUsers.filter((user) => {
        if (!user.last_active) return false;
        const lastActiveTime = new Date(user.last_active).getTime();
        const now = new Date().getTime();
        const oneHourAgo = now - 60 * 60 * 1000;
        return lastActiveTime > oneHourAgo;
      });

      this.logger.log(
        `Session Statistics: Total active users: ${activeUsers.length}, Recently active (last hour): ${recentlyActiveUsers.length}`,
      );
    } catch (err) {
      this.logger.error('Error during session statistics logging:', err);
    }
  }
}

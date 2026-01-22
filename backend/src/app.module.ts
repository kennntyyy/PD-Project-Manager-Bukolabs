import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { CronService } from './common/services/cron.service';
import { User } from './users/entities/user.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql', // Change from 'postgres' to 'mysql'
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306), // MySQL default port
        username: configService.get('DB_USERNAME', 'root'),
        password: configService.get('DB_PASSWORD', ''),
        database: configService.get('DB_DATABASE', 'project_management'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User]),
    AuthModule,
    UsersModule,
    ProjectsModule,
  ],
  controllers: [AppController],
  providers: [AppService, CronService],
})
export class AppModule {}

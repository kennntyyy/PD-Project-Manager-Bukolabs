const mysql = require('mysql2/promise');
require('dotenv').config();

async function clearCorruptedProfilePics() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'project_management',
  });

  try {
    console.log('Connected to database');

    // First, let's see what's in the database
    const [allUsers] = await connection.execute(
      `SELECT user_id, username, profile_pic, LENGTH(profile_pic) as pic_length FROM users WHERE profile_pic IS NOT NULL`,
    );

    console.log('\nCurrent users with profile pictures:');
    allUsers.forEach((user) => {
      console.log(
        `- ${user.username}: "${user.profile_pic}" (${user.pic_length} bytes)`,
      );
    });

    // Update all profile_pic fields that contain "[object Object]" or are invalid
    const [result] = await connection.execute(
      `UPDATE users SET profile_pic = NULL WHERE profile_pic LIKE '%object%' OR profile_pic = '[object Object]' OR LENGTH(profile_pic) < 100`,
    );

    console.log(`\nCleared ${result.affectedRows} corrupted profile pictures`);

    // Show remaining users with profile pics
    const [users] = await connection.execute(
      `SELECT user_id, username, LENGTH(profile_pic) as pic_length FROM users WHERE profile_pic IS NOT NULL`,
    );

    console.log('\nRemaining users with profile pictures:');
    users.forEach((user) => {
      console.log(`- ${user.username}: ${user.pic_length} bytes`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

clearCorruptedProfilePics();

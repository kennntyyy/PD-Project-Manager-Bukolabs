const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function hashPasswords() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'project_management'
  });

  try {
    // Get all users
    const [users] = await connection.execute('SELECT user_id, username, password FROM users');
    
    console.log(`Found ${users.length} users to hash`);
    
    for (const user of users) {
      // Skip if already hashed (bcrypt hashes start with $2a$)
      if (user.password.startsWith('$2a$')) {
        console.log(`⚠️ ${user.username}: Already hashed`);
        continue;
      }
      
      // Generate bcrypt hash
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      // Update database
      await connection.execute(
        'UPDATE users SET password = ? WHERE user_id = ?',
        [hashedPassword, user.user_id]
      );
      
      console.log(`✅ ${user.username}: Password hashed`);
    }
    
    console.log('\n🎉 All passwords hashed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

hashPasswords();
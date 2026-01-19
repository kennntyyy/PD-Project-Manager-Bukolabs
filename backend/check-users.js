const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function testDB() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'project_management'
    });

    console.log('✅ Connected to database');
    
    // Check users
    const [rows] = await connection.execute('SELECT user_id, username, email, password FROM users');
    console.log('\nUsers in database:');
    rows.forEach(row => {
      console.log(`ID: ${row.user_id}, Username: ${row.username}, Email: ${row.email}`);
    });
    
    if (rows.length > 0) {
      console.log('\n✅ Database has users');
      const firstUser = rows[0];
      
      // Test password matching
      const match = await bcrypt.compare('password123', firstUser.password);
      console.log(`\nPassword verification for '${firstUser.username}': `, match ? '✅ MATCHES' : '❌ DOES NOT MATCH');
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
}

testDB();

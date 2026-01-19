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
    const [rows] = await connection.execute('SELECT username, password FROM users');
    console.log('\nUsers in database:');
    rows.forEach(row => {
      console.log(`Username: ${row.username}, Password: "${row.password}"`);
    });
    
    // Try to find admin user
    const [adminRows] = await connection.execute(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      ['admin', 'admin123']
    );
    
    console.log(`\nAdmin login test: Found ${adminRows.length} user(s)`);
    if (adminRows.length > 0) {
      console.log('✅ Admin credentials match!');
    } else {
      console.log('❌ Admin credentials DO NOT match');
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
}

testDB();
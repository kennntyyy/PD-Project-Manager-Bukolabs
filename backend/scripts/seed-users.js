const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const seedUsers = [
  {
    user_id: '1',
    username: 'admin',
    email: 'admin@example.com',
    password: bcrypt.hashSync('admin123', 10),
    user_role: 'ADMIN',
    first_name: 'Admin',
    last_name: 'User',
    is_active: true,
  },
  {
    user_id: '2',
    username: 'staff1',
    email: 'staff@example.com',
    password: bcrypt.hashSync('staff123', 10),
    user_role: 'STAFF',
    first_name: 'Staff',
    last_name: 'User',
    is_active: true,
  },
  {
    user_id: '3',
    username: 'client1',
    email: 'client@example.com',
    password: bcrypt.hashSync('client123', 10),
    user_role: 'CLIENT',
    first_name: 'Client',
    last_name: 'User',
    is_active: true,
  },
  {
    user_id: '4',
    username: 'contractor1',
    email: 'contractor@example.com',
    password: bcrypt.hashSync('contractor123', 10),
    user_role: 'CONTRACTOR',
    first_name: 'Contractor',
    last_name: 'User',
    is_active: true,
  },
];

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'project_management',
  });

  try {
    for (const user of seedUsers) {
      const [existingUser] = await connection.execute(
        'SELECT * FROM users WHERE username = ?',
        [user.username]
      );

      if (existingUser.length === 0) {
        await connection.execute(
          'INSERT INTO users (user_id, username, email, password, user_role, first_name, last_name, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [user.user_id, user.username, user.email, user.password, user.user_role, user.first_name, user.last_name, user.is_active]
        );
        console.log(`✓ Created user: ${user.username}`);
      } else {
        console.log(`✓ User already exists: ${user.username}`);
      }
    }
    console.log('\n✓ Database seeding complete!');
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
})();

const db = require('../config/db');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function run() {
  console.log(`Starting database setup using active driver: "${db.getDriver()}"...`);

  // If driver is MySQL, make sure the database itself is created first
  if (db.isMysql()) {
    const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
    console.log(`[MySQL Setup] Connecting to MySQL root server to ensure database "${DB_NAME}" exists...`);
    try {
      const tempConn = await mysql.createConnection({
        host: DB_HOST || '127.0.0.1',
        port: parseInt(DB_PORT || '3306', 10),
        user: DB_USER || 'root',
        password: DB_PASSWORD || ''
      });
      await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
      await tempConn.end();
      console.log(`[MySQL Setup] Database "${DB_NAME}" checked/created.`);
    } catch (err) {
      console.error('[MySQL Setup Error] Failed to connect to MySQL server to create database.');
      console.error('Error details:', err.message);
      process.exit(1);
    }
  }

  try {
    console.log('Creating tables if they do not exist...');

    // 1. Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(60) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        address VARCHAR(400) NOT NULL,
        role ENUM('admin', 'user', 'store_owner') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Create ratings table
    await db.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        store_id INT NOT NULL,
        rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (store_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_store (user_id, store_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Seed users if empty
    const [userRows] = await db.query('SELECT COUNT(*) as count FROM users');
    const count = userRows[0].count;

    if (count === 0) {
      console.log('Seeding initial data...');
      const hashedPassword = await bcrypt.hash('Password123!', 10);

      const usersData = [
        ['System Administrator Account', 'admin@storerating.com', hashedPassword, 'Headquarters Admin Suite 100', 'admin'],
        ['Starbucks Coffee Corporation', 'starbucks@storerating.com', hashedPassword, '100 Seattle Brew Boulevard, WA', 'store_owner'],
        ['McDonald\'s Fast Food Outlet', 'mcdonalds@storerating.com', hashedPassword, '200 Chicago Burger Avenue, IL', 'store_owner'],
        ['Walmart Supercenter Retail', 'walmart@storerating.com', hashedPassword, '300 Bentonville Shop Street, AR', 'store_owner'],
        ['John Doe Customer Account', 'john.doe@storerating.com', hashedPassword, '456 Elmwood Residential Drive, CA', 'user'],
        ['Jane Smith Shopping Account', 'jane.smith@storerating.com', hashedPassword, '789 Maplewood Suburban Lane, NY', 'user'],
        ['Bob Johnson Reviewer Account', 'bob.johnson@storerating.com', hashedPassword, '321 Pinecrest Highway Loop, TX', 'user']
      ];

      for (const u of usersData) {
        await db.query(
          'INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)',
          u
        );
      }
      console.log('Seeded 7 user accounts.');

      // Fetch IDs
      const [dbUsers] = await db.query('SELECT id, email FROM users');
      const userMap = {};
      dbUsers.forEach(u => {
        userMap[u.email] = u.id;
      });

      // Seed Ratings
      const ratingsData = [
        [userMap['john.doe@storerating.com'], userMap['starbucks@storerating.com'], 5],
        [userMap['john.doe@storerating.com'], userMap['mcdonalds@storerating.com'], 3],
        [userMap['jane.smith@storerating.com'], userMap['starbucks@storerating.com'], 4],
        [userMap['jane.smith@storerating.com'], userMap['walmart@storerating.com'], 5],
        [userMap['bob.johnson@storerating.com'], userMap['mcdonalds@storerating.com'], 4],
        [userMap['bob.johnson@storerating.com'], userMap['walmart@storerating.com'], 3]
      ];

      for (const r of ratingsData) {
        await db.query(
          'INSERT INTO ratings (user_id, store_id, rating) VALUES (?, ?, ?)',
          r
        );
      }
      console.log('Seeded sample ratings.');
    } else {
      console.log('Database already initialized with records. Seeding skipped.');
    }

    console.log('\n[SUCCESS] Local database setup completed successfully!');
    process.exit(0);

  } catch (err) {
    console.error('\n[ERROR] Database creation or seeding failed:', err.message);
    process.exit(1);
  }
}

run();

const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const driver = process.env.DB_DRIVER || 'sqlite';

let mysqlPool = null;
let sqliteDb = null;

// Initialize SQLite database
const initSqlite = () => {
  const dbPath = path.join(__dirname, '../database.sqlite');
  // Create database file if not exists
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, '');
  }
  sqliteDb = new sqlite3.Database(dbPath);
  // Enable foreign key support in SQLite
  sqliteDb.run('PRAGMA foreign_keys = ON;');
  console.log(`[Database] SQLite connected successfully at: ${dbPath}`);
};

// Initialize MySQL pool
const initMysql = () => {
  mysqlPool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'store_rating_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  console.log('[Database] MySQL pool initialized.');
};

// Select and initialize driver
let activeDriver = driver;
if (driver === 'mysql') {
  try {
    initMysql();
  } catch (err) {
    console.warn('[Database Warning] Failed to initialize MySQL. Falling back to SQLite.');
    activeDriver = 'sqlite';
    initSqlite();
  }
} else {
  initSqlite();
}

// Unified query wrapper
const query = async (sql, params = []) => {
  if (activeDriver === 'mysql') {
    return mysqlPool.query(sql, params);
  } else {
    // SQLite driver: Translate MySQL specific SQL keywords on the fly
    let sqliteSql = sql;

    // 1. Remove database engine options like ENGINE=InnoDB...
    sqliteSql = sqliteSql.replace(/ENGINE\s*=\s*\w+/gi, '');
    sqliteSql = sqliteSql.replace(/DEFAULT\s*CHARSET\s*=\s*\w+/gi, '');
    sqliteSql = sqliteSql.replace(/COLLATE\s*=\s*\w+/gi, '');

    // 2. Translate INT AUTO_INCREMENT PRIMARY KEY to SQLite INTEGER PRIMARY KEY AUTOINCREMENT
    sqliteSql = sqliteSql.replace(/(\w+)\s+INT\s+AUTO_INCREMENT\s+PRIMARY\s+KEY/gi, '$1 INTEGER PRIMARY KEY AUTOINCREMENT');
    sqliteSql = sqliteSql.replace(/(\w+)\s+INT\s+PRIMARY\s+KEY\s+AUTO_INCREMENT/gi, '$1 INTEGER PRIMARY KEY AUTOINCREMENT');
    sqliteSql = sqliteSql.replace(/(\w+)\s+INTEGER\s+AUTO_INCREMENT\s+PRIMARY\s+KEY/gi, '$1 INTEGER PRIMARY KEY AUTOINCREMENT');
    sqliteSql = sqliteSql.replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT');

    // 3. Translate ENUM(...) to TEXT
    sqliteSql = sqliteSql.replace(/ENUM\s*\([^)]+\)/gi, 'TEXT');

    // 4. Translate UNIQUE KEY name (col1, col2) to UNIQUE (col1, col2)
    sqliteSql = sqliteSql.replace(/UNIQUE KEY\s+\w+\s+\(([^)]+)\)/gi, 'UNIQUE ($1)');
    
    // 5. Translate ON DUPLICATE KEY UPDATE to SQLite ON CONFLICT
    if (sqliteSql.toUpperCase().includes('ON DUPLICATE KEY UPDATE')) {
      // Keep placeholders matching the original mysql params list by converting to SET rating = ?
      sqliteSql = sqliteSql.replace(
        /ON DUPLICATE KEY UPDATE\s+rating\s*=\s*\?/gi,
        'ON CONFLICT(user_id, store_id) DO UPDATE SET rating = ?'
      );
    }

    // 6. Remove ON UPDATE CURRENT_TIMESTAMP from TIMESTAMP fields
    sqliteSql = sqliteSql.replace(/ON UPDATE CURRENT_TIMESTAMP/gi, '');

    return new Promise((resolve, reject) => {
      const trimmedSql = sqliteSql.trim().toLowerCase();
      const isSelect = trimmedSql.startsWith('select');

      if (isSelect) {
        sqliteDb.all(sqliteSql, params, (err, rows) => {
          if (err) {
            console.error(`[SQLite Error] on query: ${sqliteSql}`, err);
            reject(err);
          } else {
            resolve([rows]);
          }
        });
      } else {
        sqliteDb.run(sqliteSql, params, function (err) {
          if (err) {
            console.error(`[SQLite Error] on statement: ${sqliteSql}`, err);
            reject(err);
          } else {
            // Mock MySQL result object structure
            resolve([{
              insertId: this.lastID,
              affectedRows: this.changes
            }]);
          }
        });
      }
    });
  }
};

module.exports = {
  query,
  getDriver: () => activeDriver,
  // Helper to check if MySQL is running
  isMysql: () => activeDriver === 'mysql'
};

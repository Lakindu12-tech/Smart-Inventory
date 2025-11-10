require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkOwner() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  const [rows] = await conn.execute('SELECT id, email, role, is_active FROM users WHERE role = "owner" LIMIT 1');
  console.log('Owner user:', rows[0]);
  
  await conn.end();
}

checkOwner();

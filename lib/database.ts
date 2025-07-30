import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_inventory',
  port: parseInt(process.env.DB_PORT || '3306'),
};

export async function getConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    return connection;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

export async function query(sql: string, params?: any[]) {
  const connection = await getConnection();
  try {
    const [results] = await connection.execute(sql, params);
    return results;
  } finally {
    await connection.end();
  }
} 
// lib/db.js

import mysql from 'mysql2/promise';
import { dbConfig } from './config.js';

const pool = mysql.createPool(dbConfig);

export async function query(sql, values = []) {
  const [rows] = await pool.execute(sql, values);
  return rows;
}

export default pool;

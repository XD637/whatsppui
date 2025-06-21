// lib/db.js

import mysql from 'mysql2/promise';
import { dbConfig } from './config.js';

const pool = mysql.createPool(dbConfig);

export async function query(sql, values = []) {
  try {
    const [rows] = await pool.execute(sql, values);
    return rows;
  } catch (err) {
    console.error("DB Query Error:", err.message);
    // console.error("SQL:", sql);
    // console.error("Values:", values);
    throw err; // Let the API handler catch and deal with it
  }
}

export default pool;

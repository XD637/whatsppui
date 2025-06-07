// lib/config.js

export const dbConfig = {
  host: process.env.DB_HOST || '192.168.0.158',
  user: process.env.DB_USER || 'ssipl_serveradmin',
  password: process.env.DB_PASSWORD || 'Sporada@2014',
  database: process.env.DB_NAME || 'whatsappserver',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

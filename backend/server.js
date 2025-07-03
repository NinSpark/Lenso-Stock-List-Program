require('dotenv').config();
const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for Angular frontend
app.use(cors());
app.use(express.json());

// Database Configuration
const kaiShenConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT, 10),
  options: {
    encrypt: false, // Disable encryption
    trustServerCertificate: true, // Trust the self-signed SSL certificate
    enableArithAbort: true,
  }
};

const lensoConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_LENSO,
  port: parseInt(process.env.DB_PORT, 10),
  options: {
    encrypt: false, // Disable encryption
    trustServerCertificate: true, // Trust the self-signed SSL certificate
    enableArithAbort: true,
  }
};

const loginPool = new Pool({
  host: "192.168.0.56",
  port: 5432,
  user: "postgres",
  password: "postgres",
  database: "postgres",
});

// Create connection pools for both databases
const kaiShenPool = new sql.ConnectionPool(kaiShenConfig).connect();
const lensoPool = new sql.ConnectionPool(lensoConfig).connect();

// Function to get the correct pool
async function getDBPool(dbType) {
  return dbType === 'lenso' ? lensoPool : kaiShenPool;
}

// Test Database Connection
async function testDBConnection() {
  try {
    await sql.connect(kaiShenConfig);
    console.log("✅ Kai Shen Database connected successfully!");
  } catch (err) {
    console.error("❌ Kai Shen Database connection failed:", err.message);
  }
}
// Test Database Connection
async function testDBConnection2() {
  try {
    await sql.connect(lensoConfig);
    console.log("✅ Lenso Database connected successfully!");
  } catch (err) {
    console.error("❌ Lenso Database connection failed:", err.message);
  }
}
// Test Database Connection
async function testDBConnection3() {
  loginPool.connect()
    .then(() => console.log('✅ Connected to PostgreSQL successfully!'))
    .catch(err => console.error('❌ Error connecting to PostgreSQL:', err));
}

// Start Server
app.listen(port, async () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  await testDBConnection();
  await testDBConnection2();
  await testDBConnection3();
});
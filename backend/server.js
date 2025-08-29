require('dotenv').config();
const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for Angular frontend
app.use(cors());
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'images')));

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

// Fetch item list
app.get('/api/item', async (req, res) => {
  try {
    const dbType = req.query.db; // 'kai_shen' or 'lenso'
    const pool = await getDBPool(dbType);
    const request = pool.request();
    const query = `SELECT * FROM dbo.Item WHERE ItemCode LIKE 'WA%'`;

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching stock:', err);
    res.status(500).send('Server error');
  }
});

// Fetch item price list
app.get('/api/item-price', async (req, res) => {
  try {
    const dbType = req.query.db; // 'kai_shen' or 'lenso'
    const pool = await getDBPool(dbType);
    const request = pool.request();
    const query = `SELECT * FROM dbo.ItemUOM`;

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching Item price list:', err);
    res.status(500).send('Server error');
  }
});

// Fetch stock list
app.get('/api/stock', async (req, res) => {
  try {
    const dbType = req.query.db; // 'kai_shen' or 'lenso'
    const pool = await getDBPool(dbType);
    const request = pool.request();
    const query = `SELECT * FROM dbo.StockDTL`;

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching stock:', err);
    res.status(500).send('Server error');
  }
});

// Fetch filtered item list
app.get('/api/filtered-item', async (req, res) => {
  try {
    const dbType = req.query.db; // 'kai_shen' or 'lenso'
    const pool = await getDBPool(dbType);

    // Extract and parse filters
    const { type, size, pcd } = req.query;
    const sizeList = size ? JSON.parse(size) : [];
    const pcdList = pcd ? JSON.parse(pcd) : [];

    let baseQuery = `SELECT * FROM dbo.Item WHERE ItemCode LIKE 'WA%'`;
    let conditions = [];
    let parameters = {};

    if (type && type !== 'all-type') {
      conditions.push(`ItemClass = @type`);
      parameters.type = type;
    }

    if (sizeList.length > 0) {
      conditions.push(`(${sizeList.map((_, i) => `LEFT(ItemBrand, CHARINDEX('X', ItemBrand) - 1) = @size${i}`).join(' OR ')})`);
      sizeList.forEach((val, i) => {
        parameters[`size${i}`] = val;
      });
    }

    if (pcdList.length > 0) {
      conditions.push(`(${pcdList.map((_, i) => `ItemCategory = @pcd${i}`).join(' OR ')})`);
      pcdList.forEach((val, i) => {
        parameters[`pcd${i}`] = val;
      });
    }

    if (conditions.length > 0) {
      baseQuery += ' AND ' + conditions.join(' AND ');
    }

    const request = pool.request();
    for (const [key, value] of Object.entries(parameters)) {
      request.input(key, value);
    }

    const result = await request.query(baseQuery);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching filtered items:', err);
    res.status(500).send('Server error');
  }
});

// Start Server
app.listen(port, async () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  await testDBConnection();
  await testDBConnection2();
  await testDBConnection3();
});
// server.js
import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import dotenv from "dotenv";
import fetchMgnregaData from "./fetchData.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create MySQL pool
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
try {
  const conn = await pool.getConnection();
  console.log("✅ Connected to MySQL (Railway)");
  conn.release();
} catch (err) {
  console.error("❌ MySQL Connection Failed:", err.message);
}

// Root route
app.get("/", (req, res) => {
  res.send("✅ MGNREGA API Server Running");
});

// Fetch & save latest data
app.get("/api/mgnrega/fetch", async (req, res) => {
  try {
    const records = await fetchMgnregaData();
    if (records.length === 0) return res.json({ message: "No data found" });

    const insertQuery = `
      INSERT INTO mgnrega_data 
      (fin_year, month, state_code, state_name, district_code, district_name, 
       Approved_Labour_Budget, Average_Wage_rate_per_day_per_person, 
       Total_Households_Worked, Total_Individuals_Worked)
      VALUES ?
      ON DUPLICATE KEY UPDATE
        Approved_Labour_Budget = VALUES(Approved_Labour_Budget),
        Average_Wage_rate_per_day_per_person = VALUES(Average_Wage_rate_per_day_per_person),
        Total_Households_Worked = VALUES(Total_Households_Worked),
        Total_Individuals_Worked = VALUES(Total_Individuals_Worked)
    `;

    const values = records.map(r => [
      r.fin_year,
      r.month,
      r.state_code,
      r.state_name,
      r.district_code,
      r.district_name,
      r.Approved_Labour_Budget || 0,
      r.Average_Wage_rate_per_day_per_person || 0,
      r.Total_Households_Worked || 0,
      r.Total_Individuals_Worked || 0,
    ]);

    const [result] = await pool.query(insertQuery, [values]);
    res.json({ message: `${result.affectedRows} rows inserted/updated.` });
  } catch (err) {
    console.error("Insert Error:", err);
    res.status(500).json({ error: "Database insert failed" });
  }
});

// Get data with optional filters
app.get("/api/mgnrega", async (req, res) => {
  try {
    const { state_name, fin_year, district_name } = req.query;
    let sql = "SELECT * FROM mgnrega_data WHERE 1=1";
    const params = [];

    if (state_name) {
      sql += " AND state_name LIKE ?";
      params.push(`%${state_name}%`);
    }
    if (fin_year) {
      sql += " AND fin_year = ?";
      params.push(fin_year);
    }
    if (district_name) {
      sql += " AND district_name = ?";
      params.push(district_name);
    }

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("Query Error:", err);
    res.status(500).json({ error: "Database query failed" });
  }
});

// Get distinct district names
app.get("/api/mgnrega/districts", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT DISTINCT district_name FROM mgnrega_data ORDER BY district_name ASC"
    );
    res.json(rows);
  } catch (err) {
    console.error("District fetch error:", err);
    res.status(500).json({ error: "Error fetching districts" });
  }
});

// Start server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

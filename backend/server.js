// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetchMgnregaData from "./fetchData.js";
import pkg from "pg";

const { Pool } = pkg;
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: { rejectUnauthorized: false },
});

// Test connection
try {
  const client = await pool.connect();
  console.log("✅ Connected to PostgreSQL (NeonDB)");
  client.release();
} catch (err) {
  console.error("❌ PostgreSQL Connection Failed:", err.message);
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
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (district_code, month, fin_year) DO UPDATE
      SET 
        Approved_Labour_Budget = EXCLUDED.Approved_Labour_Budget,
        Average_Wage_rate_per_day_per_person = EXCLUDED.Average_Wage_rate_per_day_per_person,
        Total_Households_Worked = EXCLUDED.Total_Households_Worked,
        Total_Individuals_Worked = EXCLUDED.Total_Individuals_Worked;
    `;

    // Insert each record one by one (PostgreSQL parameterized)
    for (let r of records) {
      const values = [
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
      ];
      await pool.query(insertQuery, values);
    }

    res.json({ message: `${records.length} rows inserted/updated.` });
  } catch (err) {
    console.error("Insert Error:", err.message);
    res.status(500).json({ error: "Database insert failed" });
  }
});

// Get data with optional filters
app.get("/api/mgnrega", async (req, res) => {
  try {
    const { state_name, fin_year, district_name } = req.query;
    let sql = "SELECT * FROM mgnrega_data WHERE 1=1";
    const params = [];
    let count = 1;

    if (state_name) {
      sql += ` AND state_name ILIKE $${count++}`;
      params.push(`%${state_name}%`);
    }
    if (fin_year) {
      sql += ` AND fin_year = $${count++}`;
      params.push(fin_year);
    }
    if (district_name) {
      sql += ` AND district_name ILIKE $${count++}`;
      params.push(`%${district_name}%`);
    }

    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("Query Error:", err.message);
    res.status(500).json({ error: "Database query failed" });
  }
});

// Get distinct district names
app.get("/api/mgnrega/districts", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT DISTINCT district_name FROM mgnrega_data ORDER BY district_name ASC"
    );
    res.json(rows);
  } catch (err) {
    console.error("District fetch error:", err.message);
    res.status(500).json({ error: "Error fetching districts" });
  }
});

// Start server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

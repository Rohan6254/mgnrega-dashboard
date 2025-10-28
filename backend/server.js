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

// Create PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: {
    rejectUnauthorized: false, // required for NeonDB
  },
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
       approved_labour_budget, average_wage_rate_per_day_per_person,
       total_households_worked, total_individuals_worked)
      VALUES 
      ${records.map((_, i) => `($${i * 10 + 1}, $${i * 10 + 2}, $${i * 10 + 3}, $${i * 10 + 4}, $${i * 10 + 5}, $${i * 10 + 6}, $${i * 10 + 7}, $${i * 10 + 8}, $${i * 10 + 9}, $${i * 10 + 10})`).join(", ")}
      ON CONFLICT (fin_year, month, state_code, district_code) DO UPDATE SET
        approved_labour_budget = EXCLUDED.approved_labour_budget,
        average_wage_rate_per_day_per_person = EXCLUDED.average_wage_rate_per_day_per_person,
        total_households_worked = EXCLUDED.total_households_worked,
        total_individuals_worked = EXCLUDED.total_individuals_worked
    `;

    const values = records.flatMap(r => [
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

    const result = await pool.query(insertQuery, values);
    res.json({ message: `${records.length} rows inserted/updated.` });
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
    console.error("Query Error:", err);
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
    console.error("District fetch error:", err);
    res.status(500).json({ error: "Error fetching districts" });
  }
});

// Start server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

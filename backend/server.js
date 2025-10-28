// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetchMgnregaData from "./fetchData.js";
import pkg from "pg";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const { Pool } = pkg;
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------- PostgreSQL Setup -------------------- //
const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: { rejectUnauthorized: false }, // required for NeonDB
});

// Test connection
(async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Connected to PostgreSQL (NeonDB)");
    client.release();
  } catch (err) {
    console.error("❌ PostgreSQL Connection Failed:", err.message);
  }
})();

// -------------------- API ROUTES -------------------- //

// Fetch & save latest data from MGNREGA API
app.get("/api/mgnrega/fetch", async (req, res) => {
  try {
    const records = await fetchMgnregaData();
    if (!records || records.length === 0)
      return res.json({ message: "No data found" });

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

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
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
        await client.query(insertQuery, values);
      }
      await client.query("COMMIT");
      res.json({ message: `${records.length} rows inserted/updated.` });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Insert Error:", err.message);
    res.status(500).json({ error: "Database insert failed" });
  }
});

// Fetch MGNREGA data with optional filters
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

// Get distinct districts
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

// -------------------- SERVE REACT FRONTEND -------------------- //
const buildPath = path.join(__dirname, "client/build");

if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });
} else {
  console.warn(
    "⚠️ React build folder not found. Frontend will not be served. Run `npm run build` in client folder."
  );
}

// -------------------- START SERVER -------------------- //
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

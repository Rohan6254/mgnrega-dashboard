import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
// fetchData.js
import fetch from "node-fetch"; // make sure node-fetch is installed

const API_KEY = process.env.MGNREGA_API_KEY; // put your API key in .env
const BASE_URL = "https://api.data.gov.in/resource/ee03643a-ee4c-48c2-ac30-9f2ff26ab722?api-key=579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b&format=json";

async function fetchMgnregaData() {
  try {
    const url = `${BASE_URL}?api-key=${API_KEY}&format=json&offset=0&limit=1000`; 
    // Adjust limit/offset as needed

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);

    const data = await response.json();

    if (!data || !data.records || data.records.length === 0) {
      console.warn("⚠️ No records found from MGNREGA API");
      return [];
    }

    // Map data to your DB fields
    const formattedData = data.records.map((r) => ({
      fin_year: r.fin_year || null,
      month: r.month || null,
      state_code: r.state_code || null,
      state_name: r.state_name || null,
      district_code: r.district_code || null,
      district_name: r.district_name || null,
      Approved_Labour_Budget: Number(r.Approved_Labour_Budget) || 0,
      Average_Wage_rate_per_day_per_person: Number(r.Average_Wage_rate_per_day_per_person) || 0,
      Total_Households_Worked: Number(r.Total_Households_Worked) || 0,
      Total_Individuals_Worked: Number(r.Total_Individuals_Worked) || 0,
    }));

    return formattedData;
  } catch (err) {
    console.error("❌ fetchData.js Error:", err.message);
    return [];
  }
}

export default fetchMgnregaData;

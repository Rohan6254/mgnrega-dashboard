import axios from "axios";
import dotenv from "dotenv";

dotenv.config(); 

export default async function fetchMgnregaData() {
  try {
    const url = "https://api.data.gov.in/resource/ee03643a-ee4c-48c2-ac30-9f2ff26ab722?format=json&api-key=YOUR_API_KEY";
    const response = await axios.get(url);

    if (!response.data || !response.data.records) return [];

    const records = response.data.records;
    return records.map((item) => ({
      fin_year: item.fin_year || "",
      month: item.month || "",
      state_code: item.state_code || "",
      state_name: item.state_name || "",
      district_code: item.district_code || "",
      district_name: item.district_name || "",
      Approved_Labour_Budget: Number(item.Approved_Labour_Budget) || 0,
      Average_Wage_rate_per_day_per_person: parseFloat(item.Average_Wage_rate_per_day_per_person) || 0,
      Total_Households_Worked: Number(item.Total_Households_Worked) || 0,
      Total_Individuals_Worked: Number(item.Total_Individuals_Worked) || 0,
    }));
  } catch (err) {
    console.error("Error fetching MGNREGA data:", err);
    return [];
  }
}

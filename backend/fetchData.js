import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export default async function fetchMgnregaData() {
  try {
    const url = `${process.env.MGNREGA_API_URL}&api-key=${process.env.MGNREGA_API_KEY}`;
    const response = await axios.get(url);

    if (!response.data || !response.data.records) return [];

    return response.data.records.map(item => ({
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
    console.error("Error fetching MGNREGA data:", err.response?.data || err.message);
    return [];
  }
}

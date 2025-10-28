// src/fetchData.js
export async function fetchMgnregaData() {
  try {
    const API_BASE = process.env.REACT_APP_API_BASE;
    const response = await fetch(`${API_BASE}/api/mgnrega`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data from backend:", error);
    return [];
  }
}

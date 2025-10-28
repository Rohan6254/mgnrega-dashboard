import React, { useState, useEffect } from "react";
import "./App.css";
import Dashboard from "./components/Dashboard";

function App() {
  const [data, setData] = useState([]);
  const [stateName, setStateName] = useState("");
  const [finYear, setFinYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchMessage, setFetchMessage] = useState("");

  const API_BASE = process.env.REACT_APP_API_BASE; // Use Render backend URL

  // ✅ Fetch table data
  const fetchData = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/api/mgnrega`;
      const params = [];
      if (stateName) params.push(`state_name=${stateName}`);
      if (finYear) params.push(`fin_year=${finYear}`);
      if (params.length) url += "?" + params.join("&");

      const res = await fetch(url);
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch latest data from backend API
  const fetchLatestData = async () => {
    setFetching(true);
    setFetchMessage("🔄 Fetching latest data...");
    try {
      const res = await fetch(`${API_BASE}/api/mgnrega/fetch`);
      const result = await res.json();
      setFetchMessage(result.message || "✅ Data fetched successfully!");
      await fetchData();
    } catch (err) {
      console.error(err);
      setFetchMessage("❌ Error fetching latest data");
    } finally {
      setFetching(false);
      setTimeout(() => setFetchMessage(""), 4000);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🌾 MGNREGA Data Dashboard</h1>
        <p>Empowering Citizens Through Open Data Transparency</p>
      </header>

      <div className="filter-section">
        <div className="filter-group">
          <input
            type="text"
            placeholder="State Name"
            value={stateName}
            onChange={(e) => setStateName(e.target.value)}
            className="filter-input"
          />
          <input
            type="text"
            placeholder="Financial Year"
            value={finYear}
            onChange={(e) => setFinYear(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="button-group">
          <button className="filter-btn" onClick={fetchData}>
            🔍 Filter
          </button>
          <button
            className={`fetch-btn ${fetching ? "loading" : ""}`}
            onClick={fetchLatestData}
            disabled={fetching}
          >
            {fetching ? "Fetching..." : "⚡ Fetch Latest Data"}
          </button>
        </div>

        {fetchMessage && <p className="fetch-message">{fetchMessage}</p>}
      </div>

      <main className="dashboard-section">
        {loading ? (
          <p className="loading-text">Loading data...</p>
        ) : (
          <Dashboard data={data} />
        )}
      </main>

      <footer className="footer">
        <p>© 2025 MGNREGA Data Portal | Built for Citizen Empowerment 💡</p>
      </footer>
    </div>
  );
}

export default App;

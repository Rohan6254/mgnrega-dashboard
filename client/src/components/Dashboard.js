import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./Dashboard.css";

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [stateFilter, setStateFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [fetchMessage, setFetchMessage] = useState("");

  const API_BASE = process.env.REACT_APP_API_BASE;

  // Fetch all districts
  const fetchDistricts = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/mgnrega/districts`);
      setDistricts(res.data);
    } catch (err) {
      console.error("Error fetching districts:", err);
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchDistricts();
  }, [fetchDistricts]);

  // Fetch filtered data
  const fetchData = useCallback(async () => {
    try {
      const params = {};
      if (stateFilter) params.state_name = stateFilter;
      if (yearFilter) params.fin_year = yearFilter;
      if (selectedDistrict) params.district_name = selectedDistrict;

      const res = await axios.get(`${API_BASE}/api/mgnrega`, { params });
      // Convert numeric fields from strings to numbers
      const converted = res.data.map((row) => ({
        ...row,
        approved_labour_budget: Number(row.approved_labour_budget) || 0,
        average_wage_rate_per_day_per_person: Number(
          row.average_wage_rate_per_day_per_person
        ) || 0,
        total_households_worked: Number(row.total_households_worked) || 0,
        total_individuals_worked: Number(row.total_individuals_worked) || 0,
      }));
      setData(converted);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  }, [API_BASE, stateFilter, yearFilter, selectedDistrict]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch latest data from backend
  const fetchLatestData = async () => {
    setIsFetching(true);
    setFetchMessage("Fetching latest data...");
    try {
      const res = await axios.get(`${API_BASE}/api/mgnrega/fetch`);
      setFetchMessage(res.data.message || "Latest data fetched successfully!");
      await fetchData();
    } catch (err) {
      console.error("Error fetching latest data:", err);
      setFetchMessage("❌ Error fetching latest data");
    } finally {
      setIsFetching(false);
      setTimeout(() => setFetchMessage(""), 3000);
    }
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">🌾 MGNREGA Performance Dashboard</h1>

      {/* Filters */}
      <div className="filters">
        <div className="filter-item">
          <label>State</label>
          <input
            type="text"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            placeholder="e.g., Maharashtra"
          />
        </div>

        <div className="filter-item">
          <label>Financial Year</label>
          <input
            type="text"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            placeholder="e.g., 2024-2025"
          />
        </div>

        <div className="filter-item">
          <label>District</label>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
          >
            <option value="">All Districts</option>
            {districts.map((d, idx) => (
              <option key={idx} value={d.district_name}>
                {d.district_name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={fetchLatestData}
          disabled={isFetching}
          className="fetch-button"
        >
          {isFetching ? "Fetching..." : "🔄 Fetch Latest Data"}
        </button>
      </div>

      {fetchMessage && <p className="fetch-message">{fetchMessage}</p>}

      {/* Summary Cards */}
      {data.length > 0 && (
        <div className="summary-cards">
          <div className="card">
            <h3>Total Labour Budget</h3>
            <p>
              ₹
              {data
                .reduce((sum, row) => sum + row.approved_labour_budget, 0)
                .toLocaleString()}
            </p>
          </div>
          <div className="card">
            <h3>Average Wage</h3>
            <p>
              ₹
              {(
                data.reduce(
                  (sum, row) => sum + row.average_wage_rate_per_day_per_person,
                  0
                ) / data.length
              ).toFixed(2)}
            </p>
          </div>
          <div className="card">
            <h3>Total Households Worked</h3>
            <p>
              {data
                .reduce((sum, row) => sum + row.total_households_worked, 0)
                .toLocaleString()}
            </p>
          </div>
          <div className="card">
            <h3>Total Individuals Worked</h3>
            <p>
              {data
                .reduce((sum, row) => sum + row.total_individuals_worked, 0)
                .toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fin Year</th>
              <th>Month</th>
              <th>State</th>
              <th>District</th>
              <th>Approved Labour Budget</th>
              <th>Average Wage</th>
              <th>Total Households</th>
              <th>Total Individuals</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center" }}>
                  No data available
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={index}>
                  <td>{row.fin_year}</td>
                  <td>{row.month}</td>
                  <td>{row.state_name}</td>
                  <td>{row.district_name}</td>
                  <td>{row.approved_labour_budget.toLocaleString()}</td>
                  <td>{row.average_wage_rate_per_day_per_person.toFixed(2)}</td>
                  <td>{row.total_households_worked.toLocaleString()}</td>
                  <td>{row.total_individuals_worked.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;

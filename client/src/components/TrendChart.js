// TrendChart.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register chart components
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend);

const TrendChart = ({ district }) => {
  const [data, setData] = useState([]);
  const [chartData, setChartData] = useState({});

  useEffect(() => {
    if (district) {
      axios
        .get(`/api/performance/${district}/2025-01`)
        .then((res) => {
          setData(res.data);
        })
        .catch((err) => console.error("Error fetching data:", err));
    }
  }, [district]);

  useEffect(() => {
    if (data && data.length > 0) {
      // Example: Assuming each data object has { month, performanceValue }
      const labels = data.map((item) => item.month);
      const values = data.map((item) => item.performanceValue);

      setChartData({
        labels,
        datasets: [
          {
            label: `Performance Trend (${district})`,
            data: values,
            borderColor: "rgba(75, 192, 192, 1)",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderWidth: 2,
            pointRadius: 4,
            tension: 0.4, // smooth line
          },
        ],
      });
    }
  }, [data, district]);

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: `District Performance Trend (${district})`,
        font: { size: 18 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Performance Value" },
      },
      x: {
        title: { display: true, text: "Month" },
      },
    },
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow p-4">
      {chartData.labels ? (
        <Line data={chartData} options={options} />
      ) : (
        <p className="text-gray-500 text-center">Loading chart...</p>
      )}
    </div>
  );
};

export default TrendChart;

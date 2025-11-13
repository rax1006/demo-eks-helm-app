import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

function App() {
  const [status, setStatus] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStatus();
    fetchData();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/status`);
      setStatus(response.data);
    } catch (err) {
      console.error('Error fetching status:', err);
      setError('Failed to connect to backend');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/data`);
      setData(response.data.items);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 EKS Platform Application</h1>
        <p>Frontend + Backend on Kubernetes</p>
      </header>

      <main className="App-main">
        {/* Backend Status */}
        <section className="status-section">
          <h2>Backend Status</h2>
          {status ? (
            <div className="status-card">
              <p><strong>Service:</strong> {status.service}</p>
              <p><strong>Version:</strong> {status.version}</p>
              <p><strong>Environment:</strong> {status.environment}</p>
              <p><strong>Timestamp:</strong> {new Date(status.timestamp).toLocaleString()}</p>
              <span className="status-badge success">✓ Connected</span>
            </div>
          ) : error ? (
            <div className="status-card error">
              <span className="status-badge error">✗ {error}</span>
            </div>
          ) : (
            <div className="status-card">
              <span className="status-badge">Loading...</span>
            </div>
          )}
        </section>

        {/* Data Display */}
        <section className="data-section">
          <h2>Data from Backend API</h2>
          {loading ? (
            <p>Loading data...</p>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : (
            <div className="data-grid">
              {data.map(item => (
                <div key={item.id} className="data-card">
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <span className="item-id">ID: {item.id}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={fetchData} className="refresh-btn">
            🔄 Refresh Data
          </button>
        </section>

        {/* Architecture Info */}
        <section className="info-section">
          <h2>Architecture</h2>
          <div className="architecture">
            <div className="arch-component">
              <h3>Frontend</h3>
              <p>React + Vite</p>
              <p>Deployed on EKS</p>
            </div>
            <div className="arch-arrow">→</div>
            <div className="arch-component">
              <h3>Backend API</h3>
              <p>Node.js + Express</p>
              <p>Deployed on EKS</p>
            </div>
            <div className="arch-arrow">→</div>
            <div className="arch-component">
              <h3>Infrastructure</h3>
              <p>AWS EKS</p>
              <p>Terraform + Helm</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="App-footer">
        <p>Deployed via GitHub Actions → ECR → EKS (Helm)</p>
      </footer>
    </div>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import { getRevenueReport } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FaChartLine, FaDollarSign } from 'react-icons/fa';
import './Reports.css';

function Reports() {
  const [report, setReport] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const response = await getRevenueReport();
      setReport(response.data.report);
      setGrandTotal(response.data.grand_total);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

  if (loading) {
    return (
      <div className="reports-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-container">
      <div className="page-header">
        <div>
          <h1>Revenue Reports</h1>
          <p>Analyze your equipment rental revenue</p>
        </div>
      </div>

      <div className="total-card">
        <div className="total-icon">
          <FaDollarSign />
        </div>
        <div>
          <div className="total-label">Total Revenue</div>
          <div className="total-value">₹{grandTotal.toFixed(2)}</div>
        </div>
      </div>

      {report.length > 0 ? (
        <>
          <div className="chart-container">
            <h2>Revenue by Equipment</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={report}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="name" 
                  stroke="rgba(255,255,255,0.6)"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis stroke="rgba(255,255,255,0.6)" />
                <Tooltip 
                  contentStyle={{
                    background: 'rgba(30, 41, 59, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: 'white'
                  }}
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                />
                <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                  {report.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="revenue-table">
            <h2>Detailed Breakdown</h2>
            <table>
              <thead>
                <tr>
                  <th>Equipment</th>
                  <th>Total Rentals</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {report.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>{item.rental_count}</td>
                    <td className="revenue-cell">₹{item.revenue}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="2"><strong>Total</strong></td>
                  <td className="revenue-cell"><strong>₹{grandTotal.toFixed(2)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <FaChartLine />
          <p>No revenue data available yet</p>
        </div>
      )}
    </div>
  );
}

export default Reports;
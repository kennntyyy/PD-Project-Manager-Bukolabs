import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './OverviewPanel.css';

// ============================================
// OVERVIEW PANEL
// Displays: Welcome, stats, financial highlights, and overall progress
// ============================================

const OverviewPanel = ({ users }) => {
  const [chartData] = useState([
    { month: 'Jan', 'Year Close Year Great Gain': 4, accomplished: 2 },
    { month: 'Feb', 'Year Close Year Great Gain': 5, accomplished: 3 },
    { month: 'Mar', 'Year Close Year Great Gain': 3, accomplished: 2 },
    { month: 'Apr', 'Year Close Year Great Gain': 6, accomplished: 4 },
    { month: 'May', 'Year Close Year Great Gain': 5, accomplished: 5 },
    { month: 'Jun', 'Year Close Year Great Gain': 7, accomplished: 6 },
  ]);

  const stats = [
    {
      value: 16,
      label: 'Total Projects',
      icon: 'pi-folder',
      bgColor: '#DBEAFE',
    },
    {
      value: 2,
      label: 'Ongoing',
      icon: 'pi-arrow-up-right',
      bgColor: '#FEF3C7',
    },
    { value: 1, label: 'Done', icon: 'pi-check-circle', bgColor: '#F3F4F6' },
    {
      value: 3,
      label: 'Hold',
      icon: 'pi-pause-circle',
      bgColor: '#FEE2E2',
    },
  ];

  const financialHighlights = [
    {
      amount: '₱ 5,550,000',
      label: 'Total Project Value',
      status: '',
      statusColor: '#F59E0B',
    },
    {
      amount: '₱ 1,500,000',
      label: '',
      status: 'Pending',
      statusColor: '#F59E0B',
    },
    {
      amount: '₱ 2,050,000',
      label: '',
      status: 'Paid',
      statusColor: '#10B981',
    },
    {
      amount: '₱ 2,050,000',
      label: '',
      status: 'Unpaid',
      statusColor: '#EF4444',
    },
  ];

  const accomplishments = [
    { title: 'New accomplishment uploaded', detail: 'for Kitchen Project' },
    { title: 'New accomplishment uploaded', detail: 'for Kitchen Project' },
  ];

  const handlePDFDownload = () => {
    console.log('Downloading PDF report...');
  };

  return (
    <div className="overview-container">
      {/* Welcome Heading */}
      <div className="welcome-header">
        <h1>WELCOME, ADMIN!</h1>
      </div>

      {/* Stats Grid */}
      <div className="stats-row">
        {stats.map((stat, index) => (
          <div key={index} className="stat-box">
            <div
              className="stat-icon-wrapper"
              style={{ backgroundColor: stat.bgColor }}
            >
              <i className={`pi ${stat.icon}`}></i>
            </div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Financial Section */}
      <div className="financial-row">
        {financialHighlights.map((item, index) => (
          <div key={index} className="financial-box">
            <div className="financial-amount">{item.amount}</div>
            {item.label && <div className="financial-label">{item.label}</div>}
            {item.status && (
              <span
                className="status-badge"
                style={{ borderColor: item.statusColor }}
              >
                {item.status}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Chart and Highlights Row */}
      <div className="bottom-container">
        {/* Overall Progress Section */}
        <div className="chart-section">
          <div className="progress-header">
            <div className="section-title">OVERALL PROGRESS</div>
            <div className="progress-percentage">35%</div>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: '35%' }}></div>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#F3F4F6',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Year Close Year Great Gain"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: '#10B981', r: 5 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="accomplished"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={{ fill: '#F59E0B', r: 5 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Highlights Section */}
        <div className="highlights-section">
          <div className="highlights-header">
            <div className="section-title">FINANCIAL HIGHLIGHTS</div>
            <button className="pdf-download-btn" onClick={handlePDFDownload}>
              <i className="pi pi-file-pdf"></i>
              <span>PDF Download</span>
            </button>
          </div>
          <div className="highlights-list">
            {accomplishments.map((item, index) => (
              <div key={index} className="highlight-item">
                <div className="highlight-icon">
                  <i className="pi pi-check-circle"></i>
                </div>
                <div className="highlight-content">
                  <p className="highlight-title">{item.title}</p>
                  <p className="highlight-detail">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewPanel;

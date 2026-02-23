import React, { useEffect, useMemo, useState } from 'react';
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
import api from '../../../services/api';

// ============================================
// OVERVIEW PANEL
// Displays: Welcome, stats, financial highlights, and overall progress
// ============================================

const OverviewPanel = ({ users, onStatClick }) => {
  const [chartData] = useState([
    { month: 'Jan', 'Year Close Year Great Gain': 4, accomplished: 2 },
    { month: 'Feb', 'Year Close Year Great Gain': 5, accomplished: 3 },
    { month: 'Mar', 'Year Close Year Great Gain': 3, accomplished: 2 },
    { month: 'Apr', 'Year Close Year Great Gain': 6, accomplished: 4 },
    { month: 'May', 'Year Close Year Great Gain': 5, accomplished: 5 },
    { month: 'Jun', 'Year Close Year Great Gain': 7, accomplished: 6 },
  ]);

  const [projects, setProjects] = useState([]);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/projects');
        setProjects(response.data || []);
      } catch (error) {
        console.error('Error fetching projects for overview:', error);
      }
    };

    const fetchReports = async () => {
      try {
        const response = await api.get('/reports');
        setReports(response.data || []);
      } catch (error) {
        console.error('Error fetching reports for overview:', error);
      }
    };

    fetchProjects();
    fetchReports();
  }, []);

  const projectStats = useMemo(() => {
    const totals = {
      total: 0,
      ongoing: 0,
      hold: 0,
      done: 0,
    };

    if (!projects.length) return totals;

    projects.forEach((project) => {
      if (project.isDeleted) return;
      if (project.parent_project_id) return;
      totals.total += 1;
      const status = (project.project_status || 'ongoing').toLowerCase();

      if (status === 'hold' || status === 'on_hold') {
        totals.hold += 1;
        return;
      }

      if (
        status === 'done' ||
        status === 'completed' ||
        status === 'cancelled'
      ) {
        totals.done += 1;
        return;
      }

      // Treat everything else as ongoing (includes planning/in_progress)
      totals.ongoing += 1;
    });

    return totals;
  }, [projects]);

  const stats = [
    {
      value: projectStats.total,
      label: 'Total Projects',
      icon: 'pi-folder',
      bgColor: '#DBEAFE',
      statusFilter: null,
    },
    {
      value: projectStats.ongoing,
      label: 'Ongoing',
      icon: 'pi-arrow-up-right',
      bgColor: '#FEF3C7',
      statusFilter: 'ongoing',
    },
    {
      value: projectStats.done,
      label: 'Done',
      icon: 'pi-check-circle',
      bgColor: '#F3F4F6',
      statusFilter: 'done',
    },
    {
      value: projectStats.hold,
      label: 'Hold',
      icon: 'pi-pause-circle',
      bgColor: '#FEE2E2',
      statusFilter: 'hold',
    },
  ];

  const handleStatClick = (stat) => {
    if (!onStatClick) return;
    onStatClick({ statusFilter: stat.statusFilter });
  };

  const formatCurrency = (value) =>
    `₱ ${Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const financialTotals = useMemo(() => {
    const totals = {
      totalValue: 0,
      totalPaid: 0,
      totalPending: 0,
    };

    if (!projects.length && !reports.length) return totals;

    projects.forEach((project) => {
      if (project.isDeleted) return;
      if (project.parent_project_id) return;
      totals.totalValue += Number(project.total_amount || 0);
    });

    reports.forEach((report) => {
      if (report.isDeleted) return;
      const amount = Number(report.payment_requested || 0);
      if (report.payment_triggered) {
        totals.totalPaid += amount;
      } else {
        totals.totalPending += amount;
      }
    });

    return totals;
  }, [projects, reports]);

  const totalUnpaid = Math.max(
    0,
    Number(financialTotals.totalValue) - Number(financialTotals.totalPaid),
  );

  const financialHighlights = [
    {
      amount: formatCurrency(financialTotals.totalValue),
      label: 'Total Project Value',
      status: '',
      statusColor: '#F59E0B',
    },
    {
      amount: formatCurrency(totalUnpaid),
      label: '',
      status: 'Pending',
      statusColor: '#F59E0B',
    },
    {
      amount: formatCurrency(financialTotals.totalPaid),
      label: '',
      status: 'Paid',
      statusColor: '#10B981',
    },
    {
      amount: formatCurrency(financialTotals.totalPending),
      label: '',
      status: 'Unpaid',
      statusColor: '#EF4444',
    },
  ];

  const recentDoneProjects = useMemo(() => {
    const doneStatuses = new Set(['done', 'completed', 'cancelled']);

    return projects
      .filter((project) => {
        if (project.isDeleted) return false;
        if (project.parent_project_id) return false;
        const status = String(project.project_status || '').toLowerCase();
        return doneStatuses.has(status);
      })
      .sort((a, b) => {
        const aDate = new Date(a.updated_at || a.created_at || 0).getTime();
        const bDate = new Date(b.updated_at || b.created_at || 0).getTime();
        return bDate - aDate;
      })
      .slice(0, 5)
      .map((project) => ({
        title: project.project_name,
        detail: 'Marked as Done',
      }));
  }, [projects]);

  return (
    <div className="overview-container">
      {/* Dashboard Overview Heading */}
      <div className="welcome-header">
        <h1>DASHBOARD OVERVIEW</h1>
        <p
          style={{
            margin: '0.5rem 0 0 0',
            fontSize: '0.95rem',
            color: '#6b7280',
          }}
        >
          System performance metrics and key insights
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-row">
        {stats.map((stat, index) => (
          <button
            key={index}
            type="button"
            className="stat-box stat-box-action"
            onClick={() => handleStatClick(stat)}
          >
            <div
              className="stat-icon-wrapper"
              style={{ backgroundColor: stat.bgColor }}
            >
              <i className={`pi ${stat.icon}`}></i>
            </div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </button>
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
            <div className="section-title">RECENT DONE PROJECTS</div>
          </div>
          <div className="highlights-list">
            {recentDoneProjects.length > 0 ? (
              recentDoneProjects.map((item, index) => (
                <div key={index} className="highlight-item">
                  <div className="highlight-icon">
                    <i className="pi pi-check-circle"></i>
                  </div>
                  <div className="highlight-content">
                    <p className="highlight-title">{item.title}</p>
                    <p className="highlight-detail">{item.detail}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="highlight-item">
                <div className="highlight-icon">
                  <i className="pi pi-info-circle"></i>
                </div>
                <div className="highlight-content">
                  <p className="highlight-title">No done projects yet</p>
                  <p className="highlight-detail">
                    Completed projects will appear here.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewPanel;

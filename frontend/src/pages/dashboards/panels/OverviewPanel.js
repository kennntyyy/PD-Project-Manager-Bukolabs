import React, { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
  const [expandedParentProjects, setExpandedParentProjects] = useState({});
  const [completionByProjectId, setCompletionByProjectId] = useState(new Map());

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

  // Calculate completion rate per project from reports
  useEffect(() => {
    const map = new Map();
    reports.forEach((report) => {
      const key = normalizeId(
        report?.project_id?.project_id ||
        report?.project_id?.id ||
        report?.project_id ||
        report?.project?.project_id ||
        report?.project?.id
      );
      const progress = Number(report.current_progress || 0);
      const currentMax = map.get(key) || 0;
      if (progress > currentMax) map.set(key, progress);
    });
    setCompletionByProjectId(map);
  }, [reports]);

  const normalizeId = (value) =>
    value !== null && value !== undefined
      ? String(value).trim().toLowerCase()
      : '';

  const getCompletionRateForProject = (projectId) => {
    if (!projectId) return 0;
    const targetId = normalizeId(projectId);
    return completionByProjectId.get(targetId) || 0;
  };

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

  const parentProjects = useMemo(() => {
    return projects
      .filter((project) => !project.parent_project_id && !project.isDeleted)
      .sort((a, b) => {
        const aDate = new Date(a.created_at || 0).getTime();
        const bDate = new Date(b.created_at || 0).getTime();
        return bDate - aDate;
      });
  }, [projects]);

  const getSubProjectsForParent = (parentId) => {
    return projects.filter(
      (project) => project.parent_project_id === parentId && !project.isDeleted
    );
  };

  const toggleParentProject = (projectId) => {
    setExpandedParentProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

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
        {/* Parent Projects Progress Section */}
        <div className="chart-section">
          <div
            style={{
              marginBottom: '2rem',
              padding: '1rem',
              backgroundColor: '#ffffff',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb',
            }}
          >
            <div
              className="progress-header"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.375rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  fontWeight: '500',
                  fontFamily: '"Source Serif Pro", serif',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                OVERALL PROGRESS BY MONTH
              </div>
              <div
                style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: '#1f2937',
                  fontFamily: '"Source Serif Pro", serif',
                }}
              >
                {Math.round(
                  parentProjects.reduce((sum, proj) => {
                    const subProjects = getSubProjectsForParent(proj.project_id);
                    const avgProgress = subProjects.length
                      ? Math.round(
                          subProjects.reduce(
                            (s, p) => s + getCompletionRateForProject(p.project_id),
                            0
                          ) / subProjects.length
                        )
                      : 0;
                    return sum + avgProgress;
                  }, 0) / (parentProjects.length || 1)
                )}%
              </div>
            </div>
            <div
              className="progress-bar-container"
              style={{
                width: '100%',
                height: '12px',
                background: '#e5e7eb',
                borderRadius: '6px',
                overflow: 'hidden',
                marginBottom: '0.5rem',
              }}
            >
              <div
                className="progress-bar"
                style={{
                  height: '100%',
                  background: '#4f4d36',
                  borderRadius: '6px',
                  width: `${Math.round(
                    parentProjects.reduce((sum, proj) => {
                      const subProjects = getSubProjectsForParent(proj.project_id);
                      const avgProgress = subProjects.length
                        ? Math.round(
                            subProjects.reduce(
                              (s, p) => s + getCompletionRateForProject(p.project_id),
                              0
                            ) / subProjects.length
                          )
                        : 0;
                      return sum + avgProgress;
                    }, 0) / (parentProjects.length || 1)
                  )}%`,
                  transition: 'width 0.3s ease',
                }}
              ></div>
            </div>
            <div
              className="chart-wrapper"
              style={{
                width: '100%',
                height: '200px',
              }}
            >
              {parentProjects.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart
                    data={[
                      { month: 'Jan', progress: 15 },
                      { month: 'Feb', progress: 22 },
                      { month: 'Mar', progress: 28 },
                      { month: 'Apr', progress: 35 },
                      { month: 'May', progress: 42 },
                      { month: 'Jun', progress: 50 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis
                      stroke="#9CA3AF"
                      label={{
                        value: 'Progress (%)',
                        angle: -90,
                        position: 'insideLeft',
                      }}
                    />
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
                      dataKey="progress"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ fill: '#10B981', r: 4 }}
                      activeDot={{ r: 6 }}
                      connectNulls
                      name="Overall Progress"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data-message">
                  <p>No parent projects yet</p>
                </div>
              )}
            </div>
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

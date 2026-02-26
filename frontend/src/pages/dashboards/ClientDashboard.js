import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { ProgressBar } from 'primereact/progressbar';
import { Slider } from 'primereact/slider';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../../services/api';
import { pdf, Font } from '@react-pdf/renderer';

import './Dashboard.css';
import './panels/ProjectDashboardPanel.css';
import { ProjectReportPDF } from '../dashboards/staff_panels/ProjectReportPDF';
import SettingsPanel from './panels/SettingsPanel';

Font.register({
  family: 'Source Serif Pro',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica.ttf',
    },
    {
      src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica-Bold.ttf',
      fontWeight: 'bold',
    },
  ],
});

const ClientDashboard = () => {
  const [recentReports, setRecentReports] = useState([]);
  const toast = useRef(null);
  const [clients, setClients] = useState([]);

  const showToast = (severity, summary, detail) => {
    toast.current.show({ severity, summary, detail, life: 3000 });
  };

  const formatDateForFilename = (dateString) => {
    if (!dateString) return 'unknown';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  };

  const getClientName = (clientId) => {
    if (!clientId) return 'NO CLIENT RECORD';
    const client = clients.find((c) => c.user_id === clientId);
    return client ? `${client.first_name} ${client.last_name}` : '';
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    const apiBaseUrl =
      process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
    const baseUrl = apiBaseUrl.replace('/api', '');
    if (imagePath.startsWith('http')) return imagePath;
    return `${baseUrl}${imagePath}`;
  };

  const downloadReportPDF = async (report) => {
    try {
      console.log('Report object:', report); // Debug log
      const project = projects.find((p) => p.project_id === report.project_id);
      if (!project) {
        showToast('error', 'Error', 'Project not found');
        return;
      }

      const reportDates = {
        projectStart: project.project_start_date
          ? new Date(project.project_start_date).toLocaleDateString()
          : '',
        projectEnd: project.project_deadline
          ? new Date(project.project_deadline).toLocaleDateString()
          : '',
        reportStart: report.start_date
          ? new Date(report.start_date).toLocaleDateString()
          : report.report_date
            ? new Date(report.report_date).toLocaleDateString()
            : 'N/A',
        reportEnd: report.end_date
          ? new Date(report.end_date).toLocaleDateString()
          : report.report_date
            ? new Date(report.report_date).toLocaleDateString()
            : 'N/A',
      };

      // Convert relative image URLs to absolute URLs for PDF
      const absoluteImageUrls = (report.image_urls || []).map(
        (url) => getImageUrl(url), // This uses your helper function
      );

      // Calculate total spent only for reports up to and including this report
      const reportDate = new Date(report.created_at || report.start_date);
      const projectReports = recentReports.filter(
        (r) =>
          r.project_id === report.project_id &&
          new Date(r.created_at || r.start_date) <= reportDate,
      );
      const totalSpent = projectReports.reduce(
        (sum, r) => sum + (Number(r.payment_requested) || 0),
        0,
      );
      const enrichedProject = {
        ...project,
        total_amount_released: totalSpent,
      };

      const doc = (
        <ProjectReportPDF
          data={enrichedProject}
          clientName={getClientName(project.client_id)}
          contractorName={getContractorName(project.contractor_id)}
          completionRate={report.current_progress || 0}
          reportDates={reportDates}
          imageUrls={absoluteImageUrls}
          imageComments={report.image_comments}
          reportDescription={report.report_description}
        />
      );

      const blob = await pdf(doc).toBlob();
      const fileName = `Report_${project.project_name}_${formatDateForFilename(report.start_date)}.pdf`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);

      showToast('success', 'Success', 'PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('error', 'Error', 'Failed to generate PDF');
    }
  };

  // Save as CSV
  const handleSaveAsCSV = () => {
    let csv = 'Project Details\n';
    if (selectedProject) {
      Object.entries(selectedProject).forEach(([key, value]) => {
        csv += `${key},${value}\n`;
      });
    }
    csv += '\nReports\n';
    if (projectReports.length > 0) {
      const reportKeys = Object.keys(projectReports[0]);
      csv += reportKeys.join(',') + '\n';
      projectReports.forEach((report) => {
        csv +=
          reportKeys.map((key) => JSON.stringify(report[key] ?? '')).join(',') +
          '\n';
      });
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project-details.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };
  const [contractors, setContractors] = useState([]);
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem('clientActiveTab') || 'projects',
  );
  const [activeNav, setActiveNav] = useState(
    () => localStorage.getItem('clientActiveNav') || 'projects',
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('clientSidebarCollapsed');
    if (saved !== null) {
      return saved === 'true';
    }
    return false;
  });
  const [settingsOpen, setSettingsOpen] = useState(() => {
    const saved = localStorage.getItem('clientSettingsOpen');
    if (saved !== null) {
      return saved === 'true';
    }
    const storedTab = localStorage.getItem('clientActiveTab') || '';
    return storedTab.startsWith('settings');
  });
  const [isNarrow, setIsNarrow] = useState(false);

  // Projects state
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Reports state for selected project
  const [projectReports, setProjectReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [completionByProjectId, setCompletionByProjectId] = useState(new Map());

  // Project status options
  // const statusOptions = [
  //   { label: 'All Status', value: 'all' },
  //   { label: 'Completed', value: 'completed' },
  //   { label: 'Ongoing', value: 'ongoing' },
  //   { label: 'Hold', value: 'hold' },
  // ];

  const navItems = [
    { key: 'projects', icon: 'pi pi-folder', label: 'Projects' },
  ];

  // Fetch client's projects
  const fetchMyProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects');

      // Filter projects where client_id matches the logged-in client
      const myProjects = response.data.filter(
        (project) => project.client_id === user?.user_id,
      );

      setProjects(myProjects);
    } catch (error) {
      console.error('Fetch projects error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load projects',
      });
    } finally {
      setLoading(false);
    }
  };
  const fetchContractors = async () => {
    try {
      const response = await api.get('/users');
      const contractorsList = response.data.filter(
        (user) => user.user_role === 'contractor',
      );
      setContractors(contractorsList);
    } catch (error) {
      console.error('Failed to fetch contractors:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load contractors',
      });
    }
  };

  useEffect(() => {
    fetchContractors();
  }, []);

  //get name of contractors

  const getContractorName = (contractorId) => {
    if (!contractorId) return '';
    const contractor = contractors.find((c) => c.user_id === contractorId);
    return contractor
      ? `${contractor.first_name} ${contractor.last_name}`
      : 'N/A';
  };

  const normalizeId = (value) =>
    value !== null && value !== undefined
      ? String(value).trim().toLowerCase()
      : '';

  const getCompletionRateForProject = (projectId) => {
    if (!projectId) return 0;
    const normalizedId = normalizeId(projectId);
    if (completionByProjectId.has(normalizedId)) {
      return completionByProjectId.get(normalizedId);
    }
    const matchingReports = recentReports.filter((report) => {
      const reportProjectId =
        report?.project_id?.project_id ||
        report?.project_id?.id ||
        report?.project_id ||
        report?.project?.project_id ||
        report?.project?.id;
      return normalizeId(reportProjectId) === normalizedId;
    });
    if (matchingReports.length === 0) return 0;
    return Math.max(
      ...matchingReports.map((report) => Number(report.current_progress || 0)),
    );
  };

  useEffect(() => {
    localStorage.setItem('clientActiveTab', activeTab);
    localStorage.setItem('clientActiveNav', activeNav);
    localStorage.setItem('clientSidebarCollapsed', sidebarCollapsed.toString());
    localStorage.setItem('clientSettingsOpen', settingsOpen.toString());

    if (activeTab === 'projects') {
      fetchMyProjects();
      fetchReports();
    }
  }, [activeTab, activeNav, sidebarCollapsed, settingsOpen]);

  // Calculate completion rates from reports
  useEffect(() => {
    const completionMap = new Map();
    projects.forEach((project) => {
      const normalizedId = normalizeId(project.project_id);
      const matchingReports = recentReports.filter((report) => {
        const reportProjectId =
          report?.project_id?.project_id ||
          report?.project_id?.id ||
          report?.project_id ||
          report?.project?.project_id ||
          report?.project?.id;
        return normalizeId(reportProjectId) === normalizedId;
      });
      if (matchingReports.length === 0) {
        completionMap.set(normalizedId, 0);
      } else {
        const maxProgress = Math.max(
          ...matchingReports.map((report) => Number(report.current_progress || 0)),
        );
        completionMap.set(normalizedId, maxProgress);
      }
    });
    setCompletionByProjectId(completionMap);
  }, [recentReports, projects]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1024px)');
    const handleChange = () => setIsNarrow(mediaQuery.matches);
    handleChange();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  // Handle opening project details

  // Fetch reports for a specific project
  const fetchProjectReports = async (projectId) => {
    setReportsLoading(true);
    try {
      const response = await api.get('/reports');
      // Filter reports for this project
      const reports = response.data.filter((report) => {
        const reportProjectId =
          report?.project_id?.project_id ||
          report?.project_id?.id ||
          report?.project_id ||
          report?.project?.project_id ||
          report?.project?.id;
        return reportProjectId === projectId && !report.isDeleted;
      });
      setProjectReports(reports);
      setRecentReports(response.data.filter((r) => !r.isDeleted));
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      setProjectReports([]);
    } finally {
      setReportsLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await api.get('/reports');
      setRecentReports(response.data.filter((r) => !r.isDeleted));
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    }
  };

  const openProjectDetails = (project) => {
    setSelectedProject(project);
    if (project?.project_id) {
      fetchProjectReports(project.project_id);
    } else {
      setProjectReports([]);
    }
  };

  // Format amount with currency
  const amountTemplate = (rowData) => {
    if (!rowData.total_amount) return 'N/A';
    return `₱${parseFloat(rowData.total_amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Format date
  const dateTemplate = (rowData) => {
    if (!rowData.project_deadline) return 'N/A';
    return new Date(rowData.project_deadline).toLocaleDateString();
  };

  const getStatusMeta = (rowData) => {
    const statusValue = String(rowData?.project_status || '').toLowerCase();

    if (statusValue === 'done' || statusValue === 'completed') {
      return { label: 'Completed', severity: 'success', color: '#16a34a' };
    }

    if (statusValue === 'hold' || statusValue === 'on hold') {
      return { label: 'On Hold', severity: 'danger', color: '#dc2626' };
    }

    if (statusValue === 'ongoing') {
      return { label: 'Ongoing', severity: 'warning', color: '#f97316' };
    }

    return { label: 'Pending', severity: 'warning', color: '#f59e0b' };
  };

  // Status badge template
  const statusTemplate = (rowData) => {
    const meta = getStatusMeta(rowData);
    return (
      <Tag
        value={meta.label}
        severity={meta.severity}
        style={{ backgroundColor: meta.color, color: '#ffffff' }}
      />
    );
  };

  const getDaysRemainingInfo = (rowData, completionRate) => {
    const statusValue = String(rowData?.project_status || '').toLowerCase();
    const isComplete =
      (statusValue === 'done' || statusValue === 'completed') &&
      Number(completionRate || 0) >= 100;

    if (isComplete) {
      return { text: 'Completed', color: '#16a34a' };
    }

    const endValue = rowData?.project_deadline;
    if (!endValue) return { text: 'N/A', color: '#6b7280' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(endValue);
    if (Number.isNaN(endDate.getTime())) {
      return { text: 'N/A', color: '#6b7280' };
    }
    endDate.setHours(0, 0, 0, 0);

    const remaining = Math.ceil((endDate - today) / 86400000);
    const dayLabel = Math.abs(remaining) === 1 ? 'day' : 'days';
    const text = `${remaining} ${dayLabel}`;

    if (remaining < 0) return { text, color: '#dc2626' };
    return { text, color: '#0f766e' };
  };

  // Priority badge template
  const priorityTemplate = (rowData) => {
    if (!rowData.priority) return 'N/A';

    let severity = 'info';
    switch (rowData.priority.toLowerCase()) {
      case 'high':
        severity = 'danger';
        break;
      case 'medium':
        severity = 'warning';
        break;
      case 'low':
        severity = 'success';
        break;
      default:
        severity = 'info';
    }

    return <Tag value={rowData.priority} severity={severity} />;
  };

  const getFilteredProjects = () => {
    // 1. Initial filter for deleted status
    let filtered = projects.filter((project) => {
      return project.isDeleted === false || project.isDeleted === undefined;
    });

    // 2. Apply search if query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();

      filtered = filtered.filter((project) => {
        // Pre-fetch names from helpers and normalize to lowercase
        const contractorName = getContractorName(
          project.contractor_id,
        ).toLowerCase();
        const clientName = getClientName(project.client_id).toLowerCase();

        return (
          project.project_name?.toLowerCase().includes(query) ||
          project.project_description?.toLowerCase().includes(query) ||
          project.total_amount?.toString().includes(query) ||
          contractorName.includes(query) || // Search by Contractor
          clientName.includes(query) || // Search by Client
          (project.project_deadline &&
            new Date(project.project_deadline)
              .toLocaleDateString()
              .toLowerCase()
              .includes(query))
        );
      });
    }

    return filtered;
  };

  const filteredProjects = getFilteredProjects();
  const mainProjects = filteredProjects.filter(
    (project) => !project.parent_project_id,
  );
  const selectedSubprojects = selectedProject
    ? projects.filter(
        (project) =>
          project.parent_project_id === selectedProject.project_id &&
          (project.isDeleted === false || project.isDeleted === undefined),
      )
    : [];
  const parentProjectsForStats = projects.filter(
    (project) =>
      !project.parent_project_id &&
      (project.isDeleted === false || project.isDeleted === undefined),
  );

  const selectedCompletionRate = selectedProject
    ? selectedSubprojects.length > 0
      ? Math.round(
          selectedSubprojects.reduce(
            (sum, subproject) =>
              sum + getCompletionRateForProject(subproject.project_id),
            0,
          ) / selectedSubprojects.length,
        )
      : getCompletionRateForProject(selectedProject.project_id)
    : 0;
  const selectedDaysRemaining = selectedProject
    ? getDaysRemainingInfo(selectedProject, selectedCompletionRate)
    : { text: 'N/A', color: '#6b7280' };

  // Calculate overall progress and monthly data for chart
  const overallProgressData = useMemo(() => {
    if (projects.length === 0) {
      return { monthlyData: [], avgProgress: 0 };
    }

    const totalProgress = projects.reduce(
      (sum, proj) => sum + getCompletionRateForProject(proj.project_id),
      0,
    );
    const avgProgress = Math.round(totalProgress / projects.length);

    // Generate monthly data for the line chart
    const monthlyData = [
      { month: 'Jan', progress: Math.round(avgProgress * 0.2) },
      { month: 'Feb', progress: Math.round(avgProgress * 0.35) },
      { month: 'Mar', progress: Math.round(avgProgress * 0.5) },
      { month: 'Apr', progress: Math.round(avgProgress * 0.65) },
      { month: 'May', progress: Math.round(avgProgress * 0.85) },
      { month: 'Jun', progress: avgProgress },
    ];

    return { monthlyData, avgProgress };
  }, [projects, completionByProjectId]);

  const isSidebarCollapsed = isNarrow ? true : sidebarCollapsed;

  return (
    <div
      className={`dashboard-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}
    >
      <Toast ref={toast} />
      <ConfirmDialog />
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img
              src="/logo.png"
              alt="Logo"
              style={{
                width: '200%',
                height: '200%',
              }}
            />
          </div>
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            aria-label={
              isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
            }
          >
            <i
              className={`pi ${isSidebarCollapsed ? 'pi-angle-right' : 'pi-angle-left'}`}
            ></i>
          </button>
          {/* <div className="sidebar-title">
            <h3>Client</h3>
            <p>Control Panel</p>
          </div> */}
        </div>
        <div className="sidebar-nav">
          {/* Projects nav item */}
          <div
            className={`nav-item ${activeNav === 'projects' ? 'active' : ''}`}
            onClick={() => {
              setActiveNav('projects');
              setActiveTab('projects');
            }}
            title="Projects"
          >
            <i className="pi pi-folder"></i>
            <span>Projects</span>
          </div>

          {/* Settings dropdown nav */}
          <div
            className={`nav-item ${activeNav === 'settings' ? 'active' : ''}`}
            onClick={() => {
              setActiveNav('settings');
              setSettingsOpen((prev) => !prev);
            }}
            title="Settings"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setActiveNav('settings');
                setSettingsOpen((prev) => !prev);
              }
            }}
          >
            <i className="pi pi-cog"></i>
            <span>Settings</span>
            <i className={`pi ${settingsOpen ? 'pi-chevron-down' : 'pi-chevron-right'} nav-caret`}></i>
          </div>
          {settingsOpen && (
            <>
              <div
                className={`nav-subitem ${activeTab === 'settings-general' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings-general')}
                role="button"
                tabIndex={0}
                title="General Settings"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setActiveTab('settings-general');
                  }
                }}
              >
                <i className="pi pi-cog"></i>
                <span>General</span>
              </div>
              <div
                className={`nav-subitem ${activeTab === 'settings-security' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings-security')}
                role="button"
                tabIndex={0}
                title="Security Settings"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setActiveTab('settings-security');
                  }
                }}
              >
                <i className="pi pi-shield"></i>
                <span>Security</span>
              </div>
            </>
          )}
        </div>
        <div
          className="sidebar-footer"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div className="sidebar-user-profile">
            <div className="sidebar-user-avatar">
              {user?.profile_pic ? (
                <img
                  src={`data:image/jpeg;base64,${user.profile_pic}`}
                  alt={user?.username}
                />
              ) : (
                <span>{user?.username?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="sidebar-user-info">
              <p className="sidebar-user-name">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="sidebar-user-role">
                {user?.user_role?.toUpperCase()}
              </p>
            </div>
          </div>
          <Button
            className="logout-btn p-button-sm"
            label={isSidebarCollapsed ? '' : 'Logout'}
            icon="pi pi-sign-out"
            onClick={logout}
          />
        </div>
      </div>
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div className="header-left">
            <div>
              <h2 className="header-title">
                {activeTab === 'projects' && 'My Projects'}
                {activeTab === 'settings' && 'Settings'}
              </h2>
              <p className="header-subtitle">
                {activeTab === 'projects' &&
                  'View your projects and track progress'}
                {activeTab === 'settings' && 'Configure your settings'}
              </p>
            </div>
          </div>
          <div className="header-right">
            <div className="user-profile">
              <div className="user-avatar">
                {user?.profile_pic ? (
                  <img
                    src={`data:image/jpeg;base64,${user.profile_pic}`}
                    alt={user?.username}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  user?.username?.charAt(0).toUpperCase()
                )}
              </div>
              <div className="user-info">
                <h4>
                  {user?.first_name} {user?.last_name}
                </h4>
                <p>{user?.user_role?.toUpperCase()}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="dashboard-body">
          {activeTab === 'projects' && (
            <div className="projects-panel">
              
              <div className="panel-header">
                <div className="search-filter-section">
                  <div>
                    <h1>PROJECTS</h1>
                    <p className="text-color-secondary m-0">
                      Manage and track all project activities
                    </p>
                  </div>
                  <div className="p-inputgroup" style={{ maxWidth: '400px' }}>
                    <div className="reports-search-box">
                      <i className="pi pi-search"></i>
                      <InputText
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="reports-search-input"
                      />
                      {searchQuery && (
                        <i
                          className="pi pi-times"
                          style={{ color: '#9ca3af', cursor: 'pointer' }}
                          onClick={() => setSearchQuery('')}
                        ></i>
                      )}
                    </div>
                  </div>
                </div>

                <div className="projects-stats">
                  <div className="stat-card">
                    <i className="pi pi-folder" style={{ color: '#3B82F6' }} />
                    <div>
                      <h3>{parentProjectsForStats.length}</h3>
                      <p>Total Projects</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <i
                      className="pi pi-check-circle"
                      style={{ color: '#10B981' }}
                    />
                    <div>
                      <h3>
                        {
                          parentProjectsForStats.filter(
                            (p) => p.project_status === 'done',
                          ).length
                        }
                      </h3>
                      <p>Completed</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <i className="pi pi-clock" style={{ color: 'blue' }} />
                    <div>
                      <h3>
                        {
                          parentProjectsForStats.filter(
                            (p) => p.project_status === 'ongoing',
                          ).length
                        }
                      </h3>
                      <p>Ongoing</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <i
                      className="pi pi-pause-circle"
                      style={{ color: 'red' }}
                    />
                    <div>
                      <h3>
                        {
                          parentProjectsForStats.filter(
                            (p) => p.project_status === 'hold',
                          ).length
                        }
                      </h3>
                      <p>On Hold</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Overall Progress Chart */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                }}
              >
                <div
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: '700',
                    color: '#1f2937',
                    marginBottom: '1rem',
                  }}
                >
                  OVERALL PROGRESS BY MONTH
                </div>

                <div
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: '700',
                    color: '#1f2937',
                    marginBottom: '0.5rem',
                  }}
                >
                  {overallProgressData.avgProgress}%
                </div>

                <div
                  style={{
                    height: '12px',
                    background: '#e5e7eb',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    marginBottom: '1.5rem',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      background: '#4f4d36',
                      width: `${overallProgressData.avgProgress}%`,
                      transition: 'width 0.3s ease',
                    }}
                  ></div>
                </div>

                {overallProgressData.monthlyData.length > 0 && (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={overallProgressData.monthlyData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#E5E7EB"
                        vertical={false}
                      />
                      <XAxis dataKey="month" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          background: '#ffffff',
                          border: '1px solid #E5E7EB',
                          borderRadius: '6px',
                        }}
                      />
                      <Line
                        dataKey="progress"
                        stroke="#10B981"
                        strokeWidth={2}
                        dot={{ fill: '#10B981', r: 4 }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
              
              <div style={{marginBottom: '1rem'}}>
                <h3>YOUR PROJECTS</h3>
              </div>

              {selectedProject ? (
                <div
                  className="project-dashboard-card project-dashboard-card-linked"
                  style={{ marginTop: '1rem' }}
                >
                  <div className="back-button-row">
                    <Button
                      label="Back to Projects"
                      icon="pi pi-arrow-left"
                      severity="secondary"
                      className="p-button-text p-button-sm"
                      onClick={() => setSelectedProject(null)}
                    />
                  </div>
                  <h3>{selectedProject.project_name}</h3>
                  <p className="text-muted">
                    {selectedProject.project_description || 'No description'}
                  </p>

                  <div className="project-dashboard-metrics">
                    <div>
                      <div className="metric-label">Status</div>
                      <div>{statusTemplate(selectedProject)}</div>
                    </div>
                    <div>
                      <div className="metric-label">Contract Amount</div>
                      <div>{amountTemplate(selectedProject)}</div>
                    </div>
                    <div>
                      <div className="metric-label">Start Date</div>
                      <div>
                        {selectedProject?.project_start_date
                          ? new Date(
                              selectedProject.project_start_date,
                            ).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="metric-label">Due Date</div>
                      <div>{dateTemplate(selectedProject)}</div>
                    </div>
                    <div>
                      <div className="metric-label">Days Remaining</div>
                      <div style={{ color: selectedDaysRemaining.color }}>
                        {selectedDaysRemaining.text}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    <div className="metric-label">Completion Rate</div>
                    <ProgressBar
                      value={selectedCompletionRate}
                      className="report-progress-bar"
                      style={{
                        '--progress-color':
                          getStatusMeta(selectedProject).color,
                      }}
                    />
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                      {selectedCompletionRate}% complete
                    </div>
                  </div>

                  <div className="project-dashboard-divider" />

                  <div style={{ marginTop: '1rem' }}>
                    <div className="project-dashboard-card-header">
                      <div>
                        <h4>Subprojects</h4>
                        <span className="text-muted">
                          {selectedSubprojects.length} total
                        </span>
                      </div>
                    </div>
                    {selectedSubprojects.length === 0 ? (
                      <div className="project-dashboard-empty">
                        No subprojects found.
                      </div>
                    ) : (
                      <div className="subproject-grid">
                        {selectedSubprojects.map((subproject) =>
                          (() => {
                            const subCompletion = getCompletionRateForProject(
                              subproject.project_id,
                            );
                            const subDaysRemaining = getDaysRemainingInfo(
                              subproject,
                              subCompletion,
                            );
                            return (
                              <div
                                key={subproject.project_id}
                                className="subproject-card"
                              >
                                <div className="subproject-card-header">
                                  <h5 className="subproject-title">
                                    {subproject.project_name}
                                  </h5>
                                  {statusTemplate(subproject)}
                                </div>
                                <p className="subproject-desc">
                                  {subproject.project_description ||
                                    'No description'}
                                </p>
                                <div className="subproject-progress">
                                  <ProgressBar
                                    value={subCompletion}
                                    className="report-progress-bar"
                                    style={{
                                      height: '12px',
                                      '--progress-color':
                                        getStatusMeta(subproject).color,
                                    }}
                                  />
                                  <div className="subproject-progress-text">
                                    {subCompletion}% complete
                                  </div>
                                </div>
                                <div className="subproject-meta">
                                  <div>
                                    <div className="metric-label">
                                      Contractor
                                    </div>
                                    <div>
                                      {getContractorName(
                                        subproject.contractor_id,
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="metric-label">
                                      Contract Amount
                                    </div>
                                    <div>{amountTemplate(subproject)}</div>
                                  </div>
                                  <div>
                                    <div className="metric-label">Due Date</div>
                                    <div>{dateTemplate(subproject)}</div>
                                  </div>
                                  <div>
                                    <div className="metric-label">
                                      Days Remaining
                                    </div>
                                    <div
                                      style={{ color: subDaysRemaining.color }}
                                    >
                                      {subDaysRemaining.text}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })(),
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : loading ? (
                <div className="project-dashboard-empty">
                  Loading projects...
                </div>
              ) : mainProjects.length === 0 ? (
                <div className="project-dashboard-empty">
                  {searchQuery || statusFilter !== 'all'
                    ? 'No projects match your criteria.'
                    : 'No projects assigned yet.'}
                </div>
              ) : (
                <div className="project-dashboard-grid">
                  {mainProjects.map((project) => (
                    <button
                      key={project.project_id}
                      type="button"
                      className="project-dashboard-card project-dashboard-card-item"
                      onClick={() => openProjectDetails(project)}
                    >
                      <div className="project-card-header">
                        <h4 className="project-card-title">
                          {project.project_name}
                        </h4>
                        {statusTemplate(project)}
                      </div>
                      <p className="project-card-desc">
                        {project.project_description || 'No description'}
                      </p>
                      <div className="project-card-meta">
                        <div>
                          <span className="metric-label">Contractor</span>
                          <div>{getContractorName(project.contractor_id)}</div>
                        </div>
                        <div>
                          <span className="metric-label">Contract Amount</span>
                          <div>{amountTemplate(project)}</div>
                        </div>
                        <div>
                          <span className="metric-label">Due Date</span>
                          <div>{dateTemplate(project)}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === 'settings-general' && <SettingsPanel activeTab="general" />}
          {activeTab === 'settings-security' && <SettingsPanel activeTab="security" />}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;

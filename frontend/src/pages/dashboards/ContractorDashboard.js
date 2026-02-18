import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { ProgressBar } from 'primereact/progressbar';
import api from '../../services/api';
import './Dashboard.css';
import './panels/ProjectDashboardPanel.css';

const ContractorDashboard = () => {
  const [clients, setClients] = useState([]);
  const [contractors, setContractors] = useState([]);
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem('contractorActiveTab') || 'projects',
  );
  const [activeNav, setActiveNav] = useState(
    () => localStorage.getItem('contractorActiveNav') || 'projects',
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('contractorSidebarCollapsed');
    if (saved !== null) {
      return saved === 'true';
    }
    return false;
  });
  const [isNarrow, setIsNarrow] = useState(false);
  const toast = useRef(null);

  // Projects state
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'completed', 'pending'
  const [selectedClientGroup, setSelectedClientGroup] = useState(null);
  const [recentReports, setRecentReports] = useState([]);

  const navItems = [
    { key: 'projects', icon: 'pi pi-folder', label: 'My Projects' },
    // { key: 'deliverables', icon: 'pi pi-check-square', label: 'Deliverables' },
    // { key: 'timesheets', icon: 'pi pi-clock', label: 'Timesheets' },
    { key: 'settings', icon: 'pi pi-cog', label: 'Settings' },
  ];

  
  // Project status options
  const statusOptions = [
    { label: 'All Status', value: 'all' },
    { label: 'Completed', value: 'completed' },
    { label: 'Ongoing', value: 'ongoing' },
    { label: 'Hold', value: 'hold' },
  ];
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    const apiBaseUrl =
      process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
    const baseUrl = apiBaseUrl.replace('/api', '');
    if (imagePath.startsWith('http')) return imagePath;
    return `${baseUrl}${imagePath}`;
   };
  
  const fetchClients = async () => {
    try {
      const response = await api.get('/users?role=client');
      setClients(response.data);
    } catch (error) {
      console.error('Fetch clients error:', error);
    }
  };
  useEffect(() => {
    fetchClients();
  }, []);

  //get client name
  const getClientName = (clientId) => {
    if (!clientId) return '';
    const client = clients.find((c) => c.user_id === clientId);
    return client
      ? `${client.first_name} ${client.last_name}`
      : '';
  };

  // Fetch contractor's projects
  const fetchMyProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects');

      // Filter projects where contractor_id matches the logged-in contractor
      const myProjects = response.data.filter(
        (project) => project.contractor_id === user?.user_id,
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
  const [projectReports, setProjectReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('contractorActiveTab', activeTab);
    localStorage.setItem('contractorActiveNav', activeNav);
    localStorage.setItem(
      'contractorSidebarCollapsed',
      sidebarCollapsed.toString(),
    );

    if (activeTab === 'projects') {
      fetchMyProjects();
      fetchReports();
    }
  }, [activeTab, activeNav, sidebarCollapsed]);

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
  const openProjectDetails = (project) => {
    setSelectedProject(project);
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
        projectReports.forEach(report => {
          csv += reportKeys.map(key => JSON.stringify(report[key] ?? '')).join(',') + '\n';
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
const getContractorName = (contractorId) => {
    if (!contractorId) return '';
    const contractor = contractors.find((c) => c.user_id === contractorId);
    return contractor
      ? `${contractor.first_name} ${contractor.last_name}`
      : 'N/A';
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

  const fetchReports = async () => {
    try {
      const response = await api.get('/reports');
      setRecentReports(response.data.filter((r) => !r.isDeleted));
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    }
  };

  const getCompletionRateForProject = (projectId) => {
    if (!projectId) return 0;
    const matchingReports = recentReports.filter((report) => {
      const reportProjectId =
        report?.project_id?.project_id ||
        report?.project_id?.id ||
        report?.project_id ||
        report?.project?.project_id ||
        report?.project?.id;
      return reportProjectId === projectId;
    });
    if (matchingReports.length === 0) return 0;
    return Math.max(
      ...matchingReports.map((report) => Number(report.current_progress || 0)),
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

  // Filter projects based on search and status
  const getFilteredProjects = () => {
    let filtered = projects;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((project) => {
        if (statusFilter === 'ongoing')
          return project.project_status === 'ongoing';
        if (statusFilter === 'completed')
          return project.project_status === 'completed';
        if (statusFilter === 'hold')
          return project.project_status === 'hold';
        return true;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((project) => {
        return (
          project.project_name?.toLowerCase().includes(query) ||
          project.project_description?.toLowerCase().includes(query) ||
          project.total_amount?.toString().includes(query) ||
          getClientName(project.client_id).toLowerCase().includes(query) ||
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
  const groupedProjects = useMemo(() => {
    const grouped = new Map();

    filteredProjects.forEach((project) => {
      const clientName = getClientName(project.client_id) || 'Unassigned';
      if (!grouped.has(clientName)) {
        grouped.set(clientName, []);
      }
      grouped.get(clientName).push(project);
    });

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([clientName, projects]) => ({ clientName, projects }));
  }, [filteredProjects, clients]);
  const selectedSubprojects = selectedProject
    ? projects.filter(
        (project) =>
          project.parent_project_id === selectedProject.project_id &&
          project.contractor_id === user?.user_id,
      )
    : [];
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
  const uniqueClientCount = new Set(
    projects.map((project) => project.client_id).filter(Boolean),
  ).size;

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
            <img src="/logo.png" alt="Logo" style={{
              width: '200%', height: '200%',
            }}/>
          </div>
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <i
              className={`pi ${isSidebarCollapsed ? 'pi-angle-right' : 'pi-angle-left'}`}
            ></i>
          </button>
          {/* <div className="sidebar-title">
            <h3>Contractor</h3>
            <p>Control Panel</p>
          </div> */}
        </div>
        <div className="sidebar-nav">
          {navItems.map((item) => (
            <div
              key={item.key}
              className={`nav-item ${activeNav === item.key ? 'active' : ''}`}
              onClick={() => {
                setActiveNav(item.key);
                setActiveTab(item.key);
              }}
              title={item.label}
            >
              <i className={item.icon}></i>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="sidebar-user-profile">
            <div className="sidebar-user-avatar">
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
                <span>{user?.username?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="sidebar-user-info">
              <p className="sidebar-user-name">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="sidebar-user-role">{user?.user_role?.toUpperCase()}</p>
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
                {/* {activeTab === 'deliverables' && 'Deliverables'}
                {activeTab === 'timesheets' && 'Timesheets'} */}
                {activeTab === 'settings' && 'Settings'}
              </h2>
              <p className="header-subtitle">
                {activeTab === 'projects' &&
                  'View and manage your assigned projects'}
                {/* {activeTab === 'deliverables' &&
                  'View and manage your deliverables'}
                {activeTab === 'timesheets' && 'Track your timesheets'} */}
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
                <div className="search-filter-section" style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between'
                }}>
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
                      <h3>{projects.length}</h3>
                      <p>Total Projects</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <i className="pi pi-users" style={{ color: '#6366F1' }} />
                    <div>
                      <h3>{uniqueClientCount}</h3>
                      <p>Total Clients</p>
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
                          projects.filter(
                            (p) => p.project_status === 'completed',
                          ).length
                        }
                      </h3>
                      <p>Completed</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <i className="pi pi-clock" style={{ color: '#d4d143' }} />
                    <div>
                      <h3>
                        {
                          projects.filter((p) => p.project_status === 'ongoing')
                            .length
                        }
                      </h3>
                      <p>hold</p>
                    </div>
                    </div>
                  <div className="stat-card">
                    <i className="pi pi-pause-circle" style={{ color: '#cc3d24' }} />
                    <div>
                      <h3>
                        {
                          projects.filter((p) => p.project_status === 'hold')
                            .length
                        }
                      </h3>
                      <p>On Hold</p>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Dropdown
                  value={statusFilter}
                  options={statusOptions}
                  onChange={(e) => setStatusFilter(e.value)}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Filter by status"
                  style={{ minWidth: '200px', marginBottom: '1rem' }}
                />
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
                      <div className="metric-label">Client</div>
                      <div>{getClientName(selectedProject.client_id) || 'N/A'}</div>
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
                        '--progress-color': getStatusMeta(selectedProject).color,
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
                        {selectedSubprojects.map((subproject) => {
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
                                    '--progress-color': getStatusMeta(subproject)
                                      .color,
                                  }}
                                />
                                <div className="subproject-progress-text">
                                  {subCompletion}% complete
                                </div>
                              </div>
                              <div className="subproject-meta">
                                <div>
                                  <div className="metric-label">Contract Amount</div>
                                  <div>{amountTemplate(subproject)}</div>
                                </div>
                                <div>
                                  <div className="metric-label">Due Date</div>
                                  <div>{dateTemplate(subproject)}</div>
                                </div>
                                <div>
                                  <div className="metric-label">Days Remaining</div>
                                  <div style={{ color: subDaysRemaining.color }}>
                                    {subDaysRemaining.text}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : loading ? (
                <div className="project-dashboard-empty">Loading projects...</div>
              ) : filteredProjects.length === 0 ? (
                <div className="project-dashboard-empty">
                  {searchQuery || statusFilter !== 'all'
                    ? 'No projects match your criteria.'
                    : 'No projects assigned yet.'}
                </div>
              ) : (
                <div className="project-dashboard-list">
                  <div className="project-dashboard-groups">
                    {!selectedClientGroup ? (
                      <div className="project-dashboard-grid">
                        {groupedProjects.map((group) => (
                          <button
                            key={group.clientName}
                            type="button"
                            className="project-dashboard-card project-dashboard-client-card"
                            onClick={() => setSelectedClientGroup(group)}
                          >
                            <div className="project-card-header">
                              <h4 className="project-card-title">
                                {group.clientName}
                              </h4>
                            </div>
                            <p className="project-card-desc">
                              {group.projects.length} project
                              {group.projects.length !== 1 ? 's' : ''}
                            </p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="project-dashboard-group">
                        <div className="project-dashboard-group-header">
                          <div>
                            <h4>{selectedClientGroup.clientName}</h4>
                            <span className="text-muted">
                              {selectedClientGroup.projects.length} project
                              {selectedClientGroup.projects.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <Button
                            label="Back to Clients"
                            icon="pi pi-arrow-left"
                            severity="secondary"
                            className="p-button-text p-button-sm"
                            onClick={() => setSelectedClientGroup(null)}
                          />
                        </div>
                        <div className="project-dashboard-grid">
                          {selectedClientGroup.projects.map((project) => (
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
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* {activeTab === 'deliverables' && (
            <div className="coming-soon">
              <i
                className="pi pi-clock"
                style={{ fontSize: '3rem', color: '#6B7280' }}
              />
              <h3>Deliverables Panel</h3>
              <p>Coming soon! This feature is under development.</p>
            </div>
          )}

          {activeTab === 'timesheets' && (
            <div className="coming-soon">
              <i
                className="pi pi-clock"
                style={{ fontSize: '3rem', color: '#6B7280' }}
              />
              <h3>Timesheets Panel</h3>
              <p>Coming soon! This feature is under development.</p>
            </div>
          )} */}

          {activeTab === 'settings' && (
            <div className="coming-soon">
              <i
                className="pi pi-clock"
                style={{ fontSize: '3rem', color: '#6B7280' }}
              />
              <h3>Settings Panel</h3>
              <p>Coming soon! This feature is under development.</p>
            </div>
          )}
        </div>
      </div>

     </div>
   );
 };
 

export default ContractorDashboard;

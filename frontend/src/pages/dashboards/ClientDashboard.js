import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { ConfirmDialog } from 'primereact/confirmdialog';
import api from '../../services/api';
import './Dashboard.css';

const ClientDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem('clientActiveTab') || 'projects',
  );
  const [activeNav, setActiveNav] = useState(
    () => localStorage.getItem('clientActiveNav') || 'projects',
  );
  const toast = useRef(null);

  // Projects state
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [displayDetailsDialog, setDisplayDetailsDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Project status options
  const statusOptions = [
    { label: 'All Status', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Completed', value: 'completed' },
    { label: 'Pending', value: 'pending' },
  ];

  const navItems = [
    { key: 'projects', icon: 'pi pi-folder', label: 'Projects' },
    { key: 'settings', icon: 'pi pi-cog', label: 'Settings' },
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

  useEffect(() => {
    localStorage.setItem('clientActiveTab', activeTab);
    localStorage.setItem('clientActiveNav', activeNav);

    if (activeTab === 'projects') {
      fetchMyProjects();
    }
  }, [activeTab, activeNav]);

  // Handle opening project details
  const openProjectDetails = (project) => {
    setSelectedProject(project);
    setDisplayDetailsDialog(true);
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

  // Status badge template
  const statusTemplate = (rowData) => {
    let status = 'Pending';
    let severity = 'warning';

    if (rowData.project_status === 'completed') {
      status = 'Completed';
      severity = 'success';
    } else if (rowData.project_status === 'active') {
      status = 'Active';
      severity = 'info';
    } else if (rowData.project_status === 'cancelled') {
      status = 'Cancelled';
      severity = 'danger';
    }

    return <Tag value={status} severity={severity} />;
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

  // Filter projects based on search and status
  const getFilteredProjects = () => {
    let filtered = projects;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((project) => {
        if (statusFilter === 'active')
          return project.project_status === 'active';
        if (statusFilter === 'completed')
          return project.project_status === 'completed';
        if (statusFilter === 'pending')
          return project.project_status === 'pending';
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

  return (
    <div className="dashboard-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/logo.png" alt="Logo" style={{
              width: '150%', height: '150%',
            }}/>
          </div>
          {/* <div className="sidebar-title">
            <h3>Client</h3>
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
            >
              <i className={item.icon}></i>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        <div className="sidebar-footer">
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
              <p className="sidebar-user-role">{user?.user_role?.toUpperCase()}</p>
            </div>
          </div>
          <Button
            className="logout-btn"
            label="Logout"
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
                  <div className="p-inputgroup" style={{ maxWidth: '400px' }}>
                    <span className="p-inputgroup-addon">
                      <i className="pi pi-search" />
                    </span>
                    <input
                      type="text"
                      className="p-inputtext"
                      placeholder="Search projects by name, description, amount..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ flex: '1' }}
                    />
                    {searchQuery && (
                      <Button
                        icon="pi pi-times"
                        className="p-button-text"
                        onClick={() => setSearchQuery('')}
                        tooltip="Clear search"
                      />
                    )}
                  </div>

                  <Dropdown
                    value={statusFilter}
                    options={statusOptions}
                    onChange={(e) => setStatusFilter(e.value)}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Filter by status"
                    style={{ minWidth: '200px' }}
                  />
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
                    <i className="pi pi-clock" style={{ color: '#F59E0B' }} />
                    <div>
                      <h3>
                        {
                          projects.filter((p) => p.project_status === 'active')
                            .length
                        }
                      </h3>
                      <p>Active</p>
                    </div>
                  </div>
                </div>
              </div>

              <DataTable
                value={filteredProjects}
                loading={loading}
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 20]}
                tableStyle={{ minWidth: '50rem' }}
                emptyMessage={
                  searchQuery || statusFilter !== 'all'
                    ? 'No projects match your criteria.'
                    : 'No projects assigned yet.'
                }
                responsiveLayout="scroll"
                className="projects-table"
              >
                <Column
                  field="project_name"
                  header="Project Name"
                  sortable
                  body={(rowData) => (
                    <div className="project-name-cell">
                      <strong>{rowData.project_name}</strong>
                      <small className="text-muted">
                        {rowData.project_id?.substring(0, 8)}
                      </small>
                    </div>
                  )}
                />
                <Column
                  field="project_description"
                  header="Description"
                  body={(rowData) => (
                    <div className="description-cell">
                      {rowData.project_description || 'No description'}
                    </div>
                  )}
                />
                <Column
                  field="total_amount"
                  header="Amount"
                  body={amountTemplate}
                  sortable
                />
                <Column
                  field="project_deadline"
                  header="Deadline"
                  body={dateTemplate}
                  sortable
                />
                <Column
                  field="project_status"
                  header="Status"
                  body={statusTemplate}
                  sortable
                />
                <Column
                  field="priority"
                  header="Priority"
                  body={priorityTemplate}
                  sortable
                />
                <Column
                  header="Actions"
                  body={(rowData) => (
                    <div className="actions-cell">
                      <Button
                        icon="pi pi-eye"
                        className="p-button-rounded p-button-sm p-button-info"
                        onClick={() => openProjectDetails(rowData)}
                        tooltip="View Details"
                        tooltipOptions={{ position: 'top' }}
                      />
                    </div>
                  )}
                />
              </DataTable>
            </div>
          )}

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
      

      {/* Project Details Dialog */}
      <Dialog
        visible={displayDetailsDialog}
        style={{ width: '90vw', maxWidth: '600px' }}
        header="Project Details"
        headerStyle={{ paddingTop: '1rem', paddingLeft: '1rem' }}
        modal
        onHide={() => setDisplayDetailsDialog(false)}
      >
        {selectedProject && (
          <div className="project-details">
            <div className="detail-section">
              <h4>Basic Information</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Project Name:</label>
                  <span>{selectedProject.project_name}</span>
                </div>
                <div className="detail-item">
                  <label>Project ID:</label>
                  <span>{selectedProject.project_id}</span>
                </div>
                <div className="detail-item">
                  <label>Status:</label>
                  <Tag
                    value={selectedProject.project_status || 'Pending'}
                    severity={
                      selectedProject.project_status === 'completed'
                        ? 'success'
                        : selectedProject.project_status === 'active'
                          ? 'info'
                          : 'warning'
                    }
                  />
                </div>
                <div className="detail-item">
                  <label>Priority:</label>
                  <Tag
                    value={selectedProject.priority || 'Medium'}
                    severity={
                      selectedProject.priority === 'high'
                        ? 'danger'
                        : selectedProject.priority === 'medium'
                          ? 'warning'
                          : 'success'
                    }
                  />
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Financial Information</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Contract Amount:</label>
                  <span className="amount">
                    {amountTemplate(selectedProject)}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Deadline:</label>
                  <span>{dateTemplate(selectedProject)}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Description</h4>
              <div className="description-box">
                {selectedProject.project_description ||
                  'No description provided.'}
              </div>
            </div>

            <div className="detail-section">
              <h4>Additional Information</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Created Date:</label>
                  <span>
                    {selectedProject.created_at
                      ? new Date(
                          selectedProject.created_at,
                        ).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Last Updated:</label>
                  <span>
                    {selectedProject.updated_at
                      ? new Date(
                          selectedProject.updated_at,
                        ).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-content-end mt-4">
          <Button
            style={{ marginBottom: '1rem', marginRight: '1rem', padding: '0.5rem' }}
            label="Close"
            severity="secondary"
            onClick={() => setDisplayDetailsDialog(false)}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default ClientDashboard;

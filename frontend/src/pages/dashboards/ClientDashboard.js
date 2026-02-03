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
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Slider } from 'primereact/slider';
import api from '../../services/api';
import { pdf, Font } from '@react-pdf/renderer';
import './Dashboard.css';
import { ProjectReportPDF } from '../dashboards/staff_panels/ProjectReportPDF';

// Font.register({
//   family: 'Source Serif Pro',
//   fonts: [
//     { src: 'https://fonts.gstatic.com/s/sourceserifpro/v15/ne6v77u_ls8ax40_n68_9y-A-X77D34.ttf' }, // Regular
//     { src: 'https://fonts.gstatic.com/s/sourceserifpro/v15/ne6z77u_ls8ax40_n68_9y-A-X77D34.ttf', fontWeight: 'bold' } // Bold
//   ]
// });

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
          const absoluteImageUrls = (report.image_urls || []).map((url) =>
            getImageUrl(url),
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
  const [contractors, setContractors] = useState([]);
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem('clientActiveTab') || 'projects',
  );
  const [activeNav, setActiveNav] = useState(
    () => localStorage.getItem('clientActiveNav') || 'projects',
  );
  

  // Projects state
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [displayDetailsDialog, setDisplayDetailsDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Reports state for selected project
  const [projectReports, setProjectReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Project status options
  // const statusOptions = [
  //   { label: 'All Status', value: 'all' },
  //   { label: 'Completed', value: 'completed' },
  //   { label: 'Ongoing', value: 'ongoing' },
  //   { label: 'Hold', value: 'hold' },
  // ];

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

  useEffect(() => {
    localStorage.setItem('clientActiveTab', activeTab);
    localStorage.setItem('clientActiveNav', activeNav);

    if (activeTab === 'projects') {
      fetchMyProjects();
    }
  }, [activeTab, activeNav]);

  // Handle opening project details

  // Fetch reports for a specific project
  const fetchProjectReports = async (projectId) => {
    setReportsLoading(true);
    try {
      const response = await api.get('/reports');
      // Filter reports for this project
      const reports = response.data.filter(r => r.project_id === projectId && !r.isDeleted);
      setProjectReports(reports);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      setProjectReports([]);
    } finally {
      setReportsLoading(false);
    }
  };

  const openProjectDetails = (project) => {
    setSelectedProject(project);
    setDisplayDetailsDialog(true);
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

  // Status badge template
  const statusTemplate = (rowData) => {
    let status = 'Pending';
    let severity = 'warning';

    if (rowData.project_status === 'done') {
      status = 'Completed';
      severity = 'success';
    } else if (rowData.project_status === 'ongoing') {
      status = 'Ongoing';
      severity = 'info';
    } else if (rowData.project_status === 'hold') {
      status = 'On Hold';
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

                  {/* <Dropdown
                    value={statusFilter}
                    options={statusOptions}
                    onChange={(e) => setStatusFilter(e.value)}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Filter by status"
                    style={{ minWidth: '200px' }}
                  /> */}
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
                          projects.filter((p) => p.project_status === 'ongoing')
                            .length
                        }
                      </h3>
                      <p>Ongoing</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <i className="pi pi-pause-circle" style={{ color: 'red' }} />
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
                  field="contractor_id"
                  header="Contractor"
                  body={rowData => getContractorName(rowData.contractor_id)}
                  sortable
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
        header={null}
        visible={displayDetailsDialog}
        style={{ width: '70vw', maxHeight: '90vh' }}
        onHide={() => setDisplayDetailsDialog(false)}
      >
        {selectedProject && (
          <div
            className="project-details-modal"
            style={{
              maxHeight: 'calc(100vh -100px)',
              overflowY: 'auto',
              padding: '1.5rem ',
            }}
          >
            {/* Header */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                background: '#4f4d36',
                color: 'white',
                borderTopLeftRadius: '4px',
                borderTopRightRadius: '4px',
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                padding: '1.5rem 0 1.25rem 0',
                textAlign: 'left',
                boxShadow: '0 2px 8px rgba(5, 150, 105, 0.08)',
                zIndex: 2
              }}
            >
              <button
                onClick={() => setDisplayDetailsDialog(false)}
                aria-label="Close"
                style={{
                  position: 'absolute',
                  top: '1.25rem',
                  right: '1.5rem',
                  background: 'rgb(0,0,0,0)',
                  border: 'none',
                  color: 'white',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  borderRadius: '50%',
                  width: '2.5rem',
                  height: '2.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s',
                  zIndex: 10
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.18)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(0,0,0,0.08)'}
              >
                ×
              </button>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  fontFamily: "'Source Serif Pro', serif",
                  letterSpacing: '0.5px',
                  marginLeft: '1rem'
                }}
              >
                Project Details
              </h3>
            </div>
            <div style={{ height: '3rem' }} />

            {/* Two Column Layout */}
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '2rem',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              background: '#AEAC8C',
              padding: '1rem',
              borderRadius: '1rem'
            }}>
              <div className="image-container"
                style={{
                  border: '2px solid #404A17',
                  borderRadius: '1rem',
                  height: '40%',
                  width: '40%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f8f8f8',
                  overflow: 'hidden'
                }}>
                {(() => {
                 const reportWithImages = projectReports.find(r => r.image_urls && r.image_urls.length > 0);

                 if (reportWithImages) {
                  const firstRawUrl = reportWithImages.image_urls[0];

                  const formattedUrl = getImageUrl(firstRawUrl);
                  return (
                    <img 
                      src={formattedUrl} 
                      alt="Project Progress" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '100%', 
                        objectFit: 'cover' // 'cover' fills the area nicely, 'contain' shows the whole image
                      }} 
                      // Error handling in case the URL is broken
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300?text=Image+Error';
                      }}
                    />
                  );
                 }
                })()}
              </div>
              <div className="details-container" style={{
                display: 'flex',
                flexDirection: 'column'
              }}>
                <label htmlFor="project_name">Project Name: </label>
                <InputText
                  name="project_name" 
                  value={selectedProject.project_name}
                  disabled>
                </InputText>
                <label htmlFor="project_name">Contractor: </label>
                <InputText
                  name="project_contractor"
                  value={getContractorName(selectedProject.contractor_id)}
                  disabled>
                </InputText>
                <label htmlFor="project_name">Project Amount: </label>
                <InputNumber
                  name="project_amount"
                  value={selectedProject.total_amount}
                  disabled
                  prefix='₱'
                  type='decimal'
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  locale="en-PH">
                </InputNumber>
                <label htmlFor="project_start_date">Project Start Date:</label>
                <InputText
                  name="project_start_date"
                  disabled
                  value={selectedProject?.project_start_date 
                    ? new Date(selectedProject.project_start_date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })
                    : ''
                  }>
                </InputText>
                <label htmlFor="project_completion_rate">Completion Rate:</label>
                <div style={{ display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem',  
                    backgroundColor: 'rgb(160,160,160)', 
                    padding: '0.5rem', 
                    borderRadius: '0.25rem' }}>
                  <Slider value={selectedProject.completion_rate || 0} min={0} max={100} disabled style={{ width: '150px' }} />
                  <span style={{ fontWeight: 'bold' }}>{selectedProject.completion_rate || 0}%</span>
                </div>
              </div>
            </div>
            {/*PROJECT REPORTS TABLE DISABLED TEMPORARILY*/}
          <div style={{ marginTop: '2rem', 
              background: '#AEAC8C', 
              padding: '1rem',
              borderRadius: '1rem' }}>
              <h2  style={{
                fontWeight: 'bold',
                color: '#404A17'
              }}>ACCOMPLISHMENTS</h2>
              <DataTable
                value={projectReports}
                loading={reportsLoading}
                emptyMessage="No reports generated for this project."
                tableStyle={{ minWidth: '40rem' }}
                responsiveLayout="scroll"
              >
                <Column
                  field="report_date"
                  header="Date Generated"
                  body={rowData => rowData.report_date ? new Date(rowData.report_date).toLocaleDateString() : 'N/A'}
                  sortable
                />
                <Column
                  header="Contractor Name"
                  body={() => getContractorName(selectedProject?.contractor_id)}
                />
                <Column
                  field="payment_requested"
                  header="Payment"
                  body={rowData => rowData.payment_requested ? `₱${parseFloat(rowData.payment_requested).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
                  sortable
                />
                <Column
                  header="Project Status"
                  body={() => {
                    let status = 'Ongoing';
                    let severity = 'warning';
                    if (selectedProject?.project_status === 'completed') {
                      status = 'Completed';
                      severity = 'success';
                    } else if (selectedProject?.project_status === 'active') {
                      status = 'Active';
                      severity = 'info';
                    } else if (selectedProject?.project_status === 'cancelled') {
                      status = 'Cancelled';
                      severity = 'danger';
                    }
                    return <Tag value={status} severity={severity} />;
                  }}
                />
                <Column
                  header="Export"
                  body={(rowData) => (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button  icon="pi pi-file-pdf" className="p-button-sm p-button-danger" onClick={() => downloadReportPDF(rowData)} tooltip="Save as PDF" />
                      <Button  icon="pi pi-file-excel" className="p-button-sm p-button-success" onClick={handleSaveAsCSV} tooltip="Save as CSV" />
                    </div>
                  )}
                />
              </DataTable>
            </div>
          </div>
        )}

        <div
          style={{
            padding: '1rem 2rem',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.5rem',
          }}
        >
          <Button
            label="Close"
            severity="secondary"
            style={{
              padding: '0.5rem'
            }}
            onClick={() => setDisplayDetailsDialog(false)}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default ClientDashboard;

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { ProgressBar } from 'primereact/progressbar';
import { Paginator } from 'primereact/paginator';
import { Toast } from 'primereact/toast';
import ReportsPanel from './ReportsPanel';
import api from '../../../services/api';
import './ProjectDashboardPanel.css';

// ============================================
// PROJECT DASHBOARD PANEL
// View a particular project and its sub-projects
// ============================================

const ProjectDashboardPanel = () => {
  const [projects, setProjects] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [clients, setClients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [reportsVersion, setReportsVersion] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  const [selectedClientGroup, setSelectedClientGroup] = useState(null);
  const [displaySubProjectDialog, setDisplaySubProjectDialog] = useState(false);
  const [displayReportsDialog, setDisplayReportsDialog] = useState(false);
  const [reportsProject, setReportsProject] = useState(null);
  const [subProjectFirst, setSubProjectFirst] = useState(0);
  const [subProjectRows, setSubProjectRows] = useState(6);
  const [newSubProject, setNewSubProject] = useState({
    name: '',
    description: '',
    amount: '',
    dueDate: null,
    contractor_id: null,
    client_id: null,
    category_id: null,
    project_status: 'Ongoing',
    parent_project_id: null,
  });
  const toast = useRef(null);

  const normalizeId = (value) =>
    value !== null && value !== undefined
      ? String(value).trim().toLowerCase()
      : '';

  useEffect(() => {
    const loadData = async () => {
      await fetchUsers();
      await fetchProjects();
      await fetchCategories();
      await fetchReports();
    };
    loadData();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects');
      const active = response.data.filter(
        (project) => project.isDeleted !== true,
      );
      setProjects(active);
      const mainProjects = active.filter(
        (project) => !project.parent_project_id,
      );
      if (!selectedProject && mainProjects.length === 0) {
        setSelectedProject(null);
      }
    } catch (error) {
      console.error('Fetch projects error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail:
          error.response?.data?.message ||
          error.message ||
          'Failed to load projects',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setContractors(
        response.data.filter((user) => user.user_role === 'contractor'),
      );
      setClients(response.data.filter((user) => user.user_role === 'client'));
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load users',
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load categories',
      });
    }
  };

  const fetchReports = async () => {
    try {
      const response = await api.get('/reports');
      setReports(response.data);
      setReportsVersion((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load reports',
      });
    }
  };

  const getClientName = (clientId) => {
    if (!clientId) return 'N/A';
    const client = clients?.find((c) => c?.user_id === clientId);
    return client && client.first_name && client.last_name
      ? `${client.first_name} ${client.last_name}`
      : 'N/A';
  };

  const getContractorName = (contractorId) => {
    if (!contractorId) return 'N/A';
    const contractor = contractors?.find((c) => c?.user_id === contractorId);
    return contractor && contractor.first_name && contractor.last_name
      ? `${contractor.first_name} ${contractor.last_name}`
      : 'N/A';
  };

  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'N/A';
    const category = categories?.find(
      (item) => item?.category_id === categoryId,
    );
    return category?.category_name || 'N/A';
  };

  const amountTemplate = (rowData) => {
    if (!rowData.total_amount) return 'N/A';
    return `₱${parseFloat(rowData.total_amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const dateTemplate = (rowData) => {
    if (!rowData.project_deadline) return 'N/A';
    return new Date(rowData.project_deadline).toLocaleDateString();
  };

  const isProjectCompleted = (rowData, completionValue) => {
    const status = rowData?.project_status || '';
    const normalized = String(status).toLowerCase().trim();
    if (normalized === 'done' || normalized === 'completed') return true;
    if (typeof completionValue === 'number' && completionValue >= 100) {
      return true;
    }
    return false;
  };

  const getDaysRemainingInfo = (rowData, completionValue) => {
    if (isProjectCompleted(rowData, completionValue)) {
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
    if (remaining <= 10) return { text, color: '#f59e0b' };

    return { text, color: '#0f766e' };
  };

  const getStatusMeta = (rowData) => {
    const status = rowData?.project_status || 'Ongoing';
    const normalized = String(status).toLowerCase().trim();

    const statusClass =
      normalized === 'done' || normalized === 'completed'
        ? 'status-done'
        : normalized === 'hold' || normalized === 'on hold'
          ? 'status-hold'
          : 'status-ongoing';

    const color =
      statusClass === 'status-done'
        ? '#16a34a'
        : statusClass === 'status-hold'
          ? '#eab308'
          : '#f97316';

    return { status, statusClass, color };
  };

  const statusTemplate = (rowData) => {
    const { status, statusClass, color } = getStatusMeta(rowData);
    return (
      <span
        className={`project-status-badge ${statusClass}`}
        style={{ backgroundColor: color, color: '#ffffff' }}
      >
        {status}
      </span>
    );
  };

  const mainProjects = projects.filter(
    (project) => !project.parent_project_id,
  );

  const filteredMainProjects = !searchQuery.trim()
    ? mainProjects
    : mainProjects.filter((project) => {
        const query = searchQuery.toLowerCase();
        const mainMatch =
          project.project_name?.toLowerCase().includes(query) ||
          project.project_description?.toLowerCase().includes(query) ||
          getClientName(project.client_id).toLowerCase().includes(query) ||
          getContractorName(project.contractor_id).toLowerCase().includes(query);

        if (mainMatch) return true;

        const childMatch = projects.some((child) => {
          if (child.parent_project_id !== project.project_id) return false;
          return (
            child.project_name?.toLowerCase().includes(query) ||
            child.project_description?.toLowerCase().includes(query) ||
            getClientName(child.client_id).toLowerCase().includes(query) ||
            getContractorName(child.contractor_id).toLowerCase().includes(query)
          );
        });

        return childMatch;
      });

  const groupedMainProjects = useMemo(() => {
    const grouped = new Map();

    filteredMainProjects.forEach((project) => {
      const clientName = getClientName(project.client_id) || 'Unassigned';
      if (!grouped.has(clientName)) {
        grouped.set(clientName, []);
      }
      grouped.get(clientName).push(project);
    });

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([clientName, projects]) => ({ clientName, projects }));
  }, [filteredMainProjects, clients]);

  const subProjects = selectedProject
    ? projects.filter(
        (project) => project.parent_project_id === selectedProject.project_id,
      )
    : [];

  const pagedSubProjects = useMemo(() => {
    const start = subProjectFirst;
    const end = subProjectFirst + subProjectRows;
    return subProjects.slice(start, end);
  }, [subProjects, subProjectFirst, subProjectRows]);

  const completionByProjectId = useMemo(() => {
    const map = new Map();

    reports.forEach((report) => {
      const reportProjectId =
        report?.project_id?.project_id ||
        report?.project_id?.id ||
        report?.project_id ||
        report?.project?.project_id ||
        report?.project?.id;
      const key = normalizeId(reportProjectId);
      if (!key) return;
      const progress = Number(report.current_progress || 0);
      const currentMax = map.get(key) || 0;
      if (progress > currentMax) map.set(key, progress);
    });

    return map;
  }, [reports]);

  useEffect(() => {
    if (!selectedProject) {
      setCompletionRate(0);
      return;
    }
    if (!subProjects.length) {
      setCompletionRate(0);
      return;
    }
    const total = subProjects.reduce(
      (sum, project) => sum + getCompletionRateForProject(project.project_id),
      0,
    );
    const avg = Math.round(total / subProjects.length);
    setCompletionRate(avg);
  }, [selectedProject?.project_id, subProjects, reports]);

  const getCompletionRateForProject = (projectId) => {
    if (!projectId) return 0;

    const targetId = normalizeId(projectId);
    const maxProgress = completionByProjectId.get(targetId) || 0;

    return maxProgress;
  };

  useEffect(() => {
    if (!selectedProject) return;
    if (!selectedProject.parent_project_id) return;
    const parent = projects.find(
      (project) => project.project_id === selectedProject.parent_project_id,
    );
    if (parent) {
      setSelectedProject(parent);
      return;
    }
    setSelectedProject(null);
  }, [projects]);

  useEffect(() => {
    if (!selectedProject) return;
    setSubProjectFirst(0);
  }, [selectedProject?.project_id]);

  useEffect(() => {
    if (subProjectFirst >= subProjects.length && subProjects.length > 0) {
      setSubProjectFirst(0);
    }
  }, [subProjectFirst, subProjects.length]);

  const openSubProjectDialog = () => {
    if (!selectedProject) return;
    setNewSubProject({
      name: '',
      description: '',
      amount: '',
      dueDate: null,
      contractor_id: null,
      client_id: selectedProject.client_id || null,
      category_id: null,
      project_status: 'Ongoing',
      parent_project_id: selectedProject.project_id,
    });
    setDisplaySubProjectDialog(true);
  };

  const handleAddSubProject = async () => {
    if (!newSubProject.name.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Sub-project name is required',
      });
      return;
    }

    const parentTotal = Number(selectedProject?.total_amount || 0);
    const newAmount = Number(newSubProject.amount || 0);
    const existingSubTotal = subProjects.reduce(
      (sum, project) => sum + Number(project.total_amount || 0),
      0,
    );
    if (parentTotal > 0 && existingSubTotal + newAmount > parentTotal) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Sub-project amount exceeds the parent project total',
      });
      return;
    }

    if (newSubProject.dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(newSubProject.dueDate);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Warning',
          detail: 'Due date cannot be before today',
        });
        return;
      }
    }

    try {
      setLoading(true);
      await api.post('/projects', {
        project_name: newSubProject.name,
        project_description: newSubProject.description,
        total_amount: newSubProject.amount,
        project_deadline: newSubProject.dueDate,
        contractor_id: newSubProject.contractor_id,
        client_id: newSubProject.client_id,
        category_id: newSubProject.category_id,
        project_status: 'Ongoing',
        parent_project_id: newSubProject.parent_project_id,
      });

      setDisplaySubProjectDialog(false);
      setNewSubProject({
        name: '',
        description: '',
        amount: '',
        dueDate: null,
        contractor_id: null,
        client_id: null,
        category_id: null,
        project_status: 'Ongoing',
        parent_project_id: null,
      });

      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Sub-project created successfully',
      });

      fetchProjects();
    } catch (error) {
      console.error('Create sub-project error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail:
          error.response?.data?.message ||
          error.message ||
          'Failed to create sub-project',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel-container">
      <Toast ref={toast} />

      <div className="project-dashboard-header mb-6">
        <div>
          <h2 className="m-0">Project Dashboard</h2>
          <p className="text-color-secondary m-0">
            Select a project to view its details and projects
          </p>
        </div>
        <div className="project-dashboard-search-group">
          <div className="project-dashboard-search project-dashboard-search-top">
            <i className="pi pi-search" />
            <InputText
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {searchQuery.trim() && (
            <div className="project-dashboard-results">
              {filteredMainProjects.length === 0 ? (
                <div className="project-dashboard-result-empty">
                  No projects found.
                </div>
              ) : (
                filteredMainProjects.slice(0, 6).map((project) => (
                  <button
                    key={project.project_id}
                    type="button"
                    className={`project-dashboard-result-item ${
                      selectedProject?.project_id === project.project_id
                        ? 'active'
                        : ''
                    }`}
                    onClick={() => {
                      setSelectedProject(project);
                      setSearchQuery('');
                    }}
                  >
                    <div className="result-title">{project.project_name}</div>
                    <div className="result-subtitle">
                      {getClientName(project.client_id)}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="project-dashboard-stack">
        <div className="project-dashboard-content">
          {selectedProject ? (
            <div className="project-dashboard-card project-dashboard-card-linked">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
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
                  <div>{getClientName(selectedProject.client_id)}</div>
                </div>
                {/* <div>
                  <div className="metric-label">Contractor</div>
                  <div>{getContractorName(selectedProject.contractor_id)}</div>
                </div> */}
                <div>
                  <div className="metric-label">Contract Amount</div>
                  <div>{amountTemplate(selectedProject)}</div>
                </div>
                <div>
                  <div className="metric-label">Due Date</div>
                  <div>{dateTemplate(selectedProject)}</div>
                </div>
                <div>
                  <div className="metric-label">Days Remaining</div>
                  <div
                    style={{
                      color: getDaysRemainingInfo(selectedProject, completionRate)
                        .color,
                    }}
                  >
                    {getDaysRemainingInfo(selectedProject, completionRate).text}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <div className="metric-label">Completion Rate</div>
                <ProgressBar
                  value={completionRate}
                  className="report-progress-bar"
                  style={{
                    '--progress-color': getStatusMeta(selectedProject).color,
                  }}
                />
                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                  {completionRate}% complete
                </div>
              </div>

              <div className="project-dashboard-divider" />

              <div className="project-dashboard-card-header">
                <div>
                  <h4>Projects</h4>
                  <span className="text-muted">
                    {subProjects.length} total
                  </span>
                </div>
                <Button
                  label="Add Project"
                  icon="pi pi-plus"
                  severity="info"
                  onClick={openSubProjectDialog}
                  className="p-button-sm"
                />
              </div>
              {subProjects.length === 0 ? (
                <div className="project-dashboard-empty">
                  No projects found.
                </div>
              ) : (
                <div
                  className="subproject-grid"
                  key={`subprojects-${selectedProject?.project_id || 'none'}-${reportsVersion}`}
                >
                  {pagedSubProjects.map((subproject) => {
                    const rate = getCompletionRateForProject(
                      subproject.project_id,
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
                          {subproject.project_description || 'No description'}
                        </p>
                        <div className="subproject-progress">
                          <ProgressBar
                            value={rate}
                            className="report-progress-bar"
                            style={{
                              height: '12px',
                              '--progress-color': getStatusMeta(subproject)
                                .color,
                            }}
                          />
                          <div className="subproject-progress-text">
                            {rate}% complete
                          </div>
                        </div>
                        <div className="subproject-meta">
                          <div>
                            <div className="metric-label">Contractor</div>
                            <div>
                              {getContractorName(subproject.contractor_id)}
                            </div>
                          </div>
                          <div>
                            <div className="metric-label">Category</div>
                            <div>{getCategoryName(subproject.category_id)}</div>
                          </div>
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
                            <div
                              style={{
                                color: getDaysRemainingInfo(subproject, rate)
                                  .color,
                              }}
                            >
                              {getDaysRemainingInfo(subproject, rate).text}
                            </div>
                          </div>
                        </div>
                        <div className="subproject-actions">
                          <Button
                            icon="pi pi-file"
                            label="Billings"
                            severity="secondary"
                            className="p-button-sm"
                            style={{ backgroundColor: '#404a17', color: '#ffffff' }}
                            onClick={() => {
                              setReportsProject(subproject);
                              setDisplayReportsDialog(true);
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {subProjects.length > 0 && (
                <Paginator
                  className="subproject-paginator"
                  first={subProjectFirst}
                  rows={subProjectRows}
                  totalRecords={subProjects.length}
                  rowsPerPageOptions={[6, 9, 12]}
                  onPageChange={(event) => {
                    setSubProjectFirst(event.first);
                    setSubProjectRows(event.rows);
                  }}
                />
              )}

              <div className="project-dashboard-divider" />

              <div className="project-dashboard-card-header">
                <div>
                  <h4>Billing</h4>
                  <span className="text-muted">
                    Generate and review project billing
                  </span>
                </div>
                <Button
                  label="Open Billings"
                  icon="pi pi-file"
                  severity="info"
                  onClick={() => {
                    setReportsProject(selectedProject);
                    setDisplayReportsDialog(true);
                  }}
                  className="p-button-sm"
                />
              </div>
            </div>
          ) : (
            <div className="project-dashboard-list">
              {filteredMainProjects.length === 0 ? (
                <div className="project-dashboard-empty">
                  No projects found.
                </div>
              ) : (
                <div className="project-dashboard-groups">
                  {!selectedClientGroup ? (
                    <div className="project-dashboard-grid">
                      {groupedMainProjects.map((group) => (
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
                            onClick={() => setSelectedProject(project)}
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
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog
        visible={displaySubProjectDialog}
        style={{ width: '90vw', maxWidth: '500px' }}
        header="Add Project"
        contentStyle={{ padding: '1.5rem 2rem' }}
        modal
        onHide={() => setDisplaySubProjectDialog(false)}
        className="p-fluid"
        headerStyle={{
          backgroundColor: '#404a17',
          color: 'white',
          padding: '1rem',
        }}
      >
        <div className="field mt-2">
          <label
            htmlFor="parent-project"
            style={{ color: '#404a17', fontWeight: '600' }}
          >
            Parent Project
          </label>
          <InputText
            id="parent-project"
            value={selectedProject?.project_name || ''}
            disabled
            style={{ borderColor: '#cbd5e1' }}
          />
        </div>

        <div className="field mt-3">
          <label
            htmlFor="sub-project-name"
            style={{ color: '#404a17', fontWeight: '600' }}
          >
            Project Name *
          </label>
          <InputText
            id="sub-project-name"
            value={newSubProject.name}
            onChange={(e) =>
              setNewSubProject({ ...newSubProject, name: e.target.value })
            }
            placeholder="Enter sub-project name"
            style={{ borderColor: '#cbd5e1' }}
          />
        </div>

        <div className="field mt-3">
          <label
            htmlFor="sub-project-description"
            style={{ color: '#404a17', fontWeight: '600' }}
          >
            Description
          </label>
          <InputTextarea
            id="sub-project-description"
            value={newSubProject.description}
            onChange={(e) =>
              setNewSubProject({
                ...newSubProject,
                description: e.target.value,
              })
            }
            placeholder="Enter sub-project description"
            rows={4}
            style={{ borderColor: '#cbd5e1' }}
          />
        </div>

        <div className="field mt-3">
          <label
            htmlFor="sub-project-amount"
            style={{ color: '#404a17', fontWeight: '600' }}
          >
            Project Contract Amount
          </label>
          <InputNumber
            id="sub-project-amount"
            value={newSubProject.amount ? Number(newSubProject.amount) : null}
            onValueChange={(e) =>
              setNewSubProject({ ...newSubProject, amount: e.value || '' })
            }
            placeholder="Enter project contract amount"
            prefix="₱ "
            thousandSeparator=","
            minFractionDigits={2}
            maxFractionDigits={2}
            style={{ borderColor: '#cbd5e1' }}
          />
        </div>

        <div className="field mt-3">
          <label
            htmlFor="sub-project-category"
            style={{ color: '#404a17', fontWeight: '600' }}
          >
            Category
          </label>
          <Dropdown
            id="sub-project-category"
            value={newSubProject.category_id}
            onChange={(e) =>
              setNewSubProject({ ...newSubProject, category_id: e.value })
            }
            options={categories}
            optionLabel="category_name"
            optionValue="category_id"
            placeholder="Select a category"
            style={{ borderColor: '#cbd5e1' }}
          />
        </div>

        <div className="field mt-3">
          <label
            htmlFor="sub-project-due-date"
            style={{ color: '#404a17', fontWeight: '600' }}
          >
            Due Date
          </label>
          <Calendar
            id="sub-project-due-date"
            value={newSubProject.dueDate}
            onChange={(e) =>
              setNewSubProject({ ...newSubProject, dueDate: e.value })
            }
            dateFormat="mm/dd/yy"
            placeholder="Select due date"
            style={{ borderColor: '#cbd5e1' }}
            className="w-full"
            minDate={new Date()}
          />
        </div>

        <div className="field mt-3">
          <label
            htmlFor="sub-project-contractor"
            style={{ color: '#404a17', fontWeight: '600' }}
          >
            Contractor
          </label>
          <Dropdown
            id="sub-project-contractor"
            value={newSubProject.contractor_id}
            onChange={(e) =>
              setNewSubProject({ ...newSubProject, contractor_id: e.value })
            }
            options={contractors}
            optionLabel={(option) => `${option.first_name} ${option.last_name}`}
            optionValue="user_id"
            placeholder="Select a contractor"
            style={{ borderColor: '#cbd5e1' }}
          />
        </div>

        <div className="field mt-3">
          <label
            htmlFor="sub-project-client"
            style={{ color: '#404a17', fontWeight: '600' }}
          >
            Client
          </label>
          <Dropdown
            id="sub-project-client"
            value={newSubProject.client_id}
            onChange={(e) =>
              setNewSubProject({ ...newSubProject, client_id: e.value })
            }
            options={clients}
            optionLabel={(option) => `${option.first_name} ${option.last_name}`}
            optionValue="user_id"
            placeholder="Select a client"
            style={{ borderColor: '#cbd5e1' }}
            disabled
          />
        </div>

        <div className="flex justify-content-center mt-5">
          <Button
            label="Create"
            onClick={handleAddSubProject}
            loading={loading}
            className="modal-primary-btn"
          />
        </div>
      </Dialog>

      <Dialog
        visible={displayReportsDialog}
        style={{ width: '95vw', maxWidth: '1100px' }}
        header="Project Billing"
        contentStyle={{ padding: '1.25rem 1.5rem' }}
        modal
        onHide={() => {
          setDisplayReportsDialog(false);
          setReportsProject(null);
          fetchReports();
        }}
        className="p-fluid"
        headerStyle={{
          backgroundColor: '#404a17',
          color: 'white',
          padding: '1rem',
        }}
      >
        {reportsProject ? (
          <ReportsPanel
            embedded
            embeddedProjectId={reportsProject.project_id}
            onReportsChanged={fetchReports}
          />
        ) : (
          <p style={{ margin: 0 }}>Select a project to view billing.</p>
        )}
      </Dialog>
    </div>
  );
};

export default ProjectDashboardPanel;

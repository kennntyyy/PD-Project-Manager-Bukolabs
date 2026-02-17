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
    startDate: null,
    endDate: null,
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

  const formatDateValue = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString();
  };

  const getProjectDateRange = (rowData) => {
    const startText = formatDateValue(rowData?.project_start_date);
    const endText = formatDateValue(rowData?.project_deadline);
    if (startText === 'N/A' && endText === 'N/A') return 'N/A';
    return `${startText} - ${endText}`;
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

  const mainProjects = projects.filter((project) => !project.parent_project_id);

  const filteredMainProjects = !searchQuery.trim()
    ? mainProjects
    : mainProjects.filter((project) => {
        const query = searchQuery.toLowerCase();
        const mainMatch =
          project.project_name?.toLowerCase().includes(query) ||
          project.project_description?.toLowerCase().includes(query) ||
          getClientName(project.client_id).toLowerCase().includes(query) ||
          getContractorName(project.contractor_id)
            .toLowerCase()
            .includes(query);

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

  const getChartData = useMemo(() => {
    if (!subProjects.length) return [];

    // Get all start and end dates
    const allDates = [];
    subProjects.forEach((project) => {
      if (project.project_start_date)
        allDates.push(new Date(project.project_start_date));
      if (project.project_deadline)
        allDates.push(new Date(project.project_deadline));
      if (project.created_at) allDates.push(new Date(project.created_at));
    });

    if (allDates.length === 0) return [];

    // Find min and max dates
    let minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
    let maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

    // Ensure we show at least 6 months of range
    const monthDiff =
      (maxDate.getFullYear() - minDate.getFullYear()) * 12 +
      (maxDate.getMonth() - minDate.getMonth());
    if (monthDiff < 6) {
      maxDate = new Date(minDate);
      maxDate.setMonth(maxDate.getMonth() + 6);
    }

    // Generate array of months between min and max with year
    const months = [];
    const current = new Date(minDate);
    current.setDate(1);

    while (current <= maxDate) {
      const monthStr = current.toLocaleString('default', {
        month: 'short',
      });
      months.push({ label: monthStr, date: new Date(current) });
      current.setMonth(current.getMonth() + 1);
    }

    // Create line chart data - one entry per month showing average project count
    const chartData = months.map(({ label, date }, monthIndex) => {
      const monthDate = new Date(date);
      monthDate.setDate(1);
      const monthEndDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      // Count projects active in this month
      let activeProjectCount = 0;
      subProjects.forEach((project) => {
        const startDate = project.project_start_date
          ? new Date(project.project_start_date)
          : minDate;
        const endDate = project.project_deadline
          ? new Date(project.project_deadline)
          : maxDate;

        if (startDate <= monthEndDate && endDate >= monthDate) {
          activeProjectCount++;
        }
      });

      return {
        month: label,
        'Active Projects': activeProjectCount,
        'Completion Avg': completionRate,
      };
    });

    return chartData;
  }, [subProjects, completionRate]);

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
      startDate: null,
      endDate: null,
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

    if (!newSubProject.startDate || !newSubProject.endDate) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Start date and end date are required',
      });
      return;
    }

    const startDate = new Date(newSubProject.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(newSubProject.endDate);
    endDate.setHours(0, 0, 0, 0);

    const parentStartDate = selectedProject?.project_start_date
      ? new Date(selectedProject.project_start_date)
      : null;
    const parentEndDate = selectedProject?.project_deadline
      ? new Date(selectedProject.project_deadline)
      : null;

    if (!parentStartDate || !parentEndDate) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Parent project must have start and end dates',
      });
      return;
    }

    parentStartDate.setHours(0, 0, 0, 0);
    parentEndDate.setHours(0, 0, 0, 0);

    if (startDate < parentStartDate || endDate > parentEndDate) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Sub-project dates must be within the parent project dates',
      });
      return;
    }

    if (endDate < startDate) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Warning',
        detail: 'End date cannot be before start date',
      });
      return;
    }

    try {
      setLoading(true);
      await api.post('/projects', {
        project_name: newSubProject.name,
        project_description: newSubProject.description,
        total_amount: newSubProject.amount,
        project_start_date: newSubProject.startDate,
        project_deadline: newSubProject.endDate,
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
        startDate: null,
        endDate: null,
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
                  <div className="metric-label">Start Date</div>
                  <div>
                    {formatDateValue(selectedProject?.project_start_date)}
                  </div>
                </div>
                <div>
                  <div className="metric-label">End Date</div>
                  <div>
                    {formatDateValue(selectedProject?.project_deadline)}
                  </div>
                </div>
                <div>
                  <div className="metric-label">Days Remaining</div>
                  <div
                    style={{
                      color: getDaysRemainingInfo(
                        selectedProject,
                        completionRate,
                      ).color,
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

              {getChartData && getChartData.length > 0 && (
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
                      OVERALL PROGRESS
                    </div>
                    <div
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: '700',
                        color: '#1f2937',
                        fontFamily: '"Source Serif Pro", serif',
                      }}
                    >
                      {completionRate}%
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
                        width: `${completionRate}%`,
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
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={getChartData}>
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
                          dataKey="Active Projects"
                          stroke="#10B981"
                          strokeWidth={2}
                          dot={{ fill: '#10B981', r: 5 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Completion Avg"
                          stroke="#F59E0B"
                          strokeWidth={2}
                          dot={{ fill: '#F59E0B', r: 5 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="project-dashboard-divider" />

              <div className="project-dashboard-card-header">
                <div>
                  <h4>Projects</h4>
                  <span className="text-muted">{subProjects.length} total</span>
                </div>
                <Button
                  label="Add Project"
                  icon="pi pi-plus"
                  severity="info"
                  onClick={openSubProjectDialog}
                  style={{
                    backgroundColor: '#4A4A3A',
                    color: '#ffffff',
                  }}
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
                              '--progress-color':
                                getStatusMeta(subproject).color,
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
                            <div className="metric-label">Start Date</div>
                            <div>
                              {formatDateValue(subproject?.project_start_date)}
                            </div>
                          </div>
                          <div>
                            <div className="metric-label">End Date</div>
                            <div>
                              {formatDateValue(subproject?.project_deadline)}
                            </div>
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
                            style={{
                              backgroundColor: '#4A4A3A',
                              color: '#ffffff',
                            }}
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
                  style={{
                    backgroundColor: '#4A4A3A',
                    color: '#ffffff',
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
                            {selectedClientGroup.projects.length !== 1
                              ? 's'
                              : ''}
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
                                <span className="metric-label">
                                  Contract Amount
                                </span>
                                <div>{amountTemplate(project)}</div>
                              </div>
                              <div>
                                <span className="metric-label">Date Range</span>
                                <div>{getProjectDateRange(project)}</div>
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
          backgroundColor: '#4A4A3A',
          color: 'white',
          padding: '1rem',
        }}
      >
        <div className="field mt-2">
          <label
            htmlFor="parent-project"
            style={{ color: '#4A4A3A', fontWeight: '600' }}
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
            style={{ color: '#4A4A3A', fontWeight: '600' }}
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
            style={{ color: '#4A4A3A', fontWeight: '600' }}
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
            style={{ color: '#4A4A3A', fontWeight: '600' }}
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
            style={{ color: '#4A4A3A', fontWeight: '600' }}
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
            htmlFor="sub-project-start-date"
            style={{ color: '#4A4A3A', fontWeight: '600' }}
          >
            Start Date
          </label>
          <Calendar
            id="sub-project-start-date"
            value={newSubProject.startDate}
            onChange={(e) =>
              setNewSubProject({ ...newSubProject, startDate: e.value })
            }
            dateFormat="mm/dd/yy"
            placeholder="Select start date"
            style={{ borderColor: '#cbd5e1' }}
            className="w-full"
            minDate={
              selectedProject?.project_start_date
                ? new Date(selectedProject.project_start_date)
                : null
            }
            maxDate={
              selectedProject?.project_deadline
                ? new Date(selectedProject.project_deadline)
                : null
            }
          />
        </div>

        <div className="field mt-3">
          <label
            htmlFor="sub-project-end-date"
            style={{ color: '#4A4A3A', fontWeight: '600' }}
          >
            End Date
          </label>
          <Calendar
            id="sub-project-end-date"
            value={newSubProject.endDate}
            onChange={(e) =>
              setNewSubProject({ ...newSubProject, endDate: e.value })
            }
            dateFormat="mm/dd/yy"
            placeholder="Select end date"
            style={{ borderColor: '#cbd5e1' }}
            className="w-full"
            minDate={
              newSubProject.startDate ||
              (selectedProject?.project_start_date
                ? new Date(selectedProject.project_start_date)
                : null)
            }
            maxDate={
              selectedProject?.project_deadline
                ? new Date(selectedProject.project_deadline)
                : null
            }
          />
        </div>

        <div className="field mt-3">
          <label
            htmlFor="sub-project-contractor"
            style={{ color: '#4A4A3A', fontWeight: '600' }}
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
            style={{ color: '#4A4A3A', fontWeight: '600' }}
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
          backgroundColor: '#4A4A3A',
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

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
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
  const [isEditingTotalValue, setIsEditingTotalValue] = useState(false);
  const [totalValueDraft, setTotalValueDraft] = useState(0);
  const [selectedClientGroup, setSelectedClientGroup] = useState(null);
  const [displaySubProjectDialog, setDisplaySubProjectDialog] = useState(false);
  const [editingSubProject, setEditingSubProject] = useState(null);
  const [displayReportsDialog, setDisplayReportsDialog] = useState(false);
  const [reportsProject, setReportsProject] = useState(null);
  const [subProjectViewMode, setSubProjectViewMode] = useState('active');
  const [subProjectFirst, setSubProjectFirst] = useState(0);
  const [subProjectRows, setSubProjectRows] = useState(6);
  const [displayHistoryDialog, setDisplayHistoryDialog] = useState(false);
  const [projectHistory, setProjectHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
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

  const getEmptySubProjectState = (parent = null) => ({
    name: '',
    description: '',
    amount: '',
    startDate: null,
    endDate: null,
    contractor_id: null,
    client_id: parent?.client_id || null,
    category_id: null,
    project_status: 'Ongoing',
    parent_project_id: parent?.project_id || null,
  });

  const normalizeId = (value) =>
    value !== null && value !== undefined
      ? String(value).trim().toLowerCase()
      : '';

  const getReportProjectId = (report) =>
    report?.project_id?.project_id ||
    report?.project_id?.id ||
    report?.project_id ||
    report?.project?.project_id ||
    report?.project?.id ||
    null;

  const isReportPaid = (report) => {
    const value = report?.payment_triggered;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return (
        normalized === 'true' ||
        normalized === '1' ||
        normalized === 'paid' ||
        normalized === 'yes'
      );
    }
    return Boolean(value);
  };

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
      const response = await api.get('/projects?includeDeleted=true');
      const allProjects = response.data || [];
      setProjects(allProjects);
      const mainProjects = allProjects.filter(
        (project) => !project.parent_project_id && project.isDeleted !== true,
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
      // Refresh project history if dialog is open
      if (displayHistoryDialog && selectedProject) {
        fetchProjectHistory(selectedProject.project_id);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load reports',
      });
    }
  };

  const fetchProjectHistory = async (projectId) => {
    try {
      setHistoryLoading(true);
      // Use project_id parameter to get all project-related logs including subprojects and reports
      const response = await api.get(`/audit-logs?project_id=${projectId}`);
      console.log('[HISTORY] API Response:', {
        projectId,
        responseStatus: response.status,
        data: response.data,
      });

      // Handle different response formats
      let historyData = [];
      if (Array.isArray(response.data)) {
        historyData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        historyData = response.data.data;
      } else if (response.data?.logs && Array.isArray(response.data.logs)) {
        historyData = response.data.logs;
      }

      console.log('[HISTORY] Parsed history data:', {
        count: historyData.length,
        records: historyData,
      });
      setProjectHistory(historyData);
    } catch (error) {
      console.error('[HISTORY] Failed to fetch project history:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load project history',
      });
      setProjectHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const getClientName = (clientId) => {
    if (!clientId) return 'N/A';
    const client = clients?.find((c) => c?.user_id === clientId);
    return client && client.first_name && client.last_name
      ? `${client.first_name} ${client.last_name}`
      : 'N/A';
  };

  const getClientById = (clientId) =>
    clients?.find(
      (client) => normalizeId(client?.user_id) === normalizeId(clientId),
    ) || null;

  const getClientDisplayName = (client) => {
    if (!client) return 'Unassigned';
    const first = client?.first_name?.trim() || '';
    const last = client?.last_name?.trim() || '';
    const fullName = `${first} ${last}`.trim();
    if (fullName) return fullName;
    return client?.username || client?.email || 'Client';
  };

  const getClientInitials = (client) => {
    const displayName = getClientDisplayName(client);
    const parts = displayName.split(' ').filter(Boolean);
    const initials = parts
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase();
    return initials || 'U';
  };

  const getClientProfileSrc = (client) =>
    client?.profile_pic && typeof client.profile_pic === 'string'
      ? `data:image/jpeg;base64,${client.profile_pic}`
      : '';

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

  const formatCurrency = (amount) => {
    if (!amount) return '₱0.00';
    return `₱${Number(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const calculateProjectFinancials = (project) => {
    if (!project || !reports.length) {
      return { totalValue: 0, totalPaid: 0, totalPending: 0, totalUnpaid: 0 };
    }

    const selectedProjectId = normalizeId(project.project_id);
    const relatedProjectIds = new Set([selectedProjectId]);

    projects.forEach((item) => {
      const parentId = normalizeId(item?.parent_project_id);
      if (parentId === selectedProjectId) {
        const subProjectId = normalizeId(item?.project_id);
        if (subProjectId) {
          relatedProjectIds.add(subProjectId);
        }
      }
    });

    const projectReports = reports.filter((report) => {
      if (report?.isDeleted) return false;
      const reportProjectId = normalizeId(getReportProjectId(report));
      return relatedProjectIds.has(reportProjectId);
    });

    let totalPaid = 0;
    let totalPending = 0;

    projectReports.forEach((report) => {
      const amount = Number(report.payment_requested || 0);
      if (isReportPaid(report)) {
        totalPaid += amount;
      } else {
        totalPending += amount;
      }
    });

    const totalValue = Number(project.total_amount || 0);
    const totalUnpaid = Math.max(0, totalValue - totalPaid);

    return { totalValue, totalPaid, totalPending, totalUnpaid };
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
    let status = rowData?.project_status || 'Ongoing';
    let normalized = String(status).toLowerCase().trim();

    // If completion is 100% but status is not Done, update status
    if (rowData && typeof rowData.completionRate === 'number' && rowData.completionRate >= 100 && normalized !== 'done') {
      status = 'Done';
      normalized = 'done';
      rowData.project_status = 'Done';
    }

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

  const getSubProjectStatusCounts = () => {
    let ongoing = 0;
    let onhold = 0;
    let completed = 0;

    activeSubProjects.forEach((project) => {
      const normalized = String(project?.project_status || 'Ongoing')
        .toLowerCase()
        .trim();
      if (normalized === 'done' || normalized === 'completed') {
        completed++;
      } else if (normalized === 'hold' || normalized === 'on hold') {
        onhold++;
      } else {
        ongoing++;
      }
    });

    return { ongoing, onhold, completed };
  };

  const mainProjects = projects.filter(
    (project) => !project.parent_project_id && project.isDeleted !== true,
  );

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
      const client = getClientById(project.client_id);
      const clientKey = client ? normalizeId(client.user_id) : 'unassigned';
      if (!grouped.has(clientKey)) {
        grouped.set(clientKey, { client, projects: [] });
      }
      grouped.get(clientKey).projects.push(project);
    });

    return Array.from(grouped.values())
      .map((group) => ({
        client: group.client,
        clientName: getClientDisplayName(group.client),
        projects: group.projects,
      }))
      .sort((a, b) => a.clientName.localeCompare(b.clientName));
  }, [filteredMainProjects, clients]);

  const allSubProjects = selectedProject
    ? projects.filter(
        (project) => project.parent_project_id === selectedProject.project_id,
      )
    : [];

  const activeSubProjects = allSubProjects.filter(
    (project) => project.isDeleted !== true,
  );

  const deletedSubProjects = allSubProjects.filter(
    (project) => project.isDeleted === true,
  );

  const subProjects =
    subProjectViewMode === 'deleted' ? deletedSubProjects : activeSubProjects;

  const getRemainingBalance = () => {
    const parentTotal = Number(selectedProject?.total_amount || 0);
    const allocatedTotal = activeSubProjects.reduce(
      (sum, project) => sum + Number(project.total_amount || 0),
      0,
    );
    return Math.max(0, parentTotal - allocatedTotal);
  };

  const getSubProjectBalancePreview = () => {
    const parentTotal = Number(selectedProject?.total_amount || 0);
    const inputAmount = Number(newSubProject.amount || 0);

    const allocatedExcludingCurrent = activeSubProjects.reduce(
      (sum, project) => {
        if (
          editingSubProject &&
          normalizeId(project.project_id) ===
            normalizeId(editingSubProject.project_id)
        ) {
          return sum;
        }
        return sum + Number(project.total_amount || 0);
      },
      0,
    );

    return {
      remainingBeforeInput: parentTotal - allocatedExcludingCurrent,
      remainingAfterInput:
        parentTotal - allocatedExcludingCurrent - inputAmount,
    };
  };

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
    if (!activeSubProjects.length) {
      setCompletionRate(0);
      return;
    }
    const total = activeSubProjects.reduce(
      (sum, project) => sum + getCompletionRateForProject(project.project_id),
      0,
    );
    const avg = Math.round(total / activeSubProjects.length);
    setCompletionRate(avg);

    // Auto-update parent project status based on completionRate
    const normalizedStatus = String(selectedProject.project_status || '').toLowerCase().trim();
    if (avg >= 100 && normalizedStatus !== 'done' && normalizedStatus !== 'completed') {
      api.patch(`/projects/${selectedProject.project_id}`, { project_status: 'Done' })
        .then(() => {
          setSelectedProject((prev) => ({ ...prev, project_status: 'Done' }));
          setProjects((prev) => prev.map((proj) =>
            proj.project_id === selectedProject.project_id
              ? { ...proj, project_status: 'Done' }
              : proj
          ));
        })
        .catch((err) => {
          console.error('Failed to update project status to Done:', err);
        });
    } else if (avg < 100 && (normalizedStatus === 'done' || normalizedStatus === 'completed')) {
      api.patch(`/projects/${selectedProject.project_id}`, { project_status: 'Ongoing' })
        .then(() => {
          setSelectedProject((prev) => ({ ...prev, project_status: 'Ongoing' }));
          setProjects((prev) => prev.map((proj) =>
            proj.project_id === selectedProject.project_id
              ? { ...proj, project_status: 'Ongoing' }
              : proj
          ));
        })
        .catch((err) => {
          console.error('Failed to update project status to Ongoing:', err);
        });
    }
  }, [selectedProject?.project_id, activeSubProjects, reports]);

  const getCompletionRateForProject = (projectId) => {
    if (!projectId) return 0;

    const targetId = normalizeId(projectId);
    const maxProgress = completionByProjectId.get(targetId) || 0;

    return maxProgress;
  };

  const getChartData = useMemo(() => {
    if (!activeSubProjects.length) return [];

    // Get all start and end dates
    const allDates = [];
    activeSubProjects.forEach((project) => {
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

    // Track last known progress for each subproject to create flat lines
    const lastProgress = {};
    activeSubProjects.forEach((project) => {
      lastProgress[project.project_id] = null;
    });

    // Create line chart data - one entry per month showing each subproject's progress
    const chartData = months.map(({ label, date }, monthIndex) => {
      const monthDate = new Date(date);
      monthDate.setDate(1);
      const monthEndDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const dataPoint = { month: label };

      // For each subproject, check if a report was generated IN this specific month
      activeSubProjects.forEach((project) => {
        const projectReports = reports.filter(
          (r) => r.project_id === project.project_id && !r.isDeleted,
        );

        // Find reports generated specifically in this month
        const monthReports = projectReports.filter((r) => {
          const reportDate = r.end_date
            ? new Date(r.end_date)
            : r.created_at
              ? new Date(r.created_at)
              : null;
          if (!reportDate) return false;

          // Check if report is within this specific month
          return reportDate >= monthDate && reportDate <= monthEndDate;
        });

        const startDate = project.project_start_date
          ? new Date(project.project_start_date)
          : null;
        const hasStarted = startDate && startDate <= monthEndDate;

        if (monthReports.length > 0) {
          // Report(s) generated this month - use the latest one
          const sortedReports = monthReports.sort((a, b) => {
            const dateA = a.end_date
              ? new Date(a.end_date)
              : new Date(a.created_at);
            const dateB = b.end_date
              ? new Date(b.end_date)
              : new Date(b.created_at);
            return dateB - dateA;
          });
          const latestReport = sortedReports[0];
          const progress = Number(latestReport.current_progress || 0);
          lastProgress[project.project_id] = progress;
          dataPoint[project.project_name] = progress;
        } else if (hasStarted) {
          // Project has started but no report this month - use last known progress (flat line)
          if (lastProgress[project.project_id] !== null) {
            dataPoint[project.project_name] = lastProgress[project.project_id];
          } else {
            // Project started but no reports yet - show 0
            lastProgress[project.project_id] = 0;
            dataPoint[project.project_name] = 0;
          }
        }
        // If project hasn't started yet, don't add data point (will show gap in line)
      });

      return dataPoint;
    });

    return chartData;
  }, [activeSubProjects, reports]);

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
    setSubProjectViewMode('active');
  }, [selectedProject?.project_id]);

  useEffect(() => {
    if (!selectedProject) {
      setIsEditingTotalValue(false);
      setTotalValueDraft(0);
      return;
    }
    setIsEditingTotalValue(false);
    setTotalValueDraft(Number(selectedProject.total_amount || 0));
  }, [selectedProject?.project_id]);

  const startEditTotalValue = () => {
    if (!selectedProject) return;
    setTotalValueDraft(Number(selectedProject.total_amount || 0));
    setIsEditingTotalValue(true);
  };

  const cancelEditTotalValue = () => {
    setIsEditingTotalValue(false);
    setTotalValueDraft(Number(selectedProject?.total_amount || 0));
  };

  const handleSaveTotalValue = async () => {
    if (!selectedProject) return;
    const nextValue = Number(totalValueDraft || 0);

    try {
      setLoading(true);
      await api.patch(`/projects/${selectedProject.project_id}`, {
        total_amount: nextValue,
      });

      setSelectedProject((prev) =>
        prev ? { ...prev, total_amount: nextValue } : prev,
      );
      setIsEditingTotalValue(false);
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Total value updated',
      });
      fetchProjects();
      if (displayHistoryDialog && selectedProject) {
        fetchProjectHistory(selectedProject.project_id);
      }
    } catch (error) {
      console.error('Update total value error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail:
          error.response?.data?.message ||
          error.message ||
          'Failed to update total value',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subProjectFirst >= subProjects.length && subProjects.length > 0) {
      setSubProjectFirst(0);
    }
  }, [subProjectFirst, subProjects.length]);

  useEffect(() => {
    setSubProjectFirst(0);
  }, [subProjectViewMode]);

  const openSubProjectDialog = () => {
    if (!selectedProject) return;
    setEditingSubProject(null);
    setNewSubProject(getEmptySubProjectState(selectedProject));
    setDisplaySubProjectDialog(true);
  };

  const openEditSubProjectDialog = (subproject) => {
    if (!subproject || !selectedProject) return;

    setEditingSubProject(subproject);
    setNewSubProject({
      name: subproject.project_name || '',
      description: subproject.project_description || '',
      amount: Number(subproject.total_amount || 0),
      startDate: subproject.project_start_date
        ? new Date(subproject.project_start_date)
        : null,
      endDate: subproject.project_deadline
        ? new Date(subproject.project_deadline)
        : null,
      contractor_id: subproject.contractor_id || null,
      client_id: subproject.client_id || selectedProject.client_id || null,
      category_id: subproject.category_id || null,
      project_status: subproject.project_status || 'Ongoing',
      parent_project_id:
        subproject.parent_project_id || selectedProject.project_id,
    });
    setDisplaySubProjectDialog(true);
  };

  const closeSubProjectDialog = () => {
    setDisplaySubProjectDialog(false);
    setEditingSubProject(null);
    setNewSubProject(getEmptySubProjectState(selectedProject));
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
    const existingSubTotal = activeSubProjects.reduce((sum, project) => {
      if (
        editingSubProject &&
        normalizeId(project.project_id) ===
          normalizeId(editingSubProject.project_id)
      ) {
        return sum;
      }
      return sum + Number(project.total_amount || 0);
    }, 0);
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
      const payload = {
        project_name: newSubProject.name,
        project_description: newSubProject.description,
        total_amount: newSubProject.amount,
        project_start_date: newSubProject.startDate,
        project_deadline: newSubProject.endDate,
        contractor_id: newSubProject.contractor_id,
        client_id: newSubProject.client_id,
        category_id: newSubProject.category_id,
        project_status: newSubProject.project_status || 'Ongoing',
        parent_project_id: newSubProject.parent_project_id,
      };

      if (editingSubProject?.project_id) {
        await api.patch(`/projects/${editingSubProject.project_id}`, payload);
      } else {
        await api.post('/projects', payload);
      }

      closeSubProjectDialog();

      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: editingSubProject
          ? 'Sub-project updated successfully'
          : 'Sub-project created successfully',
      });

      fetchProjects();
      // Refresh project history if dialog is open
      if (displayHistoryDialog && selectedProject) {
        fetchProjectHistory(selectedProject.project_id);
      }
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

  const handleDeleteSubProject = (subproject) => {
    if (!subproject) return;

    confirmDialog({
      message: `Are you sure you want to delete "${subproject.project_name}"? This can be restored from the recycle bin.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          setLoading(true);
          await api.delete(`/projects/${subproject.project_id}`);

          toast.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Sub-project moved to recycle bin',
          });

          fetchProjects();
          if (displayHistoryDialog && selectedProject) {
            fetchProjectHistory(selectedProject.project_id);
          }
        } catch (error) {
          console.error('Delete sub-project error:', error);
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail:
              error.response?.data?.message ||
              error.message ||
              'Failed to delete sub-project',
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleRestoreSubProject = (subproject) => {
    if (!subproject) return;

    confirmDialog({
      message: `Restore "${subproject.project_name}" to active projects?`,
      header: 'Confirm Restore',
      icon: 'pi pi-refresh',
      accept: async () => {
        try {
          setLoading(true);
          await api.patch(`/projects/${subproject.project_id}`, {
            isDeleted: false,
          });

          toast.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Sub-project restored successfully',
          });

          fetchProjects();
          if (displayHistoryDialog && selectedProject) {
            fetchProjectHistory(selectedProject.project_id);
          }
        } catch (error) {
          console.error('Restore sub-project error:', error);
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail:
              error.response?.data?.message ||
              error.message ||
              'Failed to restore sub-project',
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handlePermanentDeleteSubProject = (subproject) => {
    if (!subproject) return;

    confirmDialog({
      message: `Permanently delete "${subproject.project_name}"? This cannot be undone.`,
      header: 'Confirm Permanent Delete',
      icon: 'pi pi-trash',
      accept: async () => {
        try {
          setLoading(true);
          await api.delete(`/projects/${subproject.project_id}?permanent=true`);

          toast.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Sub-project permanently deleted',
          });

          fetchProjects();
          if (displayHistoryDialog && selectedProject) {
            fetchProjectHistory(selectedProject.project_id);
          }
        } catch (error) {
          console.error('Permanent delete sub-project error:', error);
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail:
              error.response?.data?.message ||
              error.message ||
              'Failed to permanently delete sub-project',
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <div className="panel-container">
      <ConfirmDialog />
      <Toast ref={toast} />

      <div className="project-dashboard-header mb-6">
        <div>
          <h2 className="m-0">Client Dashboard</h2>
          <p className="text-color-secondary m-0">
            Select a client to view their details and projects
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
                  <div>{getClientName(selectedProject.client_id)}</div>
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

              {/* Financial Metrics */}
              <div
                className="project-dashboard-metrics"
                style={{ marginTop: '1rem' }}
              >
                <div
                  style={{
                    padding: '0.65rem',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '0.375rem',
                    border: '1px solid #e5e7eb',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.65rem',
                      color: '#6b7280',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    Contract Amount
                    {!isEditingTotalValue && (
                      <Button
                        icon="pi pi-pencil"
                        className="p-button-text p-button-sm"
                        style={{
                          padding: 0,
                          minWidth: 'auto',
                          color: '#6b7280',
                        }}
                        onClick={startEditTotalValue}
                        tooltip="Edit total value"
                        tooltipOptions={{ position: 'top' }}
                      />
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: '700',
                      color: '#111827',
                      marginTop: '0.35rem',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      overflow: 'hidden',
                    }}
                  >
                    {isEditingTotalValue ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <InputNumber
                          value={totalValueDraft}
                          onValueChange={(e) =>
                            setTotalValueDraft(e.value ?? 0)
                          }
                          prefix="₱ "
                          thousandSeparator=","
                          minFractionDigits={2}
                          maxFractionDigits={2}
                          min={0}
                          inputStyle={{ width: '140px', textAlign: 'center' }}
                        />
                        <Button
                          icon="pi pi-check"
                          className="p-button-text p-button-sm"
                          style={{
                            padding: 0,
                            minWidth: 'auto',
                            color: '#16a34a',
                          }}
                          onClick={handleSaveTotalValue}
                          disabled={loading}
                          tooltip="Save"
                          tooltipOptions={{ position: 'top' }}
                        />
                        <Button
                          icon="pi pi-times"
                          className="p-button-text p-button-sm"
                          style={{
                            padding: 0,
                            minWidth: 'auto',
                            color: '#6b7280',
                          }}
                          onClick={cancelEditTotalValue}
                          disabled={loading}
                          tooltip="Cancel"
                          tooltipOptions={{ position: 'top' }}
                        />
                      </div>
                    ) : (
                      formatCurrency(
                        calculateProjectFinancials(selectedProject).totalValue,
                      )
                    )}
                  </div>
                </div>

                <div
                  style={{
                    padding: '0.65rem',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '0.375rem',
                    border: '1px solid #e5e7eb',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.65rem',
                      color: '#6b7280',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Paid
                  </div>
                  <div
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: '700',
                      color: '#10B981',
                      marginTop: '0.35rem',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      overflow: 'hidden',
                    }}
                  >
                    {formatCurrency(
                      calculateProjectFinancials(selectedProject).totalPaid,
                    )}
                  </div>
                </div>

                <div
                  style={{
                    padding: '0.65rem',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '0.375rem',
                    border: '1px solid #e5e7eb',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.65rem',
                      color: '#6b7280',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Pending
                  </div>
                  <div
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: '700',
                      color: '#F59E0B',
                      marginTop: '0.35rem',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      overflow: 'hidden',
                    }}
                  >
                    {formatCurrency(
                      calculateProjectFinancials(selectedProject).totalUnpaid,
                    )}
                  </div>
                </div>

                <div
                  style={{
                    padding: '0.65rem',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '0.375rem',
                    border: '1px solid #e5e7eb',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.65rem',
                      color: '#6b7280',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Unpaid
                  </div>
                  <div
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: '700',
                      color: '#EF4444',
                      marginTop: '0.35rem',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      overflow: 'hidden',
                    }}
                  >
                    {formatCurrency(
                      calculateProjectFinancials(selectedProject).totalPending,
                    )}
                  </div>
                </div>
              </div>

              {/* Sub-Project Status Metrics */}
              <div
                className="project-dashboard-metrics"
                style={{ marginTop: '1.5rem' }}
              >
                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '0.375rem',
                    border: '1px solid #e5e7eb',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Ongoing
                  </div>
                  <div
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: '#f97316',
                      marginTop: '0.5rem',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      overflow: 'hidden',
                    }}
                  >
                    {getSubProjectStatusCounts().ongoing}
                  </div>
                </div>

                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '0.375rem',
                    border: '1px solid #e5e7eb',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    On Hold
                  </div>
                  <div
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: '#eab308',
                      marginTop: '0.5rem',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      overflow: 'hidden',
                    }}
                  >
                    {getSubProjectStatusCounts().onhold}
                  </div>
                </div>

                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '0.375rem',
                    border: '1px solid #e5e7eb',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Completed
                  </div>
                  <div
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: '#16a34a',
                      marginTop: '0.5rem',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      overflow: 'hidden',
                    }}
                  >
                    {getSubProjectStatusCounts().completed}
                  </div>
                </div>

                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '0.375rem',
                    border: '1px solid #e5e7eb',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Unallocated Balance
                  </div>
                  <div
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      color: '#4f4d36',
                      marginTop: '0.5rem',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      overflow: 'hidden',
                      lineHeight: '1.2',
                    }}
                  >
                    ₱
                    {getRemainingBalance().toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <div className="metric-label">Completion Rate</div>
                <ProgressBar
                  value={completionRate}
                  className="report-progress-bar"
                  style={{
                    '--progress-color':
                      completionRate >= 100 ? '#16a34a' : getStatusMeta(selectedProject).color,
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
                      PROGRESS BY MONTH
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
                        {activeSubProjects.map((project, index) => {
                          // Generate distinct colors for each subproject
                          const colors = [
                            '#10B981', // Green
                            '#F59E0B', // Amber
                            '#3B82F6', // Blue
                            '#EF4444', // Red
                            '#8B5CF6', // Purple
                            '#EC4899', // Pink
                            '#14B8A6', // Teal
                            '#F97316', // Orange
                            '#6366F1', // Indigo
                            '#06B6D4', // Cyan
                          ];
                          const color = colors[index % colors.length];

                          return (
                            <Line
                              key={project.project_id}
                              type="monotone"
                              dataKey={project.project_name}
                              stroke={color}
                              strokeWidth={2}
                              dot={{ fill: color, r: 4 }}
                              activeDot={{ r: 6 }}
                              connectNulls
                            />
                          );
                        })}
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
                <div className="project-dashboard-project-actions">
                  <Button
                    label={
                      subProjectViewMode === 'active'
                        ? `Recycle Bin (${deletedSubProjects.length})`
                        : 'Active Projects'
                    }
                    icon={
                      subProjectViewMode === 'active'
                        ? 'pi pi-trash'
                        : 'pi pi-folder'
                    }
                    onClick={() =>
                      setSubProjectViewMode(
                        subProjectViewMode === 'active' ? 'deleted' : 'active',
                      )
                    }
                    className="p-button-sm user-switch-btn active"
                  />
                  {subProjectViewMode === 'active' && (
                    <Button
                      label="Add Project"
                      icon="pi pi-plus"
                      onClick={openSubProjectDialog}
                      className="add-user-btn"
                    />
                  )}
                </div>
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
                        <p
                          className="subproject-desc"
                          style={{
                            fontSize: '0.875rem',
                            maxHeight: '3em',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
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
                            <div style={{ fontSize: '0.875rem' }}>
                              {getContractorName(subproject.contractor_id)}
                            </div>
                          </div>
                          <div>
                            <div className="metric-label">Category</div>
                            <div style={{ fontSize: '0.875rem' }}>
                              {getCategoryName(subproject.category_id)}
                            </div>
                          </div>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <div className="metric-label">Contract Amount</div>
                            <div style={{ fontSize: '0.875rem' }}>
                              {amountTemplate(subproject)}
                            </div>
                          </div>
                          <div>
                            <div className="metric-label">Start Date</div>
                            <div style={{ fontSize: '0.875rem' }}>
                              {formatDateValue(subproject?.project_start_date)}
                            </div>
                          </div>
                          <div>
                            <div className="metric-label">End Date</div>
                            <div style={{ fontSize: '0.875rem' }}>
                              {formatDateValue(subproject?.project_deadline)}
                            </div>
                          </div>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <div className="metric-label">Days Remaining</div>
                            <div
                              style={{
                                fontSize: '0.875rem',
                                color: getDaysRemainingInfo(subproject, rate)
                                  .color,
                              }}
                            >
                              {getDaysRemainingInfo(subproject, rate).text}
                            </div>
                          </div>
                        </div>
                        <div className="subproject-actions">
                          {subProjectViewMode === 'active' ? (
                            <>
                              <Button
                                icon="pi pi-pencil"
                                label="Edit"
                                severity="secondary"
                                className="p-button-sm subproject-action-btn"
                                style={{
                                  backgroundColor: '#4A4A3A',
                                  color: '#ffffff',
                                }}
                                onClick={() =>
                                  openEditSubProjectDialog(subproject)
                                }
                              />
                              <Button
                                icon="pi pi-trash"
                                label="Delete"
                                severity="danger"
                                className="p-button-sm subproject-action-btn"
                                onClick={() =>
                                  handleDeleteSubProject(subproject)
                                }
                              />
                              <Button
                                icon="pi pi-file"
                                label="Billings"
                                severity="secondary"
                                className="p-button-sm subproject-action-btn"
                                style={{
                                  backgroundColor: '#4A4A3A',
                                  color: '#ffffff',
                                }}
                                onClick={() => {
                                  setReportsProject(subproject);
                                  setDisplayReportsDialog(true);
                                }}
                              />
                            </>
                          ) : (
                            <>
                              <Button
                                icon="pi pi-refresh"
                                label="Restore"
                                severity="success"
                                className="p-button-sm"
                                onClick={() =>
                                  handleRestoreSubProject(subproject)
                                }
                              />
                              <Button
                                icon="pi pi-times"
                                label="Delete Permanently"
                                severity="danger"
                                className="p-button-sm"
                                onClick={() =>
                                  handlePermanentDeleteSubProject(subproject)
                                }
                              />
                            </>
                          )}
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
                <div className="project-dashboard-billing-actions">
                  <Button
                    label="View History"
                    icon="pi pi-history"
                    severity="info"
                    onClick={() => {
                      fetchProjectHistory(selectedProject.project_id);
                      setDisplayHistoryDialog(true);
                    }}
                    style={{
                      backgroundColor: '#4A4A3A',
                      color: '#ffffff',
                    }}
                    className="p-button-sm"
                  />
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
                          key={group.client?.user_id || group.clientName}
                          type="button"
                          className="project-dashboard-card project-dashboard-client-card"
                          onClick={() => setSelectedClientGroup(group)}
                        >
                          <div className="project-dashboard-client-identity">
                            <div className="project-dashboard-client-avatar">
                              {group.client ? (
                                getClientProfileSrc(group.client) ? (
                                  <img
                                    src={getClientProfileSrc(group.client)}
                                    alt={group.clientName}
                                  />
                                ) : (
                                  <i className="pi pi-user project-dashboard-client-icon" />
                                )
                              ) : (
                                <i className="pi pi-user project-dashboard-client-icon" />
                              )}
                            </div>
                            <div className="project-dashboard-client-meta">
                              <h4 className="project-card-title">
                                {group.clientName}
                              </h4>
                              {group.client?.address && (
                                <p
                                  style={{
                                    fontSize: '0.85rem',
                                    color: '#999',
                                    margin: '4px 0 8px 0',
                                  }}
                                >
                                  {group.client.address}
                                </p>
                              )}
                              <span className="project-dashboard-client-count">
                                {group.projects.length} project
                                {group.projects.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
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
        header={editingSubProject ? 'Edit Project' : 'Add Project'}
        contentStyle={{ padding: '1.5rem 2rem' }}
        modal
        onHide={closeSubProjectDialog}
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
          <small
            style={{
              display: 'block',
              marginTop: '0.5rem',
              color:
                getSubProjectBalancePreview().remainingAfterInput < 0
                  ? '#dc2626'
                  : '#065f46',
              fontWeight: '600',
            }}
          >
            Balance Remaining:{' '}
            {formatCurrency(getSubProjectBalancePreview().remainingAfterInput)}
          </small>
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
            label={editingSubProject ? 'Save Changes' : 'Create'}
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

      <Dialog
        visible={displayHistoryDialog}
        style={{ width: '95vw', maxWidth: '1000px' }}
        header={`Audit Log - ${selectedProject?.project_name || 'Project'}`}
        contentStyle={{ padding: '1.5rem' }}
        modal
        onHide={() => setDisplayHistoryDialog(false)}
        className="p-fluid"
        headerStyle={{
          backgroundColor: '#4A4A3A',
          color: 'white',
          padding: '1rem',
        }}
      >
        <div style={{ maxHeight: '700px', overflowY: 'auto' }}>
          {historyLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <i
                className="pi pi-spin pi-spinner"
                style={{ fontSize: '2rem', color: '#4A4A3A' }}
              ></i>
              <p
                style={{
                  marginTop: '1rem',
                  color: '#6b7280',
                  fontSize: '0.9rem',
                }}
              >
                Loading audit log...
              </p>
            </div>
          ) : projectHistory.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem',
                backgroundColor: '#f3f4f6',
                borderRadius: '0.5rem',
                color: '#9ca3af',
              }}
            >
              <i
                className="pi pi-info-circle"
                style={{ fontSize: '2rem', marginBottom: '0.5rem' }}
              ></i>
              <p>No audit records for this project.</p>
            </div>
          ) : (
            <div>
              {/* Header row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 120px 140px 150px 1fr 100px',
                  gap: '1rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#4A4A3A',
                  color: 'white',
                  borderRadius: '0.375rem',
                  marginBottom: '1rem',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                }}
              >
                <div>#</div>
                <div>Timestamp</div>
                <div>Action</div>
                <div>User</div>
                <div>Details</div>
                <div>Status</div>
              </div>

              {/* Log entries */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                {projectHistory.map((log, index) => {
                  const timestamp = log.timestamp
                    ? new Date(log.timestamp).toLocaleString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : 'N/A';

                  const actionType = (log.action || 'UPDATE')
                    .replace(/_/g, ' ')
                    .toUpperCase();
                  const userName = log.userName || 'System';
                  const status = log.status || 'Success';

                  // Format details text based on action and resource
                  let detailsText = '';
                  try {
                    const details = log.details ? JSON.parse(log.details) : {};
                    const resource = log.resource || '';
                    const action = log.action || '';

                    if (resource === 'PROJECT' && action === 'CREATE') {
                      const projectName = details.project_name || 'project';
                      if (details.parent_project_id) {
                        const parentProject = projects.find(
                          (p) => p.project_id === details.parent_project_id,
                        );
                        const parentName = parentProject
                          ? ` under "${parentProject.project_name}"`
                          : '';
                        detailsText = `Created subproject "${projectName}"${parentName}`;
                      } else {
                        detailsText = `Created project "${projectName}"`;
                      }

                      // Add contractor/client info if available
                      const extraInfo = [];
                      if (details.contractor_id) {
                        const contractor = contractors.find(
                          (c) => c.user_id === details.contractor_id,
                        );
                        if (contractor)
                          extraInfo.push(`Contractor: ${contractor.username}`);
                      }
                      if (details.client_id) {
                        const client = clients.find(
                          (c) => c.user_id === details.client_id,
                        );
                        if (client)
                          extraInfo.push(`Client: ${client.username}`);
                      }
                      if (extraInfo.length > 0) {
                        detailsText += ` (${extraInfo.join(', ')})`;
                      }
                    } else if (resource === 'PROJECT' && action === 'UPDATE') {
                      const fields = details.updatedFields || [];
                      if (fields.length > 0) {
                        // Format field names for better readability
                        const formattedFields = fields.map((f) =>
                          f
                            .replace(/_/g, ' ')
                            .replace(/\b\w/g, (l) => l.toUpperCase()),
                        );
                        detailsText = `Updated ${formattedFields.join(', ')}`;
                      } else {
                        detailsText = 'Updated project';
                      }
                    } else if (resource === 'PROJECT' && action === 'DELETE') {
                      detailsText = details.permanentDelete
                        ? 'Permanently deleted project'
                        : 'Deleted project';
                    } else if (resource === 'PROJECT' && action === 'RESTORE') {
                      detailsText = 'Restored project';
                    } else if (resource === 'REPORT' && action === 'CREATE') {
                      const payment = details.payment_requested;
                      const progress = details.current_progress;
                      detailsText = `Generated billing report`;
                      if (payment)
                        detailsText += ` with ₱${Number(payment).toLocaleString()} payment`;
                      if (progress) detailsText += ` (${progress}% progress)`;
                    } else if (resource === 'REPORT' && action === 'UPDATE') {
                      const changes = details.changes || {};
                      const paymentStatusChange = details.payment_status_change;
                      const updatedFields = details.updatedFields || [];

                      // Prioritize payment status changes
                      if (
                        changes.payment_triggered !== undefined ||
                        paymentStatusChange
                      ) {
                        const amount =
                          details.payment_requested ||
                          paymentStatusChange?.amount ||
                          0;

                        if (paymentStatusChange) {
                          const fromStatus = paymentStatusChange.from;
                          const toStatus = paymentStatusChange.to;
                          detailsText = `Payment status changed from ${fromStatus} to ${toStatus}`;
                          if (amount)
                            detailsText += ` (₱${Number(amount).toLocaleString()})`;
                          if (paymentStatusChange.billing_period_start) {
                            const startDate = new Date(
                              paymentStatusChange.billing_period_start,
                            ).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            });
                            const endDate = new Date(
                              paymentStatusChange.billing_period_end,
                            ).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            });
                            detailsText += ` for period ${startDate} - ${endDate}`;
                          }
                        } else {
                          if (changes.payment_triggered === true) {
                            detailsText = `Marked report as paid`;
                            if (amount)
                              detailsText += ` (₱${Number(amount).toLocaleString()})`;
                          } else if (changes.payment_triggered === false) {
                            detailsText = `Marked report as pending`;
                            if (amount)
                              detailsText += ` (₱${Number(amount).toLocaleString()})`;
                          }
                        }
                      } else if (updatedFields.length > 0) {
                        const formattedFields = updatedFields.map((f) =>
                          f
                            .replace(/_/g, ' ')
                            .replace(/\b\w/g, (l) => l.toUpperCase()),
                        );
                        detailsText = `Updated report: ${formattedFields.join(', ')}`;
                        if (details.payment_requested) {
                          detailsText += ` (₱${Number(details.payment_requested).toLocaleString()})`;
                        }
                      } else {
                        detailsText = 'Updated report';
                      }
                    } else if (resource === 'REPORT' && action === 'DELETE') {
                      const payment = details.payment_requested;
                      const progress = details.current_progress;
                      const wasMarkedPaid = details.payment_triggered === true;
                      detailsText = `Moved report to recycle bin`;
                      if (payment) {
                        detailsText += ` (₱${Number(payment).toLocaleString()})`;
                      }
                      if (wasMarkedPaid) {
                        detailsText += ` [was marked paid]`;
                      }
                      if (progress) {
                        detailsText += ` - ${progress}% progress`;
                      }
                    } else {
                      detailsText = `${action} ${resource}`.toLowerCase();
                    }
                  } catch (e) {
                    detailsText = log.details || '';
                  }

                  const statusColor =
                    status === 'Success' || status === 'success'
                      ? '#16a34a'
                      : status === 'Failed' || status === 'failed'
                        ? '#dc2626'
                        : '#f59e0b';

                  return (
                    <div
                      key={log.log_id || index}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '60px 120px 140px 150px 1fr 100px',
                        gap: '1rem',
                        padding: '1rem',
                        backgroundColor:
                          index % 2 === 0 ? '#f9fafb' : '#ffffff',
                        borderRadius: '0.375rem',
                        border: '1px solid #e5e7eb',
                        alignItems: 'start',
                        fontSize: '0.85rem',
                      }}
                    >
                      {/* Entry Number */}
                      <div
                        style={{
                          fontWeight: '600',
                          color: '#4A4A3A',
                          fontSize: '0.9rem',
                          textAlign: 'center',
                        }}
                      >
                        {projectHistory.length - index}
                      </div>

                      {/* Timestamp */}
                      <div
                        style={{
                          color: '#6b7280',
                          fontSize: '0.8rem',
                          fontFamily: 'monospace',
                        }}
                      >
                        {timestamp}
                      </div>

                      {/* Action Type */}
                      <div
                        style={{
                          fontWeight: '600',
                          color: '#1f2937',
                          padding: '0.35rem 0.65rem',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '0.25rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {actionType}
                      </div>

                      {/* User */}
                      <div style={{ color: '#374151', whiteSpace: 'nowrap' }}>
                        {userName}
                      </div>

                      {/* Details */}
                      <div
                        style={{
                          color: '#6b7280',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxHeight: '2.4em',
                          lineHeight: '1.2em',
                        }}
                        title={detailsText}
                      >
                        {detailsText || '—'}
                      </div>

                      {/* Status Badge */}
                      <div
                        style={{
                          padding: '0.35rem 0.65rem',
                          backgroundColor: statusColor,
                          color: 'white',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {status}
                      </div>

                      {/* Expandable details section */}
                      {log.details &&
                        (() => {
                          try {
                            const details = JSON.parse(log.details);
                            const hasDetails =
                              details && Object.keys(details).length > 0;

                            // Helper function to format display values
                            const formatValue = (key, value) => {
                              if (typeof value === 'object' && value !== null) {
                                return JSON.stringify(value, null, 2);
                              }

                              // Map IDs to names
                              if (key === 'contractor_id') {
                                const contractor = contractors.find(
                                  (c) => c.user_id === value,
                                );
                                return contractor ? contractor.username : value;
                              }
                              if (key === 'client_id') {
                                const client = clients.find(
                                  (c) => c.user_id === value,
                                );
                                return client ? client.username : value;
                              }
                              if (key === 'category_id') {
                                const category = categories.find(
                                  (c) => c.category_id === value,
                                );
                                return category
                                  ? category.category_name
                                  : value;
                              }
                              if (key === 'parent_project_id') {
                                const parentProject = projects.find(
                                  (p) => p.project_id === value,
                                );
                                return parentProject
                                  ? parentProject.project_name
                                  : value;
                              }

                              return String(value);
                            };

                            // Format key names for better readability
                            const formatKey = (key) => {
                              return key
                                .replace(/_/g, ' ')
                                .replace(/\b\w/g, (l) => l.toUpperCase());
                            };

                            return (
                              hasDetails && (
                                <div
                                  style={{
                                    gridColumn: '1 / -1',
                                    marginTop: '0.75rem',
                                    paddingTop: '0.75rem',
                                    borderTop: '1px solid #d1d5db',
                                    fontSize: '0.8rem',
                                  }}
                                >
                                  <div
                                    style={{
                                      fontWeight: '600',
                                      color: '#4A4A3A',
                                      marginBottom: '0.5rem',
                                      textTransform: 'uppercase',
                                      fontSize: '0.7rem',
                                      letterSpacing: '0.05em',
                                    }}
                                  >
                                    Additional Details
                                  </div>
                                  <div
                                    style={{
                                      display: 'grid',
                                      gridTemplateColumns:
                                        'repeat(auto-fit, minmax(250px, 1fr))',
                                      gap: '0.75rem',
                                      color: '#374151',
                                    }}
                                  >
                                    {Object.entries(details).map(
                                      ([key, value]) => (
                                        <div
                                          key={key}
                                          style={{
                                            padding: '0.5rem',
                                            backgroundColor: '#f3f4f6',
                                            borderRadius: '0.25rem',
                                          }}
                                        >
                                          <strong style={{ color: '#4A4A3A' }}>
                                            {formatKey(key)}:
                                          </strong>{' '}
                                          {formatValue(key, value)}
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )
                            );
                          } catch (e) {
                            return null;
                          }
                        })()}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
};

export default ProjectDashboardPanel;

import React, { useState, useEffect, useRef } from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
  pdf,
} from '@react-pdf/renderer';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { FloatLabel } from 'primereact/floatlabel';
import { Slider } from 'primereact/slider';
import { Divider } from 'primereact/divider';
import { ProgressBar } from 'primereact/progressbar';
import { Card } from 'primereact/card';
import { TabView, TabPanel } from 'primereact/tabview';
import { Menu } from 'primereact/menu';
import { ProjectReportPDF } from '../../dashboards/staff_panels/ProjectReportPDF';
import { ProjectAggregateReportPDF } from '../../dashboards/staff_panels/ProjectAggregateReportPDF';
import { ProjectReportsListPDF } from '../../dashboards/staff_panels/ProjectReportsListPDF';
import api from '../../../services/api';
import './ReportsPanel.css';

const ReportsPanel = ({
  embeddedProjectId,
  embedded = false,
  onReportsChanged,
}) => {
  const [projects, setProjects] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [completionRate, setCompletionRate] = useState(0);
  const [minCompletionRate, setMinCompletionRate] = useState(0);
  const [releasedAmount, setReleasedAmount] = useState(0);
  const [reportValue, setReportValue] = useState('');
  const [reportStartDate, setReportStartDate] = useState(null);
  const [reportEndDate, setReportEndDate] = useState(null);
  const [isPaymentTriggered, setIsPaymentTriggered] = useState(false);
  const [recentReports, setRecentReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportImages, setReportImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageComments, setImageComments] = useState([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedReportImages, setSelectedReportImages] = useState([]);
  const [selectedImageComments, setSelectedImageComments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const toast = useRef(null);
  const menuRefs = useRef({});
  const statusSyncRef = useRef(new Set());

  // Get base URL for images
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    const apiBaseUrl =
      process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
    const baseUrl = apiBaseUrl.replace('/api', '');
    if (imagePath.startsWith('http')) return imagePath;
    return `${baseUrl}${imagePath}`;
  };

  // FETCH DATA FROM BACKEND
  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      showToast('error', 'Error', 'Failed to fetch projects');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      const contractorsList = response.data.filter(
        (user) => user.user_role === 'contractor',
      );
      setContractors(contractorsList);

      const clientsList = response.data.filter(
        (user) => user.user_role === 'client',
      );
      setClients(clientsList);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchRecentReports = async () => {
    try {
      const response = await api.get('/reports');
      setRecentReports(response.data);
      if (onReportsChanged) {
        onReportsChanged();
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  // GETTING THE NAMES OF USERS
  const getContractorName = (contractorId) => {
    if (!contractorId) return '';
    const contractor = contractors.find((c) => c.user_id == contractorId);
    return contractor ? `${contractor.first_name} ${contractor.last_name}` : '';
  };

  const getClientName = (clientId) => {
    if (!clientId) return 'NO CLIENT RECORD';
    const client = clients.find((c) => c.user_id === clientId);
    return client ? `${client.first_name} ${client.last_name}` : '';
  };

  useEffect(() => {
    fetchProjects();
    fetchUsers();
    fetchRecentReports();
  }, []);

  useEffect(() => {
    if (!embeddedProjectId || !projects.length) return;
    const project = projects.find(
      (item) => item.project_id === embeddedProjectId,
    );
    if (project) {
      handleProjectClick(project);
    }
  }, [embeddedProjectId, projects, recentReports]);

  useEffect(() => {
    if (!projects.length || !recentReports.length) return;

    const maxProgressByProject = recentReports.reduce((acc, report) => {
      const projectId = report.project_id;
      const progress = Number(report.current_progress || 0);
      const currentMax = acc.get(projectId) || 0;
      if (progress > currentMax) acc.set(projectId, progress);
      return acc;
    }, new Map());

    const toUpdate = projects.filter((project) => {
      const maxProgress = maxProgressByProject.get(project.project_id) || 0;
      return (
        maxProgress >= 100 &&
        project.project_status !== 'Done' &&
        !statusSyncRef.current.has(project.project_id)
      );
    });

    if (!toUpdate.length) return;

    toUpdate.forEach((project) =>
      statusSyncRef.current.add(project.project_id),
    );

    Promise.all(
      toUpdate.map((project) =>
        api.patch(`/projects/${project.project_id}`, {
          project_status: 'Done',
        }),
      ),
    )
      .then(() => fetchProjects())
      .catch((error) => {
        console.error('Error syncing completed projects:', error);
        toUpdate.forEach((project) =>
          statusSyncRef.current.delete(project.project_id),
        );
      });
  }, [projects, recentReports]);

  useEffect(() => {
    if (selectedProject) {
      const filtered = recentReports.filter(
        (report) => report.project_id === selectedProject.project_id,
      );
      // Sort by date, newest first
      filtered.sort(
        (a, b) =>
          new Date(b.created_at || b.start_date) -
          new Date(a.created_at || a.start_date),
      );
      setFilteredReports(filtered);
    }
  }, [selectedProject, recentReports]);

  useEffect(() => {
    if (!selectedProject) return;

    const projectReports = recentReports.filter(
      (report) => report.project_id === selectedProject.project_id,
    );
    const totalAmountReleased = projectReports.reduce(
      (sum, report) => sum + (Number(report.payment_requested) || 0),
      0,
    );

    const currentTotalReleased = Number(
      selectedProject?.total_amount_released || 0,
    );

    if (currentTotalReleased !== totalAmountReleased) {
      setSelectedProject((prev) => ({
        ...prev,
        total_amount_released: totalAmountReleased,
      }));
    }
  }, [selectedProject?.project_id, recentReports]);

  useEffect(() => {
    // Force progress bar color override - PrimeReact applies inline styles
    const forceColorOverride = () => {
      const progressBars = document.querySelectorAll(
        '.report-progress-bar .p-progressbar-value',
      );
      progressBars.forEach((bar) => {
        bar.style.setProperty('background-color', '#4f4d36', 'important');
      });
    };

    // Apply immediately
    forceColorOverride();

    // Apply after short delay for newly rendered bars
    const timer1 = setTimeout(forceColorOverride, 50);
    const timer2 = setTimeout(forceColorOverride, 100);
    const timer3 = setTimeout(forceColorOverride, 200);

    // Watch for new DOM nodes being added and apply color
    const observer = new MutationObserver(() => {
      forceColorOverride();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      observer.disconnect();
    };
  }, [filteredReports]);

  const showToast = (severity, summary, detail) => {
    toast.current.show({ severity, summary, detail, life: 3000 });
  };

  const handleProjectClick = (project) => {
    // Calculate total amount released from all reports for this project
    const projectReports = recentReports.filter(
      (report) => report.project_id === project.project_id,
    );
    const totalAmountReleased = projectReports.reduce(
      (sum, report) => sum + (Number(report.payment_requested) || 0),
      0,
    );

    // Enrich project with calculated field
    const enrichedProject = {
      ...project,
      total_amount_released: totalAmountReleased,
    };

    setSelectedProject(enrichedProject);
  };

  const renderStatusBadge = (status) => {
    const displayStatus = status || 'Ongoing';
    const normalized = String(displayStatus).toLowerCase().trim();

    const statusClass =
      normalized === 'done' || normalized === 'completed'
        ? 'status-done'
        : normalized === 'hold' || normalized === 'on hold'
          ? 'status-hold'
          : 'status-ongoing';

    const bgColor =
      statusClass === 'status-done'
        ? '#10b981'
        : statusClass === 'status-hold'
          ? '#f59e0b'
          : '#0284c7';

    return (
      <span
        className={`project-status-badge ${statusClass}`}
        style={{ backgroundColor: bgColor, color: '#ffffff' }}
      >
        {displayStatus}
      </span>
    );
  };

  const handleBackToList = () => {
    if (embedded) return;
    setSelectedProject(null);
    setFilteredReports([]);
  };

  const isProjectLocked = (status) => {
    const normalized = String(status || '').toLowerCase();
    return (
      normalized === 'hold' ||
      normalized === 'on_hold' ||
      normalized === 'done' ||
      normalized === 'completed' ||
      normalized === 'cancelled'
    );
  };

  const handleGenerateClick = () => {
    if (isProjectLocked(selectedProject?.project_status)) {
      showToast(
        'warn',
        'Not Allowed',
        'Reports cannot be generated for projects on Hold or Done.',
      );
      return;
    }
    resetForm();
    // Get the highest completion rate from previous reports for this project
    const projectReports = recentReports.filter(
      (report) => report.project_id === selectedProject.project_id,
    );
    const maxPreviousCompletion =
      projectReports.length > 0
        ? Math.max(...projectReports.map((r) => r.current_progress || 0))
        : 0;

    setMinCompletionRate(maxPreviousCompletion);
    setCompletionRate(maxPreviousCompletion);
    setShowReportModal(true);
  };

  // Get the last report's end date for the selected project
  const getLastReportEndDate = () => {
    const projectReports = recentReports.filter(
      (report) => report.project_id === selectedProject?.project_id,
    );
    if (projectReports.length === 0) return null;

    // Find the most recent report by created_at or end_date
    const lastReport = projectReports.reduce((latest, current) => {
      const latestDate = new Date(latest.created_at || latest.end_date || 0);
      const currentDate = new Date(current.created_at || current.end_date || 0);
      return currentDate > latestDate ? current : latest;
    });

    return lastReport.end_date ? new Date(lastReport.end_date) : null;
  };

  const resetForm = () => {
    setCompletionRate(0);
    setReleasedAmount(0);
    setReportValue('');
    setReportStartDate(null);
    setReportEndDate(null);
    setIsPaymentTriggered(false);
    setReportImages([]);
    setImagePreviews([]);
    setImageComments([]);
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);

    files.forEach((file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast('error', 'Invalid File', 'Please select only image files');
        return;
      }

      // Validate file size (max 5MB per file)
      if (file.size > 5 * 1024 * 1024) {
        showToast(
          'error',
          'File Too Large',
          `${file.name} must be less than 5MB`,
        );
        return;
      }

      // Check if not already added
      if (
        !reportImages.some((f) => f.name === file.name && f.size === file.size)
      ) {
        setReportImages((prev) => [...prev, file]);
        setImageComments((prev) => [...prev, '']);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews((prev) => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index) => {
    setReportImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setImageComments((prev) => prev.filter((_, i) => i !== index));
  };

  const updateImageComment = (index, comment) => {
    setImageComments((prev) => {
      const updated = [...prev];
      updated[index] = comment;
      return updated;
    });
  };

  const handleViewImages = (imageUrls, imageComments) => {
    setSelectedReportImages(imageUrls.map((url) => getImageUrl(url)));
    const parsedComments = imageComments ? JSON.parse(imageComments) : [];
    setSelectedImageComments(parsedComments);
    setShowImageModal(true);
  };

  const handlePaymentToggle = async (reportId, checked) => {
    try {
      await api.patch(`/reports/${reportId}`, {
        payment_triggered: checked,
      });

      setRecentReports((prev) =>
        prev.map((report) =>
          report.report_id === reportId
            ? { ...report, payment_triggered: checked }
            : report,
        ),
      );

      showToast(
        'success',
        'Updated',
        checked ? 'Marked as Paid' : 'Marked as Pending',
      );
    } catch (error) {
      console.error('Error updating payment status:', error);
      showToast('error', 'Error', 'Failed to update payment status');
    }
  };

  const handleSubmitReport = async () => {
    if (isProjectLocked(selectedProject?.project_status)) {
      showToast(
        'warn',
        'Not Allowed',
        'Reports cannot be generated for projects on Hold or Done.',
      );
      return;
    }
    // Validate dates are selected
    if (!reportStartDate || !reportEndDate) {
      showToast('warn', 'Warning', 'Please select both start and end dates');
      return;
    }

    // Validate start date is not before last report's end date
    const lastReportEndDate = getLastReportEndDate();
    if (lastReportEndDate) {
      const lastEndDateOnly = new Date(lastReportEndDate);
      lastEndDateOnly.setHours(0, 0, 0, 0);
      const selectedStartDate = new Date(reportStartDate);
      selectedStartDate.setHours(0, 0, 0, 0);

      if (selectedStartDate <= lastEndDateOnly) {
        showToast(
          'error',
          'Invalid Date',
          `Report start date must be after ${formatDate(lastReportEndDate)}`,
        );
        return;
      }
    }

    // Validate start date is before end date
    if (new Date(reportStartDate) > new Date(reportEndDate)) {
      showToast('error', 'Error', 'Start date must be before end date');
      return;
    }

    // Validate completion rate is set and valid
    if (completionRate === null || completionRate === undefined) {
      showToast('warn', 'Warning', 'Please set a completion rate');
      return;
    }

    if (completionRate < 0 || completionRate > 100) {
      showToast('error', 'Error', 'Completion rate must be between 0 and 100');
      return;
    }

    // Validate report description is not empty
    if (!reportValue || reportValue.trim() === '') {
      showToast('warn', 'Warning', 'Please enter a report description');
      return;
    }

    // Validate payment amount is required
    if (!releasedAmount || releasedAmount <= 0) {
      showToast(
        'warn',
        'Warning',
        'Please enter a payment amount greater than 0',
      );
      return;
    }

    // Validate payment amount doesn't exceed remaining balance
    const contractAmount = Number(selectedProject?.total_amount) || 0;
    const totalReleased = Number(selectedProject?.total_amount_released) || 0;
    const amountToRelease = Number(releasedAmount) || 0;
    const remainingBalance = contractAmount - totalReleased;
    if (amountToRelease > remainingBalance) {
      showToast(
        'error',
        'Error',
        `Payment exceeds remaining balance of ${formatCurrency(remainingBalance)}`,
      );
      return;
    }

    try {
      setIsGenerating(true);

      // Save the report to database
      await logReportGeneration();

      // Close the input modal
      setShowReportModal(false);

      showToast('success', 'Success', 'Report generated successfully!');

      // Refresh reports list
      fetchRecentReports();
      if (onReportsChanged) {
        onReportsChanged();
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      showToast('error', 'Error', 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
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

  const downloadReportCSV = (report) => {
    try {
      const project = projects.find((p) => p.project_id === report.project_id);
      if (!project) {
        showToast('error', 'Error', 'Project not found');
        return;
      }

      const projectReports = recentReports.filter(
        (r) => r.project_id === report.project_id,
      );
      const totalSpent = projectReports.reduce(
        (sum, r) => sum + (Number(r.payment_requested) || 0),
        0,
      );
      const contractAmount = Number(project.total_amount) || 0;
      const remainingBalance = contractAmount - totalSpent;

      const rows = [
        ['Field', 'Value'],
        ['Project Name', project.project_name],
        ['Client', getClientName(project.client_id)],
        ['Contractor', getContractorName(project.contractor_id)],
        ['Contract Amount', `₱${contractAmount}`],
        ['Total Spent', `₱${totalSpent}`],
        ['Remaining Balance', `₱${remainingBalance}`],
        ['Report Start Date', formatDate(report.start_date)],
        ['Report End Date', formatDate(report.end_date)],
        ['Completion Rate', `${report.current_progress || 0}%`],
        ['Payment Requested', `₱${report.payment_requested || 0}`],
        ['Report Description', report.report_description || ''],
        [
          'Generated On',
          formatDateTime(report.created_at || report.start_date),
        ],
      ];

      const csvContent = rows.map((e) => e.join(',')).join('\n');
      const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `Report_${project.project_name}_${formatDateForFilename(report.start_date)}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('success', 'Success', 'CSV downloaded successfully');
    } catch (error) {
      console.error('Error generating CSV:', error);
      showToast('error', 'Error', 'Failed to generate CSV');
    }
  };

  const logReportGeneration = async () => {
    try {
      const formData = new FormData();
      formData.append('project_id', selectedProject.project_id);

      // Format dates properly for database
      if (reportStartDate) {
        const startDateStr = reportStartDate.toISOString().split('T')[0];
        formData.append('start_date', startDateStr);
      }

      if (reportEndDate) {
        const endDateStr = reportEndDate.toISOString().split('T')[0];
        formData.append('end_date', endDateStr);
      }

      formData.append('current_progress', completionRate);
      formData.append('payment_requested', releasedAmount);
      formData.append('payment_triggered', isPaymentTriggered);
      formData.append('report_description', reportValue);

      // Append multiple images with their comments
      reportImages.forEach((image, index) => {
        formData.append(`images`, image);
      });

      // Append image comments as JSON
      formData.append('image_comments', JSON.stringify(imageComments));

      const response = await api.post('/reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // If completion rate is 100%, automatically set project status to Done
      if (Number(completionRate) >= 100) {
        try {
          await api.patch(`/projects/${selectedProject.project_id}`, {
            project_status: 'Done',
          });
          setSelectedProject((prev) =>
            prev ? { ...prev, project_status: 'Done' } : prev,
          );
          fetchProjects();
        } catch (error) {
          console.error('Error updating project status:', error);
        }
      }

      fetchRecentReports();
    } catch (error) {
      console.error('Error logging report generation:', error);
      throw error;
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₱0.00';
    return `₱${Number(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateForFilename = (dateString) => {
    if (!dateString) return 'unknown';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMenuItems = (report) => [
    {
      label: 'Download as PDF',
      icon: 'pi pi-file-pdf',
      command: () => downloadReportPDF(report),
    },
    {
      label: 'Download as CSV',
      icon: 'pi pi-file-excel',
      command: () => downloadReportCSV(report),
    },
    {
      separator: true,
    },
    {
      label: 'Regenerate',
      icon: 'pi pi-refresh',
      disabled: isProjectLocked(selectedProject?.project_status),
      command: () => {
        if (isProjectLocked(selectedProject?.project_status)) {
          showToast(
            'warn',
            'Not Allowed',
            'Reports cannot be generated for projects on Hold or Done.',
          );
          return;
        }
        setCompletionRate(report.current_progress || 0);
        setReleasedAmount(report.payment_requested || 0);
        setReportValue(report.report_description || '');
        setReportStartDate(
          report.start_date ? new Date(report.start_date) : null,
        );
        setReportEndDate(report.end_date ? new Date(report.end_date) : null);
        setIsPaymentTriggered(!!report.payment_triggered);
        setReportImages([]);
        setImagePreviews([]);
        setShowReportModal(true);
      },
    },
    {
      label: 'View Details',
      icon: 'pi pi-eye',
      command: () => {
        // You can implement a detailed view modal here
        showToast(
          'info',
          'Report Details',
          `Report ID: ${report.report_id || 'N/A'}`,
        );
      },
    },
  ];

  const getProjectReports = (projectId) =>
    recentReports.filter((report) => report.project_id === projectId);

  const getLatestProgress = (projectReports) =>
    projectReports.reduce(
      (max, report) => Math.max(max, Number(report.current_progress || 0)),
      0,
    );

  const getTotalReleased = (projectReports) =>
    projectReports.reduce(
      (sum, report) => sum + (Number(report.payment_requested) || 0),
      0,
    );

  const getReportRange = (projectReports) => {
    if (!projectReports.length) {
      return { start: 'N/A', end: 'N/A' };
    }

    const sorted = [...projectReports].sort((a, b) => {
      const aDate = new Date(a.created_at || a.start_date || a.report_date);
      const bDate = new Date(b.created_at || b.start_date || b.report_date);
      return aDate - bDate;
    });

    const startReport = sorted[0];
    const endReport = sorted[sorted.length - 1];

    return {
      start: formatDate(startReport.start_date || startReport.report_date),
      end: formatDate(endReport.end_date || endReport.report_date),
    };
  };

  const downloadAggregateReportCSV = () => {
    if (!selectedProject || selectedProject.parent_project_id) {
      showToast(
        'warn',
        'Not Available',
        'Summary reports are only available for main projects.',
      );
      return;
    }

    try {
      const mainReports = getProjectReports(selectedProject.project_id);
      const reportRange = getReportRange(mainReports);
      const mainSummary = {
        reportCount: mainReports.length,
        latestProgress: getLatestProgress(mainReports),
        totalReleased: getTotalReleased(mainReports),
      };

      const subProjects = projects.filter(
        (project) => project.parent_project_id === selectedProject.project_id,
      );

      const rows = [
        ['Main Project Summary'],
        ['Project Name', selectedProject.project_name],
        ['Client', getClientName(selectedProject.client_id)],
        ['Contractor', getContractorName(selectedProject.contractor_id)],
        ['Status', selectedProject.project_status || 'Ongoing'],
        ['Project Duration', `${reportRange.start} - ${reportRange.end}`],
        ['Total Reports', mainSummary.reportCount],
        ['Latest Progress', `${mainSummary.latestProgress}%`],
        ['Total Released', formatCurrency(mainSummary.totalReleased)],
        ['Budget', formatCurrency(selectedProject.total_amount)],
        [],
        [
          'Subproject',
          'Status',
          'Project Duration',
          'Reports',
          'Latest Progress',
          'Total Released',
        ],
      ];

      subProjects.forEach((project) => {
        const reports = getProjectReports(project.project_id);
        const period = getReportRange(reports);
        rows.push([
          project.project_name,
          project.project_status || 'Ongoing',
          `${period.start} - ${period.end}`,
          reports.length,
          `${getLatestProgress(reports)}%`,
          formatCurrency(getTotalReleased(reports)),
        ]);
      });

      const csvContent = rows.map((row) => row.join(',')).join('\n');
      const encodedUri = encodeURI(
        'data:text/csv;charset=utf-8,' + csvContent,
      );
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `Report_Summary_${selectedProject.project_name}_${formatDateForFilename(new Date())}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('success', 'Success', 'Summary CSV downloaded successfully');
    } catch (error) {
      console.error('Error generating summary CSV:', error);
      showToast('error', 'Error', 'Failed to generate summary CSV');
    }
  };

  const downloadProjectReportsCSV = (project) => {
    if (!project) {
      showToast('error', 'Error', 'Project not found');
      return;
    }
    try {
      const reports = getProjectReports(project.project_id);
      if (!reports.length) {
        showToast('info', 'No Reports', 'No reports found for this project');
        return;
      }

      const rows = [
        ['Project', project.project_name],
        ['Project Duration', `${formatDate(project.project_start_date)} - ${formatDate(project.project_deadline)}`],
        [],
        [
          'Report #',
          'Start Date',
          'End Date',
          'Progress',
          'Payment Requested',
          'Generated At',
        ],
      ];

      reports
        .slice()
        .sort(
          (a, b) =>
            new Date(a.created_at || a.start_date) -
            new Date(b.created_at || b.start_date),
        )
        .forEach((report, index) => {
          rows.push([
            index + 1,
            formatDate(report.start_date || report.report_date),
            formatDate(report.end_date || report.report_date),
            `${report.current_progress || 0}%`,
            formatCurrency(report.payment_requested),
            formatDateTime(report.created_at || report.start_date),
          ]);
        });

      const csvContent = rows.map((row) => row.join(',')).join('\n');
      const encodedUri = encodeURI(
        'data:text/csv;charset=utf-8,' + csvContent,
      );
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `Reports_${project.project_name}_${formatDateForFilename(new Date())}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('success', 'Success', 'Project reports CSV downloaded');
    } catch (error) {
      console.error('Error generating project reports CSV:', error);
      showToast('error', 'Error', 'Failed to generate project reports CSV');
    }
  };

  const downloadProjectReportsPDF = async (project) => {
    if (!project) {
      showToast('error', 'Error', 'Project not found');
      return;
    }

    try {
      const reports = getProjectReports(project.project_id)
        .slice()
        .sort(
          (a, b) =>
            new Date(a.created_at || a.start_date) -
            new Date(b.created_at || b.start_date),
        );

      if (!reports.length) {
        showToast('info', 'No Reports', 'No reports found for this project');
        return;
      }

      const reportPeriod = getReportRange(reports);

      // Get parent project name if this is a subproject
      let parentProjectName = '';
      if (project.parent_project_id) {
        const parentProject = projects.find(
          (p) => p.project_id === project.parent_project_id,
        );
        parentProjectName = parentProject?.project_name || '';
      }

      const doc = (
        <ProjectReportsListPDF
          project={project}
          clientName={getClientName(project.client_id)}
          contractorName={getContractorName(project.contractor_id)}
          parentProjectName={parentProjectName}
          reportPeriod={reportPeriod}
          reports={reports}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          formatDateTime={formatDateTime}
        />
      );

      const blob = await pdf(doc).toBlob();
      const fileName = `Reports_${project.project_name}_${formatDateForFilename(new Date())}.pdf`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);

      showToast('success', 'Success', 'Project reports PDF downloaded');
    } catch (error) {
      console.error('Error generating project reports PDF:', error);
      showToast('error', 'Error', 'Failed to generate project reports PDF');
    }
  };

  const downloadAggregateReportPDF = async () => {
    if (!selectedProject || selectedProject.parent_project_id) {
      showToast(
        'warn',
        'Not Available',
        'Summary reports are only available for main projects.',
      );
      return;
    }

    try {
      const mainReports = getProjectReports(selectedProject.project_id);
      const reportRange = getReportRange(mainReports);
      const mainSummary = {
        reportCount: mainReports.length,
        latestProgress: getLatestProgress(mainReports),
        totalReleased: getTotalReleased(mainReports),
      };

      const subProjects = projects.filter(
        (project) => project.parent_project_id === selectedProject.project_id,
      );

      const subprojectSummaries = subProjects.map((project) => {
        const reports = getProjectReports(project.project_id);
        return {
          project_id: project.project_id,
          project_name: project.project_name,
          project_status: project.project_status,
          latestProgress: getLatestProgress(reports),
          totalReleased: getTotalReleased(reports),
          reportCount: reports.length,
        };
      });

      const doc = (
        <ProjectAggregateReportPDF
          mainProject={selectedProject}
          clientName={getClientName(selectedProject.client_id)}
          contractorName={getContractorName(selectedProject.contractor_id)}
          reportRange={reportRange}
          mainSummary={mainSummary}
          subprojectSummaries={subprojectSummaries}
          generatedAt={formatDateTime(new Date())}
        />
      );

      const blob = await pdf(doc).toBlob();
      const fileName = `Report_Summary_${selectedProject.project_name}_${formatDateForFilename(new Date())}.pdf`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);

      showToast('success', 'Success', 'Summary PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating summary PDF:', error);
      showToast('error', 'Error', 'Failed to generate summary PDF');
    }
  };

  // Project List View
  const renderProjectListView = () => {
    const filteredProjects = projects.filter((project) =>
      project.project_name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
      <div>
        <div className="reports-section-header">
          <div className="reports-header-content">
            <div>
              <h2>PROJECT REPORTS</h2>
              <p>
                Select a project to access and generate comprehensive reports
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
            </div>
          </div>
        </div>

        <div className="reports-grid">
          {filteredProjects.map((project) => (
            <div
              key={project.project_id}
              className="reports-card"
              onClick={() => handleProjectClick(project)}
            >
              <h3>
                {project.project_name}
                <span className="reports-card-report-count">
                  {
                    recentReports.filter(
                      (r) => r.project_id === project.project_id,
                    ).length
                  }{' '}
                  times generated
                </span>
              </h3>

              <div className="reports-card-section">
                <div className="reports-card-item">
                  <span className="reports-card-label">Status:</span>
                  <span className="reports-card-value">
                    {renderStatusBadge(project.project_status)}
                  </span>
                </div>
              </div>

              <div className="reports-card-section">
                <div className="reports-card-item">
                  <span className="reports-card-label">Client:</span>
                  <span className="reports-card-value">
                    {getClientName(project.client_id)}
                  </span>
                </div>
                <div className="reports-card-item">
                  <span className="reports-card-label">Contractor:</span>
                  <span className="reports-card-value">
                    {getContractorName(project.contractor_id)}
                  </span>
                </div>
              </div>

              <div className="reports-card-section">
                <div className="reports-card-item">
                  <span className="reports-card-label">Start Date:</span>
                  <span className="reports-card-value">
                    {formatDate(project.project_start_date)}
                  </span>
                </div>
                <div className="reports-card-item">
                  <span className="reports-card-label">End Date:</span>
                  <span className="reports-card-value">
                    {formatDate(project.project_deadline)}
                  </span>
                </div>
              </div>

              <div className="reports-card-section">
                <div className="reports-card-item">
                  <span className="reports-card-label">Budget:</span>
                  <span className="reports-card-value">
                    {formatCurrency(project.total_amount)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Project Detail View (when project is selected)
  const ProjectDetailView = () => (
    <div>
      <div className="mb-6">
        {!embedded && (
          <Button
            label="Back to Projects"
            icon="pi pi-arrow-left"
            className="p-button-text mb-3"
            onClick={handleBackToList}
          />
        )}

        <div className="flex justify-between items-start gap-4">
          <div style={{ textAlign: 'left' }}>
            <h2 className="m-0">{selectedProject.project_name}</h2>
            <p className="text-color-secondary m-0">
              Client: {getClientName(selectedProject.client_id)}
              <br />
              Contractor: {getContractorName(selectedProject.contractor_id)}
            </p>
            <div className="flex gap-2" style={{ marginTop: '1rem' }}>
              {!isProjectLocked(selectedProject?.project_status) && (
                <Button
                  label="Generate New Report"
                  onClick={handleGenerateClick}
                  className="p-button-primary"
                />
              )}
              <Button
                label="Print Reports CSV"
                icon="pi pi-file-excel"
                className="p-button-outlined p-button-sm p-button-success"
                disabled={!getProjectReports(selectedProject.project_id).length}
                onClick={() => downloadProjectReportsCSV(selectedProject)}
              />
              <Button
                label="Print Reports PDF"
                icon="pi pi-file-pdf"
                className="p-button-outlined p-button-sm p-button-danger"
                disabled={!getProjectReports(selectedProject.project_id).length}
                onClick={() => downloadProjectReportsPDF(selectedProject)}
              />
            </div>
          </div>
          <div
            className="flex flex-column gap-3 items-end flex-shrink-0"
            style={{ marginLeft: 'auto' }}
          >
            <Card className="p-1" style={{ minWidth: '520px' }}>
              <h4
                className="m-0"
                style={{ fontSize: '12px', marginBottom: '4px' }}
              >
                Project Info
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '8px',
                }}
              >
                <div>
                  <span className="font-bold text-xs">Status:</span>
                  <div style={{ marginTop: '2px' }}>
                    {renderStatusBadge(selectedProject.project_status)}
                  </div>
                </div>
                <div>
                  <span className="font-bold text-xs">Budget:</span>
                  <p className="m-0 text-xs font-bold text-primary">
                    {formatCurrency(selectedProject.total_amount)}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-xs">Deadline:</span>
                  <p className="m-0 text-xs">
                    {formatDate(selectedProject.project_deadline)}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {selectedProject && !selectedProject.parent_project_id && (
        <Card className="p-4 mb-4">
          <div className="flex justify-between items-center gap-3">
            <div>
              <h4 className="m-0">All Reports Summary</h4>
              <small className="text-color-secondary">
                Main project totals and per-subproject status
              </small>
            </div>
            <div className="flex gap-2">
              <Button
                label="Download Summary PDF"
                icon="pi pi-file-pdf"
                className="p-button-outlined p-button-sm p-button-danger"
                onClick={downloadAggregateReportPDF}
              />
              <Button
                label="Download Summary CSV"
                icon="pi pi-file-excel"
                className="p-button-outlined p-button-sm p-button-success"
                onClick={downloadAggregateReportCSV}
              />
            </div>
          </div>

          <Divider className="my-3" />

          {(() => {
            const mainReports = getProjectReports(selectedProject.project_id);
            const mainSummary = {
              reportCount: mainReports.length,
              latestProgress: getLatestProgress(mainReports),
              totalReleased: getTotalReleased(mainReports),
            };
            const mainReportPeriod = getReportRange(mainReports);

            const subProjects = projects.filter(
              (project) =>
                project.parent_project_id === selectedProject.project_id,
            );

            const subSummaries = subProjects.map((project) => {
              const reports = getProjectReports(project.project_id);
              const reportPeriod = getReportRange(reports);
              return {
                project,
                project_id: project.project_id,
                project_name: project.project_name,
                project_status: project.project_status,
                latestProgress: getLatestProgress(reports),
                totalReleased: getTotalReleased(reports),
                reportCount: reports.length,
                reportPeriod,
              };
            });

            return (
              <div className="grid">
                <div className="col-12 lg:col-5">
                  <h5 className="mt-0 mb-2">Main Project</h5>
                  <div className="grid">
                    <div className="col-12 sm:col-6">
                      <span className="font-bold text-xs">Status:</span>
                      <div style={{ marginTop: '4px' }}>
                        {renderStatusBadge(selectedProject.project_status)}
                      </div>
                    </div>
                    <div className="col-12 sm:col-6">
                      <span className="font-bold text-xs">Reports:</span>
                      <p className="m-0 text-sm">{mainSummary.reportCount}</p>
                    </div>
                    <div className="col-12 sm:col-6">
                      <span className="font-bold text-xs">Project Duration:</span>
                      <p className="m-0 text-sm">
                        {mainReportPeriod.start} - {mainReportPeriod.end}
                      </p>
                    </div>
                    <div className="col-12 sm:col-6">
                      <span className="font-bold text-xs">Latest Progress:</span>
                      <p className="m-0 text-sm">{mainSummary.latestProgress}%</p>
                    </div>
                    <div className="col-12 sm:col-6">
                      <span className="font-bold text-xs">Total Released:</span>
                      <p className="m-0 text-sm">
                        {formatCurrency(mainSummary.totalReleased)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-12 lg:col-7">
                  <h5 className="mt-0 mb-2">Subprojects</h5>
                  {subSummaries.length ? (
                    <div className="grid">
                      {subSummaries.map((summary) => (
                        <div
                          key={summary.project_id}
                          className="col-12"
                          style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div>
                              <div className="font-bold text-sm">
                                {summary.project_name}
                              </div>
                              <div style={{ marginTop: '4px' }}>
                                {renderStatusBadge(summary.project_status)}
                              </div>
                              <div className="text-xs text-color-secondary" style={{ marginTop: '6px' }}>
                                Project Duration: {summary.reportPeriod.start} - {summary.reportPeriod.end}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-color-secondary">
                                Latest Progress
                              </div>
                              <div className="font-bold text-sm">
                                {summary.latestProgress}%
                              </div>
                              <div className="text-xs text-color-secondary mt-2">
                                Total Released
                              </div>
                              <div className="font-bold text-sm">
                                {formatCurrency(summary.totalReleased)}
                              </div>
                              <div className="mt-2">
                                <Button
                                  label="Print Reports CSV"
                                  icon="pi pi-file-excel"
                                  className="p-button-text p-button-sm"
                                  onClick={() =>
                                    downloadProjectReportsCSV(summary.project)
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="m-0 text-sm text-color-secondary">
                      No subprojects found.
                    </p>
                  )}
                </div>
              </div>
            );
          })()}
        </Card>
      )}

      <div style={{ marginTop: '-35px', paddingTop: 0 }}>
        <h3 style={{ marginTop: 0, marginBottom: '0.5rem', paddingTop: 0 }}>
          Billings ({filteredReports.length})
        </h3>
        {filteredReports.length > 0 ? (
          <div className="grid">
            {filteredReports.map((report, index) => (
              <div key={index} className="col-12 lg:col-6">
                <Card className="p-4">
                  <div className="flex flex-column gap-3 h-full">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="m-0">
                          Billing #{filteredReports.length - index}
                        </h4>
                        <small className="text-color-secondary">
                          Generated:{' '}
                          {formatDateTime(
                            report.created_at || report.start_date,
                          )}
                        </small>
                        {report.created_by && (
                          <small
                            className="text-color-secondary"
                            style={{ display: 'block', marginTop: '4px' }}
                          >
                            By: {report.created_by}
                          </small>
                        )}
                      </div>
                      <Button
                        icon="pi pi-ellipsis-v"
                        className="p-button-rounded p-button-text p-button-sm"
                        onClick={(e) => {
                          if (!menuRefs.current[index]) {
                            menuRefs.current[index] = React.createRef();
                          }
                          menuRefs.current[index].current.toggle(e);
                        }}
                        aria-label="Actions"
                      />
                      <Menu
                        model={getMenuItems(report)}
                        popup
                        ref={
                          menuRefs.current[index] ||
                          (menuRefs.current[index] = React.createRef())
                        }
                        id={`menu_${index}`}
                      />
                    </div>

                    <div className="completion-progress-section">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-sm">
                          Completion Progress
                        </span>
                      </div>
                      <ProgressBar
                        value={report.current_progress}
                        className="report-progress-bar"
                      />
                    </div>

                    {report.image_urls && report.image_urls.length > 0 && (
                      <div className="flex items-center gap-2 p-3 surface-100 border-round">
                        <i className="pi pi-paperclip text-lg" />
                        <span className="font-bold">
                          Attachments: {report.image_urls.length} image
                          {report.image_urls.length !== 1 ? 's' : ''}
                        </span>
                        <Button
                          label="View Images"
                          icon="pi pi-eye"
                          className="p-button-sm p-button-text"
                          onClick={() =>
                            handleViewImages(
                              report.image_urls,
                              report.image_comments,
                            )
                          }
                        />
                      </div>
                    )}

                    <Divider className="my-2" />

                    <div className="grid">
                      <div className="col-6">
                        <span className="font-bold">Project Duration:</span>
                        <p className="m-0 text-sm">
                          {formatDate(report.start_date || report.report_date)}{' '}
                          - {formatDate(report.end_date || report.report_date)}
                        </p>
                      </div>
                      <div className="col-6">
                        <span className="font-bold">Payment:</span>
                        <p className="m-0 text-sm">
                          {formatCurrency(report.payment_requested)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            id={`paid-${report.report_id}`}
                            type="checkbox"
                            checked={!!report.payment_triggered}
                            onChange={(e) =>
                              handlePaymentToggle(
                                report.report_id,
                                e.target.checked,
                              )
                            }
                          />
                          <label
                            htmlFor={`paid-${report.report_id}`}
                            className="text-sm"
                          >
                            Paid
                          </label>
                        </div>
                      </div>
                    </div>

                    {report.report_description && (
                      <div>
                        <span className="font-bold">Notes:</span>
                        <p className="m-0 text-sm line-height-3">
                          {report.report_description.length > 120
                            ? `${report.report_description.substring(0, 120)}...`
                            : report.report_description}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2 mt-3">
                      <Button
                        label="Download PDF"
                        icon="pi pi-file-pdf"
                        className="p-button-outlined p-button-sm p-button-danger"
                        onClick={() => downloadReportPDF(report)}
                      />
                      <Button
                        label="Download CSV"
                        icon="pi pi-file-excel"
                        className="p-button-outlined p-button-sm p-button-success"
                        onClick={() => downloadReportCSV(report)}
                      />
                      {/* <Button
                          label="Regenerate"
                          icon="pi pi-refresh"
                          className="p-button-outlined p-button-sm"
                          onClick={() => {
                            setCompletionRate(report.current_progress || 0);
                            setReleasedAmount(report.payment_requested || 0);
                            setReportValue(report.report_description || '');
                            setReportStartDate(
                              report.start_date
                                ? new Date(report.start_date)
                                : null,
                            );
                            setReportEndDate(
                              report.end_date
                                ? new Date(report.end_date)
                                : null,
                            );
                            setReportImages([]);
                            setImagePreviews([]);
                            setShowReportModal(true);
                          }}
                        /> */}
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <i className="pi pi-file-excel text-6xl text-color-secondary mb-3" />
            <h3>No Billings Yet</h3>
            <p className="text-color-secondary mb-4">
              Generate the first billing for this project
            </p>
            {!isProjectLocked(selectedProject?.project_status) && (
              <Button
                label="Generate First Billing"
                icon="pi pi-file"
                onClick={handleGenerateClick}
                className="p-button-primary"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="reports-container">
      <Toast ref={toast} />

      {embedded
        ? selectedProject
          ? <ProjectDetailView />
          : null
        : !selectedProject
          ? renderProjectListView()
          : <ProjectDetailView />}

      {/* Report Generation Modal */}
      <Dialog
        header="Generate New Report"
        visible={showReportModal}
        style={{ width: '70vw', maxHeight: '90vh' }}
        contentStyle={{ padding: '1.5rem 2rem' }}
        onHide={() => setShowReportModal(false)}
        headerStyle={{
          backgroundColor: '#404a17',
          color: 'white',
          padding: '1rem',
        }}
      >
        {selectedProject && (
          <div
            className="report-modal-scroll"
            style={{
              maxHeight: 'calc(90vh - 200px)',
              overflowY: 'auto',
              padding: 0,
            }}
          >
            {/* Project Period Header */}
            <h3
              style={{
                textAlign: 'center',
                marginBottom: '1.5rem',
                fontSize: '18px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
              }}
            >
              ACCOMPLISHMENT REPORT
            </h3>
            <div style={{ height: '1.5rem' }} />

            {/* Main Two Column Layout */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                columnGap: '2rem',
                rowGap: '1rem',
                alignItems: 'start',
              }}
            >
              {/* Row 1 */}
              <div>
                <label
                  style={{
                    fontWeight: 'bold',
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '12px',
                  }}
                >
                  Project Name:
                </label>
                <InputText
                  value={selectedProject?.project_name || ''}
                  disabled
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    height: '42px',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontWeight: 'bold',
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '12px',
                  }}
                >
                  Contract Amount
                </label>
                <div
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    border: '1px solid #e5e7eb',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {formatCurrency(selectedProject?.total_amount)}
                </div>
              </div>

              {/* Row 2 */}
              <div>
                <label
                  style={{
                    fontWeight: 'bold',
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '12px',
                  }}
                >
                  Client Name:
                </label>
                <InputText
                  value={getClientName(selectedProject?.client_id) || ''}
                  disabled
                  style={{ width: '100%', padding: '0.75rem', height: '42px' }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontWeight: 'bold',
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '12px',
                  }}
                >
                  Total Spent:
                </label>
                <div
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    border: '1px solid #e5e7eb',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {formatCurrency(selectedProject?.total_amount_released || 0)}
                </div>
              </div>

              {/* Row 3 */}
              <div>
                <label
                  style={{
                    fontWeight: 'bold',
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '12px',
                  }}
                >
                  Contractor:
                </label>
                <InputText
                  value={
                    getContractorName(selectedProject?.contractor_id) || ''
                  }
                  disabled
                  style={{ width: '100%', padding: '0.75rem', height: '42px' }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontWeight: 'bold',
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '12px',
                  }}
                >
                  Remaining Balance:
                </label>
                <div
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#065f46',
                    border: '1px solid #86efac',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {formatCurrency(
                    (Number(selectedProject?.total_amount) || 0) -
                      (selectedProject?.total_amount_released || 0),
                  )}
                </div>
              </div>

              {/* Row 4 - Project Duration */}
              <div>
                <label
                  style={{
                    fontWeight: 'bold',
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '12px',
                  }}
                >
                  Report Start Date *
                </label>
                <Calendar
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.value)}
                  placeholder="Start Date"
                  dateFormat="mm/dd/yy"
                  showIcon
                  style={{ width: '100%' }}
                  minDate={
                    getLastReportEndDate()
                      ? new Date(getLastReportEndDate().getTime() + 86400000)
                      : undefined
                  }
                />
              </div>
              <div>
                <label
                  style={{
                    fontWeight: 'bold',
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '12px',
                  }}
                >
                  Report End Date *
                </label>
                <Calendar
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.value)}
                  placeholder="End Date"
                  dateFormat="mm/dd/yy"
                  showIcon
                  style={{ width: '100%' }}
                  minDate={
                    reportStartDate ||
                    (getLastReportEndDate()
                      ? new Date(getLastReportEndDate().getTime() + 86400000)
                      : undefined)
                  }
                />
              </div>

              {/* Row 5 - Amount to Release */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label
                  style={{
                    fontWeight: 'bold',
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '12px',
                  }}
                >
                  Amount to be Released *
                </label>
                <InputNumber
                  value={releasedAmount}
                  onValueChange={(e) => {
                    const newAmount = Number(e.value || 0);
                    setReleasedAmount(newAmount);

                    const contractAmount = Number(selectedProject?.total_amount) || 0;
                    const totalReleased = Number(selectedProject?.total_amount_released) || 0;
                    const unreleasedBudget = contractAmount - totalReleased;

                    if (unreleasedBudget > 0) {
                      const calculatedRate = (newAmount / unreleasedBudget) * 100;
                      const clampedRate = Math.min(
                        100,
                        Math.max(calculatedRate, minCompletionRate),
                      );
                      const roundedRate = Number(clampedRate.toFixed(2));
                      setCompletionRate(roundedRate);
                    } else {
                      setCompletionRate(minCompletionRate);
                    }
                  }}
                  prefix="₱"
                  min={0}
                  mode="decimal"
                  locale="en-PH"
                  placeholder="0.00"
                  minFractionDigits={2}
                  maxFractionDigits={2}
                  style={{
                    width: '100%',
                  }}
                />
                <div
                  style={{
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <input
                    id="payment-triggered"
                    type="checkbox"
                    checked={isPaymentTriggered}
                    onChange={(e) => setIsPaymentTriggered(e.target.checked)}
                  />
                  <label
                    htmlFor="payment-triggered"
                    style={{ fontSize: '12px' }}
                  >
                    Paid
                  </label>
                </div>
              </div>

              {/* Row 6 - Description */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label
                  style={{
                    fontWeight: 'bold',
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '12px',
                  }}
                >
                  Description *
                </label>
                <InputTextarea
                  value={reportValue}
                  onChange={(e) => setReportValue(e.target.value)}
                  rows={4}
                  style={{ width: '100%', padding: '0.75rem' }}
                  placeholder="Enter report description..."
                />
              </div>
            </div>

            {/* Full Width Sections Below */}
            <div style={{ marginTop: '1.5rem' }}>
              {/* Completion Rate */}
              <div
                style={{
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '4px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                  }}
                >
                  <label style={{ fontWeight: 'bold', fontSize: '13px' }}>
                    Completion Rate
                  </label>
                  <div
                    style={{
                      backgroundColor: '#4f4d36',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      fontSize: '14px',
                    }}
                  >
                    {Number(completionRate || 0).toFixed(2)}%
                  </div>
                </div>
                <Slider
                  value={completionRate}
                  onChange={(e) => {
                    const newRate = Math.max(e.value, minCompletionRate);
                    const roundedRate = Number(newRate.toFixed(2));
                    setCompletionRate(roundedRate);
                    // Calculate unreleased budget
                    const contractAmount = Number(selectedProject?.total_amount) || 0;
                    const totalReleased = Number(selectedProject?.total_amount_released) || 0;
                    const unreleasedBudget = contractAmount - totalReleased;
                    // Set releasedAmount to the corresponding percentage of unreleased budget
                    const newAmount = Number(
                      ((unreleasedBudget * roundedRate) / 100).toFixed(2),
                    );
                    setReleasedAmount(newAmount);
                  }}
                  min={minCompletionRate}
                  max={100}
                  step={0.01}
                  className="completion-rate-slider"
                  style={{ height: '6px' }}
                />
              </div>

              {/* Photo Section */}
              <div
                style={{
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '4px',
                }}
              >
                <label
                  style={{
                    fontWeight: 'bold',
                    display: 'block',
                    marginBottom: '0.75rem',
                    fontSize: '12px',
                  }}
                >
                  Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  style={{ width: '100%' }}
                />
                <small
                  style={{
                    color: '#6b7280',
                    display: 'block',
                    marginTop: '0.5rem',
                  }}
                >
                  Supported formats: JPG, PNG, GIF, WebP (Max 5MB per image)
                </small>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div
                  style={{
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '4px',
                  }}
                >
                  <h5
                    style={{
                      marginTop: 0,
                      marginBottom: '1rem',
                      fontSize: '13px',
                      fontWeight: 'bold',
                    }}
                  >
                    Image Previews ({imagePreviews.length})
                  </h5>
                  <div className="grid">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="col-12 md:col-6 lg:col-4">
                        <div
                          style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: '4px',
                            padding: '0.75rem',
                          }}
                        >
                          <div
                            style={{
                              position: 'relative',
                              marginBottom: '0.5rem',
                            }}
                          >
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              style={{
                                width: '100%',
                                height: '180px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                              }}
                            />
                            <Button
                              icon="pi pi-times"
                              className="p-button-rounded p-button-text p-button-sm"
                              style={{
                                position: 'absolute',
                                top: '5px',
                                right: '5px',
                                backgroundColor: 'rgba(255,255,255,0.9)',
                              }}
                              onClick={() => removeImage(index)}
                            />
                          </div>
                          <small
                            style={{
                              color: '#6b7280',
                              display: 'block',
                              marginBottom: '0.5rem',
                              fontWeight: 'bold',
                            }}
                          >
                            Image {index + 1}
                          </small>
                          <InputTextarea
                            placeholder="Add a comment..."
                            value={imageComments[index] || ''}
                            onChange={(e) =>
                              updateImageComment(index, e.target.value)
                            }
                            rows={2}
                            style={{ width: '100%', fontSize: '12px' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Generate Button */}
            <div
              style={{
                textAlign: 'center',
                marginTop: '2rem',
                paddingBottom: '1rem',
              }}
            >
              <Button
                label={isGenerating ? 'Generating...' : 'Generate Report'}
                icon={isGenerating ? 'pi pi-spinner pi-spin' : 'pi pi-check'}
                onClick={handleSubmitReport}
                disabled={isGenerating}
                style={{
                  backgroundColor: '#4f4d36',
                  borderColor: '#4f4d36',
                  color: 'white',
                  padding: '0.75rem 2rem',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              />
            </div>
          </div>
        )}
      </Dialog>

      {/* Image Viewer Modal */}
      <Dialog
        header="Report Images"
        visible={showImageModal}
        style={{ width: '80vw' }}
        modal
        onHide={() => setShowImageModal(false)}
      >
        {selectedReportImages.length > 0 ? (
          <div className="grid gap-3">
            {selectedReportImages.map((imageUrl, index) => (
              <div key={index} className="col-12 md:col-6 lg:col-4">
                <div className="border-1 surface-border border-round overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={`Report image ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '300px',
                      objectFit: 'cover',
                    }}
                  />
                  <div className="p-3 surface-50">
                    <div className="mb-2 text-center">
                      <small className="text-color-secondary font-bold">
                        Image {index + 1}
                      </small>
                    </div>
                    {selectedImageComments[index] && (
                      <div className="p-2 surface-100 border-round-sm">
                        <small className="text-color-secondary">
                          <strong>Comment:</strong>{' '}
                          {selectedImageComments[index]}
                        </small>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-4">
            <i className="pi pi-image text-4xl text-color-secondary mb-3 block" />
            <p>No images to display</p>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default ReportsPanel;

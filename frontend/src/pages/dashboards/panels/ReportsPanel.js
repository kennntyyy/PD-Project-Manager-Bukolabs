import React, { useState, useEffect, useRef } from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
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
import { Tag } from 'primereact/tag';
import { FloatLabel } from 'primereact/floatlabel';
import { Slider } from 'primereact/slider';
import { Divider } from 'primereact/divider';
import { ProgressBar } from 'primereact/progressbar';
import { Card } from 'primereact/card';
import { Toolbar } from 'primereact/toolbar';
import { TabView, TabPanel } from 'primereact/tabview';
import { Badge } from 'primereact/badge';
import { Skeleton } from 'primereact/skeleton';
import { Menu } from 'primereact/menu';
import { SplitButton } from 'primereact/splitbutton';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { pdf } from '@react-pdf/renderer';
import { ProjectReportPDF } from '../../dashboards/staff_panels/ProjectReportPDF';
import api from '../../../services/api';

const StaffReportsPanel = () => {
  const [projects, setProjects] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [completionRate, setCompletionRate] = useState(0);
  const [releasedAmount, setReleasedAmount] = useState(0);
  const [reportValue, setReportValue] = useState('');
  const [reportStartDate, setReportStartDate] = useState(null);
  const [reportEndDate, setReportEndDate] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportImages, setReportImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageComments, setImageComments] = useState([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedReportImages, setSelectedReportImages] = useState([]);
  const [selectedImageComments, setSelectedImageComments] = useState([]);
  const toast = useRef(null);
  const menuRefs = useRef({});

  // Get base URL for images
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
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

  const showToast = (severity, summary, detail) => {
    toast.current.show({ severity, summary, detail, life: 3000 });
  };

  const handleProjectClick = (project) => {
    setSelectedProject(project);
  };

  const handleBackToList = () => {
    setSelectedProject(null);
    setFilteredReports([]);
  };

  const handleGenerateClick = () => {
    resetForm();
    setShowReportModal(true);
  };

  const resetForm = () => {
    setCompletionRate(0);
    setReleasedAmount(0);
    setReportValue('');
    setReportStartDate(null);
    setReportEndDate(null);
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
        showToast('error', 'File Too Large', `${file.name} must be less than 5MB`);
        return;
      }

      // Check if not already added
      if (!reportImages.some(f => f.name === file.name && f.size === file.size)) {
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
    setSelectedReportImages(imageUrls.map(url => getImageUrl(url)));
    const parsedComments = imageComments ? JSON.parse(imageComments) : [];
    setSelectedImageComments(parsedComments);
    setShowImageModal(true);
  };

  const handleSubmitReport = async () => {
    if (!reportStartDate || !reportEndDate) {
      showToast('warn', 'Warning', 'Please select report start and end dates');
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
    } catch (error) {
      console.error('Error submitting report:', error);
      showToast('error', 'Error', 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReportPDF = async (report) => {
    try {
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
          : '',
        reportEnd: report.end_date
          ? new Date(report.end_date).toLocaleDateString()
          : '',
      };

      // Convert relative image URLs to absolute URLs for PDF
      const absoluteImageUrls = (report.image_urls || []).map(url => getImageUrl(url));

      const doc = (
        <ProjectReportPDF
          data={project}
          clientName={getClientName(project.client_id)}
          contractorName={getContractorName(project.contractor_id)}
          completionRate={report.current_progress || 0}
          reportDates={reportDates}
          imageUrls={absoluteImageUrls}
          imageComments={report.image_comments}
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

      const rows = [
        ['Field', 'Value'],
        ['Project Name', project.project_name],
        ['Client', getClientName(project.client_id)],
        ['Contractor', getContractorName(project.contractor_id)],
        ['Allocated Budget', `₱${project.total_amount}`],
        ['Project Start Date', formatDate(project.project_start_date)],
        ['Project End Date', formatDate(project.project_deadline)],
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
      formData.append('start_date', reportStartDate);
      formData.append('end_date', reportEndDate);
      formData.append('current_progress', completionRate);
      formData.append('payment_requested', releasedAmount);
      formData.append('report_description', reportValue);
      
      // Append multiple images with their comments
      reportImages.forEach((image, index) => {
        formData.append(`images`, image);
      });
      
      // Append image comments as JSON
      formData.append('image_comments', JSON.stringify(imageComments));

      await api.post('/reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
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
      command: () => {
        setCompletionRate(report.current_progress || 0);
        setReleasedAmount(report.payment_requested || 0);
        setReportValue(report.report_description || '');
        setReportStartDate(
          report.start_date ? new Date(report.start_date) : null,
        );
        setReportEndDate(report.end_date ? new Date(report.end_date) : null);
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

  // Project List View
  const ProjectListView = () => (
    <div>
      <div className="mb-4">
        <h2 className="m-0">Select a Project</h2>
        <p className="text-color-secondary m-0">
          Click on a project to view reports and generate new ones
        </p>
      </div>

      <div className="grid">
        {projects.map((project) => (
          <div key={project.project_id} className="col-12 md:col-6 lg:col-4">
            <Card
              className="cursor-pointer hover:shadow-2 transition-duration-150"
              onClick={() => handleProjectClick(project)}
            >
              <div className="flex flex-column gap-3">
                <div className="flex justify-content-between align-items-start">
                  <h3 className="m-0 text-lg">{project.project_name}</h3>
                  <Badge
                    value={
                      recentReports.filter(
                        (r) => r.project_id === project.project_id,
                      ).length
                    }
                    severity="info"
                  />
                </div>

                <div className="flex flex-column gap-2">
                  <div className="flex justify-content-between">
                    <span className="font-bold">Client:</span>
                    <span>{getClientName(project.client_id)}</span>
                  </div>
                  <div className="flex justify-content-between">
                    <span className="font-bold">Budget:</span>
                    <span>{formatCurrency(project.total_amount)}</span>
                  </div>
                  <div className="flex justify-content-between">
                    <span className="font-bold">Status:</span>
                    <Tag
                      value={project.project_status || 'Active'}
                      severity={
                        project.project_status === 'Completed'
                          ? 'success'
                          : 'info'
                      }
                    />
                  </div>
                </div>

                <div className="mt-2 pt-2 border-top-1">
                  <div className="flex justify-content-between text-sm">
                    <span>Start: {formatDate(project.project_start_date)}</span>
                    <span>End: {formatDate(project.project_deadline)}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );

  // Project Detail View (when project is selected)
  const ProjectDetailView = () => (
    <div>
      <div className="mb-4">
        <Button
          label="Back to Projects"
          icon="pi pi-arrow-left"
          className="p-button-text mb-3"
          onClick={handleBackToList}
        />

        <div className="flex justify-content-between align-items-center">
          <div>
            <h2 className="m-0">{selectedProject.project_name}</h2>
            <p className="text-color-secondary m-0">
              Client: {getClientName(selectedProject.client_id)} | Contractor:{' '}
              {getContractorName(selectedProject.contractor_id)}
            </p>
          </div>
          <Button
            label="Generate New Report"
            icon="pi pi-plus"
            onClick={handleGenerateClick}
          />
        </div>
      </div>

      <TabView>
        <TabPanel header={`Recent Reports (${filteredReports.length})`}>
          {filteredReports.length > 0 ? (
            <div className="grid">
              {filteredReports.map((report, index) => (
                <div key={index} className="col-12 lg:col-6">
                  <Card>
                    <div className="flex flex-column gap-3">
                      <div className="flex justify-content-between align-items-start">
                        <div>
                          <h4 className="m-0">
                            Report #{filteredReports.length - index}
                          </h4>
                          <small className="text-color-secondary">
                            Generated:{' '}
                            {formatDateTime(
                              report.created_at || report.start_date,
                            )}
                          </small>
                        </div>
                        <div className="flex gap-1">
                          <Tag
                            value={`${report.current_progress}%`}
                            severity="info"
                            className="mr-2"
                          />
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
                      </div>

                      {report.image_urls && report.image_urls.length > 0 && (
                        <div className="flex align-items-center gap-2 p-2 surface-100 border-round">
                          <i className="pi pi-paperclip text-lg" />
                          <span className="font-bold">
                            Attachments: {report.image_urls.length} image{report.image_urls.length !== 1 ? 's' : ''}
                          </span>
                          <Button
                            label="View Images"
                            icon="pi pi-eye"
                            className="p-button-sm p-button-text"
                            onClick={() => handleViewImages(report.image_urls, report.image_comments)}
                          />
                        </div>
                      )}

                      <Divider className="my-2" />

                      <div className="grid">
                        <div className="col-6">
                          <span className="font-bold">Period:</span>
                          <p className="m-0 text-sm">
                            {formatDate(report.start_date)} -{' '}
                            {formatDate(report.end_date)}
                          </p>
                        </div>
                        <div className="col-6">
                          <span className="font-bold">Payment:</span>
                          <p className="m-0 text-sm">
                            {formatCurrency(report.payment_requested)}
                          </p>
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
            <div className="text-center py-6">
              <i className="pi pi-file-excel text-6xl text-color-secondary mb-3" />
              <h3>No Reports Yet</h3>
              <p className="text-color-secondary mb-4">
                Generate the first report for this project
              </p>
              <Button
                label="Generate First Report"
                icon="pi pi-file"
                onClick={handleGenerateClick}
              />
            </div>
          )}
        </TabPanel>

        <TabPanel header="Project Info">
          <Card>
            <div className="grid">
              <div className="col-12 md:col-6">
                <h4>Project Details</h4>
                <div className="space-y-3">
                  <div>
                    <span className="font-bold">Project Name:</span>
                    <p className="m-0">{selectedProject.project_name}</p>
                  </div>
                  <div>
                    <span className="font-bold">Description:</span>
                    <p className="m-0">
                      {selectedProject.project_description || 'No description'}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold">Status:</span>
                    <Tag
                      value={selectedProject.project_status || 'Active'}
                      severity={
                        selectedProject.project_status === 'Completed'
                          ? 'success'
                          : 'info'
                      }
                      className="ml-2"
                    />
                  </div>
                </div>
              </div>

              <div className="col-12 md:col-6">
                <h4>Financial Information</h4>
                <div className="space-y-3">
                  <div>
                    <span className="font-bold">Total Budget:</span>
                    <p className="m-0 text-xl font-bold">
                      {formatCurrency(selectedProject.total_amount)}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold">Start Date:</span>
                    <p className="m-0">
                      {formatDate(selectedProject.project_start_date)}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold">Deadline:</span>
                    <p className="m-0">
                      {formatDate(selectedProject.project_deadline)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabPanel>
      </TabView>
    </div>
  );

  return (
    <div className="p-4">
      <Toast ref={toast} />

      {!selectedProject ? <ProjectListView /> : <ProjectDetailView />}

      {/* Report Generation Modal */}
      <Dialog
        header={`Generate Report - ${selectedProject?.project_name || ''}`}
        visible={showReportModal}
        style={{ width: '50vw' }}
        onHide={() => setShowReportModal(false)}
        footer={
          <div>
            <Button
              label="Cancel"
              icon="pi pi-times"
              className="p-button-text"
              onClick={() => setShowReportModal(false)}
            />
            <Button
              label={isGenerating ? 'Generating...' : 'Generate Report'}
              icon={isGenerating ? 'pi pi-spinner pi-spin' : 'pi pi-check'}
              onClick={handleSubmitReport}
              disabled={isGenerating || !reportStartDate || !reportEndDate}
            />
          </div>
        }
      >
        {selectedProject && (
          <div className="space-y-4">
            <div className="p-3 surface-50 border-round">
              <p className="font-bold m-0">
                Project: {selectedProject.project_name}
              </p>
              <p className="m-0 text-sm">Fill in the report details below</p>
            </div>

            <div className="grid">
              <div className="col-6">
                <label
                  htmlFor="report-start-date"
                  className="font-bold block mb-2"
                >
                  Report Start Date *
                </label>
                <Calendar
                  id="report-start-date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.value)}
                  dateFormat="mm/dd/yy"
                  showIcon
                  className="w-full"
                  required
                />
              </div>

              <div className="col-6">
                <label
                  htmlFor="report-end-date"
                  className="font-bold block mb-2"
                >
                  Report End Date *
                </label>
                <Calendar
                  id="report-end-date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.value)}
                  dateFormat="mm/dd/yy"
                  showIcon
                  className="w-full"
                  required
                />
              </div>

              <div className="col-12">
                <label
                  htmlFor="completion-rate"
                  className="font-bold block mb-2"
                >
                  Completion Rate: {completionRate}%
                </label>
                <Slider
                  value={completionRate}
                  onChange={(e) => setCompletionRate(e.value)}
                  className="w-full"
                />
              </div>

              <div className="col-12">
                <label
                  htmlFor="released-amount"
                  className="font-bold block mb-2"
                >
                  Amount to be Released
                </label>
                <InputNumber
                  id="released-amount"
                  value={releasedAmount}
                  onValueChange={(e) => setReleasedAmount(e.value)}
                  prefix="₱"
                  min={0}
                  mode="currency"
                  currency="PHP"
                  locale="en-PH"
                  className="w-full"
                />
              </div>

              <div className="col-12">
                <label
                  htmlFor="report-description"
                  className="font-bold block mb-2"
                >
                  Report Description / Notes
                </label>
                <InputTextarea
                  id="report-description"
                  value={reportValue}
                  onChange={(e) => setReportValue(e.target.value)}
                  rows={4}
                  className="w-full"
                  placeholder="Enter accomplishments, challenges, next steps..."
                />
              </div>

              <div className="col-12">
                <label htmlFor="report-images" className="font-bold block mb-2">
                  Upload Report Images
                </label>
                <input
                  id="report-images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="w-full"
                />
                <small className="text-color-secondary block mt-1">
                  Supported formats: JPG, PNG, GIF, WebP (Max 5MB per image). You can select multiple images.
                </small>
              </div>

              {imagePreviews.length > 0 && (
                <div className="col-12">
                  <h5 className="m-0 mb-3">Image Previews ({imagePreviews.length})</h5>
                  <div className="grid">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="col-12 md:col-6 lg:col-4">
                        <div className="border-1 surface-border border-round p-2">
                          <div style={{ position: 'relative', marginBottom: '8px' }}>
                            <img
                              src={preview}
                              alt={`Report preview ${index + 1}`}
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
                                backgroundColor: 'rgba(255,255,255,0.8)',
                              }}
                              onClick={() => removeImage(index)}
                            />
                          </div>
                          <small className="text-color-secondary block mb-2">Image {index + 1}</small>
                          <InputTextarea
                            placeholder="Add a comment for this image..."
                            value={imageComments[index] || ''}
                            onChange={(e) => updateImageComment(index, e.target.value)}
                            rows={2}
                            className="w-full"
                            style={{ fontSize: '12px' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {reportStartDate && reportEndDate && (
              <div className="p-3 border-1 surface-border border-round">
                <h4 className="mt-0">Preview</h4>
                <div className="grid">
                  <div className="col-6">
                    <p className="m-0">
                      <strong>Period:</strong> {formatDate(reportStartDate)} -{' '}
                      {formatDate(reportEndDate)}
                    </p>
                    <p className="m-0">
                      <strong>Completion:</strong> {completionRate}%
                    </p>
                  </div>
                  <div className="col-6">
                    <p className="m-0">
                      <strong>Payment:</strong> {formatCurrency(releasedAmount)}
                    </p>
                  </div>
                </div>
                <ProgressBar value={completionRate} className="mt-3" />
              </div>
            )}
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
                      <small className="text-color-secondary font-bold">Image {index + 1}</small>
                    </div>
                    {selectedImageComments[index] && (
                      <div className="p-2 surface-100 border-round-sm">
                        <small className="text-color-secondary">
                          <strong>Comment:</strong> {selectedImageComments[index]}
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

export default StaffReportsPanel;
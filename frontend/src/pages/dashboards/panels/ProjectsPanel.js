import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import api from '../../../services/api';
import './ProjectsPanel.css';

// ============================================
// PROJECTS MANAGEMENT PANEL
// Handles: Create, Read, Update, Delete projects
// ============================================

const ProjectsPanel = () => {
  // ============================================
  // STATE
  // ============================================
  const [projects, setProjects] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [displayDialog, setDisplayDialog] = useState(false);
  const [displayEditDialog, setDisplayEditDialog] = useState(false);
  const [displaySubProjectDialog, setDisplaySubProjectDialog] = useState(false);
  const [displayProjectDashboard, setDisplayProjectDashboard] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [viewMode, setViewMode] = useState('active'); // 'active' or 'deleted'
  const [searchQuery, setSearchQuery] = useState(''); // Search query state
  const toast = useRef(null);

  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    amount: '',
    dueDate: null,
    client_id: null,
    project_status: 'Ongoing',
  });

  const [subProjectParent, setSubProjectParent] = useState(null);
  const [newSubProject, setNewSubProject] = useState({
    name: '',
    description: '',
    amount: '',
    dueDate: null,
    contractor_id: null,
    client_id: null,
    project_status: 'Ongoing',
    parent_project_id: null,
  });

  const [editingProject, setEditingProject] = useState({
    project_id: '',
    name: '',
    description: '',
    amount: '',
    dueDate: null,
    contractor_id: null,
    client_id: null,
    project_status: 'Ongoing',
  });

  const getSubProjects = (parentId) =>
    projects?.filter((p) => p?.parent_project_id === parentId) || [];

  // ============================================
  // LIFECYCLE
  // ============================================

  useEffect(() => {
    const loadData = async () => {
      await fetchContractors();
      await fetchProjects();
    };
    loadData();
  }, [viewMode]);

  // ============================================
  // SEARCH FUNCTIONALITY
  // ============================================

  // Function to get contractor name by ID
  const getContractorName = (contractorId) => {
    if (!contractorId) return '';
    const contractor = contractors?.find((c) => c?.user_id === contractorId);
    return contractor && contractor.first_name && contractor.last_name
      ? `${contractor.first_name} ${contractor.last_name}`.toLowerCase()
      : '';
  };

  // Function to get client name by ID
  const getClientName = (clientId) => {
    if (!clientId) return '';
    const client = clients?.find((c) => c?.user_id === clientId);
    return client && client.first_name && client.last_name
      ? `${client.first_name} ${client.last_name}`.toLowerCase()
      : '';
  };

  // Filter projects based on search query
  const getFilteredProjects = () => {
    if (!searchQuery.trim()) {
      return projects.filter((project) => {
        if (project.parent_project_id) return false;
        if (viewMode === 'deleted') {
          return project.isDeleted === true;
        }
        return project.isDeleted === false || project.isDeleted === undefined;
      });
    }

    const query = searchQuery.toLowerCase();

    return projects.filter((project) => {
      if (project.parent_project_id) return false;
      // Check view mode filter first
      if (viewMode === 'deleted' && project.isDeleted !== true) return false;
      if (viewMode === 'active' && project.isDeleted === true) return false;

      // Search in project name
      if (project.project_name?.toLowerCase().includes(query)) {
        return true;
      }

      // Search in project description
      if (project.project_description?.toLowerCase().includes(query)) {
        return true;
      }

      // Search in amount (formatted as string)
      const amountStr = project.total_amount?.toString();
      if (amountStr?.includes(query)) {
        return true;
      }

      // Search in contractor name
      const contractorName = getContractorName(project.contractor_id);
      if (contractorName.includes(query)) {
        return true;
      }

      // Search in client name
      const clientName = getClientName(project.client_id);
      if (clientName.includes(query)) {
        return true;
      }

      // Search in date (formatted)
      if (project.project_deadline) {
        const dateStr = new Date(project.project_deadline)
          .toLocaleDateString()
          .toLowerCase();
        if (dateStr.includes(query)) {
          return true;
        }
      }

      return false;
    });
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // ============================================
  // FORMATTING FUNCTIONS
  // ============================================

  const formatCurrency = (amount) => {
    if (!amount) return '₱0.00';
    return `₱${Number(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Format amount display in input (add commas)
  const formatAmountForDisplay = (amount) => {
    if (!amount) return '';
    const numAmount = Number(amount);
    return numAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Remove formatting from input (return raw number)
  const parseAmountFromInput = (formattedAmount) => {
    if (!formattedAmount) return '';
    // Remove all non-numeric characters except decimal point
    return formattedAmount.replace(/[^0-9.]/g, '');
  };

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  const fetchProjects = async () => {
    try {
      setLoading(true);
      let response;
      if (viewMode === 'deleted') {
        response = await api.get('/projects?includeDeleted=true');
      } else {
        response = await api.get('/projects');
      }
      setProjects(response.data);
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

  const fetchContractors = async () => {
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
      console.error('Failed to fetch contractors:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load contractors',
      });
    }
  };

  const handleAddProject = async () => {
    // Validation
    if (!newProject.name.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Project name is required',
      });
      return;
    }

    // Validate due date is not before today
    if (newProject.dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(newProject.dueDate);
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
        project_name: newProject.name,
        project_description: newProject.description,
        total_amount: newProject.amount,
        project_deadline: newProject.dueDate,
        client_id: newProject.client_id,
        project_status: 'Ongoing',
      });

      setDisplayDialog(false);
      setNewProject({
        name: '',
        description: '',
        amount: '',
        dueDate: null,
        client_id: null,
        project_status: 'Ongoing',
      });

      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Project created successfully',
      });

      fetchProjects();
    } catch (error) {
      console.error('Create project error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail:
          error.response?.data?.message ||
          error.message ||
          'Failed to create project',
      });
    } finally {
      setLoading(false);
    }
  };

  const openSubProjectDialog = (parentProject) => {
    setSubProjectParent(parentProject);
    setNewSubProject({
      name: '',
      description: '',
      amount: '',
      dueDate: null,
      contractor_id: null,
      client_id: parentProject?.client_id || null,
      project_status: 'Ongoing',
      parent_project_id: parentProject?.project_id || null,
    });
    setDisplaySubProjectDialog(true);
  };

  const openProjectDashboard = (project) => {
    setSelectedProject(project);
    setDisplayProjectDashboard(true);
  };

  const handleAddSubProject = async () => {
    // Validation
    if (!newSubProject.name.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Sub-project name is required',
      });
      return;
    }

    // Validate due date is not before today
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
        project_status: 'Ongoing',
        parent_project_id: newSubProject.parent_project_id,
      });

      setDisplaySubProjectDialog(false);
      setSubProjectParent(null);
      setNewSubProject({
        name: '',
        description: '',
        amount: '',
        dueDate: null,
        contractor_id: null,
        client_id: null,
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

  const handleDeleteProject = (project) => {
    confirmDialog({
      message: `Are you sure you want to delete "${project.project_name}"? This can be restored from the recycle bin.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          setLoading(true);
          await api.delete(`/projects/${project.project_id}`);
          toast.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Project moved to recycle bin',
          });
          fetchProjects();
        } catch (error) {
          console.error('Delete project error:', error);
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail:
              error.response?.data?.message ||
              error.message ||
              'Failed to delete project',
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const openEditDialog = (project) => {
    setEditingProject({
      project_id: project.project_id,
      name: project.project_name,
      description: project.project_description,
      amount: project.total_amount,
      dueDate: project.project_deadline
        ? new Date(project.project_deadline)
        : null,
      contractor_id: project.contractor_id,
      client_id: project.client_id || null,
      project_status: project.project_status || 'Ongoing',
    });
    setDisplayEditDialog(true);
  };

  const handleEditProject = async () => {
    // Validation
    if (!editingProject.name.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Project name is required',
      });
      return;
    }

    try {
      setLoading(true);
      await api.patch(`/projects/${editingProject.project_id}`, {
        project_name: editingProject.name,
        project_description: editingProject.description,
        total_amount: editingProject.amount,
        project_deadline: editingProject.dueDate,
        client_id: editingProject.client_id,
        contractor_id: editingProject.contractor_id,
        project_status: editingProject.project_status,
      });

      setDisplayEditDialog(false);
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Project updated successfully',
      });
      fetchProjects();
    } catch (error) {
      console.error('Update project error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail:
          error.response?.data?.message ||
          error.message ||
          'Failed to update project',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreProject = (project) => {
    confirmDialog({
      message: `Restore "${project.project_name}" to active projects?`,
      header: 'Confirm Restore',
      icon: 'pi pi-refresh',
      accept: async () => {
        try {
          setLoading(true);
          await api.patch(`/projects/${project.project_id}`, {
            isDeleted: false,
          });
          toast.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Project restored successfully',
          });
          fetchProjects();
        } catch (error) {
          console.error('Restore project error:', error);
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail:
              error.response?.data?.message ||
              error.message ||
              'Failed to restore project',
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handlePermanentDeleteProject = (project) => {
    confirmDialog({
      message: `Permanently delete "${project.project_name}"? This cannot be undone.`,
      header: 'Confirm Permanent Delete',
      icon: 'pi pi-trash',
      accept: async () => {
        try {
          setLoading(true);
          await api.delete(`/projects/${project.project_id}?permanent=true`);
          toast.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Project permanently deleted',
          });
          fetchProjects();
        } catch (error) {
          console.error('Permanent delete error:', error);
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail:
              error.response?.data?.message ||
              error.message ||
              'Failed to permanently delete project',
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Contractor name template
  const contractorTemplate = (rowData) => {
    if (!rowData.contractor_id) return 'N/A';

    const contractor = contractors?.find(
      (c) => c?.user_id === rowData.contractor_id,
    );
    return contractor && contractor.first_name && contractor.last_name
      ? `${contractor.first_name} ${contractor.last_name}`
      : 'N/A';
  };

  const parentProjectTemplate = (rowData) => {
    if (!rowData.parent_project_id) return '—';
    const parent = projects?.find(
      (p) => p?.project_id === rowData.parent_project_id,
    );
    return parent?.project_name || 'N/A';
  };

  // Client name template
  const clientTemplate = (rowData) => {
    if (!rowData.client_id) return 'N/A';

    const client = clients?.find((c) => c?.user_id === rowData.client_id);
    return client && client.first_name && client.last_name
      ? `${client.first_name} ${client.last_name}`
      : 'N/A';
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

  // Get filtered projects
  const filteredProjects = getFilteredProjects();

  // Status template
  const statusTemplate = (rowData) => {
    const status = rowData.project_status || 'Ongoing';
    const normalized = String(status).toLowerCase().trim();

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
        {status}
      </span>
    );
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="panel-container">
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Title Section */}
      <div className="mb-6">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '2rem',
          }}
        >
          <div>
            <h2 className="m-0">Projects</h2>
            <p className="text-color-secondary m-0">
              Manage and track all project activities
            </p>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'center',
            }}
          >
            <Button
              label="Active Projects"
              icon="pi pi-folder"
              severity={viewMode === 'active' ? 'info' : 'secondary'}
              onClick={() => {
                setViewMode('active');
                setSearchQuery('');
              }}
              className={
                viewMode === 'active'
                  ? 'p-button-sm user-switch-btn active'
                  : 'p-button-sm user-switch-btn'
              }
              text={viewMode !== 'active'}
              outlined={viewMode !== 'active'}
            />
            <Button
              label={`Recycle Bin (${projects.filter((p) => p.isDeleted).length})`}
              icon="pi pi-trash"
              severity={viewMode === 'deleted' ? 'info' : 'secondary'}
              onClick={() => {
                setViewMode('deleted');
                setSearchQuery('');
              }}
              className={
                viewMode === 'deleted'
                  ? 'p-button-sm user-switch-btn active'
                  : 'p-button-sm user-switch-btn'
              }
              text={viewMode !== 'deleted'}
              outlined={viewMode !== 'deleted'}
            />
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
        </div>
      </div>

      <div className="dashboard-card">
        <div
          className="card-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingLeft: '16px',
            paddingRight: '16px',
          }}
        >
          <h3 className="card-title" style={{ color: '#404a17', margin: 0 }}>
            {viewMode === 'active' ? 'Active Projects' : 'Recycle Bin'}
          </h3>
          {viewMode === 'active' && (
            <Button
              label="Add New Project"
              icon="pi pi-plus"
              severity="info"
              onClick={() => setDisplayDialog(true)}
              className="add-user-btn"
            />
          )}
        </div>

        <DataTable
          value={filteredProjects}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 20, 50]}
          tableStyle={{ minWidth: '50rem' }}
          emptyMessage={
            searchQuery
              ? 'No projects match your search criteria.'
              : viewMode === 'active'
                ? 'No projects found.'
                : 'Recycle bin is empty.'
          }
          responsiveLayout="scroll"
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        >
          <Column field="project_name" header="Project Name" sortable />
          <Column
            field="parent_project_id"
            header="Parent Project"
            body={parentProjectTemplate}
          />
          <Column
            field="project_status"
            header="Status"
            body={statusTemplate}
            sortable
          />
          <Column field="client_id" header="Client" body={clientTemplate} />
          <Column
            field="contractor_id"
            header="Contractor"
            body={contractorTemplate}
          />
          <Column
            field="project_description"
            header="Description"
            body={(rowData) => (
              <div
                style={{
                  maxWidth: '300px',
                  whiteSpace: 'normal',
                  color: '#4b5563',
                }}
              >
                {rowData.project_description || 'N/A'}
              </div>
            )}
          />
          <Column
            field="total_amount"
            header="Amount"
            body={amountTemplate}
            sortable
            style={{ color: '#059669', fontWeight: '600' }}
          />
          <Column
            field="project_deadline"
            header="Due Date"
            body={dateTemplate}
            sortable
          />

          <Column
            header="Actions"
            body={(rowData) => (
              <div style={{ display: 'flex', gap: '8px' }}>
                {viewMode === 'active' ? (
                  <>
                    {/* <Button
                      icon="pi pi-plus"
                      className="p-button-rounded p-button-sm p-button-info user-action-btn"
                      onClick={() => openSubProjectDialog(rowData)}
                      tooltip="Add Sub-Project"
                      tooltipOptions={{ position: 'top' }}
                    /> */}
                    <Button
                      icon="pi pi-pencil"
                      className="p-button-rounded p-button-sm p-button-warning user-action-btn"
                      onClick={() => openEditDialog(rowData)}
                    />
                    <Button
                      icon="pi pi-trash"
                      className="p-button-rounded p-button-sm p-button-danger user-action-btn"
                      onClick={() => handleDeleteProject(rowData)}
                    />
                  </>
                ) : (
                  <>
                    <Button
                      icon="pi pi-refresh"
                      className="p-button-rounded p-button-sm p-button-success user-action-btn"
                      onClick={() => handleRestoreProject(rowData)}
                    />
                    <Button
                      icon="pi pi-times"
                      className="p-button-rounded p-button-sm p-button-danger user-action-btn"
                      onClick={() => handlePermanentDeleteProject(rowData)}
                    />
                  </>
                )}
              </div>
            )}
          />
        </DataTable>
      </div>
      {/* ============================================ */}
      <Dialog
        visible={displayDialog}
        style={{ width: '90vw', maxWidth: '500px' }}
        header="Add New Project"
        contentStyle={{ padding: '1.5rem 2rem' }}
        modal
        onHide={() => setDisplayDialog(false)}
        className="p-fluid"
        headerStyle={{
          backgroundColor: '#404a17',
          color: 'white',
          padding: '1rem',
        }}
      >
        <div className="field mt-3">
          <label
            htmlFor="project-name"
            style={{ color: '#404a17', fontWeight: '600' }}
          >
            Project Name *
          </label>
          <InputText
            id="project-name"
            value={newProject.name}
            onChange={(e) =>
              setNewProject({ ...newProject, name: e.target.value })
            }
            placeholder="Enter project name"
            style={{ borderColor: '#cbd5e1' }}
          />
        </div>

        <div className="field mt-3">
          <label
            htmlFor="project-description"
            style={{ color: '#404a17', fontWeight: '600' }}
          >
            Description
          </label>
          <InputTextarea
            id="project-description"
            value={newProject.description}
            onChange={(e) =>
              setNewProject({ ...newProject, description: e.target.value })
            }
            placeholder="Enter project description"
            rows={4}
            style={{ borderColor: '#cbd5e1' }}
          />
        </div>

        <div className="field mt-3">
          <label
            htmlFor="project-amount"
            style={{ color: '#404a17', fontWeight: '600' }}
          >
            Project Amount
          </label>
          <InputNumber
            id="project-amount"
            value={newProject.amount ? Number(newProject.amount) : null}
            onValueChange={(e) =>
              setNewProject({ ...newProject, amount: e.value || '' })
            }
            placeholder="Enter project amount"
            prefix="₱ "
            thousandSeparator=","
            minFractionDigits={2}
            maxFractionDigits={2}
            style={{ borderColor: '#cbd5e1' }}
          />
        </div>

        <div className="field mt-3">
          <label
            htmlFor="project-due-date"
            style={{ color: '#404a17', fontWeight: '600' }}
          >
            Due Date
          </label>
          <Calendar
            id="project-due-date"
            value={newProject.dueDate}
            onChange={(e) => setNewProject({ ...newProject, dueDate: e.value })}
            dateFormat="mm/dd/yy"
            placeholder="Select due date"
            style={{ borderColor: '#cbd5e1' }}
            className="w-full"
            minDate={new Date()}
          />
        </div>

        <div className="field mt-3">
          <label
            htmlFor="project-client"
            style={{ color: '#404a17', fontWeight: '600' }}
          >
            Client
          </label>
          <Dropdown
            id="project-client"
            value={newProject.client_id}
            onChange={(e) =>
              setNewProject({ ...newProject, client_id: e.value })
            }
            options={clients}
            optionLabel={(option) => `${option.first_name} ${option.last_name}`}
            optionValue="user_id"
            placeholder="Select a client"
            style={{ borderColor: '#cbd5e1' }}
          />
        </div>

        <div className="flex justify-content-center mt-5">
          <Button
            label="Create"
            onClick={handleAddProject}
            loading={loading}
            className="modal-primary-btn"
          />
        </div>
      </Dialog>

      <Dialog
        visible={displaySubProjectDialog}
        style={{ width: '90vw', maxWidth: '500px' }}
        header="Add Sub-Project"
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
            value={subProjectParent?.project_name || ''}
            disabled
            style={{ borderColor: '#cbd5e1' }}
          />
        </div>

        <div className="field mt-3">
          <label
            htmlFor="sub-project-name"
            style={{ color: '#404a17', fontWeight: '600' }}
          >
            Sub-Project Name *
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
            Project Amount
          </label>
          <InputNumber
            id="sub-project-amount"
            value={newSubProject.amount ? Number(newSubProject.amount) : null}
            onValueChange={(e) =>
              setNewSubProject({ ...newSubProject, amount: e.value || '' })
            }
            placeholder="Enter project amount"
            prefix="₱ "
            thousandSeparator="," 
            minFractionDigits={2}
            maxFractionDigits={2}
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
        visible={displayProjectDashboard}
        style={{ width: '95vw', maxWidth: '900px' }}
        header="Project Dashboard"
        contentStyle={{ padding: '1.5rem 2rem' }}
        modal
        onHide={() => setDisplayProjectDashboard(false)}
        className="p-fluid"
        headerStyle={{
          backgroundColor: '#404a17',
          color: 'white',
          padding: '1rem',
        }}
      >
        {selectedProject ? (
          <>
            <div className="mb-4">
              <h3 style={{ margin: 0, color: '#111827' }}>
                {selectedProject.project_name}
              </h3>
              <p style={{ margin: '0.25rem 0 0', color: '#6b7280' }}>
                {selectedProject.project_description || 'No description'}
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                  Status
                </div>
                <div>{selectedProject.project_status || 'Ongoing'}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                  Client
                </div>
                <div>{clientTemplate(selectedProject)}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                  Contractor
                </div>
                <div>{contractorTemplate(selectedProject)}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                  Amount
                </div>
                <div>{amountTemplate(selectedProject)}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                  Due Date
                </div>
                <div>{dateTemplate(selectedProject)}</div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
              }}
            >
              <h4 style={{ margin: 0 }}>Sub-Projects</h4>
              <Button
                label="Add Sub-Project"
                icon="pi pi-plus"
                severity="info"
                onClick={() => openSubProjectDialog(selectedProject)}
                className="p-button-sm"
              />
            </div>

            <DataTable
              value={getSubProjects(selectedProject.project_id)}
              rows={5}
              paginator
              rowsPerPageOptions={[5, 10, 20]}
              emptyMessage="No sub-projects found."
              responsiveLayout="scroll"
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            >
              <Column field="project_name" header="Sub-Project" />
              <Column
                field="project_status"
                header="Status"
                body={statusTemplate}
              />
              <Column field="client_id" header="Client" body={clientTemplate} />
              <Column
                field="contractor_id"
                header="Contractor"
                body={contractorTemplate}
              />
              <Column
                field="total_amount"
                header="Amount"
                body={amountTemplate}
              />
              <Column
                field="project_deadline"
                header="Due Date"
                body={dateTemplate}
              />
            </DataTable>
          </>
        ) : (
          <p style={{ margin: 0 }}>No project selected.</p>
        )}
      </Dialog>

      {/* ============================================ */}
      {/* EDIT PROJECT DIALOG */}
      {/* ============================================ */}
      <Dialog
        visible={displayEditDialog}
        style={{ width: '90vw', maxWidth: '500px' }}
        header="Edit Project"
        contentStyle={{ padding: '1.5rem 2rem' }}
        modal
        onHide={() => setDisplayEditDialog(false)}
        className="p-fluid"
        headerStyle={{
          backgroundColor: '#404a17',
          color: 'white',
          padding: '1rem',
        }}
      >
        <div className="field mt-3">
          <label
            htmlFor="edit-project-name"
            style={{ color: '#404a17', fontWeight: '600' }}
          >
            Project Name *
          </label>
          <InputText
            id="edit-project-name"
            value={editingProject.name}
            onChange={(e) =>
              setEditingProject({ ...editingProject, name: e.target.value })
            }
            placeholder="Enter project name"
            style={{ borderColor: '#cbd5e1' }}
          />
        </div>

        <div className="field mt-3">
          <label
            htmlFor="edit-project-description"
            style={{ color: '#404a17', fontWeight: '600' }}
          >
            Description
          </label>
          <InputTextarea
            id="edit-project-description"
            value={editingProject.description}
            onChange={(e) =>
              setEditingProject({
                ...editingProject,
                description: e.target.value,
              })
            }
            placeholder="Enter project description"
            rows={4}
            style={{ borderColor: '#cbd5e1' }}
          />
        </div>

        <div className="field mt-3">
          <label
            htmlFor="edit-project-amount"
            style={{ color: '#404a17', fontWeight: '600' }}
          >
            Project Amount
          </label>
          <InputNumber
            id="edit-project-amount"
            value={editingProject.amount ? Number(editingProject.amount) : null}
            onValueChange={(e) =>
              setEditingProject({ ...editingProject, amount: e.value || '' })
            }
            placeholder="Enter project amount"
            prefix="₱ "
            thousandSeparator=","
            minFractionDigits={2}
            maxFractionDigits={2}
            style={{ borderColor: '#cbd5e1' }}
          />
        </div>

        <div className="field mt-3">
          <label
            htmlFor="edit-project-due-date"
            style={{ color: '#404a17', fontWeight: '600' }}
          >
            Due Date
          </label>
          <Calendar
            id="edit-project-due-date"
            value={editingProject.dueDate}
            onChange={(e) =>
              setEditingProject({ ...editingProject, dueDate: e.value })
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
            htmlFor="edit-project-contractor"
            style={{ color: '#404a17', fontWeight: '600' }}
          >
            Contractor
          </label>
          <Dropdown
            id="edit-project-contractor"
            value={editingProject.contractor_id}
            onChange={(e) =>
              setEditingProject({ ...editingProject, contractor_id: e.value })
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
            htmlFor="edit-project-status"
            style={{ color: '#404a17', fontWeight: '600' }}
          >
            Status
          </label>
          <Dropdown
            id="edit-project-status"
            value={editingProject.project_status}
            onChange={(e) =>
              setEditingProject({ ...editingProject, project_status: e.value })
            }
            options={[
              { label: 'Ongoing', value: 'Ongoing' },
              { label: 'Hold', value: 'Hold' },
              { label: 'Done', value: 'Done' },
            ]}
            optionLabel="label"
            optionValue="value"
            placeholder="Select status"
            style={{ borderColor: '#cbd5e1' }}
          />
        </div>

        <div className="field mt-3">
          <label
            htmlFor="edit-project-client"
            style={{ color: '#404a17', fontWeight: '600' }}
          >
            Client
          </label>
          <Dropdown
            id="edit-project-client"
            value={editingProject.client_id}
            onChange={(e) =>
              setEditingProject({ ...editingProject, client_id: e.value })
            }
            options={clients}
            optionLabel={(option) => `${option.first_name} ${option.last_name}`}
            optionValue="user_id"
            placeholder="Select a client"
            style={{ borderColor: '#cbd5e1' }}
          />
        </div>

        <div className="flex justify-content-center mt-5">
          <Button
            label="Update"
            onClick={handleEditProject}
            loading={loading}
            className="modal-primary-btn"
          />
        </div>
      </Dialog>
    </div>
  );
};

export default ProjectsPanel;

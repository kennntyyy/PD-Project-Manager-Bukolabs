import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import api from '../../../services/api';

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
  const [viewMode, setViewMode] = useState('active'); // 'active' or 'deleted'
  const [searchQuery, setSearchQuery] = useState(''); // Search query state
  const toast = useRef(null);

  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    amount: '',
    dueDate: null,
    contractor_id: null,
    client_id: null,
  });

  const [editingProject, setEditingProject] = useState({
    project_id: '',
    name: '',
    description: '',
    amount: '',
    dueDate: null,
    contractor_id: null,
    client_id: null,
  });

  // ============================================
  // LIFECYCLE
  // ============================================

  useEffect(() => {
    fetchProjects();
    fetchContractors();
  }, [viewMode]);

  // ============================================
  // SEARCH FUNCTIONALITY
  // ============================================

  // Function to get contractor name by ID
  const getContractorName = (contractorId) => {
    if (!contractorId) return '';
    const contractor = contractors.find((c) => c.user_id === contractorId);
    return contractor
      ? `${contractor.first_name} ${contractor.last_name}`.toLowerCase()
      : '';
  };

  const getClientName = (clientId) => {
    if (!clientId) return '';
    const client = clients.find((c) => c.user_id === clientId);
    return client ? `${client.first_name} ${client.last_name}`.toLowerCase() : '';
  };

  // Filter projects based on search query
  const getFilteredProjects = () => {
    if (!searchQuery.trim()) {
      return projects.filter((project) => {
        if (viewMode === 'deleted') {
          return project.isDeleted === true;
        }
        return project.isDeleted === false || project.isDeleted === undefined;
      });
    }

    const query = searchQuery.toLowerCase();

    return projects.filter((project) => {
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
      const clientsList = response.data.filter((user) => user.user_role === 'client');
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

    try {
      setLoading(true);
      await api.post('/projects', {
        project_name: newProject.name,
        project_description: newProject.description,
        total_amount: newProject.amount,
        project_deadline: newProject.dueDate,
        contractor_id: newProject.contractor_id,
        client_id: newProject.client_id,
      });

      setDisplayDialog(false);
      setNewProject({
        name: '',
        description: '',
        amount: '',
        dueDate: null,
        contractor_id: null,
        client_id: null,
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

  const handleDeleteProject = (project) => {
    confirmDialog({
      message: `Are you sure you want to delete "${project.project_name}"? This can be restored from the recycle bin.`,
      header: 'Confirm',
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
      header: 'Confirm',
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


  // Contractor name template
  const contractorTemplate = (rowData) => {
    if (!rowData.contractor_id) return 'N/A';

    const contractor = contractors.find(
      (c) => c.user_id === rowData.contractor_id,
    );
    return contractor
      ? `${contractor.first_name} ${contractor.last_name}`
      : 'N/A';
  };

  // Client name template
  const clientTemplate = (rowData) => {
    if (!rowData.client_id) return 'N/A';

    const client = clients.find((c) => c.user_id === rowData.client_id);
    return client ? `${client.first_name} ${client.last_name}` : 'N/A';
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

  // ============================================
  // RENDER
  // ============================================

  return (
    <div>
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="dashboard-card">
        <div className="card-header">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <h3 className="card-title" style={{ color: '#404a17', margin: 0 }}>
              {viewMode === 'active' ? 'Active Projects' : 'Recycle Bin'}
            </h3>
            <div
              className="project-panel-switch"
              style={{
                marginBottom: '12px',
                paddingLeft: '16px',
                paddingRight: '16px',
                paddingTop: '12px',
              }}
            >
              {/* <Button
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
              /> */}
              {/* <Button
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
              /> */}
            </div>
          </div>
        </div>

        {/* Search Bar and Action Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            paddingLeft: '16px',
            paddingRight: '16px',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          {/* Search Bar */}
          <div
            className="p-inputgroup"
            style={{ flex: '1', minWidth: '300px', maxWidth: '500px' }}
          >
            <span className="p-inputgroup-addon">
              <i className="pi pi-search" />
            </span>
            <InputText
              placeholder={
                viewMode === 'active'
                  ? 'Search projects by name, description, contractor, amount...'
                  : 'Search deleted projects...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: '1' }}
            />
            {searchQuery && (
              <Button
                icon="pi pi-times"
                className="p-button-text"
                onClick={handleClearSearch}
                tooltip="Clear search"
              />
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {viewMode === 'active' && (
              <Button
                label="Add New Project"
                icon="pi pi-plus"
                severity="info"
                onClick={() => setDisplayDialog(true)}
                className="add-user-btn"
              />
            )}
            {searchQuery && (
              <Button
                label={`${filteredProjects.length} result${filteredProjects.length !== 1 ? 's' : ''} found`}
                icon="pi pi-filter"
                severity="secondary"
                className="p-button-outlined"
                disabled
              />
            )}
          </div>
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
            field="client_id"
            header="Client"
            body={clientTemplate}
          />
          <Column
            field="contractor_id"
            header="Contractor"
            body={contractorTemplate}
          />

          <Column
            header="Actions"
            body={(rowData) => (
              <div style={{ display: 'flex', gap: '8px' }}>
                {viewMode === 'active' ? (
                  <>
                    <Button
                      icon="pi pi-pencil"
                      className="p-button-rounded p-button-sm p-button-warning user-action-btn"
                      onClick={() => openEditDialog(rowData)}
                    />
                    {/* <Button
                      icon="pi pi-trash"
                      className="p-button-rounded p-button-sm p-button-danger user-action-btn"
                      onClick={() => handleDeleteProject(rowData)}
                    /> */}
                  </>
                ) : (
                  <>
                    <Button
                      icon="pi pi-refresh"
                      className="p-button-rounded p-button-sm p-button-success user-action-btn"
                      onClick={() => handleRestoreProject(rowData)}
                    />
                    {/* <Button
                      icon="pi pi-times"
                      className="p-button-rounded p-button-sm p-button-danger user-action-btn"
                      onClick={() => handlePermanentDeleteProject(rowData)}
                    /> */}
                  </>
                )}
              </div>
            )}
          />
        </DataTable>
      </div>

      {/* ============================================ */}
      {/* CREATE PROJECT DIALOG */}
      {/* ============================================ */}
      <Dialog
        visible={displayDialog}
        style={{ width: '90vw', maxWidth: '500px' }}
        header="Add New Project"
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
          <InputText
            id="project-amount"
            type="number"
            step="0.01"
            value={newProject.amount}
            onChange={(e) =>
              setNewProject({ ...newProject, amount: e.target.value })
            }
            placeholder="Enter project amount"
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
            onChange={(e) => setNewProject({ ...newProject, client_id: e.value })}
            options={clients}
            optionLabel={(option) => `${option.first_name} ${option.last_name}`}
            optionValue="user_id"
            placeholder="Select a client"
            style={{ borderColor: '#cbd5e1' }}
          />
        </div>

        <div className="field mt-3">
          <label
            htmlFor="project-contractor"
            style={{ color: '#404a17', fontWeight: '600' }}
          >
            Contractor
          </label>
          <Dropdown
            id="project-contractor"
            value={newProject.contractor_id}
            onChange={(e) =>
              setNewProject({ ...newProject, contractor_id: e.value })
            }
            options={contractors}
            optionLabel={(option) => `${option.first_name} ${option.last_name}`}
            optionValue="user_id"
            placeholder="Select a contractor"
            style={{ borderColor: '#cbd5e1' }}
          />
        </div>

        <div className="flex justify-content-end gap-2 mt-5">
          <Button
            label="Cancel"
            severity="secondary"
            onClick={() => setDisplayDialog(false)}
          />
          <Button label="Create" onClick={handleAddProject} loading={loading} />
        </div>
      </Dialog>

      {/* ============================================ */}
      {/* EDIT PROJECT DIALOG */}
      {/* ============================================ */}
      <Dialog
        visible={displayEditDialog}
        style={{ width: '90vw', maxWidth: '500px' }}
        header="Edit Project"
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
          <InputText
            id="edit-project-amount"
            type="number"
            step="0.01"
            value={editingProject.amount}
            onChange={(e) =>
              setEditingProject({ ...editingProject, amount: e.target.value })
            }
            placeholder="Enter project amount"
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

        <div className="flex justify-content-end gap-2 mt-5">
          <Button
            label="Cancel"
            severity="secondary"
            onClick={() => setDisplayEditDialog(false)}
          />
          <Button
            label="Update"
            onClick={handleEditProject}
            loading={loading}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default ProjectsPanel;

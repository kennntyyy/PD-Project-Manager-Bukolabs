import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { confirmDialog } from 'primereact/confirmdialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import axios from 'axios';
import './ProjectsPanel.css';

const ProjectsPanel = () => {
  const [projects, setProjects] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [displayDialog, setDisplayDialog] = useState(false);
  const [displayEditDialog, setDisplayEditDialog] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    amount: '',
    dueDate: null,
    contractor_id: null,
  });
  const [editingProject, setEditingProject] = useState({
    project_id: '',
    name: '',
    description: '',
    amount: '',
    dueDate: null,
    contractor_id: null,
  });

  const toastRef = React.useRef(null);

  const fetchProjects = async () => {
    const response = await axios.get("http://localhost:3000/api/projects");
    
    setProjects(response.data);
  };

  const fetchContractors = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get("http://localhost:3000/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Filter users with role 'contractor'
      const contractorsList = response.data.filter(user => user.user_role === 'contractor');
      setContractors(contractorsList);
    } catch (error) {
      console.error('Failed to fetch contractors:', error);
    }
  };

  //display the proejcts and contractors
  useEffect(() => {
    fetchProjects();
    fetchContractors();
  }, []);

  const handleAddProject = async () => {
    if(!newProject.name.trim()) {
        toastRef.current?.show({
            severity: 'error',
            summary: 'Validation Error',
            detail: 'Project name is required.',
        });
        return;
    }

    const token = localStorage.getItem('access_token');

    try{
        await axios.post("http://localhost:3000/api/projects", {
            project_name: newProject.name,
            project_description: newProject.description,
            total_amount: newProject.amount,
            project_deadline: newProject.dueDate,
            contractor_id: newProject.contractor_id,
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        setDisplayDialog(false);
        setNewProject({ name: '', description: '', amount: '', dueDate: null, contractor_id: null });
        fetchProjects();

    }catch(error){
        console.error(error);
  };
  }
    //removing a project
  const handleDeleteProject = async (projectId) => {
    const token = localStorage.getItem('access_token');
    if(window.confirm("Are you sure you want to delete this project?")){
    try{
        await axios.delete(`http://localhost:3000/api/projects/${projectId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        fetchProjects();
        
    }catch(error){
        console.error(error);
    }
    }
  };

  // Open edit dialog with project data
  const openEditDialog = (project) => {
    setEditingProject({
      project_id: project.project_id,
      name: project.project_name,
      description: project.project_description,
      amount: project.total_amount,
      dueDate: project.project_deadline ? new Date(project.project_deadline) : null,
      contractor_id: project.contractor_id,
    });
    setDisplayEditDialog(true);
  };

  // Handle edit project 
  const handleEditProject = async () => {
    const token = localStorage.getItem('access_token');

    console.log("Token being sent:", token);
    try{
        await axios.patch(`http://localhost:3000/api/projects/${editingProject.project_id}`, 
            {
                project_name: editingProject.name,
                project_description: editingProject.description,
                total_amount: editingProject.amount,
                project_deadline: editingProject.dueDate,
            }, {
                headers: 
                {
                    Authorization: `Bearer ${token}`,
                }
            });
            setDisplayEditDialog(false);
            fetchProjects();

            toastRef.current.show({
                severity: 'success',
                summary: 'Updated',
                detail: 'Project updated successfully',
            });
    }catch(error){
        console.error("Update Failed:", error);
}
  };

  const actionBodyTemplate = (rowData) => (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <Button
        icon="pi pi-pencil"
        rounded
        severity="info"
        onClick={() => openEditDialog(rowData)}
      />
      <Button
        icon="pi pi-trash"
        rounded
        severity="danger"
        onClick={() => handleDeleteProject(rowData.project_id)}
      />
    </div>
  );

  return (
    <div className="projects-panel">
      <Toast ref={toastRef} />
      <div className="projects-header">
        <h2>Projects</h2>
        <Button
          label="Add New Project"
          icon="pi pi-plus"
          onClick={() => setDisplayDialog(true)}
          className="p-button-success"
        />
      </div>

      <DataTable
        value={Array.isArray(projects) ? projects : []}
        loading={loading}
        responsiveLayout="scroll"
        paginator
        rows={10}
        dataKey="project_id"
      >
        <Column field="project_name" header="Name" sortable style={{ width: '10%' }} />
        <Column field="project_description" header="Description" sortable style={{ width: '30%' }} />
        <Column
          field="total_amount"
          header="Amount (peso)"
          sortable
          style={{ width: '45%' }}
        />
        <Column
          body={actionBodyTemplate}
          header="Actions"
          style={{ width: '15%' }}
        />
      </DataTable>

      <Dialog
        header="Create New Project"
        visible={displayDialog}
        onHide={() => {
          setDisplayDialog(false);
          setNewProject({ name: '', description: '', amount: '', dueDate: null, contractor_id: null });
        }}
        modal
        style={{ width: '50vw' }}
      >
        <div className="dialog-content">
          <div className="field">
            <label htmlFor="project-name">Project Name *</label>
            <InputText
              id="project-name"
              value={newProject.name}
              onChange={(e) =>
                setNewProject({ ...newProject, name: e.target.value })
              }
              placeholder="Enter project name"
              className="w-full"
            />
          </div>

          <div className="field">
            <label htmlFor="project-description">Description</label>
            <InputTextarea
              id="project-description"
              value={newProject.description}
              onChange={(e) =>
                setNewProject({ ...newProject, description: e.target.value })
              }
              placeholder="Enter project description"
              rows={4}
              className="w-full"
            />
          </div>

          <div className="field">
            <label htmlFor="project-amount">Project Amount</label>
            <InputText
              id="project-amount"
              type="number"
              step="0.01"
              value={newProject.amount}
              onChange={(e) =>
                setNewProject({ ...newProject, amount: e.target.value })
              }
              placeholder="Enter project amount"
              className="w-full"
            />
          </div>

          <div className="field">
            <label htmlFor="project-due-date">Due Date</label>
            <Calendar
              id="project-due-date"
              value={newProject.dueDate}
              onChange={(e) =>
                setNewProject({ ...newProject, dueDate: e.value })
              }
              dateFormat="mm/dd/yy"
              placeholder="Select due date"
              className="w-full"
            />
          </div>

          <div className="field">
            <label htmlFor="project-contractor">Contractor</label>
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
              className="w-full"
            />
          </div>

          <div className="dialog-footer">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => {
                setDisplayDialog(false);
                setNewProject({ name: '', description: '', amount: '', dueDate: null, contractor_id: null });
              }}
              className="p-button-text"
            />
            <Button
              label="Create"
              icon="pi pi-check"
              onClick={handleAddProject}
              className="p-button-success"
            />
          </div>
        </div>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog
        header="Edit Project"
        visible={displayEditDialog}
        onHide={() => {
          setDisplayEditDialog(false);
          setEditingProject({
            project_id: '',
            name: '',
            description: '',
            amount: '',
            dueDate: null,
            contractor_id: null,
          });
        }}
        modal
        style={{ width: '50vw' }}
      >
        <div className="dialog-content">
          <div className="field">
            <label htmlFor="edit-project-name">Project Name *</label>
            <InputText
              id="edit-project-name"
              value={editingProject.name}
              onChange={(e) =>
                setEditingProject({ ...editingProject, name: e.target.value })
              }
              placeholder="Enter project name"
              className="w-full"
            />
          </div>

          <div className="field">
            <label htmlFor="edit-project-description">Description</label>
            <InputTextarea
              id="edit-project-description"
              value={editingProject.description}
              onChange={(e) =>
                setEditingProject({ ...editingProject, description: e.target.value })
              }
              placeholder="Enter project description"
              rows={4}
              className="w-full"
            />
          </div>

          <div className="field">
            <label htmlFor="edit-project-amount">Project Amount</label>
            <InputText
              id="edit-project-amount"
              type="number"
              step="0.01"
              value={editingProject.amount}
              onChange={(e) =>
                setEditingProject({ ...editingProject, amount: e.target.value })
              }
              placeholder="Enter project amount"
              className="w-full"
            />
          </div>

          <div className="field">
            <label htmlFor="edit-project-due-date">Due Date</label>
            <Calendar
              id="edit-project-due-date"
              value={editingProject.dueDate}
              onChange={(e) =>
                setEditingProject({ ...editingProject, dueDate: e.value })
              }
              dateFormat="mm/dd/yy"
              placeholder="Select due date"
              className="w-full"
            />
          </div>

          <div className="field">
            <label htmlFor="edit-project-contractor">Contractor</label>
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
              className="w-full"
            />
          </div>

          <div className="dialog-footer">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => {
                setDisplayEditDialog(false);
                setEditingProject({
                  project_id: '',
                  name: '',
                  description: '',
                  amount: '',
                  dueDate: null,
                  contractor_id: null,
                });
              }}
              className="p-button-text"
            />
            <Button
              label="Update"
              icon="pi pi-check"
              onClick={handleEditProject}
              className="p-button-success"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default ProjectsPanel;
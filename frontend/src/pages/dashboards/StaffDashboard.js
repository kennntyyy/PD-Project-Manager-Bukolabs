import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog } from "primereact/confirmdialog";
import { useAuth } from "../../context/AuthContext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import axios from "axios";
import "./Dashboard.css";
import api from '../../services/api';

const StaffDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [contractors, setContractors] = useState([]);
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem("staffActiveTab") || "overview",
  );
  const [activeNav, setActiveNav] = useState(
    () => localStorage.getItem("staffActiveNav") || "overview",
  );
  const toast = useRef(null);

  //new project 
  const [newProject, setNewProject] = useState({
      name: '',
      description: '',
      amount: '',
      dueDate: null,
      contractor_id: null,
    });
  
  //adding new projects
  const handleAddProject = async () => {
    //validation
    if(!newProject.name.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Project name is required'
      });
      return;
    }

    try{
      await api.post('/project', {
        project_name: newProject.name,
        project_description: newProject.description,
        total_amount: newProject.amount,
        project_deadline: newProject.dueDate,
        contractor_id: newProject.contractor_id
      });

      //reset forms
      setNewProject({
        name: "",
        description: "",
        amount: "",
        dueDate: null,
        contractor_id: null
      });

      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Project Created!'
      });
      
      //update table
      fetchProjects();
    } catch (error) {
      console.log("Project creation error: ", error);

      toast.current?.show({
        severity: 'error',
        summary: 'Warning',
        details: 'There was an error in creating a project'
      });
    }
  }
  
  //FORMAT DATE
  const dateTemplate = (rowData) => {
    if (!rowData.project_deadline) return 'N/A';
    return new Date(rowData.project_deadline).toLocaleDateString();
  }

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await api.get('/projects', {
        headers: { Authorization: `Bearer ${token}`}
      });
      console.log("Response from API:", response.data);
      setProjects(response.data);

    } catch (error) {

      return (error);

    }
  };

  //FORMAT AMOUNT WITH CURRENCY
  const amountTemplate = (rowData) => {
    if (!rowData.total_amount) return 'N/A';
    return `₱${parseFloat(rowData.total_amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  
  //FETCH ALL CONTRACTORS
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

  //get contractor name by id
  // const getContractorName = (contractorId) => {
  //   if (!contractorId) return '';
  //   const contractor = contractors.find((c) => c.user_id === contractorId);
  //   return contractor
  //     ? `${contractor.first_name} ${contractor.last_name}`.toLowerCase()
  //     : '';
  // };

  //TEMPLATE FOR CONTRACTOR NAME
  const contractorTemplate = (rowData) => {
    if(!rowData.contractor_id) return 'N/A';

    const contractor = contractors.find((c) => c.user_id === rowData.contractor_id);
    return contractor
      ? `${contractor.first_name} ${contractor.last_name}`
      : 'N/A';
  }

  useEffect(() => {
    fetchProjects();
    fetchContractors();
    
  }, []);

  const navItems = [
    { key: "overview", icon: "pi pi-home", label: "Overview" },
    { key: "tasks", icon: "pi pi-check-square", label: "My Tasks" },
    { key: "projects", icon: "pi pi-folder", label: "Projects" },
    { key: "reports", icon: "pi pi-chart-bar", label: "Reports" },
    { key: "settings", icon: "pi pi-cog", label: "Settings" },
  ];

  React.useEffect(() => {
    localStorage.setItem("staffActiveTab", activeTab);
    localStorage.setItem("staffActiveNav", activeNav);
  }, [activeTab, activeNav]);

  return (
    <div className="dashboard-container">
      <Toast ref={toast} />
      <ConfirmDialog />
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <i className="pi pi-briefcase"></i>
          </div>
          <div className="sidebar-title">
            <h3>Staff</h3>
            <p>Control Panel</p>
          </div>
        </div>
        <div className="sidebar-nav">
          {navItems.map((item) => (
            <div
              key={item.key}
              className={`nav-item ${activeNav === item.key ? "active" : ""}`}
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
                {activeTab === "overview" && "Overview"}
                {activeTab === "tasks" && "My Tasks"}
                {activeTab === "projects" && "Projects"}
                {activeTab === "reports" && "Reports"}
                {activeTab === "settings" && "Settings"}
              </h2>
              <p className="header-subtitle">
                {activeTab === "overview" && "Welcome back, Staff!"}
                {activeTab === "tasks" && "View and manage your tasks"}
                {activeTab === "projects" && "Project assignments"}
                {activeTab === "reports" && "View reports"}
                {activeTab === "settings" && "Configure your settings"}
              </p>
            </div>
          </div>
          <div className="header-right">
            <div className="user-profile">
              <div className="user-avatar">
                {user?.username?.charAt(0).toUpperCase()}
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
          {activeTab === "overview" && (
            <div>
              <h3>Quick Stats</h3>
              {/* Add staff overview widgets here */}
            </div>
          )}
          {activeTab === "tasks" && (
            <div>
              
            </div>
          )}
          {activeTab === "projects" && (
            <div>
              <h2>PROJECTS</h2>

              <DataTable
                value={projects}
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 20, 50]}
                tableStyle={{ minWidth : '50rem'}}
                emptyMessage={
                  'EmptyTable'
                }
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              >
                <Column field="project_name" header="Project name" sortable></Column>
                <Column field="project_description" header="Description" sortable></Column>
                <Column 
                  field="total_amount" 
                  header="Amount" 
                  body={amountTemplate}
                  sortable></Column>
                <Column 
                  field="project_deadline" 
                  header="Due Date"
                  body={dateTemplate}></Column>
                <Column 
                field="contractor_id"
                header="Contractor"
                body={contractorTemplate}>
                </Column>
              </DataTable>
            </div>
          )}
          {activeTab === "reports" && (
            <div>
              <h3>Reports</h3>
              {/* Add staff reports panel here */}
            </div>
          )}
          {activeTab === "settings" && (
            <div>
              <h3>Settings</h3>
              {/* Add staff settings panel here */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;

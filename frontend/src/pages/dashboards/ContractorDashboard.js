import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import "./Dashboard.css";

const ContractorDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem("contractorActiveTab") || "overview");
  const [activeNav, setActiveNav] = useState(() => localStorage.getItem("contractorActiveNav") || "overview");
  const toast = useRef(null);

  const deliverables = [
    { id: 1, name: "Landing Page", project: "Website Redesign", due: "Today", status: "In Progress" },
    { id: 2, name: "API Module", project: "Mobile App", due: "Tomorrow", status: "Pending" },
  ];

  const contracts = [
    { id: 1, name: "Website Development", status: "Active", due: "2024-06-30" },
    { id: 2, name: "Mobile App", status: "Pending", due: "2024-07-15" },
  ];

  const navItems = [
    { key: "overview", icon: "pi pi-home", label: "Overview" },
    { key: "deliverables", icon: "pi pi-check-square", label: "Deliverables" },
    { key: "payments", icon: "pi pi-money-bill", label: "Payments" },
    { key: "timesheets", icon: "pi pi-clock", label: "Timesheets" },
    { key: "settings", icon: "pi pi-cog", label: "Settings" },
  ];

  useEffect(() => {
    localStorage.setItem("contractorActiveTab", activeTab);
    localStorage.setItem("contractorActiveNav", activeNav);
  }, [activeTab, activeNav]);

  return (
    <div className="dashboard-container">
      <Toast ref={toast} />
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <i className="pi pi-briefcase"></i>
          </div>
          <div className="sidebar-title">
            <h3>Contractor</h3>
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
                {activeTab === "deliverables" && "Deliverables"}
                {activeTab === "payments" && "Payments"}
                {activeTab === "timesheets" && "Timesheets"}
                {activeTab === "settings" && "Settings"}
              </h2>
              <p className="header-subtitle">
                {activeTab === "overview" && "Welcome back, Contractor!"}
                {activeTab === "deliverables" && "View and manage your deliverables"}
                {activeTab === "payments" && "Manage payments"}
                {activeTab === "timesheets" && "Track your timesheets"}
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
              {/* Add contractor overview widgets here */}
            </div>
          )}
          {activeTab === "deliverables" && (
            <div>
              <h3>Deliverables</h3>
              <table className="p-datatable-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Project</th>
                    <th>Due</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {deliverables.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.project}</td>
                      <td>{item.due}</td>
                      <td>{item.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {activeTab === "payments" && (
            <div>
              <h3>Payments</h3>
              {/* Add contractor payments panel here */}
            </div>
          )}
          {activeTab === "timesheets" && (
            <div>
              <h3>Timesheets</h3>
              {/* Add contractor timesheets panel here */}
            </div>
          )}
          {activeTab === "settings" && (
            <div>
              <h3>Settings</h3>
              {/* Add contractor settings panel here */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractorDashboard;
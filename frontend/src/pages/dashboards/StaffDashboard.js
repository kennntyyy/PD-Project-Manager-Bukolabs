import React, { useState, useEffect, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog } from "primereact/confirmdialog";
import { useAuth } from "../../context/AuthContext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import "./Dashboard.css";
import StaffProjectsPanel from "./staff_panels/Staff_ProjectsPanel";

const StaffDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem("staffActiveTab") || "overview",
  );
  const [activeNav, setActiveNav] = useState(
    () => localStorage.getItem("staffActiveNav") || "overview",
  );
  const toast = useRef(null);

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
            <StaffProjectsPanel />
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

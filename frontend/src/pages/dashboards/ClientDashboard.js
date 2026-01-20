import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import "./Dashboard.css";

const ClientDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem("clientActiveTab") || "overview",
  );
  const [activeNav, setActiveNav] = useState(
    () => localStorage.getItem("clientActiveNav") || "overview",
  );
  const toast = useRef(null);

  const projects = [
    { id: 1, name: "Website Redesign", status: "Active", due: "2024-06-30" },
    { id: 2, name: "Mobile App", status: "Pending", due: "2024-07-15" },
  ];

  const navItems = [
    { key: "overview", icon: "pi pi-home", label: "Overview" },
    { key: "projects", icon: "pi pi-folder", label: "Projects" },
    { key: "invoices", icon: "pi pi-dollar", label: "Invoices" },
    { key: "communications", icon: "pi pi-comments", label: "Communications" },
    { key: "support", icon: "pi pi-question-circle", label: "Support" },
    { key: "settings", icon: "pi pi-cog", label: "Settings" },
  ];

  useEffect(() => {
    localStorage.setItem("clientActiveTab", activeTab);
    localStorage.setItem("clientActiveNav", activeNav);
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
            <h3>Client</h3>
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
                {activeTab === "projects" && "Projects"}
                {activeTab === "invoices" && "Invoices"}
                {activeTab === "communications" && "Communications"}
                {activeTab === "support" && "Support"}
                {activeTab === "settings" && "Settings"}
              </h2>
              <p className="header-subtitle">
                {activeTab === "overview" && "Welcome back, Client!"}
                {activeTab === "projects" && "View your projects"}
                {activeTab === "invoices" && "Manage invoices and payments"}
                {activeTab === "communications" && "Messages and meetings"}
                {activeTab === "support" && "Get help and support"}
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
              {/* Add client overview widgets here */}
            </div>
          )}
          {activeTab === "projects" && (
            <div>
              <h3>Projects</h3>
              <table className="p-datatable-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Due</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id}>
                      <td>{project.name}</td>
                      <td>{project.status}</td>
                      <td>{project.due}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {activeTab === "invoices" && (
            <div>
              <h3>Invoices</h3>
              {/* Add client invoices panel here */}
            </div>
          )}
          {activeTab === "communications" && (
            <div>
              <h3>Communications</h3>
              {/* Add client communications panel here */}
            </div>
          )}
          {activeTab === "support" && (
            <div>
              <h3>Support</h3>
              {/* Add client support panel here */}
            </div>
          )}
          {activeTab === "settings" && (
            <div>
              <h3>Settings</h3>
              {/* Add client settings panel here */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;

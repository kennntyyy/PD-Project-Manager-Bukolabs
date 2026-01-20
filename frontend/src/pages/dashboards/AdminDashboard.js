import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { userService } from "../../services/userService";
import OverviewPanel from "./panels/OverviewPanel";
import UserManagementPanel from "./panels/UserManagementPanel";
import ReportsPanel from "./panels/ReportsPanel";
import SettingsPanel from "./panels/SettingsPanel";
import "./Dashboard.css";

// ============================================
// ADMIN DASHBOARD
// Routes to different admin panels via navigation
// Each panel is a separate component for easy collaboration
// ============================================

const AdminDashboard = () => {
  // ============================================
  // STATE & CONTEXT
  // ============================================
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem("adminActiveTab") || "overview",
  );
  const [activeNav, setActiveNav] = useState(
    () => localStorage.getItem("adminActiveNav") || "overview",
  );
  const toast = useRef(null);

  // ============================================
  // LOAD USERS ON COMPONENT MOUNT
  // ============================================

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    localStorage.setItem("adminActiveTab", activeTab);
    localStorage.setItem("adminActiveNav", activeNav);
  }, [activeTab, activeNav]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error("Load users error:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message ||
          error.message ||
          "Failed to load users",
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RENDER: MAIN LAYOUT
  // ============================================

  return (
    <div className="dashboard-container">
      <Toast ref={toast} />

      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <i className="pi pi-shield"></i>
          </div>
          <div className="sidebar-title">
            <h3>Admin</h3>
            <p>Control Panel</p>
          </div>
        </div>

        <div className="sidebar-nav">
          <div
            className={`nav-item ${activeNav === "overview" ? "active" : ""}`}
            onClick={() => {
              setActiveNav("overview");
              setActiveTab("overview");
            }}
          >
            <i className="pi pi-home"></i>
            <span>Overview</span>
          </div>
          <div
            className={`nav-item ${activeNav === "users" ? "active" : ""}`}
            onClick={() => {
              setActiveNav("users");
              setActiveTab("users");
            }}
          >
            <i className="pi pi-users"></i>
            <span>User Management</span>
          </div>
          <div
            className={`nav-item ${activeNav === "reports" ? "active" : ""}`}
            onClick={() => {
              setActiveNav("reports");
              setActiveTab("reports");
            }}
          >
            <i className="pi pi-chart-bar"></i>
            <span>Reports</span>
          </div>
          <div
            className={`nav-item ${activeNav === "settings" ? "active" : ""}`}
            onClick={() => {
              setActiveNav("settings");
              setActiveTab("settings");
            }}
          >
            <i className="pi pi-cog"></i>
            <span>Settings</span>
          </div>
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

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-left">
            <div>
              <h2 className="header-title">
                {activeTab === "overview" && "Overview"}
                {activeTab === "users" && "User Management"}
                {activeTab === "reports" && "Reports"}
                {activeTab === "settings" && "Settings"}
              </h2>
              <p className="header-subtitle">
                {activeTab === "overview" && "Welcome back, Admin!"}
                {activeTab === "users" && "Manage system users"}
                {activeTab === "reports" && "View analytics and reports"}
                {activeTab === "settings" && "Configure system settings"}
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

        {/* Body - Render appropriate panel based on activeTab */}
        <div className="dashboard-body">
          {activeTab === "overview" && <OverviewPanel users={users} />}
          {activeTab === "users" && <UserManagementPanel />}
          {activeTab === "reports" && <ReportsPanel />}
          {activeTab === "settings" && <SettingsPanel />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

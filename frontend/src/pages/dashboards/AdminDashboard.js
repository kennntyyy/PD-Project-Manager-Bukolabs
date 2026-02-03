import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { userService } from '../../services/userService';
import OverviewPanel from './panels/OverviewPanel';
import UserManagementPanel from './panels/UserManagementPanel';
import ReportsPanel from './panels/ReportsPanel';
import SettingsPanel from './panels/SettingsPanel';
import ProjectsPanel from './panels/ProjectsPanel';
import AuditLogsPanel from './panels/AuditLogsPanel';
import './Dashboard.css';

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
    () => localStorage.getItem('adminActiveTab') || 'overview',
  );
  const [activeNav, setActiveNav] = useState(
    () => localStorage.getItem('adminActiveNav') || 'overview',
  );
  const toast = useRef(null);
  const logoUrl = `${process.env.PUBLIC_URL}/logo.png`;

  // ============================================
  // LOAD USERS ON COMPONENT MOUNT
  // ============================================

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
    localStorage.setItem('adminActiveNav', activeNav);
  }, [activeTab, activeNav]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Load users error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail:
          error.response?.data?.message ||
          error.message ||
          'Failed to load users',
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // NAV HANDLERS
  // ============================================
  const handleNavClick = (navName) => {
    console.log('Navigating to:', navName);
    setActiveNav(navName);
    setActiveTab(navName);
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
            <img className="sidebar-logo-img" src={logoUrl} alt="Logo" />
          </div>
        </div>

        <div className="sidebar-nav">
          <div
            className={`nav-item ${activeNav === 'overview' ? 'active' : ''}`}
            onClick={() => handleNavClick('overview')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleNavClick('overview');
              }
            }}
          >
            <i className="pi pi-home"></i>
            <span>Overview</span>
          </div>
          <div
            className={`nav-item ${activeNav === 'users' ? 'active' : ''}`}
            onClick={() => handleNavClick('users')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleNavClick('users');
              }
            }}
          >
            <i className="pi pi-users"></i>
            <span>User Management</span>
          </div>
          <div
            className={`nav-item ${activeNav === 'reports' ? 'active' : ''}`}
            onClick={() => handleNavClick('reports')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleNavClick('reports');
              }
            }}
          >
            <i className="pi pi-chart-bar"></i>
            <span>Reports</span>
          </div>
          <div
            className={`nav-item ${activeNav === 'settings' ? 'active' : ''}`}
            onClick={() => handleNavClick('settings')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleNavClick('settings');
              }
            }}
          >
            <i className="pi pi-cog"></i>
            <span>Settings</span>
          </div>
          <div
            className={`nav-item ${activeNav === 'projects' ? 'active' : ''}`}
            onClick={() => handleNavClick('projects')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleNavClick('projects');
              }
            }}
          >
            <i className="pi pi-folder"></i>
            <span>Projects</span>
          </div>
          <div
            className={`nav-item ${activeNav === 'audit-logs' ? 'active' : ''}`}
            onClick={() => handleNavClick('audit-logs')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleNavClick('audit-logs');
              }
            }}
          >
            <i className="pi pi-history"></i>
            <span>Audit Logs</span>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              {(() => {
                return user?.profile_pic &&
                  typeof user.profile_pic === 'string' ? (
                  <img
                    src={`data:image/jpeg;base64,${user.profile_pic}`}
                    alt={user?.username}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  user?.username?.charAt(0).toUpperCase()
                );
              })()}
            </div>
            <div className="user-info">
              <h4>
                {user?.first_name} {user?.last_name}
              </h4>
              <p>{user?.user_role?.toUpperCase()}</p>
            </div>
          </div>
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
        {/* Body - Render appropriate panel based on activeTab */}
        <div className="dashboard-body">
          {activeTab === 'overview' && <OverviewPanel users={users} />}
          {activeTab === 'users' && <UserManagementPanel />}
          {activeTab === 'reports' && <ReportsPanel />}
          {activeTab === 'settings' && <SettingsPanel />}
          {activeTab === 'projects' && <ProjectsPanel />}
          {activeTab === 'audit-logs' && <AuditLogsPanel />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

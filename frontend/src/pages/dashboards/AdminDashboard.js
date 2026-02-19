import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { userService } from '../../services/userService';
import OverviewPanel from './panels/OverviewPanel';
import UserManagementPanel from './panels/UserManagementPanel';
import ClientManagementPanel from './panels/ClientManagementPanel';
import ContractorManagementPanel from './panels/ContractorManagementPanel';
import ReportsPanel from './panels/ReportsPanel';
import SettingsPanel from './panels/SettingsPanel';
import ProjectsPanel from './panels/ProjectsPanel';
import ProjectDashboardPanel from './panels/ProjectDashboardPanel';
import AuditLogsPanel from './panels/AuditLogsPanel';
import CategoriesPanel from './panels/CategoriesPanel';
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
  const [projectStatusFilter, setProjectStatusFilter] = useState(null);
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem('adminActiveTab') || 'overview',
  );
  const [activeNav, setActiveNav] = useState(() => {
    const storedNav = localStorage.getItem('adminActiveNav') || 'overview';
    if (storedNav === 'clients' || storedNav === 'contractors') {
      return 'users';
    }
    return storedNav;
  });
  const [usersOpen, setUsersOpen] = useState(() => {
    const saved = localStorage.getItem('adminUsersOpen');
    if (saved !== null) {
      return saved === 'true';
    }
    const storedTab = localStorage.getItem('adminActiveTab') || '';
    return ['users', 'clients', 'contractors'].includes(storedTab);
  });
  const [settingsOpen, setSettingsOpen] = useState(() => {
    const saved = localStorage.getItem('adminSettingsOpen');
    if (saved !== null) {
      return saved === 'true';
    }
    const storedTab = localStorage.getItem('adminActiveTab') || '';
    return storedTab.startsWith('settings');
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('adminSidebarCollapsed');
    if (saved !== null) {
      return saved === 'true';
    }
    return false;
  });
  const [isNarrow, setIsNarrow] = useState(false);
  const toast = useRef(null);
  const logoUrl = `${process.env.PUBLIC_URL}/logo.png`;

  // ============================================
  // LOAD USERS ON COMPONENT MOUNT
  // ============================================

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1024px)');
    const handleChange = () => setIsNarrow(mediaQuery.matches);
    handleChange();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
    localStorage.setItem('adminActiveNav', activeNav);
    localStorage.setItem('adminUsersOpen', usersOpen.toString());
    localStorage.setItem('adminSettingsOpen', settingsOpen.toString());
    localStorage.setItem('adminSidebarCollapsed', sidebarCollapsed.toString());
  }, [activeTab, activeNav, usersOpen, settingsOpen, sidebarCollapsed]);

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
  const handleNavClick = (navName, tabName = navName) => {
    console.log('Navigating to:', navName);
    setActiveNav(navName);
    setActiveTab(tabName);
  };

  const handleOverviewStatClick = ({ statusFilter }) => {
    setProjectStatusFilter(statusFilter || null);
    handleNavClick('projects');
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  const isSidebarCollapsed = isNarrow ? true : sidebarCollapsed;

  // ============================================
  // RENDER: MAIN LAYOUT
  // ============================================

  return (
    <div
      className={`dashboard-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}
    >
      <Toast ref={toast} />

      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img className="sidebar-logo-img" src={logoUrl} alt="Logo" style={{
               width: '200%', height: '200%',
            }} />
          </div>
          <button
            type="button"
            className="sidebar-toggle"
            onClick={handleSidebarToggle}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <i
              className={`pi ${isSidebarCollapsed ? 'pi-angle-right' : 'pi-angle-left'}`}
            ></i>
          </button>
        </div>

        <div className="sidebar-nav">
          <div
            className={`nav-item ${activeNav === 'overview' ? 'active' : ''}`}
            onClick={() => handleNavClick('overview')}
            role="button"
            tabIndex={0}
            title="Dashboard"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleNavClick('overview');
              }
            }}
          >
            <i className="pi pi-home"></i>
            <span>Dashboard</span>
          </div>
          {/*Projects Dashboard*/}
          <div
            className={`nav-item ${activeNav === 'project-dashboard' ? 'active' : ''}`}
            onClick={() => handleNavClick('project-dashboard')}
            role="button"
            tabIndex={0}
            title="Project Dashboard"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleNavClick('project-dashboard');
              }
            }}
          >
            <i className="pi pi-briefcase"></i>
            <span>Client Dashboard</span>
          </div>

          <div
            className={`nav-item ${activeNav === 'projects' ? 'active' : ''}`}
            onClick={() => {
              setProjectStatusFilter(null);
              handleNavClick('projects');
            }}
            role="button"
            tabIndex={0}
            title="Projects"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setProjectStatusFilter(null);
                handleNavClick('projects');
              }
            }}
          >
            <i className="pi pi-folder"></i>
            <span>Projects</span>
          </div>

          <div
            className={`nav-item ${activeNav === 'users' ? 'active' : ''}`}
            onClick={() => {
              setUsersOpen((prev) => !prev);
              handleNavClick('users');
            }}
            role="button"
            tabIndex={0}
            title="User Management"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setUsersOpen((prev) => !prev);
                handleNavClick('users');
              }
            }}
          >
            {/*Projects*/}
            <i className="pi pi-users"></i>
            <span>User Management</span>
            <i
              className={`pi ${usersOpen ? 'pi-chevron-down' : 'pi-chevron-right'} nav-caret`}
            ></i>
          </div>
          {usersOpen && (
            <div
              className={`nav-subitem ${activeTab === 'clients' ? 'active' : ''}`}
              onClick={() => handleNavClick('users', 'clients')}
              role="button"
              tabIndex={0}
              title="Clients"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleNavClick('users', 'clients');
                }
              }}
            >
              <i className="pi pi-id-card"></i>
              <span>Clients</span>
            </div>
          )}
          {usersOpen && (
            <div
              className={`nav-subitem ${activeTab === 'contractors' ? 'active' : ''}`}
              onClick={() => handleNavClick('users', 'contractors')}
              role="button"
              tabIndex={0}
              title="Contractors"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleNavClick('users', 'contractors');
                }
              }}
            >
              <i className="pi pi-wrench"></i>
              <span>Contractors</span>
            </div>
          )}

            

          {/* <div
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
          </div> */}

          {/* settings here */}
          <div
            className={`nav-item ${activeNav === 'settings' ? 'active' : ''}`}
            onClick={() => {
              setSettingsOpen((prev) => !prev);
              handleNavClick('settings', 'settings');
            }}
            role="button"
            tabIndex={0}
            title="Settings"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setSettingsOpen((prev) => !prev);
                handleNavClick('settings', 'settings');
              }
            }}
          >
            <i className="pi pi-cog"></i>
            <span>Settings</span>
            <i
              className={`pi ${settingsOpen ? 'pi-chevron-down' : 'pi-chevron-right'} nav-caret`}
            ></i>
          </div>
          {settingsOpen && (
            <div
              className={`nav-subitem ${activeTab === 'settings-categories' ? 'active' : ''}`}
              onClick={() => handleNavClick('settings', 'settings-categories')}
              role="button"
              tabIndex={0}
              title="Categories"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleNavClick('settings', 'settings-categories');
                }
              }}
            >
              <i className="pi pi-tags"></i>
              <span>Categories</span>
            </div>
          )}
          
          <div
            className={`nav-item ${activeNav === 'audit-logs' ? 'active' : ''}`}
            onClick={() => handleNavClick('audit-logs')}
            role="button"
            tabIndex={0}
            title="Audit Logs"
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

        <div
          className="sidebar-footer flex flex-col"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
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
            className="logout-btn p-button-sm"
            label={isSidebarCollapsed ? '' : 'Logout'}
            icon="pi pi-sign-out"
            onClick={logout}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Body - Render appropriate panel based on activeTab */}
        <div className="dashboard-body">
          {activeTab === 'overview' && (
            <OverviewPanel
              users={users}
              onStatClick={handleOverviewStatClick}
            />
          )}
          {activeTab === 'users' && (
            <UserManagementPanel roleFilters={['admin', 'staff']} />
          )}
          {activeTab === 'clients' && <ClientManagementPanel />}
          {activeTab === 'contractors' && <ContractorManagementPanel />}
          {activeTab === 'reports' && <ReportsPanel />}
          {activeTab === 'settings' && <SettingsPanel />}
          {activeTab === 'settings-categories' && <CategoriesPanel />}
          {activeTab === 'projects' && (
            <ProjectsPanel
              statusFilter={projectStatusFilter}
              onStatusFilterClear={() => setProjectStatusFilter(null)}
            />
          )}
          {activeTab === 'project-dashboard' && <ProjectDashboardPanel />}
          {activeTab === 'audit-logs' && <AuditLogsPanel />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

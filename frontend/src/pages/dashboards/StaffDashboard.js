import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { useAuth } from '../../context/AuthContext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import SettingsPanel from './panels/SettingsPanel';
import './Dashboard.css';
import './StaffDashboardMobileNav.css';
import StaffProjectsPanel from './staff_panels/Staff_ProjectsPanel';
import StaffReportsPanel from './staff_panels/Staff_ReportsPanel';
import StaffClientDashboardPanel from './staff_panels/StaffClientDashboardPanel';
import StaffOverviewPanel from './staff_panels/StaffOverviewPanel';

const StaffDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('staffActiveTab');
    return saved || 'projects';
  });
  const [activeNav, setActiveNav] = useState(() => {
    const saved = localStorage.getItem('staffActiveNav');
    return saved || 'projects';
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('staffSidebarCollapsed');
    if (saved !== null) {
      return saved === 'true';
    }
    return false;
  });
  const [settingsOpen, setSettingsOpen] = useState(() => {
    const saved = localStorage.getItem('staffSettingsOpen');
    if (saved !== null) {
      return saved === 'true';
    }
    const storedTab = localStorage.getItem('staffActiveTab') || '';
    return storedTab.startsWith('settings');
  });
  const [isNarrow, setIsNarrow] = useState(false);
  const toast = useRef(null);
  const logoUrl = `${process.env.PUBLIC_URL}/logo.png`;

  useEffect(() => {
    localStorage.setItem('staffActiveTab', activeTab);
    localStorage.setItem('staffActiveNav', activeNav);
    localStorage.setItem('staffSidebarCollapsed', sidebarCollapsed.toString());
    localStorage.setItem('staffSettingsOpen', settingsOpen.toString());
  }, [activeTab, activeNav, sidebarCollapsed, settingsOpen]);

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

  const isSidebarCollapsed = isNarrow ? true : sidebarCollapsed;

  return (
    <div className={`dashboard-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Toast ref={toast} />
      <ConfirmDialog />
      <div className="dashboard-sidebar desktop-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img className="sidebar-logo-img" src={logoUrl} alt="Logo" style={{ width: '200%', height: '200%' }} />
          </div>
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <i className={`pi ${isSidebarCollapsed ? 'pi-angle-right' : 'pi-angle-left'}`}></i>
          </button>
        </div>
        <div className="sidebar-nav">
          {/* Overview nav item */}
          <div
            className={`nav-item ${activeNav === 'overview' ? 'active' : ''}`}
            onClick={() => {
              setActiveNav('overview');
              setActiveTab('overview');
            }}
            title="Dashboard Overview"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setActiveNav('overview');
                setActiveTab('overview');
              }
            }}
          >
            <i className="pi pi-home"></i>
            <span>Dashboard</span>
          </div>
          {/* Client Dashboard nav item */}
          <div
            className={`nav-item ${activeNav === 'client-dashboard' ? 'active' : ''}`}
            onClick={() => {
              setActiveNav('client-dashboard');
              setActiveTab('client-dashboard');
            }}
            title="Client Dashboard"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setActiveNav('client-dashboard');
                setActiveTab('client-dashboard');
              }
            }}
          >
            <i className="pi pi-briefcase"></i>
            <span>Client Dashboard</span>
          </div>
          {/* Projects nav item */}
          <div
            className={`nav-item ${activeNav === 'projects' ? 'active' : ''}`}
            onClick={() => {
              setActiveNav('projects');
              setActiveTab('projects');
            }}
            title="Projects"
          >
            <i className="pi pi-folder"></i>
            <span>Projects</span>
          </div>
          {/* Reports nav item */}
          {/* <div
            className={`nav-item ${activeNav === 'reports' ? 'active' : ''}`}
            onClick={() => {
              setActiveNav('reports');
              setActiveTab('reports');
            }}
            title="Reports"
          >
            <i className="pi pi-chart-bar"></i>
            <span>Reports</span>
          </div> */}
          {/* Settings dropdown nav */}
          <div
            className={`nav-item ${activeNav === 'settings' ? 'active' : ''}`}
            onClick={() => {
              setActiveNav('settings');
              setSettingsOpen((prev) => !prev);
            }}
            title="Settings"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setActiveNav('settings');
                setSettingsOpen((prev) => !prev);
              }
            }}
          >
            <i className="pi pi-cog"></i>
            <span>Settings</span>
            <i className={`pi ${settingsOpen ? 'pi-chevron-down' : 'pi-chevron-right'} nav-caret`}></i>
          </div>
          {settingsOpen && (
            <>
              <div
                className={`nav-subitem ${activeTab === 'settings-general' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings-general')}
                role="button"
                tabIndex={0}
                title="General Settings"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setActiveTab('settings-general');
                  }
                }}
              >
                <i className="pi pi-cog"></i>
                <span>General</span>
              </div>
              <div
                className={`nav-subitem ${activeTab === 'settings-security' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings-security')}
                role="button"
                tabIndex={0}
                title="Security Settings"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setActiveTab('settings-security');
                  }
                }}
              >
                <i className="pi pi-shield"></i>
                <span>Security</span>
              </div>
            </>
          )}
        </div>
        <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="user-profile">
            <div className="user-avatar">
              {(() => {
                return user?.profile_pic && typeof user.profile_pic === 'string' ? (
                  <img
                    src={`data:image/jpeg;base64,${user.profile_pic}`}
                    alt={user?.username}
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
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
      {/* Bottom nav for mobile */}
      <nav className="mobile-bottom-nav">
        <button
          className={`mobile-nav-btn ${activeNav === 'overview' ? 'active' : ''}`}
          onClick={() => {
            setActiveNav('overview');
            setActiveTab('overview');
          }}
          aria-label="Dashboard Overview"
        >
          <i className="pi pi-home"></i>
          <span>Dashboard</span>
        </button>
        <button
          className={`mobile-nav-btn ${activeNav === 'client-dashboard' ? 'active' : ''}`}
          onClick={() => {
            setActiveNav('client-dashboard');
            setActiveTab('client-dashboard');
          }}
          aria-label="Client Dashboard"
        >
          <i className="pi pi-briefcase"></i>
          <span>Client Dashboard</span>
        </button>
        <button
          className={`mobile-nav-btn ${activeNav === 'projects' ? 'active' : ''}`}
          onClick={() => {
            setActiveNav('projects');
            setActiveTab('projects');
          }}
          aria-label="Projects"
        >
          <i className="pi pi-folder"></i>
          <span>Projects</span>
        </button>
        <button
          className={`mobile-nav-btn ${activeNav === 'reports' ? 'active' : ''}`}
          onClick={() => {
            setActiveNav('reports');
            setActiveTab('reports');
          }}
          aria-label="Reports"
        >
          <i className="pi pi-chart-bar"></i>
          <span>Reports</span>
        </button>
        <button
          className={`mobile-nav-btn ${activeNav === 'settings' ? 'active' : ''}`}
          onClick={() => {
            setActiveNav('settings');
            setSettingsOpen((prev) => !prev);
          }}
          aria-label="Settings"
        >
          <i className="pi pi-cog"></i>
          <span>Settings</span>
        </button>
        <button className="mobile-nav-btn" onClick={logout} aria-label="Logout">
          <i className="pi pi-sign-out"></i>
          <span>Logout</span>
        </button>
      </nav>
      <div className="dashboard-content">
        <div className="dashboard-body">
          {activeTab === 'overview' && <StaffOverviewPanel />}
          {activeTab === 'client-dashboard' && <StaffClientDashboardPanel />}
          {activeTab === 'projects' && <StaffProjectsPanel />}
          {activeTab === 'reports' && <StaffReportsPanel />}
          {activeTab === 'settings-general' && <SettingsPanel activeTab="general" />}
          {activeTab === 'settings-security' && <SettingsPanel activeTab="security" />}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;

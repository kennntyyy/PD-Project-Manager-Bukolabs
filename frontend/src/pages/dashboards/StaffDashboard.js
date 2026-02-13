import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { useAuth } from '../../context/AuthContext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import './Dashboard.css';
import StaffProjectsPanel from './staff_panels/Staff_ProjectsPanel';
import StaffReportsPanel from './staff_panels/Staff_ReportsPanel';

const StaffDashboard = () => {
  const { user, logout } = useAuth();
  const allowedTabs = ['projects', 'reports', 'settings'];
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('staffActiveTab');
    return allowedTabs.includes(saved) ? saved : 'projects';
  });
  const [activeNav, setActiveNav] = useState(() => {
    const saved = localStorage.getItem('staffActiveNav');
    return allowedTabs.includes(saved) ? saved : 'projects';
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('staffSidebarCollapsed');
    if (saved !== null) {
      return saved === 'true';
    }
    return false;
  });
  const [isNarrow, setIsNarrow] = useState(false);
  const toast = useRef(null);
  const logoUrl = `${process.env.PUBLIC_URL}/logo.png`;

  const navItems = [
    { key: 'projects', icon: 'pi pi-folder', label: 'Projects' },
    { key: 'reports', icon: 'pi pi-chart-bar', label: 'Reports' },
    { key: 'settings', icon: 'pi pi-cog', label: 'Settings' },
  ];

  React.useEffect(() => {
    localStorage.setItem('staffActiveTab', activeTab);
    localStorage.setItem('staffActiveNav', activeNav);
    localStorage.setItem('staffSidebarCollapsed', sidebarCollapsed.toString());
  }, [activeTab, activeNav, sidebarCollapsed]);

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
    <div
      className={`dashboard-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}
    >
      <Toast ref={toast} />
      <ConfirmDialog />
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
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <i
              className={`pi ${isSidebarCollapsed ? 'pi-angle-right' : 'pi-angle-left'}`}
            ></i>
          </button>
        </div>
        <div className="sidebar-nav">
          {navItems.map((item) => (
            <div
              key={item.key}
              className={`nav-item ${activeNav === item.key ? 'active' : ''}`}
              onClick={() => {
                setActiveNav(item.key);
                setActiveTab(item.key);
              }}
              role="button"
              tabIndex={0}
              title={item.label}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setActiveNav(item.key);
                  setActiveTab(item.key);
                }
              }}
            >
              <i className={item.icon}></i>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
      <div className="dashboard-content">
        <div className="dashboard-body">
          {activeTab === 'projects' && <StaffProjectsPanel />}
          {activeTab === 'reports' && <StaffReportsPanel />}
          {activeTab === 'settings' && (
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

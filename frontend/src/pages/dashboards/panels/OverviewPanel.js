import React from "react";

// ============================================
// OVERVIEW PANEL
// Displays: System stats and dashboard overview
// ============================================

const OverviewPanel = ({ users }) => {
  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Users</div>
          <p className="stat-value">{users.length}</p>
          <div className="stat-change positive">
            <i className="pi pi-arrow-up"></i> 12% from last month
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Users</div>
          <p className="stat-value">
            {users.filter((u) => u.is_active).length}
          </p>
          <div className="stat-change positive">
            <i className="pi pi-arrow-up"></i> 8% from last month
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Inactive Users</div>
          <p className="stat-value">
            {users.filter((u) => !u.is_active).length}
          </p>
          <div className="stat-change negative">
            <i className="pi pi-arrow-down"></i> 2% from last month
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">System Health</div>
          <p className="stat-value">98%</p>
          <div className="stat-change positive">
            <i className="pi pi-check-circle"></i> All systems operational
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewPanel;

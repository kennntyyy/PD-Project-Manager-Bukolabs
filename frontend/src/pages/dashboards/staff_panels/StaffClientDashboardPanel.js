import React from 'react';
import ProjectDashboardPanel from '../panels/ProjectDashboardPanel';

const StaffClientDashboardPanel = () => {
  // Pass a prop to indicate staff mode (no delete allowed)
  return <ProjectDashboardPanel isStaff />;
};

export default StaffClientDashboardPanel;

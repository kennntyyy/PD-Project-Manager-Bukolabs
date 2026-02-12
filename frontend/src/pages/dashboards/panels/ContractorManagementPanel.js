import React from 'react';
import UserManagementPanel from './UserManagementPanel';

const ContractorManagementPanel = () => (
  <UserManagementPanel
    roleFilter="contractor"
    title="Contractor Management"
    description="Manage contractor accounts and access"
    entityLabel="Contractor"
    entityPluralLabel="Contractors"
    defaultRole="contractor"
    allowRoleSelect={false}
    showRoleColumn={false}
  />
);

export default ContractorManagementPanel;

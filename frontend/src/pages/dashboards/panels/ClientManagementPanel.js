import React from 'react';
import UserManagementPanel from './UserManagementPanel';

const ClientManagementPanel = () => (
  <UserManagementPanel
    roleFilter="client"
    title="Client Management"
    description="Manage client accounts and access"
    entityLabel="Client"
    entityPluralLabel="Clients"
    defaultRole="client"
    allowRoleSelect={false}
    showRoleColumn={false}
  />
);

export default ClientManagementPanel;

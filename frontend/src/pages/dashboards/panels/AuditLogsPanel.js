import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';

import { auditLogService } from '../../../services/auditLogService';
import api from '../../../services/api';
import '../Dashboard.css';
import './AuditLogsPanel.css';

const AuditLogsPanel = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [userLookup, setUserLookup] = useState(() => {
    try {
      const cached = sessionStorage.getItem('auditLogUserLookup');
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      return {};
    }
  });
  const [projectLookup, setProjectLookup] = useState(() => {
    try {
      const cached = sessionStorage.getItem('auditLogProjectLookup');
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      return {};
    }
  });
  const [lazyParams, setLazyParams] = useState({
    first: 0,
    rows: 50,
    page: 1,
    search: '',
  });
  const [globalSearch, setGlobalSearch] = useState('');
  const toast = useRef(null);

  const actions = [
    { label: 'Login', value: 'LOGIN' },
    { label: 'Create', value: 'CREATE' },
    { label: 'Update', value: 'UPDATE' },
    { label: 'Delete', value: 'DELETE' },
    { label: 'Restore', value: 'RESTORE' },
  ];

  const resources = [
    { label: 'Auth', value: 'AUTH' },
    { label: 'User', value: 'USER' },
    { label: 'Project', value: 'PROJECT' },
    { label: 'Report', value: 'REPORT' },
  ];

  useEffect(() => {
    loadAuditLogs();
  }, [lazyParams]);

  useEffect(() => {
    loadResourceLookups();
  }, []);

  const loadResourceLookups = async () => {
    try {
      const [usersResponse, projectsResponse] = await Promise.all([
        api.get('/users'),
        api.get('/projects'),
      ]);

      const users = usersResponse.data || [];
      const projects = projectsResponse.data || [];

      const usersMap = users.reduce((acc, user) => {
        if (!user?.user_id) return acc;
        const firstName = user.first_name?.trim() || '';
        const lastName = user.last_name?.trim() || '';
        const fullName = `${firstName} ${lastName}`.trim();
        acc[user.user_id] = fullName || user.username || user.email || 'User';
        return acc;
      }, {});

      const projectsMap = projects.reduce((acc, project) => {
        if (!project?.project_id) return acc;
        acc[project.project_id] =
          project.project_name || project.project_title || 'Project';
        return acc;
      }, {});

      setUserLookup(usersMap);
      setProjectLookup(projectsMap);
      sessionStorage.setItem('auditLogUserLookup', JSON.stringify(usersMap));
      sessionStorage.setItem(
        'auditLogProjectLookup',
        JSON.stringify(projectsMap),
      );
    } catch (error) {
      console.error('Load audit log resource lookup error:', error);
      toast.current?.show({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Failed to load resource names for audit logs',
        life: 3000,
      });
    }
  };

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: lazyParams.page,
        limit: lazyParams.rows,
      };

      if (lazyParams.search) {
        params.search = lazyParams.search;
      }

      const response = await auditLogService.getAll(params);
      const logs = response.data || [];
      setAuditLogs(logs);
      setFilteredLogs(logs);
      setTotalRecords(response.total || 0);
    } catch (error) {
      console.error('Load audit logs error:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to load audit logs';
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage,
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setGlobalSearch(value);
    setLazyParams({
      ...lazyParams,
      first: 0,
      page: 1,
      search: value,
    });
  };

  const onPage = (event) => {
    setLazyParams({
      ...lazyParams,
      first: event.first,
      rows: event.rows,
      page: event.page + 1,
    });
  };

  const onFilterChange = (field, value) => {
    setLazyParams({
      ...lazyParams,
      first: 0,
      page: 1,
      [field]: value,
    });
  };

  const resetFilters = () => {
    setGlobalSearch('');
    setLazyParams({
      ...lazyParams,
      first: 0,
      page: 1,
      search: '',
    });
  };

  // Template functions
  const actionBodyTemplate = (rowData) => {
    const getSeverity = (action) => {
      switch (action) {
        case 'LOGIN':
          return 'info';
        case 'CREATE':
          return 'success';
        case 'UPDATE':
          return 'warning';
        case 'DELETE':
          return 'danger';
        case 'RESTORE':
          return 'success';
        default:
          return null;
      }
    };

    return (
      <Tag value={rowData.action} severity={getSeverity(rowData.action)} />
    );
  };

  const resourceBodyTemplate = (rowData) => {
    return <Tag value={rowData.resource} severity="info" />;
  };

  const timestampBodyTemplate = (rowData) => {
    const date = new Date(rowData.timestamp);
    return date.toLocaleString();
  };

  const detailsBodyTemplate = (rowData) => {
    return getLogSummary(rowData);
  };

  const parseDetails = (details) => {
    if (!details) return null;
    if (typeof details === 'object') return details;
    try {
      return JSON.parse(details);
    } catch (error) {
      return null;
    }
  };

  const getResourceDisplay = (rowData) => {
    const details = parseDetails(rowData.details);
    const resource = rowData.resource;
    const resourceId = rowData.resourceId;

    if (resource === 'USER') {
      if (resourceId && userLookup[resourceId]) {
        return userLookup[resourceId];
      }
      return (
        details?.username ||
        details?.email ||
        details?.changes?.username ||
        details?.changes?.email ||
        rowData.resourceId ||
        'User'
      );
    }

    if (resource === 'PROJECT') {
      if (resourceId && projectLookup[resourceId]) {
        return projectLookup[resourceId];
      }
      return (
        details?.project_name ||
        details?.projectName ||
        details?.name ||
        rowData.resourceId ||
        'Project'
      );
    }

    if (resource === 'REPORT') {
      return (
        details?.report_name ||
        details?.reportName ||
        details?.title ||
        rowData.resourceId ||
        'Report'
      );
    }

    if (resource === 'AUTH') {
      return details?.username || rowData.userName || 'Auth';
    }

    return rowData.resourceId || '-';
  };

  const getLogSummary = (rowData) => {
    const details = parseDetails(rowData.details);
    const resourceLabel = rowData.resource
      ? rowData.resource.toLowerCase()
      : 'resource';
    const resourceDisplay = getResourceDisplay(rowData);
    const updatedFields = Array.isArray(details?.updatedFields)
      ? details.updatedFields
      : [];

    if (rowData.action === 'LOGIN') {
      return `Logged in as ${resourceDisplay}`;
    }

    if (rowData.action === 'UPDATE') {
      if (updatedFields.includes('profile_pic')) {
        return `Updated profile picture for ${resourceLabel}: ${resourceDisplay}`;
      }

      if (updatedFields.length > 0) {
        return `Updated ${resourceLabel} (${updatedFields.join(', ')}) for ${resourceDisplay}`;
      }

      return `Updated ${resourceLabel}: ${resourceDisplay}`;
    }

    if (rowData.action === 'CREATE') {
      return `Created ${resourceLabel}: ${resourceDisplay}`;
    }

    if (rowData.action === 'DELETE') {
      return `Deleted ${resourceLabel}: ${resourceDisplay}`;
    }

    if (rowData.action === 'RESTORE') {
      return `Restored ${resourceLabel}: ${resourceDisplay}`;
    }

    return `${rowData.action || 'Action'} ${resourceLabel}: ${resourceDisplay}`;
  };

  const userBodyTemplate = (rowData) => {
    if (rowData.userName) {
      return <strong>{rowData.userName}</strong>;
    }
    return 'System';
  };

  return (
    <div className="panel-container">
      <Toast ref={toast} />

      {/* Title Section */}
      <div className="mb-6">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '2rem',
          }}
        >
          <div>
            <h2 className="m-0">Audit Logs</h2>
            <p className="text-color-secondary m-0">
              Complete record of all system activities and changes
            </p>
          </div>
          <div className="reports-search-box">
            <i className="pi pi-search"></i>
            <InputText
              placeholder="Search audit logs..."
              value={globalSearch}
              onChange={(e) => handleSearch(e.target.value)}
              className="reports-search-input"
            />
            {globalSearch && (
              <i
                className="pi pi-times"
                style={{ color: '#9ca3af', cursor: 'pointer' }}
                onClick={resetFilters}
              ></i>
            )}
          </div>
        </div>
      </div>

      <Card className="audit-logs-card">
        <DataTable
          value={filteredLogs}
          lazy
          paginator
          rows={lazyParams.rows}
          totalRecords={totalRecords}
          first={lazyParams.first}
          onPage={onPage}
          loading={loading}
          responsiveLayout="scroll"
          stripedRows
          rowHover
          emptyMessage="No audit logs found"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} logs"
          rowsPerPageOptions={[25, 50, 100]}
        >
          <Column field="id" header="ID" style={{ width: '60px' }} sortable />
          <Column
            field="timestamp"
            header="Timestamp"
            body={timestampBodyTemplate}
            style={{ width: '180px' }}
            sortable
          />
          <Column
            field="userName"
            header="User"
            body={userBodyTemplate}
            style={{ width: '150px' }}
          />
          <Column
            field="action"
            header="Action"
            body={actionBodyTemplate}
            style={{ width: '100px' }}
          />
          <Column
            field="resource"
            header="Resource"
            body={resourceBodyTemplate}
            style={{ width: '100px' }}
          />
          <Column
            field="resourceId"
            header="Resource ID"
            body={(rowData) => getResourceDisplay(rowData)}
            style={{ width: '120px' }}
          />
          <Column
            field="details"
            header="Details"
            body={detailsBodyTemplate}
            style={{ minWidth: '250px' }}
          />
          <Column
            field="ipAddress"
            header="IP Address"
            style={{ width: '130px' }}
          />
        </DataTable>
      </Card>
    </div>
  );
};

export default AuditLogsPanel;

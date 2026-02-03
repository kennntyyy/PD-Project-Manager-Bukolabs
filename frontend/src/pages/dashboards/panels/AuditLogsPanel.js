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
import '../Dashboard.css';
import './AuditLogsPanel.css';

const AuditLogsPanel = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [lazyParams, setLazyParams] = useState({
    first: 0,
    rows: 50,
    page: 1,
    filters: {
      search: '',
    },
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

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: lazyParams.page,
        limit: lazyParams.rows,
      };

      const response = await auditLogService.getAll(params);
      setAuditLogs(response.data || []);
      setFilteredLogs(response.data || []);
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
    if (!value) {
      setFilteredLogs(auditLogs);
      return;
    }

    const searchLower = value.toLowerCase();
    const filtered = auditLogs.filter((log) => {
      return (
        log.action?.toLowerCase().includes(searchLower) ||
        log.resource?.toLowerCase().includes(searchLower) ||
        log.userName?.toLowerCase().includes(searchLower) ||
        log.resourceId?.toLowerCase().includes(searchLower) ||
        log.details?.toLowerCase().includes(searchLower)
      );
    });
    setFilteredLogs(filtered);
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
      filters: {
        ...lazyParams.filters,
        [field]: value,
      },
    });
  };

  const resetFilters = () => {
    setGlobalSearch('');
    setFilteredLogs(auditLogs);
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
    if (!rowData.details) return '-';

    try {
      const details =
        typeof rowData.details === 'string'
          ? JSON.parse(rowData.details)
          : rowData.details;

      const formatValue = (value) => {
        if (value === null || value === undefined) return 'null';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      };

      return (
        <div
          style={{
            maxWidth: '300px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {Object.entries(details).map(([key, value]) => (
            <div key={key} style={{ fontSize: '0.85rem' }}>
              <strong>{key}:</strong> {formatValue(value)}
            </div>
          ))}
        </div>
      );
    } catch (error) {
      return rowData.details;
    }
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

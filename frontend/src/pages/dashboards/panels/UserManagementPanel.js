import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { userService } from '../../../services/userService';
import { categoryService } from '../../../services/categoryService';
import { useAuth } from '../../../context/AuthContext';
import './UserManagementPanel.css';

// ============================================
// USER MANAGEMENT PANEL
// Handles: Create, Read, Update, Delete users
// ============================================

const UserManagementPanel = ({
  roleFilter = null,
  roleFilters = null,
  title = 'User Management',
  description = 'Manage system users and their access levels',
  entityLabel = 'User',
  entityPluralLabel = 'Users',
  defaultRole = 'client',
  allowRoleSelect = true,
  showRoleColumn = true,
}) => {
  // ============================================
  // STATE
  // ============================================
  const { user: currentUser, refreshUser } = useAuth();
  const normalizedRoleFilter = roleFilter ? roleFilter.toLowerCase() : null;
  const normalizedRoleFilters = Array.isArray(roleFilters)
    ? roleFilters
        .map((value) => (value ? value.toLowerCase() : null))
        .filter(Boolean)
    : null;
  const initialRole = normalizedRoleFilter || defaultRole;
  const allowedRoles = normalizedRoleFilters?.length
    ? normalizedRoleFilters
    : null;
  const initialRoleSafe = allowedRoles?.includes(initialRole)
    ? initialRole
    : allowedRoles?.[0] || initialRole;
  const [visible, setVisible] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewMode, setViewMode] = useState('active'); // 'active' or 'deleted'
  const [searchQuery, setSearchQuery] = useState(''); // Search query state
  const toast = useRef(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    user_role: initialRoleSafe,
    profile_pic: null,
  });

  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef(null);

  const roles = [
    { label: 'Admin', value: 'admin' },
    { label: 'Staff', value: 'staff' },
    { label: 'Client', value: 'client' },
    { label: 'Contractor', value: 'contractor' },
  ];

  // ============================================
  // LIFECYCLE
  // ============================================

  useEffect(() => {
    loadUsers();
  }, []);

  // ============================================
  // SEARCH FUNCTIONALITY
  // ============================================

  // Filter users based on search query
  const getFilteredUsers = () => {
    const matchesViewMode = (user) => {
      if (viewMode === 'deleted') {
        return user.is_deleted === true;
      }
      return user.is_deleted === false || user.is_deleted === undefined;
    };

    const matchesRoleFilter = (user) => {
      if (normalizedRoleFilter) {
        return user.user_role?.toLowerCase() === normalizedRoleFilter;
      }
      if (allowedRoles) {
        return allowedRoles.includes(user.user_role?.toLowerCase());
      }
      return true;
    };

    const baseFiltered = users.filter(
      (user) => matchesViewMode(user) && matchesRoleFilter(user),
    );

    if (!searchQuery.trim()) {
      return baseFiltered;
    }

    const query = searchQuery.toLowerCase();

    return baseFiltered.filter((user) => {
      if (user.username?.toLowerCase().includes(query)) {
        return true;
      }

      if (user.email?.toLowerCase().includes(query)) {
        return true;
      }

      if (user.first_name?.toLowerCase().includes(query)) {
        return true;
      }

      if (user.last_name?.toLowerCase().includes(query)) {
        return true;
      }

      const fullName = `${user.first_name || ''} ${user.last_name || ''}`
        .toLowerCase()
        .trim();
      if (fullName.includes(query)) {
        return true;
      }

      if (user.phone?.toLowerCase().includes(query)) {
        return true;
      }

      if (user.address?.toLowerCase().includes(query)) {
        return true;
      }

      if (user.user_role?.toLowerCase().includes(query)) {
        return true;
      }

      const statusText = user.is_active ? 'active' : 'inactive';
      if (statusText.includes(query)) {
        return true;
      }

      return false;
    });
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // ============================================
  // CRUD OPERATIONS
  // ============================================

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

  const openNewDialog = () => {
    setIsEditing(false);
    setSelectedUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      first_name: '',
      last_name: '',
      phone: '',
      address: '',
      user_role: initialRoleSafe,
      profile_pic: null,
    });
    setProfilePicPreview(null);
    setVisible(true);
  };

  const openEditDialog = (usr) => {
    setIsEditing(true);
    setSelectedUser(usr);
    setFormData({
      username: usr.username,
      email: usr.email,
      password: '',
      confirmPassword: '',
      first_name: usr.first_name,
      last_name: usr.last_name,
      phone: usr.phone || '',
      address: usr.address || '',
      user_role: normalizedRoleFilter || usr.user_role,
      profile_pic: usr.profile_pic || null, // Keep existing profile_pic reference
    });
    // Set profile picture preview if available
    if (usr.profile_pic) {
      setProfilePicPreview(`data:image/jpeg;base64,${usr.profile_pic}`);
    } else {
      setProfilePicPreview(null);
    }
    setVisible(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Invalid File Type',
          detail: 'Only JPEG, PNG, GIF, and WebP images are allowed.',
        });
        return;
      }

      // Validate file size (5MB max)
      const maxSizeInBytes = 5 * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        toast.current?.show({
          severity: 'warn',
          summary: 'File Too Large',
          detail: 'File size must not exceed 5MB.',
        });
        return;
      }

      // Read file and create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result);
        setFormData({ ...formData, profile_pic: file });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfilePic = () => {
    setProfilePicPreview(null);
    setFormData({ ...formData, profile_pic: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRoleChange = (e) => {
    setFormData({ ...formData, user_role: e.value });
  };

  const saveUser = async () => {
    console.log(
      '[UserManagementPanel] saveUser called, isEditing:',
      isEditing,
      'formData:',
      formData,
    );

    // Validation
    if (
      !formData.username ||
      !formData.email ||
      !formData.first_name ||
      !formData.last_name
    ) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please fill in all required fields',
      });
      return;
    }

    if (!isEditing && !formData.password) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Password is required for new users',
      });
      return;
    }

    if (!isEditing && formData.password !== formData.confirmPassword) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Passwords do not match',
      });
      return;
    }

    try {
      setLoading(true);

      const roleForSave = allowRoleSelect
        ? formData.user_role
        : normalizedRoleFilter || formData.user_role;

      let requestData;

      // Only use FormData if there's a profile picture FILE to upload
      if (formData.profile_pic && formData.profile_pic instanceof File) {
        // Create FormData for file upload
        requestData = new FormData();
        requestData.append('username', formData.username);
        requestData.append('email', formData.email);
        requestData.append('first_name', formData.first_name);
        requestData.append('last_name', formData.last_name);
        requestData.append('phone', formData.phone || '');
        requestData.append('address', formData.address || '');
        requestData.append('user_role', roleForSave);

        // Add password only for new users
        if (!isEditing) {
          requestData.append('password', formData.password);
        }

        // Add profile picture file
        requestData.append('profile_pic', formData.profile_pic);
        console.log(
          '[UserManagementPanel] Sending FormData with file:',
          formData.profile_pic.name,
          'size:',
          formData.profile_pic.size,
        );
      } else {
        // Use regular JSON for regular form submission
        requestData = {
          username: formData.username,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone || '',
          address: formData.address || '',
          user_role: roleForSave,
        };

        // Add password only for new users
        if (!isEditing) {
          requestData.password = formData.password;
        }

        // Only modify profile_pic if it was explicitly changed
        // If profile_pic is null and we're editing, it means user clicked Remove
        // If profile_pic is a string (existing base64), don't include it (no change)
        if (
          isEditing &&
          formData.profile_pic === null &&
          profilePicPreview === null
        ) {
          // User removed the profile picture
          requestData.profile_pic = '';
        }
        // If formData.profile_pic is a string (existing data), don't send it - no change
      }

      if (isEditing) {
        console.log('Updating user:', selectedUser.user_id, requestData);
        await userService.updateUser(selectedUser.user_id, requestData);

        // If the updated user is the current logged-in user, refresh their profile
        if (currentUser && selectedUser.user_id === currentUser.user_id) {
          console.log(
            '[UserManagementPanel] Refreshing current user profile...',
          );
          try {
            const updatedUser = await refreshUser();
            console.log(
              '[UserManagementPanel] User profile refreshed:',
              updatedUser,
            );
          } catch (error) {
            console.error(
              '[UserManagementPanel] Failed to refresh user:',
              error,
            );
          }
        }

        toast.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'User updated successfully',
        });
      } else {
        console.log('Creating user:', requestData);
        await userService.createUser(requestData);
        toast.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'User created successfully',
        });
      }

      setVisible(false);
      loadUsers();
    } catch (error) {
      console.error('Save user error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail:
          error.response?.data?.message ||
          error.message ||
          'Failed to save user',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = (usr) => {
    confirmDialog({
      message: `Are you sure you want to delete ${usr.username}? This can be restored from the recycle bin.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          setLoading(true);
          console.log('Soft deleting user:', usr.user_id);
          // Send soft delete request (mark as deleted)
          await userService.softDeleteUser(usr.user_id);
          toast.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'User moved to recycle bin',
          });
          loadUsers();
        } catch (error) {
          console.error('Delete user error:', error);
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail:
              error.response?.data?.message ||
              error.message ||
              'Failed to delete user',
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Restore user from recycle bin
  const restoreUser = (usr) => {
    confirmDialog({
      message: `Restore ${usr.username} to active users?`,
      header: 'Confirm Restore',
      icon: 'pi pi-refresh',
      accept: async () => {
        try {
          setLoading(true);
          console.log('Restoring user:', usr.user_id);
          await userService.restoreUser(usr.user_id);
          toast.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'User restored successfully',
          });
          loadUsers();
        } catch (error) {
          console.error('Restore user error:', error);
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail:
              error.response?.data?.message ||
              error.message ||
              'Failed to restore user',
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Permanently delete user
  const permanentlyDeleteUser = (usr) => {
    confirmDialog({
      message: `Permanently delete ${usr.username}? This cannot be undone.`,
      header: 'Confirm Permanent Delete',
      icon: 'pi pi-trash',
      accept: async () => {
        try {
          setLoading(true);
          console.log('Permanently deleting user:', usr.user_id);
          await userService.deleteUser(usr.user_id);
          toast.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'User permanently deleted',
          });
          loadUsers();
        } catch (error) {
          console.error('Permanent delete user error:', error);
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail:
              error.response?.data?.message ||
              error.message ||
              'Failed to permanently delete user',
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const getRoleSeverity = (role) => {
    switch (role) {
      case 'admin':
        return 'danger';
      case 'staff':
        return 'info';
      case 'client':
        return 'success';
      case 'contractor':
        return 'warning';
      default:
        return null;
    }
  };

  const roleTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.user_role}
        severity={getRoleSeverity(rowData.user_role)}
      />
    );
  };

  const statusTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.is_active ? 'Active' : 'Inactive'}
        severity={rowData.is_active ? 'success' : 'danger'}
      />
    );
  };

  // Get filtered users
  const filteredUsers = getFilteredUsers();
  const recycleCount = users.filter((u) => {
    const userRole = u.user_role?.toLowerCase();
    const matchesRole = normalizedRoleFilter
      ? userRole === normalizedRoleFilter
      : allowedRoles
        ? allowedRoles.includes(userRole)
        : true;
    return matchesRole && u.is_deleted;
  }).length;
  const baseRoleOptions = allowRoleSelect
    ? roles
    : roles.filter((role) => role.value === initialRoleSafe);
  const roleDropdownOptions = allowedRoles
    ? baseRoleOptions.filter((role) => allowedRoles.includes(role.value))
    : baseRoleOptions;

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="panel-container">
      <Toast ref={toast} />
      <ConfirmDialog />

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
            <h2 className="m-0">{title}</h2>
            <p className="text-color-secondary m-0">{description}</p>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'center',
            }}
          >
            <Button
              label={`Active ${entityPluralLabel}`}
              icon="pi pi-users"
              severity={viewMode === 'active' ? 'info' : 'secondary'}
              onClick={() => {
                setViewMode('active');
                setSearchQuery('');
              }}
              className={
                viewMode === 'active'
                  ? 'p-button-sm user-switch-btn active'
                  : 'p-button-sm user-switch-btn'
              }
              text={viewMode !== 'active'}
              outlined={viewMode !== 'active'}
            />
            <Button
              label={`Recycle Bin (${recycleCount})`}
              icon="pi pi-trash"
              severity={viewMode === 'deleted' ? 'info' : 'secondary'}
              onClick={() => {
                setViewMode('deleted');
                setSearchQuery('');
              }}
              className={
                viewMode === 'deleted'
                  ? 'p-button-sm user-switch-btn active'
                  : 'p-button-sm user-switch-btn'
              }
              text={viewMode !== 'deleted'}
              outlined={viewMode !== 'deleted'}
            />
          </div>
          <div className="reports-search-box">
            <i className="pi pi-search"></i>
            <InputText
              placeholder={`Search ${entityPluralLabel.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="reports-search-input"
            />
            {searchQuery && (
              <i
                className="pi pi-times"
                style={{ color: '#9ca3af', cursor: 'pointer' }}
                onClick={() => setSearchQuery('')}
              ></i>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <div
          className="card-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingLeft: '16px',
            paddingRight: '16px',
          }}
        >
          <h3 className="card-title">
            {viewMode === 'active'
              ? `Active ${entityPluralLabel}`
              : 'Recycle Bin'}
          </h3>
          {viewMode === 'active' && (
            <Button
              label={`Add New ${entityLabel}`}
              icon="pi pi-plus"
              severity="info"
              onClick={openNewDialog}
              className="add-user-btn"
            />
          )}
        </div>

        <DataTable
          value={filteredUsers}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 20, 50]}
          tableStyle={{ minWidth: '50rem' }}
          emptyMessage={
            searchQuery
              ? `No ${entityPluralLabel.toLowerCase()} match your search criteria.`
              : viewMode === 'active'
                ? `No ${entityPluralLabel.toLowerCase()} found.`
                : 'Recycle bin is empty.'
          }
          responsiveLayout="scroll"
        >
          <Column field="username" header="Username" sortable />
          <Column
            header="Profile Picture"
            body={(rowData) => (
              <div style={{ textAlign: 'center' }}>
                {rowData.profile_pic ? (
                  <img
                    src={`data:image/jpeg;base64,${rowData.profile_pic}`}
                    alt={rowData.username}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #e0e0e0',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#e0e0e0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto',
                    }}
                  >
                    <i
                      className="pi pi-user"
                      style={{ fontSize: '20px', color: '#999' }}
                    />
                  </div>
                )}
              </div>
            )}
          />
          <Column field="email" header="Email" sortable />
          <Column field="first_name" header="First Name" />
          <Column field="last_name" header="Last Name" />
          {(normalizedRoleFilter === 'client' || !normalizedRoleFilter) && (
            <Column field="address" header="Address" />
          )}
          {showRoleColumn && (
            <Column
              field="user_role"
              header="Role"
              body={(rowData) => (
                <Tag
                  value={rowData.user_role}
                  style={{
                    background:
                      rowData.user_role === 'admin'
                        ? '#4A4A3A'
                        : rowData.user_role === 'staff'
                          ? '#6A6A5A'
                          : rowData.user_role === 'client'
                            ? '#10b981'
                            : '#f59e0b',
                  }}
                />
              )}
            />
          )}
          <Column
            header="Actions"
            body={(rowData) => (
              <div style={{ display: 'flex', gap: '8px' }}>
                {viewMode === 'active' ? (
                  <>
                    <Button
                      icon="pi pi-pencil"
                      className="p-button-rounded p-button-sm p-button-warning user-action-btn"
                      onClick={() => openEditDialog(rowData)}
                    />
                    <Button
                      icon="pi pi-trash"
                      className="p-button-rounded p-button-sm p-button-danger user-action-btn"
                      onClick={() => deleteUser(rowData)}
                    />
                  </>
                ) : (
                  <>
                    <Button
                      icon="pi pi-refresh"
                      className="p-button-rounded p-button-sm p-button-success user-action-btn"
                      onClick={() => restoreUser(rowData)}
                    />
                    <Button
                      icon="pi pi-times"
                      className="p-button-rounded p-button-sm p-button-danger user-action-btn"
                      onClick={() => permanentlyDeleteUser(rowData)}
                    />
                  </>
                )}
              </div>
            )}
          />
        </DataTable>
      </div>

      {/* ============================================ */}
      {/* USER FORM DIALOG: Create/Edit User */}
      {/* ============================================ */}
      <Dialog
        visible={visible}
        style={{ width: '90vw', maxWidth: '500px' }}
        header={isEditing ? 'Edit User' : 'Add New User'}
        contentStyle={{ padding: '1.5rem 2rem' }}
        modal
        onHide={() => setVisible(false)}
        className="p-fluid"
        headerStyle={{
          background: 'linear-gradient(135deg, #4A4A3A 0%, #5A5A4A 100%)',
          color: 'white',
          padding: '1rem',
        }}
      >
        <div className="field mt-3">
          <label htmlFor="username">Username *</label>
          <InputText
            id="username"
            name="username"
            value={formData.username}
            onChange={handleFormChange}
            placeholder="Enter username"
            disabled={isEditing}
          />
        </div>

        <div className="field mt-3">
          <label htmlFor="email">Email *</label>
          <InputText
            id="email"
            name="email"
            value={formData.email}
            onChange={handleFormChange}
            placeholder="Enter email"
          />
        </div>

        <div className="field mt-3">
          <label htmlFor="first_name">First Name *</label>
          <InputText
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleFormChange}
            placeholder="Enter first name"
          />
        </div>

        <div className="field mt-3">
          <label htmlFor="last_name">Last Name *</label>
          <InputText
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleFormChange}
            placeholder="Enter last name"
          />
        </div>

        <div className="field mt-3">
          <label htmlFor="phone">Phone</label>
          <InputText
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleFormChange}
            placeholder="Enter phone number"
          />
        </div>

        {(normalizedRoleFilter === 'client' || formData.user_role === 'client') && (
          <div className="field mt-3">
            <label htmlFor="address">Address</label>
            <InputText
              id="address"
              name="address"
              value={formData.address}
              onChange={handleFormChange}
              placeholder="Enter address"
            />
          </div>
        )}

        <div className="field mt-3">
          <label htmlFor="user_role">Role *</label>
          <Dropdown
            id="user_role"
            value={formData.user_role}
            options={roleDropdownOptions}
            onChange={handleRoleChange}
            optionLabel="label"
            optionValue="value"
            placeholder="Select role"
            disabled={!allowRoleSelect}
          />
        </div>

        {/* Profile Picture Section */}
        <div className="field mt-4">
          <label>Profile Picture</label>
          <div
            style={{
              border: '2px dashed #ccc',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
              backgroundColor: '#f9f9f9',
            }}
          >
            {profilePicPreview ? (
              <div style={{ position: 'relative' }}>
                <img
                  src={profilePicPreview}
                  alt="Profile Preview"
                  style={{
                    width: '150px',
                    height: '150px',
                    borderRadius: '8px',
                    objectFit: 'cover',
                    display: 'block',
                    margin: '0 auto',
                  }}
                />
                <div
                  style={{
                    marginTop: '12px',
                    display: 'flex',
                    gap: '8px',
                    justifyContent: 'center',
                  }}
                >
                  <Button
                    label="Change"
                    icon="pi pi-pencil"
                    className="p-button-sm"
                    onClick={() => fileInputRef.current?.click()}
                  />
                  <Button
                    label="Remove"
                    icon="pi pi-trash"
                    className="p-button-sm p-button-danger p-button-outlined"
                    onClick={removeProfilePic}
                  />
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{ cursor: 'pointer' }}
              >
                <i
                  className="pi pi-image"
                  style={{
                    fontSize: '32px',
                    color: '#999',
                    marginBottom: '8px',
                  }}
                />
                <p style={{ margin: '8px 0', color: '#666' }}>
                  Click to upload or drag and drop
                </p>
                <small style={{ color: '#999' }}>
                  PNG, JPG, GIF, WebP (max 5MB)
                </small>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfilePicChange}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {!isEditing && (
          <>
            <div className="field mt-3" style={{ position: 'relative' }}>
              <label htmlFor="password">Password *</label>
              <InputText
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleFormChange}
                placeholder="Enter password"
                className="form-input"
              />
              <span
                className="custom-eye-icon pi"
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '14px',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  color: '#4A4A3A',
                  fontSize: '18px',
                }}
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? (
                  <i className="pi pi-eye-slash" />
                ) : (
                  <i className="pi pi-eye" />
                )}
              </span>
            </div>
            <div className="field mt-3" style={{ position: 'relative' }}>
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <InputText
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleFormChange}
                placeholder="Confirm password"
                className="form-input"
              />
              <span
                className="custom-eye-icon pi"
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '14px',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  color: '#4A4A3A',
                  fontSize: '18px',
                }}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? (
                  <i className="pi pi-eye-slash" />
                ) : (
                  <i className="pi pi-eye" />
                )}
              </span>
            </div>
          </>
        )}

        <div className="flex justify-content-center mt-5">
          <Button
            label="Save"
            onClick={saveUser}
            loading={loading}
            className="modal-primary-btn"
          />
        </div>
      </Dialog>
    </div>
  );
};

export default UserManagementPanel;

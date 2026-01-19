import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { Password } from "primereact/password";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Badge } from "primereact/badge";
import { SplitButton } from "primereact/splitbutton";
import { userService } from "../../services/userService";
import "./Dashboard.css";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [visible, setVisible] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeNav, setActiveNav] = useState("overview");
  const toast = useRef(null);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    user_role: "client",
  });

  const roles = [
    { label: "Admin", value: "admin" },
    { label: "Staff", value: "staff" },
    { label: "Client", value: "client" },
    { label: "Contractor", value: "contractor" },
  ];

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error("Load users error:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message ||
          error.message ||
          "Failed to load users",
      });
    } finally {
      setLoading(false);
    }
  };

  const openNewDialog = () => {
    setIsEditing(false);
    setSelectedUser(null);
    setFormData({
      username: "",
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      phone: "",
      user_role: "client",
    });
    setVisible(true);
  };

  const openEditDialog = (usr) => {
    setIsEditing(true);
    setSelectedUser(usr);
    setFormData({
      username: usr.username,
      email: usr.email,
      password: "",
      first_name: usr.first_name,
      last_name: usr.last_name,
      phone: usr.phone || "",
      user_role: usr.user_role,
    });
    setVisible(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRoleChange = (e) => {
    setFormData({ ...formData, user_role: e.value });
  };

  const saveUser = async () => {
    console.log(
      "[AdminDashboard] saveUser called, isEditing:",
      isEditing,
      "formData:",
      formData,
    );
    if (
      !formData.username ||
      !formData.email ||
      !formData.first_name ||
      !formData.last_name
    ) {
      toast.current?.show({
        severity: "warn",
        summary: "Warning",
        detail: "Please fill in all required fields",
      });
      return;
    }

    if (!isEditing && !formData.password) {
      toast.current?.show({
        severity: "warn",
        summary: "Warning",
        detail: "Password is required for new users",
      });
      return;
    }

    try {
      setLoading(true);

      if (isEditing) {
        const updateData = { ...formData };
        delete updateData.password;
        console.log("Updating user:", selectedUser.user_id, updateData);
        await userService.updateUser(selectedUser.user_id, updateData);
        toast.current?.show({
          severity: "success",
          summary: "Success",
          detail: "User updated successfully",
        });
      } else {
        console.log("Creating user:", formData);
        await userService.createUser(formData);
        toast.current?.show({
          severity: "success",
          summary: "Success",
          detail: "User created successfully",
        });
      }

      setVisible(false);
      loadUsers();
    } catch (error) {
      console.error("Save user error:", error);
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error.response?.data?.message ||
          error.message ||
          "Failed to save user",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = (usr) => {
    confirmDialog({
      message: `Are you sure you want to delete ${usr.username}?`,
      header: "Confirm",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        try {
          setLoading(true);
          console.log("Deleting user:", usr.user_id);
          await userService.deleteUser(usr.user_id);
          toast.current?.show({
            severity: "success",
            summary: "Success",
            detail: "User deleted successfully",
          });
          loadUsers();
        } catch (error) {
          console.error("Delete user error:", error);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail:
              error.response?.data?.message ||
              error.message ||
              "Failed to delete user",
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const menuItems = [
    {
      label: "Dashboard",
      icon: "pi pi-home",
      command: () => console.log("Dashboard"),
    },
    {
      label: "Projects",
      icon: "pi pi-folder",
      items: [
        { label: "All Projects", icon: "pi pi-list" },
        { label: "Create Project", icon: "pi pi-plus" },
        { label: "Project Templates", icon: "pi pi-copy" },
      ],
    },
    {
      label: "Users",
      icon: "pi pi-users",
      items: [
        { label: "User Management", icon: "pi pi-user-edit" },
        { label: "Roles & Permissions", icon: "pi pi-shield" },
        { label: "Activity Log", icon: "pi pi-history" },
      ],
    },
    {
      label: "Reports",
      icon: "pi pi-chart-bar",
      items: [
        { label: "Analytics", icon: "pi pi-chart-line" },
        { label: "Financial", icon: "pi pi-money-bill" },
        { label: "Performance", icon: "pi pi-star" },
      ],
    },
    {
      label: "Settings",
      icon: "pi pi-cog",
      items: [
        { label: "System Settings", icon: "pi pi-sliders-h" },
        { label: "Notifications", icon: "pi pi-bell" },
        { label: "Security", icon: "pi pi-lock" },
      ],
    },
  ];

  const userMenuItems = [
    {
      label: "Profile",
      icon: "pi pi-user",
      command: () => console.log("Profile"),
    },
    {
      label: "Settings",
      icon: "pi pi-cog",
      command: () => console.log("Settings"),
    },
    {
      separator: true,
    },
    {
      label: "Logout",
      icon: "pi pi-sign-out",
      command: () => logout(),
    },
  ];

  const toolbarLeft = (
    <div className="flex gap-2">
      <Button label="New User" icon="pi pi-user-plus" onClick={openNewDialog} />
      <Button
        label="Refresh"
        icon="pi pi-refresh"
        onClick={loadUsers}
        loading={loading}
      />
    </div>
  );

  const getRoleSeverity = (role) => {
    switch (role) {
      case "admin":
        return "danger";
      case "staff":
        return "info";
      case "client":
        return "success";
      case "contractor":
        return "warning";
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
        value={rowData.is_active ? "Active" : "Inactive"}
        severity={rowData.is_active ? "success" : "danger"}
      />
    );
  };

  const actionTemplate = (rowData) => {
    return (
      <div className="flex gap-1">
        <Button
          icon="pi pi-pencil"
          rounded
          text
          severity="secondary"
          onClick={() => openEditDialog(rowData)}
          tooltip="Edit"
        />
        <Button
          icon="pi pi-trash"
          rounded
          text
          severity="danger"
          onClick={() => deleteUser(rowData)}
          tooltip="Delete"
        />
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <i className="pi pi-shield"></i>
          </div>
          <div className="sidebar-title">
            <h3>Admin</h3>
            <p>Control Panel</p>
          </div>
        </div>

        <div className="sidebar-nav">
          <div
            className={`nav-item ${activeNav === "overview" ? "active" : ""}`}
            onClick={() => {
              setActiveNav("overview");
              setActiveTab("overview");
            }}
          >
            <i className="pi pi-home"></i>
            <span>Overview</span>
          </div>
          <div
            className={`nav-item ${activeNav === "users" ? "active" : ""}`}
            onClick={() => {
              setActiveNav("users");
              setActiveTab("users");
            }}
          >
            <i className="pi pi-users"></i>
            <span>User Management</span>
          </div>
          <div
            className={`nav-item ${activeNav === "reports" ? "active" : ""}`}
            onClick={() => {
              setActiveNav("reports");
              setActiveTab("reports");
            }}
          >
            <i className="pi pi-chart-bar"></i>
            <span>Reports</span>
          </div>
          <div
            className={`nav-item ${activeNav === "settings" ? "active" : ""}`}
            onClick={() => {
              setActiveNav("settings");
              setActiveTab("settings");
            }}
          >
            <i className="pi pi-cog"></i>
            <span>Settings</span>
          </div>
        </div>

        <div className="sidebar-footer">
          <Button
            className="logout-btn"
            label="Logout"
            icon="pi pi-sign-out"
            onClick={logout}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-left">
            <div>
              <h2 className="header-title">
                {activeTab === "overview" && "Overview"}
                {activeTab === "users" && "User Management"}
                {activeTab === "reports" && "Reports"}
                {activeTab === "settings" && "Settings"}
              </h2>
              <p className="header-subtitle">
                {activeTab === "overview" && "Welcome back, Admin!"}
                {activeTab === "users" && "Manage system users"}
                {activeTab === "reports" && "View analytics and reports"}
                {activeTab === "settings" && "Configure system settings"}
              </p>
            </div>
          </div>
          <div className="header-right">
            <div className="user-profile">
              <div className="user-avatar">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <h4>
                  {user?.first_name} {user?.last_name}
                </h4>
                <p>{user?.user_role?.toUpperCase()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="dashboard-body">
          {/* Overview Tab */}
          {activeTab === "overview" && (
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
                    <i className="pi pi-check-circle"></i> All systems
                    operational
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div>
              <div className="dashboard-card">
                <div className="card-header">
                  <h3 className="card-title">User List</h3>
                  <Button
                    label="Add New User"
                    icon="pi pi-plus"
                    className="btn-primary p-button-sm"
                    onClick={openNewDialog}
                  />
                </div>

                <DataTable
                  value={users}
                  loading={loading}
                  paginator
                  rows={10}
                  rowsPerPageOptions={[5, 10, 20, 50]}
                  tableStyle={{ minWidth: "50rem" }}
                  emptyMessage="No users found."
                  responsiveLayout="scroll"
                >
                  <Column field="username" header="Username" sortable />
                  <Column field="email" header="Email" sortable />
                  <Column field="first_name" header="First Name" />
                  <Column field="last_name" header="Last Name" />
                  <Column
                    field="user_role"
                    header="Role"
                    body={(rowData) => (
                      <Tag
                        value={rowData.user_role}
                        style={{
                          background:
                            rowData.user_role === "admin"
                              ? "#404a17"
                              : rowData.user_role === "staff"
                                ? "#556b2f"
                                : rowData.user_role === "client"
                                  ? "#10b981"
                                  : "#f59e0b",
                        }}
                      />
                    )}
                  />
                  <Column
                    field="is_active"
                    header="Status"
                    body={(rowData) => (
                      <Tag
                        value={rowData.is_active ? "Active" : "Inactive"}
                        severity={rowData.is_active ? "success" : "danger"}
                      />
                    )}
                  />
                  <Column
                    header="Actions"
                    body={(rowData) => (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <Button
                          icon="pi pi-pencil"
                          className="p-button-rounded p-button-sm p-button-warning"
                          onClick={() => openEditDialog(rowData)}
                        />
                        <Button
                          icon="pi pi-trash"
                          className="p-button-rounded p-button-sm p-button-danger"
                          onClick={() => deleteUser(rowData)}
                        />
                      </div>
                    )}
                  />
                </DataTable>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === "reports" && (
            <div>
              <div className="dashboard-card">
                <h3 className="card-title">Analytics & Reports</h3>
                <p style={{ color: "#6c757d", marginTop: "15px" }}>
                  Reports section coming soon...
                </p>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div>
              <div className="dashboard-card">
                <h3 className="card-title">System Settings</h3>
                <p style={{ color: "#6c757d", marginTop: "15px" }}>
                  Settings section coming soon...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Form Dialog */}
      <Dialog
        visible={visible}
        style={{ width: "90vw", maxWidth: "500px" }}
        header={isEditing ? "Edit User" : "Add New User"}
        modal
        onHide={() => setVisible(false)}
        className="p-fluid"
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

        <div className="field mt-3">
          <label htmlFor="user_role">Role *</label>
          <Dropdown
            id="user_role"
            value={formData.user_role}
            options={roles}
            onChange={handleRoleChange}
            optionLabel="label"
            optionValue="value"
            placeholder="Select role"
          />
        </div>

        {!isEditing && (
          <div className="field mt-3">
            <label htmlFor="password">Password *</label>
            <Password
              id="password"
              name="password"
              value={formData.password}
              onChange={handleFormChange}
              placeholder="Enter password"
              toggleMask
            />
          </div>
        )}

        <div className="flex justify-content-end gap-2 mt-5">
          <Button
            label="Cancel"
            severity="secondary"
            onClick={() => setVisible(false)}
          />
          <Button label="Save" onClick={saveUser} loading={loading} />
        </div>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;

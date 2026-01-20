import React, { useState, useEffect, useRef } from "react";
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
import { userService } from "../../../services/userService";

// ============================================
// USER MANAGEMENT PANEL
// Handles: Create, Read, Update, Delete users
// ============================================

const UserManagementPanel = () => {
  // ============================================
  // STATE
  // ============================================
  const [visible, setVisible] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewMode, setViewMode] = useState("active"); // 'active' or 'deleted'
  const toast = useRef(null);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
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

  // ============================================
  // LIFECYCLE
  // ============================================

  useEffect(() => {
    loadUsers();
  }, []);

  // ============================================
  // CRUD OPERATIONS
  // ============================================

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
      confirmPassword: "",
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
      confirmPassword: "",
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
      "[UserManagementPanel] saveUser called, isEditing:",
      isEditing,
      "formData:",
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

    if (!isEditing && formData.password !== formData.confirmPassword) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Passwords do not match",
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
      message: `Are you sure you want to delete ${usr.username}? This can be restored from the recycle bin.`,
      header: "Confirm",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        try {
          setLoading(true);
          console.log("Soft deleting user:", usr.user_id);
          // Send soft delete request (mark as deleted)
          await userService.softDeleteUser(usr.user_id);
          toast.current?.show({
            severity: "success",
            summary: "Success",
            detail: "User moved to recycle bin",
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

  // Restore user from recycle bin
  const restoreUser = (usr) => {
    confirmDialog({
      message: `Restore ${usr.username} to active users?`,
      header: "Confirm",
      icon: "pi pi-refresh",
      accept: async () => {
        try {
          setLoading(true);
          console.log("Restoring user:", usr.user_id);
          await userService.restoreUser(usr.user_id);
          toast.current?.show({
            severity: "success",
            summary: "Success",
            detail: "User restored successfully",
          });
          loadUsers();
        } catch (error) {
          console.error("Restore user error:", error);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail:
              error.response?.data?.message ||
              error.message ||
              "Failed to restore user",
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
      header: "Confirm Permanent Delete",
      icon: "pi pi-trash",
      accept: async () => {
        try {
          setLoading(true);
          console.log("Permanently deleting user:", usr.user_id);
          await userService.deleteUser(usr.user_id);
          toast.current?.show({
            severity: "success",
            summary: "Success",
            detail: "User permanently deleted",
          });
          loadUsers();
        } catch (error) {
          console.error("Permanent delete user error:", error);
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail:
              error.response?.data?.message ||
              error.message ||
              "Failed to permanently delete user",
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Filter users based on view mode
  const filteredUsers = users.filter((user) => {
    if (viewMode === "deleted") {
      return user.is_deleted === true;
    }
    return user.is_deleted === false || user.is_deleted === undefined;
  });

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

  // ============================================
  // RENDER
  // ============================================

  return (
    <div>
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="dashboard-card">
        <div className="card-header">
          <h3 className="card-title">
            {viewMode === "active" ? "User List" : "Recycle Bin"}
          </h3>
          <div style={{ display: "flex", gap: "8px" }}>
            <Button
              label="Active Users"
              icon="pi pi-users"
              severity={viewMode === "active" ? "info" : "secondary"}
              onClick={() => setViewMode("active")}
              className="p-button-sm"
            />
            <Button
              label="Recycle Bin"
              icon="pi pi-trash"
              severity={viewMode === "deleted" ? "warning" : "secondary"}
              onClick={() => setViewMode("deleted")}
              className="p-button-sm"
              badge={users.filter((u) => u.is_deleted).length}
            />
            {viewMode === "active" && (
              <Button
                label="Add New User"
                icon="pi pi-plus"
                className="btn-primary p-button-sm"
                onClick={openNewDialog}
              />
            )}
          </div>
        </div>

        <DataTable
          value={filteredUsers}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 20, 50]}
          tableStyle={{ minWidth: "50rem" }}
          emptyMessage={
            viewMode === "active" ? "No users found." : "Recycle bin is empty."
          }
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
                {viewMode === "active" ? (
                  <>
                    <Button
                      icon="pi pi-pencil"
                      className="p-button-rounded p-button-sm p-button-warning"
                      onClick={() => openEditDialog(rowData)}
                      tooltip="Edit"
                    />
                    <Button
                      icon="pi pi-trash"
                      className="p-button-rounded p-button-sm p-button-danger"
                      onClick={() => deleteUser(rowData)}
                      tooltip="Delete"
                    />
                  </>
                ) : (
                  <>
                    <Button
                      icon="pi pi-refresh"
                      className="p-button-rounded p-button-sm p-button-success"
                      onClick={() => restoreUser(rowData)}
                      tooltip="Restore"
                    />
                    <Button
                      icon="pi pi-times"
                      className="p-button-rounded p-button-sm p-button-danger"
                      onClick={() => permanentlyDeleteUser(rowData)}
                      tooltip="Permanently Delete"
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
          <>
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

            <div className="field mt-3">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <Password
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleFormChange}
                placeholder="Confirm password"
                toggleMask
              />
            </div>
          </>
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

export default UserManagementPanel;

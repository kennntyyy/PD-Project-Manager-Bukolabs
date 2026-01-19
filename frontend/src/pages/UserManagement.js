import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toolbar } from "primereact/toolbar";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Password } from "primereact/password";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Card } from "primereact/card";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { userService } from "../../services/userService";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
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
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Failed to load users",
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
    setDialogVisible(true);
  };

  const openEditDialog = (user) => {
    setIsEditing(true);
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: "",
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone || "",
      user_role: user.user_role,
    });
    setDialogVisible(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRoleChange = (e) => {
    setFormData({ ...formData, user_role: e.value });
  };

  const saveUser = async () => {
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

    try {
      setLoading(true);
      let response;

      if (isEditing) {
        const updateData = { ...formData };
        delete updateData.password; // Remove password field if empty on edit
        response = await userService.updateUser(selectedUser.user_id, updateData);
        toast.current?.show({
          severity: "success",
          summary: "Success",
          detail: "User updated successfully",
        });
      } else {
        response = await userService.createUser(formData);
        toast.current?.show({
          severity: "success",
          summary: "Success",
          detail: "User created successfully",
        });
      }

      setDialogVisible(false);
      loadUsers();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Failed to save user",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = (user) => {
    confirmDialog({
      message: `Are you sure you want to delete ${user.username}?`,
      header: "Confirm",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        try {
          setLoading(true);
          await userService.deleteUser(user.user_id);
          toast.current?.show({
            severity: "success",
            summary: "Success",
            detail: "User deleted successfully",
          });
          loadUsers();
        } catch (error) {
          toast.current?.show({
            severity: "error",
            summary: "Error",
            detail: error.response?.data?.message || "Failed to delete user",
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const toggleUserStatus = async (user) => {
    try {
      setLoading(true);
      await userService.toggleUserActive(user.user_id);
      toast.current?.show({
        severity: "success",
        summary: "Success",
        detail: `User ${user.is_active ? "deactivated" : "activated"} successfully`,
      });
      loadUsers();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Error",
        detail: error.response?.data?.message || "Failed to update user status",
      });
    } finally {
      setLoading(false);
    }
  };

  const roleTemplate = (rowData) => {
    const roleColors = {
      admin: "danger",
      staff: "info",
      client: "success",
      contractor: "warning",
    };
    return (
      <Tag
        value={rowData.user_role}
        severity={roleColors[rowData.user_role] || "secondary"}
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
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          rounded
          outlined
          severity="info"
          onClick={() => openEditDialog(rowData)}
          tooltip="Edit"
          tooltipPosition="top"
        />
        <Button
          icon={rowData.is_active ? "pi pi-times" : "pi pi-check"}
          rounded
          outlined
          severity={rowData.is_active ? "warning" : "success"}
          onClick={() => toggleUserStatus(rowData)}
          tooltip={rowData.is_active ? "Deactivate" : "Activate"}
          tooltipPosition="top"
        />
        <Button
          icon="pi pi-trash"
          rounded
          outlined
          severity="danger"
          onClick={() => deleteUser(rowData)}
          tooltip="Delete"
          tooltipPosition="top"
        />
      </div>
    );
  };

  const toolbarLeft = () => (
    <Button
      label="New User"
      icon="pi pi-plus"
      severity="success"
      onClick={openNewDialog}
    />
  );

  const toolbarRight = () => (
    <Button
      label="Refresh"
      icon="pi pi-refresh"
      onClick={loadUsers}
      loading={loading}
    />
  );

  return (
    <div className="surface-ground min-h-screen p-4">
      <Toast ref={toast} />
      <ConfirmDialog />

      <Card className="shadow-2">
        <Toolbar left={toolbarLeft} right={toolbarRight} className="mb-4" />

        <DataTable
          value={users}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 20, 50]}
          tableStyle={{ minWidth: "50rem" }}
          stripedRows
          scrollable
          responsiveLayout="scroll"
        >
          <Column
            field="user_id"
            header="ID"
            sortable
            style={{ width: "12%" }}
          ></Column>
          <Column
            field="username"
            header="Username"
            sortable
            style={{ width: "15%" }}
          ></Column>
          <Column
            field="email"
            header="Email"
            sortable
            style={{ width: "20%" }}
          ></Column>
          <Column
            field="first_name"
            header="First Name"
            sortable
            style={{ width: "12%" }}
          ></Column>
          <Column
            field="last_name"
            header="Last Name"
            sortable
            style={{ width: "12%" }}
          ></Column>
          <Column
            field="user_role"
            header="Role"
            body={roleTemplate}
            sortable
            style={{ width: "10%" }}
          ></Column>
          <Column
            field="is_active"
            header="Status"
            body={statusTemplate}
            sortable
            style={{ width: "10%" }}
          ></Column>
          <Column
            header="Actions"
            body={actionTemplate}
            style={{ width: "15%" }}
          ></Column>
        </DataTable>
      </Card>

      {/* User Dialog */}
      <Dialog
        header={isEditing ? "Edit User" : "Create New User"}
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        style={{ width: "500px" }}
      >
        <div className="p-fluid">
          <div className="field mt-3">
            <label htmlFor="username">Username *</label>
            <InputText
              id="username"
              name="username"
              value={formData.username}
              onChange={handleFormChange}
              disabled={isEditing}
              placeholder="Enter username"
            />
          </div>

          <div className="field mt-3">
            <label htmlFor="email">Email *</label>
            <InputText
              id="email"
              name="email"
              type="email"
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
              onClick={() => setDialogVisible(false)}
            />
            <Button label="Save" onClick={saveUser} loading={loading} />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default UserManagement;

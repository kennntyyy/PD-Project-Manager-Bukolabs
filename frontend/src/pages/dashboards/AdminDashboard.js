import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Menubar } from "primereact/menubar";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { SplitButton } from "primereact/splitbutton";
import { Avatar } from "primereact/avatar";
import { Badge } from "primereact/badge";
import { Chart } from "primereact/chart";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ProgressBar } from "primereact/progressbar";
import { Tag } from "primereact/tag";
import { Toolbar } from "primereact/toolbar";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [visible, setVisible] = useState(false);
  const [newUser, setNewUser] = useState({});
  const toast = React.useRef(null);

  // Chart Data
  const [chartData] = useState({
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Projects",
        data: [65, 59, 80, 81, 56, 55],
        fill: false,
        borderColor: "#4f46e5",
        tension: 0.4,
      },
    ],
  });

  const [chartOptions] = useState({
    maintainAspectRatio: false,
    aspectRatio: 0.6,
    plugins: {
      legend: {
        labels: {
          color: "#64748b",
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#64748b",
        },
        grid: {
          color: "#e2e8f0",
        },
      },
      y: {
        ticks: {
          color: "#64748b",
        },
        grid: {
          color: "#e2e8f0",
        },
      },
    },
  });

  // Sample Users Data
  const [users] = useState([
    {
      id: 1,
      username: "admin",
      email: "admin@example.com",
      role: "admin",
      status: "Active",
      created: "2024-01-01",
    },
    {
      id: 2,
      username: "staff1",
      email: "staff1@example.com",
      role: "staff",
      status: "Active",
      created: "2024-01-02",
    },
    {
      id: 3,
      username: "client1",
      email: "client1@example.com",
      role: "client",
      status: "Active",
      created: "2024-01-03",
    },
    {
      id: 4,
      username: "contractor1",
      email: "contractor1@example.com",
      role: "contractor",
      status: "Inactive",
      created: "2024-01-04",
    },
  ]);

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

  const startContent = (
    <div className="flex align-items-center">
      <i className="pi pi-th-large text-2xl mr-2 text-primary"></i>
      <span className="text-xl font-semibold">Admin Dashboard</span>
    </div>
  );

  const endContent = (
    <div className="flex align-items-center gap-3">
      <Badge value="3" severity="danger">
        <i className="pi pi-bell text-xl cursor-pointer"></i>
      </Badge>
      <SplitButton
        label={`${user?.first_name} ${user?.last_name}`}
        icon="pi pi-user"
        model={userMenuItems}
        className="p-button-rounded p-button-text"
      />
    </div>
  );

  const toolbarLeft = (
    <div className="flex gap-2">
      <Button
        label="New User"
        icon="pi pi-user-plus"
        onClick={() => setVisible(true)}
      />
      <Button
        label="Export"
        icon="pi pi-download"
        severity="secondary"
        outlined
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

  const getStatusSeverity = (status) => {
    return status === "Active" ? "success" : "danger";
  };

  const roleTemplate = (rowData) => {
    return (
      <Tag value={rowData.role} severity={getRoleSeverity(rowData.role)} />
    );
  };

  const statusTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.status}
        severity={getStatusSeverity(rowData.status)}
      />
    );
  };

  const actionTemplate = () => {
    return (
      <div className="flex gap-1">
        <Button icon="pi pi-pencil" rounded text severity="secondary" />
        <Button icon="pi pi-trash" rounded text severity="danger" />
      </div>
    );
  };

  return (
    <div className="surface-ground min-h-screen">
      <Toast ref={toast} />

      <Menubar
        model={menuItems}
        start={startContent}
        end={endContent}
        className="shadow-2 mb-4"
      />

      <div className="p-4">
        {/* Stats Cards */}
        <div className="grid">
          <div className="col-12 md:col-6 lg:col-3">
            <Card className="shadow-1">
              <div className="flex justify-content-between mb-3">
                <div>
                  <span className="block text-500 font-medium mb-3">
                    Total Users
                  </span>
                  <div className="text-900 font-medium text-xl">1,254</div>
                </div>
                <div
                  className="flex align-items-center justify-content-center bg-blue-100 border-round"
                  style={{ width: "2.5rem", height: "2.5rem" }}
                >
                  <i className="pi pi-users text-blue-500 text-xl"></i>
                </div>
              </div>
              <ProgressBar value={75} className="h-1" />
            </Card>
          </div>

          <div className="col-12 md:col-6 lg:col-3">
            <Card className="shadow-1">
              <div className="flex justify-content-between mb-3">
                <div>
                  <span className="block text-500 font-medium mb-3">
                    Active Projects
                  </span>
                  <div className="text-900 font-medium text-xl">42</div>
                </div>
                <div
                  className="flex align-items-center justify-content-center bg-orange-100 border-round"
                  style={{ width: "2.5rem", height: "2.5rem" }}
                >
                  <i className="pi pi-folder text-orange-500 text-xl"></i>
                </div>
              </div>
              <ProgressBar value={60} className="h-1" severity="warning" />
            </Card>
          </div>

          <div className="col-12 md:col-6 lg:col-3">
            <Card className="shadow-1">
              <div className="flex justify-content-between mb-3">
                <div>
                  <span className="block text-500 font-medium mb-3">
                    Tasks Completed
                  </span>
                  <div className="text-900 font-medium text-xl">128</div>
                </div>
                <div
                  className="flex align-items-center justify-content-center bg-cyan-100 border-round"
                  style={{ width: "2.5rem", height: "2.5rem" }}
                >
                  <i className="pi pi-check-circle text-cyan-500 text-xl"></i>
                </div>
              </div>
              <ProgressBar value={85} className="h-1" severity="success" />
            </Card>
          </div>

          <div className="col-12 md:col-6 lg:col-3">
            <Card className="shadow-1">
              <div className="flex justify-content-between mb-3">
                <div>
                  <span className="block text-500 font-medium mb-3">
                    Revenue
                  </span>
                  <div className="text-900 font-medium text-xl">$24.5K</div>
                </div>
                <div
                  className="flex align-items-center justify-content-center bg-purple-100 border-round"
                  style={{ width: "2.5rem", height: "2.5rem" }}
                >
                  <i className="pi pi-money-bill text-purple-500 text-xl"></i>
                </div>
              </div>
              <ProgressBar value={90} className="h-1" severity="help" />
            </Card>
          </div>
        </div>

        {/* Charts and Data */}
        <div className="grid mt-4">
          <div className="col-12 lg:col-8">
            <Card title="Project Statistics" className="shadow-1 h-full">
              <Chart
                type="line"
                data={chartData}
                options={chartOptions}
                style={{ height: "300px" }}
              />
            </Card>
          </div>

          <div className="col-12 lg:col-4">
            <Card title="Recent Activity" className="shadow-1 h-full">
              <div className="flex flex-column gap-3">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="flex align-items-start gap-3 p-3 border-round surface-card hover:surface-hover transition-duration-150 cursor-pointer"
                  >
                    <Avatar icon="pi pi-user" size="large" shape="circle" />
                    <div className="flex-1">
                      <div className="font-medium">New user registered</div>
                      <small className="text-500">5 minutes ago</small>
                    </div>
                    <Tag value="User" severity="info" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* User Management Table */}
        <Card className="mt-4 shadow-1">
          <Toolbar left={toolbarLeft} className="mb-4" />

          <DataTable
            value={users}
            paginator
            rows={5}
            rowsPerPageOptions={[5, 10, 25]}
            tableStyle={{ minWidth: "50rem" }}
            className="p-datatable-sm"
          >
            <Column
              field="id"
              header="ID"
              sortable
              style={{ width: "20%" }}
            ></Column>
            <Column
              field="username"
              header="Username"
              sortable
              style={{ width: "20%" }}
            ></Column>
            <Column
              field="email"
              header="Email"
              sortable
              style={{ width: "25%" }}
            ></Column>
            <Column
              field="role"
              header="Role"
              body={roleTemplate}
              sortable
              style={{ width: "15%" }}
            ></Column>
            <Column
              field="status"
              header="Status"
              body={statusTemplate}
              sortable
              style={{ width: "15%" }}
            ></Column>
            <Column
              header="Actions"
              body={actionTemplate}
              style={{ width: "15%" }}
            ></Column>
          </DataTable>
        </Card>
      </div>

      {/* Create User Dialog */}
      <Dialog
        header="Create New User"
        visible={visible}
        style={{ width: "500px" }}
        onHide={() => setVisible(false)}
      >
        <div className="p-fluid">
          <div className="field mt-3">
            <label htmlFor="username">Username</label>
            <InputText id="username" className="w-full" />
          </div>
          <div className="field mt-3">
            <label htmlFor="email">Email</label>
            <InputText id="email" type="email" className="w-full" />
          </div>
          <div className="field mt-3">
            <label htmlFor="role">Role</label>
            <InputText id="role" className="w-full" />
          </div>
          <div className="flex justify-content-end gap-2 mt-5">
            <Button
              label="Cancel"
              severity="secondary"
              onClick={() => setVisible(false)}
            />
            <Button
              label="Create"
              onClick={() => {
                toast.current.show({
                  severity: "success",
                  summary: "Success",
                  detail: "User created successfully",
                });
                setVisible(false);
              }}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;

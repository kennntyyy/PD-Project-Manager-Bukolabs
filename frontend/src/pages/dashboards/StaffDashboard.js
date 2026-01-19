import React from "react";
import { useAuth } from "../../context/AuthContext";
import { Menubar } from "primereact/menubar";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { SplitButton } from "primereact/splitbutton";
import { Badge } from "primereact/badge";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";

const StaffDashboard = () => {
  const { user, logout } = useAuth();

  const menuItems = [
    { label: "Dashboard", icon: "pi pi-home" },
    { label: "My Tasks", icon: "pi pi-check-square" },
    { label: "Projects", icon: "pi pi-folder" },
    { label: "Time Tracking", icon: "pi pi-clock" },
    { label: "Reports", icon: "pi pi-chart-bar" },
  ];

  const userMenuItems = [
    { label: "Profile", icon: "pi pi-user" },
    { label: "Settings", icon: "pi pi-cog" },
    { separator: true },
    { label: "Logout", icon: "pi pi-sign-out", command: () => logout() },
  ];

  const tasks = [
    {
      id: 1,
      name: "Design Homepage",
      project: "Website Redesign",
      priority: "High",
      due: "Today",
      status: "In Progress",
    },
    {
      id: 2,
      name: "API Integration",
      project: "Mobile App",
      priority: "Medium",
      due: "Tomorrow",
      status: "Pending",
    },
    {
      id: 3,
      name: "Database Optimization",
      project: "Backend System",
      priority: "Low",
      due: "Next Week",
      status: "Completed",
    },
  ];

  const startContent = (
    <div className="flex align-items-center">
      <i className="pi pi-briefcase text-2xl mr-2 text-primary"></i>
      <span className="text-xl font-semibold">Staff Dashboard</span>
    </div>
  );

  const endContent = (
    <div className="flex align-items-center gap-3">
      <Badge value="5">
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

  const priorityTemplate = (rowData) => {
    const severity = {
      High: "danger",
      Medium: "warning",
      Low: "success",
    }[rowData.priority];

    return <Tag value={rowData.priority} severity={severity} />;
  };

  const statusTemplate = (rowData) => {
    const severity = {
      "In Progress": "info",
      Pending: "warning",
      Completed: "success",
    }[rowData.status];

    return <Tag value={rowData.status} severity={severity} />;
  };

  return (
    <div className="surface-ground min-h-screen">
      <Menubar
        model={menuItems}
        start={startContent}
        end={endContent}
        className="shadow-2 mb-4"
      />

      <div className="p-4">
        <div className="grid">
          <div className="col-12 md:col-4">
            <Card title="Assigned Tasks" className="shadow-1">
              <div className="text-4xl font-bold text-primary">12</div>
              <small className="text-500">Active tasks assigned to you</small>
            </Card>
          </div>

          <div className="col-12 md:col-4">
            <Card title="Projects" className="shadow-1">
              <div className="text-4xl font-bold text-primary">5</div>
              <small className="text-500">Projects you're involved in</small>
            </Card>
          </div>

          <div className="col-12 md:col-4">
            <Card title="Hours This Week" className="shadow-1">
              <div className="text-4xl font-bold text-primary">42</div>
              <small className="text-500">Hours logged this week</small>
            </Card>
          </div>
        </div>

        <Card title="My Tasks" className="mt-4 shadow-1">
          <DataTable value={tasks} size="small">
            <Column field="name" header="Task Name"></Column>
            <Column field="project" header="Project"></Column>
            <Column
              field="priority"
              header="Priority"
              body={priorityTemplate}
            ></Column>
            <Column field="due" header="Due Date"></Column>
            <Column
              field="status"
              header="Status"
              body={statusTemplate}
            ></Column>
            <Column body={() => <Button icon="pi pi-eye" text />}></Column>
          </DataTable>
        </Card>
      </div>
    </div>
  );
};

export default StaffDashboard;

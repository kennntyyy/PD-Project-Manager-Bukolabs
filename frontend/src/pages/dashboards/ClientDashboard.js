import React, { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { Menubar } from "primereact/menubar";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { SplitButton } from "primereact/splitbutton";
import { Badge } from "primereact/badge";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Toolbar } from "primereact/toolbar";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";
import { Avatar } from "primereact/avatar";
import { Timeline } from "primereact/timeline";
import { FileUpload } from "primereact/fileupload";

const ClientDashboard = () => {
  const { user, logout } = useAuth();
  const [visible, setVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const toast = useRef(null);
  const fileUploadRef = useRef(null);

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
        { label: "Project Requests", icon: "pi pi-plus" },
        { label: "Project Archive", icon: "pi pi-history" },
      ],
    },
    {
      label: "Invoices",
      icon: "pi pi-dollar",
      items: [
        { label: "View Invoices", icon: "pi pi-file" },
        { label: "Payment History", icon: "pi pi-history" },
        { label: "Payment Methods", icon: "pi pi-credit-card" },
      ],
    },
    {
      label: "Communications",
      icon: "pi pi-comments",
      items: [
        { label: "Messages", icon: "pi pi-inbox" },
        { label: "Meetings", icon: "pi pi-calendar" },
        { label: "Announcements", icon: "pi pi-bullhorn" },
      ],
    },
    {
      label: "Support",
      icon: "pi pi-question-circle",
      items: [
        { label: "Help Center", icon: "pi pi-info-circle" },
        { label: "Submit Ticket", icon: "pi pi-ticket" },
        { label: "Contact Support", icon: "pi pi-phone" },
      ],
    },
  ];

  const userMenuItems = [
    {
      label: "My Profile",
      icon: "pi pi-user",
      command: () =>
        toast.current.show({
          severity: "info",
          summary: "Profile",
          detail: "Opening profile...",
        }),
    },
    {
      label: "Account Settings",
      icon: "pi pi-cog",
      command: () =>
        toast.current.show({
          severity: "info",
          summary: "Settings",
          detail: "Opening settings...",
        }),
    },
    {
      label: "Billing",
      icon: "pi pi-credit-card",
      command: () =>
        toast.current.show({
          severity: "info",
          summary: "Billing",
          detail: "Opening billing...",
        }),
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

  const [projects] = useState([
    {
      id: 1,
      name: "E-commerce Website",
      status: "In Progress",
      budget: "$15,000",
      spent: "$9,500",
      due: "2024-03-15",
      progress: 63,
      team: 5,
    },
    {
      id: 2,
      name: "Mobile Banking App",
      status: "Planning",
      budget: "$25,000",
      spent: "$2,000",
      due: "2024-04-30",
      progress: 8,
      team: 8,
    },
    {
      id: 3,
      name: "Marketing Campaign",
      status: "Completed",
      budget: "$10,000",
      spent: "$10,000",
      due: "2024-01-20",
      progress: 100,
      team: 3,
    },
    {
      id: 4,
      name: "CRM System",
      status: "Delayed",
      budget: "$30,000",
      spent: "$18,000",
      due: "2024-02-28",
      progress: 60,
      team: 6,
    },
    {
      id: 5,
      name: "Data Analytics",
      status: "On Hold",
      budget: "$18,000",
      spent: "$5,400",
      due: "2024-05-15",
      progress: 30,
      team: 4,
    },
  ]);

  const [invoices] = useState([
    {
      id: "INV-001",
      project: "E-commerce Website",
      amount: "$5,000",
      status: "Paid",
      due: "2024-01-15",
    },
    {
      id: "INV-002",
      project: "Mobile Banking App",
      amount: "$8,000",
      status: "Pending",
      due: "2024-02-28",
    },
    {
      id: "INV-003",
      project: "CRM System",
      amount: "$12,000",
      status: "Overdue",
      due: "2024-01-10",
    },
    {
      id: "INV-004",
      project: "Marketing Campaign",
      amount: "$3,500",
      status: "Paid",
      due: "2023-12-20",
    },
  ]);

  const timelineEvents = [
    {
      status: "Project Started",
      date: "15 minutes ago",
      icon: "pi pi-play",
      color: "#9C27B0",
    },
    {
      status: "Design Phase Completed",
      date: "2 hours ago",
      icon: "pi pi-palette",
      color: "#673AB7",
    },
    {
      status: "Development Started",
      date: "1 day ago",
      icon: "pi pi-code",
      color: "#FF9800",
    },
    {
      status: "Client Review",
      date: "2 days ago",
      icon: "pi pi-eye",
      color: "#607D8B",
    },
  ];

  const startContent = (
    <div className="flex align-items-center">
      <i className="pi pi-user text-2xl mr-2 text-primary"></i>
      <span className="text-xl font-semibold">Client Dashboard</span>
    </div>
  );

  const endContent = (
    <div className="flex align-items-center gap-3">
      <Badge value="3" severity="danger">
        <i className="pi pi-bell text-xl cursor-pointer p-overlay-badge"></i>
      </Badge>
      <Badge value="2" severity="warning">
        <i className="pi pi-inbox text-xl cursor-pointer p-overlay-badge"></i>
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
        label="New Project Request"
        icon="pi pi-plus"
        onClick={() => setVisible(true)}
      />
      <Button
        label="Download Reports"
        icon="pi pi-download"
        severity="secondary"
        outlined
      />
    </div>
  );

  const statusTemplate = (rowData) => {
    const severity = {
      "In Progress": "info",
      Planning: "warning",
      Completed: "success",
      Delayed: "danger",
      "On Hold": "secondary",
    }[rowData.status];

    return <Tag value={rowData.status} severity={severity} />;
  };

  const invoiceStatusTemplate = (rowData) => {
    const severity = {
      Paid: "success",
      Pending: "warning",
      Overdue: "danger",
    }[rowData.status];

    return <Tag value={rowData.status} severity={severity} />;
  };

  const progressTemplate = (rowData) => {
    return (
      <div className="flex align-items-center gap-2">
        <ProgressBar
          value={rowData.progress}
          showValue={false}
          style={{ height: "6px", flex: 1 }}
        />
        <span className="text-sm font-semibold">{rowData.progress}%</span>
      </div>
    );
  };

  const budgetTemplate = (rowData) => {
    return (
      <div>
        <div className="font-medium">{rowData.budget}</div>
        <small className="text-500">Spent: {rowData.spent}</small>
      </div>
    );
  };

  const teamTemplate = (rowData) => {
    return (
      <div className="flex">
        {[...Array(Math.min(rowData.team, 5))].map((_, i) => (
          <Avatar
            key={i}
            label={String.fromCharCode(65 + i)}
            size="small"
            shape="circle"
            className={`-ml-2 border-2 border-white ${i === 0 ? "ml-0" : ""}`}
            style={{ zIndex: 5 - i }}
          />
        ))}
        {rowData.team > 5 && (
          <Avatar
            label={`+${rowData.team - 5}`}
            size="small"
            shape="circle"
            className="-ml-2 border-2 border-white"
            style={{ zIndex: 0, backgroundColor: "var(--surface-400)" }}
          />
        )}
      </div>
    );
  };

  const actionTemplate = (rowData) => {
    return (
      <div className="flex gap-1">
        <Button
          icon="pi pi-eye"
          rounded
          text
          severity="secondary"
          tooltip="View Details"
          tooltipOptions={{ position: "top" }}
          onClick={() => {
            setSelectedProject(rowData);
            toast.current.show({
              severity: "info",
              summary: "Project Selected",
              detail: `Viewing ${rowData.name}`,
            });
          }}
        />
        <Button
          icon="pi pi-comment"
          rounded
          text
          severity="info"
          tooltip="Send Message"
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-download"
          rounded
          text
          severity="help"
          tooltip="Download Files"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  const customTimelineMarker = (item) => {
    return (
      <span
        className="flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-2"
        style={{ backgroundColor: item.color }}
      >
        <i className={item.icon}></i>
      </span>
    );
  };

  const customTimelineContent = (item) => {
    return (
      <Card title={item.status} subTitle={item.date} className="shadow-1">
        <p className="m-0">
          Project milestone has been reached. Next steps are being planned.
        </p>
      </Card>
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
        {/* Welcome Card */}
        <Card className="mb-4 shadow-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
          <div className="flex flex-column lg:flex-row align-items-center justify-content-between">
            <div>
              <h2 className="text-white m-0">
                Welcome back, {user?.first_name}!
              </h2>
              <p className="text-white-alpha-90 m-0 mt-2">
                You have 3 active projects and 2 pending invoices
              </p>
            </div>
            <Button
              label="Quick Stats"
              icon="pi pi-chart-bar"
              className="p-button-outlined p-button-rounded mt-3 lg:mt-0 border-white text-white"
            />
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid">
          <div className="col-12 md:col-6 lg:col-3">
            <Card className="shadow-1">
              <div className="flex justify-content-between mb-3">
                <div>
                  <span className="block text-500 font-medium mb-3">
                    Active Projects
                  </span>
                  <div className="text-900 font-medium text-xl">5</div>
                </div>
                <div
                  className="flex align-items-center justify-content-center bg-blue-100 border-round"
                  style={{ width: "2.5rem", height: "2.5rem" }}
                >
                  <i className="pi pi-folder text-blue-500 text-xl"></i>
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
                    Total Investment
                  </span>
                  <div className="text-900 font-medium text-xl">$98,000</div>
                </div>
                <div
                  className="flex align-items-center justify-content-center bg-green-100 border-round"
                  style={{ width: "2.5rem", height: "2.5rem" }}
                >
                  <i className="pi pi-dollar text-green-500 text-xl"></i>
                </div>
              </div>
              <ProgressBar value={65} className="h-1" severity="success" />
            </Card>
          </div>

          <div className="col-12 md:col-6 lg:col-3">
            <Card className="shadow-1">
              <div className="flex justify-content-between mb-3">
                <div>
                  <span className="block text-500 font-medium mb-3">
                    Pending Invoices
                  </span>
                  <div className="text-900 font-medium text-xl">$20,500</div>
                </div>
                <div
                  className="flex align-items-center justify-content-center bg-orange-100 border-round"
                  style={{ width: "2.5rem", height: "2.5rem" }}
                >
                  <i className="pi pi-file text-orange-500 text-xl"></i>
                </div>
              </div>
              <ProgressBar value={30} className="h-1" severity="warning" />
            </Card>
          </div>

          <div className="col-12 md:col-6 lg:col-3">
            <Card className="shadow-1">
              <div className="flex justify-content-between mb-3">
                <div>
                  <span className="block text-500 font-medium mb-3">
                    Satisfaction
                  </span>
                  <div className="text-900 font-medium text-xl">92%</div>
                </div>
                <div
                  className="flex align-items-center justify-content-center bg-purple-100 border-round"
                  style={{ width: "2.5rem", height: "2.5rem" }}
                >
                  <i className="pi pi-star text-purple-500 text-xl"></i>
                </div>
              </div>
              <ProgressBar value={92} className="h-1" severity="help" />
            </Card>
          </div>
        </div>

        {/* Projects and Timeline */}
        <div className="grid mt-4">
          <div className="col-12 lg:col-8">
            <Card
              title="My Projects"
              className="shadow-1 h-full"
              header={
                <Toolbar left={toolbarLeft} className="p-0 border-none" />
              }
            >
              <DataTable
                value={projects}
                paginator
                rows={5}
                rowsPerPageOptions={[5, 10, 25]}
                tableStyle={{ minWidth: "50rem" }}
                className="p-datatable-sm"
              >
                <Column field="name" header="Project Name" sortable></Column>
                <Column
                  field="status"
                  header="Status"
                  body={statusTemplate}
                  sortable
                ></Column>
                <Column
                  field="budget"
                  header="Budget"
                  body={budgetTemplate}
                  sortable
                ></Column>
                <Column
                  field="progress"
                  header="Progress"
                  body={progressTemplate}
                  sortable
                ></Column>
                <Column field="team" header="Team" body={teamTemplate}></Column>
                <Column field="due" header="Due Date" sortable></Column>
                <Column header="Actions" body={actionTemplate}></Column>
              </DataTable>
            </Card>
          </div>

          <div className="col-12 lg:col-4">
            <Card title="Project Timeline" className="shadow-1 h-full">
              <Timeline
                value={timelineEvents}
                align="alternate"
                marker={customTimelineMarker}
                content={customTimelineContent}
                className="mt-3"
              />
            </Card>
          </div>
        </div>

        {/* Invoices and File Upload */}
        <div className="grid mt-4">
          <div className="col-12 lg:col-8">
            <Card title="Recent Invoices" className="shadow-1">
              <DataTable value={invoices} size="small">
                <Column field="id" header="Invoice ID"></Column>
                <Column field="project" header="Project"></Column>
                <Column field="amount" header="Amount"></Column>
                <Column
                  field="status"
                  header="Status"
                  body={invoiceStatusTemplate}
                ></Column>
                <Column field="due" header="Due Date"></Column>
                <Column
                  body={() => (
                    <Button
                      icon="pi pi-download"
                      text
                      severity="secondary"
                      size="small"
                    />
                  )}
                ></Column>
              </DataTable>
            </Card>
          </div>

          <div className="col-12 lg:col-4">
            <Card title="Upload Documents" className="shadow-1">
              <FileUpload
                ref={fileUploadRef}
                name="demo[]"
                url="/api/upload"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg"
                maxFileSize={1000000}
                emptyTemplate={
                  <div className="text-center p-4">
                    <i className="pi pi-cloud-upload text-4xl text-500 mb-3"></i>
                    <p className="text-500">
                      Drag and drop files here or click to browse
                    </p>
                    <small className="text-400">Max file size: 1MB</small>
                  </div>
                }
                chooseLabel="Browse"
                uploadLabel="Upload"
                cancelLabel="Cancel"
                className="border-round"
              />
            </Card>
          </div>
        </div>
      </div>

      {/* New Project Request Dialog */}
      <Dialog
        header="New Project Request"
        visible={visible}
        style={{ width: "500px" }}
        onHide={() => setVisible(false)}
      >
        <div className="p-fluid">
          <div className="field mt-3">
            <label htmlFor="projectName">Project Name *</label>
            <InputText id="projectName" className="w-full" />
          </div>
          <div className="field mt-3">
            <label htmlFor="description">Description</label>
            <InputText id="description" className="w-full" />
          </div>
          <div className="field mt-3">
            <label htmlFor="budget">Estimated Budget *</label>
            <InputText id="budget" prefix="$" className="w-full" />
          </div>
          <div className="field mt-3">
            <label htmlFor="timeline">Timeline (weeks) *</label>
            <InputText id="timeline" className="w-full" />
          </div>
          <div className="flex justify-content-end gap-2 mt-5">
            <Button
              label="Cancel"
              severity="secondary"
              onClick={() => setVisible(false)}
            />
            <Button
              label="Submit Request"
              onClick={() => {
                toast.current.show({
                  severity: "success",
                  summary: "Success",
                  detail: "Project request submitted successfully",
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

export default ClientDashboard;

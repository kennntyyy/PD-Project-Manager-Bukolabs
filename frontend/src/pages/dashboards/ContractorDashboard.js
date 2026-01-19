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
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";

const ContractorDashboard = () => {
  const { user, logout } = useAuth();
  const [visible, setVisible] = useState(false);
  const [date, setDate] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);
  const [deliverableStatus, setDeliverableStatus] = useState(null);
  const toast = useRef(null);

  const menuItems = [
    {
      label: "Dashboard",
      icon: "pi pi-home",
      command: () => console.log("Dashboard"),
    },
    {
      label: "Contracts",
      icon: "pi pi-file",
      items: [
        { label: "Active Contracts", icon: "pi pi-play" },
        { label: "Contract History", icon: "pi pi-history" },
        { label: "New Proposals", icon: "pi pi-plus" },
      ],
    },
    {
      label: "Deliverables",
      icon: "pi pi-check-square",
      items: [
        { label: "Pending Deliverables", icon: "pi pi-clock" },
        { label: "Submitted Work", icon: "pi pi-upload" },
        { label: "Approved Work", icon: "pi pi-check" },
      ],
    },
    {
      label: "Payments",
      icon: "pi pi-money-bill",
      items: [
        { label: "Payment Schedule", icon: "pi pi-calendar" },
        { label: "Payment History", icon: "pi pi-history" },
        { label: "Invoice Generation", icon: "pi pi-file-export" },
      ],
    },
    {
      label: "Timesheets",
      icon: "pi pi-clock",
      items: [
        { label: "Log Hours", icon: "pi pi-plus-circle" },
        { label: "Weekly Summary", icon: "pi pi-chart-bar" },
        { label: "Timesheet History", icon: "pi pi-history" },
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
      label: "Portfolio",
      icon: "pi pi-images",
      command: () =>
        toast.current.show({
          severity: "info",
          summary: "Portfolio",
          detail: "Opening portfolio...",
        }),
    },
    {
      label: "Rate Calculator",
      icon: "pi pi-calculator",
      command: () =>
        toast.current.show({
          severity: "info",
          summary: "Calculator",
          detail: "Opening calculator...",
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

  const [contracts] = useState([
    {
      id: 1,
      client: "ABC Corp",
      project: "Website Development",
      value: "$12,000",
      received: "$6,000",
      status: "Active",
      start: "2024-01-15",
      end: "2024-06-30",
    },
    {
      id: 2,
      client: "XYZ Ltd",
      project: "Mobile App",
      value: "$18,000",
      received: "$4,500",
      status: "Pending",
      start: "2024-03-01",
      end: "2024-08-15",
    },
    {
      id: 3,
      client: "123 Inc",
      project: "API Integration",
      value: "$8,500",
      received: "$8,500",
      status: "Completed",
      start: "2023-11-01",
      end: "2024-01-10",
    },
    {
      id: 4,
      client: "Tech Solutions",
      project: "Cloud Migration",
      value: "$22,000",
      received: "$11,000",
      status: "Active",
      start: "2024-02-01",
      end: "2024-07-31",
    },
  ]);

  const [deliverables] = useState([
    {
      id: 1,
      contract: "Website Development",
      task: "Homepage Design",
      due: "2024-02-15",
      status: "Submitted",
      clientFeedback: "Pending Review",
    },
    {
      id: 2,
      contract: "Mobile App",
      task: "User Authentication",
      due: "2024-03-10",
      status: "In Progress",
      clientFeedback: "N/A",
    },
    {
      id: 3,
      contract: "API Integration",
      task: "Payment Gateway",
      due: "2024-01-05",
      status: "Approved",
      clientFeedback: "Excellent work!",
    },
    {
      id: 4,
      contract: "Cloud Migration",
      task: "Database Setup",
      due: "2024-02-28",
      status: "Delayed",
      clientFeedback: "Requested changes",
    },
  ]);

  const [timesheets] = useState([
    {
      id: 1,
      project: "Website Development",
      date: "2024-01-20",
      hours: 8,
      task: "Frontend Development",
      status: "Submitted",
    },
    {
      id: 2,
      project: "Mobile App",
      date: "2024-01-20",
      hours: 6,
      task: "Backend API",
      status: "Approved",
    },
    {
      id: 3,
      project: "Cloud Migration",
      date: "2024-01-19",
      hours: 7.5,
      task: "Database Design",
      status: "Pending",
    },
    {
      id: 4,
      project: "Website Development",
      date: "2024-01-18",
      hours: 8,
      task: "UI/UX Design",
      status: "Approved",
    },
  ]);

  const statusOptions = [
    { label: "Not Started", value: "not_started" },
    { label: "In Progress", value: "in_progress" },
    { label: "Submitted", value: "submitted" },
    { label: "Revision", value: "revision" },
    { label: "Approved", value: "approved" },
  ];

  const startContent = (
    <div className="flex align-items-center">
      <i className="pi pi-briefcase text-2xl mr-2 text-primary"></i>
      <span className="text-xl font-semibold">Contractor Dashboard</span>
    </div>
  );

  const endContent = (
    <div className="flex align-items-center gap-3">
      <Badge value="2" severity="danger">
        <i className="pi pi-bell text-xl cursor-pointer p-overlay-badge"></i>
      </Badge>
      <Badge value="4" severity="warning">
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
        label="Log Hours"
        icon="pi pi-clock"
        onClick={() => setVisible(true)}
      />
      <Button
        label="Submit Deliverable"
        icon="pi pi-upload"
        severity="secondary"
        outlined
      />
    </div>
  );

  const contractStatusTemplate = (rowData) => {
    const severity = {
      Active: "success",
      Pending: "warning",
      Completed: "info",
      Cancelled: "danger",
    }[rowData.status];

    return <Tag value={rowData.status} severity={severity} />;
  };

  const deliverableStatusTemplate = (rowData) => {
    const severity = {
      Submitted: "info",
      "In Progress": "warning",
      Approved: "success",
      Delayed: "danger",
    }[rowData.status];

    return <Tag value={rowData.status} severity={severity} />;
  };

  const timesheetStatusTemplate = (rowData) => {
    const severity = {
      Submitted: "info",
      Approved: "success",
      Pending: "warning",
      Rejected: "danger",
    }[rowData.status];

    return <Tag value={rowData.status} severity={severity} />;
  };

  const paymentTemplate = (rowData) => {
    const percentage =
      (parseInt(rowData.received.replace("$", "").replace(",", "")) /
        parseInt(rowData.value.replace("$", "").replace(",", ""))) *
      100;

    return (
      <div>
        <div className="font-medium">{rowData.value}</div>
        <div className="flex align-items-center gap-2 mt-1">
          <ProgressBar
            value={percentage}
            showValue={false}
            style={{ height: "6px", flex: 1 }}
          />
          <small className="text-500">{rowData.received} received</small>
        </div>
      </div>
    );
  };

  const clientFeedbackTemplate = (rowData) => {
    const severity = {
      "Pending Review": "warning",
      "Excellent work!": "success",
      "Requested changes": "danger",
      "N/A": "secondary",
    }[rowData.clientFeedback];

    return <Tag value={rowData.clientFeedback} severity={severity} />;
  };

  const hoursTemplate = (rowData) => {
    return (
      <div className="flex align-items-center gap-2">
        <span className="font-semibold">{rowData.hours}</span>
        <small className="text-500">hours</small>
      </div>
    );
  };

  const actionTemplate = (rowData, type) => {
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
            if (type === "contract") setSelectedContract(rowData);
            toast.current.show({
              severity: "info",
              summary: `${type === "contract" ? "Contract" : "Deliverable"} Selected`,
              detail: `Viewing ${rowData.project || rowData.contract}`,
            });
          }}
        />
        <Button
          icon="pi pi-comment"
          rounded
          text
          severity="info"
          tooltip="Message Client"
          tooltipOptions={{ position: "top" }}
        />
        {type === "deliverable" && rowData.status !== "Approved" && (
          <Button
            icon="pi pi-upload"
            rounded
            text
            severity="success"
            tooltip="Submit Update"
            tooltipOptions={{ position: "top" }}
          />
        )}
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
        {/* Welcome Card */}
        <Card className="mb-4 shadow-1 bg-gradient-to-r from-green-500 to-teal-500 text-white">
          <div className="flex flex-column lg:flex-row align-items-center justify-content-between">
            <div>
              <h2 className="text-white m-0">Welcome, {user?.first_name}!</h2>
              <p className="text-white-alpha-90 m-0 mt-2">
                You have {contracts.filter((c) => c.status === "Active").length}{" "}
                active contracts and $
                {contracts
                  .reduce(
                    (sum, c) =>
                      sum + parseInt(c.value.replace("$", "").replace(",", "")),
                    0,
                  )
                  .toLocaleString()}{" "}
                in total contract value
              </p>
            </div>
            <Button
              label="Earnings Overview"
              icon="pi pi-chart-line"
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
                    Active Contracts
                  </span>
                  <div className="text-900 font-medium text-xl">
                    {contracts.filter((c) => c.status === "Active").length}
                  </div>
                </div>
                <div
                  className="flex align-items-center justify-content-center bg-blue-100 border-round"
                  style={{ width: "2.5rem", height: "2.5rem" }}
                >
                  <i className="pi pi-file text-blue-500 text-xl"></i>
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
                    Monthly Earnings
                  </span>
                  <div className="text-900 font-medium text-xl">$8,500</div>
                </div>
                <div
                  className="flex align-items-center justify-content-center bg-green-100 border-round"
                  style={{ width: "2.5rem", height: "2.5rem" }}
                >
                  <i className="pi pi-money-bill text-green-500 text-xl"></i>
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
                    Pending Deliverables
                  </span>
                  <div className="text-900 font-medium text-xl">
                    {
                      deliverables.filter(
                        (d) =>
                          d.status === "In Progress" || d.status === "Delayed",
                      ).length
                    }
                  </div>
                </div>
                <div
                  className="flex align-items-center justify-content-center bg-orange-100 border-round"
                  style={{ width: "2.5rem", height: "2.5rem" }}
                >
                  <i className="pi pi-clock text-orange-500 text-xl"></i>
                </div>
              </div>
              <ProgressBar value={40} className="h-1" severity="warning" />
            </Card>
          </div>

          <div className="col-12 md:col-6 lg:col-3">
            <Card className="shadow-1">
              <div className="flex justify-content-between mb-3">
                <div>
                  <span className="block text-500 font-medium mb-3">
                    Client Rating
                  </span>
                  <div className="text-900 font-medium text-xl">4.8/5</div>
                </div>
                <div
                  className="flex align-items-center justify-content-center bg-purple-100 border-round"
                  style={{ width: "2.5rem", height: "2.5rem" }}
                >
                  <i className="pi pi-star text-purple-500 text-xl"></i>
                </div>
              </div>
              <ProgressBar value={96} className="h-1" severity="help" />
            </Card>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mt-4">
          <Card className="shadow-1">
            <Toolbar left={toolbarLeft} />
          </Card>
        </div>

        {/* Contracts and Deliverables */}
        <div className="grid mt-4">
          <div className="col-12 lg:col-7">
            <Card title="My Contracts" className="shadow-1 h-full">
              <DataTable
                value={contracts}
                paginator
                rows={5}
                rowsPerPageOptions={[5, 10, 25]}
                tableStyle={{ minWidth: "50rem" }}
                className="p-datatable-sm"
              >
                <Column field="client" header="Client" sortable></Column>
                <Column field="project" header="Project" sortable></Column>
                <Column
                  field="value"
                  header="Payment"
                  body={paymentTemplate}
                  sortable
                ></Column>
                <Column
                  field="status"
                  header="Status"
                  body={contractStatusTemplate}
                  sortable
                ></Column>
                <Column field="start" header="Start Date" sortable></Column>
                <Column field="end" header="End Date" sortable></Column>
                <Column
                  header="Actions"
                  body={(rowData) => actionTemplate(rowData, "contract")}
                ></Column>
              </DataTable>
            </Card>
          </div>

          <div className="col-12 lg:col-5">
            <Card title="Upcoming Deliverables" className="shadow-1 h-full">
              <DataTable
                value={deliverables}
                size="small"
                paginator
                rows={4}
                rowsPerPageOptions={[4, 10]}
              >
                <Column field="contract" header="Contract"></Column>
                <Column field="task" header="Task"></Column>
                <Column field="due" header="Due Date"></Column>
                <Column
                  field="status"
                  header="Status"
                  body={deliverableStatusTemplate}
                ></Column>
                <Column
                  field="clientFeedback"
                  header="Feedback"
                  body={clientFeedbackTemplate}
                ></Column>
                <Column
                  header="Actions"
                  body={(rowData) => actionTemplate(rowData, "deliverable")}
                ></Column>
              </DataTable>
            </Card>
          </div>
        </div>

        {/* Timesheets and Recent Activity */}
        <div className="grid mt-4">
          <div className="col-12 lg:col-8">
            <Card title="Recent Timesheets" className="shadow-1">
              <DataTable
                value={timesheets}
                size="small"
                paginator
                rows={5}
                rowsPerPageOptions={[5, 10]}
              >
                <Column field="date" header="Date" sortable></Column>
                <Column field="project" header="Project" sortable></Column>
                <Column field="task" header="Task" sortable></Column>
                <Column
                  field="hours"
                  header="Hours"
                  body={hoursTemplate}
                  sortable
                ></Column>
                <Column
                  field="status"
                  header="Status"
                  body={timesheetStatusTemplate}
                  sortable
                ></Column>
                <Column
                  body={(rowData) => (
                    <div className="flex gap-1">
                      <Button
                        icon="pi pi-pencil"
                        text
                        severity="secondary"
                        size="small"
                        tooltip="Edit"
                        tooltipOptions={{ position: "top" }}
                      />
                      <Button
                        icon="pi pi-trash"
                        text
                        severity="danger"
                        size="small"
                        tooltip="Delete"
                        tooltipOptions={{ position: "top" }}
                      />
                    </div>
                  )}
                ></Column>
              </DataTable>
            </Card>
          </div>

          <div className="col-12 lg:col-4">
            <Card title="Quick Actions" className="shadow-1">
              <div className="flex flex-column gap-3">
                <Button
                  label="Generate Invoice"
                  icon="pi pi-file-pdf"
                  severity="secondary"
                  outlined
                  className="w-full justify-content-start"
                />
                <Button
                  label="Request Payment"
                  icon="pi pi-money-bill"
                  severity="success"
                  outlined
                  className="w-full justify-content-start"
                />
                <Button
                  label="Schedule Meeting"
                  icon="pi pi-calendar-plus"
                  severity="info"
                  outlined
                  className="w-full justify-content-start"
                />
                <Button
                  label="Update Portfolio"
                  icon="pi pi-image"
                  severity="help"
                  outlined
                  className="w-full justify-content-start"
                />
                <div className="mt-4 pt-3 border-top-1 border-300">
                  <h4 className="text-600 text-sm font-semibold mb-2">
                    Weekly Summary
                  </h4>
                  <div className="flex justify-content-between text-sm">
                    <span className="text-500">Hours Worked:</span>
                    <span className="font-semibold">38.5 hrs</span>
                  </div>
                  <div className="flex justify-content-between text-sm mt-2">
                    <span className="text-500">Earnings:</span>
                    <span className="font-semibold text-green-500">$2,850</span>
                  </div>
                  <div className="flex justify-content-between text-sm mt-2">
                    <span className="text-500">Pending Approval:</span>
                    <span className="font-semibold text-orange-500">
                      7.5 hrs
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Log Hours Dialog */}
      <Dialog
        header="Log Hours"
        visible={visible}
        style={{ width: "500px" }}
        onHide={() => setVisible(false)}
      >
        <div className="p-fluid">
          <div className="field mt-3">
            <label htmlFor="project">Project *</label>
            <Dropdown
              id="project"
              value={selectedContract}
              onChange={(e) => setSelectedContract(e.value)}
              options={contracts.filter((c) => c.status === "Active")}
              optionLabel="project"
              placeholder="Select a project"
              className="w-full"
            />
          </div>
          <div className="field mt-3">
            <label htmlFor="date">Date *</label>
            <Calendar
              id="date"
              value={date}
              onChange={(e) => setDate(e.value)}
              className="w-full"
              showIcon
            />
          </div>
          <div className="field mt-3">
            <label htmlFor="hours">Hours *</label>
            <InputNumber
              id="hours"
              value={8}
              mode="decimal"
              min={0.5}
              max={24}
              step={0.5}
              className="w-full"
            />
          </div>
          <div className="field mt-3">
            <label htmlFor="task">Task Description *</label>
            <InputText
              id="task"
              className="w-full"
              placeholder="e.g., Frontend development, bug fixing..."
            />
          </div>
          <div className="field mt-3">
            <label htmlFor="deliverable">Related Deliverable</label>
            <Dropdown
              id="deliverable"
              value={deliverableStatus}
              onChange={(e) => setDeliverableStatus(e.value)}
              options={statusOptions}
              placeholder="Select deliverable status"
              className="w-full"
            />
          </div>
          <div className="flex justify-content-end gap-2 mt-5">
            <Button
              label="Cancel"
              severity="secondary"
              onClick={() => setVisible(false)}
            />
            <Button
              label="Submit Hours"
              onClick={() => {
                toast.current.show({
                  severity: "success",
                  summary: "Success",
                  detail: "Hours logged successfully",
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

export default ContractorDashboard;

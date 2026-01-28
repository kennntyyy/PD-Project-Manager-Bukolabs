import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { FloatLabel } from 'primereact/floatlabel';
import { Slider } from 'primereact/slider';
import { Divider } from 'primereact/divider';
import { ProgressBar } from 'primereact/progressbar';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { pdf } from '@react-pdf/renderer';
import { ProjectReportPDF } from '../../dashboards/staff_panels/ProjectReportPDF';
import api from '../../../services/api';

const StaffReportsPanel = () => {
    const [projects, setProjects] = useState([]);
    const [contractors, setContractors] = useState([]);
    const [clients, setClients] = useState([]);
    const [reportStartDate, setReportStartDate] = useState('');
    const [reportEndDate, setReportEndDate] = useState('');
    const [selectedProject, setSelectedProject] = useState(null);
    const [completionRate, setCompletionRate] = useState(0);
    const [releasedAmount, setReleasedAmount] = useState(0);
    const [reportValue, setReportValue] = useState('');

    //FETCH DATA FROM BACKEND
    //fetching all projects from backend
    const fetchProjects = async () => {
        try{
            const response =  await api.get('/projects');
            setProjects(response.data);

            console.log("Projects fetched:", response.data);
        }catch(error){
            console.error("Error fetching projects:", error);
        }
    };

    const fetchUsers = async () => {
        try{
            const response = await api.get('/users');
            const contractorsList = response.data.filter(
                (user) => user.user_role === 'contractor',
            );
            setContractors(contractorsList);

            const clientsList = response.data.filter(
                (user) => user.user_role === 'client'
            );
            setClients(clientsList);

            console.log("Clients Found: ", clientsList);
            console.log('Contractors Found: ', contractorsList);
        }catch(error){
            console.error("Error fetching contractors:", error);
        }
    };

    //GETTING THE NAMES OF USERS -> TEMPLATES
    const getContractorName = (contractorId) => {
        if(!contractorId) return '';

        const contractor = contractors.find((c) => c.user_id == contractorId);
        return contractor
            ? `${contractor.first_name} ${contractor.last_name}` : '';
    };

    const getClientName = (clientId) => {
        if(!clientId) return 'NO CLIENT RECORD';

        const client = clients.find((c) => c.user_id === clientId);
        return client
            ? `${client.first_name} ${client.last_name}` : '';
    };

    useEffect(() => {
        fetchProjects();
        fetchUsers();
    }, []);

    // Debugging useEffect to log selectedProject changes
    useEffect(() => {
        console.log("Selected Project:", selectedProject)
        console.log("Contractor Name:", selectedProject ? getContractorName(selectedProject.contractor_id) : 'None');
    }, [selectedProject]);

    const clearForms =() => {
        setSelectedProject(null);
        setCompletionRate(0);
        setReleasedAmount(0);
    };

    const reportRef = useRef();

    //function to save as PDF
    const handleDownloadPDF = async () => {

        await logReportGeneration();
        // 1. Prepare your formatted dates
        const reportDates = {
            projectStart: selectedProject ? new Date(selectedProject.project_start_date).toLocaleDateString() : '',
            projectEnd: selectedProject ? new Date(selectedProject.project_deadline).toLocaleDateString() : '',
            reportStart: reportStartDate ? new Date(reportStartDate).toLocaleDateString() : '',
            reportEnd: reportEndDate ? new Date(reportEndDate).toLocaleDateString() : '',
        };

        // 2. Generate the PDF blob
        const doc = (
            <ProjectReportPDF 
            data={selectedProject}
            clientName={getClientName(selectedProject.client_id)}
            contractorName={getContractorName(selectedProject.contractor_id)}
            completionRate={completionRate}
            reportDates={reportDates}
            />
        );

        const blob = await pdf(doc).toBlob();
        
        // 3. Trigger Save
        const fileName = `Report_${selectedProject?.project_name || 'Project'}.pdf`;
        
        // If you don't want to install 'file-saver', use this native way:
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        };

        //function for saving as CSV
        const handleDownloadCSV = () => {
            if(!selectedProject) return;

            const rows = [
                ["Field", "Value"],
                ["Client", getClientName(selectedProject.client_id)],
                ["Project Name", selectedProject.project_name],
                ["Allocated Budget", selectedProject.total_amount],
                ["Start Date", selectedProject.project_start_date],
                ["Completion Rate", `${completionRate}%`],
                ["Report Period", `${reportStartDate} to ${reportEndDate}`]
            ];

            const csvContent = "data:text/csv;charset=utf-8,"  + rows.map(e => e.join(",")).join("\n");

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `Report_${selectedProject.project_name}.csv`);
            document.body.appendChild(link);
            link.click();
        };

        const logReportGeneration = async () => {
            try {

                // const savedUser = JSON.parse(localStorage.getItem('user'));
                // const userId =  savedUser?.user_id || savedUser?.id;

                // if (!userId) {
                //     console.error("No logged-in user found!");
                //     // Optional: show a toast message to the user
                //     return;
                // }

                const reportRecord = {
                    
                    project_id: selectedProject.project_id,

                    start_date: reportStartDate,
                    end_date: reportEndDate,
                    current_progress: completionRate,
                    payment_requested: releasedAmount,
                    report_description: reportValue,
                    // created_by: userId,
                };

                await api.post('/reports', reportRecord);
                console.log("Report generation logged:", reportRecord);
            }catch(error){
                console.error("Error logging report generation:", error);
            }
        }

    return(
        <div>
            {/* <Toast ref={toast} /> */}
            <div className="header"
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between'
                }}>
                <div>
                    <h2>Generate Report</h2>
                </div>
                <div>
                    <Button
                        label='NEW REPORT'
                        onClick={clearForms}
                        style={{
                            backgroundColor: 'white',
                            color: 'black',
                            padding: '5px',
                            paddingTop: '10px',
                            paddingBottom: '10px',
                            fontSize: 'small'
                        }}>
                    </Button>
                </div>
                
                
            </div>
            
            <div className='staffreports-main-container'
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    // alignItems: 'center',
                    width: '100%',
                    // justifyContent: '',
                    backgroundColor: 'white',
                    padding: '10px',
                    gap: '10px'
                }}>
                <div className="staffreports-dropdown"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        width: '50%',   
                        fontSize: 'small',
                        padding: '10px',
                        border: '1px solid gray',
                    }}>
                    
                    <Dropdown
                        id="project-dropdown"
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.value)}
                        placeholder='Select Project'
                        options={projects}
                        optionLabel="project_name"
                        // optionValue="project_id"
                        style={{ borderColor: '#cbd5e1' }}>
                    </Dropdown>
                    
                    <label htmlFor="contractor-name">Contractor / Company:</label>
                    <InputText
                        value={selectedProject ? getContractorName(selectedProject.contractor_id) : ''}
                        id='contractor-name'
                        type="text"
                        disabled
                        style={{ color: 'black',
                            fontWeight: 'bold',
                         }}
                        >
                    </InputText>

                    <label htmlFor='allocated-amount'>Project Allocated Budget</label>
                    <InputNumber
                        id="allocated-amount"
                        placeholder='TOTAL AMOUNT'
                        prefix='₱ '
                        value={selectedProject?.total_amount ? parseFloat(selectedProject.total_amount) : 'not a number'}
                        mode="decimal"
                        minFractionDigits={2}
                        maxFractionDigits={2}
                        disabled
                    ></InputNumber>

                    <div className='db-dates'
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            gap: '4px',  
                            
                        }}>
                        <div>
                        <label htmlFor="project_start_date">Date of Project Start:</label>
                        <Calendar
                            id="project_start_date"
                            value={ selectedProject ? new Date(selectedProject.project_start_date) : null}
                            disabled
                            dateFormat='mm/dd/yy'
                            showIcon
                            placeholder='Project Date'   
                        ></Calendar>
                        </div>
                        <div>
                            <label htmlFor="project_end_date">End of Project:</label>
                           <Calendar
                            id="project_end_date"
                            value={ selectedProject ? new Date(selectedProject.project_deadline) : null}
                            disabled
                            dateFormat='mm/dd/yy'
                            showIcon
                            placeholder='Project Date'   
                            ></Calendar> 
                        </div>
                    </div>
                    
                    <div className='genForm-dates'
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            gap: '4px'
                        }}>
                        <div>
                            <label htmlFor='generate-start-date'>Report Start Date</label>
                            <Calendar
                            id="generate-start-date"
                            value={reportStartDate}
                            onChange={(e) => setReportStartDate(e.target.value)}
                            placeholder='Select Start Date'
                            dateFormat='mm/dd/yy'
                            showIcon
                            >
                            </Calendar>
                        </div>
                        <div>
                            <label htmlFor='generate-start-date'>Report End Date</label>
                            <Calendar
                            id="generate-end-date"
                            value={reportEndDate}
                            onChange={(e) => setReportEndDate(e.target.value)}
                            showIcon
                            placeholder='Select End Date'
                            dateFormat='mm/dd/yy'>
                            </Calendar>
                        </div>
                    </div>
                    <label htmlFor='comp-rate-input'>Project Completion Rate</label>
                    <InputNumber
                        id='comp-rate-input'
                        value={completionRate}
                        onValueChange={(e) => setCompletionRate(e.value)}
                        min={0}
                        max={100}
                        placeholder="0%"
                        showButtons
                        buttonLayout="horizontal"
                        suffix='%'
                        style = {{
                            width: '10%'
                        }}
                    ></InputNumber>
                    <label htmlFor='amount-release-input'>Amount to be Released:</label> 
                    <InputNumber
                        id="amount-release-input"
                        value={releasedAmount}
                        onValueChange={(e) => setReleasedAmount(e.value)}
                        placeholder="Enter Amount"
                        prefix='₱'
                        min={0}
                    ></InputNumber>
                    <h3>Report Notes:</h3>
                    <label htmlFor="report-description-input">Report Description</label>
                    <InputTextarea
                        id="report-description-input"
                        value={reportValue}
                        onChange={(e) => setReportValue(e.target.value)}
                        placeholder='Enter Report Description'
                        rows={5}
                        style={{
                            resize: 'none',
                        }}
                    ></InputTextarea>
                </div>
                    

                <div className="staffreports-preview"
                    
                    style={{border: '1px solid gray',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        alignItems: 'flex-start',
                        width: '50%',
                        gap: '10px',
                        padding: '10px',
                        // height: '100%'
                    }}>
                        <h4>Report Preview</h4>
                    <div className="details-container"
                        ref={reportRef}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            padding: '5px',
                            fontWeight: '500',
                            width: '100%'
                        }}>

                        <p>Client: {selectedProject ? getClientName(selectedProject.client_id) : ''}</p>    
                        <p>PN: {selectedProject ? selectedProject.project_name : ''}</p>
                        <p>Contractor: {selectedProject ? getContractorName(selectedProject.contractor_id) : ''}</p>
                        <p>Allocated Budget: {selectedProject ? 
                        `₱${Number(selectedProject.total_amount).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}`
                        : '' }
                        </p>
                        <p>Project Start Date: {selectedProject ? new Date(selectedProject.project_start_date).toLocaleDateString('en-US', {
                            month: 'long', day: 'numeric', year: 'numeric'
                        }) : ''}</p>
                        <p>Project End Date: {selectedProject ? new Date(selectedProject.project_deadline).toLocaleDateString(
                            'en-US', {month: 'long', day: 'numeric', year: 'numeric'}
                        ) : ''}</p>
                        <h4 style={{marginTop: '8px' }}>Report Generation for the Month/s of: </h4>
                        <p>Report Start Date: {reportStartDate ? new Date(reportStartDate).toLocaleDateString(
                            'en-US', {month: 'long', day: 'numeric', year: 'numeric'}
                        ) : ''}</p>
                        <p>Report End Date: {reportEndDate ? new Date(reportEndDate).toLocaleDateString(
                            'en-US', {month: 'long', day: 'numeric', year: 'numeric'}
                        ) : ''}</p>
                        <p>Completion Rate: {completionRate}%</p>
                        <p>Payment Amount Requested: {selectedProject ? 
                        `₱${Number(releasedAmount).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}`
                        : '' }</p>

                        <ProgressBar
                            value={completionRate}
                            style={{ height: '10px'}}
                            showValue={false}
                        >
                        </ProgressBar>
                    </div>
                    
                    {selectedProject && (
                        <div className="save-buttons"
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'end',
                                width: '100%',
                                gap: '4px'
                            }}
                            hidden={selectedProject ? false : true}>
                            
                            <Button 
                                label = "Save as PDF"
                                onClick={handleDownloadPDF}
                            ></Button>
                            <Button 
                                label = "Save as CSV"
                            ></Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default StaffReportsPanel;
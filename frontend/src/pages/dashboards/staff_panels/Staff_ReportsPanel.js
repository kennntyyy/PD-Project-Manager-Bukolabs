import React, { useState, useEffect, useRef } from 'react';
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
import { ProgressBar } from 'primereact/progressbar';
import api from '../../../services/api';

const StaffReportsPanel = () => {
    const [projects, setProjects] = useState([]);
    const [contractors, setContractors] = useState([]);
    const [clients, setClients] = useState([]);
    const [reportStartDate, setReportStartDate] = useState('');
    const [reportEndDate, setReportEndDate] = useState('');
    const [selectedProject, setSelectedProject] = useState(null);
    const [completionRate, setCompletionRate] = useState(0);

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
        if(!clientId) return 'no client found';

        const client = clients.find((c) => c.user_id === clientId);
        return client
            ? `${client.first_name} ${client.last_name}` : '';
    };

    //get and format project_dates
    // const getFormattedDate = (dateString) => {
    //     if (!dateString) return '';

    //     const date = new Date(dateString);

    //     if(isNaN(date.getTime())) return 'invalid date';

    //     return date.toLocaleDateString('en-US', {
    //         year: 'numeric',
    //         month: 'short',
    //         day: 'numeric'
    //     });
    // };

    useEffect(() => {
        fetchProjects();
        fetchUsers();
    }, []);

    // Debugging useEffect to log selectedProject changes
    useEffect(() => {
        console.log("Selected Project:", selectedProject)
        console.log("Contractor Name:", selectedProject ? getContractorName(selectedProject.contractor_id) : 'None');
    }, [selectedProject]);



    return(
        <div>
            {/* <Toast ref={toast} /> */}

            <h2>Generate Report</h2>
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
                        >
                        
                    </InputNumber>
                </div>

                <div className="staffreports-preview"
                    style={{border: '1px solid gray',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        alignItems: 'flex-start',
                        width: '50%',
                        gap: '10px',
                        padding: '10px'
                        // height: '100%'
                    }}>
                        <h4>Report Preview</h4>
                    <div className="details-container"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            padding: '5px',
                            fontWeight: '500'
                        }}>

                        <p>Client: {selectedProject ? getClientName(selectedProject.client_id) : ''}</p>    
                        <p>PN: {selectedProject ? selectedProject.project_name : ''}</p>
                        <p>Contractor: {selectedProject ? getContractorName(selectedProject.contractor_id) : ''}</p>
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

                        <ProgressBar
                            value={completionRate}
                            style={{ height: '10px'}}
                            showValue={false}
                        >

                        </ProgressBar>
                    </div>
                </div>
                
            </div>
        </div>
    )
}

export default StaffReportsPanel;
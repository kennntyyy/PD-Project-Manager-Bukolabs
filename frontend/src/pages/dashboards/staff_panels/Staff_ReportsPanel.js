import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { FloatLabel } from 'primereact/floatlabel';
import api from '../../../services/api';

const StaffReportsPanel = () => {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);

    //fetching all projects from backend
    const fetchProjects = async () => {
        try{
            const response =  await api.get('/projects');
            setProjects(response.data);

            console.log("Projects fetched:", response.data);
        }catch(error){
            console.error("Error fetching projects:", error);
        }
    }

    useEffect(() => {
        fetchProjects();
    }, []);

    // Debugging useEffect to log selectedProject changes
    useEffect(() => {
        console.log("Selected Project:", selectedProject)
    }, [selectedProject]);

    return(
        <div>
            {/* <Toast ref={toast} /> */}

            <h2>Generate Report</h2>
            <div className='staffreports-main-container'
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    width: '100%',
                    justifyContent: 'space-between',
                    backgroundColor: 'white',
                    padding: '10px',
                }}>
                <div className="staffreports-dropdown"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        width: '30%',   
                        fontSize: 'small'
                    }}>
                    
                    <Dropdown
                        id="project-dropdown"
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.value)}
                        placeholder='Select Project'
                        options={projects}
                        optionLabel="project_name"
                        optionValue="project_id"
                        style={{ borderColor: '#cbd5e1' }}>
                    </Dropdown>
                    <label htmlFor="contractor-name">Contractor / Company</label>
                    <InputText
                        id='contractor-name'
                        type="text"
                        disabled
                        >
                    </InputText>
                </div>

                <div className="staffreports-preview">
                    <h2>HEY!</h2>
                </div>
                
            </div>
        </div>
    )
}

export default StaffReportsPanel;
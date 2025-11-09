// pages/reports/Reports.jsx
import React, { useState, useEffect } from 'react';
import './Reports-e.css'; // Make sure this CSS file is imported

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; 
const reportOptions = [
    { key: 'overdue', label: 'Overdue Items', endpoint: '/api/reports/overdue' },
    { key: 'popular', label: 'Checkout Frequency', endpoint: '/api/reports/popular' },
    { key: 'fines', label: 'Users with Outstanding Fines', endpoint: '/api/reports/fines' },
];

function Reports() {
    const [selectedReportKey, setSelectedReportKey] = useState(reportOptions[0].key); 
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');


    // Fetch data when selectedReportKey changes (NO CHANGES NEEDED HERE)
    useEffect(() => {getReport();}, [selectedReportKey]); 

    function getReport() {

        const selectedReport = reportOptions.find(r => r.key === selectedReportKey);
        if (!selectedReport) return;

        setLoading(true);
        setError('');
        setReportData([]); 
        
        const token = localStorage.getItem('authToken');
        if (!token) {
            setError('Authentication token missing. Please log in.');
            setLoading(false);
            return;
        }
        
        const authHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        };

        fetch(`${API_BASE_URL}${selectedReport.endpoint}`, { 
            method: 'POST' , 
            headers: authHeaders ,
            body: filterPostBody(selectedReportKey)
            })
            .then(res => {
                if (res.status === 401) {
                    throw new Error('Unauthorized');
                }
                if (!res.ok) throw new Error(`Network error ${res.status}`);
                return res.json();
            })
            .then(data => {
                setReportData(data || []);
                setLoading(false);
            })
            .catch(err => {
                console.error(`Failed to fetch ${selectedReport.label}:`, err);
                setError(`Could not load report: ${err.message}`);
                setLoading(false);
            });
    }

    // Gets the filtering info entered
    function filterPostBody(reportKey = '') {
        if (reportKey == 'overdue')
        {
            return JSON.stringify({
                date1: `'${document.getElementById('dmin').value}'`,
                date2: (document.getElementById('dmax').value >= document.getElementById('dmin').value ? `'${document.getElementById('dmax').value}'` : `''`),
                book: document.getElementById('bookCheck').checked,
                movie: document.getElementById('movieCheck').checked,
                device: document.getElementById('deviceCheck').checked
            })
        }
        else if (reportKey == 'popular')
        {
            return JSON.stringify({
                dateEarliest: `'${document.getElementById('popStart').value}'`,
                dateLatest: `'${document.getElementById('popEnd').value}'`,
                minBrw: document.getElementById('minBrw').value,
                maxBrw: (document.getElementById('maxBrw').value != '' ? 
                    (document.getElementById('maxBrw').value >= document.getElementById('minBrw').value ?
                    (document.getElementById('maxBrw').value) : '') : ''),
                maxDis: document.getElementById('maxDis').value,
                book: document.getElementById('bookCheck1').checked,
                movie: document.getElementById('movieCheck1').checked,
                device: document.getElementById('deviceCheck1').checked
            })
        }        
        else if (reportKey == 'fines')
        {
            return JSON.stringify({
                minOwed: document.getElementById('minOwe').value,
                fineCount: document.getElementById('minFines').value,
            })
        }
        else return JSON.stringify({data: 'none'});
    }

    // Helper function to render table
    const renderReportTable = () => {
        if (loading) return <p>Loading report data...</p>;
        if (error) return <p style={{ color: 'red' }}>{error}</p>;
        if (reportData.length === 0) return <p>No data available for this report.</p>;

        const headers = Object.keys(reportData[0]);

        return (
            <div>
                <table className='report-table'>
                    <thead>
                        <tr>
                            {headers.map(header => <th key={header}>{header.replace(/_/g, ' ').toUpperCase()}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map((row, index) => (
                            <tr key={index}>
                                {headers.map(header => <td key={header}>{formatCell(row[header], header)}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    function renderFilter() {
        if (selectedReportKey == 'overdue') {
            return renderOverdueFilter();
        }
        else if (selectedReportKey == 'popular') {
            return renderPopularFilter();
        }
        else if (selectedReportKey == 'fines') {
            return renderFineFilter();
        }
    }

    function renderOverdueFilter() {
        return (
            <div>
                <div>
                    <label for='dmin'>Earliest Due Date: </label>
                    <input id='dmin' name='dmin' type='date' class='filter-input'></input>

                    <label for='dmax'>Latest Due Date: </label>
                    <input id='dmax' name='dmax' type='date' class='filter-input'></input>
                </div>
                <div>
                    <label for='bookCheck'>Books: </label>
                    <input id='bookCheck' name='bookCheck' type='checkbox' class='filter-input' defaultChecked></input>

                    <label for='movieCheck'>Movies: </label>
                    <input id='movieCheck' name='movieCheck' type='checkbox' class='filter-input' defaultChecked></input>

                    <label for='deviceCheck'>Devices: </label>
                    <input id='deviceCheck' name='deviceCheck' type='checkbox' class='filter-input' defaultChecked></input>
                </div>
                <div>
                    <button id='overdueButton' onClick={() => {getReport(); }}>Filter</button>
                </div>
            </div>
        );
    };

    function renderPopularFilter() {

        return (
            <div>
                <div>
                    <label for='popStart'>Earliest Borrow Date: </label>
                    <input id='popStart' name='popStart' type='date' class='filter-input'></input>
                    -- Defaults to previous 90 days if left blank
                </div>
                <div>
                    <label for='popStart'>Latest Borrow Date: </label>
                    <input id='popEnd' name='popEnd' type='date' class='filter-input'></input>
                    -- Defaults to Today if left blank
                </div>
                <div>
                    <label for='minBrw'>Minimum Times Checked-Out: </label>
                    <input id='minBrw' name='minBrw' type='number' class='filter-input' defaultValue='1' min='0'></input>
                </div>
                <div>
                    <label for='maxBrw'>Maximum Times Checked-Out: </label>
                    <input id='maxBrw' name='maxBrw' type='number' class='filter-input' min='1'></input>
                </div>
                <div>
                    <label for='maxDis'>Maximum Displayed: </label>
                    <input id='maxDis' name='maxDis' type='number' class='filter-input' defaultValue='50' min='1'></input>
                </div>
                <div>
                    <label for='bookCheck1'> Books: </label>
                    <input id='bookCheck1' name='bookCheck1' type='checkbox' class='filter-input' defaultChecked></input>
                    <label for='movieCheck1'> Movies: </label>
                    <input id='movieCheck1' name='movieCheck1' type='checkbox' class='filter-input' defaultChecked></input>
                    <label for='deviceCheck1'> Devices: </label>
                    <input id='deviceCheck1' name='deviceCheck1' type='checkbox' class='filter-input' defaultChecked></input> 
                </div>
                <div>
                    <button id='popularButton' onClick={() => {getReport(); }}>Filter</button>
                </div>               
            </div>
        );
    };

    function renderFineFilter() {

        return (
            <div>
                <div>
                    <label for='minOwe'>Minimum Individual Fines: </label>
                    <input id='minOwe' name='minOwe' type='number' min='1' class='filter-input'></input>

                    <label for='minFines'>Minimum Owed Amount: </label>
                    <input id='minFines' name='minFines' type='number' min='0' class='filter-input'></input>
                </div>
                <div>
                    <button id='fineButton' onClick={() => {getReport(); }}>Filter</button>
                </div>
            </div>
        );
    };

    // Helper to format cells (NO CHANGES NEEDED HERE)
    const formatCell = (value, headerKey) => {
        if (value === null || value === undefined) return '-';
        if (headerKey.includes('date') && value) {
            return new Date(value).toLocaleDateString();
        }
        if (headerKey.includes('amount') || headerKey.includes('fee')) {
             if (typeof value === 'number') return `$${value.toFixed(2)}`;
             if (typeof value === 'string') return `$${parseFloat(value).toFixed(2)}`; 
        }
        return value;
    };

    // --- UPDATED RETURN BLOCK ---
    return (
        <div className='page-container reports-container'>
            <h1>Library Reports</h1>

            {/* This new wrapper will create the two-column layout */}
            <div className='reports-layout'>
                
                {/* 1. The new side navigation */}
                <div className='reports-nav'>
                    {reportOptions.map(r => (
                        <button 
                            key={r.key}
                            // Apply 'active' class if this report is selected
                            className={`nav-button ${r.key === selectedReportKey ? 'active' : ''}`}
                            onClick={() => {setSelectedReportKey(r.key)}}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>

                {/* 2. The existing content area */}
                <div className='report-content'>
                    <div className='filter-content'>
                        {renderFilter()}
                    </div>
                    <h2>{reportOptions.find(r => r.key === selectedReportKey)?.label}</h2>
                    {renderReportTable()}
                </div>

            </div> {/* End .reports-layout */}
        </div>
    );
}

export default Reports;
// pages/reports/Reports.jsx
import React, { useState, useEffect } from 'react';
import './Reports.css'; // Create this CSS file
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; 
// Define available reports
const reportOptions = [
    { key: 'overdue', label: 'Overdue Items', endpoint: '/api/reports/overdue' },
    { key: 'popular', label: 'Most Popular Items (Last 90 Days)', endpoint: '/api/reports/popular' },
    { key: 'fines', label: 'Users with Outstanding Fines', endpoint: '/api/reports/fines' },
];

function Reports() {
    const [selectedReportKey, setSelectedReportKey] = useState(reportOptions[0].key); // Default to first report
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch data when selectedReportKey changes
    useEffect(() => {
        const selectedReport = reportOptions.find(r => r.key === selectedReportKey);
        if (!selectedReport) return;

        setLoading(true);
        setError('');
        setReportData([]); // Clear previous data
        
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

        fetch(`${API_BASE_URL}${selectedReport.endpoint}`, { headers: authHeaders }) 
            .then(res => {
                // Now this check will pass
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

    }, [selectedReportKey]); // Re-run effect when the selection changes

    // --- Helper function to render table based on report key ---
    const renderReportTable = () => {
        if (loading) return <p>Loading report data...</p>;
        if (error) return <p style={{ color: 'red' }}>{error}</p>;
        if (reportData.length === 0) return <p>No data available for this report.</p>;

        // Get headers dynamically from the first data row
        const headers = Object.keys(reportData[0]);

        return (
            <table className="report-table">
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
        );
    };

    // Helper to format dates or currency if needed
    const formatCell = (value, headerKey) => {
        if (value === null || value === undefined) return '-';
        if (headerKey.includes('date') && value) {
            return new Date(value).toLocaleDateString();
        }
        if (headerKey.includes('amount') || headerKey.includes('fee')) {
             if (typeof value === 'number') return `$${value.toFixed(2)}`;
             if (typeof value === 'string') return `$${parseFloat(value).toFixed(2)}`; // Handle potential string numbers
        }
        return value;
    };


    return (
        <div className="page-container reports-container">
            <h1>Library Reports</h1>

            <div className="report-selector">
                <label htmlFor="report-select">Select Report:</label>
                <select 
                    id="report-select"
                    value={selectedReportKey} 
                    onChange={(e) => setSelectedReportKey(e.target.value)}
                >
                    {reportOptions.map(r => (
                        <option key={r.key} value={r.key}>{r.label}</option>
                    ))}
                </select>
            </div>

            <div className="report-content">
                <h2>{reportOptions.find(r => r.key === selectedReportKey)?.label}</h2>
                {renderReportTable()}
            </div>
        </div>
    );
}

export default Reports;
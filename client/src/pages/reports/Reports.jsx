// pages/reports/Reports.jsx
import React, { useState, useEffect } from 'react';
import './Reports.css'; // Make sure this CSS file is imported
import { IoBookOutline, IoPeopleOutline, IoSwapHorizontalOutline, IoHourglassOutline, IoWalletOutline, IoDocumentTextOutline, IoPersonCircleOutline, IoNotificationsOutline } from 'react-icons/io5';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; 
const reportTypeOptions = [
  { key: 'genres', label: 'Popular Genres', endpoint: '/api/reports/popular-genres' },
  { key: 'items', label: 'Popular Items', endpoint: '/api/reports/popular-items' },
  { key: 'overdues', label: 'Overdue Items', endpoint: '/api/reports/overdue-items' },
  { key: 'fines', label: 'Outstanding Fines', endpoint: '/api/reports/outstanding-fines' }
];

function Reports() {
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedType, setSelectedType] = useState(reportTypeOptions[0].key);
    const [dateFilterType, setDateFilterType] = useState('date');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [monthRange, setMonthRange] = useState({ from: '1', to: '12' });
    const [yearRange, setYearRange] = useState({ from: '2023', to: '2024' });
    const [borrowStatus, setBorrowStatus] = useState('');
    const [category, setCategory] = useState('');
    const [fineStatus, setFineStatus] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    // Fetch data when selectedReportKey changes (NO CHANGES NEEDED HERE)
    useEffect(() => {
        fetchReportData();
    }, [selectedType]);

    const renderFilterOptions = () => {
        var dateFilter;
        switch (dateFilterType) {
            case 'date':
                dateFilter = (
                    <div className="filter-group">
                        <label>From:</label>
                        <input type="date" value={dateRange.from} onChange={e => setDateRange({ ...dateRange, from: e.target.value })} />
                        <label>To:</label>
                        <input type="date" value={dateRange.to} onChange={e => setDateRange({ ...dateRange, to: e.target.value })} />
                    </div>
                )
                break;
            case 'month':
                dateFilter = (
                    <div className="filter-group">
                    <label>From:</label>
                    <select value={monthRange.from} onChange={e => setMonthRange({ ...monthRange, from: e.target.value })}>
                        {Array.from({ length: 12 }, (_, i) => (
                        <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                        ))}
                    </select>
                    <label>To:</label>
                    <select value={monthRange.to} onChange={e => setMonthRange({ ...monthRange, to: e.target.value })}>
                        {Array.from({ length: 12 }, (_, i) => (
                        <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                        ))}
                    </select>
                    </div>
                )
                break;
            case 'year':
                dateFilter = (
                    <div className="filter-group">
                    <label>From:</label>
                    <input type="number" min="2000" max="2100" value={yearRange.from} onChange={e => setYearRange({ ...yearRange, from: e.target.value })} />
                    <label>To:</label>
                    <input type="number" min="2000" max="2100" value={yearRange.to} onChange={e => setYearRange({ ...yearRange, to: e.target.value })} />
                    </div>
                )
                break;
        }

        var specificFilters = [];
        switch (selectedType) {
            case 'borrows':
                specificFilters.push(
                    <div className="filter-group" key="borrow-status-filter">
                        <label>Status:</label>
                        <select value={borrowStatus} onChange={e => setBorrowStatus(e.target.value)}>
                            <option value="">All</option>
                            <option>Loaned Out</option>
                            <option>Lost</option>
                            <option>Pending</option>
                            <option>Returned</option>
                        </select>
                    </div>
                );
                break;
            case 'genres':
            case 'items':
                specificFilters.push(
                    <div className="filter-group" key="category-filter">
                        <label>Category:</label>
                        <select value={category} onChange={e => setCategory(e.target.value)}>
                            <option value="">ALL</option>
                            <option>BOOK</option>
                            <option>MOVIE</option>
                            <option>DEVICE</option>
                        </select>
                    </div>
                );
                break;
            case 'fines':
                specificFilters.push(
                    <div className="filter-group" key="fine-status-filter">
                        <label>Fine Status:</label>
                        <select value={fineStatus} onChange={e => setFineStatus(e.target.value)}>
                            <option value="">All</option>
                            <option>Paid</option>
                            <option>Unpaid</option>
                            <option>Waived</option>
                        </select>
                    </div>
                );
                break;
        }

        return (
            <div className="report-filters">
                <div className="filter-group">
                <label>Filter by:</label>
                <select value={dateFilterType} onChange={e => setDateFilterType(e.target.value)}>
                    <option value="date">Date</option>
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                </select>
                </div>
                {dateFilter}
                {specificFilters}
                <div className="filter-group">
                    <button className="action-button primary-button" onClick={fetchReportData}>
                        Generate Report
                    </button>
                    <button 
                        className="action-button secondary-button" 
                        onClick={() => {
                        setDateRange({ from: '', to: '' });
                        setMonthRange({ from: '1', to: '12' });
                        setYearRange({ from: '2023', to: '2024' });
                        setBorrowStatus('');
                        setCategory('');
                        setFineStatus('');
                        }}
                    >
                        Clear Filters
                    </button>
                </div>
            </div>
        );
    }

    // Fetch report data from backend based on selected type and filters
    const fetchReportData = async () => {
        setLoading(true);
        setError('');
        try {
            const typeConfig = reportTypeOptions.find(t => t.key === selectedType);
            if (!typeConfig) throw new Error('Invalid report type');

            let url = `${API_BASE_URL}${typeConfig.endpoint}`;
            const params = new URLSearchParams();

            params.append('filterType', dateFilterType);

            if (dateFilterType === 'date') {
            if (dateRange.from) params.append('start', dateRange.from);
            if (dateRange.to) params.append('end', dateRange.to);
            } else if (dateFilterType === 'month') {
            if (monthRange.from) params.append('start', monthRange.from);
            if (monthRange.to) params.append('end', monthRange.to);
            } else if (dateFilterType === 'year') {
            if (yearRange.from) params.append('start', yearRange.from);
            if (yearRange.to) params.append('end', yearRange.to);
            }

            switch (selectedType) {
                case 'genres':
                case 'items':
                    if (category) params.append('category', category);
                    break;
                case 'borrows':
                    if (borrowStatus) params.append('status', borrowStatus);
                    break;
                case 'fines':
                    if (fineStatus) params.append('status', fineStatus);
                    break;
                default:
                    break;
            }

            const token = localStorage.getItem('authToken');
            const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            };

            const queryString = params.toString();
            const fullUrl = queryString ? `${url}?${queryString}` : url;

            const response = await fetch(fullUrl, { headers });
            if (!response.ok) throw new Error(`Failed to fetch ${selectedType} report`);
            const data = await response.json();
            setReportData(data);
        } catch (err) {
            console.error("Error fetching report:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Helper to format cells
    const formatCell = (value, headerKey) => {
        if (value === null || value === undefined) return '-';
        if (headerKey.toLowerCase().includes('date') && value) {
            return new Date(value).toLocaleDateString();
        }
        if (headerKey.toLowerCase().includes('amount') || headerKey.toLowerCase().includes('fee')) {
             if (typeof value === 'number') return `$${value.toFixed(2)}`;
             if (typeof value === 'string') return `$${parseFloat(value).toFixed(2)}`; 
        }
        return value;
    };

    // Sort handling
    const sortedReportData = React.useMemo(() => {
        if (!reportData || reportData.length === 0) return [];
        if (!sortConfig.key) return reportData;

        const sorted = [...reportData].sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];

            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;

            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortConfig.direction === 'ascending' ? aVal - bVal : bVal - aVal;
            }

            const aStr = aVal.toString().toLowerCase();
            const bStr = bVal.toString().toLowerCase();

            if (aStr < bStr) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aStr > bStr) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });

        return sorted;
    }, [reportData, sortConfig]);

    // Render table
    const renderReportTable = () => {
        if (loading) return <p>Loading report data...</p>;
        if (error) return <p style={{ color: 'red' }}>{error}</p>;
        if (!reportData || reportData.length === 0) return <p>No data available for this report.</p>;

        const headers = Object.keys(reportData[0]);

        const handleSort = (header) => {
            let direction = 'ascending';
            if (sortConfig.key === header && sortConfig.direction === 'ascending') {
                direction = 'descending';
            }
            setSortConfig({ key: header, direction });
        };

        return (
            <table className="report-table">
                <thead>
                    <tr>
                        {headers.map(header => (
                            <th key={header} onClick={() => handleSort(header)}>
                                {header.replace(/_/g, ' ').toUpperCase()}
                                {sortConfig.key === header ? (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼') : ''}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedReportData.map((row, index) => (
                        <tr key={index}>
                            {headers.map(header => <td key={header}>{formatCell(row[header], header)}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    // --- UPDATED RETURN BLOCK ---
    return (
        <div className="page-container reports-container">
            <h1>Library Reports</h1>

            <div className="report-tabs">
              {reportTypeOptions.map(type => (
                <button
                  key={type.key}
                  className={`tab-button ${selectedType === type.key ? 'active' : ''}`}
                  onClick={() => setSelectedType(type.key)}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* Filter Section */}
            {renderFilterOptions()}
            <div className="report-content">
                <h2>Result</h2>
                {renderReportTable()}
            </div>
        </div>
    );
}

export default Reports;
// pages/reports/Reports.jsx
import React, { useState, useEffect } from 'react';
import './Reports.css';

import { IoInformationCircleOutline } from 'react-icons/io5';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; 
const reportTypeOptions = [
  { key: 'genres', label: 'Popular Genres', endpoint: '/api/reports/popular-genres', description: 'Shows the most popular genres based on borrow counts. Note: An item can have multiple genres. Hence, borrow counts may overlap.' },
  { key: 'items', label: 'Popular Items', endpoint: '/api/reports/popular-items', description: 'List the most borrowed items.' },
  { key: 'overdues', label: 'Overdue Items', endpoint: '/api/reports/overdue-items', description: 'List of items that are currently overdue along with borrower details.' },
  { key: 'fines', label: 'Outstanding Fines', endpoint: '/api/reports/outstanding-fines', description: 'Summarizes outstanding fines owed by users. Our goal is to minimize this list as much as we can by reaching out to them to encourage timely payment.' },
  { key: 'active_users', label: 'Users', endpoint: '/api/reports/active-users', description: 'We measure how active users are using how many times they borrow within a specified period.' },
  { key: 'memberships', label: 'Patrons', endpoint: '/api/reports/memberships', description: 'Provide an overview of patron memberships.' },
  { key: 'revenue', label: 'Revenue', endpoint: '/api/reports/revenue', description: 'Breakdown of revenue generated from fines and memberships.' },
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
    const [param1, setParam1] = useState('');
    const [param2, setParam2] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [searchQuery, setSearchQuery] = useState('');

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
            case 'genres':
            case 'items':
                specificFilters.push(
                    <div className="filter-group" key="category-filter">
                        <label>Category:</label>
                        <select value={param1} onChange={e => setParam1(e.target.value)}>
                            <option value="">ALL</option>
                            <option value="BOOK">Book</option>
                            <option value="MOVIE">Movie</option>
                            <option value="DEVICE">Device</option>
                        </select>
                    </div>
                );
                break;
            case 'active_users':
                specificFilters.push(
                    <div className="filter-group" key="category-filter">
                        <label>User Role:</label>
                        <select value={param1} onChange={e => setParam1(e.target.value)}>
                            <option value="">All</option>
                            <option value="1">Student</option>
                            <option value="2">Patron</option>
                            <option value="3">Faculty</option>
                        </select>
                    </div>
                );
                specificFilters.push(
                    <div className="filter-group" key="category-filter">
                        <label>Min Borrow Count:</label>
                        <input
                            type="number"
                            min="0"
                            value={param2}
                            onChange={e => setParam2(e.target.value)}
                        />
                    </div>
                );
                break;
            case 'memberships':
                specificFilters.push(
                    <div className="filter-group" key="category-filter">
                        <label>Status:</label>
                        <select value={param1 || ""} onChange={e => setParam1(e.target.value)}>
                            <option value="">All</option>
                            <option value="Not Enrolled">Not Enrolled</option>
                            <option value="Active">Active</option>
                            <option value="Canceled">Canceled</option>
                            <option value="Expired">Expired</option>
                        </select>
                    </div>
                );
                break;
            default:
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
                    {dateFilter}
                    {specificFilters}
                </div>
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
                        setParam1('');
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
                    if (param1) params.append('category', param1);
                    break;
                case 'active_users':
                    if (param1) params.append('role', param1);
                    if (param2) params.append('minBorrow', param2);
                    break;
                case 'memberships':
                    if (param1) params.append('status', param1);
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

    // Sort and filter handling
    const sortedReportData = React.useMemo(() => {
        if (!reportData || reportData.length === 0) return [];

        const filteredData = reportData.filter(row =>
            Object.entries(row).some(([key, value]) =>
                formatCell(value, key).toString().toLowerCase().includes(searchQuery.toLowerCase())
            )
        );

        if (!sortConfig.key) return filteredData;

        const sorted = [...filteredData].sort((a, b) => {
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
    }, [reportData, sortConfig, searchQuery]);

    const revenueSummary = React.useMemo(() => {
        if (selectedType !== 'revenue' || !reportData.length) return null;

        const totals = reportData.reduce((acc, row) => {
            acc[row.type] = (acc[row.type] || 0) + Number(row.amount || 0);
            return acc;
        }, {});

        const totalRevenue = Object.values(totals).reduce((a, b) => a + b, 0);

        return { totals, totalRevenue };
    }, [reportData, selectedType]);

    // User summary for active_users report
    const userSummary = React.useMemo(() => {
        if (selectedType !== 'active_users' || !reportData.length) return null;
        const totals = reportData.reduce((acc, row) => {
            const label = row.role_name || 'Unknown';
            acc[label] = (acc[label] || 0) + 1;
            return acc;
        }, {});
        const totalUsers = Object.values(totals).reduce((a, b) => a + b, 0);
        return { totals, totalUsers };
    }, [reportData, selectedType]);

    // Membership summary for memberships report
    const membershipSummary = React.useMemo(() => {
        if (selectedType !== 'memberships' || !reportData.length) return null;
        const totals = reportData.reduce((acc, row) => {
            const label = row.membership_status || 'Unknown';
            acc[label] = (acc[label] || 0) + 1;
            return acc;
        }, {});
        const totalMemberships = Object.values(totals).reduce((a, b) => a + b, 0);
        return { totals, totalMemberships };
    }, [reportData, selectedType]);

    const renderPieChart = () => {
        switch (selectedType) {
            case 'revenue':
                if (!revenueSummary) return null;
                return (
                    <div className="revenue-summary">
                        <h3>Total Revenue: ${revenueSummary.totalRevenue.toFixed(2)}</h3>
                        <Pie
                            data={{
                                labels: Object.keys(revenueSummary.totals),
                                datasets: [
                                    {
                                        data: Object.values(revenueSummary.totals),
                                        backgroundColor: ['#4CAF50', '#2196F3'], // green for fines, blue for membership
                                        hoverOffset: 10,
                                    },
                                ],
                            }}
                            options={{
                                plugins: {
                                    legend: { position: 'bottom' },
                                    tooltip: {
                                        callbacks: {
                                            label: (context) => {
                                                const type = context.label;
                                                const val = context.raw;
                                                const pct = ((val / revenueSummary.totalRevenue) * 100).toFixed(1);
                                                return `${type}: $${val.toFixed(2)} (${pct}%)`;
                                            },
                                        },
                                    },
                                },
                            }}
                        />
                    </div>
                );
            case 'active_users':
                if (!userSummary) return null;
                return (
                    <div className="revenue-summary">
                        <h3>Total Users: {userSummary.totalUsers}</h3>
                        <Pie
                            data={{
                                labels: Object.keys(userSummary.totals),
                                datasets: [
                                    {
                                        data: Object.values(userSummary.totals),
                                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'], // colors for roles
                                        hoverOffset: 10,
                                    },
                                ],
                            }}
                            options={{
                                plugins: {
                                    legend: { position: 'bottom' },
                                    tooltip: {
                                        callbacks: {
                                            label: (context) => {
                                                const type = context.label;
                                                const val = context.raw;
                                                const pct = ((val / userSummary.totalUsers) * 100).toFixed(1);
                                                return `${type}: ${val} (${pct}%)`;
                                            },
                                        },
                                    },
                                },
                            }}
                        />
                    </div>
                );
            case 'memberships':
                if (!membershipSummary) return null;
                return (
                    <div className="revenue-summary">
                        <h3>Total Patrons: {membershipSummary.totalMemberships}</h3>
                        <Pie
                            data={{
                                labels: Object.keys(membershipSummary.totals),
                                datasets: [
                                    {
                                        data: Object.values(membershipSummary.totals),
                                        backgroundColor: ['#4CAF50', '#FF9800'], // green for active, orange for expired
                                        hoverOffset: 10,
                                    },
                                ],
                            }}
                            options={{
                                plugins: {
                                    legend: { position: 'bottom' },
                                    tooltip: {
                                        callbacks: {
                                            label: (context) => {
                                                const type = context.label;
                                                const val = context.raw;
                                                const pct = ((val / membershipSummary.totalMemberships) * 100).toFixed(1);
                                                return `${type}: ${val} (${pct}%)`;
                                            },
                                        },
                                    },
                                },
                            }}
                        />
                    </div>
                );
            case 'fines': {
                if (!reportData.length) return null;
                const fineTotals = reportData.reduce((acc, row) => {
                    const email = row.email || 'Unknown';
                    acc[email] = (acc[email] || 0) + Number(row.total_amount_due || 0);
                    return acc;
                }, {});
                const totalFines = Object.values(fineTotals).reduce((a, b) => a + b, 0);
                return (
                    <div className="revenue-summary">
                        <h3>Total Outstanding Fines: ${totalFines.toFixed(2)}</h3>
                        <Pie
                            data={{
                                labels: Object.keys(fineTotals),
                                datasets: [{
                                    data: Object.values(fineTotals),
                                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                                    hoverOffset: 10,
                                }],
                            }}
                            options={{
                                plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                        callbacks: {
                                            label: (context) => {
                                                const label = context.label;
                                                const val = context.raw;
                                                const pct = ((val / totalFines) * 100).toFixed(1);
                                                return `${label}: $${val.toFixed(2)} (${pct}%)`;
                                            },
                                        },
                                    },
                                },
                            }}
                        />
                    </div>
                );
            }
            default:
                return null;
        }
    }

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
            <>
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
            </>
        );
    };

    // --- UPDATED RETURN BLOCK ---
    return (
        <div className="page-container">
            <div className='reports-container'>
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

                <div className="report-description">
                    <h3><IoInformationCircleOutline /></h3>
                    <p>{reportTypeOptions.find(t => t.key === selectedType)?.description}</p>
                </div>
                {/* Filter Section */}
                {renderFilterOptions()}
                {renderPieChart()}
                
                <div className="report-content">
                    <div className="report-search">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <h2>Found {sortedReportData.length} result(s)</h2>
                    {renderReportTable()}
                </div>
            </div>
        </div>
    );
}

export default Reports;
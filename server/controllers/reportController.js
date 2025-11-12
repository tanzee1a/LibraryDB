// controllers/reportController.js
const Report = require('../models/reportModel');
const url = require('url');

// @desc Get Borrows Report
// @route GET /api/reports/borrows
async function getPopularGenresReport(req, res) {
    try {
        const parsedUrl = url.parse(req.url, true);
        const query = parsedUrl.query;
        const data = await Report.popularGenresReport(query);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(data));
    } catch (error) {
        console.error("Error getting Borrows Report:", error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not fetch report', error: error.message }));
    }
}

// @desc Get Items Report
// @route GET /api/reports/items?startDate=2025-01-01&endDate=2025-12-31&category=BOOK
async function getPopularItemsReport(req, res) {
    try {
        const parsedUrl = url.parse(req.url, true);
        const { filterType, start, end, category } = parsedUrl.query;

        const data = await Report.popularItemReport({ filterType, start, end, category });

        res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        });
        res.end(JSON.stringify(data));
    } catch (error) {
        console.error("Error in getItemsReport:", error);
        res.writeHead(500, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        });
        res.end(JSON.stringify({ message: 'Server error', error: error.message }));
    }
}

// @desc Get Overdue Items Report
// @route GET /api/reports/overdue
async function getOverdueItemsReport(req, res) {
    try {
        const parsedUrl = url.parse(req.url, true);
        const query = parsedUrl.query;
        const data = await Report.overdueItemsReport(query);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(data));
    } catch (error) {
        console.error("Error getting Overdue Report:", error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not fetch report', error: error.message }));
    }
}

// @desc Get Fines Report
// @route GET /api/reports/fines-summary
async function getOutstandingFines(req, res) {
    try {
        const parsedUrl = url.parse(req.url, true);
        const query = parsedUrl.query;
        const data = await Report.outstandingFinesReport(query);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(data));
    } catch (error) {
        console.error("Error getting Fines Report:", error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not fetch report', error: error.message }));
    }
}

// @desc Get Active Users Report
// @route GET /api/reports/active-users
async function getActiveUsersReport(req, res) {
    try {
        const parsedUrl = url.parse(req.url, true);
        const query = parsedUrl.query;
        const data = await Report.activeUsersReport(query);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(data));
    } catch (error) {
        console.error("Error getting Active Users Report:", error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not fetch report', error: error.message }));
    }
}

// @desc Get Membership Report
// @route GET /api/reports/membership
async function getMembershipReport(req, res) {
    try {
        const parsedUrl = url.parse(req.url, true);
        const query = parsedUrl.query;
        const data = await Report.membershipReport(query);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(data));
    } catch (error) {
        console.error("Error getting Membership Report:", error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not fetch report', error: error.message }));
    }
}

// @desc Get Revenue Report
// @route GET /api/reports/revenue
async function getRevenueReport(req, res) {
    try {
        const parsedUrl = url.parse(req.url, true);
        const query = parsedUrl.query;
        const data = await Report.revenueReport(query);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(data));
    } catch (error) {
        console.error("Error getting Revenue Report:", error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not fetch report', error: error.message }));
    }
}

module.exports = {
    getPopularGenresReport,
    getPopularItemsReport,
    getOverdueItemsReport,
    getOutstandingFines,
    getActiveUsersReport,
    getMembershipReport,
    getRevenueReport
};
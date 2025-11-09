// controllers/reportController.js
const Report = require('../models/reportModel');
const { getPostData } = require('../utils');

// @desc Get Overdue Items Report
// @route GET /api/reports/overdue
async function getOverdueReport(req, res) {
    try {
        // TODO: Add Auth check - Staff only
        const reqPost = await getPostData(req);
        const reqFilters = JSON.parse(reqPost);
        const data = await Report.findOverdueItems(reqFilters);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(data));
    } catch (error) {
        console.error("Error getting Overdue Report:", error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not fetch report', error: error.message }));
    }
}

// @desc Get Most Popular Items Report
// @route GET /api/reports/popular
async function getPopularityReport(req, res) {
    try {
        // TODO: Add Auth check - Staff only
        // Optional: Get 'days' parameter from URL query string? e.g., /api/reports/popular?days=30
        const reqPost = await getPostData(req);
        const reqFilters = JSON.parse(reqPost);
        const data = await Report.findMostPopularItems(reqFilters);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(data));
    } catch (error) {
        console.error("Error getting Popularity Report:", error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not fetch report', error: error.message }));
    }
}

// @desc Get User Fine Summary Report
// @route GET /api/reports/fines
async function getFineReport(req, res) {
    try {
        // TODO: Add Auth check - Staff only
        const reqPost = await getPostData(req);
        const reqFilters = JSON.parse(reqPost);
        const data = await Report.findUsersWithOutstandingFines(reqFilters);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(data));
    } catch (error) {
        console.error("Error getting Fine Report:", error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not fetch report', error: error.message }));
    }
}

module.exports = {
    getOverdueReport,
    getPopularityReport,
    getFineReport
};
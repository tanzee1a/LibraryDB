// controllers/staffController.js
const Staff = require('../models/staffModel');

// @desc Get dashboard statistics
// @route GET /api/staff/dashboard-stats
async function getDashboardStats(req, res) {
    try {
        // TODO: Add Auth check - Staff only
        const stats = await Staff.getDashboardStats();
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(stats));
    } catch (error) {
        console.error("Error getting dashboard stats:", error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not fetch stats', error: error.message }));
    }
}

// @desc Get profile details for the "logged in" staff member
// @route GET /api/staff/my-profile 
async function getMyStaffProfile(req, res) {
    try {
        // TODO: Add Auth check - Staff only
        
        // !!! --- TEMPORARY --- !!!
        // Hardcode a known STAFF user_id for testing 
        // Ensure this user exists in USER table with role='Staff' AND in STAFF table
        const test_staff_user_id = 'A123456789013';
        // !!! ----------------- !!!

        const profile = await Staff.findStaffProfileById(test_staff_user_id);

        if (!profile) {
            res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ message: 'Staff profile not found' }));
        }

        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(profile));

    } catch (error) {
        console.error("Error in getMyStaffProfile:", error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not fetch staff profile', error: error.message }));
    }
}

module.exports = {
    getDashboardStats,
    getMyStaffProfile
};
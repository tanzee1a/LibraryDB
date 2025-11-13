// controllers/staffController.js
const Staff = require('../models/staffModel');

async function isUserStaff(userId) {
    return await Staff.checkStaffRole(userId); 
}

// @desc Get dashboard statistics
// @route GET /api/staff/dashboard-stats
async function getDashboardStats(req, res) {
    try {
        const logged_in_user_id = req.userId; 

        if (!logged_in_user_id || !(await isUserStaff(logged_in_user_id))) {
            res.writeHead(403, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ message: 'Forbidden: Staff access required.' }));
       }

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
        const logged_in_user_id = req.userId;
        if (!logged_in_user_id) {
            // If for some reason the ID is missing after auth, return unauthorized
            res.writeHead(401, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ message: 'Authentication required: User ID missing.' }));
       }
        const profile = await Staff.findStaffProfileById(logged_in_user_id);
        
        if (!(await isUserStaff(logged_in_user_id))) {
            res.writeHead(403, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ message: 'Forbidden: Staff access required.' }));
       }

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
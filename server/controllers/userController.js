// controllers/userController.js
const User = require('../models/userModel');
const { getPostData } = require('../utils');

// @desc Get profile details for the "logged in" user
// @route GET /api/my-profile
// NOTE: This function *requires* the 'protect' middleware to run first,
// which attaches the user's ID to req.userId.
async function getMyProfile(req, res) {
    try {
        // --- KEY CHANGE: Use the user ID attached by the 'protect' middleware ---
        // The 'protect' middleware should have verified the JWT and set req.userId
        const userId = req.userId; // Use req.userId instead of the temporary hardcoded ID

        if (!userId) {
            // This should ideally be caught by the middleware, but is a safe check
            res.writeHead(401, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ message: 'User not authenticated' }));
        }

        const user = await User.findById(userId);

        if (!user) {
            res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ message: 'User profile not found' }));
        }

        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(user));

    } catch (error) {
        console.error("Error in getMyProfile:", error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not fetch profile', error: error.message }));
    }
}

// --- ADDED: Get All Users (for Staff) ---
// @desc Get ALL user records (for Staff)
// @route GET /api/users
async function getAllUsers(req, res) {
    try {
        // TODO: Add Auth check - Staff only
        const users = await User.findAllUsers();
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(users));
    } catch (error) {
        console.error("Error getting all users:", error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not fetch users', error: error.message }));
    }
}

// --- ADDED: Staff Creates User ---
// @desc Staff creates a new user (Patron or Staff)
// @route POST /api/users
async function staffCreateUser(req, res) {
    try {
        // TODO: Add Auth check - Staff only
        const body = await getPostData(req);
        // Expecting firstName, lastName, email, role, temporaryPassword, user_id
        const userData = JSON.parse(body); 

        // Generate user_id if not provided (optional)
        if (!userData.user_id) {
             // Simple ID generation - consider a more robust method if needed
             userData.user_id = `U${Date.now()}`.substring(0, 13); 
        }

        const newUser = await User.staffCreateUser(userData);
        
        res.writeHead(201, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(newUser));

    } catch (error) {
        console.error("Error in staffCreateUser controller:", error);
        // Send 400 if it's a known error (like duplicate entry), 500 otherwise
        const statusCode = error.message.includes('already exists') ? 400 : 500;
        res.writeHead(statusCode, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); 
        res.end(JSON.stringify({ 
            message: 'Could not create user', 
            error: error.message 
        }));
    }
}

module.exports = {
    getMyProfile,
    getAllUsers,
    staffCreateUser
};
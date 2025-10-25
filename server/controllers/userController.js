// controllers/userController.js
const User = require('../models/userModel');

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

module.exports = {
    getMyProfile
};
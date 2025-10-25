// controllers/userController.js
const User = require('../models/userModel');

// @desc Get profile details for the "logged in" user
// @route GET /api/my-profile
async function getMyProfile(req, res) {
    try {
        // !!! --- TEMPORARY --- !!!
        // Use the same hardcoded user ID as your loan controller
        const test_user_id = 'U176124397339'; 
        // !!! ----------------- !!!

        const user = await User.findById(test_user_id);

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
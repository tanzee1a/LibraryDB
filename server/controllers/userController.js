// controllers/userController.js
const User = require('../models/userModel');
const { getPostData } = require('../utils');

// @desc Get profile details for the "logged in" user
// @route GET /api/my-profile
async function getMyProfile(req, res) {
    try {
        const userId = req.userId; 

        if (!userId) {
            res.writeHead(401, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ message: 'User not authenticated' }));
        }

        // --- *** THIS IS THE KEY CHANGE *** ---
        // Instead of the simple findById, we use the powerful findUserProfileById,
        // which now gets membership, fines, and suspension status.
        const userProfile = await User.findUserProfileById(userId);
        // --- *** END OF CHANGE *** ---

        if (!userProfile) {
            res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ message: 'User profile not found' }));
        }

        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(userProfile)); // Return the full profile

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
        const userData = await getPostData(req);
        // Expecting firstName, lastName, email, role, temporaryPassword, user_id
        // const userData = JSON.parse(body); 

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

// --- ADDED: Get Specific User Profile (for Staff) ---
// @desc Get detailed profile for a specific user ID
// @route GET /api/users/:userId
async function getUserProfile(req, res, userId) {
    try {
        // TODO: Add Auth check - Staff only
        const userProfile = await User.findUserProfileById(userId);

        if (!userProfile) {
            res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ message: 'User profile not found' }));
        }

        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(userProfile));

    } catch (error) {
        console.error(`Error in getUserProfile for ${userId}:`, error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not fetch user profile', error: error.message }));
    }
}

// --- ADDED: Get Borrow History for a specific User ---
// @desc Get borrow history list for a specific user ID
// @route GET /api/users/:userId/borrows
async function getUserBorrowHistory(req, res, userId) {
    try {
        // TODO: Add Auth check - Staff only or check if userId matches logged-in user
        const history = await User.findBorrowHistoryForUser(userId);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(history));
    } catch (error) {
        console.error(`Error getting borrow history for ${userId}:`, error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not fetch borrow history', error: error.message }));
    }
}

// --- ADDED: Get Hold History for a specific User ---
// @desc Get hold history list for a specific user ID
// @route GET /api/users/:userId/holds
async function getUserHoldHistory(req, res, userId) {
     try {
        // TODO: Add Auth check
        const history = await User.findHoldHistoryForUser(userId);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(history));
    } catch (error) {
        console.error(`Error getting hold history for ${userId}:`, error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not fetch hold history', error: error.message }));
    }
}

// --- ADDED: Get Fine History for a specific User ---
// @desc Get fine history list for a specific user ID
// @route GET /api/users/:userId/fines
async function getUserFineHistory(req, res, userId) {
      try {
        // TODO: Add Auth check
        const history = await User.findFineHistoryForUser(userId);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(history));
    } catch (error) {
        console.error(`Error getting fine history for ${userId}:`, error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not fetch fine history', error: error.message }));
    }
}

// @desc Staff updates a user's profile
// @route PUT /api/users/:userId
async function staffUpdateUser(req, res, userId) {
    try {
        // TODO: Add Auth check - Staff only
        const userData = await getPostData(req);
        // Gets { firstName, lastName, email, role } from frontend
        // const userData = JSON.parse(body); 

        const updatedUser = await User.staffUpdateUser(userId, userData);
        
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(updatedUser));

    } catch (error) {
        console.error(`Error updating user ${userId}:`, error);
        const statusCode = error.message.includes('exists') ? 400 : 500;
        res.writeHead(statusCode, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not update user', error: error.message }));
    }
}

// @desc Staff deletes a user
// @route DELETE /api/users/:userId
async function staffDeleteUser(req, res, userId) {
    try {
        // TODO: Add Auth check - Staff only
        const affectedRows = await User.staffDeleteUser(userId);

        if (affectedRows === 0) {
            res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ message: 'User not found' }));
        }

        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ message: `User ${userId} deleted` }));

    } catch (error) {
        console.error(`Error deleting user ${userId}:`, error);
        // Handle specific "cannot delete" error
        const statusCode = error.message.includes('Cannot delete user') ? 409 : 500; // 409 Conflict
        res.writeHead(statusCode, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not delete user', error: error.message }));
    }
}

async function changePassword(req, res) {
    try {
        const userId = req.userId; // Get user ID from the authentication token
        const body = await getPostData(req);
        // Expecting { currentPassword, newPassword } from the frontend
        const { currentPassword, newPassword } = JSON.parse(body); 

        if (!userId) {
            res.writeHead(401, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ message: 'User not authenticated' }));
        }
        
        if (!currentPassword || !newPassword) {
            res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ message: 'Missing current or new password' }));
        }

        // Call the model function to handle the password update logic
        const updateSuccessful = await User.changeUserPassword(userId, currentPassword, newPassword);

        if (!updateSuccessful) {
            // This usually means the current password didn't match
            res.writeHead(401, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ message: 'Current password incorrect' }));
        }

        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ message: 'Password updated successfully' }));

    } catch (error) {
        console.error("Error in changePassword:", error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not change password', error: error.message }));
    }
}



// Update exports
module.exports = {
    getMyProfile,
    getAllUsers,
    staffCreateUser,
    getUserProfile,
    getUserBorrowHistory, // <-- Add this
    getUserHoldHistory,   // <-- Add this
    getUserFineHistory,    // <-- Add this
    staffUpdateUser,
    staffDeleteUser,
    changePassword
};
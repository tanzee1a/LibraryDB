// controllers/userController.js
const User = require('../models/userModel');
const { getPostData } = require('../utils');
const url = require('url');

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
        const parsedUrl = url.parse(req.url, true);
        const searchTerm = parsedUrl.query.q || '';
        const sort = parsedUrl.query.sort || ''; //
        
        // Get ALL query params as filters
        const filters = parsedUrl.query;
        delete filters.q; // Remove search term from filters
        delete filters.sort;

        // Pass both searchTerm and filters object
        const users = await User.findAllUsers(searchTerm, filters, sort); 
        
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
        const body = await getPostData(req); // Get the raw JSON string

        let userData;
        
        // 🛑 FIX: Safely parse the body string into an object
        try {
            userData = JSON.parse(body);
        } catch (jsonError) {
             res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
             return res.end(JSON.stringify({ message: 'Invalid JSON format in request body.' }));
        }

        // Expecting firstName, lastName, email, role, temporaryPassword, user_id
        
        // Generate user_id if not provided (optional)
        if (!userData.user_id) {
             // Simple ID generation - consider a more robust method if needed
             userData.user_id = `U${Date.now()}`.substring(0, 13); 
        }

        const newUser = await User.staffCreateUser(userData);
        
        res.writeHead(201, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(newUser));

    } catch (error) {
        // ... (existing error handling) ...
        const statusCode = error.message.includes('already exists') || error.message.includes('Missing required fields') ? 400 : 500;
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
    let body;
    let userData;
    try {
        // 1. Get the raw request body string
        body = await getPostData(req); 

        try {
            userData = JSON.parse(body);
        } catch (jsonError) {
             res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
             return res.end(JSON.stringify({ message: 'Invalid JSON format in request body for user update.' }));
        }

        const updatedUser = await User.staffUpdateUser(userId, userData);
        
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        // Return the updated data structure
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

async function changeEmail(req, res) {
    try {
        const userId = req.userId;
        const body = await getPostData(req); // Now safely returns a raw JSON string or empty string
        
        let parsedData;
        
        if (!body) {
            res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ message: 'Request body is empty.' }));
        }
        
        try {
            // ✅ Parse the string here, in the controller
            parsedData = JSON.parse(body); 
        } catch (jsonError) {
             res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
             return res.end(JSON.stringify({ message: 'Invalid JSON format in request body.' }));
        }
        
        // Use the safely parsed data
        const { newEmail } = parsedData;

        if (!userId) {
            res.writeHead(401, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ message: 'User not authenticated' }));
        }

        const userProfile = await User.findUserProfileById(userId);

        if (!userProfile) {
             res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
             return res.end(JSON.stringify({ message: 'User profile not found' }));
        }

        // 🛑 STEP 2: Enforce the rule for Student and Faculty
        const userRole = userProfile.role;
        if (userRole === 'Student' || userRole === 'Faculty') {
            console.warn(`Denied email change for ${userRole}: ${userProfile.email}`);
            res.writeHead(403, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ 
                message: `Access Denied: ${userRole} accounts are not permitted to change their email. Please contact support.` 
            }));
        }
        
        // Basic email validation
        if (!newEmail || typeof newEmail !== 'string' || !newEmail.includes('@') || newEmail.length < 5) { 
            res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ message: 'Invalid new email provided' }));
        }

        // Call the model function to handle the email update logic
        const updateSuccessful = await User.changeUserEmail(userId, newEmail);

        if (!updateSuccessful) {
            // Model returned false, likely user not found (though protected)
            res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ message: 'User not found or email could not be updated.' }));ç
        }

        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ 
            message: 'Email updated successfully.' 
        }));

    } catch (error) {
        console.error("Error in changeEmail:", error);
        // Catch known unique constraint violation from model (400 Bad Request)
        const statusCode = error.message.includes('already exists') || error.message.includes('New email is the same') ? 400 : 500;
        res.writeHead(statusCode, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not change email', error: error.message }));
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
    changePassword,
    changeEmail
};
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
        const userProfile = await User.findUserProfileById(userId);

        if (!userProfile) {
            res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ message: 'User profile not found' }));
        }

        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(userProfile)); 

    } catch (error) {
        console.error("Error in getMyProfile:", error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not fetch profile', error: error.message }));
    }
}

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

// @desc Staff creates a new user (Patron or Staff)
// @route POST /api/users
async function staffCreateUser(req, res) {
    try {
        const body = await getPostData(req); 

        let userData;
        
        try {
            userData = JSON.parse(body);
        } catch (jsonError) {
             res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
             return res.end(JSON.stringify({ message: 'Invalid JSON format in request body.' }));
        }

        if (!userData.user_id) {
             userData.user_id = `U${Date.now()}`.substring(0, 13); 
        }

        const newUser = await User.staffCreateUser(userData);
        
        res.writeHead(201, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(newUser));

    } catch (error) {
        const statusCode = error.message.includes('already exists') || error.message.includes('Missing required fields') ? 400 : 500;
        res.writeHead(statusCode, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); 
        res.end(JSON.stringify({ 
            message: 'Could not create user', 
            error: error.message 
        }));
    }
}
// @desc Get detailed profile for a specific user ID
// @route GET /api/users/:userId
async function getUserProfile(req, res, userId) {
    try {
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

// @desc Get borrow history list for a specific user ID
// @route GET /api/users/:userId/borrows
async function getUserBorrowHistory(req, res, userId) {
    try {
        const history = await User.findBorrowHistoryForUser(userId);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(history));
    } catch (error) {
        console.error(`Error getting borrow history for ${userId}:`, error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not fetch borrow history', error: error.message }));
    }
}

// @desc Get hold history list for a specific user ID
// @route GET /api/users/:userId/holds
async function getUserHoldHistory(req, res, userId) {
     try {
        const history = await User.findHoldHistoryForUser(userId);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(history));
    } catch (error) {
        console.error(`Error getting hold history for ${userId}:`, error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not fetch hold history', error: error.message }));
    }
}

// @desc Get fine history list for a specific user ID
// @route GET /api/users/:userId/fines
async function getUserFineHistory(req, res, userId) {
      try {
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
        const loggedInUserId = req.userId; 
        if (userId === loggedInUserId) {
            res.writeHead(403, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ message: 'Access Denied: Staff cannot update their own account via this endpoint.' }));
        }

        body = await getPostData(req); 

        try {
            userData = JSON.parse(body);
        } catch (jsonError) {
             res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
             return res.end(JSON.stringify({ message: 'Invalid JSON format in request body for user update.' }));
        }

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

// @desc Staff deactivates a user (Soft Delete)
// @route DELETE /api/users/:userId
async function staffDeleteUser(req, res, userId) {
    try {
        const loggedInUserId = req.userId;
        if (userId === loggedInUserId) {
            res.writeHead(403, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ message: 'Access Denied: Staff cannot delete their own account.' }));
        }

        
        const affectedRows = await User.staffDeactivateUser(userId);

        if (affectedRows === 0) {
            res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ message: 'User not found' }));
        }

        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ message: `User ${userId} deactivated` }));

    } catch (error) {
        console.error(`Error deactivating user ${userId}:`, error);
        
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not deactivate user', error: error.message }));
    }
}

async function changePassword(req, res) {
    try {
        const userId = req.userId; 
        const body = await getPostData(req);
        const { currentPassword, newPassword } = JSON.parse(body); 

        if (!userId) {
            res.writeHead(401, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ message: 'User not authenticated' }));
        }
        
        if (!currentPassword || !newPassword) {
            res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ message: 'Missing current or new password' }));
        }

        const updateSuccessful = await User.changeUserPassword(userId, currentPassword, newPassword);

        if (!updateSuccessful) {
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
        const body = await getPostData(req); 
        
        let parsedData;
        
        if (!body) {
            res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ message: 'Request body is empty.' }));
        }
        
        try {
            parsedData = JSON.parse(body); 
        } catch (jsonError) {
             res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
             return res.end(JSON.stringify({ message: 'Invalid JSON format in request body.' }));
        }
        
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
            res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ message: 'User not found or email could not be updated.' }));ç
        }

        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ 
            message: 'Email updated successfully.' 
        }));

    } catch (error) {
        console.error("Error in changeEmail:", error);
        const statusCode = error.message.includes('already exists') || error.message.includes('New email is the same') ? 400 : 500;
        res.writeHead(statusCode, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not change email', error: error.message }));
    }
}


async function staffActivateUser(req, res, userId) {
    try {

        // Call the new model function
        const affectedRows = await User.staffActivateUser(userId);

        if (affectedRows === 0) {
            // This means "User not found"
            res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ message: 'User not found' }));
        }

        // Updated success message
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ message: `User ${userId} reactivated` }));

    } catch (error) {
        console.error(`Error activating user ${userId}:`, error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not activate user', error: error.message }));
    }
}



// Update exports
module.exports = {
    getMyProfile,
    getAllUsers,
    staffCreateUser,
    getUserProfile,
    getUserBorrowHistory, 
    getUserHoldHistory,   
    getUserFineHistory,    
    staffUpdateUser,
    staffDeleteUser,
    changePassword,
    changeEmail,
    staffActivateUser
};
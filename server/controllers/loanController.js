const Loan = require('../models/loanModel');
const { getPostData } = require('../utils');
const url = require('url');
const userModel = require('../models/userModel');


async function checkBorrowingEligibility(userId) {
    const userProfile = await userModel.findUserProfileById(userId);

    if (!userProfile) {
        throw new Error('User profile not found.');
    }

    // 1. Check for fine suspension (existing logic)
    if (userProfile.is_suspended) {
        throw new Error(`Borrowing suspended due to $${userProfile.total_fines.toFixed(2)} in outstanding fines.`);
    }

    // 2. Check for membership status (NEW MEMBERSHIP LOGIC)
    if (userProfile.requires_membership_fee) {
        // If they require a fee and are NOT 'active', deny the request
        if (userProfile.membership_status !== 'active') {
            
            let reason;
            if (userProfile.membership_status === 'expired') {
                reason = 'Your membership has expired.';
            } else if (userProfile.membership_status === 'canceled') {
                 reason = 'Your membership is not set to auto-renew.';
            } else {
                reason = 'Membership is required for this user role.'; // Includes 'new' status
            }

            throw new Error(`Borrowing denied. ${reason} Please activate or renew your membership.`);
        }
    }
    // If all checks pass, the function completes without throwing an error
}

// @desc User requests pickup for an available item
// @route POST /api/request/:itemId
// REQUIRES: protect middleware (sets req.userId)
async function requestPickup(req, res, itemId) {
    try {
        const userId = req.userId; // 🔑 Sourced from auth middleware
        await checkBorrowingEligibility(userId);
        const result = await Loan.requestPickup(itemId, userId);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(result));
    } catch (error) {
        console.error("Error in requestPickup controller:", error);
        // --- START FIX ---

        // Determine status code based on the error message
        // This gives you more specific HTTP responses
        let statusCode = 400; // Default to 400 Bad Request

        if (error.message.includes('Borrowing denied') || error.message.includes('Borrowing suspended')) {
            statusCode = 403; // 403 Forbidden
        } else if (error.message.includes('already have an active hold')) {
            statusCode = 409; // 409 Conflict (perfect for duplicates)
        } else if (error.message.includes('not found')) {
            statusCode = 404; // 404 Not Found
        }
        // 'Borrow limit' or 'not available' can stay as 400

        // Use the 'statusCode' variable you calculated
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });

        // Send the SPECIFIC error.message from the model as the primary message
        res.end(JSON.stringify({ message: error.message }));
    }
}

// @desc Staff checks out a pending hold
// @route POST /api/holds/:holdId/pickup
async function pickupHold(req, res, holdId) {
  try {
    const staff_user_id = 'U176124397339'; // TODO: replace with real staff auth
    const result = await Loan.pickupHold(Number(holdId), staff_user_id);
    res.writeHead(201, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(result));
  } catch (error) {
    console.error("Error in pickupHold controller:", error);
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Could not pickup hold', error: error.message }));
  }
}

// @desc Staff returns an item (scans borrow ID?)
// @route POST /api/return/:borrowId 
async function returnItem(req, res, borrowId) {
    try {
        const staff_user_id = 'U176124397339'; // TODO: replace with real staff auth
        const result = await Loan.returnItem(borrowId, staff_user_id);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(result));
    } catch (error) {
        console.error("Error in returnItem controller:", error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Could not return item', error: error.message }));
    }
}

// @desc Staff marks a loan as lost
// @route POST /api/borrows/:borrowId/lost
async function markLost(req, res, borrowId) {
  try {
    const staff_user_id = 'U176124397339'; // TODO: replace with staff auth
    const result = await Loan.markLost(borrowId, staff_user_id);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(result));
  } catch (error) {
    console.error("Error in markLost controller:", error);
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Could not mark lost', error: error.message }));
  }
}

// @desc Staff marks a lost loan as found
// @route POST /api/borrows/:borrowId/found
async function markFound(req, res, borrowId) {
  try {
    const staff_user_id = 'U176124397339'; // TODO: replace with real staff auth
    const result = await Loan.markFound(borrowId, staff_user_id);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(result));
  } catch (error) {
    console.error("Error in markFound controller:", error);
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Could not mark found', error: error.message }));
  }
}

// @desc User places a hold on an UNAVAILABLE item (Waitlist)
// @route POST /api/waitlist/:itemId
// REQUIRES: protect middleware (sets req.userId)
async function placeWaitlistHold(req, res, itemId) {
    try {
        const userId = req.userId; // 🔑 Sourced from auth middleware
        await checkBorrowingEligibility(userId);
        const result = await Loan.placeWaitlistHold(itemId, userId);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(result));
    } catch (error) {
        console.error("Error in placeWaitlistHold controller:", error);
        const statusCode = error.message.includes('Borrowing denied') || error.message.includes('Borrowing suspended') ? 403 : 400;
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Could not place on waitlist', error: error.message }));
    }
}

// --- GET Endpoints for User Dashboard ---

// @desc Get all active loans for the current user
// @route GET /api/my-loans
// REQUIRES: protect middleware (sets req.userId)
async function getMyLoans(req, res) {
    try {
        const userId = req.userId; // 🔑 Sourced from auth middleware
        const loans = await Loan.findLoansByUserId(userId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(loans));
    } catch (error) {
        console.error("Error in getMyLoans:", error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Could not fetch loans', error: error.message }));
    }
}

// @desc Get loan history for the current user
// @route GET /api/my-history
// REQUIRES: protect middleware (sets req.userId)
async function getMyHistory(req, res) {
    try {
        const userId = req.userId; // 🔑 Sourced from auth middleware
        const history = await Loan.findLoanHistoryByUserId(userId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(history));
    } catch (error) {
        console.error("Error in getMyHistory:", error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Could not fetch history', error: error.message }));
    }
}

// @desc Get active holds (pickup requests) for the current user
// @route GET /api/my-holds
// REQUIRES: protect middleware (sets req.userId)
async function getMyHolds(req, res) {
    try {
        const userId = req.userId; // 🔑 Sourced from auth middleware
        const holds = await Loan.findHoldsByUserId(userId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(holds));
    } catch (error) {
        console.error("Error in getMyHolds:", error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Could not fetch holds', error: error.message }));
    }
}

// @desc Get waitlist items for the current user
// @route GET /api/my-waitlist
// REQUIRES: protect middleware (sets req.userId)
async function getMyWaitlist(req, res) {
    try {
        const userId = req.userId; // 🔑 Sourced from auth middleware
        const waitlist = await Loan.findWaitlistByUserId(userId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(waitlist));
    } catch (error) {
        console.error("Error in getMyWaitlist:", error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Could not fetch waitlist', error: error.message }));
    }
}

// @desc Get fines for the current user
// @route GET /api/my-fines
// REQUIRES: protect middleware (sets req.userId)
async function getMyFines(req, res) {
    try {
        const userId = req.userId; // 🔑 Sourced from auth middleware
        const fines = await Loan.findFinesByUserId(userId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(fines));
    } catch (error) {
        console.error("Error in getMyFines:", error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Could not fetch fines', error: error.message }));
    }
}

// @desc Staff marks a fine as paid
// @route POST /api/fines/:fineId/pay
async function payFine(req, res, fineId) {
    try {
        const staff_user_id = 'U176124397339'; // TODO: replace with staff auth
        const result = await Loan.payFine(Number(fineId), staff_user_id);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(result));
    } catch (error) {
        console.error("Error in payFine controller:", error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Could not pay fine', error: error.message }));
    }
}

// @desc User pays one of their own outstanding fines
// @route POST /api/my-fines/:fineId/pay
// REQUIRES: protect middleware (sets req.userId)
async function userPayFine(req, res, fineId) {
    try {
        const userId = req.userId; // 泊 Sourced from auth middleware
        
        // Use the new model function, passing both fineId and userId
        const result = await Loan.userPayFine(Number(fineId), userId);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(result));
    } catch (error) {
        console.error("Error in userPayFine controller:", error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Could not pay fine', error: error.message }));
    }
}

// @desc Staff waives a fine
// @route POST /api/fines/:fineId/waive
async function waiveFine(req, res, fineId) {
    try {
        const staff_user_id = 'U176124397339'; // TODO: replace with staff auth
        
        // Reason must be sent in the request body
        const body = await getPostData(req);
        const { reason } = JSON.parse(body);
        if (!reason) {
           throw new Error('Waive reason is required.');
        }

        const result = await Loan.waiveFine(Number(fineId), reason, staff_user_id);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(result));
    } catch (error) {
        console.error("Error in waiveFine controller:", error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Could not waive fine', error: error.message }));
    }
}

// @desc Get ALL borrow records (for Staff)
// @route GET /api/borrows
async function getAllBorrows(req, res) {
    try {

        const parsedUrl = url.parse(req.url, true);
        const searchTerm = parsedUrl.query.q || '';
        const sort = parsedUrl.query.sort || 'borrow_newest'; // Default sort
        const filters = parsedUrl.query;
        delete filters.q;
        delete filters.sort;
        
        const borrows = await Loan.findAllBorrows(searchTerm, filters, sort);

        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(borrows));
    } catch (error) {
        console.error("Error in getAllBorrows:", error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not fetch borrow records', error: error.message }));
    }
}

// @desc Get ALL status of a given type.
// @route GET /api/status/type
async function getAllStatus(req, res) {
    try {
        const parsedUrl = url.parse(req.url, true);
        const type = parsedUrl.pathname.split('/').pop();
        const status = await Loan.findAllStatus(type);
        if (status === null) {
            res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ message: 'Invalid status type' }));
        }
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(status));
    } catch (error) {
        console.error("Error in getAllStatus:", error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not fetch status records', error: error.message }));
    }
}

// @desc Get ALL holds (active and historical) for Staff
// @route GET /api/holds
async function getAllHolds(req, res) {
    try {
        const parsedUrl = url.parse(req.url, true);
        const filters = parsedUrl.query;
        
        // --- ADDED: Log received filters ---
        console.log("getAllHolds controller: Received request. Filters:", filters); 
        // --- END ADDED ---

        const holds = await Loan.findAllHolds(filters); 
        
        console.log("getAllHolds controller: Sending response. Count:", holds.length); // Added count
        res.writeHead(200, { /* ... headers ... */ });
        return res.end(JSON.stringify(holds));
    } catch (error) {
         console.error("Error in getAllHolds:", error); // Make sure error is logged
        res.writeHead(500, { /* ... error headers ... */ });
        res.end(JSON.stringify({ message: 'Could not fetch holds', error: error.message }));
    }
}
// @desc Staff cancels a hold
// @route POST /api/holds/:holdId/cancel
async function cancelHold(req, res, holdId) {
    try {
        // TODO: Add Auth check - Staff only
        const staff_user_id = 'STAFF_ID_PLACEHOLDER'; // Replace with real staff auth later
        const result = await Loan.cancelHold(Number(holdId), staff_user_id);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(result));
    } catch (error) {
        console.error("Error canceling hold:", error);
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); // 400 if hold not found/valid
        res.end(JSON.stringify({ message: 'Could not cancel hold', error: error.message }));
    }
}

// @desc Staff directly checks out an item
// @route POST /api/borrows/checkout
async function staffCheckoutItem(req, res) {
    try {
        // TODO: Add Auth check - Staff only
        const staff_user_id = 'STAFF_ID_PLACEHOLDER'; // Replace with real staff auth later

        const body = await getPostData(req);
        const { userEmail, itemId } = JSON.parse(body); // Get IDs from request body

        if (!userEmail || !itemId) {
            throw new Error('User Email and Item ID are required.');
        }

        const result = await Loan.staffCheckoutItem(itemId, userEmail, staff_user_id);
        
        res.writeHead(201, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(result));

    } catch (error) {
        console.error("Error in staffCheckoutItem controller:", error);
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); // 400 for bad input/unavailable item
        res.end(JSON.stringify({ 
            message: 'Could not checkout item', 
            error: error.message 
        }));
    }
}

// --- ADDED: Get All Fines (for Staff) ---
// @desc Get ALL fine records (for Staff)
// @route GET /api/fines
async function getAllFines(req, res) {
    try {
        // TODO: Add Auth check - Staff only
        // TODO: Get filter parameters from req.url query string
        const fines = await Loan.findAllFines(/* pass filters */);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(fines));
    } catch (error) {
        console.error("Error getting all fines:", error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not fetch fines', error: error.message }));
    }
}

// --- ADDED: Staff Manually Creates Fine ---
// @desc Staff manually adds a new fine
// @route POST /api/fines
async function staffCreateFine(req, res) {
    try {
        // TODO: Add Auth check - Staff only
        const staff_user_id = 'STAFF_ID_PLACEHOLDER'; // Auth placeholder

        const body = await getPostData(req);
        // Expecting borrow_id, user_id, fee_type, amount, notes
        const fineData = (typeof body === 'string') ? JSON.parse(body) : body; 

        const newFine = await Loan.staffCreateFine(fineData, staff_user_id);
        
        res.writeHead(201, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(newFine));

    } catch (error) {
        console.error("Error in staffCreateFine controller:", error);
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); // 400 for bad input
        res.end(JSON.stringify({ 
            message: 'Could not create fine', 
            error: error.message 
        }));
    }
}

// @desc    User cancels their *own* active hold
// @route   DELETE /api/holds/:holdId
// REQUIRES: protect middleware (sets req.userId)
async function cancelMyHold(req, res, holdId) {
  try {
    const userId = req.userId; // 🔑 Sourced from auth middleware

    // Call the model function from your Loan model
    const result = await Loan.cancelMyHold(Number(holdId), userId);

    // 200 OK - successfully deleted/canceled
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(result));

  } catch (error) {
    console.error("Error in cancelMyHold controller:", error);
    
    let statusCode = 400; // Bad Request
    
    // Send 404 if the hold wasn't found or didn't belong to the user
    if (error.message.toLowerCase().includes('not found')) {
        statusCode = 404; // Not Found
    }

    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Could not cancel hold', error: error.message }));
  }
}


module.exports = {
    requestPickup,
    pickupHold,
    returnItem,
    markLost,
    markFound,
    placeWaitlistHold,
    getMyLoans,
    getMyHistory,
    getMyHolds,
    getMyWaitlist,
    getMyFines,
    payFine,
    userPayFine,
    waiveFine,
    getAllBorrows,
    getAllHolds,
    cancelHold,
    staffCheckoutItem,
    getAllFines,
    staffCreateFine,
    getAllStatus,
    cancelMyHold
};
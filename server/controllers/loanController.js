const Loan = require('../models/loanModel');
const { getPostData } = require('../utils'); // We need this for waiveFine reason

// @desc User requests pickup for an available item
// @route POST /api/request/:itemId
// REQUIRES: protect middleware (sets req.userId)
async function requestPickup(req, res, itemId) {
    try {
        const userId = req.userId; // 🔑 Sourced from auth middleware
        const result = await Loan.requestPickup(itemId, userId);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(result));
    } catch (error) {
        console.error("Error in requestPickup controller:", error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Could not request pickup', error: error.message }));
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

// @desc User places a hold on an UNAVAILABLE item (Waitlist)
// @route POST /api/waitlist/:itemId
// REQUIRES: protect middleware (sets req.userId)
async function placeWaitlistHold(req, res, itemId) {
    try {
        const userId = req.userId; // 🔑 Sourced from auth middleware
        const result = await Loan.placeWaitlistHold(itemId, userId);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(result));
    } catch (error) {
        console.error("Error in placeWaitlistHold controller:", error);
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


module.exports = {
    requestPickup,
    pickupHold,
    returnItem,
    markLost,
    placeWaitlistHold,
    getMyLoans,
    getMyHistory,
    getMyHolds, // Added
    getMyWaitlist,
    getMyFines, // Added
    payFine,    // Added
    waiveFine   // Added
};
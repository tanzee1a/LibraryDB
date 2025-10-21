const Loan = require('../models/loanModel');

// @desc Borrow an item
// @route POST /api/borrow/:id
async function borrowItem(req, res, id) {
    try {
        // TEMPORARY!!!!!!!!!!!!!
        // Hardcode the user_id for testing
        // This will be replaced by a real, logged-in user ID
        const test_user_id = 's123456'; 
        // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        
        const result = await Loan.borrowItem(id, test_user_id);
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(result));

    } catch (error) {
        console.error("Error in borrowItem controller:", error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            message: 'Could not borrow item', 
            error: error.message 
        }));
    }
}

// @desc Return an item
// @route POST /api/return/:id
async function returnItem(req, res, id) {
    try {
        // !!! TEMPORARY!!!!!!!!!!!! !!!
        const test_user_id = 's123456'; 
        // !!! !!!!!!!!!!!!!!!!!!!!!! !!!

        const result = await Loan.returnItem(id, test_user_id);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(result));

    } catch (error) {
        console.error("Error in returnItem controller:", error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            message: 'Could not return item', 
            error: error.message 
        }));
    }
}


// @desc Place a hold on an item
// @route POST /api/hold/:id
async function holdItem(req, res, id) {
    try {
        // !!!!!!!!!!!!TEMPORARY!!!!!!!!!!!!
        const test_user_id = 's123456'; 
        // !!!!!!!!!!!!!!!!!!!!!!!!
        
        const result = await Loan.holdItem(id, test_user_id);
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(result));

    } catch (error) {
        console.error("Error in holdItem controller:", error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            message: 'Could not place hold', 
            error: error.message 
        }));
    }
}

// @desc Get all active loans for the current user
// @route GET /api/my-loans
async function getMyLoans(req, res) {
    try {
        const test_user_id = 's123456'; // Uses your test user
        const loans = await Loan.findLoansByUserId(test_user_id);
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
async function getMyHistory(req, res) {
    try {
        const test_user_id = 's123456'; 
        const history = await Loan.findLoanHistoryByUserId(test_user_id);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(history));
    } catch (error) {
        console.error("Error in getMyHistory:", error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Could not fetch history', error: error.message }));
    }
}

// @desc Get waitlist for the current user
// @route GET /api/my-waitlist
async function getMyWaitlist(req, res) {
    try {
        const test_user_id = 's123456'; 
        const waitlist = await Loan.findWaitlistByUserId(test_user_id);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(waitlist));
    } catch (error) {
        console.error("Error in getMyWaitlist:", error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Could not fetch waitlist', error: error.message }));
    }
}


module.exports = {
    borrowItem,
    returnItem,
    holdItem,
    getMyLoans,
    getMyHistory,
    getMyWaitlist
};
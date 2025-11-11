const Membership = require('../models/membershipModel');
const { getPostData } = require('../utils.js');

// @desc    Sign up for a new membership
// @route   POST /api/membership/signup
// REQUIRES: protect middleware (sets req.userId)
async function signup(req, res) {
    let bodyString;
    let userData;
    try {
        bodyString = await getPostData(req);
        
        // 🛑 CRITICAL FIX: Parse the body string into an object 🛑
        try {
            userData = JSON.parse(bodyString);
        } catch (jsonError) {
             res.writeHead(400, { 'Content-Type': 'application/json' });
             return res.end(JSON.stringify({ message: 'Invalid JSON format in request body.' }));
        }
        
        const userId = req.userId;
        // userData is now an object: { name, cardNumber, expDate, cvv, billingAddress }
        const result = await Membership.create(userId, userData);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(result));
    } catch (error) {
        console.error("Error signing up for membership:", error);
        // Use 400 for input validation errors
        const statusCode = error.message.includes('required') ? 400 : 500;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Could not sign up for membership', error: error.message }));
    }
}

// @desc    Cancel a membership (turn off auto-renew)
// @route   POST /api/membership/cancel
// REQUIRES: protect middleware (sets req.userId)
async function cancel(req, res) {
    try {
        const userId = req.userId;
        const result = await Membership.cancel(userId);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(result));
    } catch (error) {
        console.error("Error canceling membership:", error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Could not cancel membership', error: error.message }));
    }
}

// @desc    Renew a membership
// @route   POST /api/membership/renew
// REQUIRES: protect middleware (sets req.userId)
async function renew(req, res) {
    try {
        const userId = req.userId;
        const result = await Membership.renew(userId);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(result));
    } catch (error) {
        console.error("Error renewing membership:", error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Could not renew membership', error: error.message }));
    }
}

module.exports = {
    signup,
    cancel,
    renew
};
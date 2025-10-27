const Wishlist = require('../models/wishlistModel');

// @desc Add item to user's wishlist
// @route POST /api/wishlist/:itemId
// REQUIRES: protect middleware (sets req.userId)
async function saveItem(req, res, itemId) {
    try {
        // 🔑 Use the user ID attached to the request by the protect middleware
        const userId = req.userId; 
        const result = await Wishlist.add(userId, itemId);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(result));
    } catch (error) {
        console.error("Error saving item:", error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Could not save item', error: error.message }));
    }
}

// @desc Remove item from user's wishlist
// @route DELETE /api/wishlist/:itemId
// REQUIRES: protect middleware (sets req.userId)
async function unsaveItem(req, res, itemId) {
     try {
        // 🔑 Use the user ID attached to the request by the protect middleware
        const userId = req.userId;
        const result = await Wishlist.remove(userId, itemId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(result));
    } catch (error) {
        console.error("Error unsaving item:", error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Could not unsave item', error: error.message }));
    }
}

// @desc Get user's wishlist
// @route GET /api/my-wishlist
// REQUIRES: protect middleware (sets req.userId)
async function getMyWishlist(req, res) {
    try {
        // 🔑 Use the user ID attached to the request by the protect middleware
        const userId = req.userId;
        const wishlist = await Wishlist.findByUserId(userId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(wishlist));
    } catch (error) {
        console.error("Error getting wishlist:", error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Could not fetch wishlist', error: error.message }));
    }
}

module.exports = {
    saveItem,
    unsaveItem,
    getMyWishlist
};
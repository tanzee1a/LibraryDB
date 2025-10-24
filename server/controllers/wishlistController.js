const Wishlist = require('../models/wishlistModel');

// @desc Add item to user's wishlist
// @route POST /api/wishlist/:itemId
async function saveItem(req, res, itemId) {
    try {
        const test_user_id = 'U176124397339'; // TODO: Replace with real user ID from auth
        const result = await Wishlist.add(test_user_id, itemId);
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
async function unsaveItem(req, res, itemId) {
     try {
        const test_user_id = 'U176124397339'; // TODO: Replace with real user ID from auth
        const result = await Wishlist.remove(test_user_id, itemId);
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
async function getMyWishlist(req, res) {
    try {
        const test_user_id = 'U176124397339'; // TODO: Replace with real user ID from auth
        const wishlist = await Wishlist.findByUserId(test_user_id);
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
// controllers/searchController.js
const url = require('url'); // Need this to parse query parameters
const Search = require('../models/searchModel');
const Item = require('../models/itemModel');

// @desc Search items based on query and filters
// @route GET /api/search?q=searchTerm&filter1=value1...
async function searchItems(req, res) {
    try {
        const parsedUrl = url.parse(req.url, true);
        const searchTerm = parsedUrl.query.q || ''; // Get the 'q' parameter
        const filters = parsedUrl.query; // Get all query params as potential filters
        delete filters.q; // Remove 'q' itself from filters object

        // // Basic validation
        // if (!searchTerm.trim()) {
        //    // Return empty results or maybe popular items if search is empty?
        //    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        //    return res.end(JSON.stringify([]));
        // }

        //Returns all items if search term is empty, else performs search with filters
        const results = !searchTerm.trim() ? await Item.findAll() : await Search.searchItems(searchTerm, filters);

        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify(results));

    } catch (error) {
        console.error("Error in searchItems controller:", error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Search failed', error: error.message }));
    }
}

module.exports = { searchItems };
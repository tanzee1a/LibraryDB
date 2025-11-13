// controllers/searchController.js
const url = require('url'); // Need this to parse query parameters
const Search = require('../models/searchModel');
const Item = require('../models/itemModel');
const { exit } = require('process');

// @desc Search items based on query and filters
// @route GET /api/search?q=searchTerm&filter1=value1...
async function searchItems(req, res) {
    try {
        const parsedUrl = url.parse(req.url, true);
        const searchTerm = parsedUrl.query.q || ''; // Get the 'q' parameter
        const searchType = parsedUrl.query.searchType || 'Description';
        const filters = parsedUrl.query; // Get all query params as potential filters
        delete filters.q; // Remove 'q' itself from filters object
        delete filters.searchType // Remove 'searchType' itself from filters object


        const results = await Search.searchItems(searchTerm, filters, searchType);

        // 3. If no basic results, return empty
        if (!results || results.length === 0) {
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify([]));
        }

        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify(results));

    } catch (error) {
        console.error("Error in searchItems controller:", error); 
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); 
        res.end(JSON.stringify({ message: 'Search failed', error: error.message })); 
    }
}

module.exports = { searchItems };
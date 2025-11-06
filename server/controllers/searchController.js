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
        const filters = parsedUrl.query; // Get all query params as potential filters
        delete filters.q; // Remove 'q' itself from filters object

        const basicResults = await Search.searchItems(searchTerm, filters);

        // 3. If no basic results, return empty
        if (!basicResults || basicResults.length === 0) {
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify([]));
        }

        // 4. "Hydrate" the basic results with full details using Item.findById
        const detailedResults = await Promise.all(
            basicResults.map(item => Item.findById(item.item_id)) //
        );

        // 5. Send the new, detailed results array
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify(detailedResults));

    } catch (error) {
        console.error("Error in searchItems controller:", error); //
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); //
        res.end(JSON.stringify({ message: 'Search failed', error: error.message })); //
    }
}

module.exports = { searchItems };
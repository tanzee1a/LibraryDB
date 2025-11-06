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

        let basicResults = []; // Initialize as empty array

        // // Only perform a search if a search term is provided
        // if (searchTerm.trim()) {
        //     // Step 1: Get the basic search results from your search model
        //     // This returns an array like [{item_id: '...'}, {item_id: '...'}]
        //      //
        // } else {
        //      // If no search term, return empty array immediately.
        //     res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        //     return res.end(JSON.stringify([]));
        // }

        basicResults = await Search.searchItems(searchTerm, filters);
        
        // Step 2: If no basic results, return empty array
        if (!basicResults || basicResults.length === 0) {
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify([]));
        }

        // Step 3: "Hydrate" the basic results with full details
        // We loop over each basic result and call Item.findById() for it.
        // Promise.all() waits for all database calls to finish.
        const detailedResults = await Promise.all(
            basicResults.map(item => Item.findById(item.item_id)) //
        );

        // Step 4: Send the new, detailed results array
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify(detailedResults)); // <-- Send the hydrated, detailed results

        } catch (error) {
        console.error("Error in searchItems controller:", error); //
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); //
        res.end(JSON.stringify({ message: 'Search failed', error: error.message })); //
        }
}

module.exports = { searchItems };
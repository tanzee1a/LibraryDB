const url = require('url');
const Search = require('../models/searchModel');
const Item = require('../models/itemModel');
const { exit } = require('process');

// @desc Search items based on query and filters
// @route GET /api/search?q=searchTerm&filter1=value1...
async function searchItems(req, res) {
    try {
        const parsedUrl = url.parse(req.url, true);
        const searchTerm = parsedUrl.query.q || ''; 
        const searchType = parsedUrl.query.searchType || 'Description';

        const filters = parsedUrl.query; 
        const view = parsedUrl.query.view || 'user';
        delete filters.q; 
        delete filters.searchType // Remove 'searchType' itself from filters object
        delete filters.view;


        const results = await Search.searchItems(searchTerm, filters, searchType, view);

        // 2. If no results, return empty
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
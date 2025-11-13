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
        delete filters.q; 
        delete filters.searchType // Remove 'searchType' itself from filters object


        const basicResults = await Search.searchItems(searchTerm, filters, searchType);

        if (!basicResults || basicResults.length === 0) {
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify([]));
        }

        const detailedResults = await Promise.all(
            basicResults.map(item => Item.findById(item.item_id)) //
        );

        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify(detailedResults));

    } catch (error) {
        console.error("Error in searchItems controller:", error); //
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); //
        res.end(JSON.stringify({ message: 'Search failed', error: error.message })); //
    }
}

module.exports = { searchItems };
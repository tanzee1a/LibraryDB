const http = require('http');
const { getItems, getItem, createBook, deleteItem } = require('./controllers/itemController');

const server = http.createServer((req, res) => {
    if(req.url === '/api/items' && req.method === 'GET') {
        getItems(req, res);
    } 
    // route finds any item by its ID
    else if(req.url.match(/\/api\/items\/([a-zA-Z0-9-]+)/) && req.method === 'GET') {
        const id = req.url.split('/')[3];
        getItem(req, res, id);
    } 
    // route for creating a BOOK
    else if (req.url === '/api/items/book' && req.method === 'POST' ) {
        createBook(req,res);
    } 
    // (need to add routes for updateBook, createMovie, etc.)
    else if(req.url.match(/\/api\/items\/([a-zA-Z0-9-]+)/) && req.method === 'DELETE') {
        const id = req.url.split('/')[3];
        deleteItem(req, res, id);
    } 
    else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({message: 'Route not found'}));
    }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
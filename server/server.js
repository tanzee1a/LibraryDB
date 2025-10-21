const http = require('http');
const { getItems, getItem, createBook, deleteItem, updateBook, createMovie, updateMovie, createDevice, updateDevice } = require('./controllers/itemController');
const { borrowItem, returnItem, holdItem, getMyLoans, getMyHistory,getMyWaitlist } = require('./controllers/loanController');

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
    } // update book
    else if(req.url.match(/\/api\/items\/book\/([a-zA-Z0-9-]+)/) && req.method === 'PUT') {
        const id = req.url.split('/')[4]; // Note: The ID is at index 4 now
        updateBook(req, res, id);
    } // Create movie
    else if (req.url === '/api/items/movie' && req.method === 'POST' ) {
        createMovie(req,res);
    } 
    // Update movie
    else if(req.url.match(/\/api\/items\/movie\/([a-zA-Z0-9-]+)/) && req.method === 'PUT') {
        const id = req.url.split('/')[4]; 
        updateMovie(req, res, id);
    }
    // Create device
    else if (req.url === '/api/items/device' && req.method === 'POST' ) {
        createDevice(req,res);
    } 
    // Update device
    else if(req.url.match(/\/api\/items\/device\/([a-zA-Z0-9-]+)/) && req.method === 'PUT') {
        const id = req.url.split('/')[4]; 
        updateDevice(req, res, id);
    }
    // Borrow an item
    else if (req.url.match(/\/api\/borrow\/([a-zA-Z0-9-]+)/) && req.method === 'POST') {
        const id = req.url.split('/')[3];
        borrowItem(req, res, id);
    }
    // Return an item
    else if (req.url.match(/\/api\/return\/([a-zA-Z0-9-]+)/) && req.method === 'POST') {
        const id = req.url.split('/')[3];
        returnItem(req, res, id);

    } // hold item
    else if (req.url.match(/\/api\/hold\/([a-zA-Z0-9-]+)/) && req.method === 'POST') {
        const id = req.url.split('/')[3];
        holdItem(req, res, id);
    }
    else if (req.url === '/api/my-loans' && req.method === 'GET') {
        getMyLoans(req, res);
    }
    // Get My Loan History
    else if (req.url === '/api/my-history' && req.method === 'GET') {
        getMyHistory(req, res);
    }
    // Get My Waitlist
    else if (req.url === '/api/my-waitlist' && req.method === 'GET') {
        getMyWaitlist(req, res);
    }
     // Generic delete for item
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
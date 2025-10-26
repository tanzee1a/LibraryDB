const http = require('http');

// Import controllers
const { 
    getItems, getItem, 
    createBook, updateBook, 
    createMovie, updateMovie, 
    createDevice, updateDevice,
    deleteItem 
} = require('./controllers/itemController');

const { 
    requestPickup, pickupHold, returnItem, markLost, placeWaitlistHold, 
    getMyLoans, getMyHistory, getMyHolds, getMyWaitlist, getMyFines,
    payFine, waiveFine
} = require('./controllers/loanController');

const { registerUser, loginUser } = require('./controllers/loginRegisterController');
const { saveItem, unsaveItem, getMyWishlist } = require('./controllers/wishlistController');
const { getMyProfile } = require('./controllers/userController');
const { searchItems } = require('./controllers/searchController');
const { protect } = require('./middleware/authMiddleware'); // <--- ADD THIS IMPORT

const server = http.createServer((req, res) => {
    // --- CORS Headers ---
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // --- Routing ---
    try {
        // --- Item Routes --- (Unchanged)
        if (req.url === '/api/items' && req.method === 'GET') {
            getItems(req, res);
        } else if (req.url.match(/^\/api\/items\/([a-zA-Z0-9-]+)$/) && req.method === 'GET') {
            const id = req.url.split('/')[3];
            getItem(req, res, id);
        } else if (req.url === '/api/items/book' && req.method === 'POST') {
            createBook(req, res);
        } else if (req.url.match(/^\/api\/items\/book\/([a-zA-Z0-9-]+)$/) && req.method === 'PUT') {
            const id = req.url.split('/')[4];
            updateBook(req, res, id);
        } else if (req.url === '/api/items/movie' && req.method === 'POST') {
            createMovie(req, res);
        } else if (req.url.match(/^\/api\/items\/movie\/([a-zA-Z0-9-]+)$/) && req.method === 'PUT') {
            const id = req.url.split('/')[4];
            updateMovie(req, res, id);
        } else if (req.url === '/api/items/device' && req.method === 'POST') {
            createDevice(req, res);
        } else if (req.url.match(/^\/api\/items\/device\/([a-zA-Z0-9-]+)$/) && req.method === 'PUT') {
            const id = req.url.split('/')[4];
            updateDevice(req, res, id);
        } else if (req.url.match(/^\/api\/items\/([a-zA-Z0-9-]+)$/) && req.method === 'DELETE') {
            const id = req.url.split('/')[3];
            deleteItem(req, res, id);
        }

        // --- Loan/Hold/Waitlist Routes (User Actions) ---
        else if (req.url.match(/^\/api\/request\/([a-zA-Z0-9-]+)$/) && req.method === 'POST') {
            const itemId = req.url.split('/')[3];
            // FIX: Ensure req and res are passed to the controller
            protect(req, res, (req, res) => requestPickup(req, res, itemId)); 
        } else if (req.url.match(/^\/api\/holds\/([0-9]+)\/pickup$/) && req.method === 'POST') {
            const holdId = req.url.split('/')[3];
            // FIX: Wrap staff routes in protect too (assuming staff is logged in)
            protect(req, res, (req, res) => pickupHold(req, res, holdId)); 
        } else if (req.url.match(/^\/api\/return\/([A-Za-z0-9-]+)$/) && req.method === 'POST') {
            const borrowId = req.url.split('/')[3];
            protect(req, res, (req, res) => returnItem(req, res, borrowId)); 
        } else if (req.url.match(/^\/api\/borrows\/([A-Za-z0-9-]+)\/lost$/) && req.method === 'POST') {
            const borrowId = req.url.split('/')[3];
            protect(req, res, (req, res) => markLost(req, res, borrowId)); 
        } else if (req.url.match(/^\/api\/waitlist\/([a-zA-Z0-9-]+)$/) && req.method === 'POST') {
            const itemId = req.url.split('/')[3];
            // FIX: Ensure req and res are passed to the controller
            protect(req, res, (req, res) => placeWaitlistHold(req, res, itemId)); 
        }

        // --- User Data Routes (My- Routes) ---
        else if (req.url === '/api/my-loans' && req.method === 'GET') {
            // FIX: Correctly wrap the controller function
            protect(req, res, (req, res) => getMyLoans(req, res));
        } else if (req.url === '/api/my-history' && req.method === 'GET') {
            // FIX: Correctly wrap the controller function (This fixes your primary error)
            protect(req, res, (req, res) => getMyHistory(req, res)); 
        } else if (req.url === '/api/my-holds' && req.method === 'GET') {
            // FIX: Correctly wrap the controller function
            protect(req, res, (req, res) => getMyHolds(req, res)); 
        } else if (req.url === '/api/my-waitlist' && req.method === 'GET') {
            // FIX: Correctly wrap the controller function
            protect(req, res, (req, res) => getMyWaitlist(req, res)); 
        } else if (req.url === '/api/my-fines' && req.method === 'GET') {
            // FIX: Correctly wrap the controller function
            protect(req, res, (req, res) => getMyFines(req, res)); 
        }
        // Get My Profile
        else if (req.url === '/api/my-profile' && req.method === 'GET') {
            // FIX: Correctly wrap the controller function
            protect(req, res, (req, res) => getMyProfile(req, res));
        }
        
        // --- Fine Management Routes (Staff) ---
         else if (req.url.match(/^\/api\/fines\/([0-9]+)\/pay$/) && req.method === 'POST') {
            const fineId = req.url.split('/')[3];
            protect(req, res, (req, res) => payFine(req, res, fineId));
        } else if (req.url.match(/^\/api\/fines\/([0-9]+)\/waive$/) && req.method === 'POST') {
            const fineId = req.url.split('/')[3];
            protect(req, res, (req, res) => waiveFine(req, res, fineId));
        }

        // --- Wishlist Routes ---
        else if (req.url.match(/^\/api\/wishlist\/([a-zA-Z0-9-]+)$/) && req.method === 'POST') {
            const itemId = req.url.split('/')[3];
            protect(req, res, (req, res) => saveItem(req, res, itemId));
        } else if (req.url.match(/^\/api\/wishlist\/([a-zA-Z0-9-]+)$/) && req.method === 'DELETE') {
            const itemId = req.url.split('/')[3];
            protect(req, res, (req, res) => unsaveItem(req, res, itemId));
        } else if (req.url === '/api/my-wishlist' && req.method === 'GET') {
            protect(req, res, (req, res) => getMyWishlist(req, res));
        }

        // --- Auth Routes --- (Unchanged, not protected)
        else if (req.url === '/api/register' && req.method === 'POST') {
            registerUser(req, res);
        } else if (req.url === '/api/login' && req.method === 'POST') {
            loginUser(req, res);
        } 

        // --- Search Route --- (Unchanged, not protected)
        else if (req.url.startsWith('/api/search') && req.method === 'GET') {
            searchItems(req, res);
        }
        
        // --- Not Found ---
        else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Route not found' }));
        }
    } catch (error) {
        // Generic server error handler
        console.error("Unhandled error in server:", error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Internal Server Error' }));
    }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
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
    payFine, waiveFine, getAllBorrows
} = require('./controllers/loanController');

const { registerUser, loginUser } = require('./controllers/loginRegisterController');
const { saveItem, unsaveItem, getMyWishlist } = require('./controllers/wishlistController');
const { getMyProfile } = require('./controllers/userController');
const { searchItems } = require('./controllers/searchController');
const { getOverdueReport, getPopularityReport, getFineReport } = require('./controllers/reportController');
const { protect } = require('./authMiddleware'); // <--- ADD THIS IMPORT

const server = http.createServer((req, res) => {
    // --- CORS Headers ---
    // IMPORTANT: Replace '*' with your Vercel URL in production for security
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204); // Use 204 No Content for OPTIONS
        res.end();
        return;
    }

    // --- Routing ---
    try {
        // --- Item Routes ---
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

        // --- Loan/Hold/Waitlist Routes ---
        else if (req.url.match(/^\/api\/request\/([a-zA-Z0-9-]+)$/) && req.method === 'POST') {
            const itemId = req.url.split('/')[3];
            requestPickup(req, res, itemId); // User requests pickup
        } else if (req.url.match(/^\/api\/holds\/([0-9]+)\/pickup$/) && req.method === 'POST') {
            const holdId = req.url.split('/')[3];
            pickupHold(req, res, holdId); // Staff checks out hold
        } else if (req.url.match(/^\/api\/return\/([A-Za-z0-9-]+)$/) && req.method === 'POST') {
            const borrowId = req.url.split('/')[3];
            returnItem(req, res, borrowId); // Staff returns item
        } else if (req.url.match(/^\/api\/borrows\/([A-Za-z0-9-]+)\/lost$/) && req.method === 'POST') {
            const borrowId = req.url.split('/')[3];
            markLost(req, res, borrowId); // Staff marks lost
        } else if (req.url.match(/^\/api\/waitlist\/([a-zA-Z0-9-]+)$/) && req.method === 'POST') {
            const itemId = req.url.split('/')[3];
            placeWaitlistHold(req, res, itemId); // User waitlists unavailable item
        }

        // --- User Data Routes ---
        else if (req.url === '/api/my-loans' && req.method === 'GET') {
            getMyLoans(req, res);
        } else if (req.url === '/api/my-history' && req.method === 'GET') {
            getMyHistory(req, res);
        } else if (req.url === '/api/my-holds' && req.method === 'GET') { // Added holds
            getMyHolds(req, res);
        } else if (req.url === '/api/my-waitlist' && req.method === 'GET') {
            getMyWaitlist(req, res);
        } else if (req.url === '/api/my-fines' && req.method === 'GET') { // Added fines
            getMyFines(req, res);
        } 
        // Get My Fines
        else if (req.url === '/api/my-fines' && req.method === 'GET') { 
            getMyFines(req, res);
        } 
        // Get My Profile
        else if (req.url === '/api/my-profile' && req.method === 'GET') {
            // 1. Run the 'protect' middleware
            protect(req, res, () => {
                // 2. If 'protect' calls next(), then run the controller
                getMyProfile(req, res);
            });
        }
        
        // --- Fine Management Routes (Staff) ---
         else if (req.url.match(/^\/api\/fines\/([0-9]+)\/pay$/) && req.method === 'POST') {
            const fineId = req.url.split('/')[3];
            payFine(req, res, fineId);
        } else if (req.url.match(/^\/api\/fines\/([0-9]+)\/waive$/) && req.method === 'POST') {
            const fineId = req.url.split('/')[3];
            waiveFine(req, res, fineId);
        }

        // --- Wishlist Routes ---
        else if (req.url.match(/^\/api\/wishlist\/([a-zA-Z0-9-]+)$/) && req.method === 'POST') {
            const itemId = req.url.split('/')[3];
            saveItem(req, res, itemId);
        } else if (req.url.match(/^\/api\/wishlist\/([a-zA-Z0-9-]+)$/) && req.method === 'DELETE') {
            const itemId = req.url.split('/')[3];
            unsaveItem(req, res, itemId);
        } else if (req.url === '/api/my-wishlist' && req.method === 'GET') {
            getMyWishlist(req, res);
        }

        // --- Auth Routes ---
        else if (req.url === '/api/register' && req.method === 'POST') {
            registerUser(req, res);
        } else if (req.url === '/api/login' && req.method === 'POST') {
            loginUser(req, res);
        } 

        // --- Report Routes ---
        else if (req.url === '/api/reports/overdue' && req.method === 'GET') {
            getOverdueReport(req, res);
        } else if (req.url === '/api/reports/popular' && req.method === 'GET') {
            getPopularityReport(req, res);
        } else if (req.url === '/api/reports/fines' && req.method === 'GET') {
            getFineReport(req, res);
        }

        // --- Search Route ---
        else if (req.url.startsWith('/api/search') && req.method === 'GET') {
            searchItems(req, res);
        }

        // --- STAFF manages BORROW ROUTE ---
        else if (req.url === '/api/borrows' && req.method === 'GET') {
            getAllBorrows(req, res);
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
const http = require('http');
require('dotenv').config();
console.log("--- SERVER STARTING ---");
console.log("THE LOADED SECRET IS:", process.env.JWT_SECRET);
console.log("-----------------------");

// Import controllers
const { 
    getItems, getItem, getLanguages, getMovieFormats, getTags,
    createBook, updateBook, 
    createMovie, updateMovie, 
    createDevice, updateDevice,
    deleteItem 
} = require('./controllers/itemController');

const { 
    requestPickup, pickupHold, returnItem, markLost, markFound, placeWaitlistHold, 
    getMyLoans, getMyHistory, getMyHolds, getMyWaitlist, getMyFines,
    payFine, userPayFine, waiveFine, getAllBorrows, getAllHolds, cancelHold, staffCheckoutItem, getAllFines, staffCreateFine, getAllStatus, cancelMyHold
} = require('./controllers/loanController');

const { 
    getMyNotifications, getStaffNotifications, markNotificationAsRead, getStaffUnreadCount 
} = require('./controllers/notificationController');
const { registerUser, loginUser } = require('./controllers/loginRegisterController');
const { saveItem, unsaveItem, getMyWishlist } = require('./controllers/wishlistController');
const { getMyProfile, getAllUsers, staffCreateUser, getUserProfile, getUserBorrowHistory, getUserHoldHistory, getUserFineHistory, staffUpdateUser, staffDeleteUser, changePassword, changeEmail} = require('./controllers/userController');
const { signup, cancel, renew } = require('./controllers/membershipController');
const { searchItems } = require('./controllers/searchController');
const { getPopularGenresReport, getPopularItemsReport, getOverdueItemsReport, getOutstandingFines, getActiveUsersReport, getMembershipReport, getRevenueReport } = require('./controllers/reportController');
const { protect } = require('./middleware/authMiddleware'); // <--- ADD THIS IMPORT
const { getDashboardStats, getMyStaffProfile } = require('./controllers/staffController');
const { staffProtect} = require('./middleware/authMiddleware');


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

    console.log(`Incoming request: ${req.method} ${req.url}`);

    // --- Routing ---
    try {
        // --- Item Routes --- (Unchanged)
        if (req.url === '/api/items' && req.method === 'GET') {
            getItems(req, res);
        } 
        else if (req.url === '/api/languages' && req.method === 'GET') {
            getLanguages(req, res); // Call the controller function for languages
        } 
        else if (req.url === '/api/movie-formats' && req.method === 'GET') {
            getMovieFormats(req, res); // Call the controller function for formats
        } 
        else if (req.url === '/api/tags' && req.method === 'GET') {
            getTags(req, res); // Call the controller function for tags
        }
        else if (req.url.match(/^\/api\/items\/([a-zA-Z0-9-]+)$/) && req.method === 'GET') {
            const id = req.url.split('/')[3];
            getItem(req, res, id);
        } else if (req.url === '/api/items/book' && req.method === 'POST') {
            staffProtect(req, res, () => createBook(req, res));
        } else if (req.url.match(/^\/api\/items\/book\/([a-zA-Z0-9-]+)$/) && req.method === 'PUT') {
            const id = req.url.split('/')[4];
            staffProtect(req, res, () => updateBook(req, res, id));
        } else if (req.url === '/api/items/movie' && req.method === 'POST') {
            staffProtect(req, res, () => createMovie(req, res));
        } else if (req.url.match(/^\/api\/items\/movie\/([a-zA-Z0-9-]+)$/) && req.method === 'PUT') {
            const id = req.url.split('/')[4];
            staffProtect(req, res, () => updateMovie(req, res, id));
        } else if (req.url === '/api/items/device' && req.method === 'POST') {
            staffProtect(req, res, () => createDevice(req, res));
        } else if (req.url.match(/^\/api\/items\/device\/([a-zA-Z0-9-]+)$/) && req.method === 'PUT') {
            const id = req.url.split('/')[4];
            staffProtect(req, res, () => updateDevice(req, res, id));
        } else if (req.url.match(/^\/api\/items\/([a-zA-Z0-9-]+)$/) && req.method === 'DELETE') {
            const id = req.url.split('/')[3];
            staffProtect(req, res, () => deleteItem(req, res, id));
        }

        else if (req.url.match(/^\/api\/users\/([a-zA-Z0-9-]+)$/) && req.method === 'GET') { 
            const userId = req.url.split('/')[3];
            staffProtect(req, res, () => getUserProfile(req, res, userId)); 
        }
        else if (req.url.match(/^\/api\/users\/([a-zA-Z0-9-]+)\/borrows$/) && req.method === 'GET') { 
            const userId = req.url.split('/')[3];
            staffProtect(req, res, () => getUserBorrowHistory(req, res, userId)); 
        }
        else if (req.url.match(/^\/api\/users\/([a-zA-Z0-9-]+)\/holds$/) && req.method === 'GET') { 
            const userId = req.url.split('/')[3];
            staffProtect(req, res, () => getUserHoldHistory(req, res, userId)); 
        }
        else if (req.url.match(/^\/api\/users\/([a-zA-Z0-9-]+)\/fines$/) && req.method === 'GET') { 
            const userId = req.url.split('/')[3];
            staffProtect(req, res, () => getUserFineHistory(req, res, userId)); 
        }

        // --- Loan/Hold/Waitlist Routes (User Actions) ---
        else if (req.url.match(/^\/api\/request\/([a-zA-Z0-9-]+)$/) && req.method === 'POST') {
            const itemId = req.url.split('/')[3];
            // FIX: Ensure req and res are passed to the controller
            protect(req, res, () => requestPickup(req, res, itemId)); 
            return;
        }
        else if (req.url.match(/^\/api\/holds\/([0-9]+)$/) && req.method === 'DELETE') {
            const holdId = req.url.split('/')[3];
            protect(req, res, () => cancelMyHold(req, res, holdId));
            return;
        }
         else if (req.url.match(/^\/api\/holds\/([0-9]+)\/pickup$/) && req.method === 'POST') {
            const holdId = req.url.split('/')[3];
            staffProtect(req, res, () => pickupHold(req, res, holdId)); 
        } else if (req.url.match(/^\/api\/return\/([A-Za-z0-9-]+)$/) && req.method === 'POST') {
            const borrowId = req.url.split('/')[3];
            staffProtect(req, res, () => returnItem(req, res, borrowId)); 
        }else if (req.url.match(/^\/api\/borrows\/([A-Za-z0-9-]+)\/lost$/) && req.method === 'POST') {
            const borrowId = req.url.split('/')[3];
            staffProtect(req, res, () => markLost(req, res, borrowId));
        } else if (req.url.match(/^\/api\/borrows\/([A-Za-z0-9-]+)\/found$/) && req.method === 'POST') {
            const borrowId = req.url.split('/')[3];
            staffProtect(req, res, () => markFound(req, res, borrowId));
        } 
        else if (req.url.match(/^\/api\/waitlist\/([a-zA-Z0-9-]+)$/) && req.method === 'POST') {
            const itemId = req.url.split('/')[3];
            // FIX: Ensure req and res are passed to the controller
            protect(req, res, () => placeWaitlistHold(req, res, itemId)); 
            return;
        }
        else if (req.url.match(/^\/api\/my-fines\/([a-zA-Z0-9]+)\/pay$/) && req.method === 'POST') {
            const fineId = req.url.split('/')[3]; 
            protect(req, res, () => userPayFine(req, res, fineId)); 
            return;
        }

        // --- User Data Routes (My- Routes) ---
        else if (req.url === '/api/my-loans' && req.method === 'GET') {
            // FIX: Correctly wrap the controller function
            protect(req, res, () => getMyLoans(req, res));
            return;
        } else if (req.url === '/api/my-history' && req.method === 'GET') {
            // FIX: Correctly wrap the controller function (This fixes your primary error)
            protect(req, res, () => getMyHistory(req, res));
            return; 
        } else if (req.url === '/api/my-holds' && req.method === 'GET') {
            // FIX: Correctly wrap the controller function
            protect(req, res, () => getMyHolds(req, res)); 
            return;
        } else if (req.url === '/api/my-waitlist' && req.method === 'GET') {
            // FIX: Correctly wrap the controller function
            protect(req, res, () => getMyWaitlist(req, res)); 
            return;
        } else if (req.url === '/api/my-fines' && req.method === 'GET') {
            // FIX: Correctly wrap the controller function
            protect(req, res, () => getMyFines(req, res)); 
            return;
        }
    
        // Get My Profile
        else if (req.url === '/api/my-profile' && req.method === 'GET') {
            // FIX: Correctly wrap the controller function
            protect(req, res, () => getMyProfile(req, res));
            return;
        }
        else if (req.url === '/api/my-profile/change-password' && req.method === 'POST') {
            protect(req, res, () => changePassword(req, res));
            return;
        }
        else if (req.url === '/api/my-profile/email' && req.method === 'POST') {
            protect(req, res, () => changeEmail(req, res)); // <-- NEW ROUTE
            return;
        }
        else if (req.url === '/api/fines' && req.method === 'GET') { 
            staffProtect(req, res, () => getAllFines(req, res));
        }
        else if (req.url === '/api/fines' && req.method === 'POST') { 
            staffProtect(req, res, () => staffCreateFine(req, res));
        }
        
        // --- Fine Management Routes (Staff) ---
        else if (req.url.match(/^\/api\/fines\/([0-9]+)\/pay$/) && req.method === 'POST') {
            const fineId = req.url.split('/')[3];
            staffProtect(req, res, () => payFine(req, res, fineId));
        } else if (req.url.match(/^\/api\/fines\/([0-9]+)\/waive$/) && req.method === 'POST') {
            const fineId = req.url.split('/')[3];
            staffProtect(req, res, () => waiveFine(req, res, fineId));
        }

        // --- Wishlist Routes ---
        else if (req.url.match(/^\/api\/wishlist\/([a-zA-Z0-9-]+)$/) && req.method === 'POST') {
            const itemId = req.url.split('/')[3];
            protect(req, res, () => saveItem(req, res, itemId));
            return;
        } else if (req.url.match(/^\/api\/wishlist\/([a-zA-Z0-9-]+)$/) && req.method === 'DELETE') {
            const itemId = req.url.split('/')[3];
            protect(req, res, () => unsaveItem(req, res, itemId));
            return;
        } else if (req.url === '/api/my-wishlist' && req.method === 'GET') {
            protect(req, res, () => getMyWishlist(req, res));
            return;
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

        else if (req.url.startsWith('/api/status/') && req.method === 'GET') {
            getAllStatus(req, res);
        }

        // --- STAFF manages BORROW ROUTE ---
        else if (req.url.startsWith('/api/borrows') && req.method === 'GET') {
            staffProtect(req, res, () => getAllBorrows(req, res));
        }
        else if (req.url === '/api/staff/dashboard-stats' && req.method === 'GET') {
            staffProtect(req, res, () => getDashboardStats(req, res));
            return;
        }
        else if (req.url === '/api/staff/my-profile' && req.method === 'GET') {
            staffProtect(req, res, () => getMyStaffProfile(req, res));
            return;
        }
        else if (req.url.startsWith('/api/users') && req.method === 'GET') { 
            staffProtect(req, res, () => getAllUsers(req, res)); 
        }
        else if (req.url === '/api/users' && req.method === 'POST') { 
            staffProtect(req, res, () => staffCreateUser(req, res)); 
        }
        else if (req.url.match(/\/api\/users\/([a-zA-Z0-9]+)/) && req.method === 'PUT') {
            const userId = req.url.split('/')[3]; 
            staffProtect(req, res, () => staffUpdateUser(req, res, userId)); 
        }
        else if (req.url.match(/\/api\/users\/([a-zA-Z0-9]+)/) && req.method === 'DELETE') {
            const userId = req.url.split('/')[3];
            staffProtect(req, res, () => staffDeleteUser(req, res, userId));
        }
        // Use startsWith to ignore potential query strings like '?'
        else if (req.url.startsWith('/api/holds') && req.method === 'GET') { 
            staffProtect(req, res, () => getAllHolds(req, res));
        }
        else if (req.url === '/api/borrows/checkout' && req.method === 'POST') {
            staffProtect(req, res, () => staffCheckoutItem(req, res));
        }
        else if (req.url.match(/^\/api\/holds\/([0-9]+)\/cancel$/) && req.method === 'POST') { 
            const holdId = req.url.split('/')[3];
            staffProtect(req, res, () => cancelHold(req, res, holdId));
        }

        // reports routes
        else if (req.url.startsWith('/api/reports/popular-genres') && req.method === 'GET') {
            staffProtect(req, res, () => getPopularGenresReport(req, res));
            return;
        }
        else if (req.url.startsWith('/api/reports/popular-items') && req.method === 'GET') {
            staffProtect(req, res, () => getPopularItemsReport(req, res));
            return;
        }
        else if (req.url.startsWith('/api/reports/overdue-items') && req.method === 'GET') {
            staffProtect(req, res, () => getOverdueItemsReport(req, res));
            return;
        }
        else if (req.url.startsWith('/api/reports/outstanding-fines') && req.method === 'GET') {
            staffProtect(req, res, () => getOutstandingFines(req, res));
            return;
        }
        else if (req.url.startsWith('/api/reports/active-users') && req.method === 'GET') {
            staffProtect(req, res, () => getActiveUsersReport(req, res));
            return;
        }
        else if (req.url.startsWith('/api/reports/membership') && req.method === 'GET') {
            staffProtect(req, res, () => getMembershipReport(req, res));
            return;
        }
        else if (req.url.startsWith('/api/reports/revenue') && req.method === 'GET') {
            staffProtect(req, res, () => getRevenueReport(req, res));
            return;
        }

        // membership routes
        else if (req.url === '/api/membership/signup' && req.method === 'POST') {
            protect(req, res, () => signup(req, res));
            return;
        }
        else if (req.url === '/api/membership/cancel' && req.method === 'POST') {
            protect(req, res, () => cancel(req, res));
            return;
        }
        else if (req.url === '/api/membership/renew' && req.method === 'POST') {
            protect(req, res, () => renew(req, res));
            return;
        }
        // --- Notification Routes ---
        else if (req.url === '/api/my-notifications' && req.method === 'GET') {
            protect(req, res, () => getMyNotifications(req, res));
            return;
        }
        else if (req.url === '/api/staff-notifications' && req.method === 'GET') {
            staffProtect(req, res, () => getStaffNotifications(req, res));
            return;
        }
        else if (req.url.match(/^\/api\/notifications\/([0-9]+)\/read$/) && req.method === 'POST') {
            const notificationId = req.url.split('/')[3];
            // Use 'protect' - it works for both patrons and staff
            protect(req, res, () => markNotificationAsRead(req, res, notificationId));
            return;
        }
        else if (req.method === 'GET' && req.url === '/api/staff-notifications/count') {
        staffProtect(req, res, () => {
            getStaffUnreadCount(req, res);
        });
        return;
        }
        else if (req.method === 'GET' && req.url === '/api/my-notifications/count') {
            protect(req, res, () => {
                getPatronUnreadCount(req, res);
            });
            return;
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

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
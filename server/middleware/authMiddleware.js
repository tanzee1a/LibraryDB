// authMiddleware.js (Corrected version)
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

// Middleware to protect routes
function protect(req, res, next) {
    // 1. Get the token from the headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.writeHead(401, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ message: 'Not authorized, no token' }));
    }

    const token = authHeader.split(' ')[1];

    try {
        // 2. Verify the token
        const decoded = jwt.verify(token, SECRET);

        // 3. Attach the user_id from the token payload to the request
        req.userId = decoded.id; 
        
        // 4. Proceed to the next middleware or controller function
        // 🔑 THE FIX: Pass req and res so the controller wrapper receives them!
        next();
                
    } catch (error) {
        console.error("Token verification error:", error.message);
        res.writeHead(401, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ message: 'Not authorized, token failed' }));
    }
}

// Middleware to protect routes AND check for 'Staff' role
function staffProtect(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.writeHead(401, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ message: 'Not authorized, no token' }));
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, SECRET);
        
        // 🔥 CRITICAL STAFF CHECK 🔥
        if (decoded.role !== 'Staff' && decoded.role !== 'Librarian') { 
             // Assuming your staff roles are 'Staff' or 'Librarian'
             res.writeHead(403, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
             return res.end(JSON.stringify({ message: 'Forbidden, insufficient role access' }));
        }

        req.userId = decoded.id; 
        req.userRole = decoded.role; // Optionally attach the role
        
        next(); 
    } catch (error) {
        console.error("Token verification error:", error.message);
        res.writeHead(401, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ message: 'Not authorized, token failed' }));
    }
}

function headLibrarianProtect(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.writeHead(401, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ message: 'Not authorized, no token' }));
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, SECRET);
        
        // 🔥 CRITICAL HEAD LIBRARIAN CHECK 🔥
        if (decoded.role !== 'Librarian') { 
             res.writeHead(403, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
             return res.end(JSON.stringify({ message: 'Forbidden, only Head Librarians may access this resource.' }));
        }

        req.userId = decoded.id; 
        req.userRole = decoded.role;
        
        next(); 
    } catch (error) {
        console.error("Token verification error:", error.message);
        res.writeHead(401, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ message: 'Not authorized, token failed' }));
    }
}

module.exports = { protect, staffProtect, headLibrarianProtect };
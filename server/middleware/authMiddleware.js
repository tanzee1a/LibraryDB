// authMiddleware.js (New file)
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'your-super-secret-key'; // MUST MATCH THE SECRET IN loginController

// Middleware to protect routes
function protect(req, res, next) {
    // 1. Get the token from the headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.writeHead(401, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ message: 'Not authorized, no token' }));
    }

    const token = authHeader.split(' ')[1]; // "Bearer TOKEN" -> [1] is the TOKEN

    try {
        // 2. Verify the token
        const decoded = jwt.verify(token, SECRET);

        // 3. Attach the user_id from the token payload to the request
        // This 'id' matches the property name used in loginUser: { id: user.user_id, ... }
        req.userId = decoded.id; 
        
        // 4. Proceed to the next middleware or controller function
        next(); 
    } catch (error) {
        console.error("Token verification error:", error.message);
        res.writeHead(401, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ message: 'Not authorized, token failed' }));
    }
}

module.exports = { protect };
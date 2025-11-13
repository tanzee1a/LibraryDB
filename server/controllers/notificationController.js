const pool = require('../config/db'); 


const getMyNotifications = async (req, res) => {
    const patronUserId = req.userId; 

    try {
        const [notifications] = await pool.query(
            `
            SELECT 
                n.notification_id, n.title, n.message, n.link, n.created_at,
                (CASE WHEN r.read_at IS NOT NULL THEN 1 ELSE 0 END) AS is_read
            FROM NOTIFICATION n
            LEFT JOIN NOTIFICATION_READ_STATUS r 
                ON n.notification_id = r.notification_id AND r.user_id = ?
            WHERE n.target_user_id = ?
            ORDER BY n.created_at DESC;
            `,
            [patronUserId, patronUserId]
        );
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(notifications));
    } catch (error) {
        console.error("Error in getMyNotifications:", error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Server error' }));
    }
};


const getStaffNotifications = async (req, res) => {
    console.log(`[DEBUG] getStaffNotifications: req.userId is: ${req.userId}`);
    const staffUserId = req.userId; 

    if (!staffUserId) {
         console.error("--- NOTIFICATION CONTROLLER ERROR: staffUserId is missing from req.userId ---");
         res.writeHead(401, { 'Content-Type': 'application/json' });
         res.end(JSON.stringify({ message: 'Authentication error: User ID not found.' }));
         return;
    }

    try {
        const [notifications] = await pool.query(
            `
            SELECT 
                n.notification_id, n.title, n.message, n.link, n.created_at,
                (CASE WHEN r.read_at IS NOT NULL THEN 1 ELSE 0 END) AS is_read
            FROM NOTIFICATION n
            LEFT JOIN NOTIFICATION_READ_STATUS r 
                ON n.notification_id = r.notification_id AND r.user_id = ?
            -- Hard-code the 'Staff' User Role ID (4) and also check for personal user ID
            WHERE n.target_role_id = 4 OR n.target_user_id = ?
            ORDER BY n.created_at DESC;
            `,
            [staffUserId, staffUserId]
        );
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(notifications));
    } catch (error) {
        console.error("Error in getStaffNotifications:", error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Server error' }));
    }
};

const markNotificationAsRead = async (req, res, notificationId) => {
    const userId = req.userId; 

    if (!notificationId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Notification ID required' }));
        return;
    }

    if (!userId) {
         res.writeHead(401, { 'Content-Type': 'application/json' });
         res.end(JSON.stringify({ message: 'Authentication error: User ID not found.' }));
         return;
    }

    try {
        await pool.query(
            `
            INSERT INTO NOTIFICATION_READ_STATUS (notification_id, user_id, read_at)
            VALUES (?, ?, NOW())
            ON DUPLICATE KEY UPDATE read_at = NOW();
            `,
            [notificationId, userId]
        );

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Notification marked as read' }));
    } catch (error) {
        console.error("Error in markNotificationAsRead:", error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Server error' }));
    }
};


const getStaffUnreadCount = async (req, res) => {
    const staffUserId = req.userId; 

    if (!staffUserId) {
         res.writeHead(401, { 'Content-Type': 'application/json' });
         res.end(JSON.stringify({ message: 'Authentication error: User ID not found.' }));
         return;
    }

    try {
        const [rows] = await pool.query(
            `
            SELECT COUNT(n.notification_id) AS unreadCount
            FROM NOTIFICATION n
            LEFT JOIN NOTIFICATION_READ_STATUS r 
                ON n.notification_id = r.notification_id AND r.user_id = ?
            WHERE 
                (n.target_role_id = 4 OR n.target_user_id = ?)
                AND r.notification_id IS NULL;
            `,
            [staffUserId, staffUserId]
        );
        
        const unreadCount = rows[0].unreadCount || 0;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ unreadCount: unreadCount }));
    } catch (error) {
        console.error("Error in getStaffUnreadCount:", error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Server error' }));
    }
};

const getPatronUnreadCount = async (req, res) => {
    console.log(`[notificationController] getPatronUnreadCount: req.userId is: ${req.userId}`);
    const patronUserId = req.userId; 

    if (!patronUserId) {
         res.writeHead(401, { 'Content-Type': 'application/json' });
         res.end(JSON.stringify({ message: 'Authentication error: User ID not found.' }));
         return;
    }

    try {
        const [rows] = await pool.query(
            `
            SELECT COUNT(n.notification_id) AS unreadCount
            FROM NOTIFICATION n
            LEFT JOIN NOTIFICATION_READ_STATUS r 
                ON n.notification_id = r.notification_id AND r.user_id = ?
            WHERE 
                n.target_user_id = ?  -- Only check for notifications to this specific user
                AND r.notification_id IS NULL; -- Only count unread ones
            `,
            [patronUserId, patronUserId]
        );
        
        const unreadCount = rows[0].unreadCount || 0;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ unreadCount: unreadCount }));
    } catch (error) {
        console.error("Error in getPatronUnreadCount:", error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Server error' }));
    }
};

module.exports = {
    getMyNotifications,
    getStaffNotifications,
    markNotificationAsRead,
    getStaffUnreadCount,
    getPatronUnreadCount
};
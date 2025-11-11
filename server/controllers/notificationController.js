const pool = require('../config/db'); // Adjust this path to your db connection file

/**
 * @desc    Get notifications for the logged-in patron
 * @route   GET /api/my-notifications
 * @access  Private (Patron)
 */
const getMyNotifications = async (req, res) => {
    const patronUserId = req.user.user_id; // From 'protect' middleware

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
        console.error(error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Server error' }));
    }
};

/**
 * @desc    Get notifications for the logged-in staff
 * @route   GET /api/staff-notifications
 * @access  Private (Staff)
 */
const getStaffNotifications = async (req, res) => {
    const staffUserId = req.user.user_id; // From 'staffProtect' middleware
    const staffRoleId = req.user.role_id; // From 'staffProtect' middleware

    try {
        const [notifications] = await pool.query(
            `
            SELECT 
                n.notification_id, n.title, n.message, n.link, n.created_at,
                (CASE WHEN r.read_at IS NOT NULL THEN 1 ELSE 0 END) AS is_read
            FROM NOTIFICATION n
            LEFT JOIN NOTIFICATION_READ_STATUS r 
                ON n.notification_id = r.notification_id AND r.user_id = ?
            WHERE n.target_role_id = ?
            ORDER BY n.created_at DESC;
            `,
            [staffUserId, staffRoleId]
        );
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(notifications));
    } catch (error) {
        console.error(error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Server error' }));
    }
};

/**
 * @desc    Mark a notification as read
 * @route   POST /api/notifications/:id/read
 * @access  Private (Patron or Staff)
 */
const markNotificationAsRead = async (req, res, notificationId) => {
    const userId = req.user.user_id; // From 'protect' middleware

    if (!notificationId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Notification ID required' }));
        return;
    }

    try {
        // 'INSERT IGNORE' will silently fail if the row already exists, which is fine.
        // Or use ON DUPLICATE KEY UPDATE
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
        console.error(error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Server error' }));
    }
};

module.exports = {
    getMyNotifications,
    getStaffNotifications,
    markNotificationAsRead,
};
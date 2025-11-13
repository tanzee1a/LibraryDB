// models/reportModel.js
const db = require('../config/db');

async function popularGenresReport({ filterType = 'date', start = null, end = null, category = null } = {}) {
    let sql = `
        SELECT 
            t.tag_name AS genre_name,
            COUNT(b.borrow_id) AS total_borrows
        FROM TAG t
        JOIN ITEM_TAG it ON t.tag_id = it.tag_id
        JOIN ITEM i ON it.item_id = i.item_id
        LEFT JOIN BORROW b ON i.item_id = b.item_id
    `;

    const params = [];

    if (filterType === 'date') {
        if (start && end) sql += ' AND b.borrow_date BETWEEN ? AND ?';
        else if (start) sql += ' AND b.borrow_date >= ?';
        else if (end) sql += ' AND b.borrow_date <= ?';
    } 
    else if (filterType === 'month') {
        if (start && end) sql += ' AND MONTH(b.borrow_date) BETWEEN ? AND ?';
        else if (start) sql += ' AND MONTH(b.borrow_date) >= ?';
        else if (end) sql += ' AND MONTH(b.borrow_date) <= ?';
    } 
    else if (filterType === 'year') {
        if (start && end) sql += ' AND YEAR(b.borrow_date) BETWEEN ? AND ?';
        else if (start) sql += ' AND YEAR(b.borrow_date) >= ?';
        else if (end) sql += ' AND YEAR(b.borrow_date) <= ?';
    }

    if (start && end) params.push(start, end);
    else if (start) params.push(start);
    else if (end) params.push(end);

    if (category) {
        sql += ' AND i.category = ?';
        params.push(category);
    }


    sql += `
        GROUP BY t.tag_name
        ORDER BY total_borrows DESC;
    `;

    const [rows] = await db.query(sql, params);
    return rows;
}

async function popularItemReport({ filterType = 'date', start = null, end = null, category = null } = {}) {
    let sql = `
        SELECT 
            i.item_id,
            i.category,
            COALESCE(bk.title, m.title, d.device_name) AS item_name,
            i.quantity,
            COUNT(DISTINCT b.borrow_id) AS borrow_count,
            COUNT(DISTINCT w.user_id) AS total_wishlist
        FROM ITEM i
        LEFT JOIN BOOK bk ON i.item_id = bk.item_id AND i.category = 'BOOK'
        LEFT JOIN MOVIE m ON i.item_id = m.item_id AND i.category = 'MOVIE'
        LEFT JOIN DEVICE d ON i.item_id = d.item_id AND i.category = 'DEVICE'
        LEFT JOIN BORROW b ON i.item_id = b.item_id
        LEFT JOIN WISHLIST w ON i.item_id = w.item_id
        WHERE 1=1
    `;

    const params = [];

    if (filterType === 'date') {
        if (start && end) sql += ' AND b.borrow_date BETWEEN ? AND ?';
        else if (start) sql += ' AND b.borrow_date >= ?';
        else if (end) sql += ' AND b.borrow_date <= ?';
    } 
    else if (filterType === 'month') {
        if (start && end) sql += ' AND MONTH(b.borrow_date) BETWEEN ? AND ?';
        else if (start) sql += ' AND MONTH(b.borrow_date) >= ?';
        else if (end) sql += ' AND MONTH(b.borrow_date) <= ?';
    } 
    else if (filterType === 'year') {
        if (start && end) sql += ' AND YEAR(b.borrow_date) BETWEEN ? AND ?';
        else if (start) sql += ' AND YEAR(b.borrow_date) >= ?';
        else if (end) sql += ' AND YEAR(b.borrow_date) <= ?';
    }

    if (start && end) params.push(start, end);
    else if (start) params.push(start);
    else if (end) params.push(end);

    if (category) {
        sql += ' AND i.category = ?';
        params.push(category);
    }

    sql += `
        GROUP BY i.item_id, i.category, item_name, i.quantity
        ORDER BY borrow_count DESC;
    `;

    const [rows] = await db.query(sql, params);
    return rows;
}

async function overdueItemsReport({ filterType = 'date', start = null, end = null, category = null } = {}) {
    const loanedOutStatusId = 2; // Assuming 2 = 'Loaned Out' from BORROW_STATUS
    let sql = `
        SELECT 
            b.borrow_id,
            b.item_id,
            i.category,
            COALESCE(bk.title, m.title, d.device_name) AS item_title,
            u.email,
            u.firstName,
            u.lastName,
            b.borrow_date,
            b.due_date,
            DATEDIFF(CURDATE(), b.due_date) AS days_overdue -- Calculate days overdue
        FROM BORROW b
        JOIN USER u ON b.user_id = u.user_id
        JOIN ITEM i ON b.item_id = i.item_id
        JOIN BORROW_STATUS bs ON b.status_id = bs.status_id
        LEFT JOIN BOOK bk ON i.item_id = bk.item_id AND i.category = 'BOOK'
        LEFT JOIN MOVIE m ON i.item_id = m.item_id AND i.category = 'MOVIE'
        LEFT JOIN DEVICE d ON i.item_id = d.item_id AND i.category = 'DEVICE'
        WHERE 
            b.status_id = ? -- Must be 'Loaned Out'
            AND b.due_date < CURDATE() -- Due date must be in the past
    `;

    const params = [loanedOutStatusId];


    if (filterType === 'date') {
        if (start && end) sql += ' AND b.borrow_date BETWEEN ? AND ?';
        else if (start) sql += ' AND b.borrow_date >= ?';
        else if (end) sql += ' AND b.borrow_date <= ?';
    } 
    else if (filterType === 'month') {
        if (start && end) sql += ' AND MONTH(b.borrow_date) BETWEEN ? AND ?';
        else if (start) sql += ' AND MONTH(b.borrow_date) >= ?';
        else if (end) sql += ' AND MONTH(b.borrow_date) <= ?';
    } 
    else if (filterType === 'year') {
        if (start && end) sql += ' AND YEAR(b.borrow_date) BETWEEN ? AND ?';
        else if (start) sql += ' AND YEAR(b.borrow_date) >= ?';
        else if (end) sql += ' AND YEAR(b.borrow_date) <= ?';
    }

    if (start && end) params.push(start, end);
    else if (start) params.push(start);
    else if (end) params.push(end);

    if (category) {
        sql += ' AND i.category = ?';
        params.push(category);
    }

    sql += `
        ORDER BY days_overdue DESC;
    `;

    const [rows] = await db.query(sql, params);
    return rows;
}

async function outstandingFinesReport({ filterType = 'date', start = null, end = null } = {}) {
    let sql = `
        SELECT 
            u.email,
            u.firstName,
            u.lastName,
            COUNT(f.fine_id) AS number_of_fines,
            SUM(f.amount) AS total_amount_due
        FROM FINE f
        JOIN USER u ON f.user_id = u.user_id
        WHERE 
            f.date_paid IS NULL -- Must be unpaid
            AND f.waived_at IS NULL -- Must not be waived
    `;

    const params = [];

    if (filterType === 'date') {
        if (start && end) sql += ' AND f.date_issued BETWEEN ? AND ?';
        else if (start) sql += ' AND f.date_issued >= ?';
        else if (end) sql += ' AND f.date_issued <= ?';
    } 
    else if (filterType === 'month') {
        if (start && end) sql += ' AND MONTH(f.date_issued) BETWEEN ? AND ?';
        else if (start) sql += ' AND MONTH(f.date_issued) >= ?';
        else if (end) sql += ' AND MONTH(f.date_issued) <= ?';
    } 
    else if (filterType === 'year') {
        if (start && end) sql += ' AND YEAR(f.date_issued) BETWEEN ? AND ?';
        else if (start) sql += ' AND YEAR(f.date_issued) >= ?';
        else if (end) sql += ' AND YEAR(f.date_issued) <= ?';
    }

    if (start && end) params.push(start, end);
    else if (start) params.push(start);
    else if (end) params.push(end);

    sql += `
        GROUP BY f.user_id, u.firstName, u.lastName
        HAVING total_amount_due > 0
        ORDER BY total_amount_due DESC;
    `;

    const [rows] = await db.query(sql, params);
    return rows;
}

async function activeUsersReport({ filterType = 'date', start = null, end = null, role = null, minBorrow = null } = {}) {
    let sql = `
        SELECT 
            u.email,
            u.firstName,
            u.lastName,
            r.role_name,
            COUNT(b.borrow_id) AS total_borrows
        FROM USER u
        LEFT JOIN BORROW b ON u.user_id = b.user_id
        JOIN USER_ROLE r ON u.role_id = r.role_id
        WHERE 1=1
        AND u.role_id != 4
    `;

    const params = [];

    if (filterType === 'date') {
        if (start && end) sql += ' AND b.borrow_date BETWEEN ? AND ?';
        else if (start) sql += ' AND b.borrow_date >= ?';
        else if (end) sql += ' AND b.borrow_date <= ?';
    } 
    else if (filterType === 'month') {
        if (start && end) sql += ' AND MONTH(b.borrow_date) BETWEEN ? AND ?';
        else if (start) sql += ' AND MONTH(b.borrow_date) >= ?';
        else if (end) sql += ' AND MONTH(b.borrow_date) <= ?';
    } 
    else if (filterType === 'year') {
        if (start && end) sql += ' AND YEAR(b.borrow_date) BETWEEN ? AND ?';
        else if (start) sql += ' AND YEAR(b.borrow_date) >= ?';
        else if (end) sql += ' AND YEAR(b.borrow_date) <= ?';
    }

    if (start && end) params.push(start, end);
    else if (start) params.push(start);
    else if (end) params.push(end);

    if (role) {
        sql += ' AND u.role_id = ?';
        params.push(role);
    }

    sql += `
        GROUP BY u.user_id, u.email, u.firstName, u.lastName, r.role_name
    `;
    if (minBorrow) {
        sql += ` HAVING COUNT(b.borrow_id) >= ?`;
        params.push(minBorrow);
    }
    sql += `
        ORDER BY total_borrows DESC;
    `;

    const [rows] = await db.query(sql, params);
    return rows;
}

async function membershipReport({ filterType = 'date', start = null, end = null, status = null } = {}) {
    let sql = `
        SELECT
            u.email,
            u.firstName,
            u.lastName,
            CASE
                WHEN r.requires_membership_fee = 0 THEN NULL
                WHEN pm.user_id IS NULL THEN 'Not Enrolled'
                WHEN pm.expires_at < NOW() THEN 'Expired'
                WHEN pm.auto_renew = 0 THEN 'Canceled'
                ELSE 'Active'
            END AS membership_status,
            pm.auto_renew,
            pm.signup_date,
            pm.expires_at AS expires_on
        FROM USER u
        JOIN USER_ROLE r ON u.role_id = r.role_id
        LEFT JOIN PATRON_MEMBERSHIP pm ON u.user_id = pm.user_id
        WHERE r.requires_membership_fee = 1
    `;

    const params = [];

    if (filterType === 'date') {
        if (start && end) sql += ' AND pm.signup_date BETWEEN ? AND ?';
        else if (start) sql += ' AND pm.signup_date >= ?';
        else if (end) sql += ' AND pm.signup_date <= ?';
    } 
    else if (filterType === 'month') {
        if (start && end) sql += ' AND MONTH(pm.signup_date) BETWEEN ? AND ?';
        else if (start) sql += ' AND MONTH(pm.signup_date) >= ?';
        else if (end) sql += ' AND MONTH(pm.signup_date) <= ?';
    } 
    else if (filterType === 'year') {
        if (start && end) sql += ' AND YEAR(pm.signup_date) BETWEEN ? AND ?';
        else if (start) sql += ' AND YEAR(pm.signup_date) >= ?';
        else if (end) sql += ' AND YEAR(pm.signup_date) <= ?';
    }

    if (start && end) params.push(start, end);
    else if (start) params.push(start);
    else if (end) params.push(end);

    if (status) {
        sql += `
            AND (
                CASE
                    WHEN r.requires_membership_fee = 0 THEN NULL
                    WHEN pm.user_id IS NULL THEN 'Not Enrolled'
                    WHEN pm.expires_at < NOW() THEN 'Expired'
                    WHEN pm.auto_renew = 0 THEN 'Canceled'
                    ELSE 'Active'
                END
            ) = ?
        `;
        params.push(status);
    }

    sql += `
        ORDER BY pm.signup_date DESC;
    `;

    const [rows] = await db.query(sql, params);

    // Format expires_at as MM/DD/YYYY
    const formattedRows = rows.map(row => ({
    ...row,
    expires_on: row.expires_on
        ? new Date(row.expires_on).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })
        : null,
    signup_date: row.signup_date
        ? new Date(row.signup_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })
        : null
    }));

    return formattedRows;
}

async function revenueReport({ filterType = 'date', start = null, end = null, type = null } = {}) {
    let sql = `
        SELECT 'Fine' AS type, u.email AS user_email, f.amount, f.date_paid
        FROM FINE f
        JOIN USER u ON f.user_id = u.user_id
        WHERE f.date_paid IS NOT NULL
    `;

    const params = [];

    if (filterType === 'date') {
        if (start && end) {
            sql += ' AND f.date_paid BETWEEN ? AND ?';
        } else if (start) {
            sql += ' AND f.date_paid >= ?';
        } else if (end) {
            sql += ' AND f.date_paid <= ?';
        }
    } else if (filterType === 'month') {
        if (start && end) {
            sql += ' AND MONTH(f.date_paid) BETWEEN ? AND ?';
        } else if (start) {
            sql += ' AND MONTH(f.date_paid) >= ?';
        } else if (end) {
            sql += ' AND MONTH(f.date_paid) <= ?';
        }
    } else if (filterType === 'year') {
        if (start && end) {
            sql += ' AND YEAR(f.date_paid) BETWEEN ? AND ?';
        } else if (start) {
            sql += ' AND YEAR(f.date_paid) >= ?';
        } else if (end) {
            sql += ' AND YEAR(f.date_paid) <= ?';
        }
    }

    if (start && end) {
        params.push(start, end);
    } else if (start) {
        params.push(start);
    } else if (end) {
        params.push(end);
    }

    sql += `
        UNION ALL
        SELECT 'Membership' AS type, u.email AS user_email, m.amount, m.payment_date AS date_paid
        FROM MEMBERSHIP_PAYMENT m
        JOIN USER u ON m.user_id = u.user_id
        WHERE m.payment_date IS NOT NULL
    `;

    if (filterType === 'date') {
        if (start && end) {
            sql += ' AND m.payment_date BETWEEN ? AND ?';
        } else if (start) {
            sql += ' AND m.payment_date >= ?';
        } else if (end) {
            sql += ' AND m.payment_date <= ?';
        }
    } else if (filterType === 'month') {
        if (start && end) {
            sql += ' AND MONTH(m.payment_date) BETWEEN ? AND ?';
        } else if (start) {
            sql += ' AND MONTH(m.payment_date) >= ?';
        } else if (end) {
            sql += ' AND MONTH(m.payment_date) <= ?';
        }
    } else if (filterType === 'year') {
        if (start && end) {
            sql += ' AND YEAR(m.payment_date) BETWEEN ? AND ?';
        } else if (start) {
            sql += ' AND YEAR(m.payment_date) >= ?';
        } else if (end) {
            sql += ' AND YEAR(m.payment_date) <= ?';
        }
    }

    if (start && end) {
        params.push(start, end);
    } else if (start) {
        params.push(start);
    } else if (end) {
        params.push(end);
    }

    const [rows] = await db.query(sql, params);
    return rows;
}

module.exports = {
    popularGenresReport,
    popularItemReport,
    overdueItemsReport,
    outstandingFinesReport,
    activeUsersReport,
    membershipReport,
    revenueReport
};
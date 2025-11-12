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
        COUNT(b.borrow_id) AS total_borrows
        FROM ITEM i
        LEFT JOIN BORROW b 
        ON i.item_id = b.item_id
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
        LEFT JOIN BOOK bk ON i.item_id = bk.item_id AND i.category = 'BOOK'
        LEFT JOIN MOVIE m ON i.item_id = m.item_id AND i.category = 'MOVIE'
        LEFT JOIN DEVICE d ON i.item_id = d.item_id AND i.category = 'DEVICE'
        GROUP BY i.item_id, i.category, item_name
        ORDER BY total_borrows DESC;
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
            b.user_id,
            u.firstName,
            u.lastName,
            u.email,
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
            f.user_id,
            u.firstName,
            u.lastName,
            u.email,
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

module.exports = {
    popularGenresReport,
    popularItemReport,
    overdueItemsReport,
    outstandingFinesReport
};
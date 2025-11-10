// models/reportModel.js
const db = require('../config/db');

// --- Report 1: Overdue Items ---
async function findOverdueItems(filterData) {
    const loanedOutStatusId = 2; // Assuming 2 = 'Loaned Out' from BORROW_STATUS
    const sql = `
        SELECT 
            b.borrow_id,
            b.item_id,
            i.category,
            COALESCE(bk.title, m.title, d.device_name) AS item_title,
            b.user_id,
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
            ${filterData.date1 != `''` ? `AND b.due_date >= ${filterData.date1}` : ``}
            AND b.due_date <${filterData.date2 != `''` ? ` ${filterData.date2} AND b.due_date <=` : ``} CURDATE() -- Due date must be in the past
            ${filterData.book ? `` : `AND i.category != 'BOOK'`}
            ${filterData.movie ? `` : `AND i.category != 'MOVIE'`}
            ${filterData.device ? `` : `AND i.category != 'DEVICE'`}
        ORDER BY days_overdue DESC; 
    `; //DATES ARE NON FUNCTIONAL
    const [rows] = await db.query(sql, [loanedOutStatusId]);
    return rows;
}

// --- Report 2: Most Popular Items (Last 90 days) ---
async function findMostPopularItems(filterData) {
    lastDay = `${filterData.dateLatest != `''` ? filterData.dateLatest : `CURDATE()`}`
    const sql = `
        SELECT 
            b.item_id,
            i.category,
            COALESCE(bk.title, m.title, d.device_name) AS item_title,
            COUNT(b.borrow_id) AS borrow_count
        FROM BORROW b
        JOIN ITEM i ON b.item_id = i.item_id
        LEFT JOIN BOOK bk ON i.item_id = bk.item_id AND i.category = 'BOOK'
        LEFT JOIN MOVIE m ON i.item_id = m.item_id AND i.category = 'MOVIE'
        LEFT JOIN DEVICE d ON i.item_id = d.item_id AND i.category = 'DEVICE'
        WHERE b.borrow_date <= ${lastDay}
            AND b.borrow_date >= ${filterData.dateEarliest != `''` ? filterData.dateEarliest : `DATE_SUB(${lastDay}, INTERVAL 90 DAY)`} -- Filter by date range
            ${filterData.book ? `` : `AND i.category != 'BOOK'`}
            ${filterData.movie ? `` : `AND i.category != 'MOVIE'`}
            ${filterData.device ? `` : `AND i.category != 'DEVICE'`}
        GROUP BY b.item_id, i.category, item_title -- Group by item
        HAVING borrow_count >= ${filterData.minBrw}
            ${filterData.maxBrw != '' ? `AND borrow_count <= ${filterData.maxBrw}` : ``}
        ORDER BY borrow_count DESC -- Order by most popular
        LIMIT ${filterData.maxDis}; -- Limit results
    `;
    const [rows] = await db.query(sql);
    return rows;
}

// --- Report 3: User Fine Summary ---
async function findUsersWithOutstandingFines(filterData) {
    const sql = `
        SELECT 
            f.user_id,
            u.firstName,
            u.lastName,
            COUNT(f.fine_id) AS number_of_fines,
            SUM(f.amount) AS total_amount_due
        FROM FINE f
        JOIN USER u ON f.user_id = u.user_id
        WHERE 
            f.date_paid IS NULL -- Must be unpaid
            AND f.waived_at IS NULL -- Must not be waived
        GROUP BY f.user_id, u.firstName, u.lastName -- Group by user
        HAVING total_amount_due ${filterData.minOwed != '' ? `>= ${filterData.minOwed}` : `> 0`} -- Only show users who owe money
            ${filterData.maxOwed != '' ? `AND total_amount_due <= ${filterData.maxOwed}` : ``}
            ${filterData.fineMin != '' ? `AND number_of_fines >= ${filterData.fineMin}` : ``}
            ${filterData.fineMax != '' ? `AND number_of_fines <= ${filterData.fineMax}` : ``}
        ORDER BY total_amount_due DESC;
    `;
    const [rows] = await db.query(sql);
    return rows;
}


module.exports = {
    findOverdueItems,
    findMostPopularItems,
    findUsersWithOutstandingFines
};
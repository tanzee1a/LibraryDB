const db = require('../config/db'); 
const { v4: uuidv4 } = require('uuid'); // For generating borrow_ids

// --- Helper: Get Status ID from Name ---
async function getStatusId(conn, statusName) {
  const [rows] = await conn.query(
    'SELECT status_id FROM BORROW_STATUS WHERE status_name = ?', 
    [statusName]
    );
  if (rows.length === 0) throw new Error(`Status '${statusName}' not found`);
  return rows[0].status_id;
}

// --- Helper: Get Loan Policy based on Item ---
async function getLoanPolicyForItem(conn, itemId) {
  const [rows] = await conn.query(`
    SELECT lp.loan_days, lp.daily_late_fee, lp.lost_after_days, lp.lost_fee
    FROM ITEM i
    JOIN LOAN_POLICY lp ON lp.category = i.category
    WHERE i.item_id = ?
  `, [itemId]);
  if (!rows.length) throw new Error(`No loan policy found for item ${itemId}`);
  return rows[0];
}

// --- User requests pickup for an AVAILABLE item ---
async function requestPickup(itemId, userId) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const pendingStatusId = await getStatusId(conn, 'Pending');

        // 1. Check Availability
        const [items] = await conn.query(
          'SELECT available, category FROM ITEM WHERE item_id = ? FOR UPDATE', // Lock the row
          [itemId]
        );
        if (items.length === 0) throw new Error('Item not found.');
        if (items[0].available <= 0) throw new Error('Item is not available.');

        // 2. Put item on hold
        await conn.query(
            'UPDATE ITEM SET available = available - 1, on_hold = on_hold + 1 WHERE item_id = ?', 
            [itemId]
        );

        // 3. Create HOLD record (e.g., expires in 3 days)
        const holdExpires = new Date();
        holdExpires.setDate(holdExpires.getDate() + 3); 
        
        const holdSql = `
            INSERT INTO HOLD (user_id, item_id, expires_at) 
            VALUES (?, ?, ?)
        `;
        const [holdResult] = await conn.query(holdSql, [userId, itemId, holdExpires]);

        await conn.commit();
        return { hold_id: holdResult.insertId, message: 'Item requested for pickup. Expires ' + holdExpires.toLocaleDateString() };

    } catch (error) {
        await conn.rollback();
        console.error("Error in requestPickup transaction:", error);
        throw error;
    } finally {
        conn.release();
    }
}

// --- Staff checks out a PENDING hold ---
async function pickupHold(holdId, staffUserId) { // staffUserId not used yet, but needed for auth
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const loanedOutStatusId = await getStatusId(conn, 'Loaned Out');

        // 1. Get Hold details & lock related item
        const [holds] = await conn.query(
            `SELECT h.item_id, h.user_id, i.category 
             FROM HOLD h 
             JOIN ITEM i ON h.item_id = i.item_id 
             WHERE h.hold_id = ? AND h.picked_up_at IS NULL AND h.canceled_at IS NULL AND h.expires_at >= NOW()
             FOR UPDATE OF i`, // Lock the ITEM row
            [holdId]
        );
        if (holds.length === 0) throw new Error('Hold not found, already picked up, canceled, or expired.');
        
        const { item_id: itemId, user_id: userId, category } = holds[0];

        // 2. Get Loan Policy
        const policy = await getLoanPolicyForItem(conn, itemId);
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + policy.loan_days);

        // 3. Update ITEM status
        await conn.query(
            'UPDATE ITEM SET on_hold = on_hold - 1, loaned_out = loaned_out + 1 WHERE item_id = ?', 
            [itemId]
        );

        // 4. Update HOLD status
        await conn.query(
            'UPDATE HOLD SET picked_up_at = NOW() WHERE hold_id = ?', 
            [holdId]
        );

        // 5. Create BORROW record
        const borrowId = `B${Date.now()}${Math.floor(Math.random()*100)}`; // Simple unique ID
        const borrowSql = `
            INSERT INTO BORROW (borrow_id, borrow_date, due_date, status_id, user_id, item_id)
            VALUES (?, CURDATE(), ?, ?, ?, ?)
        `;
        await conn.query(borrowSql, [borrowId, dueDate, loanedOutStatusId, userId, itemId]);

        await conn.commit();
        return { borrow_id: borrowId, message: `Item checked out to user ${userId}. Due: ${dueDate.toLocaleDateString()}` };

    } catch (error) {
        await conn.rollback();
        console.error("Error in pickupHold transaction:", error);
        throw error;
    } finally {
        conn.release();
    }
}


// --- User returns a LOANED OUT item ---
async function returnItem(borrowId, staffUserId) { // staffUserId for auth later
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const returnedStatusId = await getStatusId(conn, 'Returned');
        const loanedOutStatusId = await getStatusId(conn, 'Loaned Out');

        // 1. Get Borrow details & lock Item
        const [borrows] = await conn.query(
            `SELECT b.item_id, b.user_id, b.due_date, i.category 
             FROM BORROW b
             JOIN ITEM i ON b.item_id = i.item_id
             WHERE b.borrow_id = ? AND b.status_id = ?
             FOR UPDATE OF i`, 
            [borrowId, loanedOutStatusId]
        );
        if (borrows.length === 0) throw new Error('Active loan not found.');

        const { item_id: itemId, user_id: userId, due_date: dueDate } = borrows[0];

        // 2. Update ITEM status
        await conn.query(
            'UPDATE ITEM SET loaned_out = loaned_out - 1, available = available + 1 WHERE item_id = ?', 
            [itemId]
        );

        // 3. Update BORROW status
        await conn.query(
            'UPDATE BORROW SET status_id = ?, return_date = CURDATE() WHERE borrow_id = ?', 
            [returnedStatusId, borrowId]
        );

        // 4. Check for and potentially create FINE
        const today = new Date();
        const due = new Date(dueDate);
        if (today > due) {
            const daysLate = Math.ceil((today - due) / (1000 * 60 * 60 * 24));
            const policy = await getLoanPolicyForItem(conn, itemId);
            if (daysLate > 0 && policy.daily_late_fee > 0) {
                const totalFine = daysLate * policy.daily_late_fee;
                const fineSql = `
                    INSERT INTO FINE (borrow_id, user_id, fee_type, amount, notes)
                    VALUES (?, ?, 'LATE', ?, ?)
                `;
                await conn.query(fineSql, [
                    borrowId, userId, totalFine, 
                    `Returned ${daysLate} day(s) late.`
                ]);
            }
        }

        await conn.commit();
        return { borrow_id: borrowId, message: 'Item returned successfully.' };

    } catch (error) {
        await conn.rollback();
        console.error("Error in returnItem transaction:", error);
        throw error;
    } finally {
        conn.release();
    }
}

// --- Staff marks a loan as LOST ---
async function markLost(borrowId, staffUserId) { // staffUserId for auth
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const lostStatusId = await getStatusId(conn, 'Lost');
        const loanedOutStatusId = await getStatusId(conn, 'Loaned Out'); // Or maybe Pending?

         // 1. Get Borrow details & lock Item
        const [borrows] = await conn.query(
            `SELECT b.item_id, b.user_id, i.category 
             FROM BORROW b
             JOIN ITEM i ON b.item_id = i.item_id
             WHERE b.borrow_id = ? AND b.status_id = ? 
             FOR UPDATE OF i`, // Ensure it's currently loaned out
            [borrowId, loanedOutStatusId] 
        );
        if (borrows.length === 0) throw new Error('Active loan not found to mark as lost.');

        const { item_id: itemId, user_id: userId } = borrows[0];

        // 2. Update ITEM status (item is gone)
        await conn.query(
            'UPDATE ITEM SET loaned_out = loaned_out - 1 WHERE item_id = ?', 
            [itemId]
        );

        // 3. Update BORROW status
        await conn.query(
            'UPDATE BORROW SET status_id = ? WHERE borrow_id = ?', 
            [lostStatusId, borrowId]
        );

        // 4. Create LOST fine
        const policy = await getLoanPolicyForItem(conn, itemId);
        const fineSql = `
            INSERT INTO FINE (borrow_id, user_id, fee_type, amount, notes)
            VALUES (?, ?, 'LOST', ?, ?)
        `;
        await conn.query(fineSql, [
            borrowId, userId, policy.lost_fee, 
            'Item marked as lost.'
        ]);

        await conn.commit();
        return { borrow_id: borrowId, message: 'Item marked as lost and fine assessed.' };

    } catch (error) {
        await conn.rollback();
        console.error("Error in markLost transaction:", error);
        throw error;
    } finally {
        conn.release();
    }
}


// --- User places a hold on an UNAVAILABLE item (Waitlist) ---
async function placeWaitlistHold(itemId, userId) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Check Availability & Lock Item
        const [items] = await conn.query(
          'SELECT available FROM ITEM WHERE item_id = ? FOR UPDATE', 
          [itemId]
        );
        if (items.length === 0) throw new Error('Item not found.');
        // Allow hold only if item is NOT available
        if (items[0].available > 0) {
            throw new Error('Item is currently available. Please use "Request Pickup" instead.');
        }

        // 2. Check if user already on waitlist
        const [waitlist] = await conn.query(
            'SELECT * FROM WAITLIST WHERE item_id = ? AND user_id = ?', 
            [itemId, userId]
        );
        if (waitlist.length > 0) throw new Error('You are already on the waitlist.');

        // 3. Add to WAITLIST
        const waitlistSql = `
            INSERT INTO WAITLIST (start_date, user_id, item_id) 
            VALUES (CURDATE(), ?, ?)
        `;
        const [result] = await conn.query(waitlistSql, [userId, itemId]);
        
        // NO change to ITEM counts needed for waitlist

        await conn.commit();
        return { waitlist_id: result.insertId, message: 'Successfully added to waitlist' };

    } catch (error) {
        await conn.rollback();
        console.error("Error in placeWaitlistHold transaction:", error);
        throw error;
    } finally {
        conn.release();
    }
}

/*
// --- Get Loans for User (Updated for status_id and title COALESCE) ---
async function findLoansByUserId(userId) {
    const loanedOutStatusId = await getStatusId(db, 'Loaned Out');
    const sql = `
        SELECT 
            b.borrow_id, 
            b.item_id,
            b.due_date, 
            COALESCE(bk.title, m.title, d.device_name) AS title 
        FROM BORROW b
        JOIN ITEM i ON b.item_id = i.item_id
        LEFT JOIN BOOK bk ON i.item_id = bk.item_id AND i.category = 'BOOK'
        LEFT JOIN MOVIE m ON i.item_id = m.item_id AND i.category = 'MOVIE'
        LEFT JOIN DEVICE d ON i.item_id = d.item_id AND i.category = 'DEVICE'
        WHERE b.user_id = ? AND b.status_id = ?;
    `;
    const [rows] = await db.query(sql, [userId, loanedOutStatusId]);
    return rows;
}
*/

async function findLoansByUserId(userId) {
    const loanedOutStatusId = await getStatusId(db, 'Loaned Out');
    const sql = `
        SELECT 
            b.borrow_id, 
            b.item_id,
            b.due_date, 
            COALESCE(bk.title, m.title, d.device_name) AS title,
            i.thumbnail_url -- <<< ADD THIS LINE
        FROM BORROW b
        JOIN ITEM i ON b.item_id = i.item_id
        LEFT JOIN BOOK bk ON i.item_id = bk.item_id AND i.category = 'BOOK'
        LEFT JOIN MOVIE m ON i.item_id = m.item_id AND i.category = 'MOVIE'
        LEFT JOIN DEVICE d ON i.item_id = d.item_id AND i.category = 'DEVICE'
        WHERE b.user_id = ? AND b.status_id = ?;
    `;
    const [rows] = await db.query(sql, [userId, loanedOutStatusId]);
    return rows;
}
/*
// --- Get History for User (Updated) ---
async function findLoanHistoryByUserId(userId) {
     const returnedStatusId = await getStatusId(db, 'Returned');
     const lostStatusId = await getStatusId(db, 'Lost');
     const sql = `
        SELECT 
            b.borrow_id, 
            b.item_id,
            b.return_date,
            COALESCE(bk.title, m.title, d.device_name) AS title,
            bs.status_name
        FROM BORROW b
        JOIN ITEM i ON b.item_id = i.item_id
        JOIN BORROW_STATUS bs ON b.status_id = bs.status_id
        LEFT JOIN BOOK bk ON i.item_id = bk.item_id AND i.category = 'BOOK'
        LEFT JOIN MOVIE m ON i.item_id = m.item_id AND i.category = 'MOVIE'
        LEFT JOIN DEVICE d ON i.item_id = d.item_id AND i.category = 'DEVICE'
        WHERE b.user_id = ? AND b.status_id IN (?, ?); -- Returned or Lost
    `;
    const [rows] = await db.query(sql, [userId, returnedStatusId, lostStatusId]);
    return rows;
}
*/

async function findLoanHistoryByUserId(userId) {
     const returnedStatusId = await getStatusId(db, 'Returned');
     const lostStatusId = await getStatusId(db, 'Lost');
     const sql = `
        SELECT 
            b.borrow_id, 
            b.item_id,
            b.return_date,
            COALESCE(bk.title, m.title, d.device_name) AS title,
            bs.status_name,
            i.thumbnail_url -- <<< ADD THIS LINE
        FROM BORROW b
        JOIN ITEM i ON b.item_id = i.item_id
        JOIN BORROW_STATUS bs ON b.status_id = bs.status_id
        LEFT JOIN BOOK bk ON i.item_id = bk.item_id AND i.category = 'BOOK'
        LEFT JOIN MOVIE m ON i.item_id = m.item_id AND i.category = 'MOVIE'
        LEFT JOIN DEVICE d ON i.item_id = d.item_id AND i.category = 'DEVICE'
        WHERE b.user_id = ? AND b.status_id IN (?, ?); -- Returned or Lost
    `;
    const [rows] = await db.query(sql, [userId, returnedStatusId, lostStatusId]);
    return rows;
}

// --- Get Holds for User (Pickup Requests) ---
async function findHoldsByUserId(userId) {
   const sql = `
        SELECT 
            h.hold_id, 
            h.item_id,
            h.created_at,
            h.expires_at,
            COALESCE(bk.title, m.title, d.device_name) AS title
        FROM HOLD h
        JOIN ITEM i ON h.item_id = i.item_id
        LEFT JOIN BOOK bk ON i.item_id = bk.item_id AND i.category = 'BOOK'
        LEFT JOIN MOVIE m ON i.item_id = m.item_id AND i.category = 'MOVIE'
        LEFT JOIN DEVICE d ON i.item_id = d.item_id AND i.category = 'DEVICE'
        WHERE h.user_id = ? AND h.picked_up_at IS NULL AND h.canceled_at IS NULL AND h.expires_at >= NOW();
    `;
    const [rows] = await db.query(sql, [userId]);
    return rows;
}

// --- Get Waitlist items for User ---
async function findWaitlistByUserId(userId) {
    const sql = `
        SELECT 
            w.waitlist_id, 
            w.item_id,
            w.start_date,
            COALESCE(bk.title, m.title, d.device_name) AS title
        FROM WAITLIST w
        JOIN ITEM i ON w.item_id = i.item_id
        LEFT JOIN BOOK bk ON i.item_id = bk.item_id AND i.category = 'BOOK'
        LEFT JOIN MOVIE m ON i.item_id = m.item_id AND i.category = 'MOVIE'
        LEFT JOIN DEVICE d ON i.item_id = d.item_id AND i.category = 'DEVICE'
        WHERE w.user_id = ?;
    `;
    const [rows] = await db.query(sql, [userId]);
    return rows;
}

// --- Get Fines for User ---
async function findFinesByUserId(userId) {
    const sql = `
        SELECT 
            f.fine_id,
            f.borrow_id,
            f.fee_type,
            f.amount,
            f.date_issued,
            f.date_paid,
            f.notes,
            f.waived_at,
            f.waived_reason,
            COALESCE(bk.title, m.title, d.device_name) AS item_title
        FROM FINE f
        JOIN BORROW b ON f.borrow_id = b.borrow_id
        JOIN ITEM i ON b.item_id = i.item_id
        LEFT JOIN BOOK bk ON i.item_id = bk.item_id AND i.category = 'BOOK'
        LEFT JOIN MOVIE m ON i.item_id = m.item_id AND i.category = 'MOVIE'
        LEFT JOIN DEVICE d ON i.item_id = d.item_id AND i.category = 'DEVICE'
        WHERE f.user_id = ?
        ORDER BY f.date_issued DESC; 
    `;
     const [rows] = await db.query(sql, [userId]);
    return rows;
}

// --- Staff pays a fine ---
async function payFine(fineId, staffUserId) { // staffUserId for auth later
    const sql = 'UPDATE FINE SET date_paid = NOW() WHERE fine_id = ? AND date_paid IS NULL';
    const [result] = await db.query(sql, [fineId]);
    if (result.affectedRows === 0) {
        throw new Error('Fine not found or already paid.');
    }
    return { fine_id: fineId, message: 'Fine marked as paid.' };
}

// --- Staff waives a fine ---
async function waiveFine(fineId, reason, staffUserId) { // staffUserId for auth
     const sql = 'UPDATE FINE SET waived_at = NOW(), waived_reason = ? WHERE fine_id = ? AND date_paid IS NULL AND waived_at IS NULL';
    const [result] = await db.query(sql, [reason, fineId]);
    if (result.affectedRows === 0) {
        throw new Error('Fine not found, already paid, or already waived.');
    }
    return { fine_id: fineId, message: 'Fine waived.' };
}


module.exports = {
    requestPickup,
    pickupHold,
    returnItem,
    markLost,
    placeWaitlistHold,
    findLoansByUserId,
    findLoanHistoryByUserId,
    findHoldsByUserId,
    findWaitlistByUserId,
    findFinesByUserId,
    payFine,
    waiveFine
};
const db = require('../config/db'); 
const { v4: uuidv4 } = require('uuid'); // For generating borrow_ids

// --- Helper: Get Status ID from Name (No Change) ---
async function getStatusId(conn, statusName) {
  const [rows] = await conn.query(
    'SELECT status_id FROM BORROW_STATUS WHERE status_name = ?', 
    [statusName]
    );
  if (rows.length === 0) throw new Error(`Status '${statusName}' not found`);
  return rows[0].status_id;
}

// --- MODIFIED: Helper to get all rules from LOAN_POLICY ---
// This function is now the single source of truth for all rules.
// It needs the user_id to find their role.
async function getLoanPolicy(conn, userId, itemId) {
  const [rows] = await conn.query(`
    SELECT 
        lp.loan_days, 
        lp.daily_late_fee, 
        lp.lost_after_days, 
        lp.lost_fee
    FROM ITEM i
    JOIN USER u ON u.user_id = ?
    JOIN LOAN_POLICY lp ON lp.category = i.category AND lp.role_id = u.role_id
    WHERE i.item_id = ?
  `, [userId, itemId]);
  
  if (!rows.length) {
      throw new Error(`No loan policy found for this user/item combination (User: ${userId}, Item: ${itemId})`);
  }
  return rows[0];
}
// --- END MODIFICATION ---

// --- NEW HELPER: Check user's global borrow limit ---
async function checkBorrowLimit(conn, userEmail) {
    // 1. Get the user's limit from their role
    const [roleRows] = await conn.query(`
        SELECT ur.total_borrow_limit 
        FROM USER u
        JOIN USER_ROLE ur ON u.role_id = ur.role_id
        WHERE u.user_email = ?
    `, [userEmail]);

    if (roleRows.length === 0) throw new Error('User role not found.');
    const limit = roleRows[0].total_borrow_limit;

    // 2. Get user's current active checkouts
    const loanedOutStatusId = await getStatusId(conn, 'Loaned Out');
    const [borrowCountRows] = await conn.query(
        'SELECT COUNT(*) as count FROM BORROW WHERE user_email = ? AND status_id = ?',
        [userEmail, loanedOutStatusId]
    );
    const borrowCount = borrowCountRows[0].count;

    // 3. Get user's current active holds
    const [holdCountRows] = await conn.query(
        'SELECT COUNT(*) as count FROM HOLD WHERE user_email = ? AND picked_up_at IS NULL AND canceled_at IS NULL AND expires_at >= NOW()',
        [userEmail]
    );
    const holdCount = holdCountRows[0].count;

    // 4. Check total against limit
    if ((borrowCount + holdCount) >= limit) {
        throw new Error(`Borrow limit reached (${limit} items). You currently have ${borrowCount} borrows and ${holdCount} active holds.`);
    }
    // If we're here, the user is clear to borrow/hold one more item.
    return true; 
}
// --- END NEW HELPER ---


// --- MODIFIED: User requests pickup for an AVAILABLE item ---
async function requestPickup(itemId, userId) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // --- STEP 1: Check user's borrow limit ---
        await checkBorrowLimit(conn, userId);
        // --- END STEP 1 ---

        // 2. Check Availability
        const [items] = await conn.query(
          'SELECT available, category FROM ITEM WHERE item_id = ? FOR UPDATE', // Lock the row
          [itemId]
        );
        if (items.length === 0) throw new Error('Item not found.');
        if (items[0].available <= 0) throw new Error('Item is not available.');

        // --- STEP 2.5: CHECK FOR EXISTING HOLD (NEW) ---
        // Check if this user *already* has an active hold on this *exact* item.
        const [existingHolds] = await conn.query(
            `SELECT COUNT(*) as holdCount 
             FROM HOLD 
             WHERE user_id = ? AND item_id = ? AND expires_at > NOW()`,
            [userId, itemId]
        );

        if (existingHolds[0].holdCount > 0) {
            throw new Error('You already have an active hold on this item.');
        }
        // --- END STEP 2.5 ---

        // 3. Put item on hold
        await conn.query(
            'UPDATE ITEM SET available = available - 1, on_hold = on_hold + 1 WHERE item_id = ?', 
            [itemId]
        );

        // 4. Create HOLD record (e.g., expires in 3 days)
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

// --- MODIFIED: Staff checks out a PENDING hold ---
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
        
        // --- STEP 2: Get Loan Policy (MODIFIED) ---
        // We now pass the userId to the new helper
        const policy = await getLoanPolicy(conn, userId, itemId);
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + policy.loan_days);
        // --- END STEP 2 ---

        // 3. Update ITEM status (No change)
        await conn.query(
            'UPDATE ITEM SET on_hold = on_hold - 1, loaned_out = loaned_out + 1 WHERE item_id = ?', 
            [itemId]
        );

        // 4. Update HOLD status (No change)
        await conn.query(
            'UPDATE HOLD SET picked_up_at = NOW() WHERE hold_id = ?', 
            [holdId]
        );

        // 5. Create BORROW record (No change)
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


// --- MODIFIED: User returns a LOANED OUT item ---
async function returnItem(borrowId, staffUserId) { // staffUserId for auth later
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const returnedStatusId = await getStatusId(conn, 'Returned');
        const loanedOutStatusId = await getStatusId(conn, 'Loaned Out');

        // 1. Get Borrow details & lock Item (No change)
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

        // 2. Update ITEM status (No change)
        await conn.query(
            'UPDATE ITEM SET loaned_out = loaned_out - 1, available = available + 1 WHERE item_id = ?', 
            [itemId]
        );

        // 3. Update BORROW status (No change)
        await conn.query(
            'UPDATE BORROW SET status_id = ?, return_date = CURDATE() WHERE borrow_id = ?', 
            [returnedStatusId, borrowId]
        );

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

// --- MODIFIED: Staff marks a loan as LOST ---
async function markLost(borrowId, staffUserId) { // staffUserId for auth
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const lostStatusId = await getStatusId(conn, 'Lost');
        const loanedOutStatusId = await getStatusId(conn, 'Loaned Out'); 

         // 1. Get Borrow details & lock Item (No change)
        const [borrows] = await conn.query(
            `SELECT b.item_id, b.user_id, i.category 
             FROM BORROW b
             JOIN ITEM i ON b.item_id = i.item_id
             WHERE b.borrow_id = ? AND b.status_id = ? 
             FOR UPDATE OF i`, 
            [borrowId, loanedOutStatusId] 
        );
        if (borrows.length === 0) throw new Error('Active loan not found to mark as lost.');

        const { item_id: itemId, user_id: userId } = borrows[0];

        // 2. Update ITEM status (item is gone) (No change)
        await conn.query(
            'UPDATE ITEM SET loaned_out = loaned_out - 1 WHERE item_id = ?', 
            [itemId]
        );

        // 3. Update BORROW status (No change)
        await conn.query(
            'UPDATE BORROW SET status_id = ? WHERE borrow_id = ?', 
            [lostStatusId, borrowId]
        );

        // --- STEP 4: Create LOST fine (MODIFIED) ---
        // Get policy using new helper
        const policy = await getLoanPolicy(conn, userId, itemId);
        const fineSql = `
            INSERT INTO FINE (borrow_id, user_id, fee_type, amount, notes)
            VALUES (?, ?, 'LOST', ?, ?)
        `;
        await conn.query(fineSql, [
            borrowId, userId, policy.lost_fee, 
            'Item marked as lost.'
        ]);
        // --- END STEP 4 ---

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

// --- Staff marks a LOST item as FOUND (No Change) ---
async function markFound(borrowId, staffUserId) { 
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const lostStatusId = await getStatusId(conn, 'Lost');
        const returnedStatusId = await getStatusId(conn, 'Returned');

         // 1. Get Borrow details
        const [borrows] = await conn.query(
            `SELECT b.item_id, b.user_id 
             FROM BORROW b
             JOIN ITEM i ON b.item_id = i.item_id
             WHERE b.borrow_id = ? AND b.status_id = ? 
             FOR UPDATE OF i`, 
            [borrowId, lostStatusId] 
        );
        if (borrows.length === 0) throw new Error('Lost loan not found.');

        const { item_id: itemId } = borrows[0];

        // 2. Update ITEM status
        await conn.query(
            'UPDATE ITEM SET available = available + 1 WHERE item_id = ?', 
            [itemId]
        );

        // 3. Update BORROW status
        await conn.query(
            'UPDATE BORROW SET status_id = ?, return_date = CURDATE() WHERE borrow_id = ?', 
            [returnedStatusId, borrowId]
        );

        // 4. Waive the associated 'LOST' fine
        const waiveReason = 'Item marked as found by staff.';
        await conn.query(
            `UPDATE FINE 
             SET waived_at = NOW(), waived_reason = ?
             WHERE borrow_id = ? AND fee_type = 'LOST' AND date_paid IS NULL AND waived_at IS NULL`,
            [waiveReason, borrowId]
        );

        await conn.commit();
        return { borrow_id: borrowId, message: 'Item marked as found, returned to available, and associated LOST fine waived.' };

    } catch (error) {
        await conn.rollback();
        console.error("Error in markFound transaction:", error);
        throw error;
    } finally {
        conn.release();
    }
}


// --- MODIFIED: User places a hold on an UNAVAILABLE item (Waitlist) ---
async function placeWaitlistHold(itemId, userId) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // --- STEP 1: Check user's borrow limit (NEW) ---
        await checkBorrowLimit(conn, userId);
        // --- END STEP 1 ---

        // 2. Check Availability & Lock Item
        const [items] = await conn.query(
          'SELECT available FROM ITEM WHERE item_id = ? FOR UPDATE', 
          [itemId]
        );
        if (items.length === 0) throw new Error('Item not found.');
        if (items[0].available > 0) {
            throw new Error('Item is currently available. Please use "Request Pickup" instead.');
        }

        // 3. Check if user already on waitlist
        const [waitlist] = await conn.query(
            'SELECT * FROM WAITLIST WHERE item_id = ? AND user_id = ?', 
            [itemId, userId]
        );
        if (waitlist.length > 0) throw new Error('You are already on the waitlist.');

        // 4. Add to WAITLIST
        const waitlistSql = `
            INSERT INTO WAITLIST (start_date, user_id, item_id) 
            VALUES (CURDATE(), ?, ?)
        `;
        const [result] = await conn.query(waitlistSql, [userId, itemId]);
        
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


// --- MODIFIED: Staff directly checks out an available item to a user. ---
async function staffCheckoutItem(itemId, userEmail, staffUserId) { // staffUserId for logging/auth later
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const loanedOutStatusId = await getStatusId(conn, 'Loaned Out');

        // --- STEP 1: Check user's borrow limit (NEW) ---
        await checkBorrowLimit(conn, userEmail);
        // --- END STEP 1 ---

        // 2. Check Availability & Lock Item
        const [items] = await conn.query(
            'SELECT available, category FROM ITEM WHERE item_id = ? FOR UPDATE', 
            [itemId]
        );
        if (items.length === 0) throw new Error('Item not found.');
        if (items[0].available <= 0) throw new Error('Item is not currently available for checkout.');
        
        const { category } = items[0];

        // --- STEP 3: Get Loan Policy (MODIFIED) ---
        const policy = await getLoanPolicy(conn, userId, itemId);
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + policy.loan_days);
        // --- END STEP 3 ---

        // 4. Update ITEM status
        await conn.query(
            'UPDATE ITEM SET available = available - 1, loaned_out = loaned_out + 1 WHERE item_id = ?', 
            [itemId]
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
        console.error("Error in staffCheckoutItem transaction:", error);
        throw error;
    } finally {
        conn.release();
    }
}


// --- NO CHANGES NEEDED for any of the functions below ---
// They only query by user_id or fine_id, or they don't depend on loan policies.

async function findLoansByUserId(userId) {
    const loanedOutStatusId = await getStatusId(db, 'Loaned Out');
    const sql = `
        SELECT 
            b.borrow_id, 
            b.item_id,
            b.due_date, 
            COALESCE(bk.title, m.title, d.device_name) AS title,
            i.thumbnail_url
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
            i.thumbnail_url
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

async function findHoldsByUserId(userId) {
   const sql = `
        SELECT 
            h.hold_id, 
            h.item_id,
            h.created_at,
            h.expires_at,
            COALESCE(bk.title, m.title, d.device_name) AS title,
            i.thumbnail_url
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

async function payFine(fineId, staffUserId) {
    const sql = 'UPDATE FINE SET date_paid = NOW() WHERE fine_id = ? AND date_paid IS NULL';
    const [result] = await db.query(sql, [fineId]);
    if (result.affectedRows === 0) {
        throw new Error('Fine not found or already paid.');
    }
    return { fine_id: fineId, message: 'Fine marked as paid.' };
}

async function userPayFine(fineId, userId) {
    const sql = `
        UPDATE FINE 
        SET date_paid = NOW() 
        WHERE fine_id = ? 
          AND user_id = ? 
          AND date_paid IS NULL 
          AND waived_at IS NULL
    `;
    const [result] = await db.query(sql, [fineId, userId]);
    
    if (result.affectedRows === 0) {
        throw new Error('Unpaid fine not found for this user.');
    }
    return { fine_id: fineId, message: 'Fine marked as paid.' };
}

async function waiveFine(fineId, reason, staffUserId) {
     const sql = 'UPDATE FINE SET waived_at = NOW(), waived_reason = ? WHERE fine_id = ? AND date_paid IS NULL AND waived_at IS NULL';
    const [result] = await db.query(sql, [reason, fineId]);
    if (result.affectedRows === 0) {
        throw new Error('Fine not found, already paid, or already waived.');
    }
    return { fine_id: fineId, message: 'Fine waived.' };
}

async function findAllStatus(type) {
    var sql;
    switch(type) {
        case 'borrow':
            sql = `SELECT status_name FROM BORROW_STATUS ORDER BY status_id;`;
            break;
        case 'hold':
            sql = `SELECT status_name FROM HOLD_STATUS ORDER BY status_id;`;
            break;
        case 'fine':
            sql = `SELECT status_name FROM FINE_STATUS ORDER BY status_id;`;
            break;
        default:
            return null;
    }
    const [rows] = await db.query(sql);
    return rows;
}

async function findAllBorrows(filters = {}) {
    const sql = `
        SELECT 
            b.borrow_id, 
            b.item_id,
            b.user_id,
            b.borrow_date,
            b.due_date, 
            b.return_date,
            bs.status_name, 
            u.firstName, 
            u.lastName,
            COALESCE(bk.title, m.title, d.device_name) AS item_title,
            i.thumbnail_url,
            i.category
        FROM BORROW b
        JOIN USER u ON b.user_id = u.user_id
        JOIN ITEM i ON b.item_id = i.item_id
        JOIN BORROW_STATUS bs ON b.status_id = bs.status_id
        LEFT JOIN BOOK bk ON i.item_id = bk.item_id AND i.category = 'BOOK'
        LEFT JOIN MOVIE m ON i.item_id = m.item_id AND i.category = 'MOVIE'
        LEFT JOIN DEVICE d ON i.item_id = d.item_id AND i.category = 'DEVICE'
        ORDER BY b.borrow_date DESC;
    `;
    const [rows] = await db.query(sql);
    return rows;
}

async function findAllHolds(filters = {}) {
    let whereClauses = [];
    let queryParams = [];

    const sql = `
        SELECT 
            h.hold_id, 
            h.item_id,
            h.user_id,
            h.created_at,
            h.expires_at,
            h.picked_up_at,
            h.canceled_at,
            CASE
                WHEN h.picked_up_at IS NOT NULL THEN 'Picked Up'
                WHEN h.canceled_at IS NOT NULL THEN 'Canceled'
                WHEN h.expires_at < NOW() AND h.picked_up_at IS NULL AND h.canceled_at IS NULL THEN 'Expired'
                ELSE 'Pending Pickup' 
            END AS hold_status, 
            u.firstName,
            u.lastName,
            COALESCE(bk.title, m.title, d.device_name) AS item_title,
            i.thumbnail_url,
            i.category,
            i.shelf_location
        FROM HOLD h
        JOIN USER u ON h.user_id = u.user_id
        JOIN ITEM i ON h.item_id = i.item_id
        LEFT JOIN BOOK bk ON i.item_id = bk.item_id AND i.category = 'BOOK'
        LEFT JOIN MOVIE m ON i.item_id = m.item_id AND i.category = 'MOVIE'
        LEFT JOIN DEVICE d ON i.item_id = d.item_id AND i.category = 'DEVICE'
        ORDER BY h.created_at DESC;
    `;
    console.log("findAllHolds: Fetching all holds..."); 
    const [rows] = await db.query(sql, queryParams); 

    let filteredRows = rows;
    if (filters.status) {
        const statusFilters = filters.status.split(',');
         console.log("Filtering by status:", statusFilters); 
        filteredRows = rows.filter(row => statusFilters.includes(row.hold_status));
    }

    console.log(`findAllHolds: Returning ${filteredRows.length} rows after filtering.`);
    return filteredRows; 
}

async function cancelHold(holdId, staffUserId) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Get Hold details
        const [holds] = await conn.query(
            `SELECT item_id 
             FROM HOLD 
             WHERE hold_id = ? AND picked_up_at IS NULL AND canceled_at IS NULL AND expires_at >= NOW()
             FOR UPDATE`, 
            [holdId]
        );
        if (holds.length === 0) throw new Error('Active hold not found or already processed/expired.');
        
        const { item_id: itemId } = holds[0];

        // 2. Update HOLD status
        await conn.query(
            'UPDATE HOLD SET canceled_at = NOW() WHERE hold_id = ?', 
            [holdId]
        );

        // 3. Update ITEM status
        await conn.query(
            'UPDATE ITEM SET on_hold = on_hold - 1, available = available + 1 WHERE item_id = ?', 
            [itemId]
        );

        await conn.commit();
        return { hold_id: holdId, message: 'Hold canceled successfully. Item returned to available.' };

    } catch (error) {
        await conn.rollback();
        console.error("Error in cancelHold transaction:", error);
        throw error;
    } finally {
        conn.release();
    }
}

async function findAllFines(filters = {}) {
    const sql = `
        SELECT 
            f.fine_id,
            f.borrow_id,
            f.user_id,
            u.firstName,
            u.lastName,
            f.fee_type,
            f.amount,
            f.date_issued,
            f.date_paid,
            f.notes,
            f.waived_at,
            f.waived_reason,
            COALESCE(bk.title, m.title, d.device_name) AS item_title,
            i.item_id
        FROM FINE f
        JOIN USER u ON f.user_id = u.user_id
        LEFT JOIN BORROW b ON f.borrow_id = b.borrow_id
        LEFT JOIN ITEM i ON b.item_id = i.item_id
        LEFT JOIN BOOK bk ON i.item_id = bk.item_id AND i.category = 'BOOK'
        LEFT JOIN MOVIE m ON i.item_id = m.item_id AND i.category = 'MOVIE'
        LEFT JOIN DEVICE d ON i.item_id = d.item_id AND i.category = 'DEVICE'
        ORDER BY f.date_issued DESC; 
    `;
     const [rows] = await db.query(sql);
    return rows;
}

async function staffCreateFine(fineData, staffUserId) {
    const { borrow_id, user_id, fee_type, amount, notes } = fineData;

    if (!borrow_id || !user_id || !fee_type || !amount) {
        throw new Error('Missing required fields (borrow_id, user_id, fee_type, amount).');
    }
    const validFeeTypes = ['LATE', 'LOST', 'DAMAGED'];
    if (!validFeeTypes.includes(fee_type.toUpperCase())) {
        throw new Error(`Invalid fee_type. Must be one of: ${validFeeTypes.join(', ')}`);
    }

    const sql = `
        INSERT INTO FINE (borrow_id, user_id, fee_type, amount, notes, date_issued)
        VALUES (?, ?, ?, ?, ?, NOW()) 
    `;
    const [result] = await db.query(sql, [borrow_id, user_id, fee_type.toUpperCase(), amount, notes]);

    return { fine_id: result.insertId, message: 'Fine created successfully.' };
}

async function cancelMyHold(holdId, userId) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Get Hold details AND verify ownership
        // This is the key change: we add "AND user_id = ?"
        const [holds] = await conn.query(
            `SELECT item_id 
             FROM HOLD 
             WHERE hold_id = ? AND user_id = ? 
               AND picked_up_at IS NULL 
               AND canceled_at IS NULL 
               AND expires_at >= NOW()
             FOR UPDATE`, 
            [holdId, userId] // Pass both IDs
        );

        if (holds.length === 0) {
            // This error now triggers if:
            // 1. The hold doesn't exist.
            // 2. The hold is already picked up/canceled/expired.
            // 3. The hold belongs to a *different* user.
            throw new Error('Active hold not found or does not belong to user.');
        }
        
        const { item_id: itemId } = holds[0];

        // 2. Update HOLD status
        await conn.query(
            'UPDATE HOLD SET canceled_at = NOW() WHERE hold_id = ?', 
            [holdId]
        );

        // 3. Update ITEM status
        await conn.query(
            'UPDATE ITEM SET on_hold = on_hold - 1, available = available + 1 WHERE item_id = ?', 
            [itemId]
        );

        await conn.commit();
        return { hold_id: holdId, message: 'Your hold has been canceled.' };

    } catch (error) {
        await conn.rollback();
        console.error("Error in cancelMyHold transaction:", error);
        throw error;
    } finally {
        conn.release();
    }
}


module.exports = {
    requestPickup,
    pickupHold,
    returnItem,
    markLost,
    markFound,
    placeWaitlistHold,
    findLoansByUserId,
    findLoanHistoryByUserId,
    findHoldsByUserId,
    findWaitlistByUserId,
    findFinesByUserId,
    payFine,
    userPayFine,
    waiveFine,
    findAllBorrows,
    findAllHolds,
    cancelHold,
    staffCheckoutItem,
    findAllFines,
    staffCreateFine,
    findAllStatus,
    cancelMyHold
};
const db = require('../config/db'); 
const { v4: uuidv4 } = require('uuid'); 

async function getStatusId(conn, statusName) {
  const [rows] = await conn.query(
    'SELECT status_id FROM BORROW_STATUS WHERE status_name = ?', 
    [statusName]
    );
  if (rows.length === 0) throw new Error(`Status '${statusName}' not found`);
  return rows[0].status_id;
}

async function findByEmail(email) {
    const sql = `
        SELECT * FROM USER 
        WHERE email = ? 
        LIMIT 1;
    `;
    const [users] = await db.query(sql, [email]);
    return users[0]; // Returns the user object or undefined
}

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

async function checkBorrowLimit(conn, userId) {
    console.log('Checking borrow limit for user:', userId); 
    
    // 1. Get the user's limit from their role
    const [roleRows] = await conn.query(`
        SELECT ur.total_borrow_limit 
        FROM USER u
        JOIN USER_ROLE ur ON u.role_id = ur.role_id
        WHERE u.user_id = ?
    `, [userId]); 

    if (roleRows.length === 0) throw new Error('User role not found.');
    const limit = roleRows[0].total_borrow_limit;

    // 2. Get user's current active checkouts
    const loanedOutStatusId = await getStatusId(conn, 'Loaned Out');
    const [borrowCountRows] = await conn.query(
        'SELECT COUNT(*) as count FROM BORROW WHERE user_id = ? AND status_id = ?',
        [userId, loanedOutStatusId] 
    );
    const borrowCount = borrowCountRows[0].count;

    // 3. Get user's current active holds
    const [holdCountRows] = await conn.query(
        'SELECT COUNT(*) as count FROM HOLD WHERE user_id = ? AND picked_up_at IS NULL AND canceled_at IS NULL AND expires_at >= NOW()',
        [userId] 
    );
    const holdCount = holdCountRows[0].count;

    // 4. Check total against limit
    if ((borrowCount + holdCount) >= limit) {
        throw new Error(`Borrow limit reached (${limit} items). You currently have ${borrowCount} borrows and ${holdCount} active holds.`);
    }
    return true; 
}

async function requestPickup(itemId, userId) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        await checkBorrowLimit(conn, userId);

        const [items] = await conn.query(
          'SELECT available, category FROM ITEM WHERE item_id = ? FOR UPDATE', // Lock the row
          [itemId]
        );
        if (items.length === 0) throw new Error('Item not found.');
        if (items[0].available <= 0) throw new Error('Item is not available.');

        // Check if this user already has an active hold on this exact item.
        const [existingHolds] = await conn.query(
            `SELECT COUNT(*) as holdCount 
             FROM HOLD 
             WHERE user_id = ? AND item_id = ? AND expires_at > NOW()`,
            [userId, itemId]
        );

        if (existingHolds[0].holdCount > 0) {
            throw new Error('You already have an active hold on this item.');
        }

        await conn.query(
            'UPDATE ITEM SET available = available - 1, on_hold = on_hold + 1 WHERE item_id = ?', 
            [itemId]
        );

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
async function pickupHold(holdId, staffUserId) { 
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
        
        // --- 2: Get Loan Policy ---
        const policy = await getLoanPolicy(conn, userId, itemId);
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
async function returnItem(borrowId, staffUserId) {
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
async function markLost(borrowId, staffUserId) { 
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const lostStatusId = await getStatusId(conn, 'Lost');
        const loanedOutStatusId = await getStatusId(conn, 'Loaned Out'); 

         // 1. Get Borrow details & lock Item
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

        // --- STEP 4: Create LOST fine  ---
        const policy = await getLoanPolicy(conn, userId, itemId);
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

// --- Staff marks a LOST item as FOUND ---
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

// --- User places a hold on an UNAVAILABLE item (Waitlist) ---
async function placeWaitlistHold(itemId, userId) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // --- STEP 1: Check user's borrow limit ---
        await checkBorrowLimit(conn, userId);

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

async function cancelWaitlist(waitlistId, userId) {
    const sql = `
        DELETE FROM WAITLIST 
        WHERE waitlist_id = ? AND user_id = ?
    `;
    const [result] = await db.query(sql, [waitlistId, userId]);
    // result contains affectedRows, which we can check in the controller
    return result; 
}

// --- Staff directly checks out an available item to a user. ---
async function staffCheckoutItem(itemId, userId, staffUserId) { 
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const loanedOutStatusId = await getStatusId(conn, 'Loaned Out');

        // --- STEP 1: Check user's borrow limit ---
        await checkBorrowLimit(conn, userId);

        // 2. Check Availability & Lock Item
        const [items] = await conn.query(
            'SELECT available, category FROM ITEM WHERE item_id = ? FOR UPDATE', 
            [itemId]
        );
        if (items.length === 0) throw new Error('Item not found.');
        if (items[0].available <= 0) throw new Error('Item is not currently available for checkout.');
        
        const { category } = items[0];

        // --- STEP 3: Get Loan Policy ---
        const policy = await getLoanPolicy(conn, userId, itemId);
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + policy.loan_days);

        // 4. Update ITEM status
        await conn.query(
            'UPDATE ITEM SET available = available - 1, loaned_out = loaned_out + 1 WHERE item_id = ?', 
            [itemId]
        );

        // 5. Create BORROW record
        const borrowId = `B${Date.now()}${Math.floor(Math.random()*100)}`;
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
            i.thumbnail_url,
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

async function findAllBorrows(searchTerm, filters = {}, sort = 'borrow_newest') {

    let params = [];
    let whereClauses = [];

    const baseSql = `
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
            u.email,
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
    `;

    // --- Search Term Logic ---
    if (searchTerm && searchTerm.trim()) {
        const queryTerm = `%${searchTerm}%`;
        whereClauses.push(`(
            b.borrow_id LIKE ? OR
            u.firstName LIKE ? OR
            u.lastName LIKE ? OR
            u.email LIKE ? OR
            i.item_id LIKE ? OR
            bk.title LIKE ? OR
            m.title LIKE ? OR
            d.device_name LIKE ?
        )`);
        params.push(queryTerm, queryTerm, queryTerm, queryTerm, queryTerm, queryTerm, queryTerm, queryTerm);
    }

    // --- Filter Logic ---
    const statusFilter = filters.status ? filters.status.split(',') : [];
    if (statusFilter.length > 0) {
        whereClauses.push(`bs.status_name IN (?)`);
        params.push(statusFilter);
    }

    // --- Assemble Final SQL ---
    let finalSql = baseSql;
    if (whereClauses.length > 0) {
        finalSql += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    
    // --- Dynamic ORDER BY logic ---
    let orderByClause = ' ORDER BY b.borrow_date DESC';
    switch (sort) {
        case 'borrow_oldest':
            orderByClause = ' ORDER BY b.borrow_date ASC';
            break;
        case 'due_soonest':
            orderByClause = ' ORDER BY b.due_date IS NULL ASC, b.due_date ASC';
            break;
        case 'due_latest':
            orderByClause = ' ORDER BY b.due_date DESC';
            break;
        case 'borrow_newest':
        default:
            orderByClause = ' ORDER BY b.borrow_date DESC';
    }
    finalSql += orderByClause;

    const [rows] = await db.query(finalSql, params);
    return rows;
}

async function findAllHolds(searchTerm, filters = {}, sort = 'requested_newest') {
    let whereClauses = [];
    let queryParams = [];
    
    const statusFilters = filters.status ? filters.status.split(',') : [];

    const baseSql = `
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
            u.email,
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
    `;

    // 2. Add Search Term logic
    if (searchTerm.trim()) {
        const queryTerm = `%${searchTerm}%`;
        whereClauses.push(`(
            u.firstName LIKE ? OR
            u.lastName LIKE ? OR
            u.email LIKE ? OR
            i.item_id LIKE ? OR
            bk.title LIKE ? OR
            m.title LIKE ? OR
            d.device_name LIKE ? OR
            h.hold_id LIKE ?
        )`);
        queryParams.push(queryTerm, queryTerm, queryTerm, queryTerm, queryTerm, queryTerm, queryTerm, queryTerm);
    }
    
    // 3. Add Status Filter logic (using HAVING for the calculated column)
    let havingClauses = [];
    if (statusFilters.length > 0) {
        havingClauses.push(`hold_status IN (?)`);
        queryParams.push(statusFilters); // This param will be added after the search params
    }

    // 4. Assemble Final SQL
    let finalSql = baseSql;
    if (whereClauses.length > 0) {
        finalSql += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    finalSql += ` GROUP BY h.hold_id`; // GROUP BY is needed to use HAVING

    if (havingClauses.length > 0) {
        finalSql += ` HAVING ${havingClauses.join(' AND ')}`;
    }

    let orderByClause = ' ORDER BY h.created_at DESC'; // Default
    switch (sort) {
        case 'requested_oldest':
            orderByClause = ' ORDER BY h.created_at ASC';
            break;
        case 'expires_soonest':
            orderByClause = ' ORDER BY h.expires_at ASC';
            break;
        case 'expires_latest':
            orderByClause = ' ORDER BY h.expires_at DESC';
            break;
        case 'title_asc':
            orderByClause = ' ORDER BY item_title ASC';
            break;
        case 'title_desc':
            orderByClause = ' ORDER BY item_title DESC';
            break;
        case 'requested_newest':
        default:
            orderByClause = ' ORDER BY h.created_at DESC';
    }
    finalSql += orderByClause;

    console.log("findAllHolds: Fetching all holds..."); 
    console.log("Executing SQL:", finalSql);
    console.log("With Params:", queryParams);

    const [rows] = await db.query(finalSql, queryParams); 

    console.log(`findAllHolds: Returning ${rows.length} rows.`);
    return rows; 
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
            u.email,
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
    // 1. Destructure 'email' instead of 'user_id'
    const { borrow_id, email, fee_type, amount, notes } = fineData;

    // 2. Update validation to check for 'email'
    if (!borrow_id || !email || !fee_type || !amount) {
        // 3. Update the error message
        throw new Error('Missing required fields (borrow_id, email, fee_type, amount).');
    }
    const validFeeTypes = ['LATE', 'LOST', 'DAMAGED'];
    if (!validFeeTypes.includes(fee_type.toUpperCase())) {
        throw new Error(`Invalid fee_type. Must be one of: ${validFeeTypes.join(', ')}`);
    }

    // 4. Find the user_id from the email
    let user_id; 
    try {
        const userSql = `SELECT user_id FROM USER WHERE email = ?`; 
        const [users] = await db.query(userSql, [email]);
        
        if (!users || users.length === 0) {
            throw new Error('No user found with the provided email.');
        }
        // Get the user_id from the lookup
        user_id = users[0].user_id; 
    
    } catch (lookupError) {
        console.error("Error looking up user by email:", lookupError);
        // Pass a clearer error message back
        throw new Error(lookupError.message || 'Could not find user by email.');
    }

    // 5. The INSERT query now uses the 'user_id' variable we just found.
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

async function findAllWaitlist(queryParams) {
    const { q = '', sort = 'requested_oldest' } = queryParams;

    let sql = `
        SELECT
            w.waitlist_id,
            w.item_id,
            w.user_id,
            w.start_date,
            i.thumbnail_url,
            i.shelf_location,
            u.firstName,
            u.lastName,
            u.email,
            COALESCE(b.title, m.title, d.device_name) AS item_title
        FROM WAITLIST w
        JOIN ITEM i ON w.item_id = i.item_id
        JOIN USER u ON w.user_id = u.user_id
        LEFT JOIN BOOK b ON i.item_id = b.item_id AND i.category = 'BOOK'
        LEFT JOIN MOVIE m ON i.item_id = m.item_id AND i.category = 'MOVIE'
        LEFT JOIN DEVICE d ON i.item_id = d.item_id AND i.category = 'DEVICE'
    `;

    // --- Search ---
    const searchTerms = q.split(' ').filter(Boolean);
    const whereClauses = [];
    const params = [];

    if (searchTerms.length > 0) {
        searchTerms.forEach(term => {
            const searchTerm = `%${term}%`;
            whereClauses.push(`
                (
                    u.firstName LIKE ? OR
                    u.lastName LIKE ? OR
                    u.email LIKE ? OR
                    COALESCE(b.title, m.title, d.device_name) LIKE ? OR
                    w.item_id LIKE ? OR
                    w.user_id LIKE ?
                )
            `);
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        });
        sql += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    // --- Sorting ---
    let orderBy = '';
    switch (sort) {
        case 'requested_newest':
            orderBy = 'w.start_date DESC';
            break;
        case 'title_asc':
            orderBy = 'item_title ASC';
            break;
        case 'title_desc':
            orderBy = 'item_title DESC';
            break;
        case 'requested_oldest':
        default:
            orderBy = 'w.start_date ASC';
            break;
    }
    sql += ` ORDER BY ${orderBy}`;

    const [rows] = await db.query(sql, params);
    return rows;
}

async function staffCancelWaitlist(waitlistId) {
    const sql = `DELETE FROM WAITLIST WHERE waitlist_id = ?`;
    const [result] = await db.query(sql, [waitlistId]);
    return result;
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
    cancelWaitlist,
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
    cancelMyHold,
    findAllWaitlist,
    staffCancelWaitlist,
    findByEmail,
};
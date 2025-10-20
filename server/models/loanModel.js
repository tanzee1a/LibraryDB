const db = require('../config/db'); 

/**
 * Creates a loan record and updates item availability.
 * This is a transaction.
 */
async function borrowItem(itemId, userId) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // Check if the item is available
        const [items] = await conn.query('SELECT available FROM ITEM WHERE item_id = ?', [itemId]);
        
        if (items.length === 0) {
            throw new Error('Item not found.');
        }
        if (items[0].available <= 0) {
            throw new Error('Item is not available to borrow.');
        }

        // Update the ITEM table (decrement available, increment loaned_out)
        const itemSql = `
            UPDATE ITEM 
            SET available = available - 1, loaned_out = loaned_out + 1 
            WHERE item_id = ?
        `;
        await conn.query(itemSql, [itemId]);

        // Insert into the BORROW table
        const borrowSql = `
            INSERT INTO BORROW (borrow_date, status, user_id, item_id) 
            VALUES (CURDATE(), 'On Loan', ?, ?)
        `;
        const [result] = await conn.query(borrowSql, [userId, itemId]);
        
        await conn.commit();
        
        // Return the new borrow record's ID
        return { borrow_id: result.insertId, message: 'Item borrowed successfully' };

    } catch (error) {
        await conn.rollback();
        console.error("Error in borrowItem transaction:", error);
        throw error;
    } finally {
        conn.release();
    }
}

/**
 * Updates a loan record to 'Returned' and updates item availability.
 * This is a transaction.
 */
async function returnItem(itemId, userId) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // Find an active loan for this user and item
        const [borrows] = await conn.query(
            'SELECT borrow_id FROM BORROW WHERE item_id = ? AND user_id = ? AND status = ?', 
            [itemId, userId, 'On Loan']
        );

        if (borrows.length === 0) {
            throw new Error('No active loan found for this item by this user.');
        }
        
        const borrowId = borrows[0].borrow_id;

        // Update the ITEM table (increment available, decrement loaned_out)
        const itemSql = `
            UPDATE ITEM 
            SET available = available + 1, loaned_out = loaned_out - 1 
            WHERE item_id = ?
        `;
        await conn.query(itemSql, [itemId]);

        // Update the BORROW table to mark it as returned
        const borrowSql = `
            UPDATE BORROW 
            SET status = 'Returned', return_date = CURDATE() 
            WHERE borrow_id = ?
        `;
        await conn.query(borrowSql, [borrowId]);
        
        await conn.commit();
        
        return { borrow_id: borrowId, message: 'Item returned successfully' };

    } catch (error) {
        await conn.rollback();
        console.error("Error in returnItem transaction:", error);
        throw error;
    } finally {
        conn.release();
    }
}

async function holdItem(itemId, userId) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // Check item availability
        const [items] = await conn.query('SELECT available FROM ITEM WHERE item_id = ?', [itemId]);
        
        if (items.length === 0) {
            throw new Error('Item not found.');
        }
        if (items[0].available > 0) {
            throw new Error('Item is available. Please borrow it instead.');
        }

        // Check if user is already on the waitlist for this item
        const [waitlist] = await conn.query(
            'SELECT * FROM WAITLIST WHERE item_id = ? AND user_id = ?', 
            [itemId, userId]
        );
        
        if (waitlist.length > 0) {
            throw new Error('You are already on the waitlist for this item.');
        }

        // Update the ITEM table (increment on_hold)
        const itemSql = `
            UPDATE ITEM 
            SET on_hold = on_hold + 1
            WHERE item_id = ?
        `;
        await conn.query(itemSql, [itemId]);

        // Insert into the WAITLIST table
        const waitlistSql = `
            INSERT INTO WAITLIST (start_date, user_id, item_id) 
            VALUES (CURDATE(), ?, ?)
        `;
        const [result] = await conn.query(waitlistSql, [userId, itemId]);
        
        await conn.commit();
        
        return { waitlist_id: result.insertId, message: 'Successfully added to waitlist' };

    } catch (error) {
        await conn.rollback();
        console.error("Error in holdItem transaction:", error);
        throw error;
    } finally {
        conn.release();
    }
}

module.exports = {
    borrowItem,
    returnItem,
    holdItem
};
const db = require('../config/db'); 

async function findAll() {
    const sql = 'SELECT * FROM ITEM';
    const [rows] = await db.query(sql);
    return rows;
}

// Find item by ID
async function findById(id) {
    const sql = 'SELECT * FROM ITEM WHERE item_id = ?';
    const [rows] = await db.query(sql, [id]);
    return rows[0];
}

// Delete Item
async function remove(id) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        // Delete from all potential child tables
        await conn.query('DELETE FROM BOOK WHERE item_id = ?', [id]);
        await conn.query('DELETE FROM MOVIE WHERE item_id = ?', [id]);
        await conn.query('DELETE FROM DEVICE WHERE item_id = ?', [id]);
        // Now delete from the parent ITEM table
        await conn.query('DELETE FROM ITEM WHERE item_id = ?', [id]);
        await conn.commit();
    } catch (error) {
        await conn.rollback();
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
}

async function createBook(bookData) {
    const conn = await db.getConnection();
    try {
        // Start a transaction
        await conn.beginTransaction();

        // 1. Insert into the parent ITEM table
        // We'll assume 'quantity' comes from the user, and others are defaults
        // 1. Remove 'quantity' from the column list
        const itemSql = `
            INSERT INTO ITEM (item_id, available, on_hold, loaned_out, category)
            VALUES (?, ?, 0, 0, 'BOOK')
        `;

        // 2. Remove the second 'bookData.quantity' from the values list
        await conn.query(itemSql, [
            bookData.item_id, 
            bookData.quantity // This value goes into the 'available' column
        ]);

        // 2. Insert into the child BOOK table
        const bookSql = `
            INSERT INTO BOOK (item_id, title, description, publisher, published_year, shelf_location)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        await conn.query(bookSql, [
            bookData.item_id,
            bookData.title,
            bookData.description,
            bookData.publisher,
            bookData.published_year,
            bookData.shelf_location
        ]);
        
        // If both inserts worked, commit the changes
        await conn.commit();
        
        // Return the newly created book info
        return { item_id: bookData.item_id, ...bookData };

    } catch (error) {
        // If anything went wrong, roll back the changes
        await conn.rollback();
        console.error("Error in createBook transaction:", error);
        throw error;
    } finally {
        // Always release the connection
        conn.release();
    }
}

// create and update to be added

module.exports = {
    findAll,
    findById,
    remove,
    createBook
};
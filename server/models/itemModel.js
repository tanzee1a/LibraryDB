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
        await conn.beginTransaction();

        // 1. Insert into ITEM
        const itemSql = `
            INSERT INTO ITEM (item_id, available, on_hold, loaned_out, category)
            VALUES (?, ?, 0, 0, 'BOOK')
        `;
        await conn.query(itemSql, [bookData.item_id, bookData.quantity]);

        // 2. Insert into BOOK
        const bookSql = `
            INSERT INTO BOOK (item_id, title, description, publisher, published_year, shelf_location)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        await conn.query(bookSql, [
            bookData.item_id, bookData.title, bookData.description,
            bookData.publisher, bookData.published_year, bookData.shelf_location
        ]);

        // 3. Insert into BOOK_AUTHOR (Loop)
        if (bookData.authors && bookData.authors.length > 0) {
            const authorSql = 'INSERT INTO BOOK_AUTHOR (item_id, author_name) VALUES ?';
            const authorValues = bookData.authors.map(author => [bookData.item_id, author]);
            await conn.query(authorSql, [authorValues]);
        }
        
        // 4. Insert into BOOK_GENRE (Loop)
        if (bookData.genres && bookData.genres.length > 0) {
            const genreSql = 'INSERT INTO BOOK_GENRE (item_id, genre_name) VALUES ?';
            const genreValues = bookData.genres.map(genre => [bookData.item_id, genre]);
            await conn.query(genreSql, [genreValues]);
        }

        // 5. Insert into BOOK_TAG (Loop)
        if (bookData.tags && bookData.tags.length > 0) {
            const tagSql = 'INSERT INTO BOOK_TAG (item_id, tag_name) VALUES ?';
            const tagValues = bookData.tags.map(tag => [bookData.item_id, tag]);
            await conn.query(tagSql, [tagValues]);
        }
        
        await conn.commit();
        return { item_id: bookData.item_id, ...bookData };

    } catch (error) {
        await conn.rollback();
        console.error("Error in createBook transaction:", error);
        throw error;
    } finally {
        conn.release();
    }
}

async function updateBook(id, bookData) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Update ITEM
        const itemSql = 'UPDATE ITEM SET available = ? WHERE item_id = ?';
        await conn.query(itemSql, [bookData.quantity, id]);

        // 2. Update BOOK
        const bookSql = `
            UPDATE BOOK
            SET title = ?, description = ?, publisher = ?, 
                published_year = ?, shelf_location = ?
            WHERE item_id = ?
        `;
        await conn.query(bookSql, [
            bookData.title, bookData.description, bookData.publisher,
            bookData.published_year, bookData.shelf_location, id
        ]);

        // 3. Update Authors (Delete all, then re-insert)
        await conn.query('DELETE FROM BOOK_AUTHOR WHERE item_id = ?', [id]);
        if (bookData.authors && bookData.authors.length > 0) {
            const authorSql = 'INSERT INTO BOOK_AUTHOR (item_id, author_name) VALUES ?';
            const authorValues = bookData.authors.map(author => [id, author]);
            await conn.query(authorSql, [authorValues]);
        }

        // 4. Update Genres (Delete all, then re-insert)
        await conn.query('DELETE FROM BOOK_GENRE WHERE item_id = ?', [id]);
        if (bookData.genres && bookData.genres.length > 0) {
            const genreSql = 'INSERT INTO BOOK_GENRE (item_id, genre_name) VALUES ?';
            const genreValues = bookData.genres.map(genre => [id, genre]);
            await conn.query(genreSql, [genreValues]);
        }

        // 5. Update Tags (Delete all, then re-insert)
        await conn.query('DELETE FROM BOOK_TAG WHERE item_id = ?', [id]);
        if (bookData.tags && bookData.tags.length > 0) {
            const tagSql = 'INSERT INTO BOOK_TAG (item_id, tag_name) VALUES ?';
            const tagValues = bookData.tags.map(tag => [id, tag]);
            await conn.query(tagSql, [tagValues]);
        }

        await conn.commit();
        return { item_id: id, ...bookData };

    } catch (error) {
        await conn.rollback();
        console.error("Error in updateBook transaction:", error);
        throw error;
    } finally {
        conn.release();
    }
}

// Add to itemModel.js
async function createMovie(movieData) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Insert into ITEM
        const itemSql = `
            INSERT INTO ITEM (item_id, available, on_hold, loaned_out, category)
            VALUES (?, ?, 0, 0, 'MOVIE')
        `;
        await conn.query(itemSql, [movieData.item_id, movieData.quantity]);

        // 2. Insert into MOVIE
        const movieSql = `
            INSERT INTO MOVIE (item_id, title, description)
            VALUES (?, ?, ?)
        `;
        await conn.query(movieSql, [
            movieData.item_id, movieData.title, movieData.description
        ]);

        // 3. Insert into MOVIE_DIRECTOR (Loop)
        if (movieData.directors && movieData.directors.length > 0) {
            const directorSql = 'INSERT INTO MOVIE_DIRECTOR (item_id, director_name) VALUES ?';
            const directorValues = movieData.directors.map(director => [movieData.item_id, director]);
            await conn.query(directorSql, [directorValues]);
        }
        
        // 4. Insert into MOVIE_GENRE (Loop)
        if (movieData.genres && movieData.genres.length > 0) {
            const genreSql = 'INSERT INTO MOVIE_GENRE (item_id, genre) VALUES ?';
            const genreValues = movieData.genres.map(genre => [movieData.item_id, genre]);
            await conn.query(genreSql, [genreValues]);
        }

        // 5. Insert into MOVIE_TAG (Loop)
        if (movieData.tags && movieData.tags.length > 0) {
            const tagSql = 'INSERT INTO MOVIE_TAG (item_id, tag) VALUES ?';
            const tagValues = movieData.tags.map(tag => [movieData.item_id, tag]);
            await conn.query(tagSql, [tagValues]);
        }
        
        await conn.commit();
        return { item_id: movieData.item_id, ...movieData };

    } catch (error) {
        await conn.rollback();
        console.error("Error in createMovie transaction:", error);
        throw error;
    } finally {
        conn.release();
    }
}

async function updateMovie(id, movieData) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Update ITEM
        const itemSql = 'UPDATE ITEM SET available = ? WHERE item_id = ?';
        await conn.query(itemSql, [movieData.quantity, id]);

        // 2. Update MOVIE
        const movieSql = 'UPDATE MOVIE SET title = ?, description = ? WHERE item_id = ?';
        await conn.query(movieSql, [
            movieData.title, movieData.description, id
        ]);

        // 3. Update Directors (Delete all, then re-insert)
        await conn.query('DELETE FROM MOVIE_DIRECTOR WHERE item_id = ?', [id]);
        if (movieData.directors && movieData.directors.length > 0) {
            const directorSql = 'INSERT INTO MOVIE_DIRECTOR (item_id, director_name) VALUES ?';
            const directorValues = movieData.directors.map(director => [id, director]);
            await conn.query(directorSql, [directorValues]);
        }

        // 4. Update Genres (Delete all, then re-insert)
        await conn.query('DELETE FROM MOVIE_GENRE WHERE item_id = ?', [id]);
        if (movieData.genres && movieData.genres.length > 0) {
            const genreSql = 'INSERT INTO MOVIE_GENRE (item_id, genre) VALUES ?';
            const genreValues = movieData.genres.map(genre => [id, genre]);
            await conn.query(genreSql, [genreValues]);
        }

        // 5. Update Tags (Delete all, then re-insert)
        await conn.query('DELETE FROM MOVIE_TAG WHERE item_id = ?', [id]);
        if (movieData.tags && movieData.tags.length > 0) {
            const tagSql = 'INSERT INTO MOVIE_TAG (item_id, tag) VALUES ?';
            const tagValues = movieData.tags.map(tag => [id, tag]);
            await conn.query(tagSql, [tagValues]);
        }

        await conn.commit();
        return { item_id: id, ...movieData };

    } catch (error) {
        await conn.rollback();
        console.error("Error in updateMovie transaction:", error);
        throw error;
    } finally {
        conn.release();
    }
}

// Add to itemModel.js
async function createDevice(deviceData) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Insert into ITEM
        const itemSql = `
            INSERT INTO ITEM (item_id, available, on_hold, loaned_out, category)
            VALUES (?, ?, 0, 0, 'DEVICE')
        `;
        await conn.query(itemSql, [deviceData.item_id, deviceData.quantity]);

        // 2. Insert into DEVICE
        const deviceSql = `
            INSERT INTO DEVICE (item_id, serial_number, manufacturer, model, description, type)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        await conn.query(deviceSql, [
            deviceData.item_id, deviceData.serial_number, deviceData.manufacturer,
            deviceData.model, deviceData.description, deviceData.type
        ]);
        
        await conn.commit();
        return { item_id: deviceData.item_id, ...deviceData };

    } catch (error) {
        await conn.rollback();
        console.error("Error in createDevice transaction:", error);
        throw error;
    } finally {
        conn.release();
    }
}

async function updateDevice(id, deviceData) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Update ITEM
        const itemSql = 'UPDATE ITEM SET available = ? WHERE item_id = ?';
        await conn.query(itemSql, [deviceData.quantity, id]);

        // 2. Update DEVICE
        const deviceSql = `
            UPDATE DEVICE
            SET serial_number = ?, manufacturer = ?, model = ?, 
                description = ?, type = ?
            WHERE item_id = ?
        `;
        await conn.query(deviceSql, [
            deviceData.serial_number, deviceData.manufacturer, deviceData.model,
            deviceData.description, deviceData.type, id
        ]);
        
        await conn.commit();
        return { item_id: id, ...deviceData };

    } catch (error) {
        await conn.rollback();
        console.error("Error in updateDevice transaction:", error);
        throw error;
    } finally {
        conn.release();
    }
}

module.exports = {
    findAll,
    findById,
    remove,
    createBook,
    updateBook,
    createMovie,
    updateMovie,
    createDevice,
    updateDevice
};
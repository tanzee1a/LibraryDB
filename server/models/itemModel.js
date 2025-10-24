const db = require('../config/db'); 

// --- Helper: Find or Create Author ID ---
// (We need this because the frontend sends names, but the DB needs IDs)
async function findOrCreateAuthorId(conn, authorName) {
  // Simple split for now, assumes "First Last"
  const names = authorName.trim().split(' ');
  const firstName = names[0];
  const lastName = names.length > 1 ? names[names.length - 1] : null;

  // Check if author exists
  let [rows] = await conn.query(
    'SELECT author_id FROM AUTHOR WHERE first_name = ? AND last_name <=> ?', 
    [firstName, lastName]
  );

  if (rows.length > 0) {
    return rows[0].author_id; // Return existing ID
  } else {
    // Insert new author
    const [result] = await conn.query(
      'INSERT INTO AUTHOR (first_name, last_name) VALUES (?, ?)', 
      [firstName, lastName]
    );
    return result.insertId; // Return new ID
  }
}

// --- Helper: Find or Create Director ID ---
// (Similar logic for directors)
async function findOrCreateDirectorId(conn, directorName) {
  const names = directorName.trim().split(' ');
  const firstName = names[0];
  const lastName = names.length > 1 ? names[names.length - 1] : null;
  let [rows] = await conn.query(
    'SELECT director_id FROM DIRECTOR WHERE first_name = ? AND last_name <=> ?',
    [firstName, lastName]
    );
  if (rows.length > 0) return rows[0].director_id;
  const [result] = await conn.query(
    'INSERT INTO DIRECTOR (first_name, last_name) VALUES (?, ?)',
    [firstName, lastName]
    );
  return result.insertId;
}

// --- Helper: Find or Create Tag ID ---
async function findOrCreateTagId(conn, tagName) {
  tagName = tagName.trim();
  let [rows] = await conn.query('SELECT tag_id FROM TAG WHERE tag_name = ?', [tagName]);
  if (rows.length > 0) return rows[0].tag_id;
  const [result] = await conn.query('INSERT INTO TAG (tag_name) VALUES (?)', [tagName]);
  return result.insertId;
}


// --- FIND ALL ITEMS (Basic for now) ---
async function findAll() {
    const sql = 'SELECT * FROM ITEM'; // Keep it simple for now
    const [rows] = await db.query(sql);
    return rows;
}

// --- FIND ITEM BY ID (Basic for now) ---
async function findById(id) {
    const sql = 'SELECT * FROM ITEM WHERE item_id = ?';
    const [rows] = await db.query(sql, [id]);
    // TODO: Later, enhance this to JOIN with Book/Movie/Device details
    return rows[0]; 
}

// --- DELETE ITEM (Simpler now due to CASCADE) ---
async function remove(id) {
    // Because your Foreign Keys use ON DELETE CASCADE, 
    // deleting from ITEM automatically deletes from children (BOOK, MOVIE, DEVICE, etc.)
    const sql = 'DELETE FROM ITEM WHERE item_id = ?';
    await db.query(sql, [id]);
}

// --- CREATE BOOK (Updated for new schema) ---
async function createBook(bookData) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Insert into ITEM
        const itemSql = `
            INSERT INTO ITEM (item_id, available, category, description, thumbnail_url, shelf_location)
            VALUES (?, ?, 'BOOK', ?, ?, ?) 
        `;
        await conn.query(itemSql, [
            bookData.item_id, bookData.quantity, bookData.description, 
            bookData.thumbnail_url, bookData.shelf_location // Note: shelf_location is now in ITEM
        ]);

        // 2. Insert into BOOK
        const bookSql = `
            INSERT INTO BOOK (isbn_13, item_id, title, publisher, published_date, language_id, page_number)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        await conn.query(bookSql, [
            bookData.isbn_13, bookData.item_id, bookData.title, bookData.publisher, 
            bookData.published_date, bookData.language_id, bookData.page_number
        ]);

        // 3. Handle Authors (Find or Create IDs, then Insert into BOOK_AUTHOR)
        if (bookData.authors && bookData.authors.length > 0) {
            const authorIds = await Promise.all(
              bookData.authors.map(name => findOrCreateAuthorId(conn, name))
            );
            const authorSql = 'INSERT INTO BOOK_AUTHOR (item_id, author_id) VALUES ?';
            const authorValues = authorIds.map(authorId => [bookData.item_id, authorId]);
            if (authorValues.length > 0) await conn.query(authorSql, [authorValues]);
        }
        
        // 4. Handle Tags (Find or Create IDs, then Insert into ITEM_TAG)
        if (bookData.tags && bookData.tags.length > 0) {
            const tagIds = await Promise.all(
              bookData.tags.map(name => findOrCreateTagId(conn, name))
            );
            const tagSql = 'INSERT INTO ITEM_TAG (item_id, tag_id) VALUES ?';
            const tagValues = tagIds.map(tagId => [bookData.item_id, tagId]);
            if (tagValues.length > 0) await conn.query(tagSql, [tagValues]);
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

// --- UPDATE BOOK (Updated for new schema) ---
async function updateBook(id, bookData) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Update ITEM
        const itemSql = `
          UPDATE ITEM 
          SET available = ?, description = ?, thumbnail_url = ?, shelf_location = ?
          WHERE item_id = ?
        `;
        // Note: We only update 'available' based on 'quantity' now.
        // on_hold/loaned_out are managed by borrow/return/hold logic.
        await conn.query(itemSql, [
            bookData.quantity, bookData.description, bookData.thumbnail_url, 
            bookData.shelf_location, id
        ]);

        // 2. Update BOOK
        const bookSql = `
            UPDATE BOOK
            SET isbn_13 = ?, title = ?, publisher = ?, published_date = ?, 
                language_id = ?, page_number = ?
            WHERE item_id = ?
        `;
        await conn.query(bookSql, [
            bookData.isbn_13, bookData.title, bookData.publisher, bookData.published_date,
            bookData.language_id, bookData.page_number, id
        ]);

        // 3. Update Authors (Delete all, Find or Create, Re-insert)
        await conn.query('DELETE FROM BOOK_AUTHOR WHERE item_id = ?', [id]);
        if (bookData.authors && bookData.authors.length > 0) {
           const authorIds = await Promise.all(
              bookData.authors.map(name => findOrCreateAuthorId(conn, name))
            );
            const authorSql = 'INSERT INTO BOOK_AUTHOR (item_id, author_id) VALUES ?';
            const authorValues = authorIds.map(authorId => [id, authorId]);
             if (authorValues.length > 0) await conn.query(authorSql, [authorValues]);
        }

        // 4. Update Tags (Delete all, Find or Create, Re-insert)
        await conn.query('DELETE FROM ITEM_TAG WHERE item_id = ?', [id]);
        if (bookData.tags && bookData.tags.length > 0) {
            const tagIds = await Promise.all(
              bookData.tags.map(name => findOrCreateTagId(conn, name))
            );
            const tagSql = 'INSERT INTO ITEM_TAG (item_id, tag_id) VALUES ?';
            const tagValues = tagIds.map(tagId => [id, tagId]);
             if (tagValues.length > 0) await conn.query(tagSql, [tagValues]);
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


// --- CREATE MOVIE (Updated for new schema) ---
async function createMovie(movieData) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Insert into ITEM
        const itemSql = `
            INSERT INTO ITEM (item_id, available, category, description, thumbnail_url, shelf_location)
            VALUES (?, ?, 'MOVIE', ?, ?, ?)
        `;
        await conn.query(itemSql, [
            movieData.item_id, movieData.quantity, movieData.description, 
            movieData.thumbnail_url, movieData.shelf_location 
        ]);

        // 2. Insert into MOVIE
        const movieSql = `
            INSERT INTO MOVIE (movie_id, item_id, title, language_id, format_id, runtime, rating_id, release_year)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        // Note: movie_id needs to be provided or generated (using UPC?)
        await conn.query(movieSql, [
             movieData.movie_id, // You need a unique movie ID here (e.g., UPC)
             movieData.item_id, movieData.title, movieData.language_id, movieData.format_id, 
             movieData.runtime, movieData.rating_id, movieData.release_year
        ]);

        // 3. Handle Directors (Find or Create IDs, Insert into MOVIE_DIRECTOR)
        if (movieData.directors && movieData.directors.length > 0) {
            const directorIds = await Promise.all(
              movieData.directors.map(name => findOrCreateDirectorId(conn, name))
            );
            const directorSql = 'INSERT INTO MOVIE_DIRECTOR (movie_id, director_id) VALUES ?';
            const directorValues = directorIds.map(directorId => [movieData.movie_id, directorId]);
             if (directorValues.length > 0) await conn.query(directorSql, [directorValues]);
        }
        
        // 4. Handle Tags (Find or Create IDs, Insert into ITEM_TAG)
        if (movieData.tags && movieData.tags.length > 0) {
             const tagIds = await Promise.all(
              movieData.tags.map(name => findOrCreateTagId(conn, name))
            );
            const tagSql = 'INSERT INTO ITEM_TAG (item_id, tag_id) VALUES ?';
            const tagValues = tagIds.map(tagId => [movieData.item_id, tagId]);
             if (tagValues.length > 0) await conn.query(tagSql, [tagValues]);
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

// --- UPDATE MOVIE (Updated for new schema) ---
async function updateMovie(id, movieData) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Update ITEM
        const itemSql = `
          UPDATE ITEM 
          SET available = ?, description = ?, thumbnail_url = ?, shelf_location = ?
          WHERE item_id = ?
        `;
        await conn.query(itemSql, [
            movieData.quantity, movieData.description, movieData.thumbnail_url, 
            movieData.shelf_location, id
        ]);

        // 2. Update MOVIE
        const movieSql = `
            UPDATE MOVIE
            SET movie_id = ?, title = ?, language_id = ?, format_id = ?, 
                runtime = ?, rating_id = ?, release_year = ?
            WHERE item_id = ?
        `;
        await conn.query(movieSql, [
            movieData.movie_id, movieData.title, movieData.language_id, movieData.format_id, 
            movieData.runtime, movieData.rating_id, movieData.release_year, id
        ]);
        
        // 3. Update Directors (Delete all, Find or Create, Re-insert)
        await conn.query('DELETE FROM MOVIE_DIRECTOR WHERE movie_id = ?', [movieData.movie_id]);
        if (movieData.directors && movieData.directors.length > 0) {
            const directorIds = await Promise.all(
              movieData.directors.map(name => findOrCreateDirectorId(conn, name))
            );
            const directorSql = 'INSERT INTO MOVIE_DIRECTOR (movie_id, director_id) VALUES ?';
            const directorValues = directorIds.map(directorId => [movieData.movie_id, directorId]);
             if (directorValues.length > 0) await conn.query(directorSql, [directorValues]);
        }

        // 4. Update Tags (Delete all, Find or Create, Re-insert)
        await conn.query('DELETE FROM ITEM_TAG WHERE item_id = ?', [id]);
        if (movieData.tags && movieData.tags.length > 0) {
            const tagIds = await Promise.all(
              movieData.tags.map(name => findOrCreateTagId(conn, name))
            );
            const tagSql = 'INSERT INTO ITEM_TAG (item_id, tag_id) VALUES ?';
            const tagValues = tagIds.map(tagId => [id, tagId]);
             if (tagValues.length > 0) await conn.query(tagSql, [tagValues]);
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

// --- CREATE DEVICE (Updated for new schema) ---
async function createDevice(deviceData) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Insert into ITEM
        const itemSql = `
            INSERT INTO ITEM (item_id, available, category, description, thumbnail_url, shelf_location)
            VALUES (?, ?, 'DEVICE', ?, ?, ?)
        `;
        await conn.query(itemSql, [
            deviceData.item_id, deviceData.quantity, deviceData.description, 
            deviceData.thumbnail_url, deviceData.shelf_location
        ]);

        // 2. Insert into DEVICE
        const deviceSql = `
            INSERT INTO DEVICE (item_id, manufacturer, device_name, device_type)
            VALUES (?, ?, ?, ?)
        `;
        await conn.query(deviceSql, [
            deviceData.item_id, deviceData.manufacturer, deviceData.device_name, deviceData.device_type
        ]);
        
         // 3. Handle Tags (Find or Create IDs, Insert into ITEM_TAG)
        if (deviceData.tags && deviceData.tags.length > 0) {
             const tagIds = await Promise.all(
              deviceData.tags.map(name => findOrCreateTagId(conn, name))
            );
            const tagSql = 'INSERT INTO ITEM_TAG (item_id, tag_id) VALUES ?';
            const tagValues = tagIds.map(tagId => [deviceData.item_id, tagId]);
             if (tagValues.length > 0) await conn.query(tagSql, [tagValues]);
        }

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

// --- UPDATE DEVICE (Updated for new schema) ---
async function updateDevice(id, deviceData) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Update ITEM
        const itemSql = `
          UPDATE ITEM 
          SET available = ?, description = ?, thumbnail_url = ?, shelf_location = ?
          WHERE item_id = ?
        `;
        await conn.query(itemSql, [
            deviceData.quantity, deviceData.description, deviceData.thumbnail_url, 
            deviceData.shelf_location, id
        ]);

        // 2. Update DEVICE
        const deviceSql = `
            UPDATE DEVICE
            SET manufacturer = ?, device_name = ?, device_type = ?
            WHERE item_id = ?
        `;
        await conn.query(deviceSql, [
            deviceData.manufacturer, deviceData.device_name, deviceData.device_type, id
        ]);

        // 3. Update Tags (Delete all, Find or Create, Re-insert)
        await conn.query('DELETE FROM ITEM_TAG WHERE item_id = ?', [id]);
        if (deviceData.tags && deviceData.tags.length > 0) {
            const tagIds = await Promise.all(
              deviceData.tags.map(name => findOrCreateTagId(conn, name))
            );
            const tagSql = 'INSERT INTO ITEM_TAG (item_id, tag_id) VALUES ?';
            const tagValues = tagIds.map(tagId => [id, tagId]);
             if (tagValues.length > 0) await conn.query(tagSql, [tagValues]);
        }
        
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
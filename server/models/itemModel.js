const db = require('../config/db'); 

async function findOrCreateAuthorId(conn, authorName) {
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


// --- FIND ALL ITEMS  ---
async function findAll() {
    const sql = 'SELECT * FROM ITEM'; // Keep it simple for now
    const [rows] = await db.query(sql);
    return rows;
}

async function findById(id) {
    const baseSql = 'SELECT * FROM ITEM WHERE item_id = ?';
    const [baseRows] = await db.query(baseSql, [id]);
    if (baseRows.length === 0) {
        return undefined;
    }
    const item = baseRows[0];

    let details = {};
    let creators = [];
    
    if (item.category === 'BOOK') {
        const bookSql = `
            SELECT b.*, l.name as language_name
            FROM BOOK b 
            LEFT JOIN LANGUAGE l ON b.language_id = l.language_id
            WHERE b.item_id = ?
        `;
        const [bookRows] = await db.query(bookSql, [id]);
        if (bookRows.length > 0) details = bookRows[0];

        const authorSql = `
            SELECT a.first_name, a.middle_name, a.last_name 
            FROM BOOK_AUTHOR ba 
            JOIN AUTHOR a ON ba.author_id = a.author_id 
            WHERE ba.item_id = ?
        `;
        const [authorRows] = await db.query(authorSql, [id]);
        creators = authorRows.map(a => [a.first_name, a.middle_name, a.last_name].filter(Boolean).join(' '));

    } else if (item.category === 'MOVIE') {
        const movieSql = `
            SELECT m.*, l.name as language_name, f.format_name, r.rating_name 
            FROM MOVIE m
            LEFT JOIN LANGUAGE l ON m.language_id = l.language_id
            LEFT JOIN MOVIE_FORMAT f ON m.format_id = f.format_id
            LEFT JOIN MOVIE_RATING r ON m.rating_id = r.rating_id
            WHERE m.item_id = ?
        `;
        const [movieRows] = await db.query(movieSql, [id]);
         if (movieRows.length > 0) details = movieRows[0];
         
        const directorSql = `
             SELECT d.first_name, d.middle_name, d.last_name 
             FROM MOVIE_DIRECTOR md 
             JOIN DIRECTOR d ON md.director_id = d.director_id 
             WHERE md.item_id = ? 
        `;
        const [directorRows] = await db.query(directorSql, [id]);
        creators = directorRows.map(d => [d.first_name, d.middle_name, d.last_name].filter(Boolean).join(' '));

    } else if (item.category === 'DEVICE') {
        const deviceSql = `
            SELECT d.*, dt.type_name as device_type_name
            FROM DEVICE d
            LEFT JOIN DEVICE_TYPE dt ON d.device_type = dt.type_id
            WHERE d.item_id = ?
        `;
        const [deviceRows] = await db.query(deviceSql, [id]);
         if (deviceRows.length > 0) details = deviceRows[0];
         if (details.manufacturer) creators = [details.manufacturer];
    }

    const tagSql = `
        SELECT t.tag_name 
        FROM ITEM_TAG it 
        JOIN TAG t ON it.tag_id = t.tag_id 
        WHERE it.item_id = ?
    `;
    const [tagRows] = await db.query(tagSql, [id]);
    const tags = tagRows.map(t => t.tag_name);

    const fullItemDetails = {
        ...item,
        ...details,
        creators: creators,
        tags: tags
    };

    if (!fullItemDetails.title && item.category === 'DEVICE') {
        fullItemDetails.title = details.device_name;
    }


    return fullItemDetails;
}

// --- DELETE ITEM ---
async function remove(id) {
    const sql = 'DELETE FROM ITEM WHERE item_id = ?';
    await db.query(sql, [id]);
}

// --- SOFT DELETE ITEM (Mark as 'DELETED') ---
async function softDeleteById(id) {
    const sql = "UPDATE ITEM SET status = 'DELETED' WHERE item_id = ?";
    
    await db.query(sql, [id]);
}

// --- REACTIVATE ITEM (Mark as 'ACTIVE') ---
async function reactivateById(id) {
    const sql = "UPDATE ITEM SET status = 'ACTIVE' WHERE item_id = ? AND status = 'DELETED'";

    const [result] = await db.query(sql, [id]);
    return result.affectedRows;
}

async function findAllLanguages() {
    const sql = 'SELECT language_id, name FROM LANGUAGE ORDER BY name'; 
    const [rows] = await db.query(sql);
    return rows;
}

async function findAllTags() {
    const sql = `
        SELECT 
            t.tag_id, 
            t.tag_name, 
            COUNT(it.item_id) AS item_count
        FROM TAG t
        LEFT JOIN ITEM_TAG it ON t.tag_id = it.tag_id
        GROUP BY t.tag_id, t.tag_name
        ORDER BY item_count DESC, t.tag_name ASC
    `;
    const [rows] = await db.query(sql);
    return rows;
}

async function findAllMovieFormats() {
    const sql = 'SELECT format_id, format_name FROM MOVIE_FORMAT ORDER BY format_id'; // Order by most popular
    const [rows] = await db.query(sql);
    return rows;
}


// --- CREATE BOOK ---
async function createBook(bookData) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const itemSql = `
            INSERT INTO ITEM (item_id, available, category, description, thumbnail_url, shelf_location)
            VALUES (?, ?, 'BOOK', ?, ?, ?) 
        `;
        await conn.query(itemSql, [
            bookData.item_id, bookData.quantity, bookData.description, 
            bookData.thumbnail_url, bookData.shelf_location
        ]);

        const bookSql = `
            INSERT INTO BOOK ( item_id, title, publisher, published_date, language_id, page_number)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        await conn.query(bookSql, [
            bookData.item_id, bookData.title, bookData.publisher, 
            bookData.published_date, bookData.language_id, bookData.page_number
        ]);

        if (bookData.authors && bookData.authors.length > 0) {
            const authorIds = await Promise.all(
              bookData.authors.map(name => findOrCreateAuthorId(conn, name))
            );
            const authorSql = 'INSERT INTO BOOK_AUTHOR (item_id, author_id) VALUES ?';
            const authorValues = authorIds.map(authorId => [bookData.item_id, authorId]);
            if (authorValues.length > 0) await conn.query(authorSql, [authorValues]);
        }
        
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

// --- UPDATE BOOK ---
async function updateBook(id, bookData) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const itemSql = `
          UPDATE ITEM 
          SET available = ?, description = ?, thumbnail_url = ?, shelf_location = ?
          WHERE item_id = ?
        `;
        await conn.query(itemSql, [
            bookData.quantity, bookData.description, bookData.thumbnail_url, 
            bookData.shelf_location, id
        ]);

        const bookSql = `
            UPDATE BOOK
            SET title = ?, publisher = ?, published_date = ?, 
                language_id = ?, page_number = ?
            WHERE item_id = ?
        `;
        await conn.query(bookSql, [
            bookData.title, bookData.publisher, bookData.published_date,
            bookData.language_id, bookData.page_number, id
        ]);

        await conn.query('DELETE FROM BOOK_AUTHOR WHERE item_id = ?', [id]);
        if (bookData.authors && bookData.authors.length > 0) {
           const authorIds = await Promise.all(
              bookData.authors.map(name => findOrCreateAuthorId(conn, name))
            );
            const authorSql = 'INSERT INTO BOOK_AUTHOR (item_id, author_id) VALUES ?';
            const authorValues = authorIds.map(authorId => [id, authorId]);
             if (authorValues.length > 0) await conn.query(authorSql, [authorValues]);
        }

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


// --- CREATE MOVIE ---
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
            INSERT INTO MOVIE (item_id, title, language_id, format_id, runtime, rating_id, release_year)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        await conn.query(movieSql, [
             movieData.item_id, movieData.title, movieData.language_id, movieData.format_id, 
             movieData.runtime, movieData.rating_id, movieData.release_year
        ]);

        // 3. Handle Directors (Find or Create IDs, Insert into MOVIE_DIRECTOR)
        if (movieData.directors && movieData.directors.length > 0) {
            const directorIds = await Promise.all(
              movieData.directors.map(name => findOrCreateDirectorId(conn, name))
            );
            const directorSql = 'INSERT INTO MOVIE_DIRECTOR (item_id, director_id) VALUES ?';
            const directorValues = directorIds.map(directorId => [movieData.item_id, directorId]);
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

// --- UPDATE MOVIE ---
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
            SET title = ?, language_id = ?, format_id = ?, 
                runtime = ?, rating_id = ?, release_year = ?
            WHERE item_id = ?
        `;
        await conn.query(movieSql, [
            movieData.title, movieData.language_id, movieData.format_id, 
            movieData.runtime, movieData.rating_id, movieData.release_year, id
        ]);
        
        // 3. Update Directors (Delete all, Find or Create, Re-insert)
        await conn.query('DELETE FROM MOVIE_DIRECTOR WHERE item_id = ?', [id]);
        if (movieData.directors && movieData.directors.length > 0) {
            const directorIds = await Promise.all(
              movieData.directors.map(name => findOrCreateDirectorId(conn, name))
            );
            const directorSql = 'INSERT INTO MOVIE_DIRECTOR (item_id, director_id) VALUES ?';
            const directorValues = directorIds.map(directorId => [id, directorId]);
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

// --- CREATE DEVICE ---
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

// --- UPDATE DEVICE ---
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
    findAllLanguages,
    findAllMovieFormats,
    findAllTags,
    remove,
    softDeleteById,
    reactivateById,
    createBook,
    updateBook,
    createMovie,
    updateMovie,
    createDevice,
    updateDevice
};
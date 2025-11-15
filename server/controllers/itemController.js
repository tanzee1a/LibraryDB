const Item = require('../models/itemModel'); 
const { getPostData } = require('../utils');
const { formidable } = require('formidable');
const { uploadToS3 } = require('../s3Upload'); // Adjust path if needed
const path = require('path');

// --- GET Functions ---

// @desc gets all items
// @route GET /api/items
async function getItems(req, res){
    try {
        const items = await Item.findAll(); 
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify(items));
    } catch (error) {
        console.error("Error getting items:", error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Server error', error: error.message }));
    }
}

// @desc gets single item
// @route GET /api/items/:id
async function getItem(req, res, id){
    try {
        const item = await Item.findById(id);
        if(!item){
            res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ message: 'Item Not Found'}));
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify(item));
        }
    } catch (error) {
       console.error(`Error getting item ${id}:`, error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Server error', error: error.message }));
    }
}

async function getLanguages(req, res){
    try {
        const languages = await Item.findAllLanguages(); 
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify(languages));
    } catch (error) {
        console.error("Error getting languages:", error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Server error fetching languages', error: error.message }));
    }
}

async function getMovieFormats(req, res){
    try {
        const formats = await Item.findAllMovieFormats(); 
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify(formats));
    } catch (error) {
        console.error("Error getting languages:", error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Server error fetching languages', error: error.message }));
    }
}


async function getTags(req, res){
    try {
        const tags = await Item.findAllTags(); 
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify(tags));
    } catch (error) {
        console.error("Error getting tags:", error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Server error fetching tags', error: error.message }));
    }
}

// --- CREATE Functions ---

// @desc Create a book
// @route POST /api/items/book
async function createBook(req, res){
    try {
        // 1. Parse the multipart form with formidable
        const form = formidable({});
        const [fields, files] = await form.parse(req);

        // 2. Extract data. Formidable puts fields in arrays, so we flatten them.
        const bookData = {};
        for (const key in fields) {
            bookData[key] = fields[key][0];
        }

        // 3. Handle the thumbnail
        let thumbnailUrl = bookData.thumbnail_url || null; // Use manually pasted URL by default
        
        // 'thumbnailImage' must match the name in your React FormData
        const thumbnailFile = files.thumbnailImage ? files.thumbnailImage[0] : null;

        if (thumbnailFile) {
            // A file was uploaded! Override the URL.
            console.log("File detected. Uploading to S3...");
            
            // We need item_id to create the filename
            if (!bookData.item_id) {
                throw new Error('item_id is required to name the thumbnail file.');
            }

            // Create a unique filename, e.g., 1234567890123.jpg
            const extension = path.extname(thumbnailFile.originalFilename);
            const s3Key = `${bookData.item_id}${extension}`;
            
            // Call our helper
            thumbnailUrl = await uploadToS3(thumbnailFile, s3Key);
        }

        // 4. Prepare data for your existing model function
        // (Your model expects arrays, but the form sends strings. We convert them here.)
        const modelData = {
            ...bookData,
            thumbnail_url: thumbnailUrl, // This is now the S3 URL
            quantity: parseInt(bookData.quantity, 10),
            language_id: parseInt(bookData.language_id, 10),
            page_number: parseInt(bookData.page_number, 10),
            // Convert comma-separated strings back into arrays
            authors: bookData.authors ? bookData.authors.split(',').map(a => a.trim()).filter(Boolean) : [],
            tags: bookData.tags ? bookData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        };
        
        // Basic validation (same as you had)
        if (!modelData.item_id || !modelData.title || !modelData.published_date || !modelData.page_number || !modelData.quantity) {
             throw new Error('Missing required book fields');
        }

        // 5. Call your model (This part doesn't change!)
        const newBook = await Item.createBook(modelData); // Using your existing DB logic
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(newBook));
        
    } catch (error) {
        console.error("Error in createBook controller:", error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Could not create book', error: error.message }));
    }
}

// @desc Create a movie
// @route POST /api/items/movie
async function createMovie(req, res){
    try {
        const body = await getPostData(req);
        const { 
            item_id,
            title, 
            description,
            language_id,
            format_id,
            runtime,
            rating_id,
            release_year,
            quantity,
            directors,
            tags,
            thumbnail_url,
            shelf_location
        } = JSON.parse(body);
        
        if (!item_id || !title || !runtime || !release_year || !quantity) {
             throw new Error('Missing required movie fields');
        }

        const movieData = {
            item_id, title, description, language_id, format_id, runtime, 
            rating_id, release_year, quantity, directors, tags, thumbnail_url, shelf_location
        };

        const newMovie = await Item.createMovie(movieData);
        res.writeHead(201, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(newMovie));
        
    } catch (error) {
        console.error("Error in createMovie controller:", error);
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not create movie', error: error.message }));
    }
}


// @desc Create a device
// @route POST /api/items/device
async function createDevice(req, res){
    try {
        const body = await getPostData(req);
        const { 
            item_id, 
            manufacturer,
            device_name,
            device_type,
            description,
            quantity,
            tags,
            thumbnail_url,
            shelf_location
        } = JSON.parse(body);
        
         if (!item_id || !device_name || !device_type || !quantity) {
             throw new Error('Missing required device fields');
        }

        const deviceData = {
            item_id, manufacturer, device_name, device_type, description, 
            quantity, tags, thumbnail_url, shelf_location
        };

        const newDevice = await Item.createDevice(deviceData);
        res.writeHead(201, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(newDevice));
        
    } catch (error) {
        console.error("Error in createDevice controller:", error);
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not create device', error: error.message }));
    }
}


// --- UPDATE Functions ---

// @desc Update a book
// @route PUT /api/items/book/:id
async function updateBook(req, res, id){
    try {
        const itemExists = await Item.findById(id);
        if(!itemExists) {
            res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ message: 'Item Not Found'}));
        }
       
        const body = await getPostData(req);
        const { 
            title, description, publisher, published_date, shelf_location, 
            language_id, page_number, quantity, authors, tags, thumbnail_url
        } = JSON.parse(body);

        // Basic validation
        if ( !title || !published_date || !page_number || quantity === undefined) {
             throw new Error('Missing required book fields for update');
        }
            
        const bookData = {
            title, description, publisher, published_date, shelf_location, 
            language_id, page_number, quantity, authors, tags, thumbnail_url
        };

        const updatedBook = await Item.updateBook(id, bookData);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(updatedBook));
        
    } catch (error) {
        console.error(`Error updating book ${id}:`, error);
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not update book', error: error.message }));
    }
}

// @desc Update a movie
// @route PUT /api/items/movie/:id
async function updateMovie(req, res, id){
     try {
        const itemExists = await Item.findById(id);
        if(!itemExists) {
            res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ message: 'Item Not Found'}));
        }

        const body = await getPostData(req);
        const { 
            title, description, language_id, format_id, runtime, 
            rating_id, release_year, quantity, directors, tags, thumbnail_url, shelf_location
        } = JSON.parse(body);

        if (!title || !runtime || !release_year || quantity === undefined) {
             throw new Error('Missing required movie fields for update');
        }
            
        const movieData = {
             title, description, language_id, format_id, runtime, 
            rating_id, release_year, quantity, directors, tags, thumbnail_url, shelf_location
        };

        const updatedMovie = await Item.updateMovie(id, movieData);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(updatedMovie));
       
    } catch (error) {
        console.error(`Error updating movie ${id}:`, error);
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not update movie', error: error.message }));
    }
}


// @desc Update a device
// @route PUT /api/items/device/:id
async function updateDevice(req, res, id){
    try {
        const itemExists = await Item.findById(id);
        if(!itemExists) {
             res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            return res.end(JSON.stringify({ message: 'Item Not Found'}));
        }
        
        const body = await getPostData(req);
        const { 
            manufacturer, device_name, device_type, description, 
            quantity, tags, thumbnail_url, shelf_location
        } = JSON.parse(body);

         if (!device_name || !device_type || quantity === undefined) {
             throw new Error('Missing required device fields for update');
        }
            
        const deviceData = {
            manufacturer, device_name, device_type, description, 
            quantity, tags, thumbnail_url, shelf_location
        };

        const updatedDevice = await Item.updateDevice(id, deviceData);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(updatedDevice));
        
    } catch (error) {
        console.error(`Error updating device ${id}:`, error);
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Could not update device', error: error.message }));
    }
}


// --- DELETE Function ---

// @desc Soft Delete an Item (Mark as 'DELETED')
// @route DELETE /api/items/:id
async function deleteItem(req, res, id) {
    try {
        const item = await Item.findById(id);

        if (!item) {
            res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ message: 'Item Not Found' }));
            return; // Stop execution
        }

        // --- NEW BUSINESS RULE ---
        // Check if the item is currently loaned out or on hold
        if (item.loaned_out > 0 || item.on_hold > 0) {
            res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ 
                message: 'Cannot delete item. It is currently loaned out or on hold.' 
            }));
            return; // Stop execution
        }
        
        if (item.status === 'DELETED') {
             res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
             res.end(JSON.stringify({ message: 'Item is already deleted.' }));
             return; // Stop execution
        }
        // Call your new model function
        await Item.softDeleteById(id);

        // Update the success message
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: `Item ${id} marked as deleted` }));

    } catch (error) {
        console.error(`Error soft deleting item ${id}:`, error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Server error', error: error.message }));
    }
}

// @desc Reactivate an Item (Mark as 'ACTIVE')
// @route PUT /api/items/:id/reactivate
async function reactivateItem(req, res, id) {
    try {
        const item = await Item.findById(id);

        if (!item) {
            res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ message: 'Item Not Found' }));
            return;
        }

        if (item.status === 'ACTIVE') {
            res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ message: 'Item is already active.' }));
            return;
        }

        await Item.reactivateById(id);

        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: `Item ${id} reactivated` }));

    } catch (error) {
        console.error(`Error reactivating item ${id}:`, error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Server error', error: error.message }));
    }
}


module.exports = {
    getItems,
    getItem,
    getLanguages,
    getMovieFormats,
    getTags,
    createBook,
    deleteItem,
    updateBook,
    createMovie,
    updateMovie,
    createDevice,
    updateDevice,
    reactivateItem
};
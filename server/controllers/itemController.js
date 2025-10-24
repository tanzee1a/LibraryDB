const Item = require('../models/itemModel'); 
const { getPostData } = require('../utils');

// --- GET Functions (Mostly Unchanged) ---

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

// --- CREATE Functions (Updated Fields) ---

// @desc Create a book
// @route POST /api/items/book
async function createBook(req, res){
    try {
        const body = await getPostData(req);
        const { 
            item_id, 
            isbn_13, // New
            title, 
            description, // Now in ITEM table
            publisher, 
            published_date, // Changed from year
            shelf_location, // Now in ITEM table
            language_id,    // New
            page_number,    // New
            quantity,       // Used for initial 'available' count
            authors,        // Array of names
            tags,           // Array of names
            thumbnail_url   // Now in ITEM table
        } = JSON.parse(body);
        
        // Basic validation
        if (!item_id || !isbn_13 || !title || !published_date || !page_number || !quantity) {
             throw new Error('Missing required book fields');
        }

        const bookData = {
            item_id, isbn_13, title, description, publisher, published_date, 
            shelf_location, language_id, page_number, quantity, authors, tags, thumbnail_url
        };

        const newBook = await Item.createBook(bookData);
        res.writeHead(201, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(newBook));
        
    } catch (error) {
        console.error("Error in createBook controller:", error);
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); // Use 400 for bad input
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
            movie_id, // New unique ID for movie (e.g., UPC)
            title, 
            description, // Now in ITEM
            language_id, // New
            format_id,   // New
            runtime,     // New
            rating_id,   // New
            release_year,// New
            quantity,    // For initial available
            directors,   // Array of names
            tags,        // Array of names
            thumbnail_url, // Now in ITEM
            shelf_location // Now in ITEM
        } = JSON.parse(body);
        
        if (!item_id || !movie_id || !title || !runtime || !release_year || !quantity) {
             throw new Error('Missing required movie fields');
        }

        const movieData = {
            item_id, movie_id, title, description, language_id, format_id, runtime, 
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
            manufacturer,   // New
            device_name,    // Changed from model
            device_type,    // Changed to FK ID
            description,    // Now in ITEM
            quantity,       // For initial available
            tags,           // Array of names
            thumbnail_url,  // Now in ITEM
            shelf_location  // Now in ITEM
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


// --- UPDATE Functions (Updated Fields) ---

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
            isbn_13, title, description, publisher, published_date, shelf_location, 
            language_id, page_number, quantity, authors, tags, thumbnail_url
        } = JSON.parse(body);

        // Basic validation
        if (!isbn_13 || !title || !published_date || !page_number || quantity === undefined) {
             throw new Error('Missing required book fields for update');
        }
            
        const bookData = {
            isbn_13, title, description, publisher, published_date, shelf_location, 
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
            movie_id, title, description, language_id, format_id, runtime, 
            rating_id, release_year, quantity, directors, tags, thumbnail_url, shelf_location
        } = JSON.parse(body);

        if (!movie_id || !title || !runtime || !release_year || quantity === undefined) {
             throw new Error('Missing required movie fields for update');
        }
            
        const movieData = {
             movie_id, title, description, language_id, format_id, runtime, 
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


// --- DELETE Function (Unchanged, uses model) ---

// @desc Delete an Item
// @route DELETE /api/items/:id
async function deleteItem(req, res, id){
    try {
        const item = await Item.findById(id);
        if(!item){
            res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ message: 'Item Not Found'}));
        } else {
            await Item.remove(id); // Model handles cascade
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({message: `Item ${id} removed`}));
        }
    } catch (error) {
       console.error(`Error deleting item ${id}:`, error);
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ message: 'Server error', error: error.message }));
    }
}


module.exports = {
    getItems,
    getItem,
    createBook,
    deleteItem,
    updateBook,
    createMovie,
    updateMovie,
    createDevice,
    updateDevice,
};
const Item = require('../models/itemModel'); 
const { getPostData } = require('../utils');

// @desc gets all items
// @route GET /api/items
async function getItems(req, res){
    try {
        const items = await Item.findAll(); 

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(items));
    } catch (error) {
        console.log(error);
    }
}

// @desc gets single item
// @route GET /api/items/:id
async function getItem(req, res, id){
    try {
        const item = await Item.findById(id); 

        if(!item){
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Item Not Found'}));
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(item));
        }
    } catch (error) {
        console.log(error);
    }
}

// @desc Create a book
// @route POST /api/items/book
async function createBook(req, res){
    try {
        const body = await getPostData(req);
        
        const { 
            item_id, 
            title, 
            description, 
            publisher, 
            published_year, 
            shelf_location,
            quantity,
            authors,
            genres,
            tags
        } = JSON.parse(body);
        
        const bookData = {
            item_id,
            title,
            description,
            publisher,
            published_year,
            shelf_location,
            quantity,
            authors,
            genres,
            tags
        };

        const newBook = await Item.createBook(bookData);
            
        res.writeHead(201, { 'Content-Type': 'application/json'});
        return res.end(JSON.stringify(newBook));
        
    } catch (error) {
        console.error("Error in createBook controller:", error);
        
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            message: 'Could not create book', 
            error: error.message 
        }));
    }
}

// @desc Delete an Item
// @route DELETE /api/items/:id
async function deleteItem(req, res, id){
    try {
        const item = await Item.findById(id);

        if(!item){
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Item Not Found'}));
        } else {
            await Item.remove(id);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({message: `Item ${id} removed`}));
        }
    } catch (error) {
        console.log(error);
    }
}

// @desc Update a book
// @route PUT /api/items/book/:id
async function updateBook(req, res, id){
    try {
        const item = await Item.findById(id);

        if(!item){
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ message: 'Item Not Found'}));
        } else {
            // if item exists, get the new data from the body
            const body = await getPostData(req);

            // parse all the fields
            const { 
                title, 
                description, 
                publisher, 
                published_year, 
                shelf_location,
                quantity,
                authors,
                genres,
                tags
            } = JSON.parse(body);
            
            const bookData = {
                title,
                description,
                publisher,
                published_year,
                shelf_location,
                quantity,
                authors,
                genres,
                tags
            };

            const updatedBook = await Item.updateBook(id, bookData);
                
            res.writeHead(200, { 'Content-Type': 'application/json'});
            return res.end(JSON.stringify(updatedBook));
        }

    } catch (error) {
        console.error("Error in updateBook controller:", error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            message: 'Could not update book', 
            error: error.message 
        }));
    }
}

// Add to itemController.js
// @desc Create a movie
// @route POST /api/items/movie
async function createMovie(req, res){
    try {
        const body = await getPostData(req);
        
        const { 
            item_id, 
            title, 
            description, 
            quantity,
            directors, // Expects an array: ["Director One"]
            genres,    // Expects an array: ["Action", "Comedy"]
            tags       // Expects an array: ["Classic"]
        } = JSON.parse(body);
        
        const movieData = {
            item_id, title, description, quantity,
            directors, genres, tags
        };

        const newMovie = await Item.createMovie(movieData);
            
        res.writeHead(201, { 'Content-Type': 'application/json'});
        return res.end(JSON.stringify(newMovie));
        
    } catch (error) {
        console.error("Error in createMovie controller:", error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            message: 'Could not create movie', 
            error: error.message 
        }));
    }
}

// @desc Update a movie
// @route PUT /api/items/movie/:id
async function updateMovie(req, res, id){
    try {
        const item = await Item.findById(id);
        if(!item){
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ message: 'Item Not Found'}));
        } else {
            const body = await getPostData(req);
            const { 
                title, 
                description, 
                quantity,
                directors,
                genres,
                tags
            } = JSON.parse(body);
            
            const movieData = {
                title, description, quantity,
                directors, genres, tags
            };

            const updatedMovie = await Item.updateMovie(id, movieData);
            res.writeHead(200, { 'Content-Type': 'application/json'});
            return res.end(JSON.stringify(updatedMovie));
        }
    } catch (error) {
        console.error("Error in updateMovie controller:", error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            message: 'Could not update movie', 
            error: error.message 
        }));
    }
}

// Add to itemController.js
// @desc Create a device
// @route POST /api/items/device
async function createDevice(req, res){
    try {
        const body = await getPostData(req);
        
        const { 
            item_id, 
            serial_number,
            manufacturer,
            model,
            description,
            type,
            quantity
        } = JSON.parse(body);
        
        const deviceData = {
            item_id, serial_number, manufacturer, model,
            description, type, quantity
        };

        const newDevice = await Item.createDevice(deviceData);
            
        res.writeHead(201, { 'Content-Type': 'application/json'});
        return res.end(JSON.stringify(newDevice));
        
    } catch (error) {
        console.error("Error in createDevice controller:", error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            message: 'Could not create device', 
            error: error.message 
        }));
    }
}

// @desc Update a device
// @route PUT /api/items/device/:id
async function updateDevice(req, res, id){
    try {
        const item = await Item.findById(id);
        if(!item){
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ message: 'Item Not Found'}));
        } else {
            const body = await getPostData(req);
            const { 
                serial_number,
                manufacturer,
                model,
                description,
                type,
                quantity
            } = JSON.parse(body);
            
            const deviceData = {
                serial_number, manufacturer, model,
                description, type, quantity
            };

            const updatedDevice = await Item.updateDevice(id, deviceData);
            res.writeHead(200, { 'Content-Type': 'application/json'});
            return res.end(JSON.stringify(updatedDevice));
        }
    } catch (error) {
        console.error("Error in updateDevice controller:", error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            message: 'Could not update device', 
            error: error.message 
        }));
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
    updateDevice
    // need to create updateBook, createMovie, updateMovie, etc.
};
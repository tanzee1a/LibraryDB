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
            quantity 
        } = JSON.parse(body);
        
        const bookData = {
            item_id,
            title,
            description,
            publisher,
            published_year,
            shelf_location,
            quantity
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


module.exports = {
    getItems,
    getItem,
    createBook,
    deleteItem
    // need to create updateBook, createMovie, updateMovie, etc.
};
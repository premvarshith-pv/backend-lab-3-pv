const express = require('express');
const router = express.Router();
const booksController = require('../controllers/booksController');

/**
 * Route: GET /books
 * Supports search_q, order_by, order, limit, offset, min_price, max_price
 */
router.get('/', booksController.getAllBooks);

/**
 * Route: GET /books/:id
 * Retrieve a specific book by ID
 */
router.get('/:id', booksController.getBookById);

/**
 * Route: POST /books
 * Create a new book
 */
router.post('/', booksController.createBook);

/**
 * Route: PUT /books/:id
 * Update an existing book
 */
router.put('/:id', booksController.updateBook);

/**
 * Route: DELETE /books/:id
 * Delete a book by ID
 */
router.delete('/:id', booksController.deleteBook);

module.exports = router;

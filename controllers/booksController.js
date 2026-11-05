const { getDB } = require('../database');

// Allowed columns for sorting to prevent SQL injection
const ALLOWED_ORDER_BY_COLUMNS = ['id', 'title', 'author', 'price'];
const ALLOWED_ORDER_DIRECTIONS = ['ASC', 'DESC'];

/**
 * Controller: Retrieve all books with search, filter, sort, and pagination.
 * Endpoint: GET /books
 */
const getAllBooks = async (req, res, next) => {
  try {
    const db = getDB();
    const {
      search_q = '',
      order_by = 'id',
      order = 'ASC',
      limit = 10,
      offset = 0,
      min_price,
      max_price
    } = req.query;

    // 1. Validate order_by against allowlist
    const normalizedOrderBy = String(order_by).toLowerCase();
    if (!ALLOWED_ORDER_BY_COLUMNS.includes(normalizedOrderBy)) {
      return res.status(400).json({
        message: `Invalid order_by column '${order_by}'. Allowed columns: ${ALLOWED_ORDER_BY_COLUMNS.join(', ')}`
      });
    }

    // 2. Validate order direction against allowlist
    const normalizedOrder = String(order).toUpperCase();
    if (!ALLOWED_ORDER_DIRECTIONS.includes(normalizedOrder)) {
      return res.status(400).json({
        message: `Invalid order direction '${order}'. Allowed values: ASC, DESC`
      });
    }

    // 3. Validate limit (must be a positive integer)
    const limitNum = Number(limit);
    if (!Number.isInteger(limitNum) || limitNum <= 0) {
      return res.status(400).json({
        message: 'limit must be a positive integer greater than 0'
      });
    }

    // 4. Validate offset (must be zero or a positive integer)
    const offsetNum = Number(offset);
    if (!Number.isInteger(offsetNum) || offsetNum < 0) {
      return res.status(400).json({
        message: 'offset must be zero or a positive integer'
      });
    }

    // 5. Validate min_price and max_price
    let minPriceNum = null;
    let maxPriceNum = null;

    if (min_price !== undefined) {
      minPriceNum = Number(min_price);
      if (isNaN(minPriceNum) || minPriceNum < 0) {
        return res.status(400).json({
          message: 'min_price must be a valid non-negative number'
        });
      }
    }

    if (max_price !== undefined) {
      maxPriceNum = Number(max_price);
      if (isNaN(maxPriceNum) || maxPriceNum < 0) {
        return res.status(400).json({
          message: 'max_price must be a valid non-negative number'
        });
      }
    }

    if (minPriceNum !== null && maxPriceNum !== null && minPriceNum > maxPriceNum) {
      return res.status(400).json({
        message: 'min_price cannot be greater than max_price'
      });
    }

    // Build parameterized query dynamically
    const conditions = [];
    const queryParams = [];

    // Title search using SQL LIKE
    if (search_q && search_q.trim() !== '') {
      conditions.push('title LIKE ?');
      queryParams.push(`%${search_q.trim()}%`);
    }

    // Price range filtering using BETWEEN or comparison operators
    if (minPriceNum !== null && maxPriceNum !== null) {
      conditions.push('price BETWEEN ? AND ?');
      queryParams.push(minPriceNum, maxPriceNum);
    } else if (minPriceNum !== null) {
      conditions.push('price >= ?');
      queryParams.push(minPriceNum);
    } else if (maxPriceNum !== null) {
      conditions.push('price <= ?');
      queryParams.push(maxPriceNum);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Safe SQL query with verified order_by and order tokens, and parameterized values
    const query = `
      SELECT * FROM books
      ${whereClause}
      ORDER BY ${normalizedOrderBy} ${normalizedOrder}
      LIMIT ? OFFSET ?
    `;

    queryParams.push(limitNum, offsetNum);

    const books = await db.all(query, queryParams);

    return res.status(200).json({
      message: 'Books retrieved successfully',
      data: books
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Retrieve a specific book by ID.
 * Endpoint: GET /books/:id
 */
const getBookById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bookId = Number(id);

    if (!Number.isInteger(bookId) || bookId <= 0) {
      return res.status(400).json({
        message: 'Invalid book ID. ID must be a positive integer.'
      });
    }

    const db = getDB();
    const book = await db.get('SELECT * FROM books WHERE id = ?', [bookId]);

    if (!book) {
      return res.status(404).json({
        message: 'Book not found'
      });
    }

    return res.status(200).json({
      message: 'Book retrieved successfully',
      data: book
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Create a new book.
 * Endpoint: POST /books
 */
const createBook = async (req, res, next) => {
  try {
    const { title, author, price, pages } = req.body;

    // Validate title
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({
        message: 'Title is required'
      });
    }

    // Validate author
    if (!author || typeof author !== 'string' || author.trim() === '') {
      return res.status(400).json({
        message: 'Author is required'
      });
    }

    // Validate price
    if (price === undefined || price === null || String(price).trim() === '') {
      return res.status(400).json({
        message: 'Price is required'
      });
    }

    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({
        message: 'Price must be a valid non-negative number'
      });
    }

    // Validate pages (optional)
    let pagesNum = null;
    if (pages !== undefined && pages !== null && String(pages).trim() !== '') {
      pagesNum = Number(pages);
      if (!Number.isInteger(pagesNum) || pagesNum <= 0) {
        return res.status(400).json({
          message: 'Pages must be a positive integer'
        });
      }
    }

    const db = getDB();
    const result = await db.run(
      'INSERT INTO books (title, author, price, pages) VALUES (?, ?, ?, ?)',
      [title.trim(), author.trim(), priceNum, pagesNum]
    );

    return res.status(201).json({
      message: 'Book created successfully',
      bookId: result.lastID
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Update an existing book.
 * Endpoint: PUT /books/:id
 */
const updateBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bookId = Number(id);

    if (!Number.isInteger(bookId) || bookId <= 0) {
      return res.status(400).json({
        message: 'Invalid book ID. ID must be a positive integer.'
      });
    }

    const db = getDB();

    // Check if book exists
    const existingBook = await db.get('SELECT id FROM books WHERE id = ?', [bookId]);
    if (!existingBook) {
      return res.status(404).json({
        message: 'Book not found'
      });
    }

    const { title, author, price, pages } = req.body;

    // Validate title
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({
        message: 'Title is required'
      });
    }

    // Validate author
    if (!author || typeof author !== 'string' || author.trim() === '') {
      return res.status(400).json({
        message: 'Author is required'
      });
    }

    // Validate price
    if (price === undefined || price === null || String(price).trim() === '') {
      return res.status(400).json({
        message: 'Price is required'
      });
    }

    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({
        message: 'Price must be a valid non-negative number'
      });
    }

    // Validate pages (optional)
    let pagesNum = null;
    if (pages !== undefined && pages !== null && String(pages).trim() !== '') {
      pagesNum = Number(pages);
      if (!Number.isInteger(pagesNum) || pagesNum <= 0) {
        return res.status(400).json({
          message: 'Pages must be a positive integer'
        });
      }
    }

    await db.run(
      'UPDATE books SET title = ?, author = ?, price = ?, pages = ? WHERE id = ?',
      [title.trim(), author.trim(), priceNum, pagesNum, bookId]
    );

    return res.status(200).json({
      message: 'Book updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Delete a book by ID.
 * Endpoint: DELETE /books/:id
 */
const deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bookId = Number(id);

    if (!Number.isInteger(bookId) || bookId <= 0) {
      return res.status(400).json({
        message: 'Invalid book ID. ID must be a positive integer.'
      });
    }

    const db = getDB();

    // Check if book exists
    const existingBook = await db.get('SELECT id FROM books WHERE id = ?', [bookId]);
    if (!existingBook) {
      return res.status(404).json({
        message: 'Book not found'
      });
    }

    await db.run('DELETE FROM books WHERE id = ?', [bookId]);

    return res.status(200).json({
      message: 'Book deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
};

# Backend Development Fundamentals - Lab 3
## REST API, Query Parameters, Validation and Debugging

**Course:** Backend Development Fundamentals (B.Tech 2nd Year)  
**Project:** Book Management RESTful API  
**Environment:** Node.js, Express.js, SQLite3  

---

## 1. Project Objective

The objective of Lab 3 is to elevate the foundational database operations from Lab 2 into a robust, industry-standard **RESTful API**. This includes:

- Implementing full **CRUD** operations (Create, Read, Update, Delete) on a books collection.
- Handling advanced query parameters for **partial title search (`LIKE`)**, **allowlist-based sorting**, **pagination (`LIMIT` & `OFFSET`)**, and **price range filtering (`BETWEEN`)**.
- Enforcing strict **input validation** to prevent invalid data states and guard against **SQL Injection**.
- Returning consistent **JSON response structures** and standard **HTTP status codes** (`200`, `201`, `400`, `404`, `500`).
- Mastering backend debugging by analyzing, identifying, and resolving four classic Node/Express/SQLite development errors.
- Designing the project to run seamlessly both in local development and in cloud/serverless environments (such as Vercel).

---

## 2. Technologies Used

- **Runtime:** Node.js (v18+)
- **Framework:** Express.js (v4.x)
- **Database:** SQLite3 with `sqlite` async wrapper
- **Testing & Tooling:** Postman, Automated Test Harness (`test_api.js`), and Google Chrome

---

## 3. Project Structure

```
backend-lab-3/
│
├── app.js                          # Express application setup, middleware, and server bootstrap
├── package.json                    # Project metadata, scripts, and dependencies
├── database.js                     # SQLite database initialization, table creation & sample data seeding
├── test_api.js                     # Automated test harness verifying all 19 lab test cases
├── capture_screenshots.js          # Automated Chrome headless screenshot capture script
├── vercel.json                     # Vercel serverless deployment and routing configuration
├── README.md                       # Comprehensive project and lab documentation
├── .gitignore                      # Git ignore rules (node_modules, logs, .env)
│
├── api/
│   └── index.js                    # Serverless entry point for Vercel deployment
│
├── routes/
│   └── books.js                    # Express router defining endpoints for /books
│
├── controllers/
│   └── booksController.js          # Controller logic, query validation, and parameterized SQL queries
│
├── middleware/
│   └── errorHandler.js             # Centralized error handling and 404 middleware
│
├── database/
│   └── books.db                    # SQLite database file containing the books table
│
├── screenshots/                    # Real Chrome execution screenshots of all tested endpoints
│   ├── 01_chrome_root_api.png
│   ├── 02_chrome_get_all_books.png
│   └── ... (12 screenshots)
│
└── postman/
    └── Lab3_Postman_Collection.json # Complete, importable Postman collection (18 test cases)
```

---

## 4. Installation and Setup Instructions

### Prerequisites
Make sure **Node.js** (v18 or higher) and **npm** are installed on your computer.

### Step 1: Open Terminal in Project Directory
Open your terminal (PowerShell, Command Prompt, or Bash) and navigate to the project directory:
```bash
cd "c:\Users\premv\OneDrive\Desktop\backend-lab-3"
```

### Step 2: Install Dependencies
Run the following command to install Express and SQLite drivers:
```bash
npm install
```
*(On Windows PowerShell, if execution policy restricts npm, run `npm.cmd install`)*

### Step 3: Start the Application Server
Run the standard start script:
```bash
npm start
```
*(Or `npm.cmd start`)*

When the server starts successfully, you will see:
```
Database connected. Found 10 books.
===============================================
Book Management API Server is running!
Access URL: http://localhost:3000
Port: 3000 (Configurable via PORT environment variable)
===============================================
```

### Step 4: Run Automated Verification Tests
You can run the built-in automated test suite that executes all 18 required test cases:
```bash
npm test
```

---

## 5. REST API Endpoint Documentation

| Method | Endpoint | Description | Status Code |
|---|---|---|---|
| **GET** | `/books` | Retrieve all books (with search, sort, filter, pagination) | `200 OK`, `400 Bad Request` |
| **GET** | `/books/:id` | Retrieve a single book by ID | `200 OK`, `400 Bad Request`, `404 Not Found` |
| **POST** | `/books` | Create a new book | `201 Created`, `400 Bad Request` |
| **PUT** | `/books/:id` | Update an existing book | `200 OK`, `400 Bad Request`, `404 Not Found` |
| **DELETE** | `/books/:id` | Delete a book by ID | `200 OK`, `400 Bad Request`, `404 Not Found` |

---

## 6. Query Parameter Specifications (`GET /books`)

All query parameters are optional and can be used individually or combined:

| Parameter | Type | Default | Description & Validation Rules |
|---|---|---|---|
| `search_q` | String | `""` | Partial title match using SQL `LIKE %query%`. |
| `order_by` | String | `"id"` | Column to sort by. **Allowlist:** `id`, `title`, `author`, `price`. Rejects invalid columns with `400`. |
| `order` | String | `"ASC"` | Sort direction. **Allowlist:** `ASC`, `DESC` (case-insensitive). Rejects other values with `400`. |
| `limit` | Integer | `10` | Number of records to return. Must be a positive integer (`> 0`). Rejects negatives/zero with `400`. |
| `offset` | Integer | `0` | Number of records to skip. Must be zero or positive (`>= 0`). Rejects negatives with `400`. |
| `min_price` | Number | None | Minimum price filter (`price >= min_price`). Must be numeric and `>= 0`. |
| `max_price` | Number | None | Maximum price filter (`price <= max_price`). Must be numeric and `>= 0`. |

> **Price Range Rule:** When both `min_price` and `max_price` are provided, `min_price` cannot exceed `max_price`. A query like `/books?min_price=500&max_price=100` triggers a `400 Bad Request`.

### Combined Query Example:
```
GET /books?search_q=java&order_by=price&order=DESC&limit=5&offset=0&min_price=100&max_price=600
```

---

## 7. Input Validation & Security Rules

1. **SQL Injection Protection:**
   - User inputs (`search_q`, `min_price`, `max_price`, `limit`, `offset`, `id`, `title`, `author`, `price`, `pages`) are **never concatenated** into SQL strings.
   - All values are bound using parameterized SQL placeholders (`?`).
   - Dynamic identifiers (`order_by` and `order`) are strictly verified against hardcoded allowlists before query building.
2. **Payload Validation:**
   - `title`: Must be non-empty string.
   - `author`: Must be non-empty string.
   - `price`: Must be provided, numeric, and non-negative (`>= 0`).
   - `pages`: If provided, must be a positive integer (`> 0`).

---

## 8. Consistent JSON Response Format

### Successful GET (List):
```json
{
  "message": "Books retrieved successfully",
  "data": [
    {
      "id": 1,
      "title": "The Pragmatic Programmer",
      "author": "Andrew Hunt & David Thomas",
      "price": 450,
      "pages": 352
    }
  ]
}
```

### Successful GET (Single Book):
```json
{
  "message": "Book retrieved successfully",
  "data": {
    "id": 1,
    "title": "The Pragmatic Programmer",
    "author": "Andrew Hunt & David Thomas",
    "price": 450,
    "pages": 352
  }
}
```

### Successful POST (Create):
```json
{
  "message": "Book created successfully",
  "bookId": 11
}
```

### Successful PUT (Update):
```json
{
  "message": "Book updated successfully"
}
```

### Successful DELETE:
```json
{
  "message": "Book deleted successfully"
}
```

### Error Responses:
```json
// 404 Not Found
{
  "message": "Book not found"
}

// 400 Bad Request
{
  "message": "Title is required"
}
```

---

## 9. Debugging Exercises and Solutions

Understanding and solving the four common backend errors required by the curriculum:

---

### ERROR 1: `EADDRINUSE` (Address Already in Use)

#### 1. What Caused It
Node throws `Error: listen EADDRINUSE: address already in use :::3000` when an application attempts to bind to a TCP port (e.g., port 3000) that is already being held by another running Node process, dev server, or background process.

#### 2. How to Identify It
- The terminal displays:
  ```
  Error: listen EADDRINUSE: address already in use :::3000
  code: 'EADDRINUSE',
  syscall: 'listen'
  ```
- You can locate the conflicting process PID in the terminal:
  - **Windows:** `netstat -ano | findstr :3000`
  - **macOS / Linux:** `lsof -i :3000`

#### 3. How to Fix It
- **Option A (Kill conflicting process):**
  - Windows: `taskkill /PID <PID_NUMBER> /F`
  - Linux/Mac: `kill -9 <PID_NUMBER>`
- **Option B (Use a configurable port via environment variable):**
  Configure the app to read `process.env.PORT || 3000` and catch the `EADDRINUSE` event.

#### 4. Corrected Code (`app.js`):
```javascript
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Explicit error handler for port collision
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is in use. Run with PORT=3001 npm start or kill the process.`);
  }
  process.exit(1);
});
```

---

### ERROR 2: Wrong Import Path (`MODULE_NOT_FOUND`)

#### 1. What Caused It
Node throws `Cannot find module '../controllers/booksController'` (or similar) when the relative path specified in `require()` or `import` does not match the actual folder hierarchy on disk, or has a spelling/casing typo.

#### 2. How to Identify It
- Terminal output:
  ```
  Error: Cannot find module './booksController'
  code: 'MODULE_NOT_FOUND',
  requireStack: [ '.../routes/books.js' ]
  ```
- Notice that `books.js` is inside the `routes/` directory, while `booksController.js` is inside `controllers/`. Requiring `./booksController` looks inside `routes/`, which does not exist.

#### 3. How to Fix It
- Check current file location (`routes/books.js`).
- Step up one directory level using `../`, then into `controllers/`.

#### 4. Corrected Code (`routes/books.js`):
```javascript
// ❌ INCORRECT (causes MODULE_NOT_FOUND):
// const booksController = require('./booksController');

// ✅ CORRECT:
const booksController = require('../controllers/booksController');
```

---

### ERROR 3: `SQLITE_ERROR: no such table`

#### 1. What Caused It
SQLite returns `SQLITE_ERROR: no such table: books` when:
1. The SQL query references a table name that hasn't been created yet (or has a spelling mistake like `book` instead of `books`).
2. The SQLite database file path is relative (e.g., `./books.db`), causing Node to create a fresh, empty database in whatever directory the terminal happened to be executed from!

#### 2. How to Identify It
- Terminal logs:
  ```
  SQLITE_ERROR: no such table: books
  ```
- Or empty database files appearing in root or random folders.

#### 3. How to Fix It
- Use absolute directory resolution using `path.join(__dirname, 'database', 'books.db')`.
- Always execute `CREATE TABLE IF NOT EXISTS books (...)` inside database initialization before listening for HTTP requests.

#### 4. Corrected Code (`database.js`):
```javascript
const path = require('path');
const dbPath = path.join(__dirname, 'database', 'books.db');

// Ensure table exists on startup
await db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    price REAL NOT NULL,
    pages INTEGER
  );
`);
```

---

### ERROR 4: Missing `await` in Asynchronous Database Calls

#### 1. What Caused It
SQLite methods (`db.all()`, `db.get()`, `db.run()`) return JavaScript `Promise` objects. If a developer forgets the `await` keyword, JavaScript immediately continues execution without waiting for the database query to complete.

#### 2. How to Identify It
- The API responds with an empty Promise object `{}` or `data: {}` instead of records.
- Or `res.json(books)` sends `[object Promise]` before data arrives.
- Or the server crashes with `UnhandledPromiseRejection`.

#### 3. How to Fix It
- Declare controller functions as `async (req, res, next) => { ... }`.
- Always prepend `await` before any `db.all()`, `db.get()`, or `db.run()` call.

#### 4. Corrected Code (`controllers/booksController.js`):
```javascript
// ❌ INCORRECT (missing await - sends unresolved Promise):
// const books = db.all('SELECT * FROM books');
// res.status(200).json({ data: books });

// ✅ CORRECT:
const books = await db.all('SELECT * FROM books');
res.status(200).json({
  message: 'Books retrieved successfully',
  data: books
});
```

---

## 10. Postman Testing Guide

A complete Postman collection is provided in `postman/Lab3_Postman_Collection.json`.

### How to Import and Run in Postman:
1. Open **Postman**.
2. Click **Import** (top left).
3. Drag and drop `postman/Lab3_Postman_Collection.json` or browse to select it.
4. Ensure your server is running (`npm start` on `http://localhost:3000`).
5. Open the imported collection: **Backend Lab 3 - Book Management REST API**.
6. You can click on any of the 18 requests and click **Send**, or click **Run collection** to run all 18 tests automatically!

### List of 18 Test Cases Included:

| Test # | Request | Expected Status | Purpose |
|---|---|---|---|
| **TEST 1** | `GET /books` | `200 OK` | Retrieve all books (default pagination) |
| **TEST 2** | `GET /books?search_q=java` | `200 OK` | Title search using SQLite `LIKE` |
| **TEST 3** | `GET /books?order_by=price&order=DESC` | `200 OK` | Price sorting in descending order |
| **TEST 4** | `GET /books?limit=5&offset=0` | `200 OK` | Pagination with limit and offset |
| **TEST 5** | `GET /books?min_price=100&max_price=500` | `200 OK` | Price range filtering with `BETWEEN` |
| **TEST 6** | `GET /books/1` | `200 OK` | Retrieve book by existing ID |
| **TEST 7** | `GET /books/99999` | `404 Not Found` | Retrieve non-existent book ID |
| **TEST 8** | `POST /books` (valid payload) | `201 Created` | Create new book record |
| **TEST 9** | `POST /books` (missing title) | `400 Bad Request` | Validate title presence |
| **TEST 10** | `POST /books` (missing author) | `400 Bad Request` | Validate author presence |
| **TEST 11** | `POST /books` (price = "free") | `400 Bad Request` | Validate price is numeric |
| **TEST 12** | `PUT /books/1` (valid update) | `200 OK` | Update existing book |
| **TEST 13** | `PUT /books/99999` | `404 Not Found` | Update non-existent book |
| **TEST 14** | `DELETE /books/10` | `200 OK` | Delete existing book |
| **TEST 15** | `DELETE /books/99999` | `404 Not Found` | Delete non-existent book |
| **TEST 16** | `GET /books?order=INVALID` | `400 Bad Request` | Validate order direction allowlist |
| **TEST 17** | `GET /books?limit=-5` | `400 Bad Request` | Validate positive limit |
| **TEST 18** | `GET /books?min_price=500&max_price=100` | `400 Bad Request` | Validate min_price <= max_price |

---

## 11. Chrome Execution Screenshots

Live executions of the API in **Google Chrome** have been captured and saved in the [`screenshots/`](./screenshots/) directory for college lab submission:

1. **`01_chrome_root_api.png`**: Root health endpoint `GET /` (lists available routes and API status).
2. **`02_chrome_get_all_books.png`**: Retrieve all books `GET /books`.
3. **`03_chrome_search_query_java.png`**: Search title by keyword `GET /books?search_q=java`.
4. **`04_chrome_sort_price_desc.png`**: Sort by price descending `GET /books?order_by=price&order=DESC`.
5. **`05_chrome_pagination_limit_5.png`**: Pagination limit `GET /books?limit=5&offset=0`.
6. **`06_chrome_price_filter_100_500.png`**: Price range filter `GET /books?min_price=100&max_price=500`.
7. **`07_chrome_get_book_id_1.png`**: Single book lookup by ID `GET /books/1`.
8. **`08_chrome_error_404_not_found.png`**: 404 Not Found error handling `GET /books/99999`.
9. **`09_chrome_validation_min_greater_max.png`**: Validation error (min > max price) `GET /books?min_price=500&max_price=100`.
10. **`10_chrome_validation_invalid_order.png`**: Validation error (invalid order direction) `GET /books?order=INVALID`.
11. **`11_chrome_validation_negative_limit.png`**: Validation error (negative limit) `GET /books?limit=-5`.
12. **`12_chrome_combined_parameters.png`**: Combined search + filter + sort + pagination query.

To regenerate fresh screenshots at any time:
```bash
node capture_screenshots.js
```

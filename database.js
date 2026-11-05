const path = require('path');
const fs = require('fs');
const os = require('os');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

// Detect if running inside Vercel serverless environment
const isServerless = process.env.VERCEL === '1' || process.env.NOW_REGION !== undefined;

// Determine writable database path based on environment
let dbPath;
if (isServerless) {
  // Vercel serverless functions have a read-only filesystem except for /tmp
  const tmpDbDir = os.tmpdir();
  dbPath = path.join(tmpDbDir, 'books.db');

  const localDbPath = path.join(__dirname, 'database', 'books.db');
  if (!fs.existsSync(dbPath) && fs.existsSync(localDbPath)) {
    try {
      fs.copyFileSync(localDbPath, dbPath);
    } catch (e) {
      console.warn('Could not copy local books.db to /tmp, creating freshly:', e.message);
    }
  }
} else {
  // Local development environment
  const dbDirectory = path.join(__dirname, 'database');
  if (!fs.existsSync(dbDirectory)) {
    fs.mkdirSync(dbDirectory, { recursive: true });
  }
  dbPath = path.join(dbDirectory, 'books.db');
}

let dbInstance = null;

/**
 * Initializes the SQLite database connection and sets up the books table.
 * Seeds initial book records if the table is empty.
 * @returns {Promise<import('sqlite').Database>} The initialized database instance.
 */
const initializeDB = async () => {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    dbInstance = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    // Create the books table if it does not exist
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        price REAL NOT NULL,
        pages INTEGER
      );
    `);

    // Check if table contains records; if empty, seed default books
    const rowCount = await dbInstance.get('SELECT COUNT(*) as count FROM books');
    if (rowCount && rowCount.count === 0) {
      const initialBooks = [
        { title: 'The Pragmatic Programmer', author: 'Andrew Hunt & David Thomas', price: 450, pages: 352 },
        { title: 'Clean Code', author: 'Robert C. Martin', price: 550, pages: 464 },
        { title: 'JavaScript: The Good Parts', author: 'Douglas Crockford', price: 300, pages: 176 },
        { title: 'You Don\'t Know JS: Scope & Closures', author: 'Kyle Simpson', price: 250, pages: 98 },
        { title: 'Eloquent JavaScript', author: 'Marijn Haverbeke', price: 400, pages: 472 },
        { title: 'Learning Python', author: 'Mark Lutz', price: 650, pages: 1600 },
        { title: 'Java: The Complete Reference', author: 'Herbert Schildt', price: 750, pages: 1248 },
        { title: 'Design Patterns', author: 'Erich Gamma et al.', price: 500, pages: 395 },
        { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', price: 900, pages: 1312 },
        { title: 'Head First Java', author: 'Kathy Sierra & Bert Bates', price: 480, pages: 720 }
      ];

      for (const book of initialBooks) {
        await dbInstance.run(
          'INSERT INTO books (title, author, price, pages) VALUES (?, ?, ?, ?)',
          [book.title, book.author, book.price, book.pages]
        );
      }
      console.log('Database initialized and seeded with sample books.');
    } else {
      console.log(`Database connected. Found ${rowCount ? rowCount.count : 0} books.`);
    }

    return dbInstance;
  } catch (error) {
    console.error('Failed to initialize database:', error.message);
    throw error;
  }
};

/**
 * Returns the active SQLite database instance.
 * @returns {import('sqlite').Database}
 */
const getDB = () => {
  if (!dbInstance) {
    throw new Error('Database is not initialized. Call initializeDB() before accessing the database.');
  }
  return dbInstance;
};

module.exports = {
  initializeDB,
  getDB,
};

const express = require('express');
const { initializeDB } = require('./database');
const booksRouter = require('./routes/books');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
// Configurable port to avoid EADDRINUSE conflicts
const PORT = process.env.PORT || 3000;

// Built-in JSON body parsing middleware
app.use(express.json());

// Ensure database is initialized before any request is handled (essential for Vercel serverless cold-starts)
app.use(async (req, res, next) => {
  try {
    await initializeDB();
    next();
  } catch (error) {
    console.error('Database connection error in request lifecycle:', error.message);
    next(error);
  }
});

// Root health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Backend Development Fundamentals Lab 3 API is running',
    version: '1.0.0',
    endpoints: {
      getAllBooks: 'GET /books',
      getBookById: 'GET /books/:id',
      createBook: 'POST /books',
      updateBook: 'PUT /books/:id',
      deleteBook: 'DELETE /books/:id'
    }
  });
});

// Mount books router
app.use('/books', booksRouter);

// Catch-all 404 middleware
app.use(notFoundHandler);

// Centralized error handling middleware
app.use(errorHandler);

// Start server after ensuring database connection
const startServer = async () => {
  try {
    await initializeDB();
    const server = app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`Book Management API Server is running!`);
      console.log(`Access URL: http://localhost:${PORT}`);
      console.log(`Port: ${PORT} (Configurable via PORT environment variable)`);
      console.log(`===============================================`);
    });

    // Handle port collision error explicitly (Debugging Exercise Error 1)
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`\n[PORT CONFLICT ERROR] Port ${PORT} is already in use by another application!`);
        console.error('Solutions:');
        console.error(`1. Kill the process running on port ${PORT}:`);
        console.error(`   Windows: netstat -ano | findstr :${PORT}  then  taskkill /PID <PID> /F`);
        console.error(`   macOS/Linux: lsof -i :${PORT}  then  kill -9 <PID>`);
        console.error(`2. Run the application on a different port:`);
        console.error(`   PORT=3001 npm start (or set PORT=3001 in Windows CMD/PowerShell)\n`);
      } else {
        console.error('Server startup error:', error.message);
      }
      process.exit(1);
    });

    return server;
  } catch (error) {
    console.error('Failed to start server due to database error:', error.message);
    process.exit(1);
  }
};

// Start application if executed directly
if (require.main === module) {
  startServer();
}

// Export app directly for Vercel serverless functions, and attach helpers for tests
app.app = app;
app.startServer = startServer;
module.exports = app;

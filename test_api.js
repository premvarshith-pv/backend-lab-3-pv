const http = require('http');
const { app } = require('./app');
const { initializeDB } = require('./database');

const TEST_PORT = 3456;

// Helper to make HTTP requests
const makeRequest = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed, rawBody: data });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: null, rawBody: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
};

const runAllTests = async () => {
  console.log('--- STARTING COMPREHENSIVE LAB 3 API TESTS ---\n');

  // Set test port
  process.env.PORT = TEST_PORT;
  await initializeDB();

  const server = app.listen(TEST_PORT);
  let createdBookId = null;
  let testBookForDeletionId = null;
  const results = [];

  const recordResult = (testNumber, testName, expectedStatus, actualStatus, passed, details) => {
    results.push({ testNumber, testName, expectedStatus, actualStatus, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`[TEST ${testNumber}] ${mark}: ${testName}`);
    console.log(`   Expected Status: ${expectedStatus} | Actual Status: ${actualStatus}`);
    if (details) {
      console.log(`   Details: ${JSON.stringify(details)}`);
    }
    console.log('');
  };

  try {
    // TEST 1: GET /books
    {
      const res = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/books',
        method: 'GET'
      });
      const passed = res.status === 200 && Array.isArray(res.body.data) && res.body.data.length > 0;
      recordResult(1, 'GET /books', 200, res.status, passed, { count: res.body?.data?.length });
    }

    // TEST 2: GET /books?search_q=java
    {
      const res = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/books?search_q=java',
        method: 'GET'
      });
      const allMatch = res.body?.data?.every(b => b.title.toLowerCase().includes('java'));
      const passed = res.status === 200 && Array.isArray(res.body?.data) && allMatch;
      recordResult(2, 'GET /books?search_q=java', 200, res.status, passed, {
        titles: res.body?.data?.map(b => b.title)
      });
    }

    // TEST 3: GET /books?order_by=price&order=DESC
    {
      const res = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/books?order_by=price&order=DESC',
        method: 'GET'
      });
      const prices = res.body?.data?.map(b => b.price) || [];
      const isSortedDesc = prices.every((val, i, arr) => !i || arr[i - 1] >= val);
      const passed = res.status === 200 && isSortedDesc;
      recordResult(3, 'GET /books?order_by=price&order=DESC', 200, res.status, passed, {
        prices: prices.slice(0, 5)
      });
    }

    // TEST 4: GET /books?limit=5&offset=0
    {
      const res = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/books?limit=5&offset=0',
        method: 'GET'
      });
      const passed = res.status === 200 && res.body?.data?.length <= 5;
      recordResult(4, 'GET /books?limit=5&offset=0', 200, res.status, passed, { count: res.body?.data?.length });
    }

    // TEST 5: GET /books?min_price=100&max_price=500
    {
      const res = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/books?min_price=100&max_price=500',
        method: 'GET'
      });
      const allInRange = res.body?.data?.every(b => b.price >= 100 && b.price <= 500);
      const passed = res.status === 200 && allInRange;
      recordResult(5, 'GET /books?min_price=100&max_price=500', 200, res.status, passed, {
        prices: res.body?.data?.map(b => b.price)
      });
    }

    // TEST 6: GET /books/:id with an existing ID
    {
      const res = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/books/1',
        method: 'GET'
      });
      const passed = res.status === 200 && res.body?.data?.id === 1;
      recordResult(6, 'GET /books/1 (existing ID)', 200, res.status, passed, {
        book: res.body?.data
      });
    }

    // TEST 7: GET /books/:id with a nonexistent ID
    {
      const res = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/books/99999',
        method: 'GET'
      });
      const passed = res.status === 404 && res.body?.message === 'Book not found';
      recordResult(7, 'GET /books/99999 (nonexistent ID)', 404, res.status, passed, res.body);
    }

    // TEST 8: POST /books with valid data
    {
      const payload = {
        title: 'JavaScript Basics',
        author: 'John Smith',
        price: 350,
        pages: 250
      };
      const res = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/books',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, payload);

      const passed = res.status === 201 && res.body?.bookId !== undefined;
      createdBookId = res.body?.bookId;
      recordResult(8, 'POST /books with valid data', 201, res.status, passed, res.body);
    }

    // Helper: Create a temporary book to be used in deletion test later
    {
      const payload = {
        title: 'Book To Delete',
        author: 'Temp Author',
        price: 150,
        pages: 100
      };
      const res = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/books',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, payload);
      testBookForDeletionId = res.body?.bookId;
    }

    // TEST 9: POST /books with missing title
    {
      const payload = {
        author: 'John Smith',
        price: 350,
        pages: 250
      };
      const res = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/books',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, payload);
      const passed = res.status === 400 && res.body?.message === 'Title is required';
      recordResult(9, 'POST /books with missing title', 400, res.status, passed, res.body);
    }

    // TEST 10: POST /books with missing author
    {
      const payload = {
        title: 'JavaScript Basics',
        price: 350,
        pages: 250
      };
      const res = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/books',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, payload);
      const passed = res.status === 400 && res.body?.message === 'Author is required';
      recordResult(10, 'POST /books with missing author', 400, res.status, passed, res.body);
    }

    // TEST 11: POST /books with a non-numeric price
    {
      const payload = {
        title: 'JavaScript Basics',
        author: 'John Smith',
        price: 'not-a-number',
        pages: 250
      };
      const res = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/books',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, payload);
      const passed = res.status === 400;
      recordResult(11, 'POST /books with non-numeric price', 400, res.status, passed, res.body);
    }

    // TEST 12: PUT /books/:id with valid data
    {
      const targetId = createdBookId || 1;
      const payload = {
        title: 'JavaScript Basics - Updated Edition',
        author: 'John Smith',
        price: 399,
        pages: 300
      };
      const res = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: `/books/${targetId}`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      }, payload);
      const passed = res.status === 200 && res.body?.message === 'Book updated successfully';
      recordResult(12, `PUT /books/${targetId} with valid data`, 200, res.status, passed, res.body);
    }

    // TEST 13: PUT /books/:id with a nonexistent ID
    {
      const payload = {
        title: 'Nonexistent Book',
        author: 'Ghost Author',
        price: 200,
        pages: 150
      };
      const res = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/books/99999',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      }, payload);
      const passed = res.status === 404 && res.body?.message === 'Book not found';
      recordResult(13, 'PUT /books/99999 with nonexistent ID', 404, res.status, passed, res.body);
    }

    // TEST 14: DELETE /books/:id with an existing ID
    {
      const targetId = testBookForDeletionId;
      const res = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: `/books/${targetId}`,
        method: 'DELETE'
      });
      const passed = res.status === 200 && res.body?.message === 'Book deleted successfully';
      recordResult(14, `DELETE /books/${targetId} (existing ID)`, 200, res.status, passed, res.body);
    }

    // TEST 15: DELETE /books/:id with a nonexistent ID
    {
      const res = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/books/99999',
        method: 'DELETE'
      });
      const passed = res.status === 404 && res.body?.message === 'Book not found';
      recordResult(15, 'DELETE /books/99999 (nonexistent ID)', 404, res.status, passed, res.body);
    }

    // TEST 16: GET /books?order=INVALID
    {
      const res = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/books?order=INVALID',
        method: 'GET'
      });
      const passed = res.status === 400;
      recordResult(16, 'GET /books?order=INVALID', 400, res.status, passed, res.body);
    }

    // TEST 17: GET /books?limit=-5
    {
      const res = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/books?limit=-5',
        method: 'GET'
      });
      const passed = res.status === 400;
      recordResult(17, 'GET /books?limit=-5', 400, res.status, passed, res.body);
    }

    // TEST 18: GET /books?min_price=500&max_price=100
    {
      const res = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/books?min_price=500&max_price=100',
        method: 'GET'
      });
      const passed = res.status === 400 && res.body?.message === 'min_price cannot be greater than max_price';
      recordResult(18, 'GET /books?min_price=500&max_price=100', 400, res.status, passed, res.body);
    }

    // TEST 19: Combined Query (search + sort + filter + pagination)
    {
      const res = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/books?search_q=java&order_by=price&order=DESC&limit=2&offset=0&min_price=300&max_price=600',
        method: 'GET'
      });
      const allJava = res.body?.data?.every(b => b.title.toLowerCase().includes('java'));
      const allInRange = res.body?.data?.every(b => b.price >= 300 && b.price <= 600);
      const limitRespected = res.body?.data?.length <= 2;
      const passed = res.status === 200 && allJava && allInRange && limitRespected;
      recordResult(19, 'COMBINED QUERY (search + filter + sort + pagination)', 200, res.status, passed, {
        resultsCount: res.body?.data?.length,
        items: res.body?.data?.map(b => ({ title: b.title, price: b.price }))
      });
    }

    // Summary
    const totalPassed = results.filter(r => r.passed).length;
    console.log('====================================');
    console.log(`TEST SUMMARY: ${totalPassed} / ${results.length} PASSED`);
    console.log('====================================\n');

  } finally {
    server.close();
  }
};

runAllTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});

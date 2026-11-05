const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { app } = require('./app');
const { initializeDB } = require('./database');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const PORT = 3000;

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const capture = (url, outputPath) => {
  return new Promise((resolve, reject) => {
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--window-size=1280,860',
      `--screenshot=${outputPath}`,
      url
    ];

    execFile(CHROME_PATH, args, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error capturing ${url}:`, error.message);
        reject(error);
      } else {
        console.log(`Captured: ${path.basename(outputPath)} for ${url}`);
        resolve();
      }
    });
  });
};

const run = async () => {
  console.log('Initializing database and starting server for Chrome screenshots...');
  process.env.PORT = PORT;
  await initializeDB();

  const server = app.listen(PORT, async () => {
    console.log(`Server listening on port ${PORT}. Starting Chrome captures...\n`);

    const endpoints = [
      {
        url: `http://localhost:${PORT}/`,
        filename: '01_chrome_root_api.png'
      },
      {
        url: `http://localhost:${PORT}/books`,
        filename: '02_chrome_get_all_books.png'
      },
      {
        url: `http://localhost:${PORT}/books?search_q=java`,
        filename: '03_chrome_search_query_java.png'
      },
      {
        url: `http://localhost:${PORT}/books?order_by=price&order=DESC`,
        filename: '04_chrome_sort_price_desc.png'
      },
      {
        url: `http://localhost:${PORT}/books?limit=5&offset=0`,
        filename: '05_chrome_pagination_limit_5.png'
      },
      {
        url: `http://localhost:${PORT}/books?min_price=100&max_price=500`,
        filename: '06_chrome_price_filter_100_500.png'
      },
      {
        url: `http://localhost:${PORT}/books/1`,
        filename: '07_chrome_get_book_id_1.png'
      },
      {
        url: `http://localhost:${PORT}/books/99999`,
        filename: '08_chrome_error_404_not_found.png'
      },
      {
        url: `http://localhost:${PORT}/books?min_price=500&max_price=100`,
        filename: '09_chrome_validation_min_greater_max.png'
      },
      {
        url: `http://localhost:${PORT}/books?order=INVALID`,
        filename: '10_chrome_validation_invalid_order.png'
      },
      {
        url: `http://localhost:${PORT}/books?limit=-5`,
        filename: '11_chrome_validation_negative_limit.png'
      },
      {
        url: `http://localhost:${PORT}/books?search_q=java&order_by=price&order=DESC&limit=2&offset=0&min_price=300&max_price=600`,
        filename: '12_chrome_combined_parameters.png'
      }
    ];

    try {
      for (const ep of endpoints) {
        const outPath = path.join(SCREENSHOTS_DIR, ep.filename);
        await capture(ep.url, outPath);
      }
      console.log('\nAll Chrome screenshots successfully captured in ./screenshots folder!');
    } catch (e) {
      console.error('Screenshot capture failed:', e);
    } finally {
      server.close();
      process.exit(0);
    }
  });
};

run().catch((err) => {
  console.error('Failed to run screenshot captures:', err);
  process.exit(1);
});

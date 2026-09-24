const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Save Chrome inside the project folder so Render doesn't delete it
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { executablePath } from 'puppeteer';
import { toNumber, sortBy } from 'lodash-es';
import { setTimeout } from 'timers/promises';
import {getEnv, getTelegramUpdates, sendTelegramMessage} from "./telegram.js";

getEnv()
const lowPrice = process.env['LOW'];
const showBrowser = false;

const stealth = StealthPlugin();
puppeteer.use(stealth);

const browser = await puppeteer.launch({ args: ['--no-sandbox'], headless: !showBrowser, executablePath: executablePath() });
const page = await browser.newPage();

await getTelegramUpdates()

await getLowestForSalePriceAnonymousNumber()
await getDailyToncoinPrice()
// await getLowestEndingSoonAuctionPriceAnonymousNumber()

browser.close()

async function getLowestForSalePriceAnonymousNumber() {
  await page.goto('https://fragment.com/numbers?sort=price_asc&filter=sale');
  const firstPrice = await page.evaluate(() =>
      document.querySelector('section.js-search-results table td.thin-last-col div.tm-value').innerText
  );

  const firstPriceNumber = toNumber(firstPrice);
  if (firstPriceNumber < lowPrice) {
    const firstLink = await page.evaluate(() =>
        document.querySelector('section.js-search-results table td:first-child a').href
    );

    sendTelegramMessage(`💥 ${firstPriceNumber} ton anonymous number for sale!\n${firstLink}`);
  }
}

async function getLowestEndingSoonAuctionPriceAnonymousNumber() {
  await page.goto('https://fragment.com/numbers?sort=ending&filter=auction');
  const results = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('section.js-search-results table tr:not(:nth-child(n + 50))'));
    const filteredRows = [];

    rows.forEach((row) => {
      const timeElement = row.querySelector('td.wide-last-col div.tm-timer time');
      const time = timeElement ? timeElement.innerText : null;
      if (!time || time.includes('hour')) return;

      const priceElement = row.querySelector('td.thin-last-col div.tm-value');
      const price = priceElement ? priceElement.innerText : null;
      if (!price) return;

      const linkElement = row.querySelector('td:first-child a');
      const link = linkElement ? linkElement.href : null;
      if (!link) return;

      filteredRows.push({ price, link, time });
    });

    return filteredRows;
  });

  results.forEach(({ price, link, time }) => {
    const priceNumber = toNumber(price);
    if (priceNumber < lowPrice) {
      sendTelegramMessage(`🎉 auction! ${priceNumber} ton (minimum bid) anonymous number ends in ${time}!\n${link}`);
    }
  });
}

async function getDailyToncoinPrice() {
  // if current time is not between 4am and 4:05am, return
  const now = new Date();
  if (now.getHours() !== 4 || now.getMinutes() >= 5)
    return;

  await page.goto('https://ton.org/toncoin');
  await setTimeout(4000);
  const toncoinPrice = await page.evaluate(() =>
      document.querySelector('.ToncoinWidget__price div.LableValue__value').innerText
  );

  sendTelegramMessage(`${toncoinPrice} is the current Toncoin price`, true);
}

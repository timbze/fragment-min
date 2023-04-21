import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { executablePath } from 'puppeteer';
import { toNumber, sortBy } from 'lodash-es';
import { setTimeout } from 'timers/promises';
import {sendTelegramMessage} from "./telegram.js";

const lowPrice = 70;
const showBrowser = false;

const stealth = StealthPlugin();
puppeteer.use(stealth);

const browser = await puppeteer.launch({ args: ['--no-sandbox'], headless: !showBrowser, executablePath: executablePath() });
const page = await browser.newPage();

await getLowestForSalePriceAnonymousNumber()
await getLowestUnderHourAuctionPriceAnonymousNumber()

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

    sendTelegramMessage(`💥 ${firstPriceNumber} ton number for sale!\n${firstLink}`);
  }
}

async function getLowestUnderHourAuctionPriceAnonymousNumber() {
  await page.goto('https://fragment.com/numbers?sort=ending&filter=auction');
  const results = await page.evaluate(() => {
    const twentyRows = Array.from(document.querySelectorAll('section.js-search-results table tr:not(:nth-child(n + 11))'));
    const filteredRows = [];

    twentyRows.forEach((row) => {
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
      sendTelegramMessage(`🎉 auction! ${priceNumber} ton number ends in ${time}!\n${link}`);
    }
  });
}

browser.close()

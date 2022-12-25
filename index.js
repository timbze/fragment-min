import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { executablePath } from 'puppeteer';
import { toNumber, sortBy } from 'lodash-es';
import { setTimeout } from 'timers/promises';

const stealth = StealthPlugin();
puppeteer.use(stealth);

const browser = await puppeteer.launch({ args: ['--no-sandbox'], headless: false, executablePath: executablePath() });
const page = await browser.newPage();
await page.goto('https://fragment.com/numbers?sort=price_asc&filter=auction');
const list = await page.evaluate(() =>
  Array.prototype.map.call(document.querySelectorAll('table td:first-child a'), x => x.href)
);

const NUMBER_TO_CHECK = 2000;
let pos = 0;
const values = [];

for (const link of list) {
  await setTimeout(500);
  await page.goto(link);
  const value = await page.evaluate(() => document.querySelector('.js-buy-now-btn')?.getAttribute('data-bid-amount'));

  if (value) {
    values.push({ link, value: toNumber(value) });
  }

  const min = sortBy(values, 'value').shift();
  const log = {
    current: {
      link,
      value,
    },
    min,
  };

  pos += 1;

  const progress = Math.ceil((pos / list.length) * 100);

  console.log(`🕝 processed ${progress}%`, log);

  if (pos > NUMBER_TO_CHECK) {
    break;
  }
}
const sorted = sortBy(values, 'value');

const interesting = sorted.slice(0, 10);
console.log('🤑 Top lots:', interesting);

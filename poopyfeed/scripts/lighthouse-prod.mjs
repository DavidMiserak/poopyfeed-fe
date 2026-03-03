#!/usr/bin/env node
/**
 * Run Lighthouse on production routes (single route or all).
 * Usage: AUTH_TOKEN=<token> node scripts/lighthouse-prod.mjs [path]
 *        e.g. node scripts/lighthouse-prod.mjs
 *        e.g. node scripts/lighthouse-prod.mjs /children/1/dashboard
 */
import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const BASE = 'https://poopyfeed.miserak.com';
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const OUT_DIR = join(process.cwd(), 'dist', 'lighthouse');

if (!AUTH_TOKEN) {
  console.error('AUTH_TOKEN environment variable is required for authenticated routes.');
  process.exit(1);
}
const CHILD_ID = '1';

const ROUTES = [
  { path: '/', auth: false, name: 'Landing' },
  { path: '/login', auth: false, name: 'Login' },
  { path: '/privacy', auth: false, name: 'Privacy' },
  { path: '/contact', auth: false, name: 'Contact' },
  { path: '/children', auth: true, name: 'Children list' },
  { path: `/children/${CHILD_ID}/dashboard`, auth: true, name: 'Child dashboard' },
  { path: `/children/${CHILD_ID}/analytics`, auth: true, name: 'Analytics' },
  { path: `/children/${CHILD_ID}/analytics/export`, auth: true, name: 'Export' },
  { path: `/children/${CHILD_ID}/feedings`, auth: true, name: 'Feedings list' },
  { path: `/children/${CHILD_ID}/diapers`, auth: true, name: 'Diapers list' },
  { path: `/children/${CHILD_ID}/naps`, auth: true, name: 'Naps list' },
  { path: `/children/${CHILD_ID}/timeline`, auth: true, name: 'Timeline' },
  { path: `/children/${CHILD_ID}/catch-up`, auth: true, name: 'Catch-up' },
  { path: `/children/${CHILD_ID}/advanced`, auth: true, name: 'Advanced' },
  { path: `/children/${CHILD_ID}/pediatrician-summary`, auth: true, name: 'Pediatrician summary' },
  { path: '/account', auth: true, name: 'Account settings' },
  { path: '/notifications', auth: true, name: 'Notifications' },
];

function pathToSlug(path) {
  return path.replace(/^\//, '').replace(/\//g, '-') || 'index';
}

async function runLighthouse(browser, url, options) {
  const page = await browser.newPage();
  try {
    const { lhr, report } = await lighthouse(
      url,
      {
        output: ['html', 'json'],
        logLevel: 'warn',
        disableStorageReset: options.disableStorageReset ?? true,
        formFactor: 'mobile',
        screenEmulation: { mobile: true },
      },
      undefined,
      page
    );
    return { lhr, report };
  } finally {
    await page.close();
  }
}

async function main() {
  const singlePath = process.argv[2];
  const routes = singlePath
    ? ROUTES.filter((r) => r.path === singlePath || r.path === `/${singlePath.replace(/^\//, '')}`)
    : ROUTES;
  if (routes.length === 0) {
    console.error('No matching route. Use path like /children/1/dashboard or no arg for all.');
    process.exit(1);
  }

  try {
    mkdirSync(OUT_DIR, { recursive: true });
  } catch (_) { }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const results = [];

  try {
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      const url = `${BASE}${route.path}`;
      console.log(`[${i + 1}/${routes.length}] ${route.name} (${route.path})`);

      if (route.auth) {
        const page = await browser.newPage();
        await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.evaluate((token) => {
          localStorage.setItem('auth_token', token);
        }, AUTH_TOKEN);
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
        const { lhr, report } = await lighthouse(
          page.url(),
          {
            output: ['html', 'json'],
            logLevel: 'warn',
            disableStorageReset: true,
            formFactor: 'mobile',
            screenEmulation: { mobile: true },
          },
          undefined,
          page
        );
        await page.close();

        const slug = pathToSlug(route.path);
        const reportHtml = Array.isArray(report) ? report[0] : report;
        writeFileSync(join(OUT_DIR, `lighthouse-${ts}-${slug}.html`), reportHtml);
        results.push({
          name: route.name,
          path: route.path,
          performance: Math.round((lhr.categories.performance?.score ?? 0) * 100),
          accessibility: Math.round((lhr.categories.accessibility?.score ?? 0) * 100),
          bestPractices: Math.round((lhr.categories['best-practices']?.score ?? 0) * 100),
          seo: Math.round((lhr.categories.seo?.score ?? 0) * 100),
        });
      } else {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
        const { lhr, report } = await lighthouse(
          page.url(),
          {
            output: ['html', 'json'],
            logLevel: 'warn',
            disableStorageReset: true,
            formFactor: 'mobile',
            screenEmulation: { mobile: true },
          },
          undefined,
          page
        );
        await page.close();

        const slug = pathToSlug(route.path);
        const reportHtml = Array.isArray(report) ? report[0] : report;
        writeFileSync(join(OUT_DIR, `lighthouse-${ts}-${slug}.html`), reportHtml);
        results.push({
          name: route.name,
          path: route.path,
          performance: Math.round((lhr.categories.performance?.score ?? 0) * 100),
          accessibility: Math.round((lhr.categories.accessibility?.score ?? 0) * 100),
          bestPractices: Math.round((lhr.categories['best-practices']?.score ?? 0) * 100),
          seo: Math.round((lhr.categories.seo?.score ?? 0) * 100),
        });
      }
    }
  } finally {
    await browser.close();
  }

  console.log('\n--- Lighthouse summary ---\n');
  const header = 'Route'.padEnd(24) + 'Perf  A11y  BP   SEO';
  console.log(header);
  console.log('-'.repeat(header.length));
  for (const r of results) {
    const row = `${r.name.slice(0, 23).padEnd(24)}${String(r.performance).padStart(4)}  ${String(r.accessibility).padStart(4)}  ${String(r.bestPractices).padStart(3)}  ${String(r.seo).padStart(3)}`;
    console.log(row);
  }
  console.log('\nReports in:', OUT_DIR);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

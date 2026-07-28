import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import path from "path";

const shots = path.resolve("screenshots");
await mkdir(shots, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();

async function shot(name, url, waitMs = 1500) {
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(waitMs);
  const file = path.join(shots, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log("saved", name);
}

async function login(username, password) {
  await page.goto("http://localhost:3000/login", {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.waitForTimeout(600);
  const inputs = await page.$$("input");
  if (inputs.length < 2) {
    console.log("login form missing for", username);
    return false;
  }
  await inputs[0].fill(username);
  await inputs[1].fill(password);
  const btn = await page.$('button[type="submit"]');
  if (btn) await btn.click();
  else await page.keyboard.press("Enter");
  await page.waitForTimeout(2500);
  return true;
}

try {
  await shot("01-home.png", "http://localhost:3000/", 2500);
  await shot("02-login.png", "http://localhost:3000/login", 1200);
  await shot("03-register.png", "http://localhost:3000/register", 1000);
  await shot("04-cart.png", "http://localhost:3000/cart", 1000);
  await shot("05-checkout.png", "http://localhost:3000/checkout", 1000);
  await shot("06-orders.png", "http://localhost:3000/orders", 1000);

  // Seller
  if (await login("gerai.rpl", "rpl123")) {
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(shots, "07-seller-dashboard.png"),
      fullPage: false,
    });
    console.log("saved 07-seller-dashboard.png");
  }

  // Admin
  if (await login("admin", "admin123")) {
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(shots, "08-admin-dashboard.png"),
      fullPage: false,
    });
    console.log("saved 08-admin-dashboard.png");
  }

  // Super admin
  if (await login("superadmin", "super123")) {
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(shots, "09-super-dashboard.png"),
      fullPage: false,
    });
    console.log("saved 09-super-dashboard.png");
  }

  // Home again + product detail (guest / after clear)
  await page.goto("http://localhost:3000/", {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.waitForTimeout(2000);
  // Clear session by going guest - click logout if present
  const logout = await page.$('button:has-text("Keluar"), a:has-text("Keluar"), button:has-text("Logout")');
  if (logout) {
    await logout.click();
    await page.waitForTimeout(1000);
  }

  await page.goto("http://localhost:3000/", {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: path.join(shots, "10-home-menu.png"),
    fullPage: false,
  });
  console.log("saved 10-home-menu.png");

  const prodLink = await page.$('a[href*="/product/"]');
  if (prodLink) {
    await prodLink.click();
    await page.waitForTimeout(1800);
    await page.screenshot({
      path: path.join(shots, "11-product-detail.png"),
      fullPage: false,
    });
    console.log("saved 11-product-detail.png");
  }

  // Scroll menu section
  await page.goto("http://localhost:3000/", {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 700));
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(shots, "12-menu-products.png"),
    fullPage: false,
  });
  console.log("saved 12-menu-products.png");

  console.log("ALL DONE");
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await browser.close();
}

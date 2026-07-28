import { chromium } from "playwright";
import path from "path";

const shots = path.resolve("screenshots");
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();

async function login(username, password) {
  await page.goto("http://localhost:3000/login", {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.waitForTimeout(800);
  await page.fill('input[name="login_user"]', username);
  await page.fill('input[name="login_pass"], input[type="password"]:not([name="password_fake"])', password);
  // password field name
  const pass = await page.$('input[name="login_pass"]');
  if (pass) {
    await pass.fill(password);
  } else {
    const visibles = await page.$$('input[type="password"]');
    for (const el of visibles) {
      const name = await el.getAttribute("name");
      if (name !== "password_fake") {
        await el.fill(password);
        break;
      }
    }
  }
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2800);
}

try {
  // Seller
  await login("gerai.rpl", "rpl123");
  await page.goto("http://localhost:3000/dashboard/seller", {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: path.join(shots, "07-seller-dashboard.png"),
    fullPage: false,
  });
  console.log("seller ok", page.url());

  // Admin
  await login("admin", "admin123");
  await page.goto("http://localhost:3000/dashboard/admin", {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: path.join(shots, "08-admin-dashboard.png"),
    fullPage: false,
  });
  console.log("admin ok", page.url());

  // Super
  await login("superadmin", "super123");
  await page.goto("http://localhost:3000/dashboard/super", {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: path.join(shots, "09-super-dashboard.png"),
    fullPage: false,
  });
  console.log("super ok", page.url());

  // Product + menu scroll as guest - clear storage
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.goto("http://localhost:3000/", {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.scrollTo(0, 780));
  await page.waitForTimeout(900);
  await page.screenshot({
    path: path.join(shots, "12-menu-products.png"),
    fullPage: false,
  });
  console.log("menu ok");

  const prod = await page.$('a[href*="/product/"]');
  if (prod) {
    await prod.click();
    await page.waitForTimeout(1800);
    await page.screenshot({
      path: path.join(shots, "11-product-detail.png"),
      fullPage: false,
    });
    console.log("product ok");
  }

  // Add to cart flow - try again on home
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const addBtns = await page.$$("button");
  for (const b of addBtns) {
    const t = (await b.innerText()).toLowerCase();
    if (t.includes("keranjang") || t.includes("tambah") || t.includes("pesan")) {
      await b.click();
      await page.waitForTimeout(800);
      break;
    }
  }
  await page.goto("http://localhost:3000/cart", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: path.join(shots, "04-cart.png"),
    fullPage: false,
  });
  console.log("cart ok");

  console.log("DONE");
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await browser.close();
}

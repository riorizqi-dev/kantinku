import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "src/app/dashboard/seller/profile/page.tsx");
let s = readFileSync(path, "utf8");

const map = [
  ["bg-[#0a0a0b]", "bg-stone-100 dark:bg-[#0a0a0b]"],
  ["border-white/10", "border-stone-200 dark:border-white/10"],
  ["border-white/[0.07]", "border-stone-200 dark:border-white/[0.07]"],
  ["border-white/[0.06]", "border-stone-200 dark:border-white/[0.06]"],
  ["bg-white/[0.04]", "bg-stone-100 dark:bg-white/[0.04]"],
  ["bg-white/[0.07]", "bg-stone-100 dark:bg-white/[0.07]"],
  ["bg-[#121214]", "bg-white dark:bg-[#121214]"],
  ["bg-black/20", "bg-stone-50 dark:bg-black/20"],
  ["bg-black/30", "bg-stone-50 dark:bg-black/30"],
  ["text-white/70", "text-stone-600 dark:text-white/70"],
  ["text-white/55", "text-stone-600 dark:text-white/55"],
  ["text-white/80", "text-stone-700 dark:text-white/80"],
  ["text-white/40", "text-stone-500 dark:text-white/40"],
  ["text-white/35", "text-stone-500 dark:text-white/35"],
  ["text-white/50", "text-stone-500 dark:text-white/50"],
  ["text-white ", "text-stone-900 dark:text-white "],
  ['text-white"', 'text-stone-900 dark:text-white"'],
  ["hover:text-white", "hover:text-stone-900 dark:hover:text-white"],
  ["hover:border-white/20", "hover:border-stone-300 dark:hover:border-white/20"],
  ["hover:bg-white/[0.07]", "hover:bg-stone-100 dark:hover:bg-white/[0.07]"],
];

for (const [a, b] of map) s = s.split(a).join(b);

s = s.replace(/dark:dark:/g, "dark:");
s = s.replace(
  /text-stone-900 dark:text-stone-900 dark:text-white/g,
  "text-stone-900 dark:text-white"
);
s = s.replace(
  /border-stone-200 dark:border-stone-200 dark:/g,
  "border-stone-200 dark:"
);
s = s.replace(
  /bg-stone-100 dark:bg-stone-100 dark:/g,
  "bg-stone-100 dark:"
);
s = s.replace(
  /bg-white dark:bg-white dark:bg-\[#121214\]/g,
  "bg-white dark:bg-[#121214]"
);

writeFileSync(path, s);
console.log("seller profile fixed");

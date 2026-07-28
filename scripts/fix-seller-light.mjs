import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "src/app/dashboard/seller/page.tsx");
let s = readFileSync(path, "utf8");

const map = [
  ["bg-[#0a0a0b]", "bg-stone-100 dark:bg-[#0a0a0b]"],
  ["text-white\">", 'text-stone-900 dark:text-white">'],
  ["text-white ", "text-stone-900 dark:text-white "],
  ["text-white/", "text-stone-500 dark:text-white/"],
  ["border-white/[0.07]", "border-stone-200 dark:border-white/[0.07]"],
  ["border-white/[0.08]", "border-stone-200 dark:border-white/[0.08]"],
  ["border-white/[0.06]", "border-stone-200 dark:border-white/[0.06]"],
  ["border-white/10", "border-stone-200 dark:border-white/10"],
  ["border-white/15", "border-stone-300 dark:border-white/15"],
  ["bg-[#121214]", "bg-white dark:bg-[#121214]"],
  ["bg-black/30", "bg-stone-50 dark:bg-black/30"],
  ["bg-black/20", "bg-stone-50 dark:bg-black/20"],
  ["bg-black/40", "bg-stone-100 dark:bg-black/40"],
  ["bg-white/[0.03]", "bg-stone-50 dark:bg-white/[0.03]"],
  ["bg-white/[0.04]", "bg-stone-100 dark:bg-white/[0.04]"],
  ["bg-white/[0.05]", "bg-stone-100 dark:bg-white/[0.05]"],
  ["bg-white/10", "bg-stone-200 dark:bg-white/10"],
  [
    "placeholder:text-white/30",
    "placeholder:text-stone-400 dark:placeholder:text-white/30",
  ],
  ["file:text-white", "file:text-stone-700 dark:file:text-white"],
  ["file:bg-white/10", "file:bg-stone-200 dark:file:bg-white/10"],
  [
    "from-[#10B981]/15 via-[#121214] to-[#121214]",
    "from-emerald-50 via-white to-white dark:from-[#10B981]/15 dark:via-[#121214] dark:to-[#121214]",
  ],
  // After previous replace, via might already be converted:
  [
    "from-[#10B981]/15 via-white dark:bg-[#121214] to-white dark:bg-[#121214]",
    "from-emerald-50 via-white to-white dark:from-[#10B981]/15 dark:via-[#121214] dark:to-[#121214]",
  ],
];

for (const [a, b] of map) {
  s = s.split(a).join(b);
}

// Collapse accidental double prefixes
const collapses = [
  [/dark:dark:/g, "dark:"],
  [/bg-stone-100 dark:bg-\[#0a0a0b\] dark:bg-\[#0a0a0b\]/g, "bg-stone-100 dark:bg-[#0a0a0b]"],
  [/text-stone-900 dark:text-stone-900 dark:text-white/g, "text-stone-900 dark:text-white"],
  [/text-stone-500 dark:text-stone-500 dark:text-white\//g, "text-stone-500 dark:text-white/"],
  [/border-stone-200 dark:border-stone-200 dark:/g, "border-stone-200 dark:"],
  [/border-stone-300 dark:border-stone-300 dark:/g, "border-stone-300 dark:"],
  [/bg-white dark:bg-white dark:bg-\[#121214\]/g, "bg-white dark:bg-[#121214]"],
  [/bg-stone-50 dark:bg-stone-50 dark:bg-black\//g, "bg-stone-50 dark:bg-black/"],
  [/bg-stone-100 dark:bg-stone-100 dark:bg-/g, "bg-stone-100 dark:bg-"],
  [
    /placeholder:text-stone-400 dark:placeholder:text-stone-400 dark:placeholder:/g,
    "placeholder:text-stone-400 dark:placeholder:",
  ],
  [
    /from-emerald-50 via-white to-white dark:from-\[#10B981\]\/15 dark:via-\[#121214\] dark:to-\[#121214\] dark:from-\[#10B981\]\/15 dark:via-\[#121214\] dark:to-\[#121214\]/g,
    "from-emerald-50 via-white to-white dark:from-[#10B981]/15 dark:via-[#121214] dark:to-[#121214]",
  ],
];

for (const [re, rep] of collapses) {
  s = s.replace(re, rep);
}

// Profile card border + camera badge light-friendly
s = s.replace(
  "border-2 border-[#0a0a0b] bg-[#10B981]",
  "border-2 border-white dark:border-[#0a0a0b] bg-[#10B981]"
);

// Select/options on dark bg that became light - keep readable
// font-semibold text-white on select - already converted

writeFileSync(path, s);
console.log("seller page fixed");
console.log(
  "shell ok:",
  s.includes("bg-stone-100 dark:bg-[#0a0a0b]")
);

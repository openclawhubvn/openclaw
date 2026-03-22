const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'vi');
const THRESHOLD = 40000;

const results = [];

function scan(dir) {
  if (!fs.existsSync(dir)) return;
  for (const file of fs.readdirSync(dir)) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      scan(filePath);
    } else if (filePath.endsWith('.md') || filePath.endsWith('.mdx')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.length > THRESHOLD) {
        results.push({ file: path.relative(targetDir, filePath), chars: content.length });
      }
    }
  }
}

scan(targetDir);

results.sort((a, b) => b.chars - a.chars);

console.log(`\n📋 File lớn hơn ${THRESHOLD.toLocaleString()} ký tự trong ${targetDir}:\n`);
for (const r of results) {
  const chunks = Math.ceil(r.chars / THRESHOLD);
  console.log(`  ${r.chars.toLocaleString().padStart(9)} ký tự  [${chunks} chunk]  ${r.file}`);
}
console.log(`\nTổng: ${results.length} file\n`);

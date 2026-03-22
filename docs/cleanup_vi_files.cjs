const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'vi');

function deleteViFiles(dir) {
  if (!fs.existsSync(dir)) return;
  for (const file of fs.readdirSync(dir)) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      deleteViFiles(filePath);
    } else if (filePath.endsWith('.vi.md') || filePath.endsWith('.vi.mdx')) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Đã xóa: ${path.relative(targetDir, filePath)}`);
    }
  }
}

console.log(`\n🔍 Quét thư mục: ${targetDir}\n`);
deleteViFiles(targetDir);
console.log('\n✅ Xong!\n');

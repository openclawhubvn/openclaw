const fs = require('fs');
const path = require('path');

const docsDir = __dirname;
const docsJsonPath = path.join(docsDir, 'docs.json');
const docsConfig = require(docsJsonPath);

// 1. Tìm block language 'en'
const enLanguageBlock = docsConfig.navigation.languages.find(l => l.language === 'en');

if (!enLanguageBlock) {
  console.error("❌ Không tìm thấy block language 'en' trong docs.json");
  process.exit(1);
}

// 2. Hàm gom tất cả các page từ mảng tabs
function getPagesFromTabs(tabs) {
  let pages = [];
  for (const tab of tabs) {
    if (tab.groups) {
      for (const group of tab.groups) {
        if (group.pages) {
          for (const page of group.pages) {
            if (typeof page === 'string') {
               pages.push(page);
            } else if (typeof page === 'object' && page.pages) {
               // Xử lý Nested group (group nằm trong group)
               pages = pages.concat(page.pages);
            }
          }
        }
      }
    }
  }
  return pages;
}

const enPages = getPagesFromTabs(enLanguageBlock.tabs);
console.log(`\n🔍 Tìm thấy ${enPages.length} trang trong block 'en'. Bắt đầu quá trình sao chép...\n`);

let copiedCount = 0;
let errorCount = 0;
let notFoundCount = 0;

for (const pageStr of enPages) {
  const page = typeof pageStr === 'string' ? pageStr : pageStr.toString();
  
  // Xác định file tiếng Anh đích (có thể là .md hoặc .mdx)
  const destFilePathMd = path.join(docsDir, `${page}.md`);
  const destFilePathMdx = path.join(docsDir, `${page}.mdx`);
  
  let targetFile = null;
  let ext = '.md';
  if (fs.existsSync(destFilePathMdx)) {
     targetFile = destFilePathMdx;
     ext = '.mdx';
  } else if (fs.existsSync(destFilePathMd)) {
     targetFile = destFilePathMd;
     ext = '.md';
  } else {
     // Mặc định coi là .md nếu chưa từng tồn tại
     targetFile = destFilePathMd;
     ext = '.md';
  }

  // Tìm file nguồn đã dịch (ưu tiên thư mục vn/ trước, sau đó vi/)
  const possibleSources = [
    path.join(docsDir, 'vn', `${page}.md`),
    path.join(docsDir, 'vn', `${page}.mdx`),
    path.join(docsDir, 'vi', `${page}.md`),
    path.join(docsDir, 'vi', `${page}.mdx`),
    // Thử một số base path trong trường hợp user để chung
    path.join(docsDir, `${page}.vi.md`),
    path.join(docsDir, `${page}.vi.mdx`)
  ];

  let sourceFile = null;
  for (const src of possibleSources) {
    if (fs.existsSync(src)) {
      sourceFile = src;
      break;
    }
  }

  if (!sourceFile) {
     console.log(`⚠️  Bỏ qua: Không tìm thấy bản dịch cho '${page}'`);
     notFoundCount++;
     continue;
  }

  try {
     // Tạo thư mục cha cho targetFile nếu nó chứa đường dẫn con
     const dir = path.dirname(targetFile);
     if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
     }

     // 3. Tạo file backup .en.md hoặc .en.mdx nếu đích tồn tại
     if (fs.existsSync(targetFile)) {
         const backupFile = targetFile.replace(new RegExp(`\\${ext}$`), `.en${ext}`);
         if (!fs.existsSync(backupFile)) {
             fs.copyFileSync(targetFile, backupFile);
             // console.log(`💾 Backup: tạo ${path.relative(docsDir, backupFile)}`);
         }
     }

     // 4. Ghi đè file dịch lên file gốc
     fs.copyFileSync(sourceFile, targetFile);
     console.log(`✅ Ghi đè: ${path.relative(docsDir, targetFile)} (từ ${path.relative(docsDir, sourceFile)})`);
     copiedCount++;
     
  } catch (err) {
     console.error(`❌ Lỗi xử lý '${page}': ${err.message}`);
     errorCount++;
  }
}

console.log(`\n🎉 Hoàn tất!`);
console.log(`- Đã copy & ghi đè: ${copiedCount} file`);
console.log(`- Chưa có bản dịch: ${notFoundCount} file`);
console.log(`- Có lỗi: ${errorCount} file\n`);

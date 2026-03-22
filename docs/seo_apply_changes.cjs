const fs = require('fs');
const path = require('path');

const targetDir = __dirname;
const proposalFile = path.join(targetDir, 'seo_proposal_all_map.json');

if (!fs.existsSync(proposalFile)) {
  console.error("❌ Không tìm thấy file seo_proposal_all_map.json.");
  console.error("Vui lòng chạy lệnh 'node seo_review_all.cjs' trước, kiểm tra và duyệt file map trước khi apply.");
  process.exit(1);
}

const map = JSON.parse(fs.readFileSync(proposalFile, 'utf8'));
let successCount = 0;

console.log("Bắt đầu áp dụng thay đổi từ seo_proposal_all_map.json...\n");

for (const [pageKey, info] of Object.entries(map)) {
  if (info.error) continue;
  
  const suggestedTitle = info.suggested_title;
  const suggestedSummary = info.suggested_summary;
  
  // Nếu thông tin gợi ý bị rỗng thì bỏ qua
  if (!suggestedTitle || !suggestedSummary) continue;
  
  let filepath = info.filepath;
  if (!filepath) continue;
  
  const absolutePath = path.join(targetDir, filepath);
  if (!fs.existsSync(absolutePath)) {
    console.warn(`⚠️ Bỏ qua: Tệp không tồn tại [${filepath}]`);
    continue;
  }
  
  let content = fs.readFileSync(absolutePath, 'utf8');
  
  // Bắt khối frontmatter giữa "---" và "---"
  const frontmatterMatch = content.match(/^---\n([\s\S]+?)\n---/);
  
  if (!frontmatterMatch) {
    console.warn(`⚠️ Bỏ qua: Không tìm thấy Frontmatter ở [${filepath}]`);
    continue; 
  }
  
  const originalFrontmatter = frontmatterMatch[1];
  let newFrontmatter = originalFrontmatter;
  
  const titleRegex = /^title:\s*.*$/m;
  const summaryRegex = /^summary:\s*.*$/m;
  
  if (titleRegex.test(newFrontmatter)) {
    newFrontmatter = newFrontmatter.replace(titleRegex, `title: ${JSON.stringify(suggestedTitle)}`);
  } else {
    newFrontmatter += `\ntitle: ${JSON.stringify(suggestedTitle)}`;
  }
  
  if (summaryRegex.test(newFrontmatter)) {
    newFrontmatter = newFrontmatter.replace(summaryRegex, `summary: ${JSON.stringify(suggestedSummary)}`);
  } else {
    newFrontmatter += `\nsummary: ${JSON.stringify(suggestedSummary)}`;
  }
  
  if (newFrontmatter !== originalFrontmatter) {
    const newContent = content.replace(originalFrontmatter, newFrontmatter);
    fs.writeFileSync(absolutePath, newContent, 'utf8');
    console.log(`✅ Đã cập nhật: ${filepath}`);
    successCount++;
  }
}

console.log(`\n🎉 Hoàn thành! Đã cập nhật thành công ${successCount} file(s).`);

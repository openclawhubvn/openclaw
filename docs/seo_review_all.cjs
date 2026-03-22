const fs = require('fs');
const path = require('path');

// ================= CẤU HÌNH API =================
const geminiKey = process.env.GEMINI_API_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;
const openaiKey = process.env.OPENAI_API_KEY;
const apiKey = geminiKey || anthropicKey || openaiKey;

if (!apiKey) {
  console.error("❌ Lỗi: Bạn cần cung cấp GEMINI_API_KEY, ANTHROPIC_API_KEY, hoặc OPENAI_API_KEY.");
  process.exit(1);
}

const targetDir = __dirname;
const docsJsonPath = path.join(targetDir, 'docs.json');
const outputFile = path.join(targetDir, 'seo_proposal_all_map.json');
const CONCURRENCY_LIMIT = 10;

const SYSTEM_PROMPT = `Vai trò: Bạn là một chuyên gia Chuyên viên SEO nội dung (SEO Content Specialist) cho các tài liệu kỹ thuật phần mềm tại Việt Nam.

Mục tiêu:
Hãy đánh giá tiêu đề (Title) và mô tả (Summary) của một trang web tài liệu và đề xuất phiên bản mới tối ưu hơn cho bộ máy tìm kiếm Google.

Yêu cầu cho Title đề xuất:
- Chuẩn SEO: Độ dài lý tưởng 40-50 ký tự (để chừa chỗ trống cho hậu tố hệ thống).
- Chứa các từ khóa tìm kiếm phổ biến như tên công nghệ, "Hướng dẫn", "Cấu hình", "Trợ lý AI", "OpenClaw".
- TUYỆT ĐỐI KHÔNG BAO GIỜ thêm hậu tố thương hiệu (như "- OpenClaw Việt Nam" hay "| OpenClaw") vào title, vì website đã tự động gắn thêm. Tiêu đề bạn trả về phải ngắn gọn và không có hậu tố thương hiệu.

Yêu cầu cho Summary đề xuất:
- Chuẩn SEO: Độ dài lý tưởng 140-160 ký tự.
- Dùng tiếng Việt tự nhiên, nhấn mạnh đúng mục đích và kết quả mang lại (tương tự Meta Description). Mời gọi click.

Định dạng trả về:
BẠN PHẢI TRẢ VỀ ĐÚNG MỘT OBJECT JSON HỢP LỆ THEO CHUẨN (KHÔNG có mã markdown, KHÔNG có \`\`\`json, chỉ một object json thuần tuý).
Ví dụ trả về:
{"suggested_title": "Cách Kết Nối Discord Bot Với Trợ Lý AI", "suggested_summary": "Hướng dẫn chi tiết từng bước tạo và cấu hình Discord Bot, lấy Token và liên kết với hệ thống để tạo trợ lý AI thông minh trên server của bạn.", "reasoning": "Từ khóa chính là 'Kết nối Discord Bot' được đặt lên đầu, title ngắn gọn không chứa hậu tố thừa, summary tập trung vào việc tạo cấu hình."}
`;

// ================= HÀM ĐỌC PAGES TỪ DOCS.JSON =================
function extractPages(items, pagesSet = new Set()) {
  for (const item of items) {
    if (typeof item === 'string') {
      if (!item.startsWith('http')) {
        pagesSet.add(item);
      }
    } else if (item && typeof item === 'object') {
      if (item.pages) extractPages(item.pages, pagesSet);
      if (item.groups) extractPages(item.groups, pagesSet);
      if (item.tabs) extractPages(item.tabs, pagesSet);
      if (item.languages) extractPages(item.languages, pagesSet);
    }
  }
  return Array.from(pagesSet);
}

function resolveFilePath(pageStr) {
  let p = path.join(targetDir, pageStr + '.md');
  if (fs.existsSync(p)) return p;
  
  p = path.join(targetDir, pageStr + '.mdx');
  if (fs.existsSync(p)) return p;
  
  p = path.join(targetDir, pageStr, 'index.md');
  if (fs.existsSync(p)) return p;
  
  p = path.join(targetDir, pageStr, 'index.mdx');
  if (fs.existsSync(p)) return p;
  
  return null;
}

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]+?)\n---/);
  if (!match) return { title: null, summary: null };
  const frontmatter = match[1];
  
  let title = null;
  let summary = null;
  
  const titleMatch = frontmatter.match(/^title:\s*['"]?([^'"\n]+)['"]?/m);
  if (titleMatch) title = titleMatch[1];
  
  const summaryMatch = frontmatter.match(/^summary:\s*['"]?([^'"\n]+)['"]?/m);
  if (summaryMatch) summary = summaryMatch[1];
  
  return { title, summary };
}

// ================= API LLM CALL =================
async function reviewSEO(pageStr, currentTitle, currentSummary) {
  const prompt = `Đây là nội dung frontmatter hiện tại của đường dẫn: ${pageStr}
- Title hiện tại: ${currentTitle || "[Đang trống]"}
- Summary hiện tại: ${currentSummary || "[Đang trống]"}

Hãy viết lại chúng cho chuẩn SEO (tiếng Việt). Đừng quên điều kiện TUYỆT ĐỐI KHÔNG THÊM đuôi thương hiệu.`;

  if (geminiKey) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, response_mime_type: "application/json" }
      })
    });
    if (!res.ok) throw new Error(`Gemini Error: ${res.status}`);
    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  }
  
  if (anthropicKey) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2
      })
    });
    if (!res.ok) throw new Error(`Anthropic Error: ${res.status}`);
    const data = await res.json();
    return data.content[0].text;
  }
  
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      temperature: 0.2
    })
  });
  if (!res.ok) {
     const text = await res.text();
     throw new Error(`OpenAI Error: ${res.status} - ${text}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

// ================= MAIN RUN =================
async function main() {
  if (!fs.existsSync(docsJsonPath)) {
    console.error("❌ Không tìm thấy docs.json");
    return;
  }
  const docsConfig = JSON.parse(fs.readFileSync(docsJsonPath, 'utf8'));
  const navigation = docsConfig.navigation;
  if (!navigation) {
    console.error("❌ Không tìm thấy tab navigation trong docs.json");
    return;
  }
  
  const navArray = Array.isArray(navigation) ? navigation : [navigation];
  const pages = extractPages(navArray);
  console.log(`\n🔍 Đã tìm thấy ${pages.length} trang khai báo trong docs.json để quét.`);

  const resultsMap = {};
  const queue = [...pages];
  
  async function worker(workerId) {
    while (queue.length > 0) {
      const pageStr = queue.shift();
      const filePath = resolveFilePath(pageStr);
      
      if (!filePath) {
         console.warn(`⚠️ Không tìm thấy tệp vật lý cho: ${pageStr}`);
         continue;
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      const { title, summary } = extractFrontmatter(content);
      
      try {
        let aiResultStr = await reviewSEO(pageStr, title, summary);
        
        // Cleanup JSON bọc thừa
        if (aiResultStr.startsWith("\`\`\`json")) aiResultStr = aiResultStr.replace(/^\`\`\`json\n|\n\`\`\`$/g, "");
        if (aiResultStr.startsWith("\`\`\`")) aiResultStr = aiResultStr.replace(/^\`\`\`\n|\n\`\`\`$/g, "");
        
        const aiJson = JSON.parse(aiResultStr.trim());
        
        resultsMap[pageStr] = {
           filepath: path.relative(targetDir, filePath),
           current_title: title || "",
           current_summary: summary || "",
           suggested_title: aiJson.suggested_title || "",
           suggested_summary: aiJson.suggested_summary || "",
           reasoning: aiJson.reasoning || ""
        };
        
        console.log(`✅ [${workerId}] SEO OK: ${pageStr} -> ${aiJson.suggested_title}`);
      } catch (err) {
        console.error(`❌ Lỗi khi phân tích ${pageStr}:`, err.message);
        resultsMap[pageStr] = { error: err.message };
      }
    }
  }
  
  const workers = [];
  for (let i = 0; i < CONCURRENCY_LIMIT; i++) {
    workers.push(worker(i));
  }
  
  await Promise.all(workers);
  
  fs.writeFileSync(outputFile, JSON.stringify(resultsMap, null, 2), 'utf8');
  console.log(`\n🎉 Hoàn thành quét toàn bộ tài liệu!`);
  console.log(`=> Kết quả đề xuất đã được lưu tại: ${outputFile}\n`);
}

main();

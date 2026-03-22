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

const targetDir = path.join(__dirname, 'channels');
const outputFile = path.join(__dirname, 'seo_proposal_map.json');
const CONCURRENCY_LIMIT = 10; 

const SYSTEM_PROMPT = `Vai trò: Bạn là một chuyên gia Chuyên viên SEO nội dung (SEO Content Specialist) cho các tài liệu kỹ thuật phần mềm tại Việt Nam.

Mục tiêu:
Hãy đánh giá tiêu đề (Title) và mô tả (Summary) của một trang web tài liệu và đề xuất phiên bản mới tối ưu hơn cho bộ máy tìm kiếm Google.

Yêu cầu cho Title đề xuất:
- Chuẩn SEO: Độ dài lý tưởng 40-50 ký tự (để chừa chỗ trống cho hậu tố được nối tự động).
- Chứa các từ khóa tìm kiếm phổ biến (ví dụ: "Kết nối [Tên Kênh]", "Tích hợp", "Bot AI").
- TUYỆT ĐỐI KHÔNG thêm hậu tố thương hiệu (như "- OpenClaw Việt Nam" hay "| OpenClaw") vào title vì website sẽ tự động gắn.

Yêu cầu cho Summary đề xuất:
- Chuẩn SEO: Độ dài lý tưởng 140-160 ký tự.
- Nhấn mạnh đúng mục đích và kết quả mang lại, mang tính kêu gọi hành động (Call to action) hoặc cung cấp giá trị rõ rệt để thu hút tỷ lệ CTR.

Định dạng trả về:
BẠN PHẢI TRẢ VỀ ĐÚNG MỘT OBJECT JSON HỢP LỆ VÀ KHÔNG CHỨA BẤT KỲ VĂN BẢN NÀO KHÁC BÊN NGOÀI BỌC JSON. (không có dấu markdown \`\`\`json).
Ví dụ:
{"suggested_title": "Cách Kết Nối Discord Bot Với OpenClaw", "suggested_summary": "Hướng dẫn chi tiết từng bước tạo và cấu hình Discord Bot, lấy Token và liên kết với OpenClaw để tạo trợ lý AI thông minh trên server của bạn.", "reasoning": "Từ khóa chính là 'Kết nối Discord Bot' được đặt lên đầu, title ngắn gọn không chứa hậu tố thừa, summary tập trung vào việc tạo cấu hình giúp người đọc thấy rõ nội dung."}
`;

// ================= HÀM GỌI LLM =================
async function reviewSEO(filename, currentTitle, currentSummary) {
  const prompt = `Đây là nội dung frontmatter hiện tại của file: ${filename}
- Title hiện tại: ${currentTitle || "[Đang trống]"}
- Summary hiện tại: ${currentSummary || "[Đang trống]"}

Dựa vào tên file hoặc nội dung, tệp này thuộc thư mục "channels", thường hướng dẫn kết nối mạng xã hội/kênh trò chuyện với OpenClaw.
Hãy đưa ra JSON đề xuất chuẩn SEO nhất.`;

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
  if (!res.ok) throw new Error(`OpenAI Error: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

// ================= CÁC HÀM XỬ LÝ =================
function getFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, fileList);
    } else {
      if ((filePath.endsWith('.md') || filePath.endsWith('.mdx')) && !filePath.includes('.en.md')) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
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

async function main() {
  const files = getFiles(targetDir);
  console.log(`\n🔍 Tìm thấy ${files.length} file trong ${targetDir}`);
  console.log(`Bắt đầu chạy AI phân tích SEO...\n`);

  const resultsMap = {};
  const queue = [...files];
  
  async function worker(workerId) {
    while (queue.length > 0) {
      const filePath = queue.shift();
      const relativeName = path.relative(targetDir, filePath);
      
      const content = fs.readFileSync(filePath, 'utf8');
      const { title, summary } = extractFrontmatter(content);
      
      // Nếu file trống hoặc không có title/summary, cứ cung cấp cho nó tạo mới
      try {
        let aiResultStr = await reviewSEO(relativeName, title, summary);
        
        // Cleanup JSON
        if (aiResultStr.startsWith("\`\`\`json")) aiResultStr = aiResultStr.replace(/^\`\`\`json\n|\n\`\`\`$/g, "");
        if (aiResultStr.startsWith("\`\`\`")) aiResultStr = aiResultStr.replace(/^\`\`\`\n|\n\`\`\`$/g, "");
        
        const aiJson = JSON.parse(aiResultStr.trim());
        
        resultsMap[relativeName] = {
           filename: relativeName,
           current_title: title || "",
           current_summary: summary || "",
           suggested_title: aiJson.suggested_title || "",
           suggested_summary: aiJson.suggested_summary || "",
           reasoning: aiJson.reasoning || ""
        };
        
        console.log(`✅ Đã phân tích: ${relativeName}`);
      } catch (err) {
        console.error(`❌ Lỗi khi phân tích ${relativeName}:`, err.message);
        resultsMap[relativeName] = { error: err.message };
      }
    }
  }
  
  const workers = [];
  for (let i = 0; i < CONCURRENCY_LIMIT; i++) {
    workers.push(worker(i));
  }
  
  await Promise.all(workers);
  
  fs.writeFileSync(outputFile, JSON.stringify(resultsMap, null, 2), 'utf8');
  console.log(`\n🎉 Hoàn thành!`);
  console.log(`=> Kết quả mapping và phân tích SEO đã được lưu tại: ${outputFile}\n`);
}

main();

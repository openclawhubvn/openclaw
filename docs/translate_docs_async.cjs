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

// ================= CẤU HÌNH SCRIPT =================
const CONCURRENCY_LIMIT = 20; // Số lượng file dịch song song cùng lúc (Tăng giảm tùy mức giới hạn Rate Limit của API)

const docsDir = __dirname;
const targetDir = path.join(docsDir, 'vi'); // Thư mục nguồn cần quét

const SYSTEM_PROMPT = `Vai trò:
Bạn là một Senior Technical Writer kiêm Tech Lead người Việt, có nhiều kinh nghiệm viết tài liệu kỹ thuật cho dev, sysadmin, IT engineer và product team tại Việt Nam.

Nhiệm vụ:
Viết lại (transcreate) tài liệu kỹ thuật gốc sang tiếng Việt để publish trên site cộng đồng OpenClaw Việt Nam.

Mục tiêu & Đặc điểm văn phong:
- Ngắn, rõ, gãy gọn, thực dụng, đọc lướt vẫn hiểu ngay. Biết ngay cần làm gì, dùng khi nào.
- KHÔNG dịch word-by-word. KHÔNG bê nguyên cấu trúc câu tiếng Anh nếu làm câu bị cứng.
- Giọng văn tự nhiên với dev Việt, thân thiện, chuyên nghiệp, dứt khoát. Ít văn vẻ.
- Ưu tiên câu ngắn, chủ động chẻ câu dài, chuyển liệt kê thành bullet points.
- Loại bỏ ĐẠI TỪ THỪA: "bạn", "của bạn", "chúng tôi", "nó", "điều này", "việc này". (Ví dụ: "Điện thoại của bạn" -> "Điện thoại").
- Chuyển danh từ thành động từ nếu câu gọn hơn (Ví dụ: "Sự phân quyền" -> "Phân quyền").
- Dùng ngôn ngữ IT bình dân, đúng cách nói của dev Việt một cách chừng mực: "chạy local", "tự host", "dựng nhanh", "lên nhanh", "siết quyền truy cập", "đứng giữa", "đọc tiếp từ đâu", "thực chiến", "chuẩn nhất", "hay gặp", "fix lỗi".

Quy tắc BẮT BUỘC:
1. Giữ NGUYÊN TUYỆT ĐỐI: code block, command line, tên biến, tên function, class/method, API path, JSON, YAML, XML, tên package, cấu hình, URL, path file, CLI command.
2. KHÔNG tự ý Việt hóa thuật ngữ phổ biến: Workspace, Session, Gateway, Dashboard, Node, Plugin, Channel, CLI, Web UI, Token, Provider, Routing, Remote access, Security, Troubleshooting, Self-hosted, Multi-agent, Media, Group, Mention, Sender.
3. Giữ nguyên format Markdown: heading, subheading, list, table, card block, steps block, mermaid, blockquote.
4. KHÔNG làm sai meaning kỹ thuật, đặc biệt là behavior, luồng hoạt động, dependency, config, rủi ro security.

Định dạng trả về:
- Chỉ xuất ra bản tiếng Việt hoàn chỉnh, sạch, bằng Markdown.
- KHÔNG giải thích thêm. KHÔNG bình luận. KHÔNG ghi chú translator.
- KHÔNG dùng markdown block \`\`\`markdown bao bọc kết quả (trừ phi bản gốc cố tình như vậy). Chỉ output trực tiếp nội dung text.`;

// ================= HÀM DỊCH =================
async function translate(content) {
  if (geminiKey) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: content }] }],
        generationConfig: { temperature: 0.1 }
      })
    });
    if (!res.ok) throw new Error(`Gemini Error: ${res.status} ${await res.text()}`);
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
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: content }],
        temperature: 0.1
      })
    });
    if (!res.ok) throw new Error(`Anthropic Error: ${res.status} ${await res.text()}`);
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
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: content }
      ],
      temperature: 0.1
    })
  });
  if (!res.ok) throw new Error(`OpenAI Error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

// ================= QUÉT FILE =================
function getFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, fileList);
    } else {
      // Chỉ lấy file .md hoặc .mdx và bỏ qua những file ĐÃ là file dịch (.vi.md / .vi.mdx)
      if ((filePath.endsWith('.md') || filePath.endsWith('.mdx')) && 
          !filePath.endsWith('.vi.md') && 
          !filePath.endsWith('.vi.mdx')) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

let processed = 0, skipped = 0, errors = 0;

// ================= WORKER MULTI-THREADING (CONCURRENCY) =================
async function processFile(file, workerId) {
  const destFile = file.replace(/\.(md|mdx)$/, '.vi.$1');
  const relPath = path.relative(targetDir, file);
  
  // 1. NGĂN DỊCH CHỒNG: Bỏ qua nếu đã tồn tại file `.vi.md`
  if (fs.existsSync(destFile)) {
    console.log(`[W${workerId}] ⏭️ Bỏ qua ${relPath} (đã tồn tại file .vi)`);
    skipped++;
    return;
  }

  let content = '';
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch (e) {
    return;
  }

  if (content.length > 500000) {
    console.log(`[W${workerId}] ⚠️ Bỏ qua ${relPath} (quá lớn)`);
    skipped++;
    return;
  }

  console.log(`[W${workerId}] ⏳ Đang dịch: ${relPath} ...`);
  try {
    let resultStr = await translate(content);
    
    // Xử lý dọn markdown code block nếu API trả về dư
    if (resultStr.startsWith("\`\`\`markdown\n")) {
       resultStr = resultStr.substring(12, resultStr.length - 3);
    } else if (resultStr.startsWith("\`\`\`\n")) {
       resultStr = resultStr.substring(4, resultStr.length - 3);
    }
    
    // Lưu ra file .vi.md mới
    fs.writeFileSync(destFile, resultStr.trim() + '\\n', 'utf8');
    console.log(`[W${workerId}] ✅ Dịch xong: ${path.relative(targetDir, destFile)}`);
    processed++;
    
    // Thêm delay nhẹ tránh spam API quá gắt
    await new Promise(r => setTimeout(r, 100));
  } catch (err) {
    console.error(`[W${workerId}] ❌ Lỗi ${relPath}: ${err.message}`);
    errors++;
    
    if (err.message.includes("401") || err.message.includes("403") || err.message.includes("quota") || err.message.includes("rate") || err.message.includes("429")) {
       throw err; // Ném thẳng ra ngoài để dừng toàn bộ chương trình
    }
  }
}

async function main() {
  const allFiles = getFiles(targetDir);
  console.log(`\\n🔍 Đã tìm thấy ${allFiles.length} file nguồn cần quét dịch đa luồng trong ${targetDir}\\n`);

  // Xếp hàng đợi
  const queue = [...allFiles];
  let fatalError = false;

  // Hàm worker
  async function worker(workerId) {
    while (queue.length > 0 && !fatalError) {
      const file = queue.shift();
      try {
        await processFile(file, workerId);
      } catch (err) {
        console.error(`\\n🛑 Worker ${workerId} gặp lỗi ngắt hệ thống (Hết Quota / Sai API Key / Bị Rate Limit Cứng). Dừng khẩn cấp!`);
        fatalError = true;
      }
    }
  }

  // Khởi động các luồng
  const workers = [];
  for (let i = 1; i <= CONCURRENCY_LIMIT; i++) {
    workers.push(worker(i));
  }

  // Chờ tất cả luồng chạy xong
  await Promise.all(workers);

  console.log(`\\n🎉 Tiến trình hoàn thành!`);
  console.log(`- Đã dịch thành công: ${processed}`);
  console.log(`- Đã bỏ qua: ${skipped}`);
  console.log(`- Lỗi: ${errors}\\n`);
}

main().catch(err => {
  console.error("Lỗi unhandled crash:", err);
});

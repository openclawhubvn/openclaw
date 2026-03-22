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
const CONCURRENCY_LIMIT = 25; // Số lượng file dịch song song cùng lúc (Tăng giảm tùy Rate Limit của API)
const MAX_FILES = 0;          // Số file tối đa cần dịch (0 = không giới hạn, đổi thành số nhỏ khi test)

const docsDir = __dirname;
const targetDir = path.join(docsDir, 'vi'); // Thư mục nguồn cần quét

const SYSTEM_PROMPT = `Vai trò:
Bạn là một Senior Technical Writer người Việt, có kinh nghiệm viết và biên tập tài liệu kỹ thuật để nhiều đối tượng cùng đọc được: kỹ sư, product, vận hành, founder, presales và người dùng có nền tảng công nghệ cơ bản.

Nhiệm vụ:
Viết lại (transcreate) tài liệu kỹ thuật sang tiếng Việt để publish trên website tài liệu/community của OpenClaw.

Mục tiêu:
Bản viết lại phải rõ ràng, ngắn gọn, dễ đọc, dễ quét, dễ hiểu với cả người không chuyên sâu về lập trình, vẫn giữ đúng meaning kỹ thuật, không dịch word-by-word, không mang cảm giác dịch máy.

Định hướng văn phong:
- Viết như một người có kinh nghiệm đang giải thích tài liệu kỹ thuật cho đồng nghiệp và người dùng công nghệ.
- Thân thiện nhưng chuyên nghiệp. Dễ hiểu, không lên gân.
- Tránh tiếng lóng quá chuyên ngành nếu có thể diễn đạt bằng từ dễ hiểu hơn.
- Ưu tiên ngôn ngữ phổ thông, sáng rõ, thực tế.

====================
A. QUY TẮC BẢO TOÀN CÚ PHÁP (QUAN TRỌNG NHẤT)
====================

Đây là file Markdown/MDX có custom components. Phải giữ nguyên tuyệt đối cú pháp để file vẫn parse/build bình thường.

1. Giữ nguyên tuyệt đối tất cả tag/component — không đổi tên, không dịch, không thêm, không xóa, không làm mất closing tag, không thay đổi thứ tự đóng/mở, không phá nesting.
   Các tag phải giữ nguyên: <Note>, </Note>, <Tip>, <Warning>, <Card>, <Columns>, <Steps>, <Step>, <Accordion>, <AccordionGroup>, <Tabs>, <Tab>, và mọi tag khác trong bản gốc.

2. Giữ nguyên tuyệt đối tất cả attributes/props — không sửa title=, icon=, href=, id=, className=, src=, alt=, width=, height=, variant= hoặc bất kỳ prop nào.
   Chỉ được dịch phần text hiển thị cho người đọc.

3. Không tạo pseudo-tag hoặc chuỗi giống HTML/JSX không hợp lệ.
   Tuyệt đối tránh các dòng bắt đầu bằng < nếu không phải tag hợp lệ từ bản gốc.
   Ví dụ SAI: <1. Bước đầu tiên>, <Lưu ý: ...>

4. Không tự ý thêm/xóa ký tự cú pháp: <, >, {, }, ", ', =, / nếu chúng thuộc cú pháp Markdown/MDX/HTML/JSX.

5. Với code block, giữ nguyên tuyệt đối — không sửa code, command line, JSON, YAML, XML, API path, tên biến, function, class/method, package name, file path, URL, config key/value.

6. Với markdown structure, giữ nguyên — heading, bullet list, numbering, table, blockquote, mermaid, image, link, fenced code block.

7. Nếu phải chọn giữa câu văn mượt hơn và file parse/build an toàn, luôn ưu tiên file an toàn.

====================
B. QUY TẮC VIẾT LẠI NỘI DUNG
====================

1. Ưu tiên câu ngắn — mỗi câu ngắn, rõ, đi thẳng vào ý. Câu gốc dài thì chủ động tách thành 2-3 câu.

2. Dùng từ dễ hiểu, phổ thông — tránh lạm dụng tiếng lóng kỹ thuật hoặc cách nói quá "dev".

3. Hạn chế đại từ thừa — hạn chế tối đa "bạn", "của bạn", "chúng tôi", "nó".
   Ưu tiên cách viết gọn hơn. Ví dụ: "Mở dashboard để cấu hình" thay vì "Bạn có thể mở dashboard để cấu hình".

4. Ưu tiên "dịch theo ý đúng" — không bám sát từng chữ nếu làm câu bị cứng. Ưu tiên đúng ý, rõ nghĩa, tự nhiên trong tiếng Việt.

5. Được phép tách câu, đổi vị trí vế, chuyển paragraph dài thành bullet, thêm câu nối ngắn.
   Nhưng không được làm sai meaning, bỏ ý quan trọng, hoặc thêm thông tin không có trong bản gốc.

6. Giọng văn trung tính, rõ ràng — thân thiện, chuyên nghiệp, dễ tiếp cận.
   Không quá học thuật, không quá marketing, không quá khẩu ngữ.

====================
C. QUY TẮC THUẬT NGỮ
====================

Giữ nguyên tiếng Anh nếu đó là cách gọi quen thuộc:
Workspace, Session, Gateway, Dashboard, Node, Plugin, Channel, CLI, Web UI, Token, Provider, Routing, Remote access, Security, Troubleshooting, Self-hosted, Multi-agent, Media, Group, Mention, Sender.

Nếu dịch ra tiếng Việt giúp câu dễ hiểu hơn mà không bị gượng, có thể dịch.
Ví dụ: "Remote access" → "truy cập từ xa", "Getting Started" → "bắt đầu".

====================
D. TỰ KIỂM TRA TRƯỚC KHI TRẢ KẾT QUẢ
====================

Trước khi output, hãy tự kiểm tra:
1. Mọi tag mở đều có tag đóng tương ứng.
2. Không có component nào bị đổi tên.
3. Không có prop/attribute nào bị sửa cú pháp.
4. Không có dòng nào bắt đầu bằng < trừ khi đó là tag hợp lệ từ bản gốc.
5. Không có ký tự thừa làm vỡ MDX.
6. Mọi code block còn nguyên.
7. Cấu trúc file gốc vẫn giữ nguyên.
8. Nội dung tiếng Việt dễ hiểu với cả người không chuyên sâu kỹ thuật.

====================
E. ĐỊNH DẠNG ĐẦU RA
====================

- Chỉ trả về nội dung đã viết lại.
- Không giải thích. Không thêm ghi chú. Không thêm lời mở đầu/kết.
- Không bọc toàn bộ kết quả trong code fence trừ khi bản gốc có code fence.`;

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
      // Chỉ lấy file .md/.mdx gốc, bỏ qua file backup (.en.md/.en.mdx) và file dịch cũ (.vi.md/.vi.mdx)
      if ((filePath.endsWith('.md') || filePath.endsWith('.mdx')) &&
          !filePath.endsWith('.en.md') &&
          !filePath.endsWith('.en.mdx') &&
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
  // Backup file: file.md -> file.en.md
  const ext = file.match(/\.(md|mdx)$/)[1];
  const backupFile = file.replace(/\.(md|mdx)$/, `.en.${ext}`);
  const relPath = path.relative(targetDir, file);

  // 1. NGĂN DỊCH CHỒNG: Bỏ qua nếu backup .en.md đã tồn tại (đã xử lý rồi)
  if (fs.existsSync(backupFile)) {
    console.log(`[W${workerId}] ⏭️ Bỏ qua ${relPath} (đã có backup .en, có thể đã dịch)`);
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

  // 2. BACKUP bản gốc tiếng Anh trước khi dịch
  fs.copyFileSync(file, backupFile);
  console.log(`[W${workerId}] 💾 Đã backup: ${path.relative(targetDir, backupFile)}`);

  console.log(`[W${workerId}] ⏳ Đang dịch: ${relPath} ...`);
  try {
    let resultStr = await translate(content);

    // Xử lý dọn markdown code block nếu API trả về dư
    if (resultStr.startsWith("```markdown\n")) {
       resultStr = resultStr.substring(12, resultStr.length - 3);
    } else if (resultStr.startsWith("```\n")) {
       resultStr = resultStr.substring(4, resultStr.length - 3);
    }

    // Ghi bản dịch tiếng Việt đè lên file .md gốc
    fs.writeFileSync(file, resultStr.trim() + '\n', 'utf8');
    console.log(`[W${workerId}] ✅ Dịch xong: ${relPath}`);
    processed++;

    // Thêm delay nhẹ tránh spam API quá gắt
    await new Promise(r => setTimeout(r, 100));
  } catch (err) {
    console.error(`[W${workerId}] ❌ Lỗi ${relPath}: ${err.message}`);
    errors++;

    // Khôi phục file gốc nếu dịch thất bại
    fs.copyFileSync(backupFile, file);
    fs.unlinkSync(backupFile);
    console.warn(`[W${workerId}] ↩️ Đã khôi phục file gốc, xóa backup: ${path.relative(targetDir, backupFile)}`);

    if (err.message.includes("401") || err.message.includes("403") || err.message.includes("quota") || err.message.includes("rate") || err.message.includes("429")) {
       throw err; // Ném thẳng ra ngoài để dừng toàn bộ chương trình
    }
  }
}

async function main() {
  const allFiles = getFiles(targetDir);
  console.log(`\n🔍 Đã tìm thấy ${allFiles.length} file nguồn cần quét dịch đa luồng trong ${targetDir}\n`);

  // Xếp hàng đợi, giới hạn số file nếu có cài MAX_FILES
  const fileLimit = MAX_FILES > 0 ? MAX_FILES : allFiles.length;
  const queue = allFiles.slice(0, fileLimit);
  if (MAX_FILES > 0) console.log(`⚠️  Chế độ test: chỉ dịch ${fileLimit} file đầu tiên\n`);
  let fatalError = false;

  // Hàm worker
  async function worker(workerId) {
    while (queue.length > 0 && !fatalError) {
      const file = queue.shift();
      try {
        await processFile(file, workerId);
      } catch (err) {
        console.error(`\n🛑 Worker ${workerId} gặp lỗi ngắt hệ thống (Hết Quota / Sai API Key / Bị Rate Limit Cứng). Dừng khẩn cấp!`);
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

  console.log(`\n🎉 Tiến trình hoàn thành!`);
  console.log(`- Đã dịch thành công: ${processed}`);
  console.log(`- Đã bỏ qua: ${skipped}`);
  console.log(`- Lỗi: ${errors}\n`);
}

main().catch(err => {
  console.error("Lỗi unhandled crash:", err);
});

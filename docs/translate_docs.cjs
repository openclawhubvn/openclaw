const fs = require('fs');
const path = require('path');

// Determine which API Key is provided
const geminiKey = process.env.GEMINI_API_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

const apiKey = geminiKey || anthropicKey || openaiKey;

if (!apiKey) {
  console.error("\n❌ Lỗi: Bạn cần cung cấp biến môi trường GEMINI_API_KEY, ANTHROPIC_API_KEY, hoặc OPENAI_API_KEY.");
  console.error("Cách chạy trên Windows (PowerShell):");
  console.error('$env:OPENAI_API_KEY="sk-xxx"');
  console.error('node translate_docs.cjs\n');
  process.exit(1);
}

const docsDir = __dirname;
const viDir = path.join(docsDir, 'vi');

const SYSTEM_PROMPT = `Bạn là chuyên gia dịch và bản địa hóa tài liệu kỹ thuật từ tiếng Anh sang tiếng Việt.

Mục tiêu:
- Chuyển ngữ tài liệu sang tiếng Việt tự nhiên, dễ hiểu, dễ đọc với người dùng Việt Nam.
- Ưu tiên diễn đạt rõ ý, mạch lạc, dễ làm theo hơn là bám sát từng chữ tiếng Anh.
- Vẫn phải giữ đúng bản chất kỹ thuật, không được làm sai meaning.

Yêu cầu dịch:
1. Dịch theo văn phong tiếng Việt tự nhiên, rõ ràng, thân thiện, dễ hiểu.
2. Ưu tiên "dịch theo ý đúng" thay vì dịch quá sát chữ khiến câu bị cứng.
3. Với các câu dài hoặc khó hiểu trong tiếng Anh, hãy chủ động tách câu hoặc viết lại cho gọn và dễ nắm bắt hơn.
4. Giữ nguyên cấu trúc nội dung gốc nếu có thể: heading, bullet, numbering, table.
5. Giữ nguyên toàn bộ:
   - code block
   - command line
   - tên biến
   - API path
   - JSON/YAML/XML
   - class / method / function
   - tên sản phẩm / tên tính năng nếu là tên riêng
6. Không dịch máy móc các thuật ngữ kỹ thuật. Hãy chọn cách diễn đạt phổ biến và dễ hiểu với người đọc Việt Nam.
7. Với thuật ngữ khó, giữ nguyên tiếng Anh nếu cần hoặc dịch sang tiếng Việt dễ hiểu hơn và thêm từ gốc trong ngoặc đơn ở lần đầu.
8. Các cảnh báo, lưu ý, điều kiện quan trọng phải dịch thật rõ.
9. Không thêm thông tin mới không có trong bản gốc.
10. Không giải thích về cách dịch. Chỉ trả về bản dịch tiếng Việt hoàn chỉnh.

Quy ước ưu tiên:
- Ưu tiên "người Việt đọc hiểu ngay".
- Ở đâu cần, chuyển câu bị động sang chủ động hoặc đảo thứ tự câu.

Glossary:
- authentication = xác thực
- authorization = phân quyền
- deployment = triển khai
- configuration = cấu hình
- setup = thiết lập
- endpoint = endpoint / điểm cuối API
- request = yêu cầu
- response = phản hồi
- queue = hàng đợi
- retry = thử lại
- timeout = thời gian chờ
- fallback = phương án dự phòng
- webhook = webhook
- dashboard = bảng điều khiển
- permission = quyền truy cập
- environment = môi trường
- dependency = thành phần phụ thuộc`;

async function translate(content) {
  // Use Gemini if available
  if (geminiKey) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: content }] }],
        generationConfig: { temperature: 0.2 }
      })
    });
    if (!res.ok) throw new Error(`Gemini API Error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  }
  
  // Use Anthropic if available
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
        temperature: 0.2
      })
    });
    if (!res.ok) throw new Error(`Anthropic API Error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.content[0].text;
  }
  
  // Default to OpenAI
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
      temperature: 0.2
    })
  });
  if (!res.ok) throw new Error(`OpenAI API Error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

function getFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, fileList);
    } else if (filePath.endsWith('.md') || filePath.endsWith('.mdx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allFiles = getFiles(viDir);

async function main() {
  console.log(`\n🔍 Đã tìm thấy ${allFiles.length} file trong thư mục docs/vi`);
  let processed = 0, skipped = 0, errors = 0;

  for (const file of allFiles) {
    const relPath = path.relative(viDir, file);
    const enFile = path.join(docsDir, relPath); // Bản gốc tiếng Anh
    
    if (!fs.existsSync(enFile)) continue;
    
    let enContent = '', viContent = '';
    try {
      enContent = fs.readFileSync(enFile, 'utf8');
      viContent = fs.readFileSync(file, 'utf8');
    } catch (e) {
      continue;
    }

    // Nếu kích thước file quá lớn (rất khó xảy ra với markdown thông thường)
    if (enContent.length > 500000) {
      console.log(`⚠️ Bỏ qua ${relPath} (kích thước quá lớn)`);
      skipped++;
      continue;
    }

    // Nếu content thư mục `vi` đã khác so với bản `en`, có nghĩa là nó đã được dịch
    // So sánh chuỗi đã xóa khoảng trắng thừa do khác biệt LF/CRLF
    if (enContent.trim().length !== viContent.trim().length || enContent.trim() !== viContent.trim()) {
      console.log(`⏭️ Bỏ qua ${relPath} (đã được dịch hoặc chỉnh sửa)`);
      skipped++;
      continue;
    }

    console.log(`⏳ Đang dịch: ${relPath} ...`);
    try {
      let resultStr = await translate(viContent);
      
      // Xóa formatting markdown dư thừa nếu API vô tình trả ra khối code block bao bọc
      if (resultStr.startsWith("\`\`\`markdown\n")) {
         resultStr = resultStr.substring(12, resultStr.length - 3);
      } else if (resultStr.startsWith("\`\`\`\n")) {
         resultStr = resultStr.substring(4, resultStr.length - 3);
      }
      
      fs.writeFileSync(file, resultStr, 'utf8');
      console.log(`✅ Thành công.`);
      processed++;
      
      // Nghỉ 1 giây để tránh Rate Limit API
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`❌ Lỗi dịch ${relPath}: ${err.message}`);
      errors++;
      
      // Dừng cập nhật nếu gặp lỗi 401 Unauthorized / 403 Forbidden / 429 Rate Limit (Hết quota)
      const errStr = err.message.toLowerCase();
      if (errStr.includes("401") || errStr.includes("403") || errStr.includes("quota") || errStr.includes("credit")) {
         console.error("🛑 Dừng tiến trình vì lỗi cấu hình API Key hoặc hết Quota/Credit.");
         break;
      }
      
      // Nghỉ lâu hơn nếu gặp lỗi tạm thời
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  console.log(`\n🎉 Hoàn thành! Đã dịch: ${processed}, Bỏ qua: ${skipped}, Lỗi: ${errors}\n`);
}

main().catch(err => {
  console.error("Lỗi crash chưa bắt:", err);
});

---
summary: "Gửi tin nhắn WhatsApp đến nhiều agent"
read_when:
  - Cấu hình nhóm broadcast
  - Debug phản hồi đa agent trên WhatsApp
status: experimental
title: "Nhóm Broadcast"
---

# Nhóm Broadcast

**Trạng thái:** Thử nghiệm  
**Phiên bản:** Thêm vào 2026.1.9

## Tổng quan

Nhóm Broadcast cho phép nhiều agent xử lý và phản hồi cùng một tin nhắn đồng thời. Tạo các nhóm agent chuyên biệt làm việc cùng nhau trong một nhóm WhatsApp hoặc DM — tất cả dùng chung một số điện thoại.

Phạm vi hiện tại: **Chỉ WhatsApp** (kênh web).

Nhóm broadcast được đánh giá sau khi kiểm tra danh sách cho phép kênh và quy tắc kích hoạt nhóm. Trong nhóm WhatsApp, broadcast xảy ra khi OpenClaw thường phản hồi (ví dụ: khi được nhắc đến, tùy thuộc vào cài đặt nhóm).

## Trường hợp sử dụng

### 1. Nhóm Agent Chuyên Biệt

Triển khai nhiều agent với trách nhiệm cụ thể:

```
Nhóm: "Development Team"
Agents:
  - CodeReviewer (review code snippets)
  - DocumentationBot (tạo tài liệu)
  - SecurityAuditor (kiểm tra lỗ hổng)
  - TestGenerator (đề xuất test case)
```

Mỗi agent xử lý cùng một tin nhắn và cung cấp góc nhìn chuyên biệt.

### 2. Hỗ Trợ Đa Ngôn Ngữ

```
Nhóm: "International Support"
Agents:
  - Agent_EN (phản hồi bằng tiếng Anh)
  - Agent_DE (phản hồi bằng tiếng Đức)
  - Agent_ES (phản hồi bằng tiếng Tây Ban Nha)
```

### 3. Quy Trình Đảm Bảo Chất Lượng

```
Nhóm: "Customer Support"
Agents:
  - SupportAgent (cung cấp câu trả lời)
  - QAAgent (kiểm tra chất lượng, chỉ phản hồi nếu có vấn đề)
```

### 4. Tự Động Hóa Nhiệm Vụ

```
Nhóm: "Project Management"
Agents:
  - TaskTracker (cập nhật cơ sở dữ liệu nhiệm vụ)
  - TimeLogger (ghi lại thời gian)
  - ReportGenerator (tạo báo cáo)
```

## Cấu hình

### Thiết lập cơ bản

Thêm phần `broadcast` ở cấp cao nhất (bên cạnh `bindings`). Khóa là WhatsApp peer ids:

- nhóm chat: group JID (ví dụ: `120363403215116621@g.us`)
- DMs: số điện thoại E.164 (ví dụ: `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Kết quả:** Khi OpenClaw phản hồi trong chat này, tất cả ba agent sẽ chạy.

### Chiến lược xử lý

Kiểm soát cách agent xử lý tin nhắn:

#### Parallel (Mặc định)

Tất cả agent xử lý đồng thời:

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

#### Sequential

Agent xử lý theo thứ tự (một agent chờ agent trước hoàn thành):

```json
{
  "broadcast": {
    "strategy": "sequential",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

### Ví dụ hoàn chỉnh

```json
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "name": "Code Reviewer",
        "workspace": "/path/to/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "Security Auditor",
        "workspace": "/path/to/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "Documentation Generator",
        "workspace": "/path/to/docs-generator",
        "sandbox": { "mode": "all" }
      }
    ]
  },
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["code-reviewer", "security-auditor", "docs-generator"],
    "120363424282127706@g.us": ["support-en", "support-de"],
    "+15555550123": ["assistant", "logger"]
  }
}
```

## Cách hoạt động

### Luồng tin nhắn

1. **Tin nhắn đến** trong nhóm WhatsApp
2. **Kiểm tra broadcast**: Hệ thống kiểm tra nếu peer ID có trong `broadcast`
3. **Nếu có trong danh sách broadcast**:
   - Tất cả agent được liệt kê xử lý tin nhắn
   - Mỗi agent có khóa session riêng và ngữ cảnh tách biệt
   - Agent xử lý song song (mặc định) hoặc tuần tự
4. **Nếu không có trong danh sách broadcast**:
   - Áp dụng routing bình thường (binding đầu tiên khớp)

Lưu ý: nhóm broadcast không bỏ qua danh sách cho phép kênh hoặc quy tắc kích hoạt nhóm (mentions/commands/etc). Chúng chỉ thay đổi _agent nào chạy_ khi tin nhắn đủ điều kiện xử lý.

### Cách ly Session

Mỗi agent trong nhóm broadcast duy trì hoàn toàn tách biệt:

- **Khóa session** (`agent:alfred:whatsapp:group:120363...` vs `agent:baerbel:whatsapp:group:120363...`)
- **Lịch sử hội thoại** (agent không thấy tin nhắn của agent khác)
- **Workspace** (sandbox riêng nếu cấu hình)
- **Truy cập công cụ** (danh sách cho phép/chặn khác nhau)
- **Bộ nhớ/ngữ cảnh** (IDENTITY.md, SOUL.md, v.v.)
- **Bộ đệm ngữ cảnh nhóm** (tin nhắn nhóm gần đây dùng cho ngữ cảnh) được chia sẻ theo peer, nên tất cả agent broadcast thấy cùng ngữ cảnh khi kích hoạt

Điều này cho phép mỗi agent có:

- Tính cách khác nhau
- Truy cập công cụ khác nhau (ví dụ: chỉ đọc vs. đọc-ghi)
- Mô hình khác nhau (ví dụ: opus vs. sonnet)
- Kỹ năng cài đặt khác nhau

### Ví dụ: Session Cách Ly

Trong nhóm `120363403215116621@g.us` với agent `["alfred", "baerbel"]`:

**Ngữ cảnh của Alfred:**

```
Session: agent:alfred:whatsapp:group:120363403215116621@g.us
History: [tin nhắn người dùng, phản hồi trước của alfred]
Workspace: /Users/pascal/openclaw-alfred/
Tools: đọc, ghi, thực thi
```

**Ngữ cảnh của Bärbel:**

```
Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
History: [tin nhắn người dùng, phản hồi trước của baerbel]
Workspace: /Users/pascal/openclaw-baerbel/
Tools: chỉ đọc
```

## Thực hành tốt nhất

### 1. Giữ Agent Tập Trung

Thiết kế mỗi agent với một trách nhiệm rõ ràng:

```json
{
  "broadcast": {
    "DEV_GROUP": ["formatter", "linter", "tester"]
  }
}
```

✅ **Tốt:** Mỗi agent có một nhiệm vụ  
❌ **Xấu:** Một agent "dev-helper" chung chung

### 2. Sử Dụng Tên Mô Tả

Làm rõ mỗi agent làm gì:

```json
{
  "agents": {
    "security-scanner": { "name": "Security Scanner" },
    "code-formatter": { "name": "Code Formatter" },
    "test-generator": { "name": "Test Generator" }
  }
}
```

### 3. Cấu Hình Truy Cập Công Cụ Khác Nhau

Chỉ cung cấp cho agent công cụ cần thiết:

```json
{
  "agents": {
    "reviewer": {
      "tools": { "allow": ["read", "exec"] } // Chỉ đọc
    },
    "fixer": {
      "tools": { "allow": ["read", "write", "edit", "exec"] } // Đọc-ghi
    }
  }
}
```

### 4. Giám Sát Hiệu Suất

Với nhiều agent, cân nhắc:

- Sử dụng `"strategy": "parallel"` (mặc định) để tăng tốc
- Giới hạn nhóm broadcast từ 5-10 agent
- Sử dụng mô hình nhanh hơn cho agent đơn giản

### 5. Xử Lý Lỗi Linh Hoạt

Agent lỗi độc lập. Lỗi của một agent không chặn agent khác:

```
Tin nhắn → [Agent A ✓, Agent B ✗ lỗi, Agent C ✓]
Kết quả: Agent A và C phản hồi, Agent B ghi lỗi
```

## Tương thích

### Providers

Nhóm broadcast hiện hoạt động với:

- ✅ WhatsApp (đã triển khai)
- 🚧 Telegram (dự kiến)
- 🚧 Discord (dự kiến)
- 🚧 Slack (dự kiến)

### Routing

Nhóm broadcast hoạt động song song với routing hiện có:

```json
{
  "bindings": [
    {
      "match": { "channel": "whatsapp", "peer": { "kind": "group", "id": "GROUP_A" } },
      "agentId": "alfred"
    }
  ],
  "broadcast": {
    "GROUP_B": ["agent1", "agent2"]
  }
}
```

- `GROUP_A`: Chỉ alfred phản hồi (routing bình thường)
- `GROUP_B`: agent1 VÀ agent2 phản hồi (broadcast)

**Ưu tiên:** `broadcast` ưu tiên hơn `bindings`.

## Khắc phục sự cố

### Agent Không Phản Hồi

**Kiểm tra:**

1. ID agent tồn tại trong `agents.list`
2. Định dạng Peer ID đúng (ví dụ: `120363403215116621@g.us`)
3. Agent không nằm trong danh sách chặn

**Debug:**

```bash
tail -f ~/.openclaw/logs/gateway.log | grep broadcast
```

### Chỉ Một Agent Phản Hồi

**Nguyên nhân:** Peer ID có thể nằm trong `bindings` nhưng không trong `broadcast`.

**Khắc phục:** Thêm vào cấu hình broadcast hoặc xóa khỏi bindings.

### Vấn Đề Hiệu Suất

**Nếu chậm với nhiều agent:**

- Giảm số lượng agent mỗi nhóm
- Sử dụng mô hình nhẹ hơn (sonnet thay vì opus)
- Kiểm tra thời gian khởi động sandbox

## Ví dụ

### Ví dụ 1: Nhóm Code Review

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": [
      "code-formatter",
      "security-scanner",
      "test-coverage",
      "docs-checker"
    ]
  },
  "agents": {
    "list": [
      {
        "id": "code-formatter",
        "workspace": "~/agents/formatter",
        "tools": { "allow": ["read", "write"] }
      },
      {
        "id": "security-scanner",
        "workspace": "~/agents/security",
        "tools": { "allow": ["read", "exec"] }
      },
      {
        "id": "test-coverage",
        "workspace": "~/agents/testing",
        "tools": { "allow": ["read", "exec"] }
      },
      { "id": "docs-checker", "workspace": "~/agents/docs", "tools": { "allow": ["read"] } }
    ]
  }
}
```

**Người dùng gửi:** Đoạn mã  
**Phản hồi:**

- code-formatter: "Đã sửa lỗi thụt lề và thêm gợi ý kiểu"
- security-scanner: "⚠️ Lỗ hổng SQL injection ở dòng 12"
- test-coverage: "Độ phủ là 45%, thiếu test cho trường hợp lỗi"
- docs-checker: "Thiếu docstring cho hàm `process_data`"

### Ví dụ 2: Hỗ Trợ Đa Ngôn Ngữ

```json
{
  "broadcast": {
    "strategy": "sequential",
    "+15555550123": ["detect-language", "translator-en", "translator-de"]
  },
  "agents": {
    "list": [
      { "id": "detect-language", "workspace": "~/agents/lang-detect" },
      { "id": "translator-en", "workspace": "~/agents/translate-en" },
      { "id": "translator-de", "workspace": "~/agents/translate-de" }
    ]
  }
}
```

## Tham chiếu API

### Cấu trúc Config

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### Trường

- `strategy` (tùy chọn): Cách xử lý agent
  - `"parallel"` (mặc định): Tất cả agent xử lý đồng thời
  - `"sequential"`: Agent xử lý theo thứ tự mảng
- `[peerId]`: WhatsApp group JID, số E.164, hoặc peer ID khác
  - Giá trị: Mảng ID agent cần xử lý tin nhắn

## Giới hạn

1. **Số lượng agent tối đa:** Không giới hạn cứng, nhưng 10+ agent có thể chậm
2. **Ngữ cảnh chia sẻ:** Agent không thấy phản hồi của nhau (theo thiết kế)
3. **Thứ tự tin nhắn:** Phản hồi song song có thể đến theo bất kỳ thứ tự nào
4. **Giới hạn tốc độ:** Tất cả agent tính vào giới hạn tốc độ của WhatsApp

## Nâng cấp trong tương lai

Tính năng dự kiến:

- [ ] Chế độ ngữ cảnh chia sẻ (agent thấy phản hồi của nhau)
- [ ] Phối hợp agent (agent có thể báo hiệu cho nhau)
- [ ] Lựa chọn agent động (chọn agent dựa trên nội dung tin nhắn)
- [ ] Ưu tiên agent (một số agent phản hồi trước)

## Xem thêm

- [Cấu hình Multi-Agent](/tools/multi-agent-sandbox-tools)
- [Cấu hình Routing](/channels/channel-routing)
- [Quản lý Session](/concepts/session)\n
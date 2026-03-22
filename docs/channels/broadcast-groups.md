---
summary: "Tìm hiểu cách tạo và cấu hình nhóm phát sóng WhatsApp để gửi tin nhắn đến nhiều agent một cách hiệu quả."
read_when:
  - Cấu hình nhóm phát sóng
  - Khắc phục sự cố phản hồi đa agent trên WhatsApp
status: experimental
title: "Hướng Dẫn Tạo Nhóm Phát Sóng WhatsApp"
---

# Nhóm Phát Sóng

**Trạng thái:** Thử nghiệm  
**Phiên bản:** Thêm vào 2026.1.9

## Tổng Quan

Nhóm Phát Sóng cho phép nhiều agent xử lý và phản hồi cùng một tin nhắn đồng thời. Điều này giúp tạo ra các nhóm agent chuyên biệt làm việc cùng nhau trong một nhóm WhatsApp hoặc tin nhắn trực tiếp — tất cả sử dụng một số điện thoại duy nhất.

Phạm vi hiện tại: **Chỉ WhatsApp** (kênh web).

Nhóm phát sóng được đánh giá sau khi danh sách cho phép kênh và quy tắc kích hoạt nhóm được áp dụng. Trong các nhóm WhatsApp, điều này có nghĩa là phát sóng xảy ra khi OpenClaw thường trả lời (ví dụ: khi được nhắc đến, tùy thuộc vào cài đặt nhóm của bạn).

## Trường Hợp Sử Dụng

### 1. Nhóm Agent Chuyên Biệt

Triển khai nhiều agent với trách nhiệm cụ thể, tập trung:

```
Nhóm: "Nhóm Phát Triển"
Agents:
  - CodeReviewer (kiểm tra đoạn mã)
  - DocumentationBot (tạo tài liệu)
  - SecurityAuditor (kiểm tra lỗ hổng bảo mật)
  - TestGenerator (đề xuất trường hợp kiểm thử)
```

Mỗi agent xử lý cùng một tin nhắn và cung cấp góc nhìn chuyên môn của mình.

### 2. Hỗ Trợ Đa Ngôn Ngữ

```
Nhóm: "Hỗ Trợ Quốc Tế"
Agents:
  - Agent_EN (phản hồi bằng tiếng Anh)
  - Agent_DE (phản hồi bằng tiếng Đức)
  - Agent_ES (phản hồi bằng tiếng Tây Ban Nha)
```

### 3. Quy Trình Đảm Bảo Chất Lượng

```
Nhóm: "Hỗ Trợ Khách Hàng"
Agents:
  - SupportAgent (cung cấp câu trả lời)
  - QAAgent (kiểm tra chất lượng, chỉ phản hồi nếu phát hiện vấn đề)
```

### 4. Tự Động Hóa Nhiệm Vụ

```
Nhóm: "Quản Lý Dự Án"
Agents:
  - TaskTracker (cập nhật cơ sở dữ liệu nhiệm vụ)
  - TimeLogger (ghi lại thời gian sử dụng)
  - ReportGenerator (tạo báo cáo tóm tắt)
```

## Cấu Hình

### Thiết Lập Cơ Bản

Thêm một phần `broadcast` ở cấp cao nhất (bên cạnh `bindings`). Các khóa là ID peer WhatsApp:

- nhóm chat: JID nhóm (ví dụ: `120363403215116621@g.us`)
- tin nhắn trực tiếp: số điện thoại E.164 (ví dụ: `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Kết quả:** Khi OpenClaw sẽ trả lời trong cuộc trò chuyện này, nó sẽ chạy cả ba agent.

### Chiến Lược Xử Lý

Kiểm soát cách các agent xử lý tin nhắn:

#### Song Song (Mặc Định)

Tất cả các agent xử lý đồng thời:

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

#### Tuần Tự

Các agent xử lý theo thứ tự (một agent chờ agent trước hoàn thành):

```json
{
  "broadcast": {
    "strategy": "sequential",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

### Ví Dụ Hoàn Chỉnh

```json
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "name": "Người Kiểm Tra Mã",
        "workspace": "/path/to/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "Kiểm Toán Bảo Mật",
        "workspace": "/path/to/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "Trình Tạo Tài Liệu",
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

## Cách Hoạt Động

### Luồng Tin Nhắn

1. **Tin nhắn đến** trong một nhóm WhatsApp
2. **Kiểm tra phát sóng**: Hệ thống kiểm tra xem ID peer có trong `broadcast` không
3. **Nếu có trong danh sách phát sóng**:
   - Tất cả các agent được liệt kê xử lý tin nhắn
   - Mỗi agent có khóa phiên riêng và ngữ cảnh cách ly
   - Các agent xử lý song song (mặc định) hoặc tuần tự
4. **Nếu không có trong danh sách phát sóng**:
   - Áp dụng định tuyến thông thường (ràng buộc đầu tiên phù hợp)

Lưu ý: nhóm phát sóng không bỏ qua danh sách cho phép kênh hoặc quy tắc kích hoạt nhóm (nhắc đến/lệnh/etc). Chúng chỉ thay đổi _những agent nào chạy_ khi một tin nhắn đủ điều kiện để xử lý.

### Cách Ly Phiên

Mỗi agent trong một nhóm phát sóng duy trì hoàn toàn riêng biệt:

- **Khóa phiên** (`agent:alfred:whatsapp:group:120363...` so với `agent:baerbel:whatsapp:group:120363...`)
- **Lịch sử hội thoại** (agent không thấy tin nhắn của các agent khác)
- **Workspace** (các sandbox riêng biệt nếu được cấu hình)
- **Truy cập công cụ** (danh sách cho phép/chặn khác nhau)
- **Bộ nhớ/ngữ cảnh** (IDENTITY.md, SOUL.md, v.v. riêng biệt)
- **Bộ đệm ngữ cảnh nhóm** (tin nhắn nhóm gần đây được sử dụng cho ngữ cảnh) được chia sẻ cho mỗi peer, vì vậy tất cả các agent phát sóng thấy cùng một ngữ cảnh khi được kích hoạt

Điều này cho phép mỗi agent có:

- Tính cách khác nhau
- Truy cập công cụ khác nhau (ví dụ: chỉ đọc so với đọc-ghi)
- Mô hình khác nhau (ví dụ: opus so với sonnet)
- Kỹ năng cài đặt khác nhau

### Ví Dụ: Phiên Cách Ly

Trong nhóm `120363403215116621@g.us` với các agent `["alfred", "baerbel"]`:

**Ngữ cảnh của Alfred:**

```
Phiên: agent:alfred:whatsapp:group:120363403215116621@g.us
Lịch sử: [tin nhắn người dùng, phản hồi trước của alfred]
Workspace: /Users/pascal/openclaw-alfred/
Công cụ: đọc, ghi, thực thi
```

**Ngữ cảnh của Bärbel:**

```
Phiên: agent:baerbel:whatsapp:group:120363403215116621@g.us
Lịch sử: [tin nhắn người dùng, phản hồi trước của baerbel]
Workspace: /Users/pascal/openclaw-baerbel/
Công cụ: chỉ đọc
```

## Thực Hành Tốt Nhất

### 1. Giữ Cho Agent Tập Trung

Thiết kế mỗi agent với một trách nhiệm rõ ràng, duy nhất:

```json
{
  "broadcast": {
    "DEV_GROUP": ["formatter", "linter", "tester"]
  }
}
```

✅ **Tốt:** Mỗi agent có một công việc  
❌ **Xấu:** Một agent "dev-helper" chung chung

### 2. Sử Dụng Tên Mô Tả

Làm rõ mỗi agent thực hiện công việc gì:

```json
{
  "agents": {
    "security-scanner": { "name": "Máy Quét Bảo Mật" },
    "code-formatter": { "name": "Trình Định Dạng Mã" },
    "test-generator": { "name": "Trình Tạo Kiểm Thử" }
  }
}
```

### 3. Cấu Hình Truy Cập Công Cụ Khác Nhau

Chỉ cung cấp cho agent các công cụ cần thiết:

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

Với nhiều agent, hãy cân nhắc:

- Sử dụng `"strategy": "parallel"` (mặc định) để tăng tốc độ
- Giới hạn nhóm phát sóng từ 5-10 agent
- Sử dụng mô hình nhanh hơn cho các agent đơn giản

### 5. Xử Lý Lỗi Một Cách Linh Hoạt

Các agent thất bại độc lập. Lỗi của một agent không chặn các agent khác:

```
Tin nhắn → [Agent A ✓, Agent B ✗ lỗi, Agent C ✓]
Kết quả: Agent A và C phản hồi, Agent B ghi lại lỗi
```

## Tương Thích

### Nhà Cung Cấp

Nhóm phát sóng hiện hoạt động với:

- ✅ WhatsApp (đã triển khai)
- 🚧 Telegram (dự kiến)
- 🚧 Discord (dự kiến)
- 🚧 Slack (dự kiến)

### Định Tuyến

Nhóm phát sóng hoạt động song song với định tuyến hiện có:

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

- `GROUP_A`: Chỉ alfred phản hồi (định tuyến thông thường)
- `GROUP_B`: agent1 VÀ agent2 phản hồi (phát sóng)

**Ưu tiên:** `broadcast` có ưu tiên hơn `bindings`.

## Khắc Phục Sự Cố

### Agent Không Phản Hồi

**Kiểm tra:**

1. ID agent tồn tại trong `agents.list`
2. Định dạng ID peer đúng (ví dụ: `120363403215116621@g.us`)
3. Agent không nằm trong danh sách chặn

**Gỡ lỗi:**

```bash
tail -f ~/.openclaw/logs/gateway.log | grep broadcast
```

### Chỉ Một Agent Phản Hồi

**Nguyên nhân:** ID peer có thể nằm trong `bindings` nhưng không trong `broadcast`.

**Khắc phục:** Thêm vào cấu hình phát sóng hoặc xóa khỏi bindings.

### Vấn Đề Hiệu Suất

**Nếu chậm với nhiều agent:**

- Giảm số lượng agent mỗi nhóm
- Sử dụng mô hình nhẹ hơn (sonnet thay vì opus)
- Kiểm tra thời gian khởi động sandbox

## Ví Dụ

### Ví Dụ 1: Nhóm Kiểm Tra Mã

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
- test-coverage: "Độ phủ là 45%, thiếu kiểm thử cho các trường hợp lỗi"
- docs-checker: "Thiếu docstring cho hàm `process_data`"

### Ví Dụ 2: Hỗ Trợ Đa Ngôn Ngữ

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

## Tham Khảo API

### Cấu Trúc Cấu Hình

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### Các Trường

- `strategy` (tùy chọn): Cách xử lý agent
  - `"parallel"` (mặc định): Tất cả các agent xử lý đồng thời
  - `"sequential"`: Các agent xử lý theo thứ tự trong mảng
- `[peerId]`: JID nhóm WhatsApp, số E.164, hoặc ID peer khác
  - Giá trị: Mảng ID agent nên xử lý tin nhắn

## Giới Hạn

1. **Số lượng agent tối đa:** Không có giới hạn cứng, nhưng 10+ agent có thể chậm
2. **Ngữ cảnh chia sẻ:** Các agent không thấy phản hồi của nhau (theo thiết kế)
3. **Thứ tự tin nhắn:** Phản hồi song song có thể đến theo bất kỳ thứ tự nào
4. **Giới hạn tốc độ:** Tất cả các agent đều tính vào giới hạn tốc độ của WhatsApp

## Cải Tiến Tương Lai

Các tính năng dự kiến:

- [ ] Chế độ ngữ cảnh chia sẻ (các agent thấy phản hồi của nhau)
- [ ] Phối hợp agent (các agent có thể báo hiệu cho nhau)
- [ ] Lựa chọn agent động (chọn agent dựa trên nội dung tin nhắn)
- [ ] Ưu tiên agent (một số agent phản hồi trước các agent khác)

## Xem Thêm

- [Cấu Hình Đa Agent](/tools/multi-agent-sandbox-tools)
- [Cấu Hình Định Tuyến](/channels/channel-routing)
- [Quản Lý Phiên](/concepts/session)

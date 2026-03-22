---
summary: "Cách xử lý tin nhắn nhóm WhatsApp (mentionPatterns dùng chung cho nhiều nền tảng)"
read_when:
  - Thay đổi quy tắc tin nhắn nhóm hoặc mentions
title: "Tin nhắn nhóm"
---

# Tin nhắn nhóm (kênh WhatsApp web)

Mục tiêu: để Clawd tham gia nhóm WhatsApp, chỉ thức dậy khi được ping, và giữ luồng đó tách biệt khỏi session DM cá nhân.

Lưu ý: `agents.list[].groupChat.mentionPatterns` hiện dùng cho Telegram/Discord/Slack/iMessage; tài liệu này tập trung vào hành vi cụ thể của WhatsApp. Với cấu hình multi-agent, đặt `agents.list[].groupChat.mentionPatterns` cho từng agent (hoặc dùng `messages.groupChat.mentionPatterns` làm mặc định toàn cục).

## Triển khai hiện tại (2025-12-03)

- Chế độ kích hoạt: `mention` (mặc định) hoặc `always`. `mention` yêu cầu ping (mention thực qua `mentionedJids`, regex an toàn, hoặc số E.164 của bot trong text). `always` đánh thức agent với mọi tin nhắn nhưng chỉ trả lời khi có giá trị; nếu không, trả về token `NO_REPLY`. Mặc định có thể đặt trong config (`channels.whatsapp.groups`) và ghi đè theo nhóm qua `/activation`. Khi `channels.whatsapp.groups` được đặt, nó cũng hoạt động như danh sách cho phép nhóm (bao gồm `"*"` để cho phép tất cả).
- Chính sách nhóm: `channels.whatsapp.groupPolicy` kiểm soát việc chấp nhận tin nhắn nhóm (`open|disabled|allowlist`). `allowlist` dùng `channels.whatsapp.groupAllowFrom` (mặc định: `channels.whatsapp.allowFrom`). Mặc định là `allowlist` (bị chặn cho đến khi thêm người gửi).
- Session theo nhóm: khóa session có dạng `agent:<agentId>:whatsapp:group:<jid>` nên các lệnh như `/verbose on` hoặc `/think high` (gửi như tin nhắn độc lập) chỉ áp dụng cho nhóm đó; trạng thái DM cá nhân không bị ảnh hưởng. Bỏ qua heartbeats cho luồng nhóm.
- Chèn ngữ cảnh: tin nhắn nhóm **chỉ chờ** (mặc định 50) không kích hoạt chạy được thêm vào dưới `[Chat messages since your last reply - for context]`, với dòng kích hoạt dưới `[Current message - respond to this]`. Tin nhắn đã có trong session không được chèn lại.
- Hiển thị người gửi: mỗi batch nhóm kết thúc với `[from: Sender Name (+E164)]` để Pi biết ai đang nói.
- Tin nhắn tạm thời/xem một lần: mở gói trước khi trích xuất text/mentions, nên ping bên trong vẫn kích hoạt.
- Prompt hệ thống nhóm: lần đầu của session nhóm (và khi `/activation` thay đổi chế độ) chèn một đoạn ngắn vào prompt hệ thống như `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` Nếu không có metadata, vẫn thông báo agent là chat nhóm.

## Ví dụ cấu hình (WhatsApp)

Thêm block `groupChat` vào `~/.openclaw/openclaw.json` để ping tên hiển thị hoạt động ngay cả khi WhatsApp loại bỏ `@` trong text:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

Ghi chú:

- Regex không phân biệt chữ hoa/thường và dùng cùng guardrails regex an toàn như các bề mặt config khác; mẫu không hợp lệ và lặp lồng không an toàn bị bỏ qua.
- WhatsApp vẫn gửi mentions chuẩn qua `mentionedJids` khi ai đó nhấn vào contact, nên fallback số hiếm khi cần nhưng là lưới an toàn hữu ích.

### Lệnh kích hoạt (chỉ chủ sở hữu)

Dùng lệnh chat nhóm:

- `/activation mention`
- `/activation always`

Chỉ số chủ sở hữu (từ `channels.whatsapp.allowFrom`, hoặc số E.164 của bot khi chưa đặt) có thể thay đổi điều này. Gửi `/status` như tin nhắn độc lập trong nhóm để xem chế độ kích hoạt hiện tại.

## Cách sử dụng

1. Thêm tài khoản WhatsApp (chạy OpenClaw) vào nhóm.
2. Nói `@openclaw …` (hoặc bao gồm số). Chỉ người gửi trong danh sách cho phép mới kích hoạt trừ khi đặt `groupPolicy: "open"`.
3. Prompt agent sẽ bao gồm ngữ cảnh nhóm gần đây cùng marker `[from: …]` để có thể gửi đúng người.
4. Chỉ thị cấp session (`/verbose on`, `/think high`, `/new` hoặc `/reset`, `/compact`) chỉ áp dụng cho session nhóm đó; gửi như tin nhắn độc lập để ghi nhận. Session DM cá nhân vẫn độc lập.

## Kiểm tra / xác minh

- Kiểm tra thủ công:
  - Gửi ping `@openclaw` trong nhóm và xác nhận có phản hồi tham chiếu tên người gửi.
  - Gửi ping thứ hai và xác minh block lịch sử được bao gồm rồi xóa ở lượt tiếp theo.
- Kiểm tra log gateway (chạy với `--verbose`) để thấy các mục `inbound web message` hiển thị `from: <groupJid>` và hậu tố `[from: …]`.

## Lưu ý đã biết

- Bỏ qua heartbeats cho nhóm để tránh phát sóng ồn ào.
- Ức chế echo dùng chuỗi batch kết hợp; nếu gửi text giống nhau hai lần không có mentions, chỉ lần đầu nhận phản hồi.
- Mục lưu trữ session sẽ xuất hiện dưới dạng `agent:<agentId>:whatsapp:group:<jid>` trong lưu trữ session (`~/.openclaw/agents/<agentId>/sessions/sessions.json` mặc định); mục bị thiếu chỉ có nghĩa là nhóm chưa kích hoạt chạy.\n
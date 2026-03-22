---
summary: "Tìm hiểu cách xử lý và cấu hình tin nhắn nhóm WhatsApp hiệu quả, tối ưu hóa giao tiếp nhóm trên nhiều nền tảng."
read_when:
  - Thay đổi quy tắc tin nhắn nhóm hoặc đề cập
title: "Hướng Dẫn Cấu Hình Tin Nhắn Nhóm WhatsApp"
---

# Tin nhắn nhóm (kênh WhatsApp web)

Mục tiêu: để Clawd tham gia vào các nhóm WhatsApp, chỉ thức dậy khi được nhắc đến, và giữ luồng đó tách biệt khỏi phiên DM cá nhân.

Lưu ý: `agents.list[].groupChat.mentionPatterns` hiện cũng được sử dụng bởi Telegram/Discord/Slack/iMessage; tài liệu này tập trung vào hành vi cụ thể của WhatsApp. Đối với các thiết lập nhiều agent, hãy đặt `agents.list[].groupChat.mentionPatterns` cho từng agent (hoặc sử dụng `messages.groupChat.mentionPatterns` như một phương án dự phòng toàn cầu).

## Triển khai hiện tại (2025-12-03)

- Chế độ kích hoạt: `mention` (mặc định) hoặc `always`. `mention` yêu cầu một ping (đề cập thực sự trên WhatsApp qua `mentionedJids`, mẫu regex an toàn, hoặc số E.164 của bot ở bất kỳ đâu trong văn bản). `always` đánh thức agent trên mọi tin nhắn nhưng chỉ nên trả lời khi có thể thêm giá trị ý nghĩa; nếu không, nó trả về token im lặng `NO_REPLY`. Mặc định có thể được đặt trong cấu hình (`channels.whatsapp.groups`) và ghi đè cho từng nhóm qua `/activation`. Khi `channels.whatsapp.groups` được đặt, nó cũng hoạt động như một danh sách cho phép nhóm (bao gồm `"*"` để cho phép tất cả).
- Chính sách nhóm: `channels.whatsapp.groupPolicy` kiểm soát liệu tin nhắn nhóm có được chấp nhận hay không (`open|disabled|allowlist`). `allowlist` sử dụng `channels.whatsapp.groupAllowFrom` (dự phòng: `channels.whatsapp.allowFrom` rõ ràng). Mặc định là `allowlist` (bị chặn cho đến khi bạn thêm người gửi).
- Phiên theo nhóm: khóa phiên có dạng `agent:<agentId>:whatsapp:group:<jid>` nên các lệnh như `/verbose on` hoặc `/think high` (gửi dưới dạng tin nhắn độc lập) được áp dụng cho nhóm đó; trạng thái DM cá nhân không bị ảnh hưởng. Heartbeats bị bỏ qua cho các luồng nhóm.
- Tiêm ngữ cảnh: tin nhắn nhóm **chỉ chờ xử lý** (mặc định 50) mà _không_ kích hoạt một lần chạy được thêm vào dưới `[Chat messages since your last reply - for context]`, với dòng kích hoạt dưới `[Current message - respond to this]`. Các tin nhắn đã có trong phiên không được thêm lại.
- Hiển thị người gửi: mỗi lô nhóm hiện kết thúc với `[from: Tên Người Gửi (+E164)]` để Pi biết ai đang nói.
- Tin nhắn tạm thời/xem một lần: chúng tôi mở chúng trước khi trích xuất văn bản/đề cập, vì vậy các ping bên trong vẫn kích hoạt.
- Lời nhắc hệ thống nhóm: trong lượt đầu tiên của phiên nhóm (và bất cứ khi nào `/activation` thay đổi chế độ) chúng tôi thêm một đoạn ngắn vào lời nhắc hệ thống như `Bạn đang trả lời trong nhóm WhatsApp "<subject>". Thành viên nhóm: Alice (+44...), Bob (+43...), … Kích hoạt: chỉ khi được nhắc đến … Địa chỉ người gửi cụ thể được ghi chú trong ngữ cảnh tin nhắn.` Nếu không có sẵn metadata, chúng tôi vẫn thông báo cho agent rằng đây là một cuộc trò chuyện nhóm.

## Ví dụ cấu hình (WhatsApp)

Thêm một khối `groupChat` vào `~/.openclaw/openclaw.json` để các ping tên hiển thị hoạt động ngay cả khi WhatsApp loại bỏ `@` trong nội dung văn bản:

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

- Các regex không phân biệt chữ hoa chữ thường và sử dụng cùng các biện pháp bảo vệ regex an toàn như các bề mặt cấu hình khác; các mẫu không hợp lệ và lặp lại không an toàn bị bỏ qua.
- WhatsApp vẫn gửi các đề cập chính thức qua `mentionedJids` khi ai đó nhấn vào liên hệ, vì vậy số dự phòng hiếm khi cần thiết nhưng là một biện pháp an toàn hữu ích.

### Lệnh kích hoạt (chỉ dành cho chủ sở hữu)

Sử dụng lệnh trò chuyện nhóm:

- `/activation mention`
- `/activation always`

Chỉ số của chủ sở hữu (từ `channels.whatsapp.allowFrom`, hoặc số E.164 của bot khi không được đặt) có thể thay đổi điều này. Gửi `/status` dưới dạng tin nhắn độc lập trong nhóm để xem chế độ kích hoạt hiện tại.

## Cách sử dụng

1. Thêm tài khoản WhatsApp của bạn (tài khoản đang chạy OpenClaw) vào nhóm.
2. Nói `@openclaw …` (hoặc bao gồm số). Chỉ những người gửi trong danh sách cho phép mới có thể kích hoạt trừ khi bạn đặt `groupPolicy: "open"`.
3. Lời nhắc agent sẽ bao gồm ngữ cảnh nhóm gần đây cùng với dấu `[from: …]` để có thể gửi đúng người.
4. Các chỉ thị cấp phiên (`/verbose on`, `/think high`, `/new` hoặc `/reset`, `/compact`) chỉ áp dụng cho phiên của nhóm đó; gửi chúng dưới dạng tin nhắn độc lập để chúng được ghi nhận. Phiên DM cá nhân của bạn vẫn độc lập.

## Kiểm tra / xác minh

- Kiểm tra thủ công:
  - Gửi một ping `@openclaw` trong nhóm và xác nhận một phản hồi tham chiếu tên người gửi.
  - Gửi một ping thứ hai và xác minh khối lịch sử được bao gồm sau đó xóa trên lượt tiếp theo.
- Kiểm tra nhật ký gateway (chạy với `--verbose`) để xem các mục `inbound web message` hiển thị `from: <groupJid>` và hậu tố `[from: …]`.

## Các lưu ý đã biết

- Heartbeats cố ý bị bỏ qua cho các nhóm để tránh phát sóng ồn ào.
- Ức chế tiếng vọng sử dụng chuỗi lô kết hợp; nếu bạn gửi văn bản giống hệt hai lần mà không có đề cập, chỉ lần đầu tiên sẽ nhận được phản hồi.
- Các mục lưu trữ phiên sẽ xuất hiện dưới dạng `agent:<agentId>:whatsapp:group:<jid>` trong lưu trữ phiên (`~/.openclaw/agents/<agentId>/sessions/sessions.json` theo mặc định); một mục bị thiếu chỉ có nghĩa là nhóm chưa kích hoạt một lần chạy nào.

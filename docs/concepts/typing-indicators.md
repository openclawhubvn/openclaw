---
summary: "Tìm hiểu cách hiển thị và điều chỉnh chỉ báo đang gõ trong OpenClaw để cải thiện trải nghiệm người dùng."
read_when:
  - Thay đổi hành vi hoặc mặc định của chỉ báo đang gõ
title: "Hướng Dẫn Cấu Hình Chỉ Báo Đang Gõ OpenClaw"
---

# Chỉ báo đang gõ

Chỉ báo đang gõ được gửi đến kênh chat khi một phiên chạy đang hoạt động. Sử dụng `agents.defaults.typingMode` để kiểm soát **khi nào** bắt đầu gõ và `typingIntervalSeconds` để kiểm soát **tần suất** làm mới.

## Mặc định

Khi `agents.defaults.typingMode` **không được đặt**, OpenClaw giữ hành vi cũ:

- **Chat trực tiếp**: bắt đầu gõ ngay khi vòng lặp mô hình bắt đầu.
- **Chat nhóm có nhắc đến**: bắt đầu gõ ngay lập tức.
- **Chat nhóm không có nhắc đến**: chỉ bắt đầu gõ khi văn bản tin nhắn bắt đầu truyền.
- **Chạy nhịp tim**: gõ bị vô hiệu hóa.

## Các chế độ

Đặt `agents.defaults.typingMode` thành một trong các giá trị sau:

- `never` — không bao giờ có chỉ báo đang gõ.
- `instant` — bắt đầu gõ **ngay khi vòng lặp mô hình bắt đầu**, ngay cả khi phiên chạy sau đó chỉ trả về token trả lời im lặng.
- `thinking` — bắt đầu gõ khi có **delta suy luận đầu tiên** (yêu cầu `reasoningLevel: "stream"` cho phiên chạy).
- `message` — bắt đầu gõ khi có **delta văn bản không im lặng đầu tiên** (bỏ qua token im lặng `NO_REPLY`).

Thứ tự “bắt đầu sớm nhất”:
`never` → `message` → `thinking` → `instant`

## Cấu hình

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6,
  },
}
```

Bạn có thể ghi đè chế độ hoặc tần suất cho mỗi phiên:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Lưu ý

- Chế độ `message` sẽ không hiển thị gõ cho các phản hồi chỉ im lặng (ví dụ: token `NO_REPLY` được sử dụng để ngăn chặn đầu ra).
- `thinking` chỉ kích hoạt nếu phiên chạy truyền suy luận (`reasoningLevel: "stream"`). Nếu mô hình không phát ra delta suy luận, gõ sẽ không bắt đầu.
- Nhịp tim không bao giờ hiển thị gõ, bất kể chế độ nào.
- `typingIntervalSeconds` kiểm soát **tần suất làm mới**, không phải thời gian bắt đầu. Mặc định là 6 giây.

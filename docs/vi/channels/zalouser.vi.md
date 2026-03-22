---
summary: "Hỗ trợ tài khoản cá nhân Zalo qua `zca-js` (đăng nhập QR), khả năng và cấu hình"
read_when:
  - Cài đặt Zalo Personal cho OpenClaw
  - Debug đăng nhập hoặc luồng tin nhắn Zalo Personal
title: "Zalo Personal"
---

# Zalo Personal (không chính thức)

Trạng thái: thử nghiệm. Tích hợp này tự động hóa **tài khoản cá nhân Zalo** qua `zca-js` trong OpenClaw.

> **Cảnh báo:** Đây là tích hợp không chính thức và có thể dẫn đến khóa tài khoản. Sử dụng tự chịu rủi ro.

## Cần Plugin

Zalo Personal là plugin, không đi kèm cài đặt gốc.

- Cài qua CLI: `openclaw plugins install @openclaw/zalouser`
- Hoặc từ source: `openclaw plugins install ./extensions/zalouser`
- Chi tiết: [Plugins](/tools/plugin)

Không cần binary `zca`/`openzca` bên ngoài.

## Cài đặt nhanh (cho người mới)

1. Cài plugin (xem trên).
2. Đăng nhập (QR, trên máy Gateway):
   - `openclaw channels login --channel zalouser`
   - Quét mã QR bằng app Zalo trên điện thoại.
3. Kích hoạt channel:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. Khởi động lại Gateway (hoặc hoàn tất cài đặt).
5. DM mặc định là pairing; duyệt mã pairing khi liên hệ lần đầu.

## Đặc điểm

- Chạy hoàn toàn trong tiến trình qua `zca-js`.
- Dùng event listener để nhận tin nhắn đến.
- Gửi phản hồi trực tiếp qua JS API (text/media/link).
- Dành cho tài khoản cá nhân khi không có Zalo Bot API.

## Đặt tên

Channel id là `zalouser` để rõ ràng đây là tự động hóa **tài khoản cá nhân Zalo** (không chính thức). Giữ `zalo` cho tích hợp API Zalo chính thức trong tương lai.

## Tìm ID (directory)

Dùng CLI directory để tìm ID bạn bè/nhóm:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Giới hạn

- Tin nhắn ra ngoài bị chia nhỏ ~2000 ký tự (giới hạn client Zalo).
- Streaming bị chặn mặc định.

## Kiểm soát truy cập (DMs)

`channels.zalouser.dmPolicy` hỗ trợ: `pairing | allowlist | open | disabled` (mặc định: `pairing`).

`channels.zalouser.allowFrom` nhận ID hoặc tên người dùng. Trong cài đặt, tên được chuyển thành ID qua lookup contact trong plugin.

Duyệt qua:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Truy cập nhóm (tùy chọn)

- Mặc định: `channels.zalouser.groupPolicy = "open"` (cho phép nhóm). Dùng `channels.defaults.groupPolicy` để ghi đè mặc định khi không đặt.
- Hạn chế vào allowlist với:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (khóa là ID nhóm ổn định; tên được chuyển thành ID khi khởi động nếu có thể)
  - `channels.zalouser.groupAllowFrom` (kiểm soát ai trong nhóm được phép kích hoạt bot)
- Chặn tất cả nhóm: `channels.zalouser.groupPolicy = "disabled"`.
- Wizard cấu hình có thể hỏi allowlist nhóm.
- Khi khởi động, OpenClaw chuyển tên nhóm/người dùng trong allowlist thành ID và log lại.
- Allowlist nhóm chỉ khớp ID. Tên không khớp bị bỏ qua trừ khi `channels.zalouser.dangerouslyAllowNameMatching: true` bật.
- `channels.zalouser.dangerouslyAllowNameMatching: true` là chế độ tương thích khẩn cấp cho phép khớp tên nhóm thay đổi.
- Nếu `groupAllowFrom` không đặt, runtime dùng `allowFrom` cho kiểm tra sender nhóm.
- Kiểm tra sender áp dụng cho cả tin nhắn nhóm và lệnh điều khiển (ví dụ `/new`, `/reset`).

Ví dụ:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### Kiểm soát mention nhóm

- `channels.zalouser.groups.<group>.requireMention` kiểm soát phản hồi nhóm có cần mention không.
- Thứ tự giải quyết: ID/tên nhóm chính xác -> slug nhóm chuẩn hóa -> `*` -> mặc định (`true`).
- Áp dụng cho cả nhóm trong allowlist và chế độ nhóm mở.
- Lệnh điều khiển được phép (ví dụ `/new`) có thể bỏ qua kiểm soát mention.
- Khi tin nhắn nhóm bị bỏ qua vì cần mention, OpenClaw lưu lại như lịch sử nhóm chờ và đưa vào tin nhắn nhóm xử lý tiếp theo.
- Giới hạn lịch sử nhóm mặc định là `messages.groupChat.historyLimit` (mặc định `50`). Có thể ghi đè theo tài khoản với `channels.zalouser.historyLimit`.

Ví dụ:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## Nhiều tài khoản

Tài khoản ánh xạ tới profile `zalouser` trong trạng thái OpenClaw. Ví dụ:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## Gõ, phản ứng và xác nhận gửi

- OpenClaw gửi sự kiện gõ trước khi gửi phản hồi (cố gắng tốt nhất).
- Hành động phản ứng tin nhắn `react` hỗ trợ cho `zalouser` trong hành động channel.
  - Dùng `remove: true` để xóa emoji phản ứng cụ thể khỏi tin nhắn.
  - Ngữ nghĩa phản ứng: [Reactions](/tools/reactions)
- Với tin nhắn đến có metadata sự kiện, OpenClaw gửi xác nhận đã gửi + đã thấy (cố gắng tốt nhất).

## Khắc phục sự cố

**Đăng nhập không giữ:**

- `openclaw channels status --probe`
- Đăng nhập lại: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Allowlist/tên nhóm không giải quyết:**

- Dùng ID số trong `allowFrom`/`groupAllowFrom`/`groups`, hoặc tên bạn bè/nhóm chính xác.

**Nâng cấp từ thiết lập CLI cũ:**

- Xóa mọi giả định về process `zca` bên ngoài cũ.
- Channel giờ chạy hoàn toàn trong OpenClaw không cần binary CLI bên ngoài.\n
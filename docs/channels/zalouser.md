---
summary: "Khám phá cách đăng nhập Zalo cá nhân bằng QR, cấu hình và khả năng tích hợp với zca-js dễ dàng và nhanh chóng."
read_when:
  - Cài đặt Zalo Personal cho OpenClaw
  - Khắc phục sự cố đăng nhập hoặc luồng tin nhắn Zalo Personal
title: "Hướng Dẫn Cấu Hình Zalo Cá Nhân Qua zca-js"
---

# Zalo Personal (không chính thức)

Trạng thái: thử nghiệm. Tích hợp này tự động hóa **tài khoản cá nhân Zalo** qua `zca-js` trong OpenClaw.

> **Cảnh báo:** Đây là tích hợp không chính thức và có thể dẫn đến việc tài khoản bị khóa. Sử dụng tự chịu rủi ro.

## Yêu cầu Plugin

Zalo Personal được cung cấp dưới dạng plugin và không đi kèm với cài đặt gốc.

- Cài đặt qua CLI: `openclaw plugins install @openclaw/zalouser`
- Hoặc từ source checkout: `openclaw plugins install ./extensions/zalouser`
- Chi tiết: [Plugins](/tools/plugin)

Không cần CLI binary `zca`/`openzca` bên ngoài.

## Cài đặt nhanh (cho người mới)

1. Cài đặt plugin (xem trên).
2. Đăng nhập (QR, trên máy Gateway):
   - `openclaw channels login --channel zalouser`
   - Quét mã QR bằng ứng dụng Zalo trên điện thoại.
3. Kích hoạt kênh:

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
5. Truy cập DM mặc định là pairing; phê duyệt mã pairing khi liên hệ lần đầu.

## Đặc điểm

- Chạy hoàn toàn trong tiến trình qua `zca-js`.
- Sử dụng listener sự kiện gốc để nhận tin nhắn đến.
- Gửi phản hồi trực tiếp qua JS API (văn bản/đa phương tiện/liên kết).
- Thiết kế cho các trường hợp sử dụng "tài khoản cá nhân" khi Zalo Bot API không khả dụng.

## Đặt tên

ID kênh là `zalouser` để làm rõ rằng đây là tự động hóa **tài khoản người dùng cá nhân Zalo** (không chính thức). Chúng tôi giữ `zalo` cho khả năng tích hợp API Zalo chính thức trong tương lai.

## Tìm ID (thư mục)

Sử dụng CLI thư mục để tìm kiếm đồng nghiệp/nhóm và ID của họ:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Giới hạn

- Văn bản gửi đi được chia thành ~2000 ký tự (giới hạn của Zalo client).
- Streaming bị chặn theo mặc định.

## Kiểm soát truy cập (DMs)

`channels.zalouser.dmPolicy` hỗ trợ: `pairing | allowlist | open | disabled` (mặc định: `pairing`).

`channels.zalouser.allowFrom` chấp nhận ID người dùng hoặc tên. Trong quá trình cài đặt, tên được chuyển thành ID bằng cách tra cứu liên hệ trong plugin.

Phê duyệt qua:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Truy cập nhóm (tùy chọn)

- Mặc định: `channels.zalouser.groupPolicy = "open"` (cho phép nhóm). Sử dụng `channels.defaults.groupPolicy` để ghi đè mặc định khi không được đặt.
- Hạn chế vào danh sách cho phép với:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (khóa nên là ID nhóm ổn định; tên được chuyển thành ID khi khởi động nếu có thể)
  - `channels.zalouser.groupAllowFrom` (kiểm soát người gửi nào trong các nhóm được phép có thể kích hoạt bot)
- Chặn tất cả các nhóm: `channels.zalouser.groupPolicy = "disabled"`.
- Trình hướng dẫn cấu hình có thể nhắc nhở về danh sách cho phép nhóm.
- Khi khởi động, OpenClaw chuyển đổi tên nhóm/người dùng trong danh sách cho phép thành ID và ghi lại ánh xạ.
- Khớp danh sách cho phép nhóm mặc định chỉ dựa trên ID. Tên không được giải quyết sẽ bị bỏ qua cho xác thực trừ khi `channels.zalouser.dangerouslyAllowNameMatching: true` được bật.
- `channels.zalouser.dangerouslyAllowNameMatching: true` là chế độ tương thích khẩn cấp cho phép khớp tên nhóm có thể thay đổi.
- Nếu `groupAllowFrom` không được đặt, runtime sẽ sử dụng `allowFrom` cho kiểm tra người gửi nhóm.
- Kiểm tra người gửi áp dụng cho cả tin nhắn nhóm thông thường và lệnh điều khiển (ví dụ `/new`, `/reset`).

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

### Kiểm soát nhắc đến nhóm

- `channels.zalouser.groups.<group>.requireMention` kiểm soát xem phản hồi nhóm có yêu cầu nhắc đến hay không.
- Thứ tự giải quyết: ID/tên nhóm chính xác -> slug nhóm chuẩn hóa -> `*` -> mặc định (`true`).
- Điều này áp dụng cho cả nhóm trong danh sách cho phép và chế độ nhóm mở.
- Lệnh điều khiển được ủy quyền (ví dụ `/new`) có thể bỏ qua kiểm soát nhắc đến.
- Khi một tin nhắn nhóm bị bỏ qua vì yêu cầu nhắc đến, OpenClaw lưu trữ nó như lịch sử nhóm chờ xử lý và bao gồm nó trong tin nhắn nhóm được xử lý tiếp theo.
- Giới hạn lịch sử nhóm mặc định là `messages.groupChat.historyLimit` (dự phòng `50`). Bạn có thể ghi đè theo tài khoản với `channels.zalouser.historyLimit`.

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

Tài khoản được ánh xạ tới hồ sơ `zalouser` trong trạng thái OpenClaw. Ví dụ:

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

## Gõ, phản ứng và xác nhận giao hàng

- OpenClaw gửi sự kiện gõ trước khi gửi phản hồi (cố gắng tốt nhất).
- Hành động phản ứng tin nhắn `react` được hỗ trợ cho `zalouser` trong các hành động kênh.
  - Sử dụng `remove: true` để xóa một emoji phản ứng cụ thể khỏi tin nhắn.
  - Ngữ nghĩa phản ứng: [Reactions](/tools/reactions)
- Đối với tin nhắn đến có chứa siêu dữ liệu sự kiện, OpenClaw gửi xác nhận đã giao + đã xem (cố gắng tốt nhất).

## Khắc phục sự cố

**Đăng nhập không giữ được:**

- `openclaw channels status --probe`
- Đăng nhập lại: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Danh sách cho phép/tên nhóm không được giải quyết:**

- Sử dụng ID số trong `allowFrom`/`groupAllowFrom`/`groups`, hoặc tên bạn bè/nhóm chính xác.

**Nâng cấp từ cài đặt CLI cũ:**

- Loại bỏ bất kỳ giả định nào về quy trình `zca` bên ngoài cũ.
- Kênh hiện chạy hoàn toàn trong OpenClaw mà không cần CLI binary bên ngoài.

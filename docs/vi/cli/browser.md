---
summary: "Tham khảo CLI cho `openclaw browser` (hồ sơ, tab, hành động, Chrome MCP và CDP)"
read_when:
  - Bạn sử dụng `openclaw browser` và muốn có ví dụ cho các tác vụ thường gặp
  - Bạn muốn điều khiển trình duyệt chạy trên máy khác thông qua node host
  - Bạn muốn kết nối với Chrome đã đăng nhập trên máy của mình qua Chrome MCP
title: "browser"
---

# `openclaw browser`

Quản lý máy chủ điều khiển trình duyệt của OpenClaw và thực hiện các hành động trên trình duyệt (tab, snapshot, chụp màn hình, điều hướng, nhấp chuột, nhập liệu).

Liên quan:

- Công cụ trình duyệt + API: [Công cụ trình duyệt](/tools/browser)

## Các cờ thông dụng

- `--url <gatewayWsUrl>`: URL WebSocket của Gateway (mặc định từ cấu hình).
- `--token <token>`: Token của Gateway (nếu cần).
- `--timeout <ms>`: thời gian chờ yêu cầu (ms).
- `--browser-profile <name>`: chọn hồ sơ trình duyệt (mặc định từ cấu hình).
- `--json`: đầu ra có thể đọc được bằng máy (nếu hỗ trợ).

## Bắt đầu nhanh (local)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

## Hồ sơ

Hồ sơ là các cấu hình định tuyến trình duyệt được đặt tên. Trong thực tế:

- `openclaw`: khởi chạy hoặc kết nối với một phiên bản Chrome do OpenClaw quản lý (thư mục dữ liệu người dùng riêng biệt).
- `user`: điều khiển phiên Chrome đã đăng nhập của bạn thông qua Chrome DevTools MCP.
- hồ sơ CDP tùy chỉnh: trỏ đến một điểm cuối CDP cục bộ hoặc từ xa.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser delete-profile --name work
```

Sử dụng một hồ sơ cụ thể:

```bash
openclaw browser --browser-profile work tabs
```

## Tab

```bash
openclaw browser tabs
openclaw browser open https://docs.openclaw.ai
openclaw browser focus <targetId>
openclaw browser close <targetId>
```

## Snapshot / chụp màn hình / hành động

Snapshot:

```bash
openclaw browser snapshot
```

Chụp màn hình:

```bash
openclaw browser screenshot
```

Điều hướng/nhấp chuột/nhập liệu (tự động hóa giao diện dựa trên tham chiếu):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser type <ref> "hello"
```

## Chrome hiện có qua MCP

Sử dụng hồ sơ `user` tích hợp sẵn, hoặc tạo hồ sơ `existing-session` của riêng bạn:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

Đường dẫn này chỉ dành cho host. Đối với Docker, máy chủ không giao diện, Browserless, hoặc các thiết lập từ xa khác, hãy sử dụng hồ sơ CDP.

## Điều khiển trình duyệt từ xa (proxy node host)

Nếu Gateway chạy trên máy khác với trình duyệt, hãy chạy một **node host** trên máy có Chrome/Brave/Edge/Chromium. Gateway sẽ proxy các hành động trình duyệt đến node đó (không cần máy chủ điều khiển trình duyệt riêng biệt).

Sử dụng `gateway.nodes.browser.mode` để điều khiển định tuyến tự động và `gateway.nodes.browser.node` để ghim một node cụ thể nếu có nhiều node được kết nối.

Bảo mật + thiết lập từ xa: [Công cụ trình duyệt](/tools/browser), [Truy cập từ xa](/gateway/remote), [Tailscale](/gateway/tailscale), [Bảo mật](/gateway/security)

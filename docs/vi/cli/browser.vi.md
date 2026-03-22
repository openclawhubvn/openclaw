# `openclaw browser`

Quản lý server điều khiển browser của OpenClaw và thực hiện các hành động trên browser (tabs, snapshots, screenshots, navigation, clicks, typing).

Liên quan:

- Công cụ + API Browser: [Browser tool](/tools/browser)

## Common flags

- `--url <gatewayWsUrl>`: Gateway WebSocket URL (mặc định từ config).
- `--token <token>`: Gateway token (nếu cần).
- `--timeout <ms>`: thời gian chờ request (ms).
- `--browser-profile <name>`: chọn browser profile (mặc định từ config).
- `--json`: output dạng máy đọc được (nếu hỗ trợ).

## Quick start (local)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

## Profiles

Profiles là các cấu hình routing cho browser. Thực tế:

- `openclaw`: khởi chạy hoặc gắn vào instance Chrome do OpenClaw quản lý (thư mục dữ liệu người dùng tách biệt).
- `user`: điều khiển session Chrome đã đăng nhập qua Chrome DevTools MCP.
- custom CDP profiles: trỏ đến endpoint CDP local hoặc remote.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser delete-profile --name work
```

Sử dụng profile cụ thể:

```bash
openclaw browser --browser-profile work tabs
```

## Tabs

```bash
openclaw browser tabs
openclaw browser open https://docs.openclaw.ai
openclaw browser focus <targetId>
openclaw browser close <targetId>
```

## Snapshot / screenshot / actions

Snapshot:

```bash
openclaw browser snapshot
```

Screenshot:

```bash
openclaw browser screenshot
```

Điều hướng/click/gõ (UI automation dựa trên ref):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser type <ref> "hello"
```

## Existing Chrome via MCP

Dùng profile `user` có sẵn, hoặc tạo profile `existing-session` của riêng mình:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

Đường dẫn này chỉ dành cho host. Với Docker, server headless, Browserless, hoặc các setup remote khác, dùng profile CDP.

## Remote browser control (node host proxy)

Nếu Gateway chạy trên máy khác với browser, chạy **node host** trên máy có Chrome/Brave/Edge/Chromium. Gateway sẽ proxy các hành động browser đến node đó (không cần server điều khiển browser riêng).

Dùng `gateway.nodes.browser.mode` để điều khiển auto-routing và `gateway.nodes.browser.node` để chỉ định node cụ thể nếu có nhiều node kết nối.

Bảo mật + setup remote: [Browser tool](/tools/browser), [Remote access](/gateway/remote), [Tailscale](/gateway/tailscale), [Security](/gateway/security)\n
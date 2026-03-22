---
summary: "Dịch vụ điều khiển trình duyệt tích hợp + lệnh hành động"
read_when:
  - Thêm tự động hóa trình duyệt do agent điều khiển
  - Debug lý do openclaw can thiệp vào Chrome của bạn
  - Triển khai cài đặt trình duyệt + vòng đời trong ứng dụng macOS
title: "Trình duyệt (do OpenClaw quản lý)"
---

# Trình duyệt (do OpenClaw quản lý)

OpenClaw có thể chạy một **profile Chrome/Brave/Edge/Chromium riêng biệt** mà agent điều khiển. Nó được cách ly khỏi trình duyệt cá nhân và được quản lý qua một dịch vụ điều khiển nhỏ chạy local trong Gateway (chỉ loopback).

Góc nhìn cho người mới:

- Hãy nghĩ nó như một **trình duyệt riêng biệt chỉ dành cho agent**.
- Profile `openclaw` **không** đụng đến profile trình duyệt cá nhân.
- Agent có thể **mở tab, đọc trang, click, và gõ** trong một môi trường an toàn.
- Profile `user` tích hợp với phiên Chrome đã đăng nhập thực tế qua Chrome MCP.

## Bạn nhận được gì

- Một profile trình duyệt riêng tên **openclaw** (mặc định màu cam).
- Điều khiển tab xác định (liệt kê/mở/tập trung/đóng).
- Hành động của agent (click/gõ/kéo/chọn), snapshot, screenshot, PDF.
- Hỗ trợ nhiều profile tùy chọn (`openclaw`, `work`, `remote`, ...).

Trình duyệt này **không** phải là trình duyệt hàng ngày. Nó là một bề mặt an toàn, cách ly cho tự động hóa và xác minh của agent.

## Bắt đầu nhanh

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Nếu gặp thông báo “Browser disabled”, bật nó trong config (xem bên dưới) và khởi động lại Gateway.

## Profiles: `openclaw` vs `user`

- `openclaw`: trình duyệt cách ly, được quản lý (không cần extension).
- `user`: profile tích hợp Chrome MCP cho phiên **Chrome đã đăng nhập thực tế**.

Khi gọi công cụ trình duyệt của agent:

- Mặc định: dùng trình duyệt cách ly `openclaw`.
- Ưu tiên `profile="user"` khi cần phiên đã đăng nhập và người dùng có mặt để click/chấp nhận bất kỳ yêu cầu đính kèm nào.
- `profile` là ghi đè rõ ràng khi muốn chế độ trình duyệt cụ thể.

Đặt `browser.defaultProfile: "openclaw"` nếu muốn chế độ quản lý mặc định.

## Cấu hình

Cài đặt trình duyệt nằm trong `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // mặc định: true
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // chế độ mạng tin cậy mặc định
      // allowPrivateNetwork: true, // alias cũ
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // ghi đè single-profile cũ
    remoteCdpTimeoutMs: 1500, // timeout HTTP CDP từ xa (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // timeout handshake WebSocket CDP từ xa (ms)
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

Ghi chú:

- Dịch vụ điều khiển trình duyệt gắn vào loopback trên một cổng được suy ra từ `gateway.port` (mặc định: `18791`, là gateway + 2).
- Nếu ghi đè cổng Gateway (`gateway.port` hoặc `OPENCLAW_GATEWAY_PORT`), các cổng trình duyệt suy ra sẽ thay đổi để giữ trong cùng một “gia đình”.
- `cdpUrl` mặc định là cổng CDP local được quản lý khi không được đặt.
- `remoteCdpTimeoutMs` áp dụng cho kiểm tra khả năng truy cập CDP từ xa (không loopback).
- `remoteCdpHandshakeTimeoutMs` áp dụng cho kiểm tra khả năng truy cập WebSocket CDP từ xa.
- Điều hướng trình duyệt/mở tab được bảo vệ SSRF trước khi điều hướng và kiểm tra lại nỗ lực tốt nhất trên URL `http(s)` cuối cùng sau khi điều hướng.
- Trong chế độ SSRF nghiêm ngặt, khám phá/kiểm tra endpoint CDP từ xa (`cdpUrl`, bao gồm tra cứu `/json/version`) cũng được kiểm tra.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` mặc định là `true` (mô hình mạng tin cậy). Đặt nó thành `false` để duyệt chỉ công khai nghiêm ngặt.
- `browser.ssrfPolicy.allowPrivateNetwork` vẫn được hỗ trợ như một alias cũ để tương thích.
- `attachOnly: true` nghĩa là “không bao giờ khởi chạy trình duyệt local; chỉ đính kèm nếu nó đã chạy.”
- `color` + màu sắc theo profile làm nổi bật giao diện trình duyệt để bạn có thể thấy profile nào đang hoạt động.
- Profile mặc định là `openclaw` (trình duyệt độc lập do OpenClaw quản lý). Dùng `defaultProfile: "user"` để chọn trình duyệt người dùng đã đăng nhập.
- Thứ tự tự động phát hiện: trình duyệt mặc định hệ thống nếu dựa trên Chromium; nếu không thì Chrome → Brave → Edge → Chromium → Chrome Canary.
- Các profile `openclaw` local tự động gán `cdpPort`/`cdpUrl` — chỉ đặt chúng cho CDP từ xa.
- `driver: "existing-session"` sử dụng Chrome DevTools MCP thay vì CDP thô. Không đặt `cdpUrl` cho driver đó.
- Đặt `browser.profiles.<name>.userDataDir` khi một profile phiên hiện có nên đính kèm vào một profile người dùng Chromium không mặc định như Brave hoặc Edge.

## Sử dụng Brave (hoặc trình duyệt dựa trên Chromium khác)

Nếu trình duyệt **mặc định hệ thống** là dựa trên Chromium (Chrome/Brave/Edge/v.v.), OpenClaw sẽ tự động sử dụng nó. Đặt `browser.executablePath` để ghi đè tự động phát hiện:

Ví dụ CLI:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

```json5
// macOS
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
  }
}

// Windows
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  }
}

// Linux
{
  browser: {
    executablePath: "/usr/bin/brave-browser"
  }
}
```

## Điều khiển local vs remote

- **Điều khiển local (mặc định):** Gateway khởi động dịch vụ điều khiển loopback và có thể khởi chạy trình duyệt local.
- **Điều khiển remote (node host):** chạy một node host trên máy có trình duyệt; Gateway proxy các hành động trình duyệt đến nó.
- **Remote CDP:** đặt `browser.profiles.<name>.cdpUrl` (hoặc `browser.cdpUrl`) để đính kèm vào một trình duyệt dựa trên Chromium từ xa. Trong trường hợp này, OpenClaw sẽ không khởi chạy trình duyệt local.

URL CDP từ xa có thể bao gồm auth:

- Token truy vấn (ví dụ, `https://provider.example?token=<token>`)
- HTTP Basic auth (ví dụ, `https://user:pass@provider.example`)

OpenClaw giữ nguyên auth khi gọi endpoint `/json/*` và khi kết nối đến WebSocket CDP. Ưu tiên biến môi trường hoặc quản lý bí mật cho token thay vì commit chúng vào file cấu hình.

## Proxy trình duyệt Node (mặc định không cấu hình)

Nếu chạy một **node host** trên máy có trình duyệt, OpenClaw có thể tự động định tuyến các cuộc gọi công cụ trình duyệt đến node đó mà không cần cấu hình trình duyệt thêm. Đây là đường dẫn mặc định cho các gateway từ xa.

Ghi chú:

- Node host phơi bày server điều khiển trình duyệt local của nó qua một **lệnh proxy**.
- Các profile đến từ cấu hình `browser.profiles` của node (giống như local).
- Vô hiệu hóa nếu không muốn:
  - Trên node: `nodeHost.browserProxy.enabled=false`
  - Trên gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP từ xa được host)

[Browserless](https://browserless.io) là một dịch vụ Chromium được host phơi bày các endpoint CDP qua HTTPS. Bạn có thể chỉ định một profile trình duyệt OpenClaw đến một endpoint vùng Browserless và xác thực bằng khóa API của bạn.

Ví dụ:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "https://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

Ghi chú:

- Thay `<BROWSERLESS_API_KEY>` bằng token Browserless thực của bạn.
- Chọn endpoint vùng phù hợp với tài khoản Browserless của bạn (xem tài liệu của họ).

## Nhà cung cấp CDP WebSocket trực tiếp

Một số dịch vụ trình duyệt được host phơi bày một endpoint **WebSocket trực tiếp** thay vì khám phá CDP dựa trên HTTP tiêu chuẩn (`/json/version`). OpenClaw hỗ trợ cả hai:

- **Endpoint HTTP(S)** (ví dụ Browserless) — OpenClaw gọi `/json/version` để khám phá URL debugger WebSocket, sau đó kết nối.
- **Endpoint WebSocket** (`ws://` / `wss://`) — OpenClaw kết nối trực tiếp, bỏ qua `/json/version`. Sử dụng điều này cho các dịch vụ như [Browserbase](https://www.browserbase.com) hoặc bất kỳ nhà cung cấp nào cung cấp cho bạn một URL WebSocket.

### Browserbase

[Browserbase](https://www.browserbase.com) là một nền tảng đám mây để chạy trình duyệt headless với khả năng giải CAPTCHA tích hợp, chế độ ẩn danh, và proxy dân cư.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

Ghi chú:

- [Đăng ký](https://www.browserbase.com/sign-up) và sao chép **API Key** của bạn từ [bảng điều khiển Tổng quan](https://www.browserbase.com/overview).
- Thay `<BROWSERBASE_API_KEY>` bằng khóa API Browserbase thực của bạn.
- Browserbase tự động tạo một phiên trình duyệt khi kết nối WebSocket, vì vậy không cần bước tạo phiên thủ công.
- Gói miễn phí cho phép một phiên đồng thời và một giờ trình duyệt mỗi tháng. Xem [giá](https://www.browserbase.com/pricing) để biết giới hạn gói trả phí.
- Xem [tài liệu Browserbase](https://docs.browserbase.com) để biết đầy đủ tham chiếu API, hướng dẫn SDK, và ví dụ tích hợp.

## Bảo mật

Ý tưởng chính:

- Điều khiển trình duyệt chỉ loopback; truy cập thông qua auth của Gateway hoặc ghép nối node.
- Nếu điều khiển trình duyệt được bật và không có auth nào được cấu hình, OpenClaw tự động tạo `gateway.auth.token` khi khởi động và lưu nó vào cấu hình.
- Giữ Gateway và bất kỳ node host nào trên một mạng riêng (Tailscale); tránh phơi bày công khai.
- Xem URL/tokens CDP từ xa như bí mật; ưu tiên biến môi trường hoặc quản lý bí mật.

Mẹo CDP từ xa:

- Ưu tiên endpoint mã hóa (HTTPS hoặc WSS) và token ngắn hạn nếu có thể.
- Tránh nhúng token dài hạn trực tiếp vào file cấu hình.

## Profiles (nhiều trình duyệt)

OpenClaw hỗ trợ nhiều profile được đặt tên (cấu hình định tuyến). Các profile có thể là:

- **do openclaw quản lý**: một instance trình duyệt dựa trên Chromium riêng biệt với thư mục dữ liệu người dùng riêng + cổng CDP
- **từ xa**: một URL CDP rõ ràng (trình duyệt dựa trên Chromium chạy ở nơi khác)
- **phiên hiện có**: profile Chrome hiện có của bạn qua kết nối tự động Chrome DevTools MCP

Mặc định:

- Profile `openclaw` được tạo tự động nếu thiếu.
- Profile `user` được tích hợp sẵn cho đính kèm phiên hiện có Chrome MCP.
- Các profile phiên hiện có là tùy chọn ngoài `user`; tạo chúng với `--driver existing-session`.
- Các cổng CDP local phân bổ từ **18800–18899** theo mặc định.
- Xóa một profile sẽ di chuyển thư mục dữ liệu local của nó vào Thùng rác.

Tất cả các endpoint điều khiển chấp nhận `?profile=<name>`; CLI sử dụng `--browser-profile`.

## Phiên hiện có qua Chrome DevTools MCP

OpenClaw cũng có thể đính kèm vào một profile trình duyệt dựa trên Chromium đang chạy thông qua server Chrome DevTools MCP chính thức. Điều này tái sử dụng các tab và trạng thái đăng nhập đã mở trong profile trình duyệt đó.

Tham khảo nền tảng và thiết lập chính thức:

- [Chrome for Developers: Sử dụng Chrome DevTools MCP với phiên trình duyệt của bạn](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Profile tích hợp:

- `user`

Tùy chọn: tạo profile phiên hiện có tùy chỉnh của riêng bạn nếu muốn tên, màu sắc, hoặc thư mục dữ liệu trình duyệt khác.

Hành vi mặc định:

- Profile `user` tích hợp sử dụng kết nối tự động Chrome MCP, nhắm đến profile Google Chrome local mặc định.

Sử dụng `userDataDir` cho Brave, Edge, Chromium, hoặc một profile Chrome không mặc định:

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

Sau đó trong trình duyệt tương ứng:

1. Mở trang inspect của trình duyệt đó để debug từ xa.
2. Bật debug từ xa.
3. Giữ trình duyệt chạy và chấp nhận yêu cầu kết nối khi OpenClaw đính kèm.

Trang inspect phổ biến:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Kiểm tra khói đính kèm trực tiếp:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Thành công trông như thế nào:

- `status` hiển thị `driver: existing-session`
- `status` hiển thị `transport: chrome-mcp`
- `status` hiển thị `running: true`
- `tabs` liệt kê các tab trình duyệt đã mở của bạn
- `snapshot` trả về các tham chiếu từ tab trực tiếp đã chọn

Kiểm tra nếu đính kèm không hoạt động:

- trình duyệt dựa trên Chromium mục tiêu là phiên bản `144+`
- debug từ xa được bật trong trang inspect của trình duyệt đó
- trình duyệt đã hiển thị và bạn đã chấp nhận yêu cầu đính kèm
- `openclaw doctor` di chuyển cấu hình trình duyệt dựa trên extension cũ và kiểm tra rằng Chrome được cài đặt local cho các profile kết nối tự động mặc định, nhưng nó không thể bật debug từ xa phía trình duyệt cho bạn

Sử dụng agent:

- Sử dụng `profile="user"` khi cần trạng thái trình duyệt đã đăng nhập của người dùng.
- Nếu sử dụng profile phiên hiện có tùy chỉnh, hãy truyền tên profile rõ ràng đó.
- Chỉ chọn chế độ này khi người dùng có mặt tại máy tính để chấp nhận yêu cầu đính kèm.
- Gateway hoặc node host có thể spawn `npx chrome-devtools-mcp@latest --autoConnect`

Ghi chú:

- Đường dẫn này có rủi ro cao hơn so với profile `openclaw` cách ly vì nó có thể hoạt động bên trong phiên trình duyệt đã đăng nhập của bạn.
- OpenClaw không khởi chạy trình duyệt cho driver này; nó chỉ đính kèm vào một phiên hiện có.
- OpenClaw sử dụng luồng `--autoConnect` chính thức của Chrome DevTools MCP ở đây. Nếu `userDataDir` được đặt, OpenClaw truyền nó để nhắm đến thư mục dữ liệu người dùng Chromium rõ ràng đó.
- Ảnh chụp màn hình phiên hiện có hỗ trợ chụp trang và chụp phần tử từ snapshot, nhưng không hỗ trợ CSS `--element` selectors.
- Phiên hiện có `wait --url` hỗ trợ các mẫu chính xác, substring, và glob như các driver trình duyệt khác. `wait --load networkidle` chưa được hỗ trợ.
- Một số tính năng vẫn yêu cầu đường dẫn trình duyệt được quản lý, chẳng hạn như xuất PDF và chặn tải xuống.
- Phiên hiện có là host-local. Nếu Chrome nằm trên một máy khác hoặc một namespace mạng khác, hãy sử dụng CDP từ xa hoặc một node host thay thế.

## Đảm bảo cách ly

- **Thư mục dữ liệu người dùng riêng biệt**: không bao giờ đụng đến profile trình duyệt cá nhân.
- **Cổng riêng biệt**: tránh `9222` để ngăn va chạm với các luồng công việc dev.
- **Điều khiển tab xác định**: nhắm đến tab bằng `targetId`, không phải “tab cuối cùng”.

## Lựa chọn trình duyệt

Khi khởi chạy local, OpenClaw chọn cái có sẵn đầu tiên:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Bạn có thể ghi đè với `browser.executablePath`.

Nền tảng:

- macOS: kiểm tra `/Applications` và `~/Applications`.
- Linux: tìm `google-chrome`, `brave`, `microsoft-edge`, `chromium`, v.v.
- Windows: kiểm tra các vị trí cài đặt phổ biến.

## API điều khiển (tùy chọn)

Chỉ dành cho tích hợp local, Gateway phơi bày một API HTTP loopback nhỏ:

- Trạng thái/bắt đầu/dừng: `GET /`, `POST /start`, `POST /stop`
- Tab: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/screenshot: `GET /snapshot`, `POST /screenshot`
- Hành động: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Tải xuống: `POST /download`, `POST /wait/download`
- Debugging: `GET /console`, `POST /pdf`
- Debugging: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Mạng: `POST /response/body`
- Trạng thái: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Trạng thái: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Cài đặt: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Tất cả các endpoint chấp nhận `?profile=<name>`.

Nếu auth gateway được cấu hình, các route HTTP trình duyệt cũng yêu cầu auth:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` hoặc HTTP Basic auth với mật khẩu đó

### Yêu cầu Playwright

Một số tính năng (navigate/act/AI snapshot/role snapshot, ảnh chụp màn hình phần tử, PDF) yêu cầu Playwright. Nếu Playwright không được cài đặt, các endpoint đó trả về lỗi 501 rõ ràng. ARIA snapshot và ảnh chụp màn hình cơ bản vẫn hoạt động cho Chrome do openclaw quản lý.

Nếu thấy `Playwright is not available in this gateway build`, cài đặt gói Playwright đầy đủ (không phải `playwright-core`) và khởi động lại gateway, hoặc cài đặt lại OpenClaw với hỗ trợ trình duyệt.

#### Cài đặt Docker Playwright

Nếu Gateway của bạn chạy trong Docker, tránh `npx playwright` (xung đột ghi đè npm). Sử dụng CLI đi kèm thay thế:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Để duy trì tải xuống trình duyệt, đặt `PLAYWRIGHT_BROWSERS_PATH` (ví dụ, `/home/node/.cache/ms-playwright`) và đảm bảo `/home/node` được duy trì qua `OPENCLAW_HOME_VOLUME` hoặc một bind mount. Xem [Docker](/install/docker).

## Cách hoạt động (nội bộ)

Luồng cấp cao:

- Một **server điều khiển nhỏ** chấp nhận các yêu cầu HTTP.
- Nó kết nối với các trình duyệt dựa trên Chromium (Chrome/Brave/Edge/Chromium) qua **CDP**.
- Đối với các hành động nâng cao (click/gõ/snapshot/PDF), nó sử dụng **Playwright** trên CDP.
- Khi thiếu Playwright, chỉ các hoạt động không phải Playwright mới có sẵn.

Thiết kế này giữ cho agent trên một giao diện ổn định, xác định trong khi cho phép bạn hoán đổi trình duyệt local/từ xa và các profile.

## Tham khảo nhanh CLI

Tất cả các lệnh chấp nhận `--browser-profile <name>` để nhắm đến một profile cụ thể. Tất cả các lệnh cũng chấp nhận `--json` cho đầu ra có thể đọc được bằng máy (payload ổn định).

Cơ bản:

- `openclaw browser status`
- `openclaw browser start`
- `openclaw browser stop`
- `openclaw browser tabs`
- `openclaw browser tab`
- `openclaw browser tab new`
- `openclaw browser tab select 2`
- `openclaw browser tab close 2`
- `openclaw browser open https://example.com`
- `openclaw browser focus abcd1234`
- `openclaw browser close abcd1234`

Kiểm tra:

- `openclaw browser screenshot`
- `openclaw browser screenshot --full-page`
- `openclaw browser screenshot --ref 12`
- `openclaw browser screenshot --ref e12`
- `openclaw browser snapshot`
- `openclaw browser snapshot --format aria --limit 200`
- `openclaw browser snapshot --interactive --compact --depth 6`
- `openclaw browser snapshot --efficient`
- `openclaw browser snapshot --labels`
- `openclaw browser snapshot --selector "#main" --interactive`
- `openclaw browser snapshot --frame "iframe#main" --interactive`
- `openclaw browser console --level error`
- `openclaw browser errors --clear`
- `openclaw browser requests --filter api --clear`
- `openclaw browser pdf`
- `openclaw browser responsebody "**/api" --max-chars 5000`

Hành động:

- `openclaw browser navigate https://example.com`
- `openclaw browser resize 1280 720`
- `openclaw browser click 12 --double`
- `openclaw browser click e12 --double`
- `openclaw browser type 23 "hello" --submit`
- `openclaw browser press Enter`
- `openclaw browser hover 44`
- `openclaw browser scrollintoview e12`
- `openclaw browser drag 10 11`
- `openclaw browser select 9 OptionA OptionB`
- `openclaw browser download e12 report.pdf`
- `openclaw browser waitfordownload report.pdf`
- `openclaw browser upload /tmp/openclaw/uploads/file.pdf`
- `openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'`
- `openclaw browser dialog --accept`
- `openclaw browser wait --text "Done"`
- `openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"`
- `openclaw browser evaluate --fn '(el) => el.textContent' --ref 7`
- `openclaw browser highlight e12`
- `openclaw browser trace start`
- `openclaw browser trace stop`

Trạng thái:

- `openclaw browser cookies`
- `openclaw browser cookies set session abc123 --url "https://example.com"`
- `openclaw browser cookies clear`
- `openclaw browser storage local get`
- `openclaw browser storage local set theme dark`
- `openclaw browser storage session clear`
- `openclaw browser set offline on`
- `openclaw browser set headers --headers-json '{"X-Debug":"1"}'`
- `openclaw browser set credentials user pass`
- `openclaw browser set credentials --clear`
- `openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"`
- `openclaw browser set geo --clear`
- `openclaw browser set media dark`
- `openclaw browser set timezone America/New_York`
- `openclaw browser set locale en-US`
- `openclaw browser set device "iPhone 14"`

Ghi chú:

- `upload` và `dialog` là các cuộc gọi **arming**; chạy chúng trước khi click/press kích hoạt chooser/dialog.
- Đường dẫn đầu ra tải xuống và trace bị giới hạn trong các gốc tạm thời của OpenClaw:
  - traces: `/tmp/openclaw` (fallback: `${os.tmpdir()}/openclaw`)
  - downloads: `/tmp/openclaw/downloads` (fallback: `${os.tmpdir()}/openclaw/downloads`)
- Đường dẫn tải lên bị giới hạn trong một gốc tải lên tạm thời của OpenClaw:
  - uploads: `/tmp/openclaw/uploads` (fallback: `${os.tmpdir()}/openclaw/uploads`)
- `upload` cũng có thể đặt các input file trực tiếp qua `--input-ref` hoặc `--element`.
- `snapshot`:
  - `--format ai` (mặc định khi Playwright được cài đặt): trả về một snapshot AI với các tham chiếu số (`aria-ref="<n>"`).
  - `--format aria`: trả về cây truy cập (không có tham chiếu; chỉ kiểm tra).
  - `--efficient` (hoặc `--mode efficient`): preset snapshot vai trò gọn nhẹ (tương tác + gọn nhẹ + độ sâu + maxChars thấp hơn).
  - Mặc định cấu hình (chỉ công cụ/CLI): đặt `browser.snapshotDefaults.mode: "efficient"` để sử dụng snapshot hiệu quả khi người gọi không truyền chế độ (xem [Cấu hình Gateway](/gateway/configuration-reference#browser)).
  - Các tùy chọn snapshot vai trò (`--interactive`, `--compact`, `--depth`, `--selector`) buộc một snapshot dựa trên vai trò với các tham chiếu như `ref=e12`.
  - `--frame "<iframe selector>"` giới hạn snapshot vai trò vào một iframe (kết hợp với các tham chiếu vai trò như `e12`).
  - `--interactive` xuất một danh sách phẳng, dễ chọn các phần tử tương tác (tốt nhất để thực hiện hành động).
  - `--labels` thêm một ảnh chụp màn hình chỉ có viewport với các nhãn tham chiếu overlayed (in `MEDIA:<path>`).
- `click`/`type`/v.v. yêu cầu một `ref` từ `snapshot` (hoặc số `12` hoặc tham chiếu vai trò `e12`).
  CSS selectors không được hỗ trợ cho các hành động.

## Snapshots và refs

OpenClaw hỗ trợ hai kiểu “snapshot”:

- **AI snapshot (tham chiếu số)**: `openclaw browser snapshot` (mặc định; `--format ai`)
  - Đầu ra: một snapshot văn bản bao gồm các tham chiếu số.
  - Hành động: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Nội bộ, tham chiếu được giải quyết qua `aria-ref` của Playwright.

- **Role snapshot (tham chiếu vai trò như `e12`)**: `openclaw browser snapshot --interactive` (hoặc `--compact`, `--depth`, `--selector`, `--frame`)
  - Đầu ra: một danh sách/cây dựa trên vai trò với `[ref=e12]` (và tùy chọn `[nth=1]`).
  - Hành động: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Nội bộ, tham chiếu được giải quyết qua `getByRole(...)` (cộng với `nth()` cho các bản sao).
  - Thêm `--labels` để bao gồm một ảnh chụp màn hình viewport với các nhãn `e12` overlayed.

Hành vi tham chiếu:

- Tham chiếu **không ổn định qua các điều hướng**; nếu có gì đó thất bại, chạy lại `snapshot` và sử dụng một tham chiếu mới.
- Nếu snapshot vai trò được thực hiện với `--frame`, các tham chiếu vai trò được giới hạn trong iframe đó cho đến snapshot vai trò tiếp theo.

## Tăng cường chờ

Bạn có thể chờ đợi nhiều hơn chỉ thời gian/văn bản:

- Chờ URL (hỗ trợ globs bởi Playwright):
  - `openclaw browser wait --url "**/dash"`
- Chờ trạng thái tải:
  - `openclaw browser wait --load networkidle`
- Chờ một điều kiện JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Chờ một selector trở nên hiển thị:
  - `openclaw browser wait "#main"`

Những điều này có thể được kết hợp:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Quy trình debug

Khi một hành động thất bại (ví dụ “không hiển thị”, “vi phạm chế độ nghiêm ngặt”, “bị che phủ”):

1. `openclaw browser snapshot --interactive`
2. Sử dụng `click <ref>` / `type <ref>` (ưu tiên tham chiếu vai trò trong chế độ tương tác)
3. Nếu vẫn thất bại: `openclaw browser highlight <ref>` để xem Playwright đang nhắm đến gì
4. Nếu trang hoạt động kỳ lạ:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Để debug sâu: ghi lại một trace:
   - `openclaw browser trace start`
   - tái tạo vấn đề
   - `openclaw browser trace stop` (in `TRACE:<path>`)

## Đầu ra JSON

`--json` dành cho scripting và công cụ có cấu trúc.

Ví dụ:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Snapshot vai trò trong JSON bao gồm `refs` cộng với một khối `stats` nhỏ (lines/chars/refs/interactive) để công cụ có thể suy luận về kích thước và mật độ payload.

## Nút trạng thái và môi trường

Những điều này hữu ích cho các quy trình “làm cho trang hoạt động như X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (hỗ trợ `set headers --json '{"X-Debug":"1"}'` cũ vẫn được hỗ trợ)
- HTTP basic auth: `set credentials user pass` (hoặc `--clear`)
- Geolocation: `set geo <lat> <lon> --origin "https://example.com"` (hoặc `--clear`)
- Media: `set media dark|light|no-preference|none`
- Timezone / locale: `set timezone ...`, `set locale ...`
- Device / viewport:
  - `set device "iPhone 14"` (preset thiết bị Playwright)
  - `set viewport 1280 720`

## Bảo mật & quyền riêng tư

- Profile trình duyệt openclaw có thể chứa các phiên đã đăng nhập; xem nó như nhạy cảm.
- `browser act kind=evaluate` / `openclaw browser evaluate` và `wait --fn` thực thi JavaScript tùy ý trong ngữ cảnh trang. Tiêm prompt có thể điều khiển điều này. Vô hiệu hóa nó với `browser.evaluateEnabled=false` nếu không cần.
- Đối với đăng nhập và ghi chú chống bot (X/Twitter, v.v.), xem [Đăng nhập trình duyệt + đăng bài X/Twitter](/tools/browser-login).
- Giữ Gateway/node host riêng tư (chỉ loopback hoặc tailnet).
- Các endpoint CDP từ xa rất mạnh mẽ; tunnel và bảo vệ chúng.

Ví dụ chế độ nghiêm ngặt (chặn các điểm đến riêng tư/nội bộ theo mặc định):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // cho phép chính xác tùy chọn
    },
  },
}
```

## Khắc phục sự cố

Đối với các vấn đề cụ thể trên Linux (đặc biệt là snap Chromium), xem
[Khắc phục sự cố trình duyệt](/tools/browser-linux-troubleshooting).

Đối với các thiết lập Gateway WSL2 + Windows Chrome split-host, xem
[Khắc phục sự cố WSL2 + Windows + remote Chrome CDP](/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

## Công cụ agent + cách điều khiển hoạt động

Agent có **một công cụ** cho tự động hóa trình duyệt:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Cách nó ánh xạ:

- `browser snapshot` trả về một cây UI ổn định (AI hoặc ARIA).
- `browser act` sử dụng các ID `ref` snapshot để click/gõ/kéo/chọn.
- `browser screenshot` chụp pixel (toàn trang hoặc phần tử).
- `browser` chấp nhận:
  - `profile` để chọn một profile trình duyệt được đặt tên (openclaw, chrome, hoặc remote CDP).
  - `target` (`sandbox` | `host` | `node`) để chọn nơi trình duyệt sống.
  - Trong các phiên sandboxed, `target: "host"` yêu cầu `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Nếu `target` bị bỏ qua: các phiên sandboxed mặc định là `sandbox`, các phiên không sandbox mặc định là `host`.
  - Nếu một node có khả năng trình duyệt được kết nối, công cụ có thể tự động định tuyến đến nó trừ khi bạn ghim `target="host"` hoặc `target="node"`.

Điều này giữ cho agent xác định và tránh các selector dễ gãy.\n
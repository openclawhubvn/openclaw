---
summary: "Dịch vụ điều khiển trình duyệt tích hợp + lệnh hành động"
read_when:
  - Thêm tự động hóa trình duyệt do agent điều khiển
  - Gỡ lỗi tại sao OpenClaw can thiệp vào Chrome của bạn
  - Triển khai cài đặt trình duyệt + vòng đời trong ứng dụng macOS
title: "Trình duyệt (do OpenClaw quản lý)"
---

# Trình duyệt (do OpenClaw quản lý)

OpenClaw có thể chạy một **hồ sơ Chrome/Brave/Edge/Chromium riêng biệt** mà agent điều khiển. Hồ sơ này được tách biệt khỏi trình duyệt cá nhân của bạn và được quản lý thông qua một dịch vụ điều khiển nhỏ cục bộ bên trong Gateway (chỉ loopback).

Góc nhìn cho người mới bắt đầu:

- Hãy nghĩ về nó như một **trình duyệt riêng biệt chỉ dành cho agent**.
- Hồ sơ `openclaw` **không** can thiệp vào hồ sơ trình duyệt cá nhân của bạn.
- Agent có thể **mở tab, đọc trang, nhấp chuột và gõ** trong một môi trường an toàn.
- Hồ sơ `user` tích hợp kết nối với phiên Chrome đã đăng nhập thực của bạn qua Chrome MCP.

## Những gì bạn nhận được

- Một hồ sơ trình duyệt riêng biệt tên là **openclaw** (mặc định có màu cam).
- Kiểm soát tab có tính quyết định (danh sách/mở/tập trung/đóng).
- Hành động của agent (nhấp/gõ/kéo/chọn), chụp nhanh, chụp màn hình, PDF.
- Hỗ trợ đa hồ sơ tùy chọn (`openclaw`, `work`, `remote`, ...).

Trình duyệt này **không** phải là trình duyệt hàng ngày của bạn. Nó là một môi trường an toàn, tách biệt cho tự động hóa và xác minh của agent.

## Bắt đầu nhanh

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Nếu bạn nhận được thông báo “Trình duyệt bị vô hiệu hóa”, hãy kích hoạt nó trong cấu hình (xem bên dưới) và khởi động lại Gateway.

## Hồ sơ: `openclaw` vs `user`

- `openclaw`: trình duyệt được quản lý, tách biệt (không cần extension).
- `user`: hồ sơ đính kèm Chrome MCP tích hợp cho phiên **Chrome đã đăng nhập thực** của bạn.

Đối với các cuộc gọi công cụ trình duyệt của agent:

- Mặc định: sử dụng trình duyệt `openclaw` tách biệt.
- Ưu tiên `profile="user"` khi các phiên đã đăng nhập hiện có quan trọng và người dùng đang ở máy tính để nhấp/chấp nhận bất kỳ lời nhắc đính kèm nào.
- `profile` là ghi đè rõ ràng khi bạn muốn một chế độ trình duyệt cụ thể.

Đặt `browser.defaultProfile: "openclaw"` nếu bạn muốn chế độ quản lý theo mặc định.

## Cấu hình

Cài đặt trình duyệt nằm trong `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // mặc định: true
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // chế độ mạng tin cậy mặc định
      // allowPrivateNetwork: true, // bí danh cũ
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // ghi đè đơn hồ sơ cũ
    remoteCdpTimeoutMs: 1500, // thời gian chờ HTTP CDP từ xa (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // thời gian chờ bắt tay WebSocket CDP từ xa (ms)
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

Lưu ý:

- Dịch vụ điều khiển trình duyệt kết nối với loopback trên một cổng được lấy từ `gateway.port` (mặc định: `18791`, là gateway + 2).
- Nếu bạn ghi đè cổng Gateway (`gateway.port` hoặc `OPENCLAW_GATEWAY_PORT`), các cổng trình duyệt được lấy sẽ thay đổi để giữ trong cùng một “gia đình”.
- `cdpUrl` mặc định là cổng CDP cục bộ được quản lý khi không được đặt.
- `remoteCdpTimeoutMs` áp dụng cho các kiểm tra khả năng tiếp cận CDP từ xa (không loopback).
- `remoteCdpHandshakeTimeoutMs` áp dụng cho các kiểm tra khả năng tiếp cận WebSocket CDP từ xa.
- Điều hướng/mở tab trình duyệt được bảo vệ SSRF trước khi điều hướng và được kiểm tra lại nỗ lực tốt nhất trên URL `http(s)` cuối cùng sau khi điều hướng.
- Trong chế độ SSRF nghiêm ngặt, khám phá/kiểm tra điểm cuối CDP từ xa (`cdpUrl`, bao gồm tra cứu `/json/version`) cũng được kiểm tra.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` mặc định là `true` (mô hình mạng tin cậy). Đặt nó thành `false` để duyệt chỉ công khai nghiêm ngặt.
- `browser.ssrfPolicy.allowPrivateNetwork` vẫn được hỗ trợ như một bí danh cũ để tương thích.
- `attachOnly: true` có nghĩa là “không bao giờ khởi chạy trình duyệt cục bộ; chỉ đính kèm nếu nó đã chạy.”
- `color` + màu sắc theo hồ sơ làm nổi bật giao diện người dùng trình duyệt để bạn có thể thấy hồ sơ nào đang hoạt động.
- Hồ sơ mặc định là `openclaw` (trình duyệt độc lập do OpenClaw quản lý). Sử dụng `defaultProfile: "user"` để chọn trình duyệt người dùng đã đăng nhập.
- Thứ tự tự động phát hiện: trình duyệt mặc định của hệ thống nếu dựa trên Chromium; nếu không thì Chrome → Brave → Edge → Chromium → Chrome Canary.
- Hồ sơ `openclaw` cục bộ tự động gán `cdpPort`/`cdpUrl` — chỉ đặt những cái đó cho CDP từ xa.
- `driver: "existing-session"` sử dụng Chrome DevTools MCP thay vì CDP thô. Không đặt `cdpUrl` cho driver đó.
- Đặt `browser.profiles.<name>.userDataDir` khi một hồ sơ phiên hiện có nên đính kèm vào một hồ sơ người dùng Chromium không mặc định như Brave hoặc Edge.

## Sử dụng Brave (hoặc trình duyệt khác dựa trên Chromium)

Nếu trình duyệt **mặc định của hệ thống** của bạn là dựa trên Chromium (Chrome/Brave/Edge/v.v.), OpenClaw sẽ tự động sử dụng nó. Đặt `browser.executablePath` để ghi đè tự động phát hiện:

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

## Điều khiển cục bộ vs từ xa

- **Điều khiển cục bộ (mặc định):** Gateway khởi động dịch vụ điều khiển loopback và có thể khởi chạy trình duyệt cục bộ.
- **Điều khiển từ xa (node host):** chạy một node host trên máy có trình duyệt; Gateway chuyển tiếp các hành động trình duyệt đến nó.
- **CDP từ xa:** đặt `browser.profiles.<name>.cdpUrl` (hoặc `browser.cdpUrl`) để đính kèm vào một trình duyệt dựa trên Chromium từ xa. Trong trường hợp này, OpenClaw sẽ không khởi chạy trình duyệt cục bộ.

URL CDP từ xa có thể bao gồm xác thực:

- Token truy vấn (ví dụ: `https://provider.example?token=<token>`)
- Xác thực HTTP Basic (ví dụ: `https://user:pass@provider.example`)

OpenClaw giữ nguyên xác thực khi gọi các điểm cuối `/json/*` và khi kết nối với WebSocket CDP. Ưu tiên sử dụng biến môi trường hoặc trình quản lý bí mật cho token thay vì lưu chúng vào file cấu hình.

## Proxy trình duyệt Node (mặc định không cấu hình)

Nếu bạn chạy một **node host** trên máy có trình duyệt của bạn, OpenClaw có thể tự động định tuyến các cuộc gọi công cụ trình duyệt đến node đó mà không cần cấu hình trình duyệt thêm. Đây là đường dẫn mặc định cho các gateway từ xa.

Lưu ý:

- Node host mở dịch vụ điều khiển trình duyệt cục bộ của nó thông qua một **lệnh proxy**.
- Hồ sơ đến từ cấu hình `browser.profiles` của node (giống như cục bộ).
- Vô hiệu hóa nếu bạn không muốn:
  - Trên node: `nodeHost.browserProxy.enabled=false`
  - Trên gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP từ xa được lưu trữ)

[Browserless](https://browserless.io) là một dịch vụ Chromium được lưu trữ cung cấp các điểm cuối CDP qua HTTPS. Bạn có thể chỉ định một hồ sơ trình duyệt OpenClaw tại một điểm cuối vùng Browserless và xác thực bằng khóa API của bạn.

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

Lưu ý:

- Thay thế `<BROWSERLESS_API_KEY>` bằng token Browserless thực của bạn.
- Chọn điểm cuối vùng phù hợp với tài khoản Browserless của bạn (xem tài liệu của họ).

## Nhà cung cấp CDP WebSocket trực tiếp

Một số dịch vụ trình duyệt được lưu trữ cung cấp một điểm cuối **WebSocket trực tiếp** thay vì khám phá CDP dựa trên HTTP tiêu chuẩn (`/json/version`). OpenClaw hỗ trợ cả hai:

- **Điểm cuối HTTP(S)** (ví dụ: Browserless) — OpenClaw gọi `/json/version` để khám phá URL trình gỡ lỗi WebSocket, sau đó kết nối.
- **Điểm cuối WebSocket** (`ws://` / `wss://`) — OpenClaw kết nối trực tiếp, bỏ qua `/json/version`. Sử dụng điều này cho các dịch vụ như [Browserbase](https://www.browserbase.com) hoặc bất kỳ nhà cung cấp nào cung cấp cho bạn một URL WebSocket.

### Browserbase

[Browserbase](https://www.browserbase.com) là một nền tảng đám mây để chạy các trình duyệt headless với khả năng giải CAPTCHA tích hợp, chế độ ẩn danh và proxy dân cư.

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

Lưu ý:

- [Đăng ký](https://www.browserbase.com/sign-up) và sao chép **API Key** của bạn từ [bảng điều khiển Tổng quan](https://www.browserbase.com/overview).
- Thay thế `<BROWSERBASE_API_KEY>` bằng khóa API Browserbase thực của bạn.
- Browserbase tự động tạo một phiên trình duyệt khi kết nối WebSocket, vì vậy không cần bước tạo phiên thủ công.
- Gói miễn phí cho phép một phiên đồng thời và một giờ trình duyệt mỗi tháng. Xem [giá cả](https://www.browserbase.com/pricing) để biết giới hạn gói trả phí.
- Xem [tài liệu Browserbase](https://docs.browserbase.com) để biết tham chiếu API đầy đủ, hướng dẫn SDK và ví dụ tích hợp.

## Bảo mật

Các ý tưởng chính:

- Điều khiển trình duyệt chỉ qua loopback; truy cập thông qua xác thực của Gateway hoặc ghép nối node.
- Nếu điều khiển trình duyệt được kích hoạt và không có xác thực nào được cấu hình, OpenClaw tự động tạo `gateway.auth.token` khi khởi động và lưu nó vào cấu hình.
- Giữ Gateway và bất kỳ node host nào trên mạng riêng (Tailscale); tránh phơi bày công khai.
- Xem URL/tokens CDP từ xa như bí mật; ưu tiên biến môi trường hoặc trình quản lý bí mật.

Mẹo CDP từ xa:

- Ưu tiên các điểm cuối được mã hóa (HTTPS hoặc WSS) và token ngắn hạn nếu có thể.
- Tránh nhúng token dài hạn trực tiếp vào file cấu hình.

## Hồ sơ (đa trình duyệt)

OpenClaw hỗ trợ nhiều hồ sơ được đặt tên (cấu hình định tuyến). Hồ sơ có thể là:

- **do openclaw quản lý**: một phiên bản trình duyệt dựa trên Chromium chuyên dụng với thư mục dữ liệu người dùng riêng + cổng CDP
- **từ xa**: một URL CDP rõ ràng (trình duyệt dựa trên Chromium chạy ở nơi khác)
- **phiên hiện có**: hồ sơ Chrome hiện có của bạn qua Chrome DevTools MCP tự động kết nối

Mặc định:

- Hồ sơ `openclaw` được tự động tạo nếu thiếu.
- Hồ sơ `user` được tích hợp sẵn cho đính kèm phiên hiện có của Chrome MCP.
- Hồ sơ phiên hiện có là tùy chọn ngoài `user`; tạo chúng với `--driver existing-session`.
- Các cổng CDP cục bộ phân bổ từ **18800–18899** theo mặc định.
- Xóa một hồ sơ sẽ di chuyển thư mục dữ liệu cục bộ của nó vào Thùng rác.

Tất cả các điểm cuối điều khiển chấp nhận `?profile=<name>`; CLI sử dụng `--browser-profile`.

## Phiên hiện có qua Chrome DevTools MCP

OpenClaw cũng có thể đính kèm vào một hồ sơ trình duyệt dựa trên Chromium đang chạy thông qua máy chủ Chrome DevTools MCP chính thức. Điều này tái sử dụng các tab và trạng thái đăng nhập đã mở trong hồ sơ trình duyệt đó.

Tham khảo nền tảng và thiết lập chính thức:

- [Chrome for Developers: Sử dụng Chrome DevTools MCP với phiên trình duyệt của bạn](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Hồ sơ tích hợp:

- `user`

Tùy chọn: tạo hồ sơ phiên hiện có tùy chỉnh của riêng bạn nếu bạn muốn tên, màu sắc hoặc thư mục dữ liệu trình duyệt khác.

Hành vi mặc định:

- Hồ sơ `user` tích hợp sử dụng Chrome MCP tự động kết nối, nhắm mục tiêu hồ sơ Google Chrome cục bộ mặc định.

Sử dụng `userDataDir` cho Brave, Edge, Chromium hoặc hồ sơ Chrome không mặc định:

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

1. Mở trang kiểm tra của trình duyệt đó để gỡ lỗi từ xa.
2. Kích hoạt gỡ lỗi từ xa.
3. Giữ trình duyệt chạy và chấp nhận lời nhắc kết nối khi OpenClaw đính kèm.

Các trang kiểm tra phổ biến:

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

Những gì cần kiểm tra nếu đính kèm không hoạt động:

- trình duyệt dựa trên Chromium mục tiêu là phiên bản `144+`
- gỡ lỗi từ xa được kích hoạt trong trang kiểm tra của trình duyệt đó
- trình duyệt đã hiển thị và bạn đã chấp nhận lời nhắc đính kèm
- `openclaw doctor` di chuyển cấu hình trình duyệt dựa trên extension cũ và kiểm tra rằng Chrome được cài đặt cục bộ cho các hồ sơ tự động kết nối mặc định, nhưng nó không thể kích hoạt gỡ lỗi từ xa phía trình duyệt cho bạn

Sử dụng agent:

- Sử dụng `profile="user"` khi bạn cần trạng thái trình duyệt đã đăng nhập của người dùng.
- Nếu bạn sử dụng hồ sơ phiên hiện có tùy chỉnh, hãy truyền tên hồ sơ rõ ràng đó.
- Chỉ chọn chế độ này khi người dùng đang ở máy tính để chấp nhận lời nhắc đính kèm.
- Gateway hoặc node host có thể khởi chạy `npx chrome-devtools-mcp@latest --autoConnect`

Lưu ý:

- Đường dẫn này có rủi ro cao hơn so với hồ sơ `openclaw` tách biệt vì nó có thể hoạt động bên trong phiên trình duyệt đã đăng nhập của bạn.
- OpenClaw không khởi chạy trình duyệt cho driver này; nó chỉ đính kèm vào một phiên hiện có.
- OpenClaw sử dụng luồng `--autoConnect` của Chrome DevTools MCP chính thức ở đây. Nếu `userDataDir` được đặt, OpenClaw truyền nó để nhắm mục tiêu thư mục dữ liệu người dùng Chromium rõ ràng đó.
- Ảnh chụp màn hình phiên hiện có hỗ trợ chụp trang và chụp phần tử từ ảnh chụp nhanh, nhưng không hỗ trợ bộ chọn CSS `--element`.
- Phiên hiện có `wait --url` hỗ trợ các mẫu chính xác, chuỗi con và glob như các driver trình duyệt khác. `wait --load networkidle` chưa được hỗ trợ.
- Một số tính năng vẫn yêu cầu đường dẫn trình duyệt được quản lý, chẳng hạn như xuất PDF và chặn tải xuống.
- Phiên hiện có là cục bộ máy chủ. Nếu Chrome nằm trên một máy khác hoặc một không gian tên mạng khác, hãy sử dụng CDP từ xa hoặc một node host thay thế.

## Đảm bảo cách ly

- **Thư mục dữ liệu người dùng chuyên dụng**: không bao giờ can thiệp vào hồ sơ trình duyệt cá nhân của bạn.
- **Cổng chuyên dụng**: tránh `9222` để ngăn ngừa xung đột với các luồng công việc phát triển.
- **Kiểm soát tab có tính quyết định**: nhắm mục tiêu các tab bằng `targetId`, không phải “tab cuối cùng”.

## Lựa chọn trình duyệt

Khi khởi chạy cục bộ, OpenClaw chọn trình duyệt có sẵn đầu tiên:

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

Chỉ dành cho tích hợp cục bộ, Gateway cung cấp một API HTTP loopback nhỏ:

- Trạng thái/bắt đầu/dừng: `GET /`, `POST /start`, `POST /stop`
- Tab: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Chụp nhanh/chụp màn hình: `GET /snapshot`, `POST /screenshot`
- Hành động: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Tải xuống: `POST /download`, `POST /wait/download`
- Gỡ lỗi: `GET /console`, `POST /pdf`
- Gỡ lỗi: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Mạng: `POST /response/body`
- Trạng thái: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Trạng thái: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Cài đặt: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Tất cả các điểm cuối chấp nhận `?profile=<name>`.

Nếu xác thực gateway được cấu hình, các tuyến HTTP trình duyệt cũng yêu cầu xác thực:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` hoặc xác thực HTTP Basic với mật khẩu đó

### Yêu cầu Playwright

Một số tính năng (điều hướng/hành động/ảnh chụp nhanh AI/ảnh chụp nhanh vai trò, ảnh chụp màn hình phần tử, PDF) yêu cầu Playwright. Nếu Playwright không được cài đặt, các điểm cuối đó sẽ trả về lỗi 501 rõ ràng. Ảnh chụp nhanh ARIA và ảnh chụp màn hình cơ bản vẫn hoạt động cho Chrome do openclaw quản lý.

Nếu bạn thấy `Playwright is not available in this gateway build`, hãy cài đặt gói Playwright đầy đủ (không phải `playwright-core`) và khởi động lại gateway, hoặc cài đặt lại OpenClaw với hỗ trợ trình duyệt.

#### Cài đặt Docker Playwright

Nếu Gateway của bạn chạy trong Docker, tránh `npx playwright` (xung đột ghi đè npm). Sử dụng CLI đi kèm thay thế:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Để duy trì các tải xuống trình duyệt, đặt `PLAYWRIGHT_BROWSERS_PATH` (ví dụ, `/home/node/.cache/ms-playwright`) và đảm bảo `/home/node` được duy trì thông qua `OPENCLAW_HOME_VOLUME` hoặc một mount bind. Xem [Docker](/install/docker).

## Cách hoạt động (nội bộ)

Luồng cấp cao:

- Một **máy chủ điều khiển nhỏ** chấp nhận các yêu cầu HTTP.
- Nó kết nối với các trình duyệt dựa trên Chromium (Chrome/Brave/Edge/Chromium) qua **CDP**.
- Đối với các hành động nâng cao (nhấp/gõ/ảnh chụp nhanh/PDF), nó sử dụng **Playwright** trên CDP.
- Khi Playwright bị thiếu, chỉ các hoạt động không phải Playwright mới có sẵn.

Thiết kế này giữ cho agent trên một giao diện ổn định, có tính quyết định trong khi cho phép bạn hoán đổi các trình duyệt và hồ sơ cục bộ/từ xa.

## Tham khảo nhanh CLI

Tất cả các lệnh chấp nhận `--browser-profile <name>` để nhắm mục tiêu một hồ sơ cụ thể. Tất cả các lệnh cũng chấp nhận `--json` để xuất đầu ra có thể đọc được bằng máy (payload ổn định).

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

Lưu ý:

- `upload` và `dialog` là các cuộc gọi **arming**; chạy chúng trước khi nhấp/nhấn kích hoạt bộ chọn/hộp thoại.
- Đường dẫn đầu ra tải xuống và theo dõi bị giới hạn trong các gốc tạm thời của OpenClaw:
  - theo dõi: `/tmp/openclaw` (dự phòng: `${os.tmpdir()}/openclaw`)
  - tải xuống: `/tmp/openclaw/downloads` (dự phòng: `${os.tmpdir()}/openclaw/downloads`)
- Đường dẫn tải lên bị giới hạn trong một gốc tải lên tạm thời của OpenClaw:
  - tải lên: `/tmp/openclaw/uploads` (dự phòng: `${os.tmpdir()}/openclaw/uploads`)
- `upload` cũng có thể đặt trực tiếp các đầu vào file qua `--input-ref` hoặc `--element`.
- `snapshot`:
  - `--format ai` (mặc định khi Playwright được cài đặt): trả về một ảnh chụp nhanh AI với các tham chiếu số (`aria-ref="<n>"`).
  - `--format aria`: trả về cây truy cập (không có tham chiếu; chỉ kiểm tra).
  - `--efficient` (hoặc `--mode efficient`): cài đặt trước ảnh chụp nhanh vai trò gọn nhẹ (tương tác + gọn nhẹ + độ sâu + maxChars thấp hơn).
  - Mặc định cấu hình (chỉ công cụ/CLI): đặt `browser.snapshotDefaults.mode: "efficient"` để sử dụng ảnh chụp nhanh hiệu quả khi người gọi không truyền chế độ (xem [Cấu hình Gateway](/gateway/configuration-reference#browser)).
  - Các tùy chọn ảnh chụp nhanh vai trò (`--interactive`, `--compact`, `--depth`, `--selector`) buộc một ảnh chụp nhanh dựa trên vai trò với các tham chiếu như `ref=e12`.
  - `--frame "<iframe selector>"` giới hạn ảnh chụp nhanh vai trò vào một iframe (kết hợp với các tham chiếu vai trò như `e12`).
  - `--interactive` xuất một danh sách phẳng, dễ chọn các phần tử tương tác (tốt nhất để thực hiện hành động).
  - `--labels` thêm một ảnh chụp màn hình chỉ có viewport với các nhãn tham chiếu được phủ lên (in `MEDIA:<path>`).
- `click`/`type`/v.v. yêu cầu một `ref` từ `snapshot` (hoặc số `12` hoặc tham chiếu vai trò `e12`).
  Các bộ chọn CSS không được hỗ trợ cho các hành động.

## Ảnh chụp nhanh và tham chiếu

OpenClaw hỗ trợ hai kiểu “ảnh chụp nhanh”:

- **Ảnh chụp nhanh AI (tham chiếu số)**: `openclaw browser snapshot` (mặc định; `--format ai`)
  - Đầu ra: một ảnh chụp nhanh văn bản bao gồm các tham chiếu số.
  - Hành động: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Nội bộ, tham chiếu được giải quyết qua `aria-ref` của Playwright.

- **Ảnh chụp nhanh vai trò (tham chiếu vai trò như `e12`)**: `openclaw browser snapshot --interactive` (hoặc `--compact`, `--depth`, `--selector`, `--frame`)
  - Đầu ra: một danh sách/cây dựa trên vai trò với `[ref=e12]` (và tùy chọn `[nth=1]`).
  - Hành động: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Nội bộ, tham chiếu được giải quyết qua `getByRole(...)` (cộng với `nth()` cho các bản sao).
  - Thêm `--labels` để bao gồm một ảnh chụp màn hình viewport với các nhãn `e12` được phủ lên.

Hành vi tham chiếu:

- Tham chiếu **không ổn định qua các điều hướng**; nếu có gì đó thất bại, chạy lại `snapshot` và sử dụng một tham chiếu mới.
- Nếu ảnh chụp nhanh vai trò được thực hiện với `--frame`, các tham chiếu vai trò được giới hạn trong iframe đó cho đến ảnh chụp nhanh vai trò tiếp theo.

## Tăng cường chờ

Bạn có thể chờ đợi nhiều hơn chỉ thời gian/văn bản:

- Chờ URL (hỗ trợ glob bởi Playwright):
  - `openclaw browser wait --url "**/dash"`
- Chờ trạng thái tải:
  - `openclaw browser wait --load networkidle`
- Chờ một điều kiện JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Chờ một bộ chọn trở nên hiển thị:
  - `openclaw browser wait "#main"`

Những điều này có thể được kết hợp:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Quy trình gỡ lỗi

Khi một hành động thất bại (ví dụ: “không hiển thị”, “vi phạm chế độ nghiêm ngặt”, “bị che phủ”):

1. `openclaw browser snapshot --interactive`
2. Sử dụng `click <ref>` / `type <ref>` (ưu tiên tham chiếu vai trò trong chế độ tương tác)
3. Nếu vẫn thất bại: `openclaw browser highlight <ref>` để xem Playwright đang nhắm mục tiêu gì
4. Nếu trang hoạt động kỳ lạ:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Để gỡ lỗi sâu: ghi lại một dấu vết:
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

Ảnh chụp nhanh vai trò trong JSON bao gồm `refs` cộng với một khối `stats` nhỏ (dòng/ký tự/refs/tương tác) để các công cụ có thể suy luận về kích thước và mật độ payload.

## Các nút trạng thái và môi trường

Những điều này hữu ích cho các quy trình “làm cho trang web hoạt động như X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Lưu trữ: `storage local|session get|set|clear`
- Ngoại tuyến: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (hỗ trợ `set headers --json '{"X-Debug":"1"}'` cũ vẫn được hỗ trợ)
- Xác thực HTTP cơ bản: `set credentials user pass` (hoặc `--clear`)
- Định vị địa lý: `set geo <lat> <lon> --origin "https://example.com"` (hoặc `--clear`)
- Phương tiện: `set media dark|light|no-preference|none`
- Múi giờ / ngôn ngữ: `set timezone ...`, `set locale ...`
- Thiết bị / viewport:
  - `set device "iPhone 14"` (cài đặt trước thiết bị Playwright)
  - `set viewport 1280 720`

## Bảo mật & quyền riêng tư

- Hồ sơ trình duyệt openclaw có thể chứa các phiên đã đăng nhập; coi nó là nhạy cảm.
- `browser act kind=evaluate` / `openclaw browser evaluate` và `wait --fn` thực thi JavaScript tùy ý trong ngữ cảnh trang. Tiêm lệnh có thể điều khiển điều này. Vô hiệu hóa nó với `browser.evaluateEnabled=false` nếu bạn không cần.
- Đối với đăng nhập và ghi chú chống bot (X/Twitter, v.v.), xem [Đăng nhập trình duyệt + đăng bài X/Twitter](/tools/browser-login).
- Giữ Gateway/node host riêng tư (chỉ loopback hoặc tailnet).
- Các điểm cuối CDP từ xa rất mạnh; đường hầm và bảo vệ chúng.

Ví dụ chế độ nghiêm ngặt (chặn các điểm đến riêng tư/nội bộ theo mặc định):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // tùy chọn cho phép chính xác
    },
  },
}
```

## Gỡ lỗi

Đối với các vấn đề cụ thể của Linux (đặc biệt là snap Chromium), xem [Gỡ lỗi trình duyệt](/tools/browser-linux-troubleshooting).

Đối với các thiết lập Gateway WSL2 + Windows Chrome chia máy chủ, xem [Gỡ lỗi WSL2 + Windows + remote Chrome CDP](/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

## Công cụ agent + cách điều khiển hoạt động

Agent có **một công cụ** cho tự động hóa trình duyệt:

- `browser` — trạng thái/bắt đầu/dừng/tabs/mở/tập trung/đóng/ảnh chụp nhanh/chụp màn hình/điều hướng/hành động

Cách nó ánh xạ:

- `browser snapshot` trả về một cây UI ổn định (AI hoặc ARIA).
- `browser act` sử dụng các ID `ref` từ ảnh chụp nhanh để nhấp/gõ/kéo/chọn.
- `browser screenshot` chụp ảnh (toàn trang hoặc phần tử).
- `browser` chấp nhận:
  - `profile` để chọn một hồ sơ trình duyệt được đặt tên (openclaw, chrome, hoặc CDP từ xa).
  - `target` (`sandbox` | `host` | `node`) để chọn nơi trình duyệt sống.
  - Trong các phiên sandboxed, `target: "host"` yêu cầu `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Nếu `target` bị bỏ qua: các phiên sandboxed mặc định là `sandbox`, các phiên không sandbox mặc định là `host`.
  - Nếu một node có khả năng trình duyệt được kết nối, công cụ có thể tự động định tuyến đến nó trừ khi bạn ghim `target="host"` hoặc `target="node"`.

Điều này giữ cho agent có tính quyết định và tránh các bộ chọn dễ vỡ.

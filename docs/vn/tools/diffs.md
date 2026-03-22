---
title: "Diffs"
summary: "Trình xem diff chỉ đọc và trình kết xuất file cho agents (plugin tùy chọn)"
read_when:
  - Bạn muốn agents hiển thị chỉnh sửa mã hoặc markdown dưới dạng diff
  - Bạn cần URL xem sẵn sàng cho canvas hoặc file diff đã kết xuất
  - Bạn cần các artifact diff tạm thời, được kiểm soát với các thiết lập bảo mật mặc định
---

# Diffs

`diffs` là một công cụ plugin tùy chọn với hướng dẫn hệ thống tích hợp ngắn gọn và một kỹ năng đi kèm để biến nội dung thay đổi thành một artifact diff chỉ đọc cho agents.

Nó chấp nhận:

- văn bản `before` và `after`
- một `patch` hợp nhất

Nó có thể trả về:

- một URL trình xem gateway cho trình bày trên canvas
- một đường dẫn file đã kết xuất (PNG hoặc PDF) để gửi tin nhắn
- cả hai đầu ra trong một lần gọi

Khi được kích hoạt, plugin sẽ thêm hướng dẫn sử dụng ngắn gọn vào không gian nhắc nhở hệ thống và cũng cung cấp một kỹ năng chi tiết cho các trường hợp agent cần hướng dẫn đầy đủ hơn.

## Bắt đầu nhanh

1. Kích hoạt plugin.
2. Gọi `diffs` với `mode: "view"` cho các luồng ưu tiên canvas.
3. Gọi `diffs` với `mode: "file"` cho các luồng gửi file qua chat.
4. Gọi `diffs` với `mode: "both"` khi cần cả hai loại artifact.

## Kích hoạt plugin

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
      },
    },
  },
}
```

## Vô hiệu hóa hướng dẫn hệ thống tích hợp

Nếu muốn giữ công cụ `diffs` hoạt động nhưng vô hiệu hóa hướng dẫn nhắc nhở hệ thống tích hợp, đặt `plugins.entries.diffs.hooks.allowPromptInjection` thành `false`:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
      },
    },
  },
}
```

Điều này chặn hook `before_prompt_build` của plugin diffs trong khi vẫn giữ plugin, công cụ và kỹ năng đi kèm sẵn có.

Nếu muốn vô hiệu hóa cả hướng dẫn và công cụ, hãy vô hiệu hóa plugin.

## Quy trình làm việc điển hình của agent

1. Agent gọi `diffs`.
2. Agent đọc các trường `details`.
3. Agent thực hiện một trong các hành động sau:
   - mở `details.viewerUrl` với `canvas present`
   - gửi `details.filePath` với `message` sử dụng `path` hoặc `filePath`
   - thực hiện cả hai

## Ví dụ đầu vào

Trước và sau:

```json
{
  "before": "# Hello\n\nOne",
  "after": "# Hello\n\nTwo",
  "path": "docs/example.md",
  "mode": "view"
}
```

Patch:

```json
{
  "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
  "mode": "both"
}
```

## Tham khảo đầu vào công cụ

Tất cả các trường đều tùy chọn trừ khi được ghi chú:

- `before` (`string`): văn bản gốc. Bắt buộc với `after` khi `patch` bị bỏ qua.
- `after` (`string`): văn bản đã cập nhật. Bắt buộc với `before` khi `patch` bị bỏ qua.
- `patch` (`string`): văn bản diff hợp nhất. Không thể dùng chung với `before` và `after`.
- `path` (`string`): tên file hiển thị cho chế độ trước và sau.
- `lang` (`string`): gợi ý ghi đè ngôn ngữ cho chế độ trước và sau.
- `title` (`string`): ghi đè tiêu đề trình xem.
- `mode` (`"view" | "file" | "both"`): chế độ đầu ra. Mặc định là `defaults.mode` của plugin.
  Alias đã ngừng sử dụng: `"image"` hoạt động như `"file"` và vẫn được chấp nhận để tương thích ngược.
- `theme` (`"light" | "dark"`): chủ đề trình xem. Mặc định là `defaults.theme` của plugin.
- `layout` (`"unified" | "split"`): bố cục diff. Mặc định là `defaults.layout` của plugin.
- `expandUnchanged` (`boolean`): mở rộng các phần không thay đổi khi có đầy đủ ngữ cảnh. Chỉ tùy chọn theo từng lần gọi (không phải khóa mặc định của plugin).
- `fileFormat` (`"png" | "pdf"`): định dạng file đã kết xuất. Mặc định là `defaults.fileFormat` của plugin.
- `fileQuality` (`"standard" | "hq" | "print"`): thiết lập chất lượng cho kết xuất PNG hoặc PDF.
- `fileScale` (`number`): ghi đè tỷ lệ thiết bị (`1`-`4`).
- `fileMaxWidth` (`number`): chiều rộng kết xuất tối đa tính bằng pixel CSS (`640`-`2400`).
- `ttlSeconds` (`number`): thời gian tồn tại của artifact trình xem tính bằng giây. Mặc định 1800, tối đa 21600.
- `baseUrl` (`string`): ghi đè nguồn URL trình xem. Phải là `http` hoặc `https`, không có query/hash.

Xác thực và giới hạn:

- `before` và `after` mỗi cái tối đa 512 KiB.
- `patch` tối đa 2 MiB.
- `path` tối đa 2048 byte.
- `lang` tối đa 128 byte.
- `title` tối đa 1024 byte.
- Giới hạn độ phức tạp của patch: tối đa 128 file và 120000 dòng tổng cộng.
- `patch` và `before` hoặc `after` cùng nhau sẽ bị từ chối.
- Giới hạn an toàn của file đã kết xuất (áp dụng cho PNG và PDF):
  - `fileQuality: "standard"`: tối đa 8 MP (8,000,000 pixel đã kết xuất).
  - `fileQuality: "hq"`: tối đa 14 MP (14,000,000 pixel đã kết xuất).
  - `fileQuality: "print"`: tối đa 24 MP (24,000,000 pixel đã kết xuất).
  - PDF cũng có tối đa 50 trang.

## Hợp đồng chi tiết đầu ra

Công cụ trả về metadata có cấu trúc dưới `details`.

Các trường chung cho các chế độ tạo trình xem:

- `artifactId`
- `viewerUrl`
- `viewerPath`
- `title`
- `expiresAt`
- `inputKind`
- `fileCount`
- `mode`
- `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId` khi có)

Các trường file khi PNG hoặc PDF được kết xuất:

- `artifactId`
- `expiresAt`
- `filePath`
- `path` (giá trị giống như `filePath`, để tương thích với công cụ tin nhắn)
- `fileBytes`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`

Tóm tắt hành vi chế độ:

- `mode: "view"`: chỉ các trường trình xem.
- `mode: "file"`: chỉ các trường file, không có artifact trình xem.
- `mode: "both"`: các trường trình xem cộng với các trường file. Nếu kết xuất file thất bại, trình xem vẫn trả về với `fileError`.

## Các phần không thay đổi bị thu gọn

- Trình xem có thể hiển thị các hàng như `N dòng không thay đổi`.
- Các điều khiển mở rộng trên các hàng đó là có điều kiện và không được đảm bảo cho mọi loại đầu vào.
- Các điều khiển mở rộng xuất hiện khi diff đã kết xuất có dữ liệu ngữ cảnh có thể mở rộng, điều này thường xảy ra với đầu vào trước và sau.
- Đối với nhiều đầu vào patch hợp nhất, các phần thân ngữ cảnh bị bỏ qua không có sẵn trong các hunk patch đã phân tích, vì vậy hàng có thể xuất hiện mà không có điều khiển mở rộng. Đây là hành vi mong đợi.
- `expandUnchanged` chỉ áp dụng khi có ngữ cảnh có thể mở rộng.

## Mặc định của plugin

Đặt các mặc định toàn plugin trong `~/.openclaw/openclaw.json`:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          defaults: {
            fontFamily: "Fira Code",
            fontSize: 15,
            lineSpacing: 1.6,
            layout: "unified",
            showLineNumbers: true,
            diffIndicators: "bars",
            wordWrap: true,
            background: true,
            theme: "dark",
            fileFormat: "png",
            fileQuality: "standard",
            fileScale: 2,
            fileMaxWidth: 960,
            mode: "both",
          },
        },
      },
    },
  },
}
```

Các mặc định được hỗ trợ:

- `fontFamily`
- `fontSize`
- `lineSpacing`
- `layout`
- `showLineNumbers`
- `diffIndicators`
- `wordWrap`
- `background`
- `theme`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`
- `mode`

Các tham số công cụ rõ ràng sẽ ghi đè các mặc định này.

## Cấu hình bảo mật

- `security.allowRemoteViewer` (`boolean`, mặc định `false`)
  - `false`: các yêu cầu không phải loopback đến các tuyến trình xem bị từ chối.
  - `true`: các trình xem từ xa được cho phép nếu đường dẫn có token hợp lệ.

Ví dụ:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          security: {
            allowRemoteViewer: false,
          },
        },
      },
    },
  },
}
```

## Vòng đời và lưu trữ artifact

- Các artifact được lưu trữ dưới thư mục tạm: `$TMPDIR/openclaw-diffs`.
- Metadata artifact trình xem chứa:
  - ID artifact ngẫu nhiên (20 ký tự hex)
  - token ngẫu nhiên (48 ký tự hex)
  - `createdAt` và `expiresAt`
  - đường dẫn `viewer.html` đã lưu trữ
- Thời gian tồn tại mặc định của trình xem là 30 phút khi không được chỉ định.
- Thời gian tồn tại tối đa được chấp nhận của trình xem là 6 giờ.
- Dọn dẹp chạy theo cơ hội sau khi tạo artifact.
- Các artifact hết hạn sẽ bị xóa.
- Dọn dẹp dự phòng loại bỏ các thư mục cũ hơn 24 giờ khi thiếu metadata.

## URL trình xem và hành vi mạng

Tuyến trình xem:

- `/plugins/diffs/view/{artifactId}/{token}`

Tài sản trình xem:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Hành vi xây dựng URL:

- Nếu `baseUrl` được cung cấp, nó sẽ được sử dụng sau khi xác thực nghiêm ngặt.
- Không có `baseUrl`, URL trình xem mặc định là loopback `127.0.0.1`.
- Nếu chế độ bind gateway là `custom` và `gateway.customBindHost` được đặt, host đó sẽ được sử dụng.

Quy tắc `baseUrl`:

- Phải là `http://` hoặc `https://`.
- Query và hash bị từ chối.
- Chỉ cho phép nguồn cộng với đường dẫn cơ sở tùy chọn.

## Mô hình bảo mật

Củng cố trình xem:

- Chỉ loopback theo mặc định.
- Đường dẫn trình xem có token với xác thực ID và token nghiêm ngặt.
- CSP phản hồi trình xem:
  - `default-src 'none'`
  - chỉ cho phép script và tài sản từ chính nó
  - không có `connect-src` ra ngoài
- Giới hạn lỗi từ xa khi truy cập từ xa được bật:
  - 40 lỗi mỗi 60 giây
  - khóa 60 giây (`429 Too Many Requests`)

Củng cố kết xuất file:

- Định tuyến yêu cầu trình duyệt chụp màn hình bị từ chối theo mặc định.
- Chỉ cho phép tài sản trình xem cục bộ từ `http://127.0.0.1/plugins/diffs/assets/*`.
- Các yêu cầu mạng bên ngoài bị chặn.

## Yêu cầu trình duyệt cho chế độ file

`mode: "file"` và `mode: "both"` cần một trình duyệt tương thích với Chromium.

Thứ tự giải quyết:

1. `browser.executablePath` trong cấu hình OpenClaw.
2. Các biến môi trường:
   - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
   - `BROWSER_EXECUTABLE_PATH`
   - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
3. Dự phòng phát hiện lệnh/đường dẫn nền tảng.

Văn bản lỗi phổ biến:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Khắc phục bằng cách cài đặt Chrome, Chromium, Edge, hoặc Brave, hoặc thiết lập một trong các tùy chọn đường dẫn thực thi trên.

## Khắc phục sự cố

Lỗi xác thực đầu vào:

- `Provide patch or both before and after text.`
  - Bao gồm cả `before` và `after`, hoặc cung cấp `patch`.
- `Provide either patch or before/after input, not both.`
  - Không trộn lẫn các chế độ đầu vào.
- `Invalid baseUrl: ...`
  - Sử dụng nguồn `http(s)` với đường dẫn tùy chọn, không có query/hash.
- `{field} exceeds maximum size (...)`
  - Giảm kích thước tải.
- Từ chối patch lớn
  - Giảm số lượng file patch hoặc tổng số dòng.

Vấn đề truy cập trình xem:

- URL trình xem mặc định là `127.0.0.1`.
- Đối với các kịch bản truy cập từ xa, hoặc:
  - truyền `baseUrl` cho mỗi lần gọi công cụ, hoặc
  - sử dụng `gateway.bind=custom` và `gateway.customBindHost`
- Chỉ bật `security.allowRemoteViewer` khi bạn dự định truy cập trình xem từ xa.

Hàng dòng không thay đổi không có nút mở rộng:

- Điều này có thể xảy ra đối với đầu vào patch khi patch không mang ngữ cảnh có thể mở rộng.
- Đây là hành vi mong đợi và không chỉ ra lỗi của trình xem.

Artifact không tìm thấy:

- Artifact đã hết hạn do TTL.
- Token hoặc đường dẫn đã thay đổi.
- Dọn dẹp đã loại bỏ dữ liệu cũ.

## Hướng dẫn vận hành

- Ưu tiên `mode: "view"` cho các đánh giá tương tác cục bộ trong canvas.
- Ưu tiên `mode: "file"` cho các kênh chat ra ngoài cần đính kèm.
- Giữ `allowRemoteViewer` bị vô hiệu hóa trừ khi triển khai của bạn yêu cầu URL trình xem từ xa.
- Đặt `ttlSeconds` ngắn rõ ràng cho các diff nhạy cảm.
- Tránh gửi các bí mật trong đầu vào diff khi không cần thiết.
- Nếu kênh của bạn nén hình ảnh mạnh mẽ (ví dụ Telegram hoặc WhatsApp), ưu tiên đầu ra PDF (`fileFormat: "pdf"`).

Công cụ kết xuất diff:

- Được hỗ trợ bởi [Diffs](https://diffs.com).

## Tài liệu liên quan

- [Tổng quan về công cụ](/tools)
- [Plugins](/tools/plugin)
- [Trình duyệt](/tools/browser)

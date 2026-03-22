---
title: "Diffs"
summary: "Công cụ xem diff chỉ đọc và render file cho agents (plugin tùy chọn)"
read_when:
  - Cần agents hiển thị chỉnh sửa code hoặc markdown dưới dạng diff
  - Cần URL viewer sẵn sàng cho canvas hoặc file diff đã render
  - Cần diff tạm thời với thiết lập bảo mật mặc định
---

# Diffs

`diffs` là plugin tùy chọn với hướng dẫn hệ thống tích hợp ngắn gọn và kỹ năng đi kèm, chuyển nội dung thay đổi thành artifact diff chỉ đọc cho agents.

Nhận đầu vào:

- Text `before` và `after`
- `patch` thống nhất

Trả về:

- URL viewer qua gateway cho trình bày canvas
- Đường dẫn file đã render (PNG hoặc PDF) để gửi tin nhắn
- Cả hai đầu ra trong một lần gọi

Khi bật, plugin thêm hướng dẫn sử dụng ngắn gọn vào không gian prompt hệ thống và cung cấp kỹ năng chi tiết khi agent cần hướng dẫn đầy đủ.

## Bắt đầu nhanh

1. Bật plugin.
2. Gọi `diffs` với `mode: "view"` cho luồng ưu tiên canvas.
3. Gọi `diffs` với `mode: "file"` cho luồng gửi file chat.
4. Gọi `diffs` với `mode: "both"` khi cần cả hai artifact.

## Bật plugin

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

## Tắt hướng dẫn hệ thống tích hợp

Nếu muốn giữ `diffs` hoạt động nhưng tắt hướng dẫn hệ thống tích hợp, đặt `plugins.entries.diffs.hooks.allowPromptInjection` thành `false`:

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

Điều này chặn hook `before_prompt_build` của plugin diffs nhưng vẫn giữ plugin, công cụ và kỹ năng đi kèm hoạt động.

Nếu muốn tắt cả hướng dẫn và công cụ, hãy tắt plugin.

## Quy trình làm việc của agent

1. Agent gọi `diffs`.
2. Agent đọc trường `details`.
3. Agent thực hiện:
   - mở `details.viewerUrl` với `canvas present`
   - gửi `details.filePath` với `message` dùng `path` hoặc `filePath`
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

## Tham chiếu đầu vào công cụ

Tất cả các trường đều tùy chọn trừ khi được ghi chú:

- `before` (`string`): text gốc. Bắt buộc với `after` khi `patch` bị bỏ qua.
- `after` (`string`): text cập nhật. Bắt buộc với `before` khi `patch` bị bỏ qua.
- `patch` (`string`): text diff thống nhất. Không thể dùng cùng với `before` và `after`.
- `path` (`string`): tên file hiển thị cho chế độ before và after.
- `lang` (`string`): gợi ý ngôn ngữ cho chế độ before và after.
- `title` (`string`): tiêu đề viewer tùy chỉnh.
- `mode` (`"view" | "file" | "both"`): chế độ đầu ra. Mặc định là `defaults.mode` của plugin.
  Alias đã lỗi thời: `"image"` hoạt động như `"file"` và vẫn được chấp nhận để tương thích ngược.
- `theme` (`"light" | "dark"`): theme viewer. Mặc định là `defaults.theme` của plugin.
- `layout` (`"unified" | "split"`): bố cục diff. Mặc định là `defaults.layout` của plugin.
- `expandUnchanged` (`boolean`): mở rộng các phần không thay đổi khi có ngữ cảnh đầy đủ. Chỉ tùy chọn theo lần gọi (không phải khóa mặc định của plugin).
- `fileFormat` (`"png" | "pdf"`): định dạng file đã render. Mặc định là `defaults.fileFormat` của plugin.
- `fileQuality` (`"standard" | "hq" | "print"`): thiết lập chất lượng cho render PNG hoặc PDF.
- `fileScale` (`number`): ghi đè tỷ lệ thiết bị (`1`-`4`).
- `fileMaxWidth` (`number`): chiều rộng render tối đa tính bằng pixel CSS (`640`-`2400`).
- `ttlSeconds` (`number`): TTL artifact viewer tính bằng giây. Mặc định 1800, tối đa 21600.
- `baseUrl` (`string`): ghi đè nguồn URL viewer. Phải là `http` hoặc `https`, không có query/hash.

Xác thực và giới hạn:

- `before` và `after` mỗi cái tối đa 512 KiB.
- `patch` tối đa 2 MiB.
- `path` tối đa 2048 byte.
- `lang` tối đa 128 byte.
- `title` tối đa 1024 byte.
- Giới hạn độ phức tạp của patch: tối đa 128 file và 120000 dòng tổng cộng.
- `patch` và `before` hoặc `after` cùng nhau bị từ chối.
- Giới hạn an toàn file đã render (áp dụng cho PNG và PDF):
  - `fileQuality: "standard"`: tối đa 8 MP (8,000,000 pixel render).
  - `fileQuality: "hq"`: tối đa 14 MP (14,000,000 pixel render).
  - `fileQuality: "print"`: tối đa 24 MP (24,000,000 pixel render).
  - PDF cũng có tối đa 50 trang.

## Hợp đồng chi tiết đầu ra

Công cụ trả về metadata có cấu trúc dưới `details`.

Trường chung cho các chế độ tạo viewer:

- `artifactId`
- `viewerUrl`
- `viewerPath`
- `title`
- `expiresAt`
- `inputKind`
- `fileCount`
- `mode`
- `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId` khi có)

Trường file khi PNG hoặc PDF được render:

- `artifactId`
- `expiresAt`
- `filePath`
- `path` (giá trị giống `filePath`, để tương thích công cụ tin nhắn)
- `fileBytes`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`

Tóm tắt hành vi chế độ:

- `mode: "view"`: chỉ trường viewer.
- `mode: "file"`: chỉ trường file, không có artifact viewer.
- `mode: "both"`: trường viewer cộng với trường file. Nếu render file thất bại, viewer vẫn trả về với `fileError`.

## Phần không thay đổi bị thu gọn

- Viewer có thể hiển thị các dòng như `N dòng không thay đổi`.
- Điều khiển mở rộng trên các dòng đó là điều kiện và không đảm bảo cho mọi loại đầu vào.
- Điều khiển mở rộng xuất hiện khi diff đã render có dữ liệu ngữ cảnh có thể mở rộng, thường là cho đầu vào before và after.
- Đối với nhiều đầu vào patch thống nhất, các phần thân ngữ cảnh bị bỏ qua không có sẵn trong các hunk patch đã phân tích, vì vậy dòng có thể xuất hiện mà không có điều khiển mở rộng. Đây là hành vi mong đợi.
- `expandUnchanged` chỉ áp dụng khi có ngữ cảnh có thể mở rộng.

## Mặc định của plugin

Đặt mặc định toàn plugin trong `~/.openclaw/openclaw.json`:

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

Mặc định hỗ trợ:

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

Tham số công cụ rõ ràng ghi đè các mặc định này.

## Cấu hình bảo mật

- `security.allowRemoteViewer` (`boolean`, mặc định `false`)
  - `false`: từ chối yêu cầu không phải loopback đến các route viewer.
  - `true`: cho phép viewer từ xa nếu đường dẫn có token hợp lệ.

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

- Artifact được lưu trong thư mục tạm: `$TMPDIR/openclaw-diffs`.
- Metadata artifact viewer chứa:
  - ID artifact ngẫu nhiên (20 ký tự hex)
  - token ngẫu nhiên (48 ký tự hex)
  - `createdAt` và `expiresAt`
  - đường dẫn lưu `viewer.html`
- TTL viewer mặc định là 30 phút khi không được chỉ định.
- TTL viewer tối đa chấp nhận là 6 giờ.
- Dọn dẹp chạy cơ hội sau khi tạo artifact.
- Artifact hết hạn bị xóa.
- Dọn dẹp dự phòng xóa thư mục cũ hơn 24 giờ khi thiếu metadata.

## URL viewer và hành vi mạng

Route viewer:

- `/plugins/diffs/view/{artifactId}/{token}`

Tài sản viewer:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

Hành vi xây dựng URL:

- Nếu `baseUrl` được cung cấp, nó được sử dụng sau khi xác thực nghiêm ngặt.
- Không có `baseUrl`, URL viewer mặc định là loopback `127.0.0.1`.
- Nếu chế độ bind gateway là `custom` và `gateway.customBindHost` được đặt, host đó được sử dụng.

Quy tắc `baseUrl`:

- Phải là `http://` hoặc `https://`.
- Query và hash bị từ chối.
- Chỉ cho phép nguồn cộng với đường dẫn cơ sở tùy chọn.

## Mô hình bảo mật

Củng cố viewer:

- Chỉ loopback theo mặc định.
- Đường dẫn viewer có token với xác thực ID và token nghiêm ngặt.
- CSP phản hồi viewer:
  - `default-src 'none'`
  - script và tài sản chỉ từ self
  - không có `connect-src` outbound
- Giới hạn lỗi từ xa khi truy cập từ xa được bật:
  - 40 lỗi mỗi 60 giây
  - khóa 60 giây (`429 Too Many Requests`)

Củng cố render file:

- Định tuyến yêu cầu trình duyệt chụp màn hình bị từ chối theo mặc định.
- Chỉ cho phép tài sản viewer local từ `http://127.0.0.1/plugins/diffs/assets/*`.
- Chặn yêu cầu mạng bên ngoài.

## Yêu cầu trình duyệt cho chế độ file

`mode: "file"` và `mode: "both"` cần trình duyệt tương thích Chromium.

Thứ tự giải quyết:

1. `browser.executablePath` trong cấu hình OpenClaw.
2. Biến môi trường:
   - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
   - `BROWSER_EXECUTABLE_PATH`
   - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
3. Dự phòng khám phá lệnh/đường dẫn nền tảng.

Văn bản lỗi phổ biến:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Khắc phục bằng cách cài đặt Chrome, Chromium, Edge, hoặc Brave, hoặc thiết lập một trong các tùy chọn đường dẫn thực thi trên.

## Khắc phục sự cố

Lỗi xác thực đầu vào:

- `Provide patch or both before and after text.`
  - Bao gồm cả `before` và `after`, hoặc cung cấp `patch`.
- `Provide either patch or before/after input, not both.`
  - Không trộn lẫn chế độ đầu vào.
- `Invalid baseUrl: ...`
  - Sử dụng nguồn `http(s)` với đường dẫn tùy chọn, không có query/hash.
- `{field} exceeds maximum size (...)`
  - Giảm kích thước payload.
- Từ chối patch lớn
  - Giảm số lượng file patch hoặc tổng số dòng.

Vấn đề truy cập viewer:

- URL viewer mặc định là `127.0.0.1`.
- Đối với kịch bản truy cập từ xa, hoặc:
  - truyền `baseUrl` theo từng lần gọi công cụ, hoặc
  - sử dụng `gateway.bind=custom` và `gateway.customBindHost`
- Chỉ bật `security.allowRemoteViewer` khi bạn muốn truy cập viewer từ xa.

Dòng không thay đổi không có nút mở rộng:

- Điều này có thể xảy ra cho đầu vào patch khi patch không mang ngữ cảnh có thể mở rộng.
- Đây là hành vi mong đợi và không chỉ ra lỗi viewer.

Artifact không tìm thấy:

- Artifact hết hạn do TTL.
- Token hoặc đường dẫn đã thay đổi.
- Dọn dẹp đã xóa dữ liệu cũ.

## Hướng dẫn vận hành

- Ưu tiên `mode: "view"` cho các đánh giá tương tác local trong canvas.
- Ưu tiên `mode: "file"` cho các kênh chat outbound cần đính kèm.
- Giữ `allowRemoteViewer` tắt trừ khi triển khai của bạn yêu cầu URL viewer từ xa.
- Đặt `ttlSeconds` ngắn rõ ràng cho các diff nhạy cảm.
- Tránh gửi bí mật trong đầu vào diff khi không cần thiết.
- Nếu kênh của bạn nén hình ảnh mạnh (ví dụ Telegram hoặc WhatsApp), ưu tiên đầu ra PDF (`fileFormat: "pdf"`).

Engine render diff:

- Được hỗ trợ bởi [Diffs](https://diffs.com).

## Tài liệu liên quan

- [Tổng quan công cụ](/tools)
- [Plugins](/tools/plugin)
- [Trình duyệt](/tools/browser)\n
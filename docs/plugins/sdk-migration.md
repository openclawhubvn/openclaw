---
title: "Hướng Dẫn Di Chuyển Plugin SDK"
sidebarTitle: "Di chuyển SDK"
summary: "Tìm hiểu cách chuyển đổi từ lớp tương thích cũ sang SDK plugin hiện đại, tối ưu hóa hiệu suất và tính năng."
read_when:
  - Bạn thấy cảnh báo OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
  - Bạn thấy cảnh báo OPENCLAW_EXTENSION_API_DEPRECATED
  - Bạn đang cập nhật một plugin sang kiến trúc plugin hiện đại
  - Bạn duy trì một plugin OpenClaw bên ngoài
---

# Di chuyển Plugin SDK

OpenClaw đã chuyển từ lớp tương thích ngược rộng sang kiến trúc plugin hiện đại với các import có mục đích rõ ràng và được tài liệu hóa. Nếu plugin của bạn được xây dựng trước khi có kiến trúc mới, hướng dẫn này sẽ giúp bạn di chuyển.

## Thay đổi là gì

Hệ thống plugin cũ cung cấp hai bề mặt rộng mở cho phép plugin import bất kỳ thứ gì cần thiết từ một điểm nhập duy nhất:

- **`openclaw/plugin-sdk/compat`** — một import duy nhất tái xuất hàng chục helper. Nó được giới thiệu để giữ cho các plugin dựa trên hook cũ hoạt động trong khi kiến trúc plugin mới đang được xây dựng.
- **`openclaw/extension-api`** — một cầu nối cho phép plugin truy cập trực tiếp vào các helper phía host như trình chạy agent nhúng.

Cả hai bề mặt này hiện đã **bị ngừng sử dụng**. Chúng vẫn hoạt động trong runtime, nhưng plugin mới không được sử dụng chúng, và các plugin hiện có nên di chuyển trước khi bản phát hành chính tiếp theo loại bỏ chúng.

<Warning>
  Lớp tương thích ngược sẽ bị loại bỏ trong bản phát hành chính tiếp theo. Các plugin vẫn import từ các bề mặt này sẽ bị lỗi khi điều đó xảy ra.
</Warning>

## Tại sao thay đổi này xảy ra

Cách tiếp cận cũ gây ra nhiều vấn đề:

- **Khởi động chậm** — import một helper tải hàng chục module không liên quan
- **Phụ thuộc vòng tròn** — tái xuất rộng làm dễ tạo ra vòng lặp import
- **Bề mặt API không rõ ràng** — không có cách nào để biết export nào là ổn định so với nội bộ

SDK plugin hiện đại khắc phục điều này: mỗi đường dẫn import (`openclaw/plugin-sdk/\<subpath\>`) là một module nhỏ, tự chứa với mục đích rõ ràng và hợp đồng được tài liệu hóa.

## Cách di chuyển

<Steps>
  <Step title="Tìm các import đã ngừng sử dụng">
    Tìm kiếm trong plugin của bạn các import từ bất kỳ bề mặt nào đã ngừng sử dụng:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Thay thế bằng các import có mục đích rõ ràng">
    Mỗi export từ bề mặt cũ ánh xạ tới một đường dẫn import hiện đại cụ thể:

    ```typescript
    // Trước (lớp tương thích ngược đã ngừng sử dụng)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Sau (import có mục đích rõ ràng hiện đại)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Đối với các helper phía host, sử dụng runtime plugin được tiêm thay vì import trực tiếp:

    ```typescript
    // Trước (cầu nối extension-api đã ngừng sử dụng)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Sau (runtime được tiêm)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Mẫu tương tự áp dụng cho các helper cầu nối cũ khác:

    | Import cũ | Tương đương hiện đại |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helper lưu trữ session | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Xây dựng và kiểm tra">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Tham khảo đường dẫn import

<Accordion title="Bảng đường dẫn import đầy đủ">
  | Đường dẫn import | Mục đích | Các export chính |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper nhập plugin chuẩn | `definePluginEntry` |
  | `plugin-sdk/core` | Định nghĩa nhập kênh, trình tạo kênh, kiểu cơ bản | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/channel-setup` | Bộ điều hợp wizard thiết lập | `createOptionalChannelSetupSurface` |
  | `plugin-sdk/channel-pairing` | Nguyên thủy ghép đôi DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Tiền tố trả lời + dây gõ | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Nhà máy điều hợp cấu hình | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Trình tạo schema cấu hình | Kiểu schema cấu hình kênh |
  | `plugin-sdk/channel-policy` | Giải quyết chính sách nhóm/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Theo dõi trạng thái tài khoản | `createAccountStatusSink` |
  | `plugin-sdk/channel-runtime` | Helper dây runtime | Tiện ích runtime kênh |
  | `plugin-sdk/channel-send-result` | Kiểu kết quả gửi | Kiểu kết quả trả lời |
  | `plugin-sdk/runtime-store` | Lưu trữ plugin bền vững | `createPluginRuntimeStore` |
  | `plugin-sdk/allow-from` | Định dạng danh sách cho phép | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Ánh xạ đầu vào danh sách cho phép | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gating lệnh | `resolveControlCommandGate` |
  | `plugin-sdk/secret-input` | Phân tích đầu vào bí mật | Helper đầu vào bí mật |
  | `plugin-sdk/webhook-ingress` | Helper yêu cầu webhook | Tiện ích mục tiêu webhook |
  | `plugin-sdk/reply-payload` | Kiểu trả lời tin nhắn | Kiểu payload trả lời |
  | `plugin-sdk/provider-onboard` | Bản vá onboarding nhà cung cấp | Helper cấu hình onboarding |
  | `plugin-sdk/keyed-async-queue` | Hàng đợi async có thứ tự | `KeyedAsyncQueue` |
  | `plugin-sdk/testing` | Tiện ích kiểm tra | Helper và mock kiểm tra |
</Accordion>

Sử dụng import hẹp nhất phù hợp với công việc. Nếu không tìm thấy export, kiểm tra nguồn tại `src/plugin-sdk/` hoặc hỏi trong Discord.

## Lịch trình loại bỏ

| Khi nào                | Điều gì xảy ra                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **Hiện tại**           | Các bề mặt đã ngừng sử dụng phát ra cảnh báo runtime                    |
| **Bản phát hành chính tiếp theo** | Các bề mặt đã ngừng sử dụng sẽ bị loại bỏ; các plugin vẫn sử dụng chúng sẽ bị lỗi |

Tất cả các plugin cốt lõi đã được di chuyển. Các plugin bên ngoài nên di chuyển trước bản phát hành chính tiếp theo.

## Tạm thời tắt cảnh báo

Đặt các biến môi trường này trong khi bạn làm việc trên việc di chuyển:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Đây là một giải pháp tạm thời, không phải là giải pháp lâu dài.

## Liên quan

- [Xây dựng Plugin](/plugins/building-plugins)
- [Nội bộ Plugin](/plugins/architecture)
- [Manifest Plugin](/plugins/manifest)

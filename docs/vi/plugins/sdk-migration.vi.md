---
title: "Chuyển đổi Plugin SDK"
sidebarTitle: "Chuyển đổi SDK"
summary: "Chuyển từ lớp tương thích ngược cũ sang SDK plugin hiện đại"
read_when:
  - Thấy cảnh báo OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
  - Thấy cảnh báo OPENCLAW_EXTENSION_API_DEPRECATED
  - Đang cập nhật plugin sang kiến trúc plugin hiện đại
  - Đang duy trì plugin OpenClaw bên ngoài
---

# Chuyển đổi Plugin SDK

OpenClaw đã chuyển từ lớp tương thích ngược rộng sang kiến trúc plugin hiện đại với các import có tài liệu rõ ràng. Nếu plugin được xây dựng trước kiến trúc mới, hướng dẫn này giúp chuyển đổi.

## Thay đổi gì

Hệ thống plugin cũ cung cấp hai bề mặt mở rộng cho phép plugin import bất kỳ thứ gì từ một điểm duy nhất:

- **`openclaw/plugin-sdk/compat`** — một import duy nhất tái xuất hàng tá helper. Được giới thiệu để giữ cho các plugin dựa trên hook cũ hoạt động trong khi kiến trúc plugin mới đang được xây dựng.
- **`openclaw/extension-api`** — cầu nối cho phép plugin truy cập trực tiếp vào các helper phía host như agent runner nhúng.

Cả hai bề mặt này hiện **đã lỗi thời**. Chúng vẫn hoạt động khi runtime, nhưng plugin mới không được sử dụng và plugin hiện có nên chuyển đổi trước khi bản phát hành lớn tiếp theo loại bỏ chúng.

<Warning>
  Lớp tương thích ngược sẽ bị loại bỏ trong bản phát hành lớn tương lai. Plugin vẫn import từ các bề mặt này sẽ bị lỗi khi điều đó xảy ra.
</Warning>

## Tại sao thay đổi

Cách tiếp cận cũ gây ra vấn đề:

- **Khởi động chậm** — import một helper tải hàng tá module không liên quan
- **Phụ thuộc vòng tròn** — tái xuất rộng làm dễ tạo vòng lặp import
- **Bề mặt API không rõ ràng** — không có cách nào để biết export nào ổn định so với nội bộ

SDK plugin hiện đại khắc phục điều này: mỗi đường dẫn import (`openclaw/plugin-sdk/\<subpath\>`) là một module nhỏ, tự chứa với mục đích rõ ràng và hợp đồng có tài liệu.

## Cách chuyển đổi

<Steps>
  <Step title="Tìm import lỗi thời">
    Tìm kiếm trong plugin các import từ bề mặt lỗi thời:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Thay thế bằng import tập trung">
    Mỗi export từ bề mặt cũ ánh xạ tới một đường dẫn import hiện đại cụ thể:

    ```typescript
    // Trước (lớp tương thích ngược lỗi thời)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Sau (import tập trung hiện đại)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Đối với helper phía host, sử dụng runtime plugin được inject thay vì import trực tiếp:

    ```typescript
    // Trước (cầu nối extension-api lỗi thời)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Sau (runtime được inject)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Áp dụng cùng mẫu cho các helper cầu nối cũ khác:

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

  <Step title="Build và test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Tham khảo đường dẫn import

<Accordion title="Bảng đường dẫn import đầy đủ">
  | Đường dẫn import | Mục đích | Export chính |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper nhập plugin chuẩn | `definePluginEntry` |
  | `plugin-sdk/core` | Định nghĩa nhập Channel, builder channel, kiểu cơ bản | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/channel-setup` | Adapter wizard thiết lập | `createOptionalChannelSetupSurface` |
  | `plugin-sdk/channel-pairing` | Nguyên thủy ghép đôi DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Tiền tố trả lời + wiring typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Factory adapter cấu hình | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder schema cấu hình | Kiểu schema cấu hình Channel |
  | `plugin-sdk/channel-policy` | Giải quyết chính sách Group/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Theo dõi trạng thái tài khoản | `createAccountStatusSink` |
  | `plugin-sdk/channel-runtime` | Helper wiring runtime | Tiện ích runtime Channel |
  | `plugin-sdk/channel-send-result` | Kiểu kết quả gửi | Kiểu kết quả trả lời |
  | `plugin-sdk/runtime-store` | Lưu trữ plugin bền vững | `createPluginRuntimeStore` |
  | `plugin-sdk/allow-from` | Định dạng allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapping input allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gating lệnh | `resolveControlCommandGate` |
  | `plugin-sdk/secret-input` | Phân tích input bí mật | Helper input bí mật |
  | `plugin-sdk/webhook-ingress` | Helper yêu cầu webhook | Tiện ích mục tiêu webhook |
  | `plugin-sdk/reply-payload` | Kiểu trả lời tin nhắn | Kiểu payload trả lời |
  | `plugin-sdk/provider-onboard` | Bản vá onboarding Provider | Helper cấu hình onboarding |
  | `plugin-sdk/keyed-async-queue` | Hàng đợi async có thứ tự | `KeyedAsyncQueue` |
  | `plugin-sdk/testing` | Tiện ích test | Helper và mock test |
</Accordion>

Sử dụng import hẹp nhất phù hợp với công việc. Nếu không tìm thấy export, kiểm tra source tại `src/plugin-sdk/` hoặc hỏi trên Discord.

## Lộ trình loại bỏ

| Khi nào                | Điều gì xảy ra                                                          |
| ---------------------- | ----------------------------------------------------------------------- |
| **Hiện tại**           | Bề mặt lỗi thời phát ra cảnh báo runtime                                |
| **Bản phát hành lớn tiếp theo** | Bề mặt lỗi thời sẽ bị loại bỏ; plugin vẫn sử dụng sẽ bị lỗi |

Tất cả plugin cốt lõi đã được chuyển đổi. Plugin bên ngoài nên chuyển đổi trước bản phát hành lớn tiếp theo.

## Tạm thời tắt cảnh báo

Đặt các biến môi trường này khi đang làm việc chuyển đổi:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Đây là giải pháp tạm thời, không phải giải pháp lâu dài.

## Liên quan

- [Xây dựng Plugin](/plugins/building-plugins)
- [Nội bộ Plugin](/plugins/architecture)
- [Manifest Plugin](/plugins/manifest)\n
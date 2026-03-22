---
title: "Xây dựng Plugin"
sidebarTitle: "Xây dựng Plugin"
summary: "Hướng dẫn từng bước để tạo plugin OpenClaw với bất kỳ tổ hợp khả năng nào"
read_when:
  - Bạn muốn tạo một plugin OpenClaw mới
  - Bạn cần hiểu các mẫu import SDK plugin
  - Bạn đang thêm một kênh, nhà cung cấp, công cụ hoặc khả năng khác vào OpenClaw
---

# Xây dựng Plugin

Plugin mở rộng OpenClaw với các khả năng mới: kênh, nhà cung cấp mô hình, giọng nói, tạo hình ảnh, tìm kiếm web, công cụ agent, hoặc bất kỳ tổ hợp nào. Một plugin có thể đăng ký nhiều khả năng.

OpenClaw khuyến khích **phát triển plugin bên ngoài**. Bạn không cần thêm plugin vào kho OpenClaw. Hãy xuất bản plugin của bạn trên npm, và người dùng có thể cài đặt nó với `openclaw plugins install <npm-spec>`. OpenClaw cũng duy trì một bộ plugin cốt lõi trong kho, nhưng hệ thống plugin được thiết kế để sở hữu và phân phối độc lập.

## Yêu cầu trước

- Node >= 22 và một trình quản lý gói (npm hoặc pnpm)
- Quen thuộc với TypeScript (ESM)
- Đối với plugin trong kho: đã clone kho OpenClaw và chạy `pnpm install`

## Khả năng của Plugin

Một plugin có thể đăng ký một hoặc nhiều khả năng. Khả năng bạn đăng ký sẽ xác định plugin của bạn cung cấp gì cho OpenClaw:

| Khả năng             | Phương thức đăng ký                              | Thêm gì vào                     |
| -------------------- | ------------------------------------------------ | ------------------------------- |
| Suy luận văn bản     | `api.registerProvider(...)`                      | Nhà cung cấp mô hình (LLM)      |
| Kênh / nhắn tin      | `api.registerChannel(...)`                       | Kênh chat (ví dụ: Slack, IRC)   |
| Giọng nói            | `api.registerSpeechProvider(...)`                | Chuyển văn bản thành giọng nói / STT |
| Hiểu phương tiện     | `api.registerMediaUnderstandingProvider(...)`    | Phân tích hình ảnh/âm thanh/video |
| Tạo hình ảnh         | `api.registerImageGenerationProvider(...)`       | Tạo hình ảnh                    |
| Tìm kiếm web         | `api.registerWebSearchProvider(...)`             | Nhà cung cấp tìm kiếm web       |
| Công cụ agent        | `api.registerTool(...)`                          | Công cụ có thể gọi bởi agent    |

Một plugin không đăng ký khả năng nào nhưng cung cấp hooks hoặc dịch vụ là plugin **chỉ có hook**. Mẫu này vẫn được hỗ trợ.

## Cấu trúc Plugin

Plugin tuân theo cấu trúc này (dù trong kho hay độc lập):

```
my-plugin/
├── package.json          # Thông tin npm + cấu hình openclaw
├── openclaw.plugin.json  # Tệp manifest của plugin
├── index.ts              # Điểm vào
├── setup-entry.ts        # Trình hướng dẫn cài đặt (tùy chọn)
├── api.ts                # Xuất công khai (tùy chọn)
├── runtime-api.ts        # Xuất nội bộ (tùy chọn)
└── src/
    ├── provider.ts       # Triển khai khả năng
    ├── runtime.ts        # Kết nối runtime
    └── *.test.ts         # Kiểm thử đi kèm
```

## Tạo một plugin

<Steps>
  <Step title="Tạo package">
    Tạo `package.json` với khối metadata `openclaw`. Cấu trúc phụ thuộc vào khả năng mà plugin của bạn cung cấp.

    **Ví dụ plugin kênh:**

    ```json
    {
      "name": "@myorg/openclaw-my-channel",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "channel": {
          "id": "my-channel",
          "label": "My Channel",
          "blurb": "Mô tả ngắn về kênh."
        }
      }
    }
    ```

    **Ví dụ plugin nhà cung cấp:**

    ```json
    {
      "name": "@myorg/openclaw-my-provider",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "providers": ["my-provider"]
      }
    }
    ```

    Trường `openclaw` cho hệ thống plugin biết plugin của bạn cung cấp gì. Một plugin có thể khai báo cả `channel` và `providers` nếu nó cung cấp nhiều khả năng.

  </Step>

  <Step title="Định nghĩa điểm vào">
    Điểm vào đăng ký khả năng của bạn với API plugin.

    **Plugin kênh:**

    ```typescript
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/core";

    export default defineChannelPluginEntry({
      id: "my-channel",
      name: "My Channel",
      description: "Kết nối OpenClaw với My Channel",
      plugin: {
        // Triển khai adapter kênh
      },
    });
    ```

    **Plugin nhà cung cấp:**

    ```typescript
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

    export default definePluginEntry({
      id: "my-provider",
      name: "My Provider",
      register(api) {
        api.registerProvider({
          // Triển khai nhà cung cấp
        });
      },
    });
    ```

    **Plugin đa khả năng** (nhà cung cấp + công cụ):

    ```typescript
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      register(api) {
        api.registerProvider({ /* ... */ });
        api.registerTool({ /* ... */ });
        api.registerImageGenerationProvider({ /* ... */ });
      },
    });
    ```

    Sử dụng `defineChannelPluginEntry` từ `plugin-sdk/core` cho plugin kênh và `definePluginEntry` từ `plugin-sdk/plugin-entry` cho mọi thứ khác. Một plugin có thể đăng ký nhiều khả năng như cần thiết.

    Đối với các kênh kiểu chat, `plugin-sdk/core` cũng cung cấp `createChatChannelPlugin(...)` để bạn có thể kết hợp bảo mật DM thông thường, ghép nối văn bản, luồng trả lời, và gửi kết quả đính kèm mà không cần kết nối từng adapter riêng lẻ.

  </Step>

  <Step title="Import từ các subpath SDK tập trung">
    Luôn import từ các đường dẫn `openclaw/plugin-sdk/\<subpath\>` cụ thể. Việc import nguyên khối cũ đã bị loại bỏ (xem [SDK Migration](/plugins/sdk-migration)).

    Nếu mã plugin cũ vẫn import `openclaw/extension-api`, hãy coi đó là cầu nối tương thích tạm thời. Mã mới nên sử dụng các trợ giúp runtime được tiêm như `api.runtime.agent.*` thay vì import trực tiếp các trợ giúp agent phía host.

    ```typescript
    // Đúng: subpath tập trung
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { buildOauthProviderAuthResult } from "openclaw/plugin-sdk/provider-oauth";

    // Sai: gốc nguyên khối (lint sẽ từ chối điều này)
    import { ... } from "openclaw/plugin-sdk";

    // Đã loại bỏ: cầu nối host cũ
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    ```

    <Accordion title="Tham khảo subpath phổ biến">
      | Subpath | Mục đích |
      | --- | --- |
      | `plugin-sdk/plugin-entry` | Trợ giúp `definePluginEntry` chuẩn + loại nhập nhà cung cấp/plugin |
      | `plugin-sdk/core` | Trợ giúp điểm vào kênh, trình tạo kênh, và loại cơ sở chia sẻ |
      | `plugin-sdk/channel-setup` | Bộ điều hợp trình hướng dẫn cài đặt |
      | `plugin-sdk/channel-pairing` | Nguyên thủy ghép nối DM |
      | `plugin-sdk/channel-reply-pipeline` | Dây nối tiền tố trả lời + gõ |
      | `plugin-sdk/channel-config-schema` | Trình tạo lược đồ cấu hình |
      | `plugin-sdk/channel-policy` | Trợ giúp chính sách nhóm/DM |
      | `plugin-sdk/secret-input` | Phân tích/trợ giúp nhập bí mật |
      | `plugin-sdk/webhook-ingress` | Trợ giúp yêu cầu/đích webhook |
      | `plugin-sdk/runtime-store` | Lưu trữ plugin lâu dài |
      | `plugin-sdk/allow-from` | Giải quyết danh sách cho phép |
      | `plugin-sdk/reply-payload` | Loại trả lời tin nhắn |
      | `plugin-sdk/provider-oauth` | Đăng nhập OAuth + trợ giúp PKCE |
      | `plugin-sdk/provider-onboard` | Bản vá cấu hình onboarding nhà cung cấp |
      | `plugin-sdk/testing` | Tiện ích kiểm thử |
    </Accordion>

    Sử dụng subpath hẹp nhất phù hợp với công việc.

  </Step>

  <Step title="Sử dụng module cục bộ cho import nội bộ">
    Trong plugin của bạn, tạo các tệp module cục bộ để chia sẻ mã nội bộ thay vì import lại thông qua SDK plugin:

    ```typescript
    // api.ts — xuất công khai cho plugin này
    export { MyConfig } from "./src/config.js";
    export { MyRuntime } from "./src/runtime.js";

    // runtime-api.ts — xuất chỉ nội bộ
    export { internalHelper } from "./src/helpers.js";
    ```

    <Warning>
      Không bao giờ import plugin của bạn trở lại thông qua đường dẫn SDK đã xuất bản từ các tệp sản xuất. Hướng các import nội bộ qua các tệp cục bộ như `./api.ts` hoặc `./runtime-api.ts`. Đường dẫn SDK chỉ dành cho người tiêu dùng bên ngoài.
    </Warning>

  </Step>

  <Step title="Thêm một manifest plugin">
    Tạo `openclaw.plugin.json` trong thư mục gốc của plugin:

    ```json
    {
      "id": "my-plugin",
      "kind": "provider",
      "name": "My Plugin",
      "description": "Thêm My Provider vào OpenClaw"
    }
    ```

    Đối với plugin kênh, đặt `"kind": "channel"` và thêm `"channels": ["my-channel"]`.

    Xem [Plugin Manifest](/plugins/manifest) để biết lược đồ đầy đủ.

  </Step>

  <Step title="Kiểm thử plugin của bạn">
    **Plugin bên ngoài:** chạy bộ kiểm thử của riêng bạn với các hợp đồng SDK plugin.

    **Plugin trong kho:** OpenClaw chạy kiểm thử hợp đồng với tất cả các plugin đã đăng ký:

    ```bash
    pnpm test:contracts:channels   # plugin kênh
    pnpm test:contracts:plugins    # plugin nhà cung cấp
    ```

    Đối với kiểm thử đơn vị, import các trợ giúp kiểm thử từ bề mặt kiểm thử:

    ```typescript
    import { createTestRuntime } from "openclaw/plugin-sdk/testing";
    ```

  </Step>

  <Step title="Xuất bản và cài đặt">
    **Plugin bên ngoài:** xuất bản lên npm, sau đó cài đặt:

    ```bash
    npm publish
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    **Plugin trong kho:** đặt plugin dưới `extensions/` và nó sẽ được tự động phát hiện trong quá trình build.

    Người dùng có thể duyệt và cài đặt plugin cộng đồng với:

    ```bash
    openclaw plugins search <query>
    openclaw plugins install <npm-spec>
    ```

  </Step>
</Steps>

## Đăng ký công cụ agent

Plugin có thể đăng ký **công cụ agent** — các hàm có kiểu mà LLM có thể gọi. Công cụ có thể là bắt buộc (luôn có sẵn) hoặc tùy chọn (người dùng chọn tham gia qua danh sách cho phép).

```typescript
import { Type } from "@sinclair/typebox";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    // Công cụ bắt buộc (luôn có sẵn)
    api.registerTool({
      name: "my_tool",
      description: "Thực hiện một việc",
      parameters: Type.Object({ input: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.input }] };
      },
    });

    // Công cụ tùy chọn (người dùng phải thêm vào danh sách cho phép)
    api.registerTool(
      {
        name: "workflow_tool",
        description: "Chạy một quy trình",
        parameters: Type.Object({ pipeline: Type.String() }),
        async execute(_id, params) {
          return { content: [{ type: "text", text: params.pipeline }] };
        },
      },
      { optional: true },
    );
  },
});
```

Kích hoạt công cụ tùy chọn trong cấu hình:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

Mẹo:

- Tên công cụ không được trùng với tên công cụ cốt lõi (xung đột sẽ bị bỏ qua)
- Sử dụng `optional: true` cho các công cụ kích hoạt hiệu ứng phụ hoặc yêu cầu thêm các tệp nhị phân
- Người dùng có thể kích hoạt tất cả các công cụ từ một plugin bằng cách thêm id plugin vào `tools.allow`

## Kiểm tra lint (plugin trong kho)

Ba script kiểm tra ranh giới SDK cho các plugin trong kho OpenClaw:

1. **Không import gốc nguyên khối** — gốc `openclaw/plugin-sdk` bị từ chối
2. **Không import trực tiếp từ src/** — plugin không thể import trực tiếp `../../src/`
3. **Không tự import** — plugin không thể import subpath `plugin-sdk/\<name\>` của chính nó

Chạy `pnpm check` để kiểm tra tất cả các ranh giới trước khi commit.

Plugin bên ngoài không bị ràng buộc bởi các quy tắc lint này, nhưng việc tuân theo các mẫu tương tự được khuyến khích mạnh mẽ.

## Danh sách kiểm tra trước khi gửi

<Check>**package.json** có metadata `openclaw` chính xác</Check>
<Check>Điểm vào sử dụng `defineChannelPluginEntry` hoặc `definePluginEntry`</Check>
<Check>Tất cả các import sử dụng đường dẫn `plugin-sdk/\<subpath\>` tập trung</Check>
<Check>Import nội bộ sử dụng module cục bộ, không phải tự import SDK</Check>
<Check>Manifest `openclaw.plugin.json` có mặt và hợp lệ</Check>
<Check>Kiểm thử thành công</Check>
<Check>`pnpm check` thành công (plugin trong kho)</Check>

## Liên quan

- [Plugin SDK Migration](/plugins/sdk-migration) — di chuyển từ các bề mặt tương thích đã loại bỏ
- [Plugin Architecture](/plugins/architecture) — nội bộ và mô hình khả năng
- [Plugin Manifest](/plugins/manifest) — lược đồ manifest đầy đủ
- [Plugin Agent Tools](/plugins/building-plugins#registering-agent-tools) — thêm công cụ agent trong một plugin
- [Community Plugins](/plugins/community) — danh sách và tiêu chuẩn chất lượng

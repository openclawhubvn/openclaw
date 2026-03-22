---
title: "Xây dựng Plugin"
sidebarTitle: "Xây dựng Plugin"
summary: "Hướng dẫn từng bước tạo plugin OpenClaw với mọi khả năng kết hợp"
read_when:
  - Muốn tạo plugin OpenClaw mới
  - Cần hiểu cách import SDK plugin
  - Đang thêm channel, provider, tool hoặc khả năng mới vào OpenClaw
---

# Xây dựng Plugin

Plugin mở rộng OpenClaw với các khả năng mới: channel, model provider, speech, tạo ảnh, tìm kiếm web, công cụ agent, hoặc bất kỳ kết hợp nào. Một plugin có thể đăng ký nhiều khả năng.

OpenClaw khuyến khích **phát triển plugin bên ngoài**. Không cần thêm plugin vào repository OpenClaw. Publish plugin lên npm, người dùng cài bằng `openclaw plugins install <npm-spec>`. OpenClaw cũng duy trì một bộ plugin core trong repo, nhưng hệ thống plugin được thiết kế để sở hữu và phân phối độc lập.

## Yêu cầu

- Node >= 22 và package manager (npm hoặc pnpm)
- Quen thuộc với TypeScript (ESM)
- Với plugin trong repo: clone repository OpenClaw và chạy `pnpm install`

## Khả năng của Plugin

Một plugin có thể đăng ký một hoặc nhiều khả năng. Khả năng bạn đăng ký quyết định plugin cung cấp gì cho OpenClaw:

| Khả năng             | Phương thức đăng ký                              | Thêm gì vào                     |
| -------------------- | ----------------------------------------------- | ------------------------------- |
| Text inference       | `api.registerProvider(...)`                     | Model provider (LLM)            |
| Channel / messaging  | `api.registerChannel(...)`                      | Chat channel (e.g. Slack, IRC)  |
| Speech               | `api.registerSpeechProvider(...)`               | Text-to-speech / STT            |
| Media understanding  | `api.registerMediaUnderstandingProvider(...)`   | Phân tích hình ảnh/âm thanh/video |
| Image generation     | `api.registerImageGenerationProvider(...)`      | Tạo ảnh                         |
| Web search           | `api.registerWebSearchProvider(...)`            | Web search provider             |
| Agent tools          | `api.registerTool(...)`                         | Công cụ có thể gọi bởi agent    |

Plugin đăng ký không có khả năng nào nhưng cung cấp hooks hoặc dịch vụ là plugin **chỉ có hook**. Mẫu này vẫn được hỗ trợ.

## Cấu trúc Plugin

Plugin theo cấu trúc này (dù trong repo hay độc lập):

```
my-plugin/
├── package.json          # npm metadata + openclaw config
├── openclaw.plugin.json  # Plugin manifest
├── index.ts              # Entry point
├── setup-entry.ts        # Setup wizard (tùy chọn)
├── api.ts                # Public exports (tùy chọn)
├── runtime-api.ts        # Internal exports (tùy chọn)
└── src/
    ├── provider.ts       # Thực thi khả năng
    ├── runtime.ts        # Runtime wiring
    └── *.test.ts         # Colocated tests
```

## Tạo plugin

<Steps>
  <Step title="Tạo package">
    Tạo `package.json` với block metadata `openclaw`. Cấu trúc phụ thuộc vào khả năng plugin cung cấp.

    **Ví dụ plugin Channel:**

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
          "blurb": "Mô tả ngắn về channel."
        }
      }
    }
    ```

    **Ví dụ plugin Provider:**

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

    Trường `openclaw` cho hệ thống plugin biết plugin cung cấp gì. Một plugin có thể khai báo cả `channel` và `providers` nếu cung cấp nhiều khả năng.

  </Step>

  <Step title="Định nghĩa entry point">
    Entry point đăng ký khả năng với API plugin.

    **Plugin Channel:**

    ```typescript
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/core";

    export default defineChannelPluginEntry({
      id: "my-channel",
      name: "My Channel",
      description: "Kết nối OpenClaw với My Channel",
      plugin: {
        // Thực thi adapter channel
      },
    });
    ```

    **Plugin Provider:**

    ```typescript
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

    export default definePluginEntry({
      id: "my-provider",
      name: "My Provider",
      register(api) {
        api.registerProvider({
          // Thực thi provider
        });
      },
    });
    ```

    **Plugin đa khả năng** (provider + tool):

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

    Dùng `defineChannelPluginEntry` từ `plugin-sdk/core` cho plugin channel và `definePluginEntry` từ `plugin-sdk/plugin-entry` cho các trường hợp khác. Một plugin có thể đăng ký nhiều khả năng cần thiết.

    Với channel kiểu chat, `plugin-sdk/core` cũng cung cấp `createChatChannelPlugin(...)` để bạn có thể kết hợp bảo mật DM, ghép cặp text, luồng trả lời, và kết quả gửi đi mà không cần wiring từng adapter riêng lẻ.

  </Step>

  <Step title="Import từ subpath SDK cụ thể">
    Luôn import từ các đường dẫn `openclaw/plugin-sdk/\<subpath\>` cụ thể. Import monolithic cũ đã bị deprecated (xem [SDK Migration](/plugins/sdk-migration)).

    Nếu code plugin cũ vẫn import `openclaw/extension-api`, coi đó là cầu nối tương thích tạm thời. Code mới nên dùng các helper runtime được inject như `api.runtime.agent.*` thay vì import trực tiếp các helper agent host-side.

    ```typescript
    // Đúng: subpath cụ thể
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { buildOauthProviderAuthResult } from "openclaw/plugin-sdk/provider-oauth";

    // Sai: root monolithic (lint sẽ từ chối)
    import { ... } from "openclaw/plugin-sdk";

    // Deprecated: cầu nối host cũ
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    ```

    <Accordion title="Tham khảo subpath phổ biến">
      | Subpath | Mục đích |
      | --- | --- |
      | `plugin-sdk/plugin-entry` | Helper `definePluginEntry` chuẩn + loại entry provider/plugin |
      | `plugin-sdk/core` | Helper entry channel, builder channel, và loại base chia sẻ |
      | `plugin-sdk/channel-setup` | Adapter setup wizard |
      | `plugin-sdk/channel-pairing` | Primitive ghép cặp DM |
      | `plugin-sdk/channel-reply-pipeline` | Wiring prefix trả lời + typing |
      | `plugin-sdk/channel-config-schema` | Builder schema config |
      | `plugin-sdk/channel-policy` | Helper policy Group/DM |
      | `plugin-sdk/secret-input` | Parsing/helper input bí mật |
      | `plugin-sdk/webhook-ingress` | Helper request/target webhook |
      | `plugin-sdk/runtime-store` | Lưu trữ plugin persistent |
      | `plugin-sdk/allow-from` | Giải quyết allowlist |
      | `plugin-sdk/reply-payload` | Loại trả lời message |
      | `plugin-sdk/provider-oauth` | Helper login OAuth + PKCE |
      | `plugin-sdk/provider-onboard` | Patch config onboarding provider |
      | `plugin-sdk/testing` | Tiện ích test |
    </Accordion>

    Dùng subpath hẹp nhất phù hợp với công việc.

  </Step>

  <Step title="Dùng module local cho import nội bộ">
    Trong plugin, tạo file module local để chia sẻ code nội bộ thay vì re-import qua plugin SDK:

    ```typescript
    // api.ts — public exports cho plugin này
    export { MyConfig } from "./src/config.js";
    export { MyRuntime } from "./src/runtime.js";

    // runtime-api.ts — internal-only exports
    export { internalHelper } from "./src/helpers.js";
    ```

    <Warning>
      Không bao giờ import plugin của mình qua đường dẫn SDK đã publish từ file production. Route import nội bộ qua file local như `./api.ts` hoặc `./runtime-api.ts`. Đường dẫn SDK chỉ dành cho người dùng bên ngoài.
    </Warning>

  </Step>

  <Step title="Thêm manifest plugin">
    Tạo `openclaw.plugin.json` trong root plugin:

    ```json
    {
      "id": "my-plugin",
      "kind": "provider",
      "name": "My Plugin",
      "description": "Thêm My Provider vào OpenClaw"
    }
    ```

    Với plugin channel, đặt `"kind": "channel"` và thêm `"channels": ["my-channel"]`.

    Xem [Plugin Manifest](/plugins/manifest) để biết schema đầy đủ.

  </Step>

  <Step title="Test plugin">
    **Plugin bên ngoài:** chạy bộ test của riêng bạn với các hợp đồng SDK plugin.

    **Plugin trong repo:** OpenClaw chạy test hợp đồng với tất cả plugin đã đăng ký:

    ```bash
    pnpm test:contracts:channels   # plugin channel
    pnpm test:contracts:plugins    # plugin provider
    ```

    Với unit test, import helper test từ bề mặt testing:

    ```typescript
    import { createTestRuntime } from "openclaw/plugin-sdk/testing";
    ```

  </Step>

  <Step title="Publish và cài đặt">
    **Plugin bên ngoài:** publish lên npm, sau đó cài đặt:

    ```bash
    npm publish
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    **Plugin trong repo:** đặt plugin dưới `extensions/` và nó sẽ được tự động phát hiện trong quá trình build.

    Người dùng có thể duyệt và cài đặt plugin cộng đồng với:

    ```bash
    openclaw plugins search <query>
    openclaw plugins install <npm-spec>
    ```

  </Step>
</Steps>

## Đăng ký công cụ agent

Plugin có thể đăng ký **công cụ agent** — hàm có kiểu mà LLM có thể gọi. Công cụ có thể là bắt buộc (luôn có sẵn) hoặc tùy chọn (người dùng chọn qua allowlist).

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

    // Công cụ tùy chọn (người dùng phải thêm vào allowlist)
    api.registerTool(
      {
        name: "workflow_tool",
        description: "Chạy một workflow",
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

Kích hoạt công cụ tùy chọn trong config:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

Mẹo:

- Tên công cụ không được trùng với tên công cụ core (xung đột sẽ bị bỏ qua)
- Dùng `optional: true` cho công cụ kích hoạt side effect hoặc cần thêm binary
- Người dùng có thể kích hoạt tất cả công cụ từ một plugin bằng cách thêm id plugin vào `tools.allow`

## Kiểm tra lint (plugin trong repo)

Ba script kiểm tra ranh giới SDK cho plugin trong repository OpenClaw:

1. **Không import root monolithic** — root `openclaw/plugin-sdk` bị từ chối
2. **Không import trực tiếp src/** — plugin không thể import trực tiếp `../../src/`
3. **Không tự import** — plugin không thể import subpath `plugin-sdk/\<name\>` của chính nó

Chạy `pnpm check` để kiểm tra tất cả ranh giới trước khi commit.

Plugin bên ngoài không bị ràng buộc bởi các quy tắc lint này, nhưng nên tuân theo cùng mẫu.

## Checklist trước khi gửi

<Check>**package.json** có metadata `openclaw` chính xác</Check>
<Check>Entry point dùng `defineChannelPluginEntry` hoặc `definePluginEntry`</Check>
<Check>Tất cả import dùng đường dẫn `plugin-sdk/\<subpath\>` cụ thể</Check>
<Check>Import nội bộ dùng module local, không tự import SDK</Check>
<Check>Manifest `openclaw.plugin.json` có và hợp lệ</Check>
<Check>Test pass</Check>
<Check>`pnpm check` pass (plugin trong repo)</Check>

## Liên quan

- [Plugin SDK Migration](/plugins/sdk-migration) — di chuyển từ bề mặt tương thích deprecated
- [Plugin Architecture](/plugins/architecture) — nội bộ và mô hình khả năng
- [Plugin Manifest](/plugins/manifest) — schema manifest đầy đủ
- [Plugin Agent Tools](/plugins/building-plugins#registering-agent-tools) — thêm công cụ agent trong plugin
- [Community Plugins](/plugins/community) — danh sách và tiêu chuẩn chất lượng\n
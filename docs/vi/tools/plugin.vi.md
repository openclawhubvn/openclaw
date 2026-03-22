---
summary: "Cài đặt, cấu hình và quản lý plugin OpenClaw"
read_when:
  - Cài đặt hoặc cấu hình plugin
  - Hiểu cách khám phá và tải plugin
  - Làm việc với gói plugin tương thích Codex/Claude
title: "Plugins"
sidebarTitle: "Cài đặt và Cấu hình"
---

# Plugins

Plugins mở rộng khả năng của OpenClaw: channels, model providers, tools, skills, speech, image generation, và nhiều hơn nữa. Có hai loại plugin: **core** (đi kèm với OpenClaw) và **external** (được cộng đồng phát hành trên npm).

## Bắt đầu nhanh

<Steps>
  <Step title="Xem plugin đã tải">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Cài đặt plugin">
    ```bash
    # Từ npm
    openclaw plugins install @openclaw/voice-call

    # Từ thư mục hoặc file nén local
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Khởi động lại Gateway">
    ```bash
    openclaw gateway restart
    ```

    Sau đó cấu hình dưới `plugins.entries.\<id\>.config` trong file cấu hình.
  </Step>
</Steps>

## Loại plugin

OpenClaw nhận diện hai định dạng plugin:

| Định dạng  | Cách hoạt động                                                   | Ví dụ                                                   |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------- |
| **Native** | `openclaw.plugin.json` + module runtime; chạy trong tiến trình   | Plugin chính thức, gói npm cộng đồng                    |
| **Bundle** | Layout tương thích Codex/Claude/Cursor; ánh xạ tới tính năng OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Cả hai đều xuất hiện dưới `openclaw plugins list`. Xem chi tiết [Plugin Bundles](/plugins/bundles).

## Plugin chính thức

### Cài đặt được (npm)

| Plugin          | Package                | Docs                                 |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/plugins/zalouser)   |

### Core (đi kèm với OpenClaw)

<AccordionGroup>
  <Accordion title="Model providers (bật mặc định)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `modelstudio`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `qwen-portal-auth`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Memory plugins">
    - `memory-core` — bundled memory search (mặc định qua `plugins.slots.memory`)
    - `memory-lancedb` — cài đặt theo yêu cầu cho bộ nhớ dài hạn với tự động nhớ/lưu (đặt `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Speech providers (bật mặc định)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Khác">
    - `copilot-proxy` — VS Code Copilot Proxy bridge (tắt mặc định)
  </Accordion>
</AccordionGroup>

Tìm plugin bên thứ ba? Xem [Community Plugins](/plugins/community).

## Cấu hình

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-extension"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Trường            | Mô tả                                                     |
| ----------------- | --------------------------------------------------------- |
| `enabled`         | Công tắc chính (mặc định: `true`)                         |
| `allow`           | Danh sách plugin cho phép (tùy chọn)                      |
| `deny`            | Danh sách plugin cấm (tùy chọn; deny thắng)               |
| `load.paths`      | File/thư mục plugin bổ sung                               |
| `slots`           | Bộ chọn slot độc quyền (vd: `memory`, `contextEngine`)    |
| `entries.\<id\>`  | Công tắc và cấu hình cho từng plugin                      |

Thay đổi cấu hình **cần khởi động lại gateway**.

<Accordion title="Trạng thái plugin: tắt vs thiếu vs không hợp lệ">
  - **Tắt**: plugin tồn tại nhưng bị tắt theo quy tắc. Cấu hình vẫn giữ.
  - **Thiếu**: cấu hình tham chiếu đến plugin id mà không tìm thấy.
  - **Không hợp lệ**: plugin tồn tại nhưng cấu hình không khớp với schema khai báo.
</Accordion>

## Khám phá và ưu tiên

OpenClaw quét plugin theo thứ tự này (khớp đầu tiên thắng):

<Steps>
  <Step title="Đường dẫn cấu hình">
    `plugins.load.paths` — đường dẫn file hoặc thư mục rõ ràng.
  </Step>

  <Step title="Mở rộng Workspace">
    `\<workspace\>/.openclaw/extensions/*.ts` và `\<workspace\>/.openclaw/extensions/*/index.ts`.
  </Step>

  <Step title="Mở rộng toàn cục">
    `~/.openclaw/extensions/*.ts` và `~/.openclaw/extensions/*/index.ts`.
  </Step>

  <Step title="Plugin đi kèm">
    Đi kèm với OpenClaw. Nhiều plugin bật mặc định (model providers, speech).
    Các plugin khác cần bật rõ ràng.
  </Step>
</Steps>

### Quy tắc bật

- `plugins.enabled: false` tắt tất cả plugin
- `plugins.deny` luôn thắng allow
- `plugins.entries.\<id\>.enabled: false` tắt plugin đó
- Plugin nguồn gốc Workspace **tắt mặc định** (cần bật rõ ràng)
- Plugin đi kèm theo mặc định bật trừ khi bị ghi đè
- Slot độc quyền có thể buộc bật plugin đã chọn cho slot đó

## Plugin slots (danh mục độc quyền)

Một số danh mục là độc quyền (chỉ một hoạt động tại một thời điểm):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // hoặc "none" để tắt
      contextEngine: "legacy", // hoặc một plugin id
    },
  },
}
```

| Slot            | Điều khiển gì           | Mặc định            |
| --------------- | ----------------------- | ------------------- |
| `memory`        | Plugin bộ nhớ hoạt động | `memory-core`       |
| `contextEngine` | Context engine hoạt động | `legacy` (built-in) |

## Tham khảo CLI

```bash
openclaw plugins list                    # danh sách gọn
openclaw plugins inspect <id>            # chi tiết sâu
openclaw plugins inspect <id> --json     # máy đọc được
openclaw plugins status                  # tóm tắt hoạt động
openclaw plugins doctor                  # chẩn đoán

openclaw plugins install <npm-spec>      # cài từ npm
openclaw plugins install <path>          # cài từ đường dẫn local
openclaw plugins install -l <path>       # link (không copy) cho dev
openclaw plugins update <id>             # cập nhật một plugin
openclaw plugins update --all            # cập nhật tất cả

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Xem chi tiết tại [`openclaw plugins` CLI reference](/cli/plugins).

## Tổng quan Plugin API

Plugins xuất ra một function hoặc một object với `register(api)`:

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

Các phương thức đăng ký phổ biến:

| Phương thức                          | Đăng ký gì            |
| ------------------------------------ | --------------------- |
| `registerProvider`                   | Model provider (LLM)  |
| `registerChannel`                    | Chat channel          |
| `registerTool`                       | Agent tool            |
| `registerHook` / `on(...)`           | Lifecycle hooks       |
| `registerSpeechProvider`             | Text-to-speech / STT  |
| `registerMediaUnderstandingProvider` | Phân tích hình/âm thanh |
| `registerImageGenerationProvider`    | Tạo hình ảnh          |
| `registerWebSearchProvider`          | Tìm kiếm web          |
| `registerHttpRoute`                  | HTTP endpoint         |
| `registerCommand` / `registerCli`    | Lệnh CLI              |
| `registerContextEngine`              | Context engine        |
| `registerService`                    | Dịch vụ nền           |

## Liên quan

- [Xây dựng Plugins](/plugins/building-plugins) — tạo plugin của riêng bạn
- [Plugin Bundles](/plugins/bundles) — tương thích gói Codex/Claude/Cursor
- [Plugin Manifest](/plugins/manifest) — schema manifest
- [Đăng ký Tools](/plugins/building-plugins#registering-agent-tools) — thêm agent tools vào plugin
- [Nội bộ Plugin](/plugins/architecture) — mô hình khả năng và pipeline tải
- [Community Plugins](/plugins/community) — danh sách bên thứ ba\n
---
summary: "Cài đặt, cấu hình và quản lý plugin OpenClaw"
read_when:
  - Cài đặt hoặc cấu hình plugin
  - Hiểu về khám phá và quy tắc tải plugin
  - Làm việc với gói plugin tương thích Codex/Claude
title: "Plugins"
sidebarTitle: "Cài đặt và Cấu hình"
---

# Plugins

Plugins mở rộng khả năng của OpenClaw với các tính năng mới: kênh, nhà cung cấp mô hình, công cụ, kỹ năng, giọng nói, tạo hình ảnh và nhiều hơn nữa. Một số plugin là **core** (đi kèm với OpenClaw), số khác là **external** (được cộng đồng phát hành trên npm).

## Bắt đầu nhanh

<Steps>
  <Step title="Xem những gì đã được tải">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Cài đặt một plugin">
    ```bash
    # Từ npm
    openclaw plugins install @openclaw/voice-call

    # Từ thư mục hoặc tệp lưu trữ cục bộ
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Khởi động lại Gateway">
    ```bash
    openclaw gateway restart
    ```

    Sau đó cấu hình dưới `plugins.entries.\<id\>.config` trong file cấu hình của bạn.

  </Step>
</Steps>

## Các loại plugin

OpenClaw nhận diện hai định dạng plugin:

| Định dạng  | Cách hoạt động                                                      | Ví dụ                                                    |
| ---------- | ------------------------------------------------------------------ | -------------------------------------------------------- |
| **Native** | `openclaw.plugin.json` + module runtime; thực thi trong quá trình  | Plugin chính thức, gói npm cộng đồng                     |
| **Bundle** | Bố cục tương thích Codex/Claude/Cursor; ánh xạ tới các tính năng OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Cả hai đều xuất hiện dưới `openclaw plugins list`. Xem [Plugin Bundles](/plugins/bundles) để biết chi tiết về bundle.

## Plugin chính thức

### Có thể cài đặt (npm)

| Plugin          | Gói                    | Tài liệu                              |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/plugins/zalouser)   |

### Core (đi kèm với OpenClaw)

<AccordionGroup>
  <Accordion title="Nhà cung cấp mô hình (bật mặc định)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `modelstudio`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `qwen-portal-auth`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugin bộ nhớ">
    - `memory-core` — tìm kiếm bộ nhớ đi kèm (mặc định qua `plugins.slots.memory`)
    - `memory-lancedb` — cài đặt theo yêu cầu bộ nhớ dài hạn với tự động nhớ lại/ghi lại (đặt `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Nhà cung cấp giọng nói (bật mặc định)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Khác">
    - `copilot-proxy` — cầu nối VS Code Copilot Proxy (tắt mặc định)
  </Accordion>
</AccordionGroup>

Tìm kiếm plugin bên thứ ba? Xem [Community Plugins](/plugins/community).

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
| `allow`           | Danh sách cho phép plugin (tùy chọn)                      |
| `deny`            | Danh sách từ chối plugin (tùy chọn; từ chối sẽ ưu tiên)   |
| `load.paths`      | Tệp/thư mục plugin bổ sung                                |
| `slots`           | Bộ chọn slot độc quyền (ví dụ: `memory`, `contextEngine`) |
| `entries.\<id\>`  | Công tắc và cấu hình cho từng plugin                      |

Thay đổi cấu hình **yêu cầu khởi động lại gateway**.

<Accordion title="Trạng thái plugin: tắt, thiếu, không hợp lệ">
  - **Tắt**: plugin tồn tại nhưng quy tắc bật tắt đã tắt nó. Cấu hình được giữ lại.
  - **Thiếu**: cấu hình tham chiếu đến một id plugin mà không tìm thấy.
  - **Không hợp lệ**: plugin tồn tại nhưng cấu hình không khớp với schema đã khai báo.
</Accordion>

## Khám phá và ưu tiên

OpenClaw quét tìm plugin theo thứ tự này (khớp đầu tiên sẽ thắng):

<Steps>
  <Step title="Đường dẫn cấu hình">
    `plugins.load.paths` — đường dẫn tệp hoặc thư mục rõ ràng.
  </Step>

  <Step title="Mở rộng không gian làm việc">
    `\<workspace\>/.openclaw/extensions/*.ts` và `\<workspace\>/.openclaw/extensions/*/index.ts`.
  </Step>

  <Step title="Mở rộng toàn cầu">
    `~/.openclaw/extensions/*.ts` và `~/.openclaw/extensions/*/index.ts`.
  </Step>

  <Step title="Plugin đi kèm">
    Đi kèm với OpenClaw. Nhiều plugin được bật mặc định (nhà cung cấp mô hình, giọng nói).
    Các plugin khác yêu cầu bật rõ ràng.
  </Step>
</Steps>

### Quy tắc bật tắt

- `plugins.enabled: false` tắt tất cả plugin
- `plugins.deny` luôn ưu tiên hơn cho phép
- `plugins.entries.\<id\>.enabled: false` tắt plugin đó
- Plugin nguồn gốc từ không gian làm việc **bị tắt mặc định** (phải được bật rõ ràng)
- Plugin đi kèm tuân theo bộ mặc định bật sẵn trừ khi bị ghi đè
- Slot độc quyền có thể buộc bật plugin đã chọn cho slot đó

## Slot plugin (danh mục độc quyền)

Một số danh mục là độc quyền (chỉ có một hoạt động tại một thời điểm):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // hoặc "none" để tắt
      contextEngine: "legacy", // hoặc một id plugin
    },
  },
}
```

| Slot            | Điều khiển gì           | Mặc định             |
| --------------- | ----------------------- | ------------------- |
| `memory`        | Plugin bộ nhớ hoạt động | `memory-core`       |
| `contextEngine` | Động cơ ngữ cảnh hoạt động | `legacy` (tích hợp) |

## Tham khảo CLI

```bash
openclaw plugins list                    # danh sách gọn
openclaw plugins inspect <id>            # chi tiết sâu
openclaw plugins inspect <id> --json     # định dạng máy đọc được
openclaw plugins status                  # tóm tắt hoạt động
openclaw plugins doctor                  # chẩn đoán

openclaw plugins install <npm-spec>      # cài đặt từ npm
openclaw plugins install <path>          # cài đặt từ đường dẫn cục bộ
openclaw plugins install -l <path>       # liên kết (không sao chép) cho phát triển
openclaw plugins update <id>             # cập nhật một plugin
openclaw plugins update --all            # cập nhật tất cả

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Xem [tham khảo CLI `openclaw plugins`](/cli/plugins) để biết chi tiết đầy đủ.

## Tổng quan API Plugin

Plugins xuất ra một hàm hoặc một đối tượng với `register(api)`:

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

| Phương thức                          | Đăng ký cái gì         |
| ------------------------------------ | ---------------------- |
| `registerProvider`                   | Nhà cung cấp mô hình (LLM) |
| `registerChannel`                    | Kênh chat              |
| `registerTool`                       | Công cụ agent          |
| `registerHook` / `on(...)`           | Hook vòng đời          |
| `registerSpeechProvider`             | Chuyển văn bản thành giọng nói / STT |
| `registerMediaUnderstandingProvider` | Phân tích hình ảnh/âm thanh |
| `registerImageGenerationProvider`    | Tạo hình ảnh           |
| `registerWebSearchProvider`          | Tìm kiếm web           |
| `registerHttpRoute`                  | Endpoint HTTP          |
| `registerCommand` / `registerCli`    | Lệnh CLI               |
| `registerContextEngine`              | Động cơ ngữ cảnh       |
| `registerService`                    | Dịch vụ nền            |

## Liên quan

- [Xây dựng Plugins](/plugins/building-plugins) — tạo plugin của riêng bạn
- [Plugin Bundles](/plugins/bundles) — tương thích gói Codex/Claude/Cursor
- [Plugin Manifest](/plugins/manifest) — schema manifest
- [Đăng ký Công cụ](/plugins/building-plugins#registering-agent-tools) — thêm công cụ agent trong một plugin
- [Nội bộ Plugin](/plugins/architecture) — mô hình khả năng và quy trình tải
- [Community Plugins](/plugins/community) — danh sách bên thứ ba

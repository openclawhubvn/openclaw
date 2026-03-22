---
summary: "Khả năng của OpenClaw trên các kênh, routing, media và UX."
read_when:
  - Cần danh sách đầy đủ các tính năng OpenClaw hỗ trợ
title: "Tính năng"
---

# Tính năng

## Nổi bật

<Columns>
  <Card title="Channels" icon="message-square">
    WhatsApp, Telegram, Discord và iMessage qua một Gateway duy nhất.
  </Card>
  <Card title="Plugins" icon="plug">
    Thêm Mattermost và nhiều hơn với extensions.
  </Card>
  <Card title="Routing" icon="route">
    Routing đa agent với session tách biệt.
  </Card>
  <Card title="Media" icon="image">
    Hình ảnh, âm thanh và tài liệu vào/ra.
  </Card>
  <Card title="Apps and UI" icon="monitor">
    Web Control UI và ứng dụng đồng hành trên macOS.
  </Card>
  <Card title="Mobile nodes" icon="smartphone">
    Node iOS và Android với pairing, voice/chat và lệnh thiết bị phong phú.
  </Card>
</Columns>

## Danh sách đầy đủ

**Channels:**

- WhatsApp, Telegram, Discord, iMessage (tích hợp sẵn)
- Mattermost, Matrix, Microsoft Teams, Nostr và nhiều hơn (plugins)
- Hỗ trợ chat nhóm với kích hoạt dựa trên mention
- An toàn DM với allowlists và pairing

**Agent:**

- Runtime agent nhúng với tool streaming
- Routing đa agent với session tách biệt theo workspace hoặc sender
- Sessions: chat trực tiếp gộp vào `main` chung; nhóm thì tách biệt
- Streaming và chunking cho phản hồi dài

**Auth và providers:**

- Hơn 35 model providers (Anthropic, OpenAI, Google, v.v.)
- Auth subscription qua OAuth (ví dụ: OpenAI Codex)
- Hỗ trợ provider tùy chỉnh và tự host (vLLM, SGLang, Ollama và bất kỳ endpoint tương thích OpenAI hoặc Anthropic)

**Media:**

- Hình ảnh, âm thanh, video và tài liệu vào/ra
- Chuyển giọng nói thành văn bản
- Text-to-speech với nhiều providers

**Apps và giao diện:**

- WebChat và browser Control UI
- Ứng dụng đồng hành trên thanh menu macOS
- Node iOS với pairing, Canvas, camera, ghi màn hình, định vị và voice
- Node Android với pairing, chat, voice, Canvas, camera và lệnh thiết bị

**Công cụ và tự động hóa:**

- Tự động hóa browser, exec, sandboxing
- Tìm kiếm web (Brave, Perplexity, Gemini, Grok, Kimi, Firecrawl)
- Cron jobs và lập lịch heartbeat
- Skills, plugins và workflow pipelines (Lobster)\n
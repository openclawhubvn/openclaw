---
summary: "Phân biệt SecretRef credential được hỗ trợ và không được hỗ trợ"
read_when:
  - Kiểm tra phạm vi hỗ trợ của SecretRef credential
  - Đánh giá credential có đủ điều kiện cho `secrets configure` hoặc `secrets apply`
  - Xác minh lý do credential nằm ngoài phạm vi hỗ trợ
title: "Phạm vi SecretRef Credential"
---

# Phạm vi SecretRef Credential

Trang này định nghĩa phạm vi chuẩn của SecretRef credential.

Phạm vi:

- Trong phạm vi: chỉ các credential do người dùng cung cấp mà OpenClaw không tự tạo hoặc xoay vòng.
- Ngoài phạm vi: credential tự tạo hoặc xoay vòng, tài liệu làm mới OAuth, và các artifact dạng session.

## Credential được hỗ trợ

### Mục tiêu `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `models.providers.*.apiKey`
- `models.providers.*.headers.*`
- `skills.entries.*.apiKey`
- `agents.defaults.memorySearch.remote.apiKey`
- `agents.list[].memorySearch.remote.apiKey`
- `talk.apiKey`
- `talk.providers.*.apiKey`
- `messages.tts.elevenlabs.apiKey`
- `messages.tts.openai.apiKey`
- `tools.web.fetch.firecrawl.apiKey`
- `plugins.entries.brave.config.webSearch.apiKey`
- `plugins.entries.google.config.webSearch.apiKey`
- `plugins.entries.xai.config.webSearch.apiKey`
- `plugins.entries.moonshot.config.webSearch.apiKey`
- `plugins.entries.perplexity.config.webSearch.apiKey`
- `plugins.entries.firecrawl.config.webSearch.apiKey`
- `plugins.entries.tavily.config.webSearch.apiKey`
- `tools.web.search.apiKey`
- `tools.web.search.gemini.apiKey`
- `tools.web.search.grok.apiKey`
- `tools.web.search.kimi.apiKey`
- `tools.web.search.perplexity.apiKey`
- `gateway.auth.password`
- `gateway.auth.token`
- `gateway.remote.token`
- `gateway.remote.password`
- `cron.webhookToken`
- `channels.telegram.botToken`
- `channels.telegram.webhookSecret`
- `channels.telegram.accounts.*.botToken`
- `channels.telegram.accounts.*.webhookSecret`
- `channels.slack.botToken`
- `channels.slack.appToken`
- `channels.slack.userToken`
- `channels.slack.signingSecret`
- `channels.slack.accounts.*.botToken`
- `channels.slack.accounts.*.appToken`
- `channels.slack.accounts.*.userToken`
- `channels.slack.accounts.*.signingSecret`
- `channels.discord.token`
- `channels.discord.pluralkit.token`
- `channels.discord.voice.tts.elevenlabs.apiKey`
- `channels.discord.voice.tts.openai.apiKey`
- `channels.discord.accounts.*.token`
- `channels.discord.accounts.*.pluralkit.token`
- `channels.discord.accounts.*.voice.tts.elevenlabs.apiKey`
- `channels.discord.accounts.*.voice.tts.openai.apiKey`
- `channels.irc.password`
- `channels.irc.nickserv.password`
- `channels.irc.accounts.*.password`
- `channels.irc.accounts.*.nickserv.password`
- `channels.bluebubbles.password`
- `channels.bluebubbles.accounts.*.password`
- `channels.feishu.appSecret`
- `channels.feishu.encryptKey`
- `channels.feishu.verificationToken`
- `channels.feishu.accounts.*.appSecret`
- `channels.feishu.accounts.*.encryptKey`
- `channels.feishu.accounts.*.verificationToken`
- `channels.msteams.appPassword`
- `channels.mattermost.botToken`
- `channels.mattermost.accounts.*.botToken`
- `channels.matrix.password`
- `channels.matrix.accounts.*.password`
- `channels.nextcloud-talk.botSecret`
- `channels.nextcloud-talk.apiPassword`
- `channels.nextcloud-talk.accounts.*.botSecret`
- `channels.nextcloud-talk.accounts.*.apiPassword`
- `channels.zalo.botToken`
- `channels.zalo.webhookSecret`
- `channels.zalo.accounts.*.botToken`
- `channels.zalo.accounts.*.webhookSecret`
- `channels.googlechat.serviceAccount` qua `serviceAccountRef` (ngoại lệ tương thích)
- `channels.googlechat.accounts.*.serviceAccount` qua `serviceAccountRef` (ngoại lệ tương thích)

### Mục tiêu `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`)
- `profiles.*.tokenRef` (`type: "token"`)

Ghi chú:

- Mục tiêu kế hoạch auth-profile yêu cầu `agentId`.
- Mục tiêu kế hoạch ghi vào `profiles.*.key` / `profiles.*.token` và ghi ref tương ứng (`keyRef` / `tokenRef`).
- Ref auth-profile được bao gồm trong quá trình giải quyết runtime và kiểm toán.
- Với model provider do SecretRef quản lý, các mục `agents/*/agent/models.json` được tạo ra lưu trữ các marker không phải secret (không phải giá trị secret đã giải quyết) cho bề mặt `apiKey`/header.
- Lưu trữ marker là nguồn gốc: OpenClaw ghi marker từ snapshot cấu hình nguồn hoạt động (trước khi giải quyết), không phải từ giá trị secret đã giải quyết runtime.
- Với tìm kiếm web:
  - Ở chế độ provider rõ ràng (`tools.web.search.provider` được đặt), chỉ key của provider được chọn là hoạt động.
  - Ở chế độ tự động (`tools.web.search.provider` không được đặt), chỉ key của provider đầu tiên được giải quyết theo thứ tự ưu tiên là hoạt động.
  - Ở chế độ tự động, các ref provider không được chọn được coi là không hoạt động cho đến khi được chọn.
  - Các đường dẫn provider `tools.web.search.*` cũ vẫn được giải quyết trong thời gian tương thích, nhưng bề mặt SecretRef chuẩn là `plugins.entries.<plugin>.config.webSearch.*`.

## Credential không được hỗ trợ

Credential ngoài phạm vi bao gồm:

- `commands.ownerDisplaySecret`
- `channels.matrix.accessToken`
- `channels.matrix.accounts.*.accessToken`
- `hooks.token`
- `hooks.gmail.pushToken`
- `hooks.mappings[].sessionKey`
- `auth-profiles.oauth.*`
- `discord.threadBindings.*.webhookToken`
- `whatsapp.creds.json`

Lý do:

- Các credential này được tạo, xoay vòng, mang session, hoặc thuộc loại OAuth-durable không phù hợp với giải quyết SecretRef chỉ đọc từ bên ngoài.\n
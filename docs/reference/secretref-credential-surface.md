---
summary: "Khám phá sự khác biệt giữa SecretRef được hỗ trợ và không được hỗ trợ, giúp bạn cấu hình hệ thống hiệu quả hơn."
read_when:
  - Kiểm tra phạm vi hỗ trợ của SecretRef
  - Đánh giá xem một thông tin xác thực có đủ điều kiện cho `secrets configure` hoặc `secrets apply` không
  - Xác minh lý do một thông tin xác thực nằm ngoài phạm vi hỗ trợ
title: "Hướng Dẫn SecretRef Credential Cấu Hình"
---

# Phạm vi SecretRef Credential

Trang này định nghĩa phạm vi chuẩn của SecretRef credential.

Phạm vi:

- Trong phạm vi: thông tin xác thực do người dùng cung cấp mà OpenClaw không tạo hoặc xoay vòng.
- Ngoài phạm vi: thông tin xác thực được tạo hoặc xoay vòng trong thời gian chạy, tài liệu làm mới OAuth, và các tài liệu giống phiên.

## Thông tin xác thực được hỗ trợ

### Mục tiêu `openclaw.json` (`secrets configure` + `secrets apply` + `secrets audit`)

[//]: # "secretref-supported-list-start"

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
- `channels.googlechat.serviceAccount` thông qua `serviceAccountRef` (ngoại lệ tương thích)
- `channels.googlechat.accounts.*.serviceAccount` thông qua `serviceAccountRef` (ngoại lệ tương thích)

### Mục tiêu `auth-profiles.json` (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`)
- `profiles.*.tokenRef` (`type: "token"`)

[//]: # "secretref-supported-list-end"

Ghi chú:

- Mục tiêu kế hoạch auth-profile yêu cầu `agentId`.
- Các mục kế hoạch nhắm đến `profiles.*.key` / `profiles.*.token` và ghi các tham chiếu liền kề (`keyRef` / `tokenRef`).
- Tham chiếu auth-profile được bao gồm trong việc giải quyết và kiểm tra thời gian chạy.
- Đối với các nhà cung cấp mô hình được quản lý bởi SecretRef, các mục `agents/*/agent/models.json` được tạo ra sẽ duy trì các dấu hiệu không phải bí mật (không phải giá trị bí mật đã giải quyết) cho các bề mặt `apiKey`/header.
- Duy trì dấu hiệu là nguồn gốc: OpenClaw ghi dấu hiệu từ ảnh chụp cấu hình nguồn hoạt động (trước khi giải quyết), không phải từ các giá trị bí mật đã giải quyết trong thời gian chạy.
- Đối với tìm kiếm web:
  - Trong chế độ nhà cung cấp rõ ràng (`tools.web.search.provider` được đặt), chỉ có khóa nhà cung cấp đã chọn là hoạt động.
  - Trong chế độ tự động (`tools.web.search.provider` không được đặt), chỉ có khóa nhà cung cấp đầu tiên được giải quyết theo thứ tự ưu tiên là hoạt động.
  - Trong chế độ tự động, các tham chiếu nhà cung cấp không được chọn được coi là không hoạt động cho đến khi được chọn.
  - Các đường dẫn nhà cung cấp `tools.web.search.*` cũ vẫn được giải quyết trong cửa sổ tương thích, nhưng bề mặt SecretRef chuẩn là `plugins.entries.<plugin>.config.webSearch.*`.

## Thông tin xác thực không được hỗ trợ

Các thông tin xác thực ngoài phạm vi bao gồm:

[//]: # "secretref-unsupported-list-start"

- `commands.ownerDisplaySecret`
- `channels.matrix.accessToken`
- `channels.matrix.accounts.*.accessToken`
- `hooks.token`
- `hooks.gmail.pushToken`
- `hooks.mappings[].sessionKey`
- `auth-profiles.oauth.*`
- `discord.threadBindings.*.webhookToken`
- `whatsapp.creds.json`

[//]: # "secretref-unsupported-list-end"

Lý do:

- Các thông tin xác thực này được tạo, xoay vòng, mang tính phiên, hoặc thuộc loại OAuth bền vững không phù hợp với việc giải quyết SecretRef chỉ đọc từ bên ngoài.

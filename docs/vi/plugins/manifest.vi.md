---
summary: "Yêu cầu về manifest plugin + JSON schema (kiểm tra cấu hình chặt chẽ)"
read_when:
  - Đang xây dựng plugin OpenClaw
  - Cần triển khai schema cấu hình plugin hoặc debug lỗi xác thực plugin
title: "Manifest Plugin"
---

# Manifest Plugin (openclaw.plugin.json)

Trang này chỉ dành cho **manifest plugin OpenClaw gốc**.

Để biết về các định dạng bundle tương thích, xem [Plugin bundles](/plugins/bundles).

Các định dạng bundle tương thích sử dụng file manifest khác:

- Codex bundle: `.codex-plugin/plugin.json`
- Claude bundle: `.claude-plugin/plugin.json` hoặc layout Claude mặc định không có manifest
- Cursor bundle: `.cursor-plugin/plugin.json`

OpenClaw tự động nhận diện các layout bundle này, nhưng không kiểm tra theo schema `openclaw.plugin.json` mô tả ở đây.

Với các bundle tương thích, OpenClaw hiện đọc metadata bundle cùng với các skill root khai báo, Claude command root, mặc định `settings.json` của Claude bundle, và các hook pack hỗ trợ khi layout khớp với kỳ vọng runtime của OpenClaw.

Mỗi plugin OpenClaw gốc **phải** có file `openclaw.plugin.json` trong **plugin root**. OpenClaw dùng manifest này để kiểm tra cấu hình **mà không cần chạy code plugin**. Thiếu hoặc manifest không hợp lệ được xem là lỗi plugin và chặn kiểm tra cấu hình.

Xem hướng dẫn hệ thống plugin đầy đủ: [Plugins](/tools/plugin).
Để biết về mô hình khả năng gốc và hướng dẫn tương thích bên ngoài hiện tại: [Capability model](/plugins/architecture#public-capability-model).

## Trường bắt buộc

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

Các khóa bắt buộc:

- `id` (string): id plugin chuẩn.
- `configSchema` (object): JSON Schema cho cấu hình plugin (inline).

Các khóa tùy chọn:

- `kind` (string): loại plugin (ví dụ: `"memory"`, `"context-engine"`).
- `channels` (array): id channel được plugin này đăng ký (khả năng channel; ví dụ: `["matrix"]`).
- `providers` (array): id provider được plugin này đăng ký (khả năng suy luận văn bản).
- `providerAuthEnvVars` (object): biến môi trường auth theo id provider. Dùng khi OpenClaw cần lấy thông tin xác thực provider từ env mà không cần tải runtime plugin trước.
- `providerAuthChoices` (array): metadata onboarding/auth-choice rẻ theo provider + phương thức auth. Dùng khi OpenClaw cần hiển thị provider trong auth-choice pickers, preferred-provider resolution, và CLI help mà không cần tải runtime plugin trước.
- `skills` (array): thư mục skill để tải (tương đối với plugin root).
- `name` (string): tên hiển thị cho plugin.
- `description` (string): tóm tắt ngắn gọn về plugin.
- `uiHints` (object): nhãn/placeholder/flag nhạy cảm cho rendering UI.
- `version` (string): phiên bản plugin (thông tin).

### Hình dạng `providerAuthChoices`

Mỗi mục có thể khai báo:

- `provider`: id provider
- `method`: id phương thức auth
- `choiceId`: id onboarding/auth-choice ổn định
- `choiceLabel` / `choiceHint`: nhãn picker + gợi ý ngắn
- `groupId` / `groupLabel` / `groupHint`: metadata nhóm onboarding
- `optionKey` / `cliFlag` / `cliOption` / `cliDescription`: wiring CLI một-flag tùy chọn cho các luồng auth đơn giản như API keys

Ví dụ:

```json
{
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "OpenRouter API key",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API key"
    }
  ]
}
```

## Yêu cầu JSON Schema

- **Mỗi plugin phải có JSON Schema**, ngay cả khi không chấp nhận cấu hình nào.
- Schema trống là chấp nhận được (ví dụ, `{ "type": "object", "additionalProperties": false }`).
- Schema được kiểm tra tại thời điểm đọc/ghi cấu hình, không phải tại runtime.

## Hành vi xác thực

- Khóa `channels.*` không xác định là **lỗi**, trừ khi id channel được khai báo bởi manifest plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, và `plugins.slots.*` phải tham chiếu đến id plugin **có thể phát hiện**. Id không xác định là **lỗi**.
- Nếu plugin được cài đặt nhưng có manifest hoặc schema bị lỗi hoặc thiếu, xác thực thất bại và Doctor báo lỗi plugin.
- Nếu cấu hình plugin tồn tại nhưng plugin **bị vô hiệu hóa**, cấu hình được giữ lại và **cảnh báo** được hiển thị trong Doctor + logs.

Xem [Configuration reference](/configuration) để biết schema `plugins.*` đầy đủ.

## Ghi chú

- Manifest là **bắt buộc cho plugin OpenClaw gốc**, bao gồm cả tải từ hệ thống file local.
- Runtime vẫn tải module plugin riêng biệt; manifest chỉ dành cho khám phá + xác thực.
- `providerAuthEnvVars` là đường dẫn metadata rẻ cho kiểm tra auth, xác thực env-marker, và các bề mặt provider-auth tương tự không nên khởi động runtime plugin chỉ để kiểm tra tên env.
- `providerAuthChoices` là đường dẫn metadata rẻ cho auth-choice pickers, `--auth-choice` resolution, mapping preferred-provider, và đăng ký flag CLI onboarding đơn giản trước khi runtime provider tải. Đối với metadata wizard runtime yêu cầu mã provider, xem [Provider runtime hooks](/plugins/architecture#provider-runtime-hooks).
- Các loại plugin độc quyền được chọn thông qua `plugins.slots.*`.
  - `kind: "memory"` được chọn bởi `plugins.slots.memory`.
  - `kind: "context-engine"` được chọn bởi `plugins.slots.contextEngine` (mặc định: built-in `legacy`).
- Nếu plugin phụ thuộc vào module gốc, tài liệu hóa các bước build và bất kỳ yêu cầu allowlist package-manager nào (ví dụ, pnpm `allow-build-scripts` - `pnpm rebuild <package>`).\n
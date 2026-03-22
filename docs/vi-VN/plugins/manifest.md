# Plugin Manifest (openclaw.plugin.json)

Trang này chỉ dành cho **manifest plugin gốc của OpenClaw**.

Để biết về cấu trúc bundle tương thích, xem [Plugin bundles](/plugins/bundles).

Các định dạng bundle tương thích sử dụng các file manifest khác nhau:

- Codex bundle: `.codex-plugin/plugin.json`
- Claude bundle: `.claude-plugin/plugin.json` hoặc cấu trúc Claude mặc định không cần manifest
- Cursor bundle: `.cursor-plugin/plugin.json`

OpenClaw tự động nhận diện các cấu trúc bundle này, nhưng chúng không được xác thực theo schema `openclaw.plugin.json` được mô tả ở đây.

Với các bundle tương thích, OpenClaw hiện đọc metadata của bundle cùng với các skill root đã khai báo, Claude command root, mặc định của `settings.json` trong Claude bundle, và các hook pack được hỗ trợ khi cấu trúc phù hợp với kỳ vọng runtime của OpenClaw.

Mỗi plugin gốc của OpenClaw **phải** có file `openclaw.plugin.json` trong **thư mục gốc của plugin**. OpenClaw sử dụng manifest này để xác thực cấu hình **mà không cần thực thi mã plugin**. Thiếu hoặc manifest không hợp lệ được coi là lỗi plugin và chặn xác thực cấu hình.

Xem hướng dẫn đầy đủ về hệ thống plugin: [Plugins](/tools/plugin).
Để biết về mô hình khả năng gốc và hướng dẫn tương thích bên ngoài hiện tại: [Capability model](/plugins/architecture#public-capability-model).

## Các trường bắt buộc

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
- `configSchema` (object): JSON Schema cho cấu hình plugin (nội tuyến).

Các khóa tùy chọn:

- `kind` (string): loại plugin (ví dụ: `"memory"`, `"context-engine"`).
- `channels` (array): id kênh được plugin này đăng ký (khả năng kênh; ví dụ: `["matrix"]`).
- `providers` (array): id nhà cung cấp được plugin này đăng ký (khả năng suy luận văn bản).
- `providerAuthEnvVars` (object): biến môi trường xác thực theo id nhà cung cấp. Sử dụng khi OpenClaw cần lấy thông tin xác thực từ môi trường mà không cần tải runtime plugin trước.
- `providerAuthChoices` (array): metadata onboarding/xác thực rẻ tiền theo nhà cung cấp + phương thức xác thực. Sử dụng khi OpenClaw cần hiển thị nhà cung cấp trong các lựa chọn xác thực, giải quyết nhà cung cấp ưu tiên, và trợ giúp CLI mà không cần tải runtime plugin trước.
- `skills` (array): thư mục skill để tải (tương đối so với thư mục gốc của plugin).
- `name` (string): tên hiển thị cho plugin.
- `description` (string): tóm tắt ngắn gọn về plugin.
- `uiHints` (object): nhãn trường cấu hình/gợi ý/đánh dấu nhạy cảm cho hiển thị UI.
- `version` (string): phiên bản plugin (thông tin).

### Hình dạng `providerAuthChoices`

Mỗi mục có thể khai báo:

- `provider`: id nhà cung cấp
- `method`: id phương thức xác thực
- `choiceId`: id ổn định cho onboarding/xác thực
- `choiceLabel` / `choiceHint`: nhãn chọn + gợi ý ngắn
- `groupId` / `groupLabel` / `groupHint`: metadata nhóm onboarding
- `optionKey` / `cliFlag` / `cliOption` / `cliDescription`: tùy chọn một cờ CLI cho các luồng xác thực đơn giản như khóa API

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

- **Mỗi plugin phải có một JSON Schema**, ngay cả khi không chấp nhận cấu hình nào.
- Một schema trống là chấp nhận được (ví dụ: `{ "type": "object", "additionalProperties": false }`).
- Các schema được xác thực tại thời điểm đọc/ghi cấu hình, không phải tại runtime.

## Hành vi xác thực

- Các khóa `channels.*` không xác định là **lỗi**, trừ khi id kênh được khai báo bởi một manifest plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, và `plugins.slots.*` phải tham chiếu đến id plugin **có thể phát hiện**. Id không xác định là **lỗi**.
- Nếu một plugin được cài đặt nhưng có manifest hoặc schema bị hỏng hoặc thiếu, xác thực sẽ thất bại và Doctor sẽ báo lỗi plugin.
- Nếu cấu hình plugin tồn tại nhưng plugin **bị vô hiệu hóa**, cấu hình vẫn được giữ lại và một **cảnh báo** sẽ xuất hiện trong Doctor + logs.

Xem [Tham chiếu cấu hình](/configuration) để biết đầy đủ về schema `plugins.*`.

## Ghi chú

- Manifest là **bắt buộc cho các plugin gốc của OpenClaw**, bao gồm cả tải từ hệ thống file cục bộ.
- Runtime vẫn tải module plugin riêng biệt; manifest chỉ để phát hiện + xác thực.
- `providerAuthEnvVars` là đường dẫn metadata rẻ tiền cho các kiểm tra xác thực, xác thực dấu môi trường, và các bề mặt xác thực nhà cung cấp tương tự mà không cần khởi động runtime plugin chỉ để kiểm tra tên môi trường.
- `providerAuthChoices` là đường dẫn metadata rẻ tiền cho các lựa chọn xác thực, giải quyết `--auth-choice`, ánh xạ nhà cung cấp ưu tiên, và đăng ký cờ CLI onboarding đơn giản trước khi runtime nhà cung cấp tải. Đối với metadata wizard runtime yêu cầu mã nhà cung cấp, xem [Provider runtime hooks](/plugins/architecture#provider-runtime-hooks).
- Các loại plugin độc quyền được chọn thông qua `plugins.slots.*`.
  - `kind: "memory"` được chọn bởi `plugins.slots.memory`.
  - `kind: "context-engine"` được chọn bởi `plugins.slots.contextEngine` (mặc định: `legacy` tích hợp sẵn).
- Nếu plugin của bạn phụ thuộc vào các module gốc, hãy tài liệu hóa các bước xây dựng và bất kỳ yêu cầu danh sách cho phép trình quản lý gói nào (ví dụ: pnpm `allow-build-scripts` - `pnpm rebuild <package>`).

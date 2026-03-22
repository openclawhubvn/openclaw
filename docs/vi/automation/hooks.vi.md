---
summary: "Hooks: tự động hóa dựa trên sự kiện cho lệnh và sự kiện vòng đời"
read_when:
  - Cần tự động hóa dựa trên sự kiện cho /new, /reset, /stop và sự kiện vòng đời agent
  - Muốn xây dựng, cài đặt, hoặc debug hooks
title: "Hooks"
---

# Hooks

Hooks cung cấp hệ thống mở rộng dựa trên sự kiện để tự động hóa hành động khi có lệnh và sự kiện từ agent. Hooks tự động được phát hiện từ thư mục và quản lý qua CLI, tương tự như cách hoạt động của skills trong OpenClaw.

## Tổng quan

Hooks là các script nhỏ chạy khi có sự kiện. Có hai loại:

- **Hooks** (trang này): chạy trong Gateway khi có sự kiện từ agent như `/new`, `/reset`, `/stop`, hoặc sự kiện vòng đời.
- **Webhooks**: HTTP webhook bên ngoài cho phép hệ thống khác kích hoạt công việc trong OpenClaw. Xem [Webhook Hooks](/automation/webhook) hoặc dùng `openclaw webhooks` cho lệnh trợ giúp Gmail.

Hooks cũng có thể được đóng gói trong plugins; xem [Plugin hooks](/plugins/architecture#provider-runtime-hooks).

Các trường hợp sử dụng phổ biến:

- Lưu snapshot bộ nhớ khi reset session
- Lưu lại lịch sử lệnh để khắc phục sự cố hoặc tuân thủ
- Kích hoạt tự động hóa tiếp theo khi session bắt đầu hoặc kết thúc
- Ghi file vào workspace của agent hoặc gọi API bên ngoài khi có sự kiện

Nếu có thể viết một hàm TypeScript nhỏ, bạn có thể viết một hook. Hooks được phát hiện tự động và có thể bật/tắt qua CLI.

## Bắt đầu

### Hooks đi kèm

OpenClaw có bốn hooks đi kèm được phát hiện tự động:

- **💾 session-memory**: Lưu context session vào workspace của agent (mặc định `~/.openclaw/workspace/memory/`) khi thực hiện `/new`
- **📎 bootstrap-extra-files**: Chèn thêm file bootstrap vào workspace từ các mẫu glob/path đã cấu hình trong `agent:bootstrap`
- **📝 command-logger**: Ghi lại tất cả sự kiện lệnh vào `~/.openclaw/logs/commands.log`
- **🚀 boot-md**: Chạy `BOOT.md` khi gateway khởi động (cần bật hooks nội bộ)

Liệt kê các hooks có sẵn:

```bash
openclaw hooks list
```

Bật một hook:

```bash
openclaw hooks enable session-memory
```

Kiểm tra trạng thái hook:

```bash
openclaw hooks check
```

Lấy thông tin chi tiết:

```bash
openclaw hooks info session-memory
```

### Onboarding

Trong quá trình onboarding (`openclaw onboard`), sẽ có gợi ý bật các hooks được khuyến nghị. Wizard tự động phát hiện các hooks đủ điều kiện và hiển thị để chọn.

## Phát hiện Hook

Hooks tự động được phát hiện từ ba thư mục (theo thứ tự ưu tiên):

1. **Workspace hooks**: `<workspace>/hooks/` (theo agent, ưu tiên cao nhất)
2. **Managed hooks**: `~/.openclaw/hooks/` (người dùng cài đặt, chia sẻ giữa các workspace)
3. **Bundled hooks**: `<openclaw>/dist/hooks/bundled/` (đi kèm với OpenClaw)

Thư mục hook có thể là một **hook đơn** hoặc một **hook pack** (thư mục package).

Mỗi hook là một thư mục chứa:

```
my-hook/
├── HOOK.md          # Metadata + tài liệu
└── handler.ts       # Triển khai handler
```

## Hook Packs (npm/archives)

Hook packs là các package npm chuẩn xuất một hoặc nhiều hooks qua `openclaw.hooks` trong `package.json`. Cài đặt với:

```bash
openclaw hooks install <path-or-spec>
```

Các spec npm chỉ có trong registry (tên package + phiên bản chính xác hoặc dist-tag tùy chọn). Các spec Git/URL/file và phạm vi semver bị từ chối.

Các spec trần và `@latest` giữ trên track ổn định. Nếu npm giải quyết một trong số đó thành một prerelease, OpenClaw dừng và yêu cầu bạn chọn rõ ràng với một tag prerelease như `@beta`/`@rc` hoặc một phiên bản prerelease chính xác.

Ví dụ `package.json`:

```json
{
  "name": "@acme/my-hooks",
  "version": "0.1.0",
  "openclaw": {
    "hooks": ["./hooks/my-hook", "./hooks/other-hook"]
  }
}
```

Mỗi entry trỏ đến một thư mục hook chứa `HOOK.md` và `handler.ts` (hoặc `index.ts`). Hook packs có thể đi kèm dependencies; chúng sẽ được cài đặt dưới `~/.openclaw/hooks/<id>`. Mỗi entry `openclaw.hooks` phải nằm trong thư mục package sau khi giải quyết symlink; các entry thoát ra ngoài bị từ chối.

Lưu ý bảo mật: `openclaw hooks install` cài đặt dependencies với `npm install --ignore-scripts` (không có lifecycle scripts). Giữ cây dependency của hook pack "pure JS/TS" và tránh các package phụ thuộc vào `postinstall` builds.

## Cấu trúc Hook

### Định dạng HOOK.md

File `HOOK.md` chứa metadata trong YAML frontmatter cùng với tài liệu Markdown:

```markdown
---
name: my-hook
description: "Mô tả ngắn gọn về chức năng của hook này"
homepage: https://docs.openclaw.ai/automation/hooks#my-hook
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Tài liệu chi tiết ở đây...

## Chức năng

- Lắng nghe lệnh `/new`
- Thực hiện một số hành động
- Ghi lại kết quả

## Yêu cầu

- Cần cài đặt Node.js

## Cấu hình

Không cần cấu hình.
```

### Trường Metadata

Đối tượng `metadata.openclaw` hỗ trợ:

- **`emoji`**: Emoji hiển thị cho CLI (ví dụ: `"💾"`)
- **`events`**: Mảng các sự kiện cần lắng nghe (ví dụ: `["command:new", "command:reset"]`)
- **`export`**: Export tên cần sử dụng (mặc định là `"default"`)
- **`homepage`**: URL tài liệu
- **`requires`**: Yêu cầu tùy chọn
  - **`bins`**: Các binary cần thiết trên PATH (ví dụ: `["git", "node"]`)
  - **`anyBins`**: Ít nhất một trong các binary này phải có mặt
  - **`env`**: Các biến môi trường cần thiết
  - **`config`**: Các đường dẫn cấu hình cần thiết (ví dụ: `["workspace.dir"]`)
  - **`os`**: Các nền tảng cần thiết (ví dụ: `["darwin", "linux"]`)
- **`always`**: Bỏ qua kiểm tra đủ điều kiện (boolean)
- **`install`**: Phương pháp cài đặt (cho hooks đi kèm: `[{"id":"bundled","kind":"bundled"}]`)

### Triển khai Handler

File `handler.ts` export một hàm `HookHandler`:

```typescript
const myHandler = async (event) => {
  // Chỉ kích hoạt khi có lệnh 'new'
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  console.log(`  Session: ${event.sessionKey}`);
  console.log(`  Timestamp: ${event.timestamp.toISOString()}`);

  // Logic tùy chỉnh của bạn ở đây

  // Tùy chọn gửi tin nhắn đến người dùng
  event.messages.push("✨ My hook executed!");
};

export default myHandler;
```

#### Ngữ cảnh Sự kiện

Mỗi sự kiện bao gồm:

```typescript
{
  type: 'command' | 'session' | 'agent' | 'gateway' | 'message',
  action: string,              // ví dụ: 'new', 'reset', 'stop', 'received', 'sent'
  sessionKey: string,          // Định danh session
  timestamp: Date,             // Thời điểm sự kiện xảy ra
  messages: string[],          // Đẩy tin nhắn vào đây để gửi đến người dùng
  context: {
    // Sự kiện lệnh:
    sessionEntry?: SessionEntry,
    sessionId?: string,
    sessionFile?: string,
    commandSource?: string,    // ví dụ: 'whatsapp', 'telegram'
    senderId?: string,
    workspaceDir?: string,
    bootstrapFiles?: WorkspaceBootstrapFile[],
    cfg?: OpenClawConfig,
    // Sự kiện tin nhắn (xem phần Sự kiện Tin nhắn để biết chi tiết đầy đủ):
    from?: string,             // message:received
    to?: string,               // message:sent
    content?: string,
    channelId?: string,
    success?: boolean,         // message:sent
  }
}
```

## Loại Sự kiện

### Sự kiện Lệnh

Kích hoạt khi có lệnh từ agent:

- **`command`**: Tất cả sự kiện lệnh (nghe tổng quát)
- **`command:new`**: Khi lệnh `/new` được thực hiện
- **`command:reset`**: Khi lệnh `/reset` được thực hiện
- **`command:stop`**: Khi lệnh `/stop` được thực hiện

### Sự kiện Session

- **`session:compact:before`**: Ngay trước khi tóm tắt lịch sử
- **`session:compact:after`**: Sau khi hoàn tất tóm tắt với metadata

Payload hook nội bộ phát ra các sự kiện này dưới dạng `type: "session"` với `action: "compact:before"` / `action: "compact:after"`; người nghe đăng ký với các khóa kết hợp trên. Đăng ký handler cụ thể sử dụng định dạng khóa literal `${type}:${action}`. Với các sự kiện này, đăng ký `session:compact:before` và `session:compact:after`.

### Sự kiện Agent

- **`agent:bootstrap`**: Trước khi các file bootstrap workspace được chèn (hooks có thể thay đổi `context.bootstrapFiles`)

### Sự kiện Gateway

Kích hoạt khi gateway khởi động:

- **`gateway:startup`**: Sau khi các channel khởi động và hooks được tải

### Sự kiện Tin nhắn

Kích hoạt khi tin nhắn được nhận hoặc gửi:

- **`message`**: Tất cả sự kiện tin nhắn (nghe tổng quát)
- **`message:received`**: Khi một tin nhắn inbound được nhận từ bất kỳ channel nào. Kích hoạt sớm trong quá trình xử lý trước khi hiểu media. Nội dung có thể chứa các placeholder thô như `<media:audio>` cho các tệp đính kèm media chưa được xử lý.
- **`message:transcribed`**: Khi một tin nhắn đã được xử lý hoàn toàn, bao gồm cả phiên âm âm thanh và hiểu liên kết. Tại thời điểm này, `transcript` chứa văn bản phiên âm đầy đủ cho các tin nhắn âm thanh. Sử dụng hook này khi cần truy cập nội dung âm thanh đã phiên âm.
- **`message:preprocessed`**: Kích hoạt cho mỗi tin nhắn sau khi hoàn tất hiểu media + liên kết, cho phép hooks truy cập vào nội dung đã làm giàu đầy đủ (phiên âm, mô tả hình ảnh, tóm tắt liên kết) trước khi agent thấy nó.
- **`message:sent`**: Khi một tin nhắn outbound được gửi thành công

#### Ngữ cảnh Sự kiện Tin nhắn

Sự kiện tin nhắn bao gồm ngữ cảnh phong phú về tin nhắn:

```typescript
// ngữ cảnh message:received
{
  from: string,           // Định danh người gửi (số điện thoại, ID người dùng, v.v.)
  content: string,        // Nội dung tin nhắn
  timestamp?: number,     // Unix timestamp khi nhận
  channelId: string,      // Channel (ví dụ: "whatsapp", "telegram", "discord")
  accountId?: string,     // ID tài khoản Provider cho các thiết lập nhiều tài khoản
  conversationId?: string, // ID chat/cuộc trò chuyện
  messageId?: string,     // ID tin nhắn từ provider
  metadata?: {            // Dữ liệu bổ sung cụ thể của provider
    to?: string,
    provider?: string,
    surface?: string,
    threadId?: string,
    senderId?: string,
    senderName?: string,
    senderUsername?: string,
    senderE164?: string,
  }
}

// ngữ cảnh message:sent
{
  to: string,             // Định danh người nhận
  content: string,        // Nội dung tin nhắn đã gửi
  success: boolean,       // Gửi thành công hay không
  error?: string,         // Thông báo lỗi nếu gửi thất bại
  channelId: string,      // Channel (ví dụ: "whatsapp", "telegram", "discord")
  accountId?: string,     // ID tài khoản Provider
  conversationId?: string, // ID chat/cuộc trò chuyện
  messageId?: string,     // ID tin nhắn trả về từ provider
  isGroup?: boolean,      // Tin nhắn outbound này có thuộc nhóm/channel không
  groupId?: string,       // Định danh nhóm/channel để liên kết với message:received
}

// ngữ cảnh message:transcribed
{
  body?: string,          // Nội dung inbound thô trước khi làm giàu
  bodyForAgent?: string,  // Nội dung đã làm giàu hiển thị cho agent
  transcript: string,     // Văn bản phiên âm âm thanh
  channelId: string,      // Channel (ví dụ: "telegram", "whatsapp")
  conversationId?: string,
  messageId?: string,
}

// ngữ cảnh message:preprocessed
{
  body?: string,          // Nội dung inbound thô
  bodyForAgent?: string,  // Nội dung đã làm giàu cuối cùng sau khi hiểu media/liên kết
  transcript?: string,    // Phiên âm khi có âm thanh
  channelId: string,      // Channel (ví dụ: "telegram", "whatsapp")
  conversationId?: string,
  messageId?: string,
  isGroup?: boolean,
  groupId?: string,
}
```

#### Ví dụ: Hook Ghi nhật ký Tin nhắn

```typescript
const isMessageReceivedEvent = (event: { type: string; action: string }) =>
  event.type === "message" && event.action === "received";
const isMessageSentEvent = (event: { type: string; action: string }) =>
  event.type === "message" && event.action === "sent";

const handler = async (event) => {
  if (isMessageReceivedEvent(event as { type: string; action: string })) {
    console.log(`[message-logger] Received from ${event.context.from}: ${event.context.content}`);
  } else if (isMessageSentEvent(event as { type: string; action: string })) {
    console.log(`[message-logger] Sent to ${event.context.to}: ${event.context.content}`);
  }
};

export default handler;
```

### Tool Result Hooks (Plugin API)

Các hooks này không phải là listener sự kiện; chúng cho phép plugins điều chỉnh kết quả công cụ đồng bộ trước khi OpenClaw lưu trữ chúng.

- **`tool_result_persist`**: biến đổi kết quả công cụ trước khi chúng được ghi vào transcript session. Phải đồng bộ; trả về payload kết quả công cụ đã cập nhật hoặc `undefined` để giữ nguyên. Xem [Agent Loop](/concepts/agent-loop).

### Plugin Hook Events

Hooks vòng đời compaction được lộ ra qua plugin hook runner:

- **`before_compaction`**: Chạy trước khi compaction với metadata đếm/token
- **`after_compaction`**: Chạy sau khi compaction với metadata tóm tắt compaction

### Sự kiện Tương lai

Các loại sự kiện dự kiến:

- **`session:start`**: Khi một session mới bắt đầu
- **`session:end`**: Khi một session kết thúc
- **`agent:error`**: Khi một agent gặp lỗi

## Tạo Hooks Tùy chỉnh

### 1. Chọn Vị trí

- **Workspace hooks** (`<workspace>/hooks/`): Theo agent, ưu tiên cao nhất
- **Managed hooks** (`~/.openclaw/hooks/`): Chia sẻ giữa các workspace

### 2. Tạo Cấu trúc Thư mục

```bash
mkdir -p ~/.openclaw/hooks/my-hook
cd ~/.openclaw/hooks/my-hook
```

### 3. Tạo HOOK.md

```markdown
---
name: my-hook
description: "Thực hiện một việc hữu ích"
metadata: { "openclaw": { "emoji": "🎯", "events": ["command:new"] } }
---

# My Custom Hook

Hook này thực hiện một việc hữu ích khi bạn thực hiện `/new`.
```

### 4. Tạo handler.ts

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log("[my-hook] Running!");
  // Logic của bạn ở đây
};

export default handler;
```

### 5. Bật và Kiểm tra

```bash
# Xác minh hook được phát hiện
openclaw hooks list

# Bật nó
openclaw hooks enable my-hook

# Khởi động lại quá trình gateway của bạn (menu bar app restart trên macOS, hoặc khởi động lại quá trình dev của bạn)

# Kích hoạt sự kiện
# Gửi /new qua kênh nhắn tin của bạn
```

## Cấu hình

### Định dạng Cấu hình Mới (Khuyến nghị)

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

### Cấu hình Theo Hook

Hooks có thể có cấu hình tùy chỉnh:

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": {
            "MY_CUSTOM_VAR": "value"
          }
        }
      }
    }
  }
}
```

### Thư mục Bổ sung

Tải hooks từ các thư mục bổ sung:

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

### Định dạng Cấu hình Cũ (Vẫn được hỗ trợ)

Định dạng cấu hình cũ vẫn hoạt động để tương thích ngược:

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "handlers": [
        {
          "event": "command:new",
          "module": "./hooks/handlers/my-handler.ts",
          "export": "default"
        }
      ]
    }
  }
}
```

Lưu ý: `module` phải là đường dẫn tương đối workspace. Các đường dẫn tuyệt đối và vượt ra ngoài workspace bị từ chối.

**Di chuyển**: Sử dụng hệ thống dựa trên phát hiện mới cho các hooks mới. Các handlers cũ được tải sau các hooks dựa trên thư mục.

## Lệnh CLI

### Liệt kê Hooks

```bash
# Liệt kê tất cả hooks
openclaw hooks list

# Chỉ hiển thị hooks đủ điều kiện
openclaw hooks list --eligible

# Đầu ra chi tiết (hiển thị yêu cầu thiếu)
openclaw hooks list --verbose

# Đầu ra JSON
openclaw hooks list --json
```

### Thông tin Hook

```bash
# Hiển thị thông tin chi tiết về một hook
openclaw hooks info session-memory

# Đầu ra JSON
openclaw hooks info session-memory --json
```

### Kiểm tra Đủ điều kiện

```bash
# Hiển thị tóm tắt đủ điều kiện
openclaw hooks check

# Đầu ra JSON
openclaw hooks check --json
```

### Bật/Tắt

```bash
# Bật một hook
openclaw hooks enable session-memory

# Tắt một hook
openclaw hooks disable command-logger
```

## Tham khảo hook đi kèm

### session-memory

Lưu context session vào bộ nhớ khi thực hiện `/new`.

**Sự kiện**: `command:new`

**Yêu cầu**: `workspace.dir` phải được cấu hình

**Đầu ra**: `<workspace>/memory/YYYY-MM-DD-slug.md` (mặc định là `~/.openclaw/workspace`)

**Chức năng**:

1. Sử dụng entry session trước khi reset để xác định transcript chính xác
2. Trích xuất 15 dòng cuối cùng của cuộc trò chuyện
3. Sử dụng LLM để tạo tên file mô tả
4. Lưu metadata session vào file bộ nhớ có ngày

**Ví dụ đầu ra**:

```markdown
# Session: 2026-01-16 14:30:00 UTC

- **Session Key**: agent:main:main
- **Session ID**: abc123def456
- **Source**: telegram
```

**Ví dụ tên file**:

- `2026-01-16-vendor-pitch.md`
- `2026-01-16-api-design.md`
- `2026-01-16-1430.md` (tên fallback nếu tạo slug thất bại)

**Bật**:

```bash
openclaw hooks enable session-memory
```

### bootstrap-extra-files

Chèn thêm file bootstrap (ví dụ `AGENTS.md` / `TOOLS.md` trong monorepo-local) trong `agent:bootstrap`.

**Sự kiện**: `agent:bootstrap`

**Yêu cầu**: `workspace.dir` phải được cấu hình

**Đầu ra**: Không có file nào được ghi; context bootstrap chỉ được thay đổi trong bộ nhớ.

**Cấu hình**:

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

**Lưu ý**:

- Các đường dẫn được giải quyết tương đối với workspace.
- Các file phải nằm trong workspace (kiểm tra realpath).
- Chỉ các tên file bootstrap được công nhận mới được tải.
- Danh sách cho phép subagent được bảo toàn (`AGENTS.md` và `TOOLS.md` chỉ).

**Bật**:

```bash
openclaw hooks enable bootstrap-extra-files
```

### command-logger

Ghi lại tất cả sự kiện lệnh vào file audit tập trung.

**Sự kiện**: `command`

**Yêu cầu**: Không có

**Đầu ra**: `~/.openclaw/logs/commands.log`

**Chức năng**:

1. Ghi lại chi tiết sự kiện (hành động lệnh, timestamp, session key, sender ID, nguồn)
2. Thêm vào file log dưới định dạng JSONL
3. Chạy ngầm trong nền

**Ví dụ mục nhật ký**:

```jsonl
{"timestamp":"2026-01-16T14:30:00.000Z","action":"new","sessionKey":"agent:main:main","senderId":"+1234567890","source":"telegram"}
{"timestamp":"2026-01-16T15:45:22.000Z","action":"stop","sessionKey":"agent:main:main","senderId":"user@example.com","source":"whatsapp"}
```

**Xem nhật ký**:

```bash
# Xem các lệnh gần đây
tail -n 20 ~/.openclaw/logs/commands.log

# In đẹp với jq
cat ~/.openclaw/logs/commands.log | jq .

# Lọc theo hành động
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Bật**:

```bash
openclaw hooks enable command-logger
```

### boot-md

Chạy `BOOT.md` khi gateway khởi động (sau khi các channel khởi động).
Cần bật hooks nội bộ để chạy.

**Sự kiện**: `gateway:startup`

**Yêu cầu**: `workspace.dir` phải được cấu hình

**Chức năng**:

1. Đọc `BOOT.md` từ workspace của bạn
2. Chạy các hướng dẫn qua agent runner
3. Gửi bất kỳ tin nhắn outbound nào được yêu cầu qua công cụ tin nhắn

**Bật**:

```bash
openclaw hooks enable boot-md
```

## Thực hành tốt nhất

### Giữ Handlers Nhanh

Hooks chạy trong quá trình xử lý lệnh. Giữ chúng nhẹ:

```typescript
// ✓ Tốt - công việc async, trả về ngay lập tức
const handler: HookHandler = async (event) => {
  void processInBackground(event); // Fire and forget
};

// ✗ Xấu - chặn xử lý lệnh
const handler: HookHandler = async (event) => {
  await slowDatabaseQuery(event);
  await evenSlowerAPICall(event);
};
```

### Xử lý Lỗi Khéo léo

Luôn bọc các thao tác rủi ro:

```typescript
const handler: HookHandler = async (event) => {
  try {
    await riskyOperation(event);
  } catch (err) {
    console.error("[my-handler] Failed:", err instanceof Error ? err.message : String(err));
    // Không throw - để các handler khác chạy
  }
};
```

### Lọc Sự kiện Sớm

Trả về sớm nếu sự kiện không liên quan:

```typescript
const handler: HookHandler = async (event) => {
  // Chỉ xử lý lệnh 'new'
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  // Logic của bạn ở đây
};
```

### Sử dụng Khóa Sự kiện Cụ thể

Chỉ định các sự kiện chính xác trong metadata khi có thể:

```yaml
metadata: { "openclaw": { "events": ["command:new"] } } # Cụ thể
```

Thay vì:

```yaml
metadata: { "openclaw": { "events": ["command"] } } # Tổng quát - nhiều overhead hơn
```

## Debugging

### Bật Ghi nhật ký Hook

Gateway ghi lại việc tải hook khi khởi động:

```
Registered hook: session-memory -> command:new
Registered hook: bootstrap-extra-files -> agent:bootstrap
Registered hook: command-logger -> command
Registered hook: boot-md -> gateway:startup
```

### Kiểm tra Phát hiện

Liệt kê tất cả hooks đã phát hiện:

```bash
openclaw hooks list --verbose
```

### Kiểm tra Đăng ký

Trong handler của bạn, ghi log khi nó được gọi:

```typescript
const handler: HookHandler = async (event) => {
  console.log("[my-handler] Triggered:", event.type, event.action);
  // Logic của bạn
};
```

### Xác minh Đủ điều kiện

Kiểm tra lý do một hook không đủ điều kiện:

```bash
openclaw hooks info my-hook
```

Tìm kiếm yêu cầu thiếu trong đầu ra.

## Testing

### Nhật ký Gateway

Theo dõi nhật ký gateway để xem thực thi hook:

```bash
# macOS
./scripts/clawlog.sh -f

# Nền tảng khác
tail -f ~/.openclaw/gateway.log
```

### Kiểm tra Hooks Trực tiếp

Kiểm tra handlers của bạn trong isolation:

```typescript
import { test } from "vitest";
import myHandler from "./hooks/my-hook/handler.js";

test("my handler works", async () => {
  const event = {
    type: "command",
    action: "new",
    sessionKey: "test-session",
    timestamp: new Date(),
    messages: [],
    context: { foo: "bar" },
  };

  await myHandler(event);

  // Assert side effects
});
```

## Kiến trúc

### Thành phần Cốt lõi

- **`src/hooks/types.ts`**: Định nghĩa kiểu
- **`src/hooks/workspace.ts`**: Quét thư mục và tải
- **`src/hooks/frontmatter.ts`**: Phân tích metadata HOOK.md
- **`src/hooks/config.ts`**: Kiểm tra đủ điều kiện
- **`src/hooks/hooks-status.ts`**: Báo cáo trạng thái
- **`src/hooks/loader.ts`**: Tải module động
- **`src/cli/hooks-cli.ts`**: Lệnh CLI
- **`src/gateway/server-startup.ts`**: Tải hooks khi gateway khởi động
- **`src/auto-reply/reply/commands-core.ts`**: Kích hoạt sự kiện lệnh

### Luồng Phát hiện

```
Gateway khởi động
    ↓
Quét thư mục (workspace → managed → bundled)
    ↓
Phân tích file HOOK.md
    ↓
Kiểm tra đủ điều kiện (bins, env, config, os)
    ↓
Tải handlers từ hooks đủ điều kiện
    ↓
Đăng ký handlers cho sự kiện
```

### Luồng Sự kiện

```
Người dùng gửi /new
    ↓
Xác thực lệnh
    ↓
Tạo sự kiện hook
    ↓
Kích hoạt hook (tất cả handlers đã đăng ký)
    ↓
Tiếp tục xử lý lệnh
    ↓
Reset session
```

## Khắc phục sự cố

### Hook Không Được Phát hiện

1. Kiểm tra cấu trúc thư mục:

   ```bash
   ls -la ~/.openclaw/hooks/my-hook/
   # Nên hiển thị: HOOK.md, handler.ts
   ```

2. Xác minh định dạng HOOK.md:

   ```bash
   cat ~/.openclaw/hooks/my-hook/HOOK.md
   # Nên có YAML frontmatter với tên và metadata
   ```

3. Liệt kê tất cả hooks đã phát hiện:

   ```bash
   openclaw hooks list
   ```

### Hook Không Đủ điều kiện

Kiểm tra yêu cầu:

```bash
openclaw hooks info my-hook
```

Tìm kiếm thiếu:

- Binaries (kiểm tra PATH)
- Biến môi trường
- Giá trị cấu hình
- Tương thích OS

### Hook Không Thực thi

1. Xác minh hook đã được bật:

   ```bash
   openclaw hooks list
   # Nên hiển thị ✓ bên cạnh các hooks đã bật
   ```

2. Khởi động lại quá trình gateway của bạn để hooks tải lại.

3. Kiểm tra nhật ký gateway để tìm lỗi:

   ```bash
   ./scripts/clawlog.sh | grep hook
   ```

### Lỗi Handler

Kiểm tra lỗi TypeScript/import:

```bash
# Kiểm tra import trực tiếp
node -e "import('./path/to/handler.ts').then(console.log)"
```

## Hướng dẫn Di chuyển

### Từ Cấu hình Cũ sang Phát hiện

**Trước**:

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "handlers": [
        {
          "event": "command:new",
          "module": "./hooks/handlers/my-handler.ts"
        }
      ]
    }
  }
}
```

**Sau**:

1. Tạo thư mục hook:

   ```bash
   mkdir -p ~/.openclaw/hooks/my-hook
   mv ./hooks/handlers/my-handler.ts ~/.openclaw/hooks/my-hook/handler.ts
   ```

2. Tạo HOOK.md:

   ```markdown
   ---
   name: my-hook
   description: "My custom hook"
   metadata: { "openclaw": { "emoji": "🎯", "events": ["command:new"] } }
   ---

   # My Hook

   Thực hiện một việc hữu ích.
   ```

3. Cập nhật cấu hình:

   ```json
   {
     "hooks": {
       "internal": {
         "enabled": true,
         "entries": {
           "my-hook": { "enabled": true }
         }
       }
     }
   }
   ```

4. Xác minh và khởi động lại quá trình gateway của bạn:

   ```bash
   openclaw hooks list
   # Nên hiển thị: 🎯 my-hook ✓
   ```

**Lợi ích của việc di chuyển**:

- Phát hiện tự động
- Quản lý qua CLI
- Kiểm tra đủ điều kiện
- Tài liệu tốt hơn
- Cấu trúc nhất quán

## Xem thêm

- [CLI Reference: hooks](/cli/hooks)
- [Bundled Hooks README](https://github.com/openclaw/openclaw/tree/main/src/hooks/bundled)
- [Webhook Hooks](/automation/webhook)
- [Configuration](/gateway/configuration-reference#hooks)\n
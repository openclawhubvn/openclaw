---
title: "Hướng Dẫn Tích Hợp Agent Pi"
summary: "Khám phá kiến trúc tích hợp Agent Pi nhúng và quản lý vòng đời phiên hiệu quả trong OpenClaw."
read_when:
  - Hiểu thiết kế tích hợp Pi SDK trong OpenClaw
  - Sửa đổi vòng đời phiên agent, công cụ, hoặc kết nối provider cho Pi
---

# Kiến trúc Tích hợp Pi

Tài liệu này mô tả cách OpenClaw tích hợp với [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) và các gói liên quan (`pi-ai`, `pi-agent-core`, `pi-tui`) để cung cấp khả năng agent AI.

## Tổng quan

OpenClaw sử dụng pi SDK để nhúng một agent mã hóa AI vào kiến trúc cổng nhắn tin của mình. Thay vì khởi tạo pi như một subprocess hoặc sử dụng chế độ RPC, OpenClaw trực tiếp nhập và khởi tạo `AgentSession` của pi thông qua `createAgentSession()`. Cách tiếp cận nhúng này cung cấp:

- Kiểm soát hoàn toàn vòng đời phiên và xử lý sự kiện
- Tiêm công cụ tùy chỉnh (nhắn tin, sandbox, hành động cụ thể cho từng kênh)
- Tùy chỉnh lời nhắc hệ thống cho từng kênh/ngữ cảnh
- Duy trì phiên với hỗ trợ phân nhánh/nén
- Xoay vòng hồ sơ xác thực đa tài khoản với dự phòng
- Chuyển đổi mô hình không phụ thuộc vào nhà cung cấp

## Phụ thuộc gói

```json
{
  "@mariozechner/pi-agent-core": "0.49.3",
  "@mariozechner/pi-ai": "0.49.3",
  "@mariozechner/pi-coding-agent": "0.49.3",
  "@mariozechner/pi-tui": "0.49.3"
}
```

| Gói               | Mục đích                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `pi-ai`           | Trừu tượng hóa LLM cốt lõi: `Model`, `streamSimple`, loại tin nhắn, API nhà cung cấp                   |
| `pi-agent-core`   | Vòng lặp agent, thực thi công cụ, loại `AgentMessage`                                                  |
| `pi-coding-agent` | SDK cấp cao: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, công cụ tích hợp  |
| `pi-tui`          | Thành phần giao diện người dùng terminal (sử dụng trong chế độ TUI cục bộ của OpenClaw)                |

## Cấu trúc tệp

```
src/agents/
├── pi-embedded-runner.ts          # Tái xuất từ pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Điểm vào chính: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Logic thử nghiệm đơn lẻ với thiết lập phiên
│   │   ├── params.ts              # Loại RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Xây dựng payload phản hồi từ kết quả chạy
│   │   ├── images.ts              # Tiêm hình ảnh mô hình thị giác
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Phát hiện lỗi hủy
│   ├── cache-ttl.ts               # Theo dõi TTL cache để cắt tỉa ngữ cảnh
│   ├── compact.ts                 # Logic nén thủ công/tự động
│   ├── extensions.ts              # Tải các tiện ích mở rộng pi cho các lần chạy nhúng
│   ├── extra-params.ts            # Tham số luồng cụ thể cho nhà cung cấp
│   ├── google.ts                  # Sửa lỗi thứ tự lượt Google/Gemini
│   ├── history.ts                 # Giới hạn lịch sử (DM so với nhóm)
│   ├── lanes.ts                   # Làn lệnh phiên/toàn cầu
│   ├── logger.ts                  # Logger hệ thống con
│   ├── model.ts                   # Giải quyết mô hình qua ModelRegistry
│   ├── runs.ts                    # Theo dõi chạy hoạt động, hủy, hàng đợi
│   ├── sandbox-info.ts            # Thông tin sandbox cho lời nhắc hệ thống
│   ├── session-manager-cache.ts   # Bộ nhớ đệm phiên bản SessionManager
│   ├── session-manager-init.ts    # Khởi tạo tệp phiên
│   ├── system-prompt.ts           # Trình tạo lời nhắc hệ thống
│   ├── tool-split.ts              # Chia công cụ thành tích hợp sẵn và tùy chỉnh
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Ánh xạ ThinkLevel, mô tả lỗi
├── pi-embedded-subscribe.ts       # Đăng ký/xử lý sự kiện phiên
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Nhà máy xử lý sự kiện
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Chia khối phản hồi luồng
├── pi-embedded-messaging.ts       # Theo dõi công cụ nhắn tin đã gửi
├── pi-embedded-helpers.ts         # Phân loại lỗi, xác thực lượt
├── pi-embedded-helpers/           # Mô-đun trợ giúp
├── pi-embedded-utils.ts           # Tiện ích định dạng
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Gói AbortSignal cho công cụ
├── pi-tools.policy.ts             # Chính sách danh sách cho phép/từ chối công cụ
├── pi-tools.read.ts               # Tùy chỉnh công cụ đọc
├── pi-tools.schema.ts             # Chuẩn hóa lược đồ công cụ
├── pi-tools.types.ts              # Alias loại AnyAgentTool
├── pi-tool-definition-adapter.ts  # Bộ chuyển đổi AgentTool -> ToolDefinition
├── pi-settings.ts                 # Ghi đè cài đặt
├── pi-extensions/                 # Tiện ích mở rộng pi tùy chỉnh
│   ├── compaction-safeguard.ts    # Tiện ích bảo vệ
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Tiện ích cắt tỉa ngữ cảnh dựa trên TTL cache
│   └── context-pruning/
├── model-auth.ts                  # Giải quyết hồ sơ xác thực
├── auth-profiles.ts               # Lưu trữ hồ sơ, thời gian chờ, dự phòng
├── model-selection.ts             # Giải quyết mô hình mặc định
├── models-config.ts               # Tạo models.json
├── model-catalog.ts               # Bộ nhớ đệm danh mục mô hình
├── context-window-guard.ts        # Xác thực cửa sổ ngữ cảnh
├── failover-error.ts              # Lớp FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Giải quyết tham số lời nhắc hệ thống
├── system-prompt-report.ts        # Tạo báo cáo gỡ lỗi
├── tool-summaries.ts              # Tóm tắt mô tả công cụ
├── tool-policy.ts                 # Giải quyết chính sách công cụ
├── transcript-policy.ts           # Chính sách xác thực bản ghi
├── skills.ts                      # Ảnh chụp kỹ năng/xây dựng lời nhắc
├── skills/                        # Hệ thống con kỹ năng
├── sandbox.ts                     # Giải quyết ngữ cảnh sandbox
├── sandbox/                       # Hệ thống con sandbox
├── channel-tools.ts               # Tiêm công cụ cụ thể cho từng kênh
├── openclaw-tools.ts              # Công cụ cụ thể cho OpenClaw
├── bash-tools.ts                  # Công cụ exec/process
├── apply-patch.ts                 # Công cụ apply_patch (OpenAI)
├── tools/                         # Triển khai công cụ cá nhân
│   ├── browser-tool.ts
│   ├── canvas-tool.ts
│   ├── cron-tool.ts
│   ├── gateway-tool.ts
│   ├── image-tool.ts
│   ├── message-tool.ts
│   ├── nodes-tool.ts
│   ├── session*.ts
│   ├── web-*.ts
│   └── ...
└── ...
```

Các runtime hành động tin nhắn cụ thể cho từng kênh hiện nằm trong thư mục tiện ích mở rộng do plugin sở hữu thay vì dưới `src/agents/tools`, ví dụ:

- `extensions/discord/src/actions/runtime*.ts`
- `extensions/slack/src/action-runtime.ts`
- `extensions/telegram/src/action-runtime.ts`
- `extensions/whatsapp/src/action-runtime.ts`

## Quy trình Tích hợp Cốt lõi

### 1. Chạy một Agent Nhúng

Điểm vào chính là `runEmbeddedPiAgent()` trong `pi-embedded-runner/run.ts`:

```typescript
import { runEmbeddedPiAgent } from "./agents/pi-embedded-runner.js";

const result = await runEmbeddedPiAgent({
  sessionId: "user-123",
  sessionKey: "main:whatsapp:+1234567890",
  sessionFile: "/path/to/session.jsonl",
  workspaceDir: "/path/to/workspace",
  config: openclawConfig,
  prompt: "Hello, how are you?",
  provider: "anthropic",
  model: "claude-sonnet-4-20250514",
  timeoutMs: 120_000,
  runId: "run-abc",
  onBlockReply: async (payload) => {
    await sendToChannel(payload.text, payload.mediaUrls);
  },
});
```

### 2. Tạo Phiên

Bên trong `runEmbeddedAttempt()` (được gọi bởi `runEmbeddedPiAgent()`), pi SDK được sử dụng:

```typescript
import {
  createAgentSession,
  DefaultResourceLoader,
  SessionManager,
  SettingsManager,
} from "@mariozechner/pi-coding-agent";

const resourceLoader = new DefaultResourceLoader({
  cwd: resolvedWorkspace,
  agentDir,
  settingsManager,
  additionalExtensionPaths,
});
await resourceLoader.reload();

const { session } = await createAgentSession({
  cwd: resolvedWorkspace,
  agentDir,
  authStorage: params.authStorage,
  modelRegistry: params.modelRegistry,
  model: params.model,
  thinkingLevel: mapThinkingLevel(params.thinkLevel),
  tools: builtInTools,
  customTools: allCustomTools,
  sessionManager,
  settingsManager,
  resourceLoader,
});

applySystemPromptOverrideToSession(session, systemPromptOverride);
```

### 3. Đăng ký Sự kiện

`subscribeEmbeddedPiSession()` đăng ký các sự kiện `AgentSession` của pi:

```typescript
const subscription = subscribeEmbeddedPiSession({
  session: activeSession,
  runId: params.runId,
  verboseLevel: params.verboseLevel,
  reasoningMode: params.reasoningLevel,
  toolResultFormat: params.toolResultFormat,
  onToolResult: params.onToolResult,
  onReasoningStream: params.onReasoningStream,
  onBlockReply: params.onBlockReply,
  onPartialReply: params.onPartialReply,
  onAgentEvent: params.onAgentEvent,
});
```

Các sự kiện được xử lý bao gồm:

- `message_start` / `message_end` / `message_update` (luồng văn bản/suy nghĩ)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `auto_compaction_start` / `auto_compaction_end`

### 4. Nhắc nhở

Sau khi thiết lập, phiên được nhắc nhở:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK xử lý toàn bộ vòng lặp agent: gửi đến LLM, thực thi các cuộc gọi công cụ, luồng phản hồi.

Tiêm hình ảnh là cục bộ cho lời nhắc: OpenClaw tải các tham chiếu hình ảnh từ lời nhắc hiện tại và truyền chúng qua `images` chỉ cho lượt đó. Nó không quét lại các lượt lịch sử cũ hơn để tiêm lại payload hình ảnh.

## Kiến trúc Công cụ

### Quy trình Công cụ

1. **Công cụ Cơ bản**: `codingTools` của pi (đọc, bash, chỉnh sửa, viết)
2. **Thay thế Tùy chỉnh**: OpenClaw thay thế bash bằng `exec`/`process`, tùy chỉnh đọc/chỉnh sửa/viết cho sandbox
3. **Công cụ OpenClaw**: nhắn tin, trình duyệt, canvas, phiên, cron, gateway, v.v.
4. **Công cụ Kênh**: Công cụ hành động cụ thể cho Discord/Telegram/Slack/WhatsApp
5. **Lọc Chính sách**: Công cụ được lọc theo hồ sơ, nhà cung cấp, agent, nhóm, chính sách sandbox
6. **Chuẩn hóa Lược đồ**: Lược đồ được làm sạch cho các quirks của Gemini/OpenAI
7. **Gói AbortSignal**: Công cụ được gói để tôn trọng tín hiệu hủy

### Bộ chuyển đổi Định nghĩa Công cụ

`AgentTool` của pi-agent-core có chữ ký `execute` khác với `ToolDefinition` của pi-coding-agent. Bộ chuyển đổi trong `pi-tool-definition-adapter.ts` kết nối điều này:

```typescript
export function toToolDefinitions(tools: AnyAgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    name: tool.name,
    label: tool.label ?? name,
    description: tool.description ?? "",
    parameters: tool.parameters,
    execute: async (toolCallId, params, onUpdate, _ctx, signal) => {
      // Chữ ký pi-coding-agent khác với pi-agent-core
      return await tool.execute(toolCallId, params, signal, onUpdate);
    },
  }));
}
```

### Chiến lược Chia Công cụ

`splitSdkTools()` truyền tất cả công cụ qua `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Trống. Chúng tôi ghi đè mọi thứ
    customTools: toToolDefinitions(options.tools),
  };
}
```

Điều này đảm bảo lọc chính sách của OpenClaw, tích hợp sandbox, và bộ công cụ mở rộng vẫn nhất quán trên các nhà cung cấp.

## Xây dựng Lời nhắc Hệ thống

Lời nhắc hệ thống được xây dựng trong `buildAgentSystemPrompt()` (`system-prompt.ts`). Nó lắp ráp một lời nhắc đầy đủ với các phần bao gồm Công cụ, Phong cách Cuộc gọi Công cụ, Rào chắn An toàn, Tham khảo CLI OpenClaw, Kỹ năng, Tài liệu, Không gian làm việc, Sandbox, Nhắn tin, Thẻ Phản hồi, Giọng nói, Phản hồi Im lặng, Nhịp tim, Siêu dữ liệu Thời gian chạy, cộng với Bộ nhớ và Phản ứng khi được bật, và các tệp ngữ cảnh tùy chọn và nội dung lời nhắc hệ thống bổ sung. Các phần được cắt tỉa cho chế độ lời nhắc tối thiểu được sử dụng bởi các subagent.

Lời nhắc được áp dụng sau khi tạo phiên thông qua `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Quản lý Phiên

### Tệp Phiên

Các phiên là các tệp JSONL với cấu trúc cây (liên kết id/parentId). `SessionManager` của Pi xử lý duy trì:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw bao bọc điều này với `guardSessionManager()` để đảm bảo an toàn kết quả công cụ.

### Bộ nhớ đệm Phiên

`session-manager-cache.ts` lưu trữ các phiên bản SessionManager để tránh phân tích tệp lặp lại:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Giới hạn Lịch sử

`limitHistoryTurns()` cắt tỉa lịch sử hội thoại dựa trên loại kênh (DM so với nhóm).

### Nén

Nén tự động kích hoạt khi ngữ cảnh tràn. `compactEmbeddedPiSessionDirect()` xử lý nén thủ công:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Xác thực & Giải quyết Mô hình

### Hồ sơ Xác thực

OpenClaw duy trì một kho hồ sơ xác thực với nhiều khóa API cho mỗi nhà cung cấp:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Hồ sơ xoay vòng khi gặp lỗi với theo dõi thời gian chờ:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### Giải quyết Mô hình

```typescript
import { resolveModel } from "./pi-embedded-runner/model.js";

const { model, error, authStorage, modelRegistry } = resolveModel(
  provider,
  modelId,
  agentDir,
  config,
);

// Sử dụng ModelRegistry và AuthStorage của pi
authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
```

### Dự phòng

`FailoverError` kích hoạt chuyển đổi mô hình khi được cấu hình:

```typescript
if (fallbackConfigured && isFailoverErrorMessage(errorText)) {
  throw new FailoverError(errorText, {
    reason: promptFailoverReason ?? "unknown",
    provider,
    model: modelId,
    profileId,
    status: resolveFailoverStatus(promptFailoverReason),
  });
}
```

## Tiện ích mở rộng Pi

OpenClaw tải các tiện ích mở rộng pi tùy chỉnh cho hành vi chuyên biệt:

### Bảo vệ Nén

`src/agents/pi-extensions/compaction-safeguard.ts` thêm rào chắn cho nén, bao gồm ngân sách token thích ứng cộng với tóm tắt lỗi công cụ và thao tác tệp:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Cắt tỉa Ngữ cảnh

`src/agents/pi-extensions/context-pruning.ts` triển khai cắt tỉa ngữ cảnh dựa trên TTL cache:

```typescript
if (cfg?.agents?.defaults?.contextPruning?.mode === "cache-ttl") {
  setContextPruningRuntime(params.sessionManager, {
    settings,
    contextWindowTokens,
    isToolPrunable,
    lastCacheTouchAt,
  });
  paths.push(resolvePiExtensionPath("context-pruning"));
}
```

## Luồng & Phản hồi Khối

### Chia Khối

`EmbeddedBlockChunker` quản lý luồng văn bản thành các khối phản hồi rời rạc:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Loại bỏ Thẻ Suy nghĩ/Chung kết

Luồng đầu ra được xử lý để loại bỏ các khối `<think>`/`<thinking>` và trích xuất nội dung `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Loại bỏ nội dung <think>...</think>
  // Nếu enforceFinalTag, chỉ trả về nội dung <final>...</final>
};
```

### Chỉ thị Phản hồi

Các chỉ thị phản hồi như `[[media:url]]`, `[[voice]]`, `[[reply:id]]` được phân tích và trích xuất:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Xử lý Lỗi

### Phân loại Lỗi

`pi-embedded-helpers.ts` phân loại lỗi để xử lý phù hợp:

```typescript
isContextOverflowError(errorText)     // Ngữ cảnh quá lớn
isCompactionFailureError(errorText)   // Nén thất bại
isAuthAssistantError(lastAssistant)   // Xác thực thất bại
isRateLimitAssistantError(...)        // Bị giới hạn tốc độ
isFailoverAssistantError(...)         // Nên chuyển đổi dự phòng
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Suy nghĩ Cấp độ Dự phòng

Nếu một cấp độ suy nghĩ không được hỗ trợ, nó sẽ chuyển sang dự phòng:

```typescript
const fallbackThinking = pickFallbackThinkingLevel({
  message: errorText,
  attempted: attemptedThinking,
});
if (fallbackThinking) {
  thinkLevel = fallbackThinking;
  continue;
}
```

## Tích hợp Sandbox

Khi chế độ sandbox được bật, công cụ và đường dẫn bị giới hạn:

```typescript
const sandbox = await resolveSandboxContext({
  config: params.config,
  sessionKey: sandboxSessionKey,
  workspaceDir: resolvedWorkspace,
});

if (sandboxRoot) {
  // Sử dụng công cụ đọc/chỉnh sửa/viết trong sandbox
  // Exec chạy trong container
  // Trình duyệt sử dụng URL cầu nối
}
```

## Xử lý Cụ thể cho Nhà cung cấp

### Anthropic

- Loại bỏ chuỗi ma thuật từ chối
- Xác thực lượt cho các vai trò liên tiếp
- Tương thích tham số Claude Code

### Google/Gemini

- Sửa lỗi thứ tự lượt (`applyGoogleTurnOrderingFix`)
- Làm sạch lược đồ công cụ (`sanitizeToolsForGoogle`)
- Làm sạch lịch sử phiên (`sanitizeSessionHistory`)

### OpenAI

- Công cụ `apply_patch` cho các mô hình Codex
- Xử lý hạ cấp độ suy nghĩ

## Tích hợp TUI

OpenClaw cũng có chế độ TUI cục bộ sử dụng các thành phần pi-tui trực tiếp:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Điều này cung cấp trải nghiệm terminal tương tác tương tự như chế độ gốc của pi.

## Khác biệt Chính so với Pi CLI

| Khía cạnh        | Pi CLI                  | OpenClaw Nhúng                                                                                 |
| ---------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Triệu hồi        | Lệnh `pi` / RPC         | SDK qua `createAgentSession()`                                                                 |
| Công cụ          | Công cụ mã hóa mặc định | Bộ công cụ tùy chỉnh của OpenClaw                                                              |
| Lời nhắc hệ thống| AGENTS.md + lời nhắc    | Động theo kênh/ngữ cảnh                                                                        |
| Lưu trữ phiên    | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (hoặc `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Xác thực         | Một thông tin xác thực  | Nhiều hồ sơ với xoay vòng                                                                      |
| Tiện ích mở rộng | Tải từ đĩa              | Đường dẫn lập trình + đĩa                                                                      |
| Xử lý sự kiện    | Kết xuất TUI            | Dựa trên callback (onBlockReply, v.v.)                                                         |

## Cân nhắc Tương lai

Các khu vực có thể cần tái cấu trúc:

1. **Căn chỉnh chữ ký công cụ**: Hiện đang thích ứng giữa chữ ký pi-agent-core và pi-coding-agent
2. **Bao bọc quản lý phiên**: `guardSessionManager` thêm an toàn nhưng tăng độ phức tạp
3. **Tải tiện ích mở rộng**: Có thể sử dụng `ResourceLoader` của pi trực tiếp hơn
4. **Độ phức tạp của trình xử lý luồng**: `subscribeEmbeddedPiSession` đã trở nên lớn
5. **Quirks của nhà cung cấp**: Nhiều đường dẫn mã cụ thể cho nhà cung cấp mà pi có thể xử lý

## Kiểm tra

Phạm vi tích hợp Pi bao gồm các bộ sau:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-auth-json.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-embedded-helpers*.test.ts`
- `src/agents/pi-embedded-runner*.test.ts`
- `src/agents/pi-embedded-runner/**/*.test.ts`
- `src/agents/pi-embedded-subscribe*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-tool-definition-adapter*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-extensions/**/*.test.ts`

Trực tiếp/tùy chọn:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (bật `OPENCLAW_LIVE_TEST=1`)

Để biết các lệnh chạy hiện tại, xem [Quy trình Phát triển Pi](/pi-dev).

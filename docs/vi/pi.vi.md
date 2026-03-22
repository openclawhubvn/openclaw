---
title: "Kiến trúc tích hợp Pi"
summary: "Kiến trúc tích hợp agent Pi nhúng và vòng đời session trong OpenClaw"
read_when:
  - Hiểu thiết kế tích hợp Pi SDK trong OpenClaw
  - Sửa đổi vòng đời session agent, công cụ, hoặc kết nối provider cho Pi
---

# Kiến trúc tích hợp Pi

Tài liệu này mô tả cách OpenClaw tích hợp với [pi-coding-agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) và các package liên quan (`pi-ai`, `pi-agent-core`, `pi-tui`) để cung cấp khả năng agent AI.

## Tổng quan

OpenClaw sử dụng pi SDK để nhúng một agent AI vào kiến trúc messaging gateway. Thay vì chạy pi như một subprocess hoặc dùng chế độ RPC, OpenClaw trực tiếp import và khởi tạo `AgentSession` của pi qua `createAgentSession()`. Cách tiếp cận nhúng này mang lại:

- Kiểm soát hoàn toàn vòng đời session và xử lý sự kiện
- Tùy chỉnh công cụ (messaging, sandbox, hành động theo channel)
- Tùy chỉnh system prompt theo channel/ngữ cảnh
- Duy trì session với hỗ trợ branching/compaction
- Xoay vòng profile auth multi-account với failover
- Chuyển đổi model không phụ thuộc provider

## Package Dependencies

```json
{
  "@mariozechner/pi-agent-core": "0.49.3",
  "@mariozechner/pi-ai": "0.49.3",
  "@mariozechner/pi-coding-agent": "0.49.3",
  "@mariozechner/pi-tui": "0.49.3"
}
```

| Package           | Mục đích                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| `pi-ai`           | Abstraction LLM cốt lõi: `Model`, `streamSimple`, loại message, API provider                          |
| `pi-agent-core`   | Vòng lặp agent, thực thi công cụ, loại `AgentMessage`                                                 |
| `pi-coding-agent` | SDK cấp cao: `createAgentSession`, `SessionManager`, `AuthStorage`, `ModelRegistry`, công cụ tích hợp |
| `pi-tui`          | Thành phần UI terminal (dùng trong chế độ TUI local của OpenClaw)                                     |

## Cấu trúc file

```
src/agents/
├── pi-embedded-runner.ts          # Re-export từ pi-embedded-runner/
├── pi-embedded-runner/
│   ├── run.ts                     # Entry chính: runEmbeddedPiAgent()
│   ├── run/
│   │   ├── attempt.ts             # Logic attempt đơn với thiết lập session
│   │   ├── params.ts              # Kiểu RunEmbeddedPiAgentParams
│   │   ├── payloads.ts            # Xây dựng payload phản hồi từ kết quả run
│   │   ├── images.ts              # Tiêm hình ảnh model vision
│   │   └── types.ts               # EmbeddedRunAttemptResult
│   ├── abort.ts                   # Phát hiện lỗi abort
│   ├── cache-ttl.ts               # Theo dõi TTL cache cho pruning context
│   ├── compact.ts                 # Logic compaction thủ công/tự động
│   ├── extensions.ts              # Tải extension pi cho run nhúng
│   ├── extra-params.ts            # Tham số stream cụ thể của provider
│   ├── google.ts                  # Sửa thứ tự turn Google/Gemini
│   ├── history.ts                 # Giới hạn lịch sử (DM vs group)
│   ├── lanes.ts                   # Lanes lệnh session/toàn cầu
│   ├── logger.ts                  # Logger subsystem
│   ├── model.ts                   # Giải quyết model qua ModelRegistry
│   ├── runs.ts                    # Theo dõi run hoạt động, abort, queue
│   ├── sandbox-info.ts            # Thông tin sandbox cho system prompt
│   ├── session-manager-cache.ts   # Caching instance SessionManager
│   ├── session-manager-init.ts    # Khởi tạo file session
│   ├── system-prompt.ts           # Trình tạo system prompt
│   ├── tool-split.ts              # Chia công cụ thành builtIn vs custom
│   ├── types.ts                   # EmbeddedPiAgentMeta, EmbeddedPiRunResult
│   └── utils.ts                   # Mapping ThinkLevel, mô tả lỗi
├── pi-embedded-subscribe.ts       # Đăng ký sự kiện session
├── pi-embedded-subscribe.types.ts # SubscribeEmbeddedPiSessionParams
├── pi-embedded-subscribe.handlers.ts # Factory handler sự kiện
├── pi-embedded-subscribe.handlers.lifecycle.ts
├── pi-embedded-subscribe.handlers.types.ts
├── pi-embedded-block-chunker.ts   # Chunking phản hồi block streaming
├── pi-embedded-messaging.ts       # Theo dõi công cụ messaging gửi
├── pi-embedded-helpers.ts         # Phân loại lỗi, xác thực turn
├── pi-embedded-helpers/           # Module trợ giúp
├── pi-embedded-utils.ts           # Tiện ích định dạng
├── pi-tools.ts                    # createOpenClawCodingTools()
├── pi-tools.abort.ts              # Gói AbortSignal cho công cụ
├── pi-tools.policy.ts             # Chính sách allowlist/denylist công cụ
├── pi-tools.read.ts               # Tùy chỉnh công cụ đọc
├── pi-tools.schema.ts             # Chuẩn hóa schema công cụ
├── pi-tools.types.ts              # Alias kiểu AnyAgentTool
├── pi-tool-definition-adapter.ts  # Adapter AgentTool -> ToolDefinition
├── pi-settings.ts                 # Ghi đè cài đặt
├── pi-extensions/                 # Extension pi tùy chỉnh
│   ├── compaction-safeguard.ts    # Extension bảo vệ
│   ├── compaction-safeguard-runtime.ts
│   ├── context-pruning.ts         # Extension pruning context Cache-TTL
│   └── context-pruning/
├── model-auth.ts                  # Giải quyết profile auth
├── auth-profiles.ts               # Lưu trữ profile, cooldown, failover
├── model-selection.ts             # Giải quyết model mặc định
├── models-config.ts               # Tạo models.json
├── model-catalog.ts               # Cache catalog model
├── context-window-guard.ts        # Xác thực cửa sổ context
├── failover-error.ts              # Lớp FailoverError
├── defaults.ts                    # DEFAULT_PROVIDER, DEFAULT_MODEL
├── system-prompt.ts               # buildAgentSystemPrompt()
├── system-prompt-params.ts        # Giải quyết tham số system prompt
├── system-prompt-report.ts        # Tạo báo cáo debug
├── tool-summaries.ts              # Tóm tắt mô tả công cụ
├── tool-policy.ts                 # Giải quyết chính sách công cụ
├── transcript-policy.ts           # Chính sách xác thực transcript
├── skills.ts                      # Xây dựng snapshot/prompt kỹ năng
├── skills/                        # Subsystem kỹ năng
├── sandbox.ts                     # Giải quyết context sandbox
├── sandbox/                       # Subsystem sandbox
├── channel-tools.ts               # Tiêm công cụ theo channel
├── openclaw-tools.ts              # Công cụ cụ thể của OpenClaw
├── bash-tools.ts                  # Công cụ exec/process
├── apply-patch.ts                 # Công cụ apply_patch (OpenAI)
├── tools/                         # Triển khai công cụ riêng lẻ
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

Các runtime hành động message theo channel hiện nằm trong thư mục extension thuộc plugin thay vì dưới `src/agents/tools`, ví dụ:

- `extensions/discord/src/actions/runtime*.ts`
- `extensions/slack/src/action-runtime.ts`
- `extensions/telegram/src/action-runtime.ts`
- `extensions/whatsapp/src/action-runtime.ts`

## Luồng tích hợp cốt lõi

### 1. Chạy một Agent nhúng

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

### 2. Tạo Session

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

### 3. Đăng ký sự kiện

`subscribeEmbeddedPiSession()` đăng ký sự kiện `AgentSession` của pi:

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

- `message_start` / `message_end` / `message_update` (streaming text/thinking)
- `tool_execution_start` / `tool_execution_update` / `tool_execution_end`
- `turn_start` / `turn_end`
- `agent_start` / `agent_end`
- `auto_compaction_start` / `auto_compaction_end`

### 4. Prompting

Sau khi thiết lập, session được prompt:

```typescript
await session.prompt(effectivePrompt, { images: imageResult.images });
```

SDK xử lý toàn bộ vòng lặp agent: gửi đến LLM, thực thi lệnh công cụ, streaming phản hồi.

Tiêm hình ảnh là prompt-local: OpenClaw tải các ref hình ảnh từ prompt hiện tại và truyền qua `images` chỉ cho turn đó. Không quét lại các turn lịch sử cũ để tiêm lại payload hình ảnh.

## Kiến trúc công cụ

### Pipeline công cụ

1. **Công cụ cơ bản**: `codingTools` của pi (read, bash, edit, write)
2. **Thay thế tùy chỉnh**: OpenClaw thay thế bash bằng `exec`/`process`, tùy chỉnh read/edit/write cho sandbox
3. **Công cụ OpenClaw**: messaging, browser, canvas, sessions, cron, gateway, v.v.
4. **Công cụ theo channel**: Công cụ hành động cụ thể cho Discord/Telegram/Slack/WhatsApp
5. **Lọc chính sách**: Công cụ được lọc theo profile, provider, agent, group, sandbox policies
6. **Chuẩn hóa schema**: Schema được làm sạch cho quirks của Gemini/OpenAI
7. **Gói AbortSignal**: Công cụ được gói để tôn trọng tín hiệu abort

### Adapter định nghĩa công cụ

`AgentTool` của pi-agent-core có chữ ký `execute` khác với `ToolDefinition` của pi-coding-agent. Adapter trong `pi-tool-definition-adapter.ts` kết nối điều này:

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

### Chiến lược chia công cụ

`splitSdkTools()` truyền tất cả công cụ qua `customTools`:

```typescript
export function splitSdkTools(options: { tools: AnyAgentTool[]; sandboxEnabled: boolean }) {
  return {
    builtInTools: [], // Trống. Chúng tôi ghi đè mọi thứ
    customTools: toToolDefinitions(options.tools),
  };
}
```

Điều này đảm bảo lọc chính sách của OpenClaw, tích hợp sandbox, và bộ công cụ mở rộng vẫn nhất quán trên các provider.

## Xây dựng System Prompt

System prompt được xây dựng trong `buildAgentSystemPrompt()` (`system-prompt.ts`). Nó lắp ráp một prompt đầy đủ với các phần bao gồm Tooling, Tool Call Style, Safety guardrails, OpenClaw CLI reference, Skills, Docs, Workspace, Sandbox, Messaging, Reply Tags, Voice, Silent Replies, Heartbeats, Runtime metadata, cộng với Memory và Reactions khi được bật, và các file context tùy chọn và nội dung system prompt bổ sung. Các phần được cắt tỉa cho chế độ prompt tối thiểu được sử dụng bởi subagents.

Prompt được áp dụng sau khi tạo session qua `applySystemPromptOverrideToSession()`:

```typescript
const systemPromptOverride = createSystemPromptOverride(appendPrompt);
applySystemPromptOverrideToSession(session, systemPromptOverride);
```

## Quản lý Session

### File Session

Sessions là các file JSONL với cấu trúc cây (liên kết id/parentId). `SessionManager` của pi xử lý duy trì:

```typescript
const sessionManager = SessionManager.open(params.sessionFile);
```

OpenClaw bọc điều này với `guardSessionManager()` để đảm bảo an toàn kết quả công cụ.

### Caching Session

`session-manager-cache.ts` cache các instance SessionManager để tránh phân tích file lặp lại:

```typescript
await prewarmSessionFile(params.sessionFile);
sessionManager = SessionManager.open(params.sessionFile);
trackSessionManagerAccess(params.sessionFile);
```

### Giới hạn lịch sử

`limitHistoryTurns()` cắt tỉa lịch sử hội thoại dựa trên loại channel (DM vs group).

### Compaction

Auto-compaction kích hoạt khi context overflow. `compactEmbeddedPiSessionDirect()` xử lý compaction thủ công:

```typescript
const compactResult = await compactEmbeddedPiSessionDirect({
  sessionId, sessionFile, provider, model, ...
});
```

## Xác thực & Giải quyết Model

### Auth Profiles

OpenClaw duy trì một kho profile auth với nhiều API key cho mỗi provider:

```typescript
const authStore = ensureAuthProfileStore(agentDir, { allowKeychainPrompt: false });
const profileOrder = resolveAuthProfileOrder({ cfg, store: authStore, provider, preferredProfile });
```

Profiles xoay vòng khi gặp lỗi với theo dõi cooldown:

```typescript
await markAuthProfileFailure({ store, profileId, reason, cfg, agentDir });
const rotated = await advanceAuthProfile();
```

### Giải quyết Model

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

### Failover

`FailoverError` kích hoạt fallback model khi được cấu hình:

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

## Pi Extensions

OpenClaw tải các extension pi tùy chỉnh cho hành vi chuyên biệt:

### Compaction Safeguard

`src/agents/pi-extensions/compaction-safeguard.ts` thêm guardrails vào compaction, bao gồm ngân sách token thích ứng cộng với tóm tắt lỗi công cụ và thao tác file:

```typescript
if (resolveCompactionMode(params.cfg) === "safeguard") {
  setCompactionSafeguardRuntime(params.sessionManager, { maxHistoryShare });
  paths.push(resolvePiExtensionPath("compaction-safeguard"));
}
```

### Context Pruning

`src/agents/pi-extensions/context-pruning.ts` triển khai pruning context dựa trên cache-TTL:

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

## Streaming & Block Replies

### Block Chunking

`EmbeddedBlockChunker` quản lý streaming text thành các block phản hồi riêng biệt:

```typescript
const blockChunker = blockChunking ? new EmbeddedBlockChunker(blockChunking) : null;
```

### Stripping Thinking/Final Tag

Output streaming được xử lý để loại bỏ các block `<think>`/`<thinking>` và trích xuất nội dung `<final>`:

```typescript
const stripBlockTags = (text: string, state: { thinking: boolean; final: boolean }) => {
  // Loại bỏ nội dung <think>...</think>
  // Nếu enforceFinalTag, chỉ trả về nội dung <final>...</final>
};
```

### Reply Directives

Các chỉ thị phản hồi như `[[media:url]]`, `[[voice]]`, `[[reply:id]]` được phân tích và trích xuất:

```typescript
const { text: cleanedText, mediaUrls, audioAsVoice, replyToId } = consumeReplyDirectives(chunk);
```

## Xử lý lỗi

### Phân loại lỗi

`pi-embedded-helpers.ts` phân loại lỗi để xử lý phù hợp:

```typescript
isContextOverflowError(errorText)     // Context quá lớn
isCompactionFailureError(errorText)   // Compaction thất bại
isAuthAssistantError(lastAssistant)   // Lỗi xác thực
isRateLimitAssistantError(...)        // Bị giới hạn tốc độ
isFailoverAssistantError(...)         // Nên failover
classifyFailoverReason(errorText)     // "auth" | "rate_limit" | "quota" | "timeout" | ...
```

### Fallback Thinking Level

Nếu một thinking level không được hỗ trợ, nó sẽ fallback:

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
  // Sử dụng công cụ read/edit/write sandboxed
  // Exec chạy trong container
  // Browser sử dụng bridge URL
}
```

## Xử lý cụ thể của Provider

### Anthropic

- Loại bỏ magic string từ chối
- Xác thực turn cho các vai trò liên tiếp
- Tương thích tham số Claude Code

### Google/Gemini

- Sửa thứ tự turn (`applyGoogleTurnOrderingFix`)
- Làm sạch schema công cụ (`sanitizeToolsForGoogle`)
- Làm sạch lịch sử session (`sanitizeSessionHistory`)

### OpenAI

- Công cụ `apply_patch` cho các model Codex
- Xử lý hạ cấp thinking level

## Tích hợp TUI

OpenClaw cũng có chế độ TUI local sử dụng trực tiếp các thành phần pi-tui:

```typescript
// src/tui/tui.ts
import { ... } from "@mariozechner/pi-tui";
```

Điều này cung cấp trải nghiệm terminal tương tác tương tự như chế độ native của pi.

## Khác biệt chính so với Pi CLI

| Khía cạnh        | Pi CLI                  | OpenClaw Embedded                                                                              |
| --------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Invocation      | Lệnh `pi` / RPC         | SDK qua `createAgentSession()`                                                                 |
| Công cụ         | Công cụ coding mặc định | Bộ công cụ tùy chỉnh của OpenClaw                                                              |
| System prompt   | AGENTS.md + prompts     | Động theo channel/ngữ cảnh                                                                     |
| Lưu trữ session | `~/.pi/agent/sessions/` | `~/.openclaw/agents/<agentId>/sessions/` (hoặc `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`) |
| Auth            | Credential đơn          | Multi-profile với xoay vòng                                                                    |
| Extensions      | Tải từ disk             | Programmatic + đường dẫn disk                                                                  |
| Xử lý sự kiện   | TUI rendering           | Dựa trên callback (onBlockReply, v.v.)                                                         |

## Cân nhắc trong tương lai

Các khu vực có thể cần tái cấu trúc:

1. **Căn chỉnh chữ ký công cụ**: Hiện đang thích ứng giữa chữ ký pi-agent-core và pi-coding-agent
2. **Bọc session manager**: `guardSessionManager` thêm an toàn nhưng tăng độ phức tạp
3. **Tải extension**: Có thể sử dụng `ResourceLoader` của pi trực tiếp hơn
4. **Độ phức tạp của xử lý streaming**: `subscribeEmbeddedPiSession` đã phát triển lớn
5. **Quirks của provider**: Nhiều codepath cụ thể của provider mà pi có thể xử lý

## Kiểm thử

Phạm vi tích hợp Pi bao gồm các suite sau:

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

Live/opt-in:

- `src/agents/pi-embedded-runner-extraparams.live.test.ts` (bật `OPENCLAW_LIVE_TEST=1`)

Để biết các lệnh chạy hiện tại, xem [Pi Development Workflow](/pi-dev).\n
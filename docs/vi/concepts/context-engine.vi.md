---
summary: "Context engine: lắp ráp ngữ cảnh, nén và vòng đời subagent có thể cắm thêm"
read_when:
  - Muốn hiểu cách OpenClaw lắp ráp ngữ cảnh mô hình
  - Đang chuyển đổi giữa engine cũ và engine plugin
  - Đang xây dựng plugin cho context engine
title: "Context Engine"
---

# Context Engine

**Context engine** quyết định cách OpenClaw xây dựng ngữ cảnh mô hình cho mỗi lần chạy. Nó chọn thông điệp nào cần đưa vào, cách tóm tắt lịch sử cũ và quản lý ngữ cảnh qua các ranh giới subagent.

OpenClaw có sẵn engine `legacy`. Plugin có thể đăng ký các engine thay thế vòng đời context-engine hiện tại.

## Bắt đầu nhanh

Kiểm tra engine nào đang hoạt động:

```bash
openclaw doctor
# hoặc kiểm tra trực tiếp config:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### Cài đặt plugin context engine

Cài đặt plugin context engine như các plugin OpenClaw khác. Cài đặt trước, sau đó chọn engine trong slot:

```bash
# Cài từ npm
openclaw plugins install @martian-engineering/lossless-claw

# Hoặc cài từ đường dẫn local (dành cho phát triển)
openclaw plugins install -l ./my-context-engine
```

Sau đó kích hoạt plugin và chọn nó làm engine hoạt động trong config:

```json5
// openclaw.json
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw", // phải khớp với id engine đã đăng ký của plugin
    },
    entries: {
      "lossless-claw": {
        enabled: true,
        // Cấu hình cụ thể của plugin (xem tài liệu của plugin)
      },
    },
  },
}
```

Khởi động lại gateway sau khi cài đặt và cấu hình.

Để chuyển về engine tích hợp sẵn, đặt `contextEngine` thành `"legacy"` (hoặc xóa khóa này — `"legacy"` là mặc định).

## Cách hoạt động

Mỗi khi OpenClaw chạy một model prompt, context engine tham gia vào bốn điểm vòng đời:

1. **Ingest** — gọi khi thêm thông điệp mới vào session. Engine có thể lưu trữ hoặc lập chỉ mục thông điệp trong kho dữ liệu riêng.
2. **Assemble** — gọi trước mỗi lần chạy mô hình. Engine trả về một tập hợp thông điệp có thứ tự (và một `systemPromptAddition` tùy chọn) phù hợp với giới hạn token.
3. **Compact** — gọi khi cửa sổ ngữ cảnh đầy, hoặc khi người dùng chạy `/compact`. Engine tóm tắt lịch sử cũ để giải phóng không gian.
4. **After turn** — gọi sau khi hoàn thành một lần chạy. Engine có thể lưu trạng thái, kích hoạt nén nền, hoặc cập nhật chỉ mục.

### Vòng đời subagent (tùy chọn)

Hiện tại OpenClaw gọi một hook vòng đời subagent:

- **onSubagentEnded** — dọn dẹp khi một phiên subagent hoàn tất hoặc bị quét.

Hook `prepareSubagentSpawn` là một phần của giao diện cho tương lai, nhưng runtime chưa gọi nó.

### System prompt addition

Phương thức `assemble` có thể trả về một chuỗi `systemPromptAddition`. OpenClaw thêm chuỗi này vào đầu system prompt cho lần chạy. Điều này cho phép engine chèn hướng dẫn nhớ động, hướng dẫn truy xuất, hoặc gợi ý nhận thức ngữ cảnh mà không cần file workspace tĩnh.

## Engine legacy

Engine `legacy` tích hợp sẵn giữ nguyên hành vi ban đầu của OpenClaw:

- **Ingest**: không làm gì (session manager xử lý lưu trữ thông điệp trực tiếp).
- **Assemble**: truyền qua (pipeline sanitize → validate → limit hiện có trong runtime xử lý lắp ráp ngữ cảnh).
- **Compact**: ủy quyền cho nén tóm tắt tích hợp sẵn, tạo một bản tóm tắt duy nhất của các thông điệp cũ và giữ nguyên các thông điệp gần đây.
- **After turn**: không làm gì.

Engine legacy không đăng ký công cụ hoặc cung cấp `systemPromptAddition`.

Khi không đặt `plugins.slots.contextEngine` (hoặc đặt thành `"legacy"`), engine này được sử dụng tự động.

## Plugin engines

Plugin có thể đăng ký một context engine bằng API plugin:

```ts
export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Lưu thông điệp vào kho dữ liệu
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget }) {
      // Trả về thông điệp phù hợp với ngân sách
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: "Use lcm_grep to search history...",
      };
    },

    async compact({ sessionId, force }) {
      // Tóm tắt ngữ cảnh cũ
      return { ok: true, compacted: true };
    },
  }));
}
```

Sau đó kích hoạt trong config:

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### Giao diện ContextEngine

Các thành viên bắt buộc:

| Thành viên         | Loại     | Mục đích                                                  |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Property | ID engine, tên, phiên bản, và liệu nó có sở hữu nén không |
| `ingest(params)`   | Method   | Lưu một thông điệp đơn                                   |
| `assemble(params)` | Method   | Xây dựng ngữ cảnh cho một lần chạy mô hình (trả về `AssembleResult`) |
| `compact(params)`  | Method   | Tóm tắt/giảm ngữ cảnh                                   |

`assemble` trả về một `AssembleResult` với:

- `messages` — các thông điệp có thứ tự để gửi đến mô hình.
- `estimatedTokens` (bắt buộc, `number`) — ước tính tổng số token trong ngữ cảnh đã lắp ráp. OpenClaw sử dụng điều này cho quyết định ngưỡng nén và báo cáo chẩn đoán.
- `systemPromptAddition` (tùy chọn, `string`) — thêm vào đầu system prompt.

Các thành viên tùy chọn:

| Thành viên                     | Loại   | Mục đích                                                                                                         |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Method | Khởi tạo trạng thái engine cho một session. Gọi một lần khi engine lần đầu thấy một session (ví dụ, nhập lịch sử). |
| `ingestBatch(params)`          | Method | Nhập một lượt hoàn thành dưới dạng batch. Gọi sau khi một lần chạy hoàn tất, với tất cả thông điệp từ lượt đó cùng lúc.     |
| `afterTurn(params)`            | Method | Công việc vòng đời sau khi chạy (lưu trạng thái, kích hoạt nén nền).                                         |
| `prepareSubagentSpawn(params)` | Method | Thiết lập trạng thái chia sẻ cho một session con.                                                                        |
| `onSubagentEnded(params)`      | Method | Dọn dẹp sau khi một subagent kết thúc.                                                                                 |
| `dispose()`                    | Method | Giải phóng tài nguyên. Gọi trong quá trình tắt gateway hoặc tải lại plugin — không phải cho mỗi session.                           |

### ownsCompaction

`ownsCompaction` kiểm soát liệu auto-compaction tích hợp của Pi có được bật trong lần chạy hay không:

- `true` — engine sở hữu hành vi nén. OpenClaw tắt auto-compaction tích hợp của Pi cho lần chạy đó, và `compact()` của engine chịu trách nhiệm cho `/compact`, nén phục hồi tràn, và bất kỳ nén chủ động nào nó muốn thực hiện trong `afterTurn()`.
- `false` hoặc không đặt — auto-compaction tích hợp của Pi vẫn có thể chạy trong quá trình thực hiện prompt, nhưng phương thức `compact()` của engine vẫn được gọi cho `/compact` và phục hồi tràn.

`ownsCompaction: false` không có nghĩa là OpenClaw tự động quay lại đường nén của engine legacy.

Điều đó có nghĩa là có hai mẫu plugin hợp lệ:

- **Chế độ sở hữu** — triển khai thuật toán nén riêng và đặt `ownsCompaction: true`.
- **Chế độ ủy quyền** — đặt `ownsCompaction: false` và để `compact()` gọi `delegateCompactionToRuntime(...)` từ `openclaw/plugin-sdk/core` để sử dụng hành vi nén tích hợp của OpenClaw.

Một `compact()` không làm gì là không an toàn cho một engine không sở hữu đang hoạt động vì nó vô hiệu hóa đường nén `/compact` và phục hồi tràn bình thường cho slot engine đó.

## Tham khảo cấu hình

```json5
{
  plugins: {
    slots: {
      // Chọn context engine hoạt động. Mặc định: "legacy".
      // Đặt thành id plugin để sử dụng engine plugin.
      contextEngine: "legacy",
    },
  },
}
```

Slot là độc quyền tại thời gian chạy — chỉ một context engine đã đăng ký được giải quyết cho một lần chạy hoặc hoạt động nén. Các plugin `kind: "context-engine"` khác vẫn có thể tải và chạy mã đăng ký của chúng; `plugins.slots.contextEngine` chỉ chọn id engine đã đăng ký mà OpenClaw giải quyết khi cần một context engine.

## Quan hệ với nén và bộ nhớ

- **Nén** là một trách nhiệm của context engine. Engine legacy ủy quyền cho tóm tắt tích hợp của OpenClaw. Plugin engines có thể triển khai bất kỳ chiến lược nén nào (tóm tắt DAG, truy xuất vector, v.v.).
- **Memory plugins** (`plugins.slots.memory`) tách biệt với context engines. Memory plugins cung cấp tìm kiếm/truy xuất; context engines kiểm soát những gì mô hình thấy. Chúng có thể hoạt động cùng nhau — một context engine có thể sử dụng dữ liệu plugin memory trong quá trình lắp ráp.
- **Session pruning** (cắt tỉa kết quả công cụ cũ trong bộ nhớ) vẫn chạy bất kể context engine nào đang hoạt động.

## Mẹo

- Sử dụng `openclaw doctor` để xác minh engine đang tải đúng cách.
- Nếu chuyển đổi engine, các session hiện tại tiếp tục với lịch sử hiện tại của chúng. Engine mới tiếp quản cho các lần chạy trong tương lai.
- Lỗi engine được ghi lại và hiển thị trong chẩn đoán. Nếu một plugin engine không đăng ký được hoặc id engine đã chọn không thể giải quyết, OpenClaw không tự động quay lại; các lần chạy sẽ thất bại cho đến khi bạn sửa plugin hoặc chuyển `plugins.slots.contextEngine` về `"legacy"`.
- Đối với phát triển, sử dụng `openclaw plugins install -l ./my-engine` để liên kết một thư mục plugin local mà không cần sao chép.

Xem thêm: [Compaction](/concepts/compaction), [Context](/concepts/context), [Plugins](/tools/plugin), [Plugin manifest](/plugins/manifest).\n
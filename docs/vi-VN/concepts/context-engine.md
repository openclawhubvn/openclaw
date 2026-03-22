---
summary: "Context engine: lắp ráp ngữ cảnh có thể cắm thêm, nén và vòng đời subagent"
read_when:
  - Bạn muốn hiểu cách OpenClaw lắp ráp ngữ cảnh mô hình
  - Bạn đang chuyển đổi giữa engine cũ và engine plugin
  - Bạn đang xây dựng một plugin engine ngữ cảnh
title: "Context Engine"
---

# Context Engine

**Context engine** điều khiển cách OpenClaw xây dựng ngữ cảnh mô hình cho mỗi lần chạy. Nó quyết định những thông điệp nào cần bao gồm, cách tóm tắt lịch sử cũ hơn và cách quản lý ngữ cảnh qua các ranh giới subagent.

OpenClaw đi kèm với một engine `legacy` tích hợp sẵn. Các plugin có thể đăng ký các engine thay thế để thay đổi vòng đời context-engine đang hoạt động.

## Bắt đầu nhanh

Kiểm tra xem engine nào đang hoạt động:

```bash
openclaw doctor
# hoặc kiểm tra cấu hình trực tiếp:
cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
```

### Cài đặt plugin engine ngữ cảnh

Plugin engine ngữ cảnh được cài đặt như bất kỳ plugin OpenClaw nào khác. Cài đặt trước, sau đó chọn engine trong slot:

```bash
# Cài đặt từ npm
openclaw plugins install @martian-engineering/lossless-claw

# Hoặc cài đặt từ đường dẫn địa phương (dành cho phát triển)
openclaw plugins install -l ./my-context-engine
```

Sau đó kích hoạt plugin và chọn nó làm engine hoạt động trong cấu hình:

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
        // Cấu hình cụ thể của plugin nằm ở đây (xem tài liệu của plugin)
      },
    },
  },
}
```

Khởi động lại gateway sau khi cài đặt và cấu hình.

Để chuyển về engine tích hợp sẵn, đặt `contextEngine` thành `"legacy"` (hoặc xóa hoàn toàn khóa — `"legacy"` là mặc định).

## Cách hoạt động

Mỗi khi OpenClaw chạy một model prompt, context engine tham gia vào bốn điểm vòng đời:

1. **Ingest** — được gọi khi một thông điệp mới được thêm vào session. Engine có thể lưu trữ hoặc lập chỉ mục thông điệp trong kho dữ liệu của nó.
2. **Assemble** — được gọi trước mỗi lần chạy mô hình. Engine trả về một tập hợp thông điệp có thứ tự (và một `systemPromptAddition` tùy chọn) phù hợp với ngân sách token.
3. **Compact** — được gọi khi cửa sổ ngữ cảnh đầy, hoặc khi người dùng chạy `/compact`. Engine tóm tắt lịch sử cũ hơn để giải phóng không gian.
4. **After turn** — được gọi sau khi một lần chạy hoàn tất. Engine có thể lưu trữ trạng thái, kích hoạt nén nền, hoặc cập nhật chỉ mục.

### Vòng đời subagent (tùy chọn)

Hiện tại, OpenClaw gọi một hook vòng đời subagent:

- **onSubagentEnded** — dọn dẹp khi một session subagent hoàn tất hoặc bị quét.

Hook `prepareSubagentSpawn` là một phần của giao diện cho sử dụng trong tương lai, nhưng runtime chưa gọi nó.

### Thêm vào system prompt

Phương thức `assemble` có thể trả về một chuỗi `systemPromptAddition`. OpenClaw thêm chuỗi này vào đầu system prompt cho lần chạy. Điều này cho phép các engine chèn hướng dẫn hồi tưởng động, chỉ dẫn truy xuất, hoặc gợi ý nhận thức ngữ cảnh mà không cần các file workspace tĩnh.

## Engine cũ

Engine `legacy` tích hợp sẵn bảo toàn hành vi gốc của OpenClaw:

- **Ingest**: không thực hiện gì (trình quản lý session xử lý lưu trữ thông điệp trực tiếp).
- **Assemble**: truyền qua (pipeline hiện tại sanitize → validate → limit trong runtime xử lý lắp ráp ngữ cảnh).
- **Compact**: ủy quyền cho nén tóm tắt tích hợp sẵn, tạo một bản tóm tắt duy nhất của các thông điệp cũ hơn và giữ nguyên các thông điệp gần đây.
- **After turn**: không thực hiện gì.

Engine cũ không đăng ký công cụ hoặc cung cấp `systemPromptAddition`.

Khi không có `plugins.slots.contextEngine` được đặt (hoặc được đặt thành `"legacy"`), engine này được sử dụng tự động.

## Plugin engines

Một plugin có thể đăng ký một context engine bằng cách sử dụng API plugin:

```ts
export default function register(api) {
  api.registerContextEngine("my-engine", () => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Lưu trữ thông điệp trong kho dữ liệu của bạn
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget }) {
      // Trả về các thông điệp phù hợp với ngân sách
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: "Use lcm_grep to search history...",
      };
    },

    async compact({ sessionId, force }) {
      // Tóm tắt ngữ cảnh cũ hơn
      return { ok: true, compacted: true };
    },
  }));
}
```

Sau đó kích hoạt nó trong cấu hình:

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

| Thành viên          | Loại     | Mục đích                                                   |
| ------------------- | -------- | ---------------------------------------------------------- |
| `info`              | Thuộc tính | ID engine, tên, phiên bản, và liệu nó có sở hữu nén hay không |
| `ingest(params)`    | Phương thức | Lưu trữ một thông điệp đơn lẻ                              |
| `assemble(params)`  | Phương thức | Xây dựng ngữ cảnh cho một lần chạy mô hình (trả về `AssembleResult`) |
| `compact(params)`   | Phương thức | Tóm tắt/giảm ngữ cảnh                                     |

`assemble` trả về một `AssembleResult` với:

- `messages` — các thông điệp có thứ tự để gửi đến mô hình.
- `estimatedTokens` (bắt buộc, `number`) — ước tính của engine về tổng số token trong ngữ cảnh đã lắp ráp. OpenClaw sử dụng điều này cho các quyết định ngưỡng nén và báo cáo chẩn đoán.
- `systemPromptAddition` (tùy chọn, `string`) — được thêm vào đầu system prompt.

Các thành viên tùy chọn:

| Thành viên                      | Loại   | Mục đích                                                                                                         |
| ------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`             | Phương thức | Khởi tạo trạng thái engine cho một session. Được gọi một lần khi engine lần đầu thấy một session (ví dụ: nhập lịch sử). |
| `ingestBatch(params)`           | Phương thức | Nhập một lượt hoàn tất dưới dạng một batch. Được gọi sau khi một lần chạy hoàn tất, với tất cả các thông điệp từ lượt đó cùng một lúc.     |
| `afterTurn(params)`             | Phương thức | Công việc vòng đời sau khi chạy (lưu trữ trạng thái, kích hoạt nén nền).                                         |
| `prepareSubagentSpawn(params)`  | Phương thức | Thiết lập trạng thái chia sẻ cho một session con.                                                                        |
| `onSubagentEnded(params)`       | Phương thức | Dọn dẹp sau khi một subagent kết thúc.                                                                                 |
| `dispose()`                     | Phương thức | Giải phóng tài nguyên. Được gọi trong quá trình tắt gateway hoặc tải lại plugin — không phải cho mỗi session.                           |

### ownsCompaction

`ownsCompaction` điều khiển liệu tính năng nén tự động tích hợp sẵn của Pi có được kích hoạt cho lần chạy hay không:

- `true` — engine sở hữu hành vi nén. OpenClaw vô hiệu hóa nén tự động tích hợp sẵn của Pi cho lần chạy đó, và việc thực hiện `compact()` của engine chịu trách nhiệm cho `/compact`, nén phục hồi tràn, và bất kỳ nén chủ động nào mà nó muốn thực hiện trong `afterTurn()`.
- `false` hoặc không đặt — nén tự động tích hợp sẵn của Pi vẫn có thể chạy trong quá trình thực hiện prompt, nhưng phương thức `compact()` của engine đang hoạt động vẫn được gọi cho `/compact` và nén phục hồi tràn.

`ownsCompaction: false` không có nghĩa là OpenClaw tự động quay lại đường dẫn nén của engine cũ.

Điều đó có nghĩa là có hai mẫu plugin hợp lệ:

- **Chế độ sở hữu** — thực hiện thuật toán nén của riêng bạn và đặt `ownsCompaction: true`.
- **Chế độ ủy quyền** — đặt `ownsCompaction: false` và để `compact()` gọi `delegateCompactionToRuntime(...)` từ `openclaw/plugin-sdk/core` để sử dụng hành vi nén tích hợp sẵn của OpenClaw.

Một `compact()` không thực hiện gì là không an toàn cho một engine không sở hữu đang hoạt động vì nó vô hiệu hóa đường dẫn nén `/compact` và phục hồi tràn thông thường cho slot engine đó.

## Tham khảo cấu hình

```json5
{
  plugins: {
    slots: {
      // Chọn engine ngữ cảnh đang hoạt động. Mặc định: "legacy".
      // Đặt thành một id plugin để sử dụng engine plugin.
      contextEngine: "legacy",
    },
  },
}
```

Slot là độc quyền tại thời gian chạy — chỉ một engine ngữ cảnh đã đăng ký được giải quyết cho một lần chạy hoặc hoạt động nén nhất định. Các plugin `kind: "context-engine"` khác đã được kích hoạt vẫn có thể tải và chạy mã đăng ký của chúng; `plugins.slots.contextEngine` chỉ chọn id engine đã đăng ký nào mà OpenClaw giải quyết khi cần một engine ngữ cảnh.

## Mối quan hệ với nén và bộ nhớ

- **Nén** là một trách nhiệm của context engine. Engine cũ ủy quyền cho tóm tắt tích hợp sẵn của OpenClaw. Các engine plugin có thể thực hiện bất kỳ chiến lược nén nào (tóm tắt DAG, truy xuất vector, v.v.).
- **Plugin bộ nhớ** (`plugins.slots.memory`) tách biệt với context engines. Plugin bộ nhớ cung cấp tìm kiếm/truy xuất; context engines kiểm soát những gì mô hình thấy. Chúng có thể hoạt động cùng nhau — một context engine có thể sử dụng dữ liệu plugin bộ nhớ trong quá trình lắp ráp.
- **Cắt tỉa session** (cắt bớt kết quả công cụ cũ trong bộ nhớ) vẫn chạy bất kể context engine nào đang hoạt động.

## Mẹo

- Sử dụng `openclaw doctor` để xác minh engine của bạn đang tải đúng cách.
- Nếu chuyển đổi engine, các session hiện tại tiếp tục với lịch sử hiện tại của chúng. Engine mới tiếp quản cho các lần chạy trong tương lai.
- Lỗi engine được ghi lại và hiển thị trong chẩn đoán. Nếu một plugin engine không đăng ký được hoặc id engine đã chọn không thể được giải quyết, OpenClaw không tự động quay lại; các lần chạy sẽ thất bại cho đến khi bạn sửa plugin hoặc chuyển `plugins.slots.contextEngine` về `"legacy"`.
- Đối với phát triển, sử dụng `openclaw plugins install -l ./my-engine` để liên kết một thư mục plugin địa phương mà không cần sao chép.

Xem thêm: [Compaction](/concepts/compaction), [Context](/concepts/context), [Plugins](/tools/plugin), [Plugin manifest](/plugins/manifest).

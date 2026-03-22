---
summary: "Logic hiển thị thanh menu và thông tin cho người dùng"
read_when:
  - Tinh chỉnh UI menu mac hoặc logic trạng thái
title: "Thanh Menu"
---

# Logic Trạng Thái Thanh Menu

## Hiển thị

- Hiển thị trạng thái công việc hiện tại của agent trên icon thanh menu và dòng trạng thái đầu tiên của menu.
- Trạng thái sức khỏe bị ẩn khi công việc đang hoạt động; sẽ hiện lại khi tất cả session đều nhàn rỗi.
- Khối “Nodes” trong menu chỉ liệt kê **thiết bị** (các node đã ghép đôi qua `node.list`), không bao gồm client/presence.
- Mục “Usage” xuất hiện dưới Context khi có snapshot sử dụng từ provider.

## Mô hình trạng thái

- Sessions: sự kiện đến với `runId` (mỗi lần chạy) và `sessionKey` trong payload. Session “chính” có key là `main`; nếu không có, sẽ dùng session cập nhật gần nhất.
- Ưu tiên: main luôn ưu tiên. Nếu main hoạt động, trạng thái của nó sẽ hiển thị ngay. Nếu main nhàn rỗi, session không phải main hoạt động gần nhất sẽ được hiển thị. Không chuyển đổi giữa chừng; chỉ chuyển khi session hiện tại nhàn rỗi hoặc main hoạt động.
- Loại hoạt động:
  - `job`: thực thi lệnh cấp cao (`state: started|streaming|done|error`).
  - `tool`: `phase: start|result` với `toolName` và `meta/args`.

## Enum IconState (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (debug override)

### ActivityKind → glyph

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- mặc định → 🛠️

### Mapping hình ảnh

- `idle`: biểu tượng bình thường.
- `workingMain`: biểu tượng với glyph, màu đầy đủ, hoạt ảnh chân “đang làm việc”.
- `workingOther`: biểu tượng với glyph, màu nhạt, không có hoạt ảnh.
- `overridden`: dùng glyph/màu đã chọn bất kể hoạt động.

## Văn bản dòng trạng thái (menu)

- Khi công việc đang hoạt động: `<Vai trò Session> · <nhãn hoạt động>`
  - Ví dụ: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- Khi nhàn rỗi: quay lại tóm tắt sức khỏe.

## Xử lý sự kiện

- Nguồn: sự kiện `agent` từ control‑channel (`ControlChannel.handleAgentEvent`).
- Trường đã phân tích:
  - `stream: "job"` với `data.state` cho bắt đầu/kết thúc.
  - `stream: "tool"` với `data.phase`, `name`, `meta`/`args` tùy chọn.
- Nhãn:
  - `exec`: dòng đầu tiên của `args.command`.
  - `read`/`write`: đường dẫn rút gọn.
  - `edit`: đường dẫn cộng với loại thay đổi suy luận từ `meta`/đếm diff.
  - mặc định: tên công cụ.

## Debug override

- Cài đặt ▸ Debug ▸ “Icon override” picker:
  - `System (auto)` (mặc định)
  - `Working: main` (theo loại công cụ)
  - `Working: other` (theo loại công cụ)
  - `Idle`
- Lưu qua `@AppStorage("iconOverride")`; ánh xạ tới `IconState.overridden`.

## Checklist kiểm thử

- Kích hoạt job session chính: kiểm tra icon chuyển ngay và dòng trạng thái hiển thị nhãn chính.
- Kích hoạt job session không phải chính khi main nhàn rỗi: icon/trạng thái hiển thị không phải chính; giữ ổn định cho đến khi hoàn thành.
- Bắt đầu main khi cái khác đang hoạt động: icon chuyển ngay sang main.
- Bùng nổ công cụ nhanh: đảm bảo biểu tượng không nhấp nháy (TTL grace trên kết quả công cụ).
- Dòng sức khỏe xuất hiện lại khi tất cả session nhàn rỗi.\n
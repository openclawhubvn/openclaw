---
summary: "Tìm hiểu cách cấu hình và tối ưu hóa thanh menu trên Mac để cải thiện trải nghiệm người dùng và hiệu suất hệ thống."
read_when:
  - Điều chỉnh giao diện hoặc logic trạng thái menu trên mac
title: "Hướng Dẫn Cấu Hình Thanh Menu Trên Mac"
---

# Logic Trạng Thái Thanh Menu

## Những gì được hiển thị

- Trạng thái công việc hiện tại của agent được hiển thị trên biểu tượng thanh menu và dòng trạng thái đầu tiên của menu.
- Trạng thái sức khỏe bị ẩn khi công việc đang hoạt động; nó sẽ trở lại khi tất cả các phiên làm việc đều nhàn rỗi.
- Phần “Nodes” trong menu chỉ liệt kê **thiết bị** (các node đã ghép đôi qua `node.list`), không bao gồm các mục client/presence.
- Mục “Usage” xuất hiện dưới Context khi có sẵn ảnh chụp nhanh về việc sử dụng của provider.

## Mô hình trạng thái

- Phiên làm việc: sự kiện đến với `runId` (cho mỗi lần chạy) cùng với `sessionKey` trong payload. Phiên chính là khóa `main`; nếu không có, chúng tôi sẽ sử dụng phiên được cập nhật gần nhất.
- Ưu tiên: phiên chính luôn được ưu tiên. Nếu phiên chính đang hoạt động, trạng thái của nó sẽ được hiển thị ngay lập tức. Nếu phiên chính nhàn rỗi, phiên không chính hoạt động gần đây nhất sẽ được hiển thị. Chúng tôi không thay đổi giữa chừng hoạt động; chỉ chuyển khi phiên hiện tại nhàn rỗi hoặc phiên chính hoạt động.
- Các loại hoạt động:
  - `job`: thực thi lệnh cấp cao (`state: started|streaming|done|error`).
  - `tool`: `phase: start|result` với `toolName` và `meta/args`.

## Enum IconState (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (ghi đè debug)

### ActivityKind → biểu tượng

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- mặc định → 🛠️

### Ánh xạ hình ảnh

- `idle`: biểu tượng bình thường.
- `workingMain`: biểu tượng với glyph, màu đầy đủ, hoạt ảnh chân “đang làm việc”.
- `workingOther`: biểu tượng với glyph, màu nhạt, không có hoạt ảnh.
- `overridden`: sử dụng glyph/màu đã chọn bất kể hoạt động.

## Văn bản dòng trạng thái (menu)

- Khi công việc đang hoạt động: `<Vai trò phiên> · <nhãn hoạt động>`
  - Ví dụ: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- Khi nhàn rỗi: quay lại tóm tắt sức khỏe.

## Xử lý sự kiện

- Nguồn: sự kiện `agent` từ kênh điều khiển (`ControlChannel.handleAgentEvent`).
- Các trường được phân tích:
  - `stream: "job"` với `data.state` cho bắt đầu/dừng.
  - `stream: "tool"` với `data.phase`, `name`, `meta`/`args` tùy chọn.
- Nhãn:
  - `exec`: dòng đầu tiên của `args.command`.
  - `read`/`write`: đường dẫn rút gọn.
  - `edit`: đường dẫn cộng với loại thay đổi suy luận từ `meta`/đếm diff.
  - dự phòng: tên công cụ.

## Ghi đè debug

- Cài đặt ▸ Debug ▸ Bộ chọn “Icon override”:
  - `System (auto)` (mặc định)
  - `Working: main` (theo loại công cụ)
  - `Working: other` (theo loại công cụ)
  - `Idle`
- Lưu trữ qua `@AppStorage("iconOverride")`; ánh xạ tới `IconState.overridden`.

## Danh sách kiểm tra thử nghiệm

- Kích hoạt công việc phiên chính: xác minh biểu tượng chuyển ngay lập tức và dòng trạng thái hiển thị nhãn chính.
- Kích hoạt công việc phiên không chính khi phiên chính nhàn rỗi: biểu tượng/trạng thái hiển thị không chính; giữ ổn định cho đến khi hoàn thành.
- Bắt đầu phiên chính khi phiên khác đang hoạt động: biểu tượng chuyển sang chính ngay lập tức.
- Bùng nổ công cụ nhanh: đảm bảo biểu tượng không nhấp nháy (TTL grace trên kết quả công cụ).
- Dòng sức khỏe xuất hiện lại khi tất cả các phiên nhàn rỗi.

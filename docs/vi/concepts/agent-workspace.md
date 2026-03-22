---
summary: "Không gian làm việc của agent: vị trí, bố cục và chiến lược sao lưu"
read_when:
  - Bạn cần giải thích về không gian làm việc của agent hoặc bố cục file của nó
  - Bạn muốn sao lưu hoặc di chuyển không gian làm việc của agent
title: "Không gian làm việc của Agent"
---

# Không gian làm việc của Agent

Không gian làm việc là nơi lưu trữ chính của agent. Đây là thư mục làm việc duy nhất được sử dụng cho các công cụ file và ngữ cảnh không gian làm việc. Hãy giữ nó riêng tư và coi như bộ nhớ.

Điều này tách biệt với `~/.openclaw/`, nơi lưu trữ cấu hình, thông tin xác thực và phiên làm việc.

**Quan trọng:** không gian làm việc là **thư mục làm việc mặc định**, không phải là một sandbox cứng. Các công cụ giải quyết đường dẫn tương đối so với không gian làm việc, nhưng đường dẫn tuyệt đối vẫn có thể truy cập các nơi khác trên máy chủ trừ khi sandboxing được kích hoạt. Nếu cần cách ly, hãy sử dụng [`agents.defaults.sandbox`](/gateway/sandboxing) (và/hoặc cấu hình sandbox cho từng agent). Khi sandboxing được kích hoạt và `workspaceAccess` không phải là `"rw"`, các công cụ hoạt động trong một không gian làm việc sandbox dưới `~/.openclaw/sandboxes`, không phải không gian làm việc trên máy chủ của bạn.

## Vị trí mặc định

- Mặc định: `~/.openclaw/workspace`
- Nếu `OPENCLAW_PROFILE` được thiết lập và không phải là `"default"`, mặc định sẽ trở thành `~/.openclaw/workspace-<profile>`.
- Ghi đè trong `~/.openclaw/openclaw.json`:

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

`openclaw onboard`, `openclaw configure`, hoặc `openclaw setup` sẽ tạo không gian làm việc và khởi tạo các file bootstrap nếu chúng bị thiếu. Các bản sao sandbox chỉ chấp nhận các file thông thường trong không gian làm việc; các liên kết symlink/hardlink giải quyết ngoài không gian làm việc nguồn sẽ bị bỏ qua.

Nếu bạn đã tự quản lý các file trong không gian làm việc, bạn có thể tắt việc tạo file bootstrap:

```json5
{ agent: { skipBootstrap: true } }
```

## Thư mục không gian làm việc bổ sung

Các cài đặt cũ có thể đã tạo `~/openclaw`. Giữ nhiều thư mục không gian làm việc có thể gây ra sự nhầm lẫn về xác thực hoặc trạng thái, vì chỉ có một không gian làm việc hoạt động tại một thời điểm.

**Khuyến nghị:** giữ một không gian làm việc hoạt động duy nhất. Nếu bạn không còn sử dụng các thư mục bổ sung, hãy lưu trữ hoặc chuyển chúng vào Thùng rác (ví dụ `trash ~/openclaw`). Nếu bạn cố ý giữ nhiều không gian làm việc, hãy đảm bảo `agents.defaults.workspace` trỏ đến không gian hoạt động.

`openclaw doctor` sẽ cảnh báo khi phát hiện các thư mục không gian làm việc bổ sung.

## Bản đồ file không gian làm việc (ý nghĩa của từng file)

Đây là các file tiêu chuẩn mà OpenClaw mong đợi trong không gian làm việc:

- `AGENTS.md`
  - Hướng dẫn hoạt động cho agent và cách sử dụng bộ nhớ.
  - Được tải khi bắt đầu mỗi phiên.
  - Nơi tốt để đặt quy tắc, ưu tiên và chi tiết "cách hành xử".

- `SOUL.md`
  - Nhân cách, giọng điệu và giới hạn.
  - Được tải mỗi phiên.

- `USER.md`
  - Ai là người dùng và cách gọi họ.
  - Được tải mỗi phiên.

- `IDENTITY.md`
  - Tên, phong cách và biểu tượng cảm xúc của agent.
  - Được tạo/cập nhật trong quá trình khởi tạo.

- `TOOLS.md`
  - Ghi chú về các công cụ và quy ước địa phương.
  - Không kiểm soát sự sẵn có của công cụ; chỉ là hướng dẫn.

- `HEARTBEAT.md`
  - Danh sách kiểm tra nhỏ tùy chọn cho các lần chạy heartbeat.
  - Giữ ngắn gọn để tránh tiêu tốn token.

- `BOOT.md`
  - Danh sách kiểm tra khởi động tùy chọn thực thi khi khởi động lại gateway khi các hook nội bộ được kích hoạt.
  - Giữ ngắn gọn; sử dụng công cụ tin nhắn để gửi đi.

- `BOOTSTRAP.md`
  - Nghi thức chạy lần đầu tiên.
  - Chỉ được tạo cho một không gian làm việc hoàn toàn mới.
  - Xóa nó sau khi nghi thức hoàn tất.

- `memory/YYYY-MM-DD.md`
  - Nhật ký bộ nhớ hàng ngày (một file mỗi ngày).
  - Khuyến nghị đọc hôm nay + hôm qua khi bắt đầu phiên.

- `MEMORY.md` (tùy chọn)
  - Bộ nhớ dài hạn được chọn lọc.
  - Chỉ tải trong phiên chính, riêng tư (không phải ngữ cảnh chia sẻ/nhóm).

Xem [Memory](/concepts/memory) để biết quy trình làm việc và tự động xóa bộ nhớ.

- `skills/` (tùy chọn)
  - Kỹ năng cụ thể cho không gian làm việc.
  - Ghi đè kỹ năng được quản lý/gói khi tên trùng lặp.

- `canvas/` (tùy chọn)
  - File giao diện Canvas cho hiển thị node (ví dụ `canvas/index.html`).

Nếu bất kỳ file bootstrap nào bị thiếu, OpenClaw sẽ chèn một dấu "thiếu file" vào phiên và tiếp tục. Các file bootstrap lớn bị cắt ngắn khi được chèn; điều chỉnh giới hạn với `agents.defaults.bootstrapMaxChars` (mặc định: 20000) và `agents.defaults.bootstrapTotalMaxChars` (mặc định: 150000). `openclaw setup` có thể tạo lại các mặc định bị thiếu mà không ghi đè các file hiện có.

## Những gì KHÔNG có trong không gian làm việc

Những thứ này nằm dưới `~/.openclaw/` và KHÔNG nên được cam kết vào kho lưu trữ không gian làm việc:

- `~/.openclaw/openclaw.json` (cấu hình)
- `~/.openclaw/credentials/` (OAuth tokens, API keys)
- `~/.openclaw/agents/<agentId>/sessions/` (bản ghi phiên + metadata)
- `~/.openclaw/skills/` (kỹ năng được quản lý)

Nếu cần di chuyển phiên hoặc cấu hình, hãy sao chép chúng riêng biệt và giữ chúng ngoài kiểm soát phiên bản.

## Sao lưu Git (khuyến nghị, riêng tư)

Xem không gian làm việc như bộ nhớ riêng tư. Đặt nó trong một kho git **riêng tư** để sao lưu và khôi phục.

Thực hiện các bước này trên máy chạy Gateway (nơi không gian làm việc tồn tại).

### 1) Khởi tạo kho lưu trữ

Nếu git đã được cài đặt, các không gian làm việc mới sẽ được khởi tạo tự động. Nếu không gian làm việc này chưa phải là một kho lưu trữ, hãy chạy:

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Thêm không gian làm việc của agent"
```

### 2) Thêm remote riêng tư (tùy chọn dễ sử dụng cho người mới bắt đầu)

Tùy chọn A: Giao diện web GitHub

1. Tạo một kho lưu trữ **riêng tư** mới trên GitHub.
2. Không khởi tạo với README (tránh xung đột merge).
3. Sao chép URL remote HTTPS.
4. Thêm remote và đẩy:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

Tùy chọn B: GitHub CLI (`gh`)

```bash
gh auth login
gh repo create openclaw-workspace --private --source . --remote origin --push
```

Tùy chọn C: Giao diện web GitLab

1. Tạo một kho lưu trữ **riêng tư** mới trên GitLab.
2. Không khởi tạo với README (tránh xung đột merge).
3. Sao chép URL remote HTTPS.
4. Thêm remote và đẩy:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

### 3) Cập nhật liên tục

```bash
git status
git add .
git commit -m "Cập nhật bộ nhớ"
git push
```

## Không cam kết thông tin bí mật

Ngay cả trong một kho lưu trữ riêng tư, tránh lưu trữ thông tin bí mật trong không gian làm việc:

- API keys, OAuth tokens, mật khẩu, hoặc thông tin xác thực riêng tư.
- Bất kỳ thứ gì dưới `~/.openclaw/`.
- Bản ghi thô của các cuộc trò chuyện hoặc tệp đính kèm nhạy cảm.

Nếu bạn phải lưu trữ các tham chiếu nhạy cảm, hãy sử dụng các chỗ giữ chỗ và giữ bí mật thực sự ở nơi khác (trình quản lý mật khẩu, biến môi trường, hoặc `~/.openclaw/`).

Đề xuất `.gitignore` khởi đầu:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Di chuyển không gian làm việc sang máy mới

1. Clone kho lưu trữ đến đường dẫn mong muốn (mặc định `~/.openclaw/workspace`).
2. Thiết lập `agents.defaults.workspace` đến đường dẫn đó trong `~/.openclaw/openclaw.json`.
3. Chạy `openclaw setup --workspace <path>` để khởi tạo bất kỳ file nào bị thiếu.
4. Nếu cần phiên, sao chép `~/.openclaw/agents/<agentId>/sessions/` từ máy cũ riêng biệt.

## Ghi chú nâng cao

- Định tuyến đa agent có thể sử dụng các không gian làm việc khác nhau cho từng agent. Xem [Định tuyến kênh](/channels/channel-routing) để biết cấu hình định tuyến.
- Nếu `agents.defaults.sandbox` được kích hoạt, các phiên không phải chính có thể sử dụng các không gian làm việc sandbox cho từng phiên dưới `agents.defaults.sandbox.workspaceRoot`.

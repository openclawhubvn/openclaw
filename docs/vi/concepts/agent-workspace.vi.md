---
summary: "Agent workspace: vị trí, cấu trúc và chiến lược backup"
read_when:
  - Cần giải thích về agent workspace hoặc cấu trúc file của nó
  - Muốn backup hoặc di chuyển agent workspace
title: "Agent Workspace"
---

# Agent workspace

Workspace là nơi làm việc của agent. Đây là thư mục duy nhất dùng cho công cụ file và ngữ cảnh workspace. Giữ riêng tư và coi như bộ nhớ.

Khác với `~/.openclaw/`, nơi lưu trữ config, credentials và sessions.

**Quan trọng:** workspace là **cwd mặc định**, không phải sandbox cứng. Công cụ giải quyết đường dẫn tương đối so với workspace, nhưng đường dẫn tuyệt đối vẫn có thể truy cập nơi khác trên host trừ khi bật sandboxing. Nếu cần cách ly, dùng [`agents.defaults.sandbox`](/gateway/sandboxing) (và/hoặc cấu hình sandbox cho từng agent). Khi bật sandboxing và `workspaceAccess` không phải `"rw"`, công cụ hoạt động trong sandbox workspace dưới `~/.openclaw/sandboxes`, không phải workspace trên host.

## Vị trí mặc định

- Mặc định: `~/.openclaw/workspace`
- Nếu `OPENCLAW_PROFILE` được thiết lập và không phải `"default"`, mặc định sẽ là `~/.openclaw/workspace-<profile>`.
- Ghi đè trong `~/.openclaw/openclaw.json`:

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

`openclaw onboard`, `openclaw configure`, hoặc `openclaw setup` sẽ tạo workspace và seed các file bootstrap nếu thiếu. Sandbox seed chỉ chấp nhận file trong workspace; symlink/hardlink dẫn ra ngoài source workspace bị bỏ qua.

Nếu tự quản lý file workspace, có thể tắt tạo file bootstrap:

```json5
{ agent: { skipBootstrap: true } }
```

## Thư mục workspace phụ

Cài đặt cũ có thể đã tạo `~/openclaw`. Giữ nhiều thư mục workspace có thể gây nhầm lẫn về auth hoặc trạng thái, vì chỉ một workspace hoạt động tại một thời điểm.

**Khuyến nghị:** giữ một workspace hoạt động duy nhất. Nếu không dùng thư mục phụ, lưu trữ hoặc chuyển vào Thùng rác (ví dụ `trash ~/openclaw`). Nếu cố ý giữ nhiều workspace, đảm bảo `agents.defaults.workspace` trỏ đến workspace hoạt động.

`openclaw doctor` cảnh báo khi phát hiện thư mục workspace phụ.

## Bản đồ file workspace (ý nghĩa từng file)

Các file chuẩn OpenClaw mong đợi trong workspace:

- `AGENTS.md`
  - Hướng dẫn hoạt động cho agent và cách sử dụng bộ nhớ.
  - Tải khi bắt đầu mỗi session.
  - Nơi tốt cho quy tắc, ưu tiên và chi tiết "cách hành xử".

- `SOUL.md`
  - Persona, tone và giới hạn.
  - Tải mỗi session.

- `USER.md`
  - Ai là người dùng và cách xưng hô.
  - Tải mỗi session.

- `IDENTITY.md`
  - Tên, vibe và emoji của agent.
  - Tạo/cập nhật trong nghi thức bootstrap.

- `TOOLS.md`
  - Ghi chú về công cụ và quy ước địa phương.
  - Không kiểm soát khả dụng công cụ; chỉ là hướng dẫn.

- `HEARTBEAT.md`
  - Checklist nhỏ tùy chọn cho chạy heartbeat.
  - Giữ ngắn để tránh tiêu tốn token.

- `BOOT.md`
  - Checklist khởi động tùy chọn thực thi khi khởi động lại gateway khi bật hook nội bộ.
  - Giữ ngắn; dùng công cụ message cho gửi đi.

- `BOOTSTRAP.md`
  - Nghi thức chạy lần đầu.
  - Chỉ tạo cho workspace mới hoàn toàn.
  - Xóa sau khi hoàn thành nghi thức.

- `memory/YYYY-MM-DD.md`
  - Nhật ký bộ nhớ hàng ngày (một file mỗi ngày).
  - Khuyến nghị đọc hôm nay + hôm qua khi bắt đầu session.

- `MEMORY.md` (tùy chọn)
  - Bộ nhớ dài hạn được chọn lọc.
  - Chỉ tải trong session chính, riêng tư (không chia sẻ/nhóm).

Xem [Memory](/concepts/memory) cho quy trình và tự động flush bộ nhớ.

- `skills/` (tùy chọn)
  - Kỹ năng đặc thù workspace.
  - Ghi đè kỹ năng quản lý/bundled khi tên trùng.

- `canvas/` (tùy chọn)
  - File UI canvas cho hiển thị node (ví dụ `canvas/index.html`).

Nếu thiếu file bootstrap, OpenClaw chèn "missing file" marker vào session và tiếp tục. File bootstrap lớn bị cắt khi chèn; điều chỉnh giới hạn với `agents.defaults.bootstrapMaxChars` (mặc định: 20000) và `agents.defaults.bootstrapTotalMaxChars` (mặc định: 150000). `openclaw setup` có thể tạo lại mặc định thiếu mà không ghi đè file hiện có.

## Những gì KHÔNG có trong workspace

Những thứ này nằm dưới `~/.openclaw/` và KHÔNG nên commit vào repo workspace:

- `~/.openclaw/openclaw.json` (config)
- `~/.openclaw/credentials/` (OAuth tokens, API keys)
- `~/.openclaw/agents/<agentId>/sessions/` (transcripts session + metadata)
- `~/.openclaw/skills/` (kỹ năng quản lý)

Nếu cần di chuyển sessions hoặc config, sao chép riêng và giữ ngoài version control.

## Backup Git (khuyến nghị, riêng tư)

Coi workspace như bộ nhớ riêng tư. Đặt vào repo git **riêng tư** để backup và khôi phục.

Chạy các bước này trên máy chạy Gateway (nơi workspace tồn tại).

### 1) Khởi tạo repo

Nếu đã cài git, workspace mới sẽ tự động khởi tạo. Nếu workspace này chưa là repo, chạy:

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) Thêm remote riêng tư (tùy chọn dễ cho người mới)

Tùy chọn A: GitHub web UI

1. Tạo repo **riêng tư** mới trên GitHub.
2. Không khởi tạo với README (tránh xung đột merge).
3. Sao chép URL remote HTTPS.
4. Thêm remote và push:

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

Tùy chọn C: GitLab web UI

1. Tạo repo **riêng tư** mới trên GitLab.
2. Không khởi tạo với README (tránh xung đột merge).
3. Sao chép URL remote HTTPS.
4. Thêm remote và push:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

### 3) Cập nhật liên tục

```bash
git status
git add .
git commit -m "Update memory"
git push
```

## Không commit secrets

Dù trong repo riêng tư, tránh lưu secrets trong workspace:

- API keys, OAuth tokens, mật khẩu, hoặc credentials riêng tư.
- Bất cứ thứ gì dưới `~/.openclaw/`.
- Dữ liệu chat thô hoặc tệp đính kèm nhạy cảm.

Nếu phải lưu tham chiếu nhạy cảm, dùng placeholders và giữ secret thật ở nơi khác (trình quản lý mật khẩu, biến môi trường, hoặc `~/.openclaw/`).

Gợi ý `.gitignore` khởi đầu:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Di chuyển workspace sang máy mới

1. Clone repo đến đường dẫn mong muốn (mặc định `~/.openclaw/workspace`).
2. Đặt `agents.defaults.workspace` đến đường dẫn đó trong `~/.openclaw/openclaw.json`.
3. Chạy `openclaw setup --workspace <path>` để seed file thiếu.
4. Nếu cần sessions, sao chép `~/.openclaw/agents/<agentId>/sessions/` từ máy cũ riêng.

## Ghi chú nâng cao

- Multi-agent routing có thể dùng workspace khác nhau cho từng agent. Xem [Channel routing](/channels/channel-routing) cho cấu hình routing.
- Nếu `agents.defaults.sandbox` được bật, các session không phải chính có thể dùng sandbox workspace riêng cho từng session dưới `agents.defaults.sandbox.workspaceRoot`.\n
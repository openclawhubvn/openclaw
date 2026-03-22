---
summary: "Cách dùng exec tool, chế độ stdin, và hỗ trợ TTY"
read_when:
  - Sử dụng hoặc chỉnh sửa exec tool
  - Debug hành vi stdin hoặc TTY
title: "Exec Tool"
---

# Exec tool

Chạy lệnh shell trong workspace. Hỗ trợ chạy foreground và background qua `process`. Nếu `process` bị cấm, `exec` chạy đồng bộ và bỏ qua `yieldMs`/`background`. Session background được giới hạn theo agent; `process` chỉ thấy session từ cùng agent.

## Tham số

- `command` (bắt buộc)
- `workdir` (mặc định là cwd)
- `env` (ghi đè key/value)
- `yieldMs` (mặc định 10000): tự động chuyển background sau delay
- `background` (bool): chuyển background ngay lập tức
- `timeout` (giây, mặc định 1800): kill khi hết hạn
- `pty` (bool): chạy trong pseudo-terminal khi có (TTY-only CLIs, coding agents, terminal UIs)
- `host` (`sandbox | gateway | node`): nơi thực thi
- `security` (`deny | allowlist | full`): chế độ kiểm soát cho `gateway`/`node`
- `ask` (`off | on-miss | always`): yêu cầu phê duyệt cho `gateway`/`node`
- `node` (string): node id/name cho `host=node`
- `elevated` (bool): yêu cầu chế độ nâng cao (gateway host); `security=full` chỉ bị ép khi elevated giải quyết thành `full`

Ghi chú:

- `host` mặc định là `sandbox`.
- `elevated` bị bỏ qua khi sandboxing tắt (exec đã chạy trên host).
- Phê duyệt `gateway`/`node` được kiểm soát bởi `~/.openclaw/exec-approvals.json`.
- `node` yêu cầu một node ghép đôi (companion app hoặc headless node host).
- Nếu có nhiều node, đặt `exec.node` hoặc `tools.exec.node` để chọn một.
- Trên host không phải Windows, exec dùng `SHELL` khi có; nếu `SHELL` là `fish`, nó ưu tiên `bash` (hoặc `sh`) từ `PATH` để tránh script không tương thích với fish, sau đó quay lại `SHELL` nếu không có.
- Trên host Windows, exec ưu tiên tìm PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, sau đó PATH), sau đó quay lại Windows PowerShell 5.1.
- Thực thi trên host (`gateway`/`node`) từ chối `env.PATH` và ghi đè loader (`LD_*`/`DYLD_*`) để ngăn chặn hijacking binary hoặc mã tiêm.
- OpenClaw đặt `OPENCLAW_SHELL=exec` trong môi trường lệnh được spawn (bao gồm PTY và sandbox execution) để shell/profile rules có thể phát hiện ngữ cảnh exec-tool.
- Quan trọng: sandboxing **tắt mặc định**. Nếu sandboxing tắt và `host=sandbox` được cấu hình/yêu cầu rõ ràng, exec giờ sẽ thất bại thay vì chạy âm thầm trên gateway host. Bật sandboxing hoặc dùng `host=gateway` với phê duyệt.
- Kiểm tra trước script (cho lỗi cú pháp shell Python/Node phổ biến) chỉ kiểm tra file trong ranh giới `workdir` hiệu quả. Nếu đường dẫn script giải quyết ngoài `workdir`, kiểm tra trước bị bỏ qua cho file đó.

## Cấu hình

- `tools.exec.notifyOnExit` (mặc định: true): khi true, session exec background sẽ xếp hàng một sự kiện hệ thống và yêu cầu heartbeat khi thoát.
- `tools.exec.approvalRunningNoticeMs` (mặc định: 10000): phát ra thông báo “running” khi một exec bị phê duyệt chạy lâu hơn thời gian này (0 để tắt).
- `tools.exec.host` (mặc định: `sandbox`)
- `tools.exec.security` (mặc định: `deny` cho sandbox, `allowlist` cho gateway + node khi không đặt)
- `tools.exec.ask` (mặc định: `on-miss`)
- `tools.exec.node` (mặc định: không đặt)
- `tools.exec.pathPrepend`: danh sách thư mục để thêm vào `PATH` cho exec runs (gateway + sandbox only).
- `tools.exec.safeBins`: binary chỉ stdin an toàn có thể chạy mà không cần mục allowlist rõ ràng. Chi tiết hành vi, xem [Safe bins](/tools/exec-approvals#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: thư mục rõ ràng bổ sung được tin cậy cho kiểm tra đường dẫn `safeBins`. Các mục `PATH` không bao giờ được tự động tin cậy. Mặc định tích hợp là `/bin` và `/usr/bin`.
- `tools.exec.safeBinProfiles`: chính sách argv tùy chỉnh cho mỗi safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

Ví dụ:

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### Xử lý PATH

- `host=gateway`: hợp nhất `PATH` của login-shell vào môi trường exec. Ghi đè `env.PATH` bị từ chối cho thực thi trên host. Daemon tự chạy với một `PATH` tối thiểu:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: chạy `sh -lc` (login shell) trong container, vì vậy `/etc/profile` có thể đặt lại `PATH`. OpenClaw thêm `env.PATH` sau khi profile được nguồn qua một biến môi trường nội bộ (không có shell interpolation); `tools.exec.pathPrepend` cũng áp dụng ở đây.
- `host=node`: chỉ các ghi đè env không bị chặn bạn truyền mới được gửi đến node. Ghi đè `env.PATH` bị từ chối cho thực thi trên host và bị node hosts bỏ qua. Nếu cần thêm mục PATH trên một node, cấu hình môi trường dịch vụ host node (systemd/launchd) hoặc cài đặt công cụ ở vị trí tiêu chuẩn.

Ràng buộc node theo agent (sử dụng chỉ mục danh sách agent trong cấu hình):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: tab Nodes bao gồm một panel nhỏ “Exec node binding” cho các cài đặt tương tự.

## Ghi đè session (`/exec`)

Dùng `/exec` để đặt mặc định **theo session** cho `host`, `security`, `ask`, và `node`. Gửi `/exec` không có tham số để hiển thị giá trị hiện tại.

Ví dụ:

```
/exec host=gateway security=allowlist ask=on-miss node=mac-1
```

## Mô hình ủy quyền

`/exec` chỉ được chấp nhận cho **người gửi được ủy quyền** (danh sách cho phép channel/ghép đôi cộng với `commands.useAccessGroups`). Nó chỉ cập nhật **trạng thái session** và không ghi cấu hình. Để vô hiệu hóa exec, từ chối nó qua chính sách công cụ (`tools.deny: ["exec"]` hoặc theo agent). Phê duyệt host vẫn áp dụng trừ khi bạn đặt rõ `security=full` và `ask=off`.

## Phê duyệt exec (companion app / node host)

Agent sandbox có thể yêu cầu phê duyệt từng yêu cầu trước khi `exec` chạy trên gateway hoặc node host. Xem [Phê duyệt exec](/tools/exec-approvals) cho chính sách, danh sách cho phép, và luồng UI.

Khi cần phê duyệt, exec tool trả về ngay lập tức với `status: "approval-pending"` và một id phê duyệt. Khi được phê duyệt (hoặc từ chối / hết thời gian), Gateway phát ra sự kiện hệ thống (`Exec finished` / `Exec denied`). Nếu lệnh vẫn đang chạy sau `tools.exec.approvalRunningNoticeMs`, một thông báo `Exec running` duy nhất được phát ra.

## Allowlist + safe bins

Thực thi danh sách cho phép thủ công chỉ khớp với **đường dẫn binary đã giải quyết** (không khớp basename). Khi `security=allowlist`, lệnh shell được tự động cho phép chỉ khi mọi phân đoạn pipeline được cho phép hoặc là safe bin. Chaining (`;`, `&&`, `||`) và chuyển hướng bị từ chối trong chế độ allowlist trừ khi mọi phân đoạn cấp cao nhất thỏa mãn danh sách cho phép (bao gồm safe bins). Chuyển hướng vẫn không được hỗ trợ.

`autoAllowSkills` là một đường dẫn tiện lợi riêng trong phê duyệt exec. Nó không giống như các mục danh sách cho phép đường dẫn thủ công. Để tin tưởng rõ ràng nghiêm ngặt, giữ `autoAllowSkills` bị tắt.

Sử dụng hai điều khiển cho các công việc khác nhau:

- `tools.exec.safeBins`: bộ lọc stream nhỏ, chỉ stdin.
- `tools.exec.safeBinTrustedDirs`: thư mục tin cậy bổ sung rõ ràng cho đường dẫn thực thi safe-bin.
- `tools.exec.safeBinProfiles`: chính sách argv rõ ràng cho safe bin tùy chỉnh.
- allowlist: tin tưởng rõ ràng cho đường dẫn thực thi.

Không coi `safeBins` như một danh sách cho phép chung, và không thêm các binary thông dịch/chạy thời gian (ví dụ `python3`, `node`, `ruby`, `bash`). Nếu cần những thứ đó, sử dụng các mục danh sách cho phép rõ ràng và giữ phê duyệt bật. `openclaw security audit` cảnh báo khi các mục `safeBins` thông dịch/chạy thời gian thiếu các profile rõ ràng, và `openclaw doctor --fix` có thể scaffold các mục `safeBinProfiles` tùy chỉnh bị thiếu.

Để biết chi tiết chính sách đầy đủ và ví dụ, xem [Phê duyệt exec](/tools/exec-approvals#safe-bins-stdin-only) và [Safe bins so với allowlist](/tools/exec-approvals#safe-bins-versus-allowlist).

## Ví dụ

Foreground:

```json
{ "tool": "exec", "command": "ls -la" }
```

Background + poll:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Gửi phím (kiểu tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Gửi (chỉ gửi CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Dán (mặc định có bracketed):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch (thử nghiệm)

`apply_patch` là một subtool của `exec` cho chỉnh sửa nhiều file có cấu trúc. Bật nó rõ ràng:

```json5
{
  tools: {
    exec: {
      applyPatch: { enabled: true, workspaceOnly: true, allowModels: ["gpt-5.2"] },
    },
  },
}
```

Ghi chú:

- Chỉ có sẵn cho các mô hình OpenAI/OpenAI Codex.
- Chính sách công cụ vẫn áp dụng; `allow: ["exec"]` ngầm cho phép `apply_patch`.
- Cấu hình nằm dưới `tools.exec.applyPatch`.
- `tools.exec.applyPatch.workspaceOnly` mặc định là `true` (chỉ trong workspace). Đặt nó thành `false` chỉ khi bạn cố ý muốn `apply_patch` ghi/xóa ngoài thư mục workspace.\n
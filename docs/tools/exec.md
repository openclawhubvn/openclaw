---
summary: "Khám phá cách sử dụng công cụ Exec với các chế độ stdin và TTY, tối ưu hóa quy trình làm việc của bạn."
read_when:
  - Sử dụng hoặc chỉnh sửa công cụ exec
  - Gỡ lỗi hành vi stdin hoặc TTY
title: "Hướng Dẫn Sử Dụng Công Cụ Exec Hiệu Quả"
---

# Công cụ Exec

Chạy các lệnh shell trong workspace. Hỗ trợ thực thi ở chế độ foreground và background thông qua `process`. Nếu `process` bị cấm, `exec` sẽ chạy đồng bộ và bỏ qua `yieldMs`/`background`. Các phiên background được giới hạn theo từng agent; `process` chỉ thấy các phiên từ cùng một agent.

## Tham số

- `command` (bắt buộc)
- `workdir` (mặc định là cwd)
- `env` (ghi đè key/value)
- `yieldMs` (mặc định 10000): tự động chuyển sang background sau một khoảng thời gian
- `background` (bool): chuyển sang background ngay lập tức
- `timeout` (giây, mặc định 1800): dừng khi hết thời gian
- `pty` (bool): chạy trong một pseudo-terminal khi có sẵn (chỉ dành cho CLI TTY, coding agents, giao diện terminal)
- `host` (`sandbox | gateway | node`): nơi thực thi
- `security` (`deny | allowlist | full`): chế độ thực thi cho `gateway`/`node`
- `ask` (`off | on-miss | always`): yêu cầu phê duyệt cho `gateway`/`node`
- `node` (chuỗi): id/tên node cho `host=node`
- `elevated` (bool): yêu cầu chế độ nâng cao (host gateway); `security=full` chỉ được áp dụng khi chế độ nâng cao được đặt thành `full`

Lưu ý:

- `host` mặc định là `sandbox`.
- `elevated` bị bỏ qua khi sandboxing tắt (exec đã chạy trên host).
- Phê duyệt `gateway`/`node` được kiểm soát bởi `~/.openclaw/exec-approvals.json`.
- `node` yêu cầu một node ghép đôi (ứng dụng đồng hành hoặc host node không có giao diện).
- Nếu có nhiều node, đặt `exec.node` hoặc `tools.exec.node` để chọn một.
- Trên các host không phải Windows, exec sử dụng `SHELL` khi được đặt; nếu `SHELL` là `fish`, nó ưu tiên `bash` (hoặc `sh`) từ `PATH` để tránh các script không tương thích với fish, sau đó quay lại `SHELL` nếu không có.
- Trên các host Windows, exec ưu tiên phát hiện PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, sau đó PATH), sau đó quay lại Windows PowerShell 5.1.
- Thực thi trên host (`gateway`/`node`) từ chối `env.PATH` và ghi đè loader (`LD_*`/`DYLD_*`) để ngăn chặn việc chiếm quyền điều khiển binary hoặc mã được chèn vào.
- OpenClaw đặt `OPENCLAW_SHELL=exec` trong môi trường lệnh được khởi chạy (bao gồm cả PTY và thực thi sandbox) để các quy tắc shell/profile có thể phát hiện ngữ cảnh công cụ exec.
- Quan trọng: sandboxing **tắt theo mặc định**. Nếu sandboxing tắt và `host=sandbox` được cấu hình/yêu cầu rõ ràng, exec sẽ thất bại thay vì chạy âm thầm trên host gateway. Bật sandboxing hoặc sử dụng `host=gateway` với phê duyệt.
- Kiểm tra trước script (cho các lỗi cú pháp shell Python/Node phổ biến) chỉ kiểm tra các tệp bên trong ranh giới `workdir` hiệu quả. Nếu một đường dẫn script nằm ngoài `workdir`, kiểm tra trước sẽ bị bỏ qua cho tệp đó.

## Cấu hình

- `tools.exec.notifyOnExit` (mặc định: true): khi true, các phiên exec chuyển sang background sẽ xếp hàng một sự kiện hệ thống và yêu cầu một nhịp tim khi thoát.
- `tools.exec.approvalRunningNoticeMs` (mặc định: 10000): phát ra một thông báo “đang chạy” khi một exec yêu cầu phê duyệt chạy lâu hơn thời gian này (0 để tắt).
- `tools.exec.host` (mặc định: `sandbox`)
- `tools.exec.security` (mặc định: `deny` cho sandbox, `allowlist` cho gateway + node khi không được đặt)
- `tools.exec.ask` (mặc định: `on-miss`)
- `tools.exec.node` (mặc định: không đặt)
- `tools.exec.pathPrepend`: danh sách các thư mục để thêm vào đầu `PATH` cho các lần chạy exec (chỉ dành cho gateway + sandbox).
- `tools.exec.safeBins`: các binary an toàn chỉ dành cho stdin có thể chạy mà không cần các mục allowlist rõ ràng. Để biết chi tiết hành vi, xem [Safe bins](/tools/exec-approvals#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: các thư mục rõ ràng bổ sung được tin cậy cho các kiểm tra đường dẫn `safeBins`. Các mục `PATH` không bao giờ được tự động tin cậy. Mặc định tích hợp là `/bin` và `/usr/bin`.
- `tools.exec.safeBinProfiles`: chính sách argv tùy chọn cho từng safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway`: hợp nhất `PATH` của shell đăng nhập vào môi trường exec. Các ghi đè `env.PATH` bị từ chối cho thực thi trên host. Daemon tự chạy với một `PATH` tối thiểu:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: chạy `sh -lc` (shell đăng nhập) bên trong container, vì vậy `/etc/profile` có thể đặt lại `PATH`. OpenClaw thêm `env.PATH` sau khi nguồn profile thông qua một biến môi trường nội bộ (không có nội suy shell); `tools.exec.pathPrepend` cũng áp dụng ở đây.
- `host=node`: chỉ các ghi đè env không bị chặn bạn gửi mới được gửi đến node. Các ghi đè `env.PATH` bị từ chối cho thực thi trên host và bị node hosts bỏ qua. Nếu bạn cần thêm các mục PATH trên một node, cấu hình môi trường dịch vụ host node (systemd/launchd) hoặc cài đặt công cụ ở các vị trí tiêu chuẩn.

Liên kết node theo agent (sử dụng chỉ mục danh sách agent trong cấu hình):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Giao diện điều khiển: tab Nodes bao gồm một bảng điều khiển nhỏ “Liên kết node Exec” cho các cài đặt tương tự.

## Ghi đè phiên (`/exec`)

Sử dụng `/exec` để đặt các mặc định **theo phiên** cho `host`, `security`, `ask`, và `node`. Gửi `/exec` mà không có tham số để hiển thị các giá trị hiện tại.

Ví dụ:

```
/exec host=gateway security=allowlist ask=on-miss node=mac-1
```

## Mô hình ủy quyền

`/exec` chỉ được chấp nhận cho **người gửi được ủy quyền** (danh sách cho phép kênh/ghép đôi cộng với `commands.useAccessGroups`). Nó chỉ cập nhật **trạng thái phiên** và không ghi cấu hình. Để vô hiệu hóa exec hoàn toàn, từ chối nó thông qua chính sách công cụ (`tools.deny: ["exec"]` hoặc theo agent). Phê duyệt host vẫn áp dụng trừ khi bạn đặt rõ `security=full` và `ask=off`.

## Phê duyệt Exec (ứng dụng đồng hành / host node)

Các agent được sandbox có thể yêu cầu phê duyệt từng yêu cầu trước khi `exec` chạy trên gateway hoặc host node. Xem [Phê duyệt Exec](/tools/exec-approvals) để biết chính sách, danh sách cho phép và luồng giao diện người dùng.

Khi cần phê duyệt, công cụ exec trả về ngay lập tức với `status: "approval-pending"` và một id phê duyệt. Khi được phê duyệt (hoặc từ chối / hết thời gian), Gateway phát ra các sự kiện hệ thống (`Exec finished` / `Exec denied`). Nếu lệnh vẫn đang chạy sau `tools.exec.approvalRunningNoticeMs`, một thông báo `Exec running` duy nhất được phát ra.

## Allowlist + safe bins

Thực thi danh sách cho phép thủ công chỉ khớp với **đường dẫn binary đã giải quyết** (không khớp tên cơ sở). Khi `security=allowlist`, các lệnh shell được tự động cho phép chỉ khi mọi đoạn pipeline đều nằm trong danh sách cho phép hoặc là một safe bin. Chaining (`;`, `&&`, `||`) và chuyển hướng bị từ chối trong chế độ danh sách cho phép trừ khi mọi đoạn cấp cao nhất thỏa mãn danh sách cho phép (bao gồm cả safe bins). Chuyển hướng vẫn không được hỗ trợ.

`autoAllowSkills` là một đường dẫn tiện lợi riêng trong phê duyệt exec. Nó không giống như các mục danh sách cho phép đường dẫn thủ công. Để tin tưởng rõ ràng, giữ `autoAllowSkills` bị tắt.

Sử dụng hai điều khiển cho các công việc khác nhau:

- `tools.exec.safeBins`: bộ lọc luồng chỉ dành cho stdin nhỏ.
- `tools.exec.safeBinTrustedDirs`: các thư mục tin cậy bổ sung rõ ràng cho các đường dẫn thực thi safe-bin.
- `tools.exec.safeBinProfiles`: chính sách argv rõ ràng cho các safe bin tùy chỉnh.
- allowlist: tin tưởng rõ ràng cho các đường dẫn thực thi.

Không coi `safeBins` là một danh sách cho phép chung, và không thêm các binary thông dịch/chạy (ví dụ `python3`, `node`, `ruby`, `bash`). Nếu bạn cần những thứ đó, sử dụng các mục danh sách cho phép rõ ràng và giữ các yêu cầu phê duyệt được bật. `openclaw security audit` cảnh báo khi các mục `safeBins` thông dịch/chạy thiếu các hồ sơ rõ ràng, và `openclaw doctor --fix` có thể tạo khung các mục `safeBinProfiles` tùy chỉnh bị thiếu.

Để biết chi tiết chính sách đầy đủ và ví dụ, xem [Phê duyệt Exec](/tools/exec-approvals#safe-bins-stdin-only) và [Safe bins so với allowlist](/tools/exec-approvals#safe-bins-versus-allowlist).

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

Dán (mặc định có ngoặc):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch (thử nghiệm)

`apply_patch` là một công cụ con của `exec` để chỉnh sửa nhiều tệp có cấu trúc. Kích hoạt nó rõ ràng:

```json5
{
  tools: {
    exec: {
      applyPatch: { enabled: true, workspaceOnly: true, allowModels: ["gpt-5.2"] },
    },
  },
}
```

Lưu ý:

- Chỉ có sẵn cho các mô hình OpenAI/OpenAI Codex.
- Chính sách công cụ vẫn áp dụng; `allow: ["exec"]` ngầm cho phép `apply_patch`.
- Cấu hình nằm dưới `tools.exec.applyPatch`.
- `tools.exec.applyPatch.workspaceOnly` mặc định là `true` (chỉ trong workspace). Đặt nó thành `false` chỉ khi bạn muốn `apply_patch` ghi/xóa ngoài thư mục workspace.

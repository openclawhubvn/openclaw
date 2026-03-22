---
summary: "Lệnh Doctor: kiểm tra sức khỏe, di chuyển cấu hình, và các bước sửa chữa"
read_when:
  - Thêm hoặc chỉnh sửa di chuyển doctor
  - Giới thiệu thay đổi cấu hình gây ảnh hưởng
title: "Doctor"
---

# Doctor

`openclaw doctor` là công cụ sửa chữa + di chuyển cho OpenClaw. Nó sửa cấu hình/trạng thái cũ, kiểm tra sức khỏe, và cung cấp các bước sửa chữa có thể thực hiện.

## Bắt đầu nhanh

```bash
openclaw doctor
```

### Chạy không giao diện / tự động

```bash
openclaw doctor --yes
```

Chấp nhận mặc định mà không cần hỏi (bao gồm khởi động lại/dịch vụ/sửa chữa sandbox khi cần).

```bash
openclaw doctor --repair
```

Áp dụng sửa chữa được đề xuất mà không cần hỏi (sửa chữa + khởi động lại khi an toàn).

```bash
openclaw doctor --repair --force
```

Áp dụng cả sửa chữa mạnh (ghi đè cấu hình supervisor tùy chỉnh).

```bash
openclaw doctor --non-interactive
```

Chạy không hỏi và chỉ áp dụng di chuyển an toàn (chuẩn hóa cấu hình + di chuyển trạng thái trên đĩa). Bỏ qua các hành động khởi động lại/dịch vụ/sandbox cần xác nhận từ người dùng. Di chuyển trạng thái cũ tự động chạy khi phát hiện.

```bash
openclaw doctor --deep
```

Quét dịch vụ hệ thống để tìm cài đặt gateway thừa (launchd/systemd/schtasks).

Nếu muốn xem trước thay đổi trước khi ghi, mở file cấu hình:

```bash
cat ~/.openclaw/openclaw.json
```

## Nó làm gì (tóm tắt)

- Cập nhật trước khi chạy cho cài đặt git (chỉ tương tác).
- Kiểm tra độ mới của giao thức UI (xây dựng lại Control UI khi schema giao thức mới hơn).
- Kiểm tra sức khỏe + nhắc nhở khởi động lại.
- Tóm tắt trạng thái kỹ năng (đủ điều kiện/thiếu/chặn).
- Chuẩn hóa cấu hình cho giá trị cũ.
- Kiểm tra di chuyển trình duyệt cho cấu hình extension Chrome cũ và sẵn sàng MCP Chrome.
- Cảnh báo ghi đè nhà cung cấp OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Di chuyển trạng thái trên đĩa cũ (sessions/agent dir/WhatsApp auth).
- Di chuyển lưu trữ cron cũ (`jobId`, `schedule.cron`, trường delivery/payload cấp cao nhất, payload `provider`, công việc webhook đơn giản `notify: true`).
- Kiểm tra tính toàn vẹn và quyền của trạng thái (sessions, transcripts, state dir).
- Kiểm tra quyền file cấu hình (chmod 600) khi chạy local.
- Sức khỏe xác thực mô hình: kiểm tra hết hạn OAuth, có thể làm mới token sắp hết hạn, và báo cáo trạng thái cooldown/vô hiệu hóa của hồ sơ xác thực.
- Phát hiện thư mục workspace thừa (`~/openclaw`).
- Sửa chữa hình ảnh sandbox khi sandboxing được bật.
- Di chuyển dịch vụ cũ và phát hiện gateway thừa.
- Kiểm tra runtime gateway (dịch vụ cài đặt nhưng không chạy; nhãn launchd được lưu trữ).
- Cảnh báo trạng thái kênh (thăm dò từ gateway đang chạy).
- Kiểm tra cấu hình supervisor (launchd/systemd/schtasks) với sửa chữa tùy chọn.
- Kiểm tra thực hành tốt nhất runtime gateway (Node vs Bun, đường dẫn version-manager).
- Chẩn đoán va chạm cổng gateway (mặc định `18789`).
- Cảnh báo bảo mật cho chính sách DM mở.
- Kiểm tra xác thực gateway cho chế độ token local (đề xuất tạo token khi không có nguồn token; không ghi đè cấu hình token SecretRef).
- Kiểm tra linger systemd trên Linux.
- Kiểm tra cài đặt nguồn (pnpm workspace không khớp, thiếu tài sản UI, thiếu binary tsx).
- Ghi cấu hình cập nhật + metadata wizard.

## Hành vi chi tiết và lý do

### 0) Cập nhật tùy chọn (cài đặt git)

Nếu đây là một git checkout và doctor đang chạy tương tác, nó đề xuất cập nhật (fetch/rebase/build) trước khi chạy doctor.

### 1) Chuẩn hóa cấu hình

Nếu cấu hình chứa các giá trị cũ (ví dụ `messages.ackReaction` mà không có ghi đè kênh cụ thể), doctor chuẩn hóa chúng vào schema hiện tại.

### 2) Di chuyển khóa cấu hình cũ

Khi cấu hình chứa các khóa không còn được hỗ trợ, các lệnh khác từ chối chạy và yêu cầu chạy `openclaw doctor`.

Doctor sẽ:

- Giải thích các khóa cũ nào được tìm thấy.
- Hiển thị di chuyển đã áp dụng.
- Ghi lại `~/.openclaw/openclaw.json` với schema cập nhật.

Gateway cũng tự động chạy di chuyển doctor khi khởi động khi phát hiện định dạng cấu hình cũ, do đó cấu hình cũ được sửa chữa mà không cần can thiệp thủ công.

Di chuyển hiện tại:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → cấp cao nhất `bindings`
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- Đối với các kênh có `accounts` được đặt tên nhưng thiếu `accounts.default`, di chuyển các giá trị kênh đơn tài khoản cấp cao nhất vào `channels.<channel>.accounts.default` khi có
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- loại bỏ `browser.relayBindHost` (cài đặt relay extension cũ)

Cảnh báo doctor cũng bao gồm hướng dẫn mặc định tài khoản cho các kênh nhiều tài khoản:

- Nếu hai hoặc nhiều mục `channels.<channel>.accounts` được cấu hình mà không có `channels.<channel>.defaultAccount` hoặc `accounts.default`, doctor cảnh báo rằng định tuyến dự phòng có thể chọn tài khoản không mong muốn.
- Nếu `channels.<channel>.defaultAccount` được đặt thành một ID tài khoản không xác định, doctor cảnh báo và liệt kê các ID tài khoản đã cấu hình.

### 2b) Ghi đè nhà cung cấp OpenCode

Nếu đã thêm `models.providers.opencode`, `opencode-zen`, hoặc `opencode-go` thủ công, nó ghi đè danh mục OpenCode tích hợp từ `@mariozechner/pi-ai`. Điều này có thể buộc mô hình vào API sai hoặc làm trống chi phí. Doctor cảnh báo để có thể loại bỏ ghi đè và khôi phục định tuyến API + chi phí theo mô hình.

### 2c) Di chuyển trình duyệt và sẵn sàng MCP Chrome

Nếu cấu hình trình duyệt vẫn chỉ vào đường dẫn extension Chrome đã bị loại bỏ, doctor chuẩn hóa nó thành mô hình đính kèm MCP Chrome host-local hiện tại:

- `browser.profiles.*.driver: "extension"` trở thành `"existing-session"`
- `browser.relayBindHost` bị loại bỏ

Doctor cũng kiểm tra đường dẫn MCP Chrome host-local khi sử dụng `defaultProfile: "user"` hoặc một hồ sơ `existing-session` đã cấu hình:

- kiểm tra xem Google Chrome có được cài đặt trên cùng một host cho các hồ sơ tự động kết nối mặc định không
- kiểm tra phiên bản Chrome được phát hiện và cảnh báo khi nó dưới Chrome 144
- nhắc nhở bật gỡ lỗi từ xa trong trang kiểm tra trình duyệt (ví dụ `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, hoặc `edge://inspect/#remote-debugging`)

Doctor không thể bật cài đặt phía Chrome cho bạn. MCP Chrome host-local vẫn yêu cầu:

- một trình duyệt dựa trên Chromium 144+ trên host gateway/node
- trình duyệt chạy local
- bật gỡ lỗi từ xa trong trình duyệt đó
- chấp thuận nhắc nhở đính kèm đầu tiên trong trình duyệt

Kiểm tra này **không** áp dụng cho Docker, sandbox, trình duyệt từ xa, hoặc các luồng không giao diện khác. Những cái đó tiếp tục sử dụng CDP thô.

### 3) Di chuyển trạng thái cũ (bố cục đĩa)

Doctor có thể di chuyển bố cục trên đĩa cũ vào cấu trúc hiện tại:

- Lưu trữ sessions + transcripts:
  - từ `~/.openclaw/sessions/` đến `~/.openclaw/agents/<agentId>/sessions/`
- Thư mục agent:
  - từ `~/.openclaw/agent/` đến `~/.openclaw/agents/<agentId>/agent/`
- Trạng thái xác thực WhatsApp (Baileys):
  - từ `~/.openclaw/credentials/*.json` cũ (trừ `oauth.json`)
  - đến `~/.openclaw/credentials/whatsapp/<accountId>/...` (id tài khoản mặc định: `default`)

Các di chuyển này là nỗ lực tốt nhất và có thể lặp lại; doctor sẽ phát ra cảnh báo khi để lại bất kỳ thư mục cũ nào làm bản sao lưu. Gateway/CLI cũng tự động di chuyển sessions + agent dir cũ khi khởi động để lịch sử/xác thực/mô hình nằm trong đường dẫn per-agent mà không cần chạy doctor thủ công. Xác thực WhatsApp chỉ được di chuyển qua `openclaw doctor`.

### 3b) Di chuyển lưu trữ cron cũ

Doctor cũng kiểm tra lưu trữ công việc cron (`~/.openclaw/cron/jobs.json` theo mặc định, hoặc `cron.store` khi bị ghi đè) cho các hình dạng công việc cũ mà bộ lập lịch vẫn chấp nhận để tương thích.

Dọn dẹp cron hiện tại bao gồm:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- trường payload cấp cao nhất (`message`, `model`, `thinking`, ...) → `payload`
- trường delivery cấp cao nhất (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- alias delivery `provider` payload → `delivery.channel` rõ ràng
- công việc webhook đơn giản `notify: true` → `delivery.mode="webhook"` rõ ràng với `delivery.to=cron.webhook`

Doctor chỉ tự động di chuyển công việc `notify: true` khi có thể làm như vậy mà không thay đổi hành vi. Nếu một công việc kết hợp dự phòng thông báo cũ với một chế độ delivery không phải webhook hiện có, doctor cảnh báo và để lại công việc đó để xem xét thủ công.

### 4) Kiểm tra tính toàn vẹn trạng thái (duy trì session, định tuyến, và an toàn)

Thư mục trạng thái là trung tâm điều hành. Nếu nó biến mất, bạn mất sessions, thông tin xác thực, nhật ký, và cấu hình (trừ khi có bản sao lưu ở nơi khác).

Doctor kiểm tra:

- **Thư mục trạng thái thiếu**: cảnh báo về mất trạng thái nghiêm trọng, nhắc nhở tạo lại thư mục, và nhắc nhở rằng không thể khôi phục dữ liệu bị thiếu.
- **Quyền thư mục trạng thái**: xác minh khả năng ghi; đề xuất sửa chữa quyền (và phát ra gợi ý `chown` khi phát hiện không khớp chủ sở hữu/nhóm).
- **Thư mục trạng thái đồng bộ đám mây macOS**: cảnh báo khi trạng thái giải quyết dưới iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) hoặc `~/Library/CloudStorage/...` vì các đường dẫn được đồng bộ hóa có thể gây ra I/O chậm hơn và khóa/cuộc đua đồng bộ.
- **Thư mục trạng thái SD hoặc eMMC Linux**: cảnh báo khi trạng thái giải quyết đến nguồn gắn `mmcblk*`, vì I/O ngẫu nhiên được hỗ trợ SD hoặc eMMC có thể chậm hơn và mòn nhanh hơn dưới các ghi session và thông tin xác thực.
- **Thư mục session thiếu**: `sessions/` và thư mục lưu trữ session là cần thiết để duy trì lịch sử và tránh các lỗi `ENOENT`.
- **Không khớp transcript**: cảnh báo khi các mục session gần đây có các file transcript bị thiếu.
- **Transcript chính “1-line JSONL”**: gắn cờ khi transcript chính chỉ có một dòng (lịch sử không tích lũy).
- **Nhiều thư mục trạng thái**: cảnh báo khi nhiều thư mục `~/.openclaw` tồn tại trên các thư mục home hoặc khi `OPENCLAW_STATE_DIR` chỉ đến nơi khác (lịch sử có thể chia giữa các cài đặt).
- **Nhắc nhở chế độ từ xa**: nếu `gateway.mode=remote`, doctor nhắc nhở chạy nó trên host từ xa (trạng thái sống ở đó).
- **Quyền file cấu hình**: cảnh báo nếu `~/.openclaw/openclaw.json` có thể đọc được bởi nhóm/thế giới và đề xuất siết chặt thành `600`.

### 5) Sức khỏe xác thực mô hình (hết hạn OAuth)

Doctor kiểm tra hồ sơ OAuth trong lưu trữ xác thực, cảnh báo khi token sắp hết hạn/đã hết hạn, và có thể làm mới chúng khi an toàn. Nếu hồ sơ Anthropic Claude Code cũ, nó đề xuất chạy `claude setup-token` (hoặc dán một setup-token). Các nhắc nhở làm mới chỉ xuất hiện khi chạy tương tác (TTY); `--non-interactive` bỏ qua các nỗ lực làm mới.

Doctor cũng báo cáo các hồ sơ xác thực tạm thời không sử dụng được do:

- cooldown ngắn (giới hạn tốc độ/thời gian chờ/lỗi xác thực)
- vô hiệu hóa dài hơn (lỗi thanh toán/tín dụng)

### 6) Xác thực mô hình hooks

Nếu `hooks.gmail.model` được đặt, doctor xác thực tham chiếu mô hình với danh mục và danh sách cho phép và cảnh báo khi nó không thể giải quyết hoặc không được phép.

### 7) Sửa chữa hình ảnh sandbox

Khi sandboxing được bật, doctor kiểm tra hình ảnh Docker và đề xuất xây dựng hoặc chuyển sang tên cũ nếu hình ảnh hiện tại bị thiếu.

### 8) Di chuyển dịch vụ gateway và gợi ý dọn dẹp

Doctor phát hiện các dịch vụ gateway cũ (launchd/systemd/schtasks) và đề xuất loại bỏ chúng và cài đặt dịch vụ OpenClaw sử dụng cổng gateway hiện tại. Nó cũng có thể quét các dịch vụ giống gateway thừa và in gợi ý dọn dẹp. Các dịch vụ gateway OpenClaw được đặt tên theo hồ sơ được coi là hạng nhất và không bị gắn cờ là "thừa."

### 9) Cảnh báo bảo mật

Doctor phát ra cảnh báo khi một nhà cung cấp mở cho DMs mà không có danh sách cho phép, hoặc khi một chính sách được cấu hình theo cách nguy hiểm.

### 10) systemd linger (Linux)

Nếu chạy như một dịch vụ người dùng systemd, doctor đảm bảo rằng lingering được bật để gateway vẫn hoạt động sau khi đăng xuất.

### 11) Trạng thái kỹ năng

Doctor in tóm tắt nhanh về các kỹ năng đủ điều kiện/thiếu/chặn cho workspace hiện tại.

### 12) Kiểm tra xác thực gateway (token local)

Doctor kiểm tra sẵn sàng xác thực token gateway local.

- Nếu chế độ token cần một token và không có nguồn token, doctor đề xuất tạo một cái.
- Nếu `gateway.auth.token` được quản lý bởi SecretRef nhưng không có sẵn, doctor cảnh báo và không ghi đè nó bằng văn bản rõ ràng.
- `openclaw doctor --generate-gateway-token` chỉ tạo khi không có SecretRef token được cấu hình.

### 12b) Sửa chữa nhận thức SecretRef chỉ đọc

Một số luồng sửa chữa cần kiểm tra thông tin xác thực được cấu hình mà không làm suy yếu hành vi fail-fast runtime.

- `openclaw doctor --fix` hiện sử dụng cùng một mô hình tóm tắt SecretRef chỉ đọc như các lệnh thuộc họ trạng thái cho các sửa chữa cấu hình mục tiêu.
- Ví dụ: sửa chữa `allowFrom` / `groupAllowFrom` `@username` của Telegram cố gắng sử dụng thông tin xác thực bot được cấu hình khi có sẵn.
- Nếu token bot Telegram được cấu hình qua SecretRef nhưng không có sẵn trong đường dẫn lệnh hiện tại, doctor báo cáo rằng thông tin xác thực được cấu hình nhưng không có sẵn và bỏ qua tự động giải quyết thay vì gặp sự cố hoặc báo cáo sai token là thiếu.

### 13) Kiểm tra sức khỏe gateway + khởi động lại

Doctor chạy kiểm tra sức khỏe và đề xuất khởi động lại gateway khi nó không khỏe.

### 14) Cảnh báo trạng thái kênh

Nếu gateway khỏe mạnh, doctor chạy thăm dò trạng thái kênh và báo cáo cảnh báo với các đề xuất sửa chữa.

### 15) Kiểm tra cấu hình supervisor + sửa chữa

Doctor kiểm tra cấu hình supervisor đã cài đặt (launchd/systemd/schtasks) cho các mặc định bị thiếu hoặc lỗi thời (ví dụ, phụ thuộc network-online systemd và độ trễ khởi động lại). Khi phát hiện không khớp, nó đề xuất cập nhật và có thể ghi lại file dịch vụ/nhiệm vụ theo các mặc định hiện tại.

Ghi chú:

- `openclaw doctor` nhắc nhở trước khi ghi lại cấu hình supervisor.
- `openclaw doctor --yes` chấp nhận các nhắc nhở sửa chữa mặc định.
- `openclaw doctor --repair` áp dụng các sửa chữa được đề xuất mà không cần nhắc nhở.
- `openclaw doctor --repair --force` ghi đè cấu hình supervisor tùy chỉnh.
- Nếu xác thực token yêu cầu một token và `gateway.auth.token` được quản lý bởi SecretRef, cài đặt/dịch vụ sửa chữa doctor xác thực SecretRef nhưng không lưu trữ các giá trị token văn bản rõ ràng đã giải quyết vào metadata môi trường dịch vụ supervisor.
- Nếu xác thực token yêu cầu một token và SecretRef token được cấu hình không được giải quyết, doctor chặn đường dẫn cài đặt/sửa chữa với hướng dẫn có thể thực hiện.
- Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` không được đặt, doctor chặn cài đặt/sửa chữa cho đến khi chế độ được đặt rõ ràng.
- Đối với các đơn vị user-systemd Linux, kiểm tra trôi token doctor hiện bao gồm cả nguồn `Environment=` và `EnvironmentFile=` khi so sánh metadata xác thực dịch vụ.
- Bạn luôn có thể buộc ghi lại hoàn toàn qua `openclaw gateway install --force`.

### 16) Chẩn đoán runtime + cổng gateway

Doctor kiểm tra runtime dịch vụ (PID, trạng thái thoát cuối cùng) và cảnh báo khi dịch vụ được cài đặt nhưng không thực sự chạy. Nó cũng kiểm tra va chạm cổng trên cổng gateway (mặc định `18789`) và báo cáo nguyên nhân có thể (gateway đã chạy, SSH tunnel).

### 17) Thực hành tốt nhất runtime gateway

Doctor cảnh báo khi dịch vụ gateway chạy trên Bun hoặc đường dẫn Node được quản lý phiên bản (`nvm`, `fnm`, `volta`, `asdf`, v.v.). Các kênh WhatsApp + Telegram yêu cầu Node, và các đường dẫn quản lý phiên bản có thể bị hỏng sau khi nâng cấp vì dịch vụ không tải init shell của bạn. Doctor đề xuất di chuyển sang cài đặt Node hệ thống khi có sẵn (Homebrew/apt/choco).

### 18) Ghi cấu hình + metadata wizard

Doctor lưu bất kỳ thay đổi cấu hình nào và đóng dấu metadata wizard để ghi lại lần chạy doctor.

### 19) Mẹo workspace (sao lưu + hệ thống bộ nhớ)

Doctor đề xuất một hệ thống bộ nhớ workspace khi thiếu và in một mẹo sao lưu nếu workspace chưa được đặt dưới git.

Xem [/concepts/agent-workspace](/concepts/agent-workspace) để có hướng dẫn đầy đủ về cấu trúc workspace và sao lưu git (khuyến nghị GitHub hoặc GitLab riêng tư).\n
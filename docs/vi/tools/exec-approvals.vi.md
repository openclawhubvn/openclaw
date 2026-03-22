---
summary: "Phê duyệt exec, danh sách cho phép và cảnh báo thoát sandbox"
read_when:
  - Cấu hình phê duyệt exec hoặc danh sách cho phép
  - Triển khai UX phê duyệt exec trong ứng dụng macOS
  - Xem xét cảnh báo thoát sandbox và các tác động
title: "Phê duyệt Exec"
---

# Phê duyệt Exec

Phê duyệt exec là **hàng rào bảo vệ** cho phép một agent bị sandbox chạy lệnh trên host thực (`gateway` hoặc `node`). Tưởng tượng như một khóa an toàn: lệnh chỉ được phép khi chính sách + danh sách cho phép + (tùy chọn) phê duyệt người dùng đều đồng ý. Phê duyệt exec là **bổ sung** cho chính sách công cụ và kiểm soát nâng cao (trừ khi nâng cao được đặt là `full`, bỏ qua phê duyệt). Chính sách hiệu quả là **nghiêm ngặt nhất** giữa `tools.exec.*` và mặc định phê duyệt; nếu một trường phê duyệt bị bỏ qua, giá trị `tools.exec` sẽ được sử dụng.

Nếu giao diện ứng dụng đồng hành **không khả dụng**, bất kỳ yêu cầu nào cần nhắc nhở sẽ được giải quyết bằng **ask fallback** (mặc định: từ chối).

## Áp dụng ở đâu

Phê duyệt exec được thực thi cục bộ trên host thực thi:

- **gateway host** → tiến trình `openclaw` trên máy gateway
- **node host** → node runner (ứng dụng đồng hành macOS hoặc node host không giao diện)

Ghi chú mô hình tin cậy:

- Người gọi được xác thực qua Gateway là các operator đáng tin cậy cho Gateway đó.
- Các node ghép đôi mở rộng khả năng operator đáng tin cậy đó lên node host.
- Phê duyệt exec giảm rủi ro thực thi nhầm, nhưng không phải là ranh giới xác thực theo người dùng.
- Các lần chạy node-host được phê duyệt ràng buộc ngữ cảnh thực thi chuẩn: cwd chuẩn, argv chính xác, ràng buộc env khi có, và đường dẫn thực thi cố định khi áp dụng.
- Đối với các script shell và các lệnh gọi trực tiếp interpreter/runtime, OpenClaw cũng cố gắng ràng buộc một file cục bộ cụ thể. Nếu file đó thay đổi sau khi phê duyệt nhưng trước khi thực thi, lần chạy sẽ bị từ chối thay vì thực thi nội dung đã thay đổi.
- Ràng buộc file này là nỗ lực tốt nhất, không phải là mô hình ngữ nghĩa hoàn chỉnh của mọi đường dẫn loader interpreter/runtime. Nếu chế độ phê duyệt không thể xác định chính xác một file cục bộ để ràng buộc, nó từ chối tạo một lần chạy được hỗ trợ phê duyệt thay vì giả vờ bao phủ hoàn toàn.

Phân chia macOS:

- **node host service** chuyển tiếp `system.run` đến **ứng dụng macOS** qua IPC cục bộ.
- **ứng dụng macOS** thực thi phê duyệt + thực thi lệnh trong ngữ cảnh UI.

## Cài đặt và lưu trữ

Phê duyệt được lưu trong file JSON cục bộ trên host thực thi:

`~/.openclaw/exec-approvals.json`

Ví dụ schema:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Các nút chính sách

### Security (`exec.security`)

- **deny**: chặn tất cả yêu cầu exec trên host.
- **allowlist**: chỉ cho phép các lệnh trong danh sách cho phép.
- **full**: cho phép mọi thứ (tương đương với nâng cao).

### Ask (`exec.ask`)

- **off**: không bao giờ nhắc nhở.
- **on-miss**: chỉ nhắc nhở khi danh sách cho phép không khớp.
- **always**: nhắc nhở trên mọi lệnh.

### Ask fallback (`askFallback`)

Nếu cần nhắc nhở nhưng không có UI nào có thể truy cập, fallback quyết định:

- **deny**: chặn.
- **allowlist**: chỉ cho phép nếu danh sách cho phép khớp.
- **full**: cho phép.

## Danh sách cho phép (mỗi agent)

Danh sách cho phép là **mỗi agent**. Nếu có nhiều agent, chuyển đổi agent bạn đang chỉnh sửa trong ứng dụng macOS. Các mẫu là **khớp glob không phân biệt chữ hoa chữ thường**. Các mẫu nên giải quyết thành **đường dẫn nhị phân** (các mục chỉ có tên cơ sở bị bỏ qua). Các mục `agents.default` cũ được di chuyển sang `agents.main` khi tải.

Ví dụ:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Mỗi mục danh sách cho phép theo dõi:

- **id** UUID ổn định dùng cho nhận diện UI (tùy chọn)
- **last used** timestamp
- **last used command**
- **last resolved path**

## Tự động cho phép CLI kỹ năng

Khi **Tự động cho phép CLI kỹ năng** được bật, các executable được tham chiếu bởi các kỹ năng đã biết được coi là đã được cho phép trên các node (macOS node hoặc node host không giao diện). Điều này sử dụng `skills.bins` qua Gateway RPC để lấy danh sách bin kỹ năng. Tắt tính năng này nếu bạn muốn danh sách cho phép thủ công nghiêm ngặt.

Ghi chú tin cậy quan trọng:

- Đây là một **danh sách cho phép tiện lợi ngầm**, tách biệt với các mục danh sách cho phép đường dẫn thủ công.
- Nó được thiết kế cho môi trường operator đáng tin cậy nơi Gateway và node nằm trong cùng một ranh giới tin cậy.
- Nếu bạn yêu cầu tin cậy rõ ràng nghiêm ngặt, giữ `autoAllowSkills: false` và chỉ sử dụng các mục danh sách cho phép đường dẫn thủ công.

## Safe bins (chỉ stdin)

`tools.exec.safeBins` định nghĩa một danh sách nhỏ các binary **chỉ stdin** (ví dụ `jq`) có thể chạy trong chế độ danh sách cho phép **mà không cần** các mục danh sách cho phép rõ ràng. Safe bins từ chối các đối số file vị trí và token giống đường dẫn, vì vậy chúng chỉ có thể hoạt động trên luồng đầu vào. Xem đây là một đường dẫn nhanh hẹp cho các bộ lọc luồng, không phải là một danh sách tin cậy chung. **Không** thêm các binary interpreter hoặc runtime (ví dụ `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) vào `safeBins`. Nếu một lệnh có thể đánh giá mã, thực thi các lệnh con, hoặc đọc file theo thiết kế, hãy ưu tiên các mục danh sách cho phép rõ ràng và giữ các nhắc nhở phê duyệt được bật. Các safe bins tùy chỉnh phải định nghĩa một hồ sơ rõ ràng trong `tools.exec.safeBinProfiles.<bin>`. Việc xác thực là xác định từ hình dạng argv chỉ (không kiểm tra sự tồn tại của hệ thống file host), điều này ngăn chặn hành vi oracle sự tồn tại file từ sự khác biệt cho phép/từ chối. Các tùy chọn hướng file bị từ chối cho các safe bins mặc định (ví dụ `sort -o`, `sort --output`, `sort --files0-from`, `sort --compress-program`, `sort --random-source`, `sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`, `grep -f/--file`). Safe bins cũng thực thi chính sách cờ rõ ràng cho từng binary cho các tùy chọn phá vỡ hành vi chỉ stdin (ví dụ `sort -o/--output/--compress-program` và các cờ đệ quy grep). Các tùy chọn dài được xác thực đóng trong chế độ safe-bin: các cờ không xác định và các viết tắt mơ hồ bị từ chối. Các cờ bị từ chối theo hồ sơ safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Safe bins cũng buộc các token argv được coi là **văn bản gốc** tại thời điểm thực thi (không có globbing và không có mở rộng `$VARS`) cho các đoạn chỉ stdin, vì vậy các mẫu như `*` hoặc `$HOME/...` không thể được sử dụng để lén đọc file. Safe bins cũng phải được giải quyết từ các thư mục binary đáng tin cậy (mặc định hệ thống cộng với tùy chọn `tools.exec.safeBinTrustedDirs`). Các mục `PATH` không bao giờ được tự động tin cậy. Các thư mục safe-bin đáng tin cậy mặc định được giữ tối thiểu: `/bin`, `/usr/bin`. Nếu executable safe-bin của bạn nằm trong các đường dẫn package-manager/user (ví dụ `/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), thêm chúng rõ ràng vào `tools.exec.safeBinTrustedDirs`. Chuỗi shell và chuyển hướng không được tự động cho phép trong chế độ danh sách cho phép.

Chuỗi shell (`&&`, `||`, `;`) được cho phép khi mọi đoạn cấp cao nhất thỏa mãn danh sách cho phép (bao gồm safe bins hoặc tự động cho phép kỹ năng). Chuyển hướng vẫn không được hỗ trợ trong chế độ danh sách cho phép. Thay thế lệnh (`$()` / backticks) bị từ chối trong quá trình phân tích danh sách cho phép, bao gồm cả bên trong dấu ngoặc kép; sử dụng dấu ngoặc đơn nếu bạn cần văn bản `$()` gốc. Trên các phê duyệt ứng dụng đồng hành macOS, văn bản shell thô chứa cú pháp điều khiển hoặc mở rộng shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) được coi là một lần bỏ lỡ danh sách cho phép trừ khi chính binary shell được cho phép. Đối với các trình bao bọc shell (`bash|sh|zsh ... -c/-lc`), các ghi đè env theo phạm vi yêu cầu được giảm xuống một danh sách cho phép rõ ràng nhỏ (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`). Đối với các quyết định cho phép luôn trong chế độ danh sách cho phép, các trình bao bọc phân phối đã biết (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) duy trì các đường dẫn executable bên trong thay vì các đường dẫn trình bao bọc. Các bộ ghép shell (`busybox`, `toybox`) cũng được mở ra cho các applet shell (`sh`, `ash`, v.v.) để các executable bên trong được duy trì thay vì các binary bộ ghép. Nếu một trình bao bọc hoặc bộ ghép không thể được mở ra an toàn, không có mục danh sách cho phép nào được duy trì tự động.

Safe bins mặc định: `jq`, `cut`, `uniq`, `head`, `tail`, `tr`, `wc`.

`grep` và `sort` không nằm trong danh sách mặc định. Nếu bạn chọn tham gia, hãy giữ các mục danh sách cho phép rõ ràng cho các quy trình không chỉ stdin của chúng. Đối với `grep` trong chế độ safe-bin, cung cấp mẫu với `-e`/`--regexp`; dạng mẫu vị trí bị từ chối để các đối số file không thể được lén lút như các vị trí mơ hồ.

### Safe bins so với danh sách cho phép

| Chủ đề          | `tools.exec.safeBins`                                  | Danh sách cho phép (`exec-approvals.json`)                   |
| --------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Mục tiêu        | Tự động cho phép các bộ lọc stdin hẹp                  | Tin cậy rõ ràng các executable cụ thể                         |
| Loại khớp       | Tên executable + chính sách argv safe-bin              | Mẫu glob đường dẫn executable đã giải quyết                   |
| Phạm vi đối số  | Bị hạn chế bởi hồ sơ safe-bin và quy tắc token gốc     | Chỉ khớp đường dẫn; các đối số khác là trách nhiệm của bạn    |
| Ví dụ điển hình | `jq`, `head`, `tail`, `wc`                             | `python3`, `node`, `ffmpeg`, custom CLIs                     |
| Sử dụng tốt nhất| Chuyển đổi văn bản rủi ro thấp trong các pipeline      | Bất kỳ công cụ nào có hành vi rộng hơn hoặc tác động phụ     |

Vị trí cấu hình:

- `safeBins` đến từ cấu hình (`tools.exec.safeBins` hoặc mỗi agent `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` đến từ cấu hình (`tools.exec.safeBinTrustedDirs` hoặc mỗi agent `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` đến từ cấu hình (`tools.exec.safeBinProfiles` hoặc mỗi agent `agents.list[].tools.exec.safeBinProfiles`). Các khóa hồ sơ mỗi agent ghi đè các khóa toàn cầu.
- Các mục danh sách cho phép sống trong `~/.openclaw/exec-approvals.json` cục bộ host dưới `agents.<id>.allowlist` (hoặc qua Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` cảnh báo với `tools.exec.safe_bins_interpreter_unprofiled` khi các binary interpreter/runtime xuất hiện trong `safeBins` mà không có hồ sơ rõ ràng.
- `openclaw doctor --fix` có thể tạo khung các mục `safeBinProfiles.<bin>` tùy chỉnh bị thiếu dưới dạng `{}` (xem xét và thắt chặt sau đó). Các binary interpreter/runtime không được tự động tạo khung.

Ví dụ hồ sơ tùy chỉnh:

```json5
{
  tools: {
    exec: {
      safeBins: ["jq", "myfilter"],
      safeBinProfiles: {
        myfilter: {
          minPositional: 0,
          maxPositional: 0,
          allowedValueFlags: ["-n", "--limit"],
          deniedFlags: ["-f", "--file", "-c", "--command"],
        },
      },
    },
  },
}
```

## Chỉnh sửa Control UI

Sử dụng **Control UI → Nodes → Exec approvals** để chỉnh sửa mặc định, ghi đè mỗi agent và danh sách cho phép. Chọn phạm vi (Mặc định hoặc một agent), điều chỉnh chính sách, thêm/xóa các mẫu danh sách cho phép, sau đó **Lưu**. UI hiển thị metadata **last used** cho mỗi mẫu để bạn có thể giữ danh sách gọn gàng.

Bộ chọn mục tiêu chọn **Gateway** (phê duyệt cục bộ) hoặc một **Node**. Các node phải quảng cáo `system.execApprovals.get/set` (ứng dụng macOS hoặc node host không giao diện). Nếu một node chưa quảng cáo phê duyệt exec, chỉnh sửa trực tiếp `~/.openclaw/exec-approvals.json` cục bộ của nó.

CLI: `openclaw approvals` hỗ trợ chỉnh sửa gateway hoặc node (xem [Approvals CLI](/cli/approvals)).

## Luồng phê duyệt

Khi cần nhắc nhở, gateway phát `exec.approval.requested` đến các client operator. Control UI và ứng dụng macOS giải quyết nó qua `exec.approval.resolve`, sau đó gateway chuyển tiếp yêu cầu đã được phê duyệt đến node host.

Đối với `host=node`, yêu cầu phê duyệt bao gồm payload `systemRunPlan` chuẩn. Gateway sử dụng kế hoạch đó làm ngữ cảnh lệnh/cwd/session chính thức khi chuyển tiếp các yêu cầu `system.run` đã được phê duyệt.

## Lệnh interpreter/runtime

Các lần chạy interpreter/runtime được hỗ trợ phê duyệt được thiết kế bảo thủ:

- Ngữ cảnh argv/cwd/env chính xác luôn được ràng buộc.
- Các dạng script shell trực tiếp và file runtime trực tiếp được ràng buộc nỗ lực tốt nhất vào một snapshot file cục bộ cụ thể.
- Các dạng trình bao bọc package-manager phổ biến vẫn giải quyết thành một file cục bộ trực tiếp (ví dụ `pnpm exec`, `pnpm node`, `npm exec`, `npx`) được mở ra trước khi ràng buộc.
- Nếu OpenClaw không thể xác định chính xác một file cục bộ cho một lệnh interpreter/runtime (ví dụ script package, dạng eval, chuỗi loader runtime cụ thể, hoặc các dạng nhiều file mơ hồ), thực thi được hỗ trợ phê duyệt bị từ chối thay vì tuyên bố bao phủ ngữ nghĩa mà nó không có.
- Đối với các quy trình đó, ưu tiên sandboxing, một ranh giới host riêng biệt, hoặc một danh sách cho phép/tin cậy rõ ràng nơi operator chấp nhận ngữ nghĩa runtime rộng hơn.

Khi cần phê duyệt, công cụ exec trả về ngay lập tức với một id phê duyệt. Sử dụng id đó để liên kết các sự kiện hệ thống sau này (`Exec finished` / `Exec denied`). Nếu không có quyết định nào đến trước khi hết thời gian chờ, yêu cầu được coi là hết thời gian chờ phê duyệt và được hiển thị là lý do từ chối.

Hộp thoại xác nhận bao gồm:

- lệnh + args
- cwd
- agent id
- đường dẫn executable đã giải quyết
- host + metadata chính sách

Hành động:

- **Allow once** → chạy ngay
- **Always allow** → thêm vào danh sách cho phép + chạy
- **Deny** → chặn

## Chuyển tiếp phê duyệt đến các kênh chat

Có thể chuyển tiếp nhắc nhở phê duyệt exec đến bất kỳ kênh chat nào (bao gồm các kênh plugin) và phê duyệt chúng với `/approve`. Điều này sử dụng pipeline phân phối outbound thông thường.

Cấu hình:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session", // "session" | "targets" | "both"
      agentFilter: ["main"],
      sessionFilter: ["discord"], // substring hoặc regex
      targets: [
        { channel: "slack", to: "U12345678" },
        { channel: "telegram", to: "123456789" },
      ],
    },
  },
}
```

Trả lời trong chat:

```
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

### Client phê duyệt chat tích hợp

Discord và Telegram cũng có thể hoạt động như các client phê duyệt exec rõ ràng với cấu hình kênh cụ thể.

- Discord: `channels.discord.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Các client này là tùy chọn. Nếu một kênh không có phê duyệt exec được bật, OpenClaw không coi kênh đó là một bề mặt phê duyệt chỉ vì cuộc trò chuyện diễn ra ở đó.

Hành vi chung:

- chỉ những người phê duyệt được cấu hình mới có thể phê duyệt hoặc từ chối
- người yêu cầu không cần phải là người phê duyệt
- khi phân phối kênh được bật, nhắc nhở phê duyệt bao gồm văn bản lệnh
- nếu không có UI operator hoặc client phê duyệt được cấu hình nào có thể chấp nhận yêu cầu, nhắc nhở sẽ quay lại `askFallback`

Telegram mặc định gửi đến DMs của người phê duyệt (`target: "dm"`). Có thể chuyển sang `channel` hoặc `both` khi muốn nhắc nhở phê duyệt xuất hiện trong cuộc trò chuyện/chủ đề Telegram gốc. Đối với các chủ đề diễn đàn Telegram, OpenClaw giữ nguyên chủ đề cho nhắc nhở phê duyệt và theo dõi sau phê duyệt.

Xem thêm:

- [Discord](/channels/discord#exec-approvals-in-discord)
- [Telegram](/channels/telegram#exec-approvals-in-telegram)

### Luồng IPC macOS

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + approvals + system.run)
```

Ghi chú bảo mật:

- Chế độ socket Unix `0600`, token được lưu trong `exec-approvals.json`.
- Kiểm tra peer cùng UID.
- Thách thức/đáp ứng (nonce + HMAC token + hash yêu cầu) + TTL ngắn.

## Sự kiện hệ thống

Vòng đời Exec được hiển thị dưới dạng thông báo hệ thống:

- `Exec running` (chỉ khi lệnh vượt quá ngưỡng thông báo đang chạy)
- `Exec finished`
- `Exec denied`

Những thông báo này được gửi đến session của agent sau khi node báo cáo sự kiện. Phê duyệt exec trên host gateway phát ra các sự kiện vòng đời tương tự khi lệnh kết thúc (và tùy chọn khi chạy lâu hơn ngưỡng). Các exec được bảo vệ phê duyệt tái sử dụng id phê duyệt làm `runId` trong các thông báo này để dễ dàng liên kết.

## Tác động

- **full** rất mạnh mẽ; ưu tiên danh sách cho phép khi có thể.
- **ask** giữ bạn trong vòng lặp trong khi vẫn cho phép phê duyệt nhanh.
- Danh sách cho phép mỗi agent ngăn chặn phê duyệt của một agent rò rỉ sang agent khác.
- Phê duyệt chỉ áp dụng cho các yêu cầu exec trên host từ **người gửi được ủy quyền**. Người gửi không được ủy quyền không thể phát hành `/exec`.
- `/exec security=full` là một tiện ích cấp session cho các operator được ủy quyền và bỏ qua phê duyệt theo thiết kế. Để chặn exec trên host, đặt bảo mật phê duyệt thành `deny` hoặc từ chối công cụ `exec` qua chính sách công cụ.

Liên quan:

- [Công cụ Exec](/tools/exec)
- [Chế độ nâng cao](/tools/elevated)
- [Kỹ năng](/tools/skills)\n
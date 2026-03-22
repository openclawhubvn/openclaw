---
summary: "Tìm hiểu cách phê duyệt thực thi, quản lý danh sách cho phép và yêu cầu thoát sandbox hiệu quả với OpenClaw."
read_when:
  - Cấu hình phê duyệt thực thi hoặc danh sách cho phép
  - Triển khai UX phê duyệt thực thi trong ứng dụng macOS
  - Xem xét các yêu cầu thoát sandbox và tác động
title: "Hướng Dẫn Phê Duyệt Thực Thi OpenClaw"
---

# Phê Duyệt Thực Thi

Phê duyệt thực thi là **hàng rào bảo vệ cho ứng dụng đồng hành / máy chủ node** để cho phép một agent bị sandbox chạy lệnh trên máy chủ thực (`gateway` hoặc `node`). Hãy nghĩ về nó như một khóa an toàn: lệnh chỉ được phép khi chính sách + danh sách cho phép + (tùy chọn) phê duyệt của người dùng đều đồng ý. Phê duyệt thực thi là **bổ sung** cho chính sách công cụ và kiểm soát nâng cao (trừ khi chế độ nâng cao được đặt là `full`, bỏ qua phê duyệt). Chính sách hiệu quả là **nghiêm ngặt hơn** giữa `tools.exec.*` và mặc định phê duyệt; nếu một trường phê duyệt bị bỏ qua, giá trị `tools.exec` sẽ được sử dụng.

Nếu giao diện ứng dụng đồng hành **không khả dụng**, bất kỳ yêu cầu nào cần nhắc nhở sẽ được giải quyết bằng **hỏi dự phòng** (mặc định: từ chối).

## Áp Dụng Ở Đâu

Phê duyệt thực thi được thực thi cục bộ trên máy chủ thực thi:

- **máy chủ gateway** → quá trình `openclaw` trên máy gateway
- **máy chủ node** → node runner (ứng dụng đồng hành macOS hoặc máy chủ node không giao diện)

Ghi chú mô hình tin cậy:

- Người gọi được xác thực qua Gateway là các nhà vận hành đáng tin cậy cho Gateway đó.
- Các node được ghép nối mở rộng khả năng vận hành đáng tin cậy đó lên máy chủ node.
- Phê duyệt thực thi giảm rủi ro thực thi ngẫu nhiên, nhưng không phải là ranh giới xác thực từng người dùng.
- Các lần chạy trên máy chủ node được phê duyệt ràng buộc ngữ cảnh thực thi chuẩn: cwd chuẩn, argv chính xác, ràng buộc môi trường khi có, và đường dẫn thực thi cố định khi áp dụng.
- Đối với các script shell và các lệnh gọi trực tiếp file interpreter/runtime, OpenClaw cũng cố gắng ràng buộc một file cục bộ cụ thể. Nếu file đó thay đổi sau khi phê duyệt nhưng trước khi thực thi, lần chạy sẽ bị từ chối thay vì thực thi nội dung đã thay đổi.
- Ràng buộc file này được thực hiện với nỗ lực tốt nhất, không phải là mô hình ngữ nghĩa hoàn chỉnh của mọi đường dẫn loader interpreter/runtime. Nếu chế độ phê duyệt không thể xác định chính xác một file cục bộ cụ thể để ràng buộc, nó từ chối tạo một lần chạy được hỗ trợ phê duyệt thay vì giả vờ bao phủ hoàn toàn.

Phân chia macOS:

- **dịch vụ máy chủ node** chuyển tiếp `system.run` đến **ứng dụng macOS** qua IPC cục bộ.
- **ứng dụng macOS** thực thi phê duyệt + thực thi lệnh trong ngữ cảnh giao diện người dùng.

## Cài Đặt và Lưu Trữ

Phê duyệt được lưu trong một file JSON cục bộ trên máy chủ thực thi:

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

## Các Tùy Chọn Chính Sách

### Bảo Mật (`exec.security`)

- **deny**: chặn tất cả các yêu cầu thực thi trên máy chủ.
- **allowlist**: chỉ cho phép các lệnh trong danh sách cho phép.
- **full**: cho phép mọi thứ (tương đương với chế độ nâng cao).

### Hỏi (`exec.ask`)

- **off**: không bao giờ nhắc nhở.
- **on-miss**: chỉ nhắc nhở khi danh sách cho phép không khớp.
- **always**: nhắc nhở trên mọi lệnh.

### Hỏi Dự Phòng (`askFallback`)

Nếu cần nhắc nhở nhưng không có giao diện người dùng nào có thể truy cập, dự phòng quyết định:

- **deny**: chặn.
- **allowlist**: chỉ cho phép nếu danh sách cho phép khớp.
- **full**: cho phép.

## Danh Sách Cho Phép (theo agent)

Danh sách cho phép là **theo agent**. Nếu có nhiều agent, chuyển đổi agent bạn đang chỉnh sửa trong ứng dụng macOS. Các mẫu là **khớp glob không phân biệt chữ hoa chữ thường**. Các mẫu nên giải quyết thành **đường dẫn nhị phân** (các mục chỉ có tên cơ sở bị bỏ qua). Các mục `agents.default` cũ được chuyển sang `agents.main` khi tải.

Ví dụ:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Mỗi mục trong danh sách cho phép theo dõi:

- **id** UUID ổn định dùng cho nhận diện giao diện người dùng (tùy chọn)
- **lần sử dụng cuối** dấu thời gian
- **lệnh sử dụng cuối**
- **đường dẫn giải quyết cuối**

## Tự Động Cho Phép CLI Kỹ Năng

Khi **Tự động cho phép CLI kỹ năng** được bật, các thực thi được tham chiếu bởi các kỹ năng đã biết được coi là đã có trong danh sách cho phép trên các node (node macOS hoặc máy chủ node không giao diện). Điều này sử dụng `skills.bins` qua Gateway RPC để lấy danh sách bin kỹ năng. Tắt tính năng này nếu bạn muốn danh sách cho phép thủ công nghiêm ngặt.

Ghi chú tin cậy quan trọng:

- Đây là một **danh sách cho phép tiện lợi ngầm**, tách biệt với các mục danh sách cho phép đường dẫn thủ công.
- Nó được dự định cho các môi trường vận hành đáng tin cậy nơi Gateway và node nằm trong cùng một ranh giới tin cậy.
- Nếu bạn yêu cầu sự tin cậy rõ ràng nghiêm ngặt, giữ `autoAllowSkills: false` và chỉ sử dụng các mục danh sách cho phép đường dẫn thủ công.

## Bins An Toàn (chỉ stdin)

`tools.exec.safeBins` định nghĩa một danh sách nhỏ các nhị phân **chỉ stdin** (ví dụ `jq`) có thể chạy trong chế độ danh sách cho phép **mà không cần** các mục danh sách cho phép rõ ràng. Các bins an toàn từ chối các đối số file vị trí và các token giống đường dẫn, vì vậy chúng chỉ có thể hoạt động trên luồng đầu vào. Xem đây là một đường dẫn nhanh hẹp cho các bộ lọc luồng, không phải là một danh sách tin cậy chung. **Không** thêm các nhị phân interpreter hoặc runtime (ví dụ `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) vào `safeBins`. Nếu một lệnh có thể đánh giá mã, thực thi các lệnh con, hoặc đọc file theo thiết kế, hãy ưu tiên các mục danh sách cho phép rõ ràng và giữ các nhắc nhở phê duyệt được bật. Các bins an toàn tùy chỉnh phải định nghĩa một hồ sơ rõ ràng trong `tools.exec.safeBinProfiles.<bin>`. Việc xác thực là xác định từ hình dạng argv chỉ (không có kiểm tra sự tồn tại của hệ thống file máy chủ), điều này ngăn chặn hành vi oracle sự tồn tại của file từ sự khác biệt cho phép/từ chối. Các tùy chọn hướng file bị từ chối cho các bins an toàn mặc định (ví dụ `sort -o`, `sort --output`, `sort --files0-from`, `sort --compress-program`, `sort --random-source`, `sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`, `grep -f/--file`). Các bins an toàn cũng thực thi chính sách cờ rõ ràng cho từng nhị phân cho các tùy chọn phá vỡ hành vi chỉ stdin (ví dụ `sort -o/--output/--compress-program` và các cờ đệ quy grep). Các tùy chọn dài được xác thực đóng kín trong chế độ bin an toàn: các cờ không xác định và các viết tắt mơ hồ bị từ chối. Các cờ bị từ chối theo hồ sơ bin an toàn:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Các bins an toàn cũng buộc các token argv được coi là **văn bản gốc** tại thời điểm thực thi (không có globbing và không có mở rộng `$VARS`) cho các đoạn chỉ stdin, vì vậy các mẫu như `*` hoặc `$HOME/...` không thể được sử dụng để lén lút đọc file. Các bins an toàn cũng phải giải quyết từ các thư mục nhị phân đáng tin cậy (mặc định hệ thống cộng với tùy chọn `tools.exec.safeBinTrustedDirs`). Các mục `PATH` không bao giờ được tự động tin cậy. Các thư mục bin an toàn đáng tin cậy mặc định được giữ tối thiểu: `/bin`, `/usr/bin`. Nếu thực thi bin an toàn của bạn nằm trong các đường dẫn quản lý gói/người dùng (ví dụ `/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), hãy thêm chúng rõ ràng vào `tools.exec.safeBinTrustedDirs`. Chuỗi shell và chuyển hướng không được tự động cho phép trong chế độ danh sách cho phép.

Chuỗi shell (`&&`, `||`, `;`) được cho phép khi mọi đoạn cấp cao nhất thỏa mãn danh sách cho phép (bao gồm các bins an toàn hoặc tự động cho phép kỹ năng). Chuyển hướng vẫn không được hỗ trợ trong chế độ danh sách cho phép. Thay thế lệnh (`$()` / backticks) bị từ chối trong quá trình phân tích danh sách cho phép, bao gồm cả bên trong dấu ngoặc kép; sử dụng dấu ngoặc đơn nếu bạn cần văn bản `$()` gốc. Trên các phê duyệt ứng dụng đồng hành macOS, văn bản shell thô chứa cú pháp điều khiển hoặc mở rộng shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) được coi là một lần bỏ lỡ danh sách cho phép trừ khi chính nhị phân shell được cho phép. Đối với các trình bao bọc shell (`bash|sh|zsh ... -c/-lc`), các ghi đè môi trường theo phạm vi yêu cầu được giảm xuống một danh sách cho phép rõ ràng nhỏ (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`). Đối với các quyết định cho phép luôn trong chế độ danh sách cho phép, các trình bao bọc phân phối đã biết (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) duy trì các đường dẫn thực thi bên trong thay vì các đường dẫn trình bao bọc. Các bộ ghép shell (`busybox`, `toybox`) cũng được mở ra cho các applet shell (`sh`, `ash`, v.v.) để các thực thi bên trong được duy trì thay vì các nhị phân bộ ghép. Nếu một trình bao bọc hoặc bộ ghép không thể được mở ra an toàn, không có mục danh sách cho phép nào được duy trì tự động.

Các bins an toàn mặc định: `jq`, `cut`, `uniq`, `head`, `tail`, `tr`, `wc`.

`grep` và `sort` không có trong danh sách mặc định. Nếu bạn chọn tham gia, hãy giữ các mục danh sách cho phép rõ ràng cho các quy trình không stdin của chúng. Đối với `grep` trong chế độ bin an toàn, cung cấp mẫu với `-e`/`--regexp`; dạng mẫu vị trí bị từ chối để các toán hạng file không thể được lén lút như các vị trí mơ hồ.

### Bins An Toàn So Với Danh Sách Cho Phép

| Chủ đề          | `tools.exec.safeBins`                                  | Danh sách cho phép (`exec-approvals.json`)                   |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Mục tiêu         | Tự động cho phép các bộ lọc stdin hẹp                 | Tin tưởng rõ ràng các thực thi cụ thể                        |
| Loại khớp        | Tên thực thi + chính sách argv bin an toàn            | Mẫu glob đường dẫn thực thi đã giải quyết                    |
| Phạm vi đối số   | Bị hạn chế bởi hồ sơ bin an toàn và quy tắc token gốc  | Chỉ khớp đường dẫn; các đối số khác là trách nhiệm của bạn   |
| Ví dụ điển hình  | `jq`, `head`, `tail`, `wc`                             | `python3`, `node`, `ffmpeg`, CLI tùy chỉnh                   |
| Sử dụng tốt nhất | Chuyển đổi văn bản rủi ro thấp trong các pipeline     | Bất kỳ công cụ nào có hành vi rộng hơn hoặc tác động phụ     |

Vị trí cấu hình:

- `safeBins` đến từ cấu hình (`tools.exec.safeBins` hoặc theo agent `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` đến từ cấu hình (`tools.exec.safeBinTrustedDirs` hoặc theo agent `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` đến từ cấu hình (`tools.exec.safeBinProfiles` hoặc theo agent `agents.list[].tools.exec.safeBinProfiles`). Các khóa hồ sơ theo agent ghi đè các khóa toàn cầu.
- Các mục danh sách cho phép nằm trong `~/.openclaw/exec-approvals.json` cục bộ máy chủ dưới `agents.<id>.allowlist` (hoặc qua giao diện điều khiển / `openclaw approvals allowlist ...`).
- `openclaw security audit` cảnh báo với `tools.exec.safe_bins_interpreter_unprofiled` khi các nhị phân interpreter/runtime xuất hiện trong `safeBins` mà không có hồ sơ rõ ràng.
- `openclaw doctor --fix` có thể tạo khung các mục `safeBinProfiles.<bin>` tùy chỉnh bị thiếu dưới dạng `{}` (xem xét và thắt chặt sau đó). Các nhị phân interpreter/runtime không được tự động tạo khung.

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

## Chỉnh Sửa Giao Diện Điều Khiển

Sử dụng thẻ **Control UI → Nodes → Exec approvals** để chỉnh sửa mặc định, ghi đè theo agent và danh sách cho phép. Chọn phạm vi (Mặc định hoặc một agent), điều chỉnh chính sách, thêm/xóa các mẫu danh sách cho phép, sau đó **Lưu**. Giao diện hiển thị siêu dữ liệu **lần sử dụng cuối** cho mỗi mẫu để bạn có thể giữ danh sách gọn gàng.

Bộ chọn mục tiêu chọn **Gateway** (phê duyệt cục bộ) hoặc một **Node**. Các node phải quảng cáo `system.execApprovals.get/set` (ứng dụng macOS hoặc máy chủ node không giao diện). Nếu một node chưa quảng cáo phê duyệt thực thi, hãy chỉnh sửa trực tiếp `~/.openclaw/exec-approvals.json` cục bộ của nó.

CLI: `openclaw approvals` hỗ trợ chỉnh sửa gateway hoặc node (xem [CLI Phê Duyệt](/cli/approvals)).

## Luồng Phê Duyệt

Khi cần nhắc nhở, gateway phát `exec.approval.requested` đến các khách hàng vận hành. Giao diện điều khiển và ứng dụng macOS giải quyết nó qua `exec.approval.resolve`, sau đó gateway chuyển tiếp yêu cầu đã được phê duyệt đến máy chủ node.

Đối với `host=node`, các yêu cầu phê duyệt bao gồm payload `systemRunPlan` chuẩn. Gateway sử dụng kế hoạch đó làm ngữ cảnh lệnh/cwd/phiên chuẩn khi chuyển tiếp các yêu cầu `system.run` đã được phê duyệt.

## Lệnh Interpreter/Runtime

Các lần chạy interpreter/runtime được hỗ trợ phê duyệt được thực hiện một cách bảo thủ:

- Ngữ cảnh argv/cwd/env chính xác luôn được ràng buộc.
- Các script shell trực tiếp và các dạng file runtime trực tiếp được ràng buộc với nỗ lực tốt nhất vào một snapshot file cục bộ cụ thể.
- Các dạng trình bao bọc quản lý gói thông thường vẫn giải quyết thành một file cục bộ trực tiếp (ví dụ `pnpm exec`, `pnpm node`, `npm exec`, `npx`) được mở ra trước khi ràng buộc.
- Nếu OpenClaw không thể xác định chính xác một file cục bộ cụ thể cho một lệnh interpreter/runtime (ví dụ các script gói, các dạng eval, các chuỗi loader cụ thể runtime, hoặc các dạng đa file mơ hồ), thực thi được hỗ trợ phê duyệt bị từ chối thay vì tuyên bố bao phủ ngữ nghĩa mà nó không có.
- Đối với các quy trình đó, ưu tiên sandboxing, một ranh giới máy chủ riêng biệt, hoặc một danh sách cho phép tin cậy rõ ràng / quy trình đầy đủ nơi nhà vận hành chấp nhận các ngữ nghĩa runtime rộng hơn.

Khi cần phê duyệt, công cụ thực thi trả về ngay lập tức với một id phê duyệt. Sử dụng id đó để liên kết các sự kiện hệ thống sau này (`Exec finished` / `Exec denied`). Nếu không có quyết định nào đến trước khi hết thời gian, yêu cầu được coi là hết thời gian phê duyệt và được hiển thị là lý do từ chối.

Hộp thoại xác nhận bao gồm:

- lệnh + args
- cwd
- id agent
- đường dẫn thực thi đã giải quyết
- máy chủ + siêu dữ liệu chính sách

Hành động:

- **Cho phép một lần** → chạy ngay
- **Luôn cho phép** → thêm vào danh sách cho phép + chạy
- **Từ chối** → chặn

## Chuyển Tiếp Phê Duyệt Đến Các Kênh Chat

Bạn có thể chuyển tiếp các yêu cầu phê duyệt thực thi đến bất kỳ kênh chat nào (bao gồm các kênh plugin) và phê duyệt chúng với `/approve`. Điều này sử dụng pipeline phân phối outbound thông thường.

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

### Khách Hàng Phê Duyệt Chat Tích Hợp

Discord và Telegram cũng có thể hoạt động như các khách hàng phê duyệt thực thi rõ ràng với cấu hình kênh cụ thể.

- Discord: `channels.discord.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Các khách hàng này là tùy chọn. Nếu một kênh không có phê duyệt thực thi được bật, OpenClaw không coi kênh đó là một bề mặt phê duyệt chỉ vì cuộc trò chuyện diễn ra ở đó.

Hành vi chia sẻ:

- chỉ những người phê duyệt được cấu hình mới có thể phê duyệt hoặc từ chối
- người yêu cầu không cần phải là người phê duyệt
- khi phân phối kênh được bật, các yêu cầu phê duyệt bao gồm văn bản lệnh
- nếu không có giao diện người dùng vận hành hoặc khách hàng phê duyệt được cấu hình nào có thể chấp nhận yêu cầu, nhắc nhở sẽ quay lại `askFallback`

Telegram mặc định gửi tin nhắn cho người phê duyệt (`target: "dm"`). Bạn có thể chuyển sang `channel` hoặc `both` khi bạn muốn các yêu cầu phê duyệt xuất hiện trong cuộc trò chuyện/topic Telegram gốc. Đối với các topic diễn đàn Telegram, OpenClaw giữ nguyên topic cho yêu cầu phê duyệt và theo dõi sau phê duyệt.

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

- Chế độ socket Unix `0600`, token được lưu trữ trong `exec-approvals.json`.
- Kiểm tra peer cùng UID.
- Thử thách/đáp ứng (nonce + token HMAC + hash yêu cầu) + TTL ngắn.

## Sự Kiện Hệ Thống

Vòng đời thực thi được hiển thị dưới dạng thông điệp hệ thống:

- `Exec running` (chỉ khi lệnh vượt quá ngưỡng thông báo đang chạy)
- `Exec finished`
- `Exec denied`

Những thông điệp này được gửi đến phiên của agent sau khi node báo cáo sự kiện. Các phê duyệt thực thi trên máy chủ Gateway phát ra các sự kiện vòng đời tương tự khi lệnh kết thúc (và tùy chọn khi chạy lâu hơn ngưỡng). Các thực thi được bảo vệ phê duyệt tái sử dụng id phê duyệt làm `runId` trong các thông điệp này để dễ dàng liên kết.

## Tác Động

- **full** rất mạnh mẽ; ưu tiên danh sách cho phép khi có thể.
- **ask** giữ bạn trong vòng lặp trong khi vẫn cho phép phê duyệt nhanh.
- Danh sách cho phép theo agent ngăn chặn các phê duyệt của một agent rò rỉ sang các agent khác.
- Phê duyệt chỉ áp dụng cho các yêu cầu thực thi trên máy chủ từ **người gửi được ủy quyền**. Người gửi không được ủy quyền không thể phát hành `/exec`.
- `/exec security=full` là một tiện ích cấp phiên cho các nhà vận hành được ủy quyền và bỏ qua phê duyệt theo thiết kế. Để chặn thực thi trên máy chủ, đặt bảo mật phê duyệt thành `deny` hoặc từ chối công cụ `exec` qua chính sách công cụ.

Liên quan:

- [Công cụ Exec](/tools/exec)
- [Chế độ Nâng Cao](/tools/elevated)
- [Kỹ Năng](/tools/skills)

---
summary: "Trạng thái hỗ trợ Matrix, thiết lập và ví dụ cấu hình"
read_when:
  - Thiết lập Matrix trong OpenClaw
  - Cấu hình Matrix E2EE và xác minh
title: "Matrix"
---

# Matrix (plugin)

Matrix là plugin kênh Matrix cho OpenClaw. Sử dụng `matrix-js-sdk` chính thức, hỗ trợ DMs, rooms, threads, media, reactions, polls, location, và E2EE.

## Plugin cần thiết

Matrix là plugin, không đi kèm với OpenClaw core.

Cài từ npm:

```bash
openclaw plugins install @openclaw/matrix
```

Cài từ local checkout:

```bash
openclaw plugins install ./extensions/matrix
```

Xem [Plugins](/tools/plugin) để biết hành vi và quy tắc cài đặt plugin.

## Thiết lập

1. Cài plugin.
2. Tạo tài khoản Matrix trên homeserver.
3. Cấu hình `channels.matrix` với:
   - `homeserver` + `accessToken`, hoặc
   - `homeserver` + `userId` + `password`.
4. Khởi động lại gateway.
5. Bắt đầu DM với bot hoặc mời bot vào room.

Thiết lập tương tác:

```bash
openclaw channels add
openclaw configure --section channels
```

Matrix wizard yêu cầu:

- URL homeserver
- Phương thức xác thực: access token hoặc password
- user ID khi chọn xác thực bằng password
- Tên thiết bị tùy chọn
- Có bật E2EE không
- Có cấu hình truy cập room Matrix không

Hành vi wizard quan trọng:

- Nếu biến môi trường Matrix auth đã tồn tại cho tài khoản đã chọn, và tài khoản đó chưa có auth lưu trong config, wizard cung cấp shortcut env và chỉ ghi `enabled: true` cho tài khoản đó.
- Khi thêm tài khoản Matrix khác, tên tài khoản nhập vào được chuẩn hóa thành account ID dùng trong config và env vars. Ví dụ, `Ops Bot` thành `ops-bot`.
- DM allowlist chấp nhận giá trị đầy đủ `@user:server` ngay lập tức. Tên hiển thị chỉ hoạt động khi tra cứu thư mục trực tiếp tìm thấy một kết quả chính xác; nếu không, wizard yêu cầu thử lại với ID Matrix đầy đủ.
- Room allowlist chấp nhận room IDs và aliases trực tiếp. Có thể giải quyết tên room đã tham gia trực tiếp, nhưng tên không giải quyết được chỉ được giữ lại như đã nhập trong quá trình thiết lập và bị bỏ qua sau đó bởi runtime allowlist resolution. Nên dùng `!room:server` hoặc `#alias:server`.
- Danh tính room/session runtime sử dụng ID room Matrix ổn định. Aliases khai báo room chỉ được dùng làm đầu vào tra cứu, không phải là khóa session dài hạn hoặc danh tính nhóm ổn định.
- Để giải quyết tên room trước khi lưu, dùng `openclaw channels resolve --channel matrix "Project Room"`.

Thiết lập tối thiểu dựa trên token:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

Thiết lập dựa trên password (token được cache sau khi đăng nhập):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

Matrix lưu trữ thông tin xác thực đã cache trong `~/.openclaw/credentials/matrix/`.
Tài khoản mặc định dùng `credentials.json`; tài khoản có tên dùng `credentials-<account>.json`.

Tương đương biến môi trường (dùng khi khóa config không được đặt):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Với tài khoản không mặc định, dùng env vars theo phạm vi tài khoản:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

Ví dụ cho tài khoản `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

Với ID tài khoản chuẩn hóa `ops-bot`, dùng:

- `MATRIX_OPS_BOT_HOMESERVER`
- `MATRIX_OPS_BOT_ACCESS_TOKEN`

Wizard tương tác chỉ cung cấp shortcut env-var khi các biến môi trường auth đã có và tài khoản đã chọn chưa có Matrix auth lưu trong config.

## Ví dụ cấu hình

Cấu hình cơ bản thực tế với DM pairing, room allowlist, và E2EE bật:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
    },
  },
}
```

## Thiết lập E2EE

## Bot to bot rooms

Mặc định, OpenClaw bỏ qua tin nhắn Matrix từ các tài khoản Matrix OpenClaw khác đã cấu hình.

Dùng `allowBots` khi muốn giao tiếp Matrix giữa các agent:

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true` chấp nhận tin nhắn từ các tài khoản bot Matrix khác đã cấu hình trong các room và DMs được phép.
- `allowBots: "mentions"` chỉ chấp nhận tin nhắn khi có đề cập rõ ràng đến bot này trong room. DMs vẫn được phép.
- `groups.<room>.allowBots` ghi đè cài đặt cấp tài khoản cho một room.
- OpenClaw vẫn bỏ qua tin nhắn từ cùng một Matrix user ID để tránh vòng lặp tự trả lời.
- Matrix không có cờ bot gốc ở đây; OpenClaw coi "bot-authored" là "gửi bởi tài khoản Matrix khác đã cấu hình trên gateway OpenClaw này".

Dùng allowlist room nghiêm ngặt và yêu cầu đề cập khi bật giao tiếp bot-to-bot trong các room chia sẻ.

Bật mã hóa:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

Kiểm tra trạng thái xác minh:

```bash
openclaw matrix verify status
```

Trạng thái chi tiết (chẩn đoán đầy đủ):

```bash
openclaw matrix verify status --verbose
```

Bao gồm khóa khôi phục đã lưu trong đầu ra có thể đọc bằng máy:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Khởi tạo cross-signing và trạng thái xác minh:

```bash
openclaw matrix verify bootstrap
```

Hỗ trợ nhiều tài khoản: dùng `channels.matrix.accounts` với thông tin xác thực từng tài khoản và `name` tùy chọn. Xem [Configuration reference](/gateway/configuration-reference#multi-account-all-channels) cho mẫu chia sẻ.

Chẩn đoán bootstrap chi tiết:

```bash
openclaw matrix verify bootstrap --verbose
```

Buộc đặt lại danh tính cross-signing mới trước khi bootstrap:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Xác minh thiết bị này với khóa khôi phục:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Chi tiết xác minh thiết bị chi tiết:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Kiểm tra sức khỏe backup room-key:

```bash
openclaw matrix verify backup status
```

Chẩn đoán sức khỏe backup chi tiết:

```bash
openclaw matrix verify backup status --verbose
```

Khôi phục room keys từ server backup:

```bash
openclaw matrix verify backup restore
```

Chẩn đoán khôi phục chi tiết:

```bash
openclaw matrix verify backup restore --verbose
```

Xóa backup server hiện tại và tạo baseline backup mới:

```bash
openclaw matrix verify backup reset --yes
```

Tất cả lệnh `verify` đều ngắn gọn theo mặc định (bao gồm logging SDK nội bộ yên tĩnh) và chỉ hiển thị chẩn đoán chi tiết với `--verbose`.
Dùng `--json` cho đầu ra đầy đủ có thể đọc bằng máy khi scripting.

Trong thiết lập nhiều tài khoản, lệnh CLI Matrix sử dụng tài khoản Matrix mặc định ngầm định trừ khi bạn truyền `--account <id>`.
Nếu cấu hình nhiều tài khoản có tên, đặt `channels.matrix.defaultAccount` trước hoặc các thao tác CLI ngầm định sẽ dừng và yêu cầu bạn chọn tài khoản rõ ràng.
Dùng `--account` bất cứ khi nào bạn muốn xác minh hoặc thao tác thiết bị nhắm mục tiêu tài khoản có tên rõ ràng:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Khi mã hóa bị tắt hoặc không khả dụng cho tài khoản có tên, cảnh báo Matrix và lỗi xác minh chỉ ra khóa config của tài khoản đó, ví dụ `channels.matrix.accounts.assistant.encryption`.

### "Verified" nghĩa là gì

OpenClaw coi thiết bị Matrix này là đã xác minh chỉ khi nó được xác minh bởi danh tính cross-signing của bạn.
Trong thực tế, `openclaw matrix verify status --verbose` hiển thị ba tín hiệu tin cậy:

- `Locally trusted`: thiết bị này được tin cậy bởi client hiện tại
- `Cross-signing verified`: SDK báo cáo thiết bị đã được xác minh qua cross-signing
- `Signed by owner`: thiết bị được ký bởi khóa tự ký của bạn

`Verified by owner` trở thành `yes` chỉ khi có xác minh cross-signing hoặc ký bởi chủ sở hữu.
Tin cậy cục bộ tự nó không đủ để OpenClaw coi thiết bị là đã xác minh hoàn toàn.

### Bootstrap làm gì

`openclaw matrix verify bootstrap` là lệnh sửa chữa và thiết lập cho các tài khoản Matrix mã hóa.
Nó thực hiện tất cả các bước sau theo thứ tự:

- khởi tạo lưu trữ bí mật, tái sử dụng khóa khôi phục hiện có khi có thể
- khởi tạo cross-signing và tải lên các khóa cross-signing công khai bị thiếu
- cố gắng đánh dấu và cross-sign thiết bị hiện tại
- tạo backup room-key server-side mới nếu chưa có

Nếu homeserver yêu cầu xác thực tương tác để tải lên khóa cross-signing, OpenClaw thử tải lên mà không cần xác thực trước, sau đó với `m.login.dummy`, rồi với `m.login.password` khi `channels.matrix.password` được cấu hình.

Dùng `--force-reset-cross-signing` chỉ khi bạn muốn loại bỏ danh tính cross-signing hiện tại và tạo một cái mới.

Nếu bạn muốn loại bỏ backup room-key hiện tại và bắt đầu baseline backup mới cho các tin nhắn tương lai, dùng `openclaw matrix verify backup reset --yes`.
Chỉ làm điều này khi bạn chấp nhận rằng lịch sử mã hóa cũ không thể khôi phục sẽ không khả dụng.

### Baseline backup mới

Nếu bạn muốn giữ cho các tin nhắn mã hóa tương lai hoạt động và chấp nhận mất lịch sử cũ không thể khôi phục, chạy các lệnh này theo thứ tự:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Thêm `--account <id>` vào mỗi lệnh khi bạn muốn nhắm mục tiêu tài khoản Matrix có tên rõ ràng.

### Hành vi khởi động

Khi `encryption: true`, Matrix mặc định `startupVerification` là `"if-unverified"`.
Khi khởi động, nếu thiết bị này vẫn chưa được xác minh, Matrix sẽ yêu cầu tự xác minh trong client Matrix khác,
bỏ qua các yêu cầu trùng lặp trong khi một yêu cầu đã đang chờ xử lý, và áp dụng thời gian chờ cục bộ trước khi thử lại sau khi khởi động lại.
Các lần thử yêu cầu thất bại thử lại sớm hơn các lần tạo yêu cầu thành công theo mặc định.
Đặt `startupVerification: "off"` để tắt yêu cầu khởi động tự động, hoặc điều chỉnh `startupVerificationCooldownHours`
nếu bạn muốn cửa sổ thử lại ngắn hơn hoặc dài hơn.

Khởi động cũng thực hiện một lần bootstrap crypto bảo thủ tự động.
Lần đó cố gắng tái sử dụng lưu trữ bí mật hiện tại và danh tính cross-signing trước, và tránh đặt lại cross-signing trừ khi bạn chạy một luồng sửa chữa bootstrap rõ ràng.

Nếu khởi động tìm thấy trạng thái bootstrap bị hỏng và `channels.matrix.password` được cấu hình, OpenClaw có thể thử một đường sửa chữa nghiêm ngặt hơn.
Nếu thiết bị hiện tại đã được ký bởi chủ sở hữu, OpenClaw giữ lại danh tính đó thay vì tự động đặt lại.

Nâng cấp từ plugin Matrix công khai trước đó:

- OpenClaw tự động tái sử dụng cùng tài khoản Matrix, access token, và danh tính thiết bị khi có thể.
- Trước khi bất kỳ thay đổi di chuyển Matrix nào có thể thực hiện, OpenClaw tạo hoặc tái sử dụng một snapshot khôi phục dưới `~/Backups/openclaw-migrations/`.
- Nếu bạn sử dụng nhiều tài khoản Matrix, đặt `channels.matrix.defaultAccount` trước khi nâng cấp từ bố cục lưu trữ phẳng cũ để OpenClaw biết tài khoản nào nên nhận trạng thái kế thừa chia sẻ đó.
- Nếu plugin trước đó lưu trữ khóa giải mã backup room-key Matrix cục bộ, khởi động hoặc `openclaw doctor --fix` sẽ nhập nó vào luồng khóa khôi phục mới tự động.
- Nếu access token Matrix thay đổi sau khi di chuyển được chuẩn bị, khởi động bây giờ quét các gốc lưu trữ token-hash anh em cho trạng thái khôi phục kế thừa đang chờ trước khi từ bỏ khôi phục backup tự động.
- Nếu access token Matrix thay đổi sau đó cho cùng tài khoản, homeserver, và người dùng, OpenClaw bây giờ ưu tiên tái sử dụng gốc lưu trữ token-hash hiện có hoàn chỉnh nhất thay vì bắt đầu từ thư mục trạng thái Matrix trống.
- Vào lần khởi động gateway tiếp theo, các room keys đã backup được khôi phục tự động vào cửa hàng crypto mới.
- Nếu plugin cũ có các room keys chỉ cục bộ chưa bao giờ được backup, OpenClaw sẽ cảnh báo rõ ràng. Những khóa đó không thể xuất tự động từ cửa hàng crypto rust trước đó, vì vậy một số lịch sử mã hóa cũ có thể vẫn không khả dụng cho đến khi được khôi phục thủ công.
- Xem [Matrix migration](/install/migrating-matrix) cho luồng nâng cấp đầy đủ, giới hạn, lệnh khôi phục, và các thông báo di chuyển phổ biến.

Trạng thái runtime mã hóa được tổ chức dưới các gốc token-hash theo tài khoản, theo người dùng trong
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Thư mục đó chứa cửa hàng sync (`bot-storage.json`), cửa hàng crypto (`crypto/`),
tệp khóa khôi phục (`recovery-key.json`), snapshot IndexedDB (`crypto-idb-snapshot.json`),
ràng buộc thread (`thread-bindings.json`), và trạng thái xác minh khởi động (`startup-verification.json`)
khi các tính năng đó đang được sử dụng.
Khi token thay đổi nhưng danh tính tài khoản vẫn giữ nguyên, OpenClaw tái sử dụng gốc hiện có tốt nhất
cho tuple tài khoản/homeserver/user đó để trạng thái sync trước, trạng thái crypto, ràng buộc thread,
và trạng thái xác minh khởi động vẫn hiển thị.

### Mô hình cửa hàng crypto Node

Matrix E2EE trong plugin này sử dụng đường crypto Rust `matrix-js-sdk` chính thức trong Node.
Đường đó mong đợi sự tồn tại của IndexedDB khi bạn muốn trạng thái crypto tồn tại qua các lần khởi động lại.

Hiện tại OpenClaw cung cấp điều đó trong Node bằng cách:

- sử dụng `fake-indexeddb` làm API IndexedDB shim mà SDK mong đợi
- khôi phục nội dung IndexedDB Rust crypto từ `crypto-idb-snapshot.json` trước `initRustCrypto`
- lưu trữ nội dung IndexedDB đã cập nhật trở lại `crypto-idb-snapshot.json` sau khi khởi tạo và trong runtime

Đây là plumbing tương thích/lưu trữ, không phải là một triển khai crypto tùy chỉnh.
Tệp snapshot là trạng thái runtime nhạy cảm và được lưu trữ với quyền tệp hạn chế.
Dưới mô hình bảo mật của OpenClaw, máy chủ gateway và thư mục trạng thái cục bộ OpenClaw đã nằm trong ranh giới nhà điều hành tin cậy, vì vậy đây chủ yếu là một mối quan tâm về độ bền hoạt động hơn là một ranh giới tin cậy từ xa riêng biệt.

Cải tiến dự kiến:

- thêm hỗ trợ SecretRef cho vật liệu khóa Matrix bền vững để khóa khôi phục và các bí mật mã hóa cửa hàng liên quan có thể được lấy từ các nhà cung cấp bí mật OpenClaw thay vì chỉ từ các tệp cục bộ

## Thông báo xác minh tự động

Matrix hiện đăng thông báo vòng đời xác minh trực tiếp vào room xác minh DM nghiêm ngặt dưới dạng tin nhắn `m.notice`.
Bao gồm:

- thông báo yêu cầu xác minh
- thông báo sẵn sàng xác minh (với hướng dẫn "Verify by emoji" rõ ràng)
- thông báo bắt đầu và hoàn thành xác minh
- chi tiết SAS (emoji và số thập phân) khi có

Yêu cầu xác minh đến từ client Matrix khác được theo dõi và tự động chấp nhận bởi OpenClaw.
Đối với luồng tự xác minh, OpenClaw cũng tự động bắt đầu luồng SAS khi xác minh emoji có sẵn và xác nhận phía của nó.
Đối với yêu cầu xác minh từ người dùng/thiết bị Matrix khác, OpenClaw tự động chấp nhận yêu cầu và sau đó chờ luồng SAS tiến hành bình thường.
Bạn vẫn cần so sánh SAS emoji hoặc số thập phân trong client Matrix của mình và xác nhận "They match" ở đó để hoàn thành xác minh.

OpenClaw không tự động chấp nhận các luồng trùng lặp tự khởi tạo một cách mù quáng. Khởi động bỏ qua việc tạo yêu cầu mới khi một yêu cầu tự xác minh đã đang chờ xử lý.

Thông báo hệ thống/protocol xác minh không được chuyển tiếp đến pipeline chat agent, vì vậy chúng không tạo ra `NO_REPLY`.

### Vệ sinh thiết bị

Các thiết bị Matrix do OpenClaw quản lý cũ có thể tích lũy trên tài khoản và làm cho việc tin cậy room mã hóa khó hiểu hơn.
Liệt kê chúng với:

```bash
openclaw matrix devices list
```

Xóa các thiết bị do OpenClaw quản lý cũ với:

```bash
openclaw matrix devices prune-stale
```

### Sửa chữa Room Trực tiếp

Nếu trạng thái tin nhắn trực tiếp bị lệch, OpenClaw có thể kết thúc với các ánh xạ `m.direct` cũ chỉ vào các room solo cũ thay vì DM trực tiếp. Kiểm tra ánh xạ hiện tại cho một peer với:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Sửa chữa nó với:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Sửa chữa giữ logic cụ thể của Matrix bên trong plugin:

- nó ưu tiên một DM 1:1 nghiêm ngặt đã được ánh xạ trong `m.direct`
- nếu không, nó quay lại bất kỳ DM 1:1 nghiêm ngặt nào đã tham gia với người dùng đó
- nếu không có DM nào khỏe mạnh tồn tại, nó tạo một room trực tiếp mới và viết lại `m.direct` để chỉ vào nó

Luồng sửa chữa không tự động xóa các room cũ. Nó chỉ chọn DM khỏe mạnh và cập nhật ánh xạ để các gửi Matrix mới, thông báo xác minh, và các luồng tin nhắn trực tiếp khác nhắm mục tiêu đúng room lại.

## Threads

Matrix hỗ trợ threads Matrix gốc cho cả trả lời tự động và gửi công cụ tin nhắn.

- `threadReplies: "off"` giữ trả lời ở cấp cao nhất.
- `threadReplies: "inbound"` trả lời trong một thread chỉ khi tin nhắn đến đã ở trong thread đó.
- `threadReplies: "always"` giữ trả lời room trong một thread gốc tại tin nhắn kích hoạt.
- Tin nhắn thread đến bao gồm tin nhắn gốc thread như ngữ cảnh agent bổ sung.
- Gửi công cụ tin nhắn hiện tự động thừa kế thread Matrix hiện tại khi mục tiêu là cùng room, hoặc cùng mục tiêu người dùng DM, trừ khi có `threadId` rõ ràng.
- Ràng buộc thread runtime được hỗ trợ cho Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, và thread-bound `/acp spawn` hiện hoạt động trong các room và DMs Matrix.
- `/focus` room/DM Matrix cấp cao nhất tạo một thread Matrix mới và ràng buộc nó với session mục tiêu khi `threadBindings.spawnSubagentSessions=true`.
- Chạy `/focus` hoặc `/acp spawn --thread here` trong một thread Matrix hiện tại ràng buộc thread hiện tại đó thay thế.

### Cấu hình Ràng buộc Thread

Matrix thừa kế các mặc định toàn cầu từ `session.threadBindings`, và cũng hỗ trợ ghi đè theo kênh:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Cờ spawn ràng buộc thread Matrix là opt-in:

- Đặt `threadBindings.spawnSubagentSessions: true` để cho phép `/focus` cấp cao nhất tạo và ràng buộc các thread Matrix mới.
- Đặt `threadBindings.spawnAcpSessions: true` để cho phép `/acp spawn --thread auto|here` ràng buộc các session ACP với các thread Matrix.

## Reactions

Matrix hỗ trợ các hành động phản ứng outbound, thông báo phản ứng inbound, và phản ứng ack inbound.

- Công cụ phản ứng outbound được kiểm soát bởi `channels["matrix"].actions.reactions`.
- `react` thêm một phản ứng vào một sự kiện Matrix cụ thể.
- `reactions` liệt kê tóm tắt phản ứng hiện tại cho một sự kiện Matrix cụ thể.
- `emoji=""` xóa các phản ứng của tài khoản bot trên sự kiện đó.
- `remove: true` chỉ xóa phản ứng emoji được chỉ định từ tài khoản bot.

Phản ứng Ack sử dụng thứ tự giải quyết OpenClaw tiêu chuẩn:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- fallback emoji danh tính agent

Phạm vi phản ứng Ack giải quyết theo thứ tự này:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Chế độ thông báo phản ứng giải quyết theo thứ tự này:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- mặc định: `own`

Hành vi hiện tại:

- `reactionNotifications: "own"` chuyển tiếp các sự kiện `m.reaction` đã thêm khi chúng nhắm mục tiêu các tin nhắn Matrix do bot tạo ra.
- `reactionNotifications: "off"` tắt các sự kiện hệ thống phản ứng.
- Việc loại bỏ phản ứng vẫn chưa được tổng hợp thành các sự kiện hệ thống vì Matrix bề mặt chúng như các redactions, không phải là các loại bỏ `m.reaction` độc lập.

## Ví dụ chính sách DM và room

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Xem [Groups](/channels/groups) cho hành vi mention-gating và allowlist.

Ví dụ pairing cho Matrix DMs:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Nếu một người dùng Matrix chưa được phê duyệt tiếp tục nhắn tin trước khi phê duyệt, OpenClaw tái sử dụng cùng mã pairing đang chờ và có thể gửi lại một lời nhắc sau một thời gian chờ ngắn thay vì tạo mã mới.

Xem [Pairing](/channels/pairing) cho luồng pairing DM chia sẻ và bố cục lưu trữ.

## Ví dụ nhiều tài khoản

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
          },
        },
      },
    },
  },
}
```

Các giá trị `channels.matrix` cấp cao nhất hoạt động như mặc định cho các tài khoản có tên trừ khi một tài khoản ghi đè chúng.
Đặt `defaultAccount` khi bạn muốn OpenClaw ưu tiên một tài khoản Matrix có tên cho định tuyến ngầm định, thăm dò, và các thao tác CLI.
Nếu bạn cấu hình nhiều tài khoản có tên, đặt `defaultAccount` hoặc truyền `--account <id>` cho các lệnh CLI dựa vào lựa chọn tài khoản ngầm định.
Truyền `--account <id>` cho `openclaw matrix verify ...` và `openclaw matrix devices ...` khi bạn muốn ghi đè lựa chọn ngầm định đó cho một lệnh.

## Homeservers riêng/LAN

Mặc định, OpenClaw chặn các homeserver Matrix riêng/nội bộ để bảo vệ SSRF trừ khi bạn
rõ ràng chọn tham gia theo tài khoản.

Nếu homeserver của bạn chạy trên localhost, IP LAN/Tailscale, hoặc hostname nội bộ, bật
`allowPrivateNetwork` cho tài khoản Matrix đó:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      allowPrivateNetwork: true,
      accessToken: "syt_internal_xxx",
    },
  },
}
```

Ví dụ thiết lập CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Chọn tham gia này chỉ cho phép các mục tiêu riêng/nội bộ tin cậy. Các homeserver công khai không mã hóa như
`http://matrix.example.org:8008` vẫn bị chặn. Ưu tiên `https://` bất cứ khi nào có thể.

## Giải quyết mục tiêu

Matrix chấp nhận các dạng mục tiêu này ở bất cứ đâu OpenClaw yêu cầu bạn cho một room hoặc mục tiêu người dùng:

- Người dùng: `@user:server`, `user:@user:server`, hoặc `matrix:user:@user:server`
- Rooms: `!room:server`, `room:!room:server`, hoặc `matrix:room:!room:server`
- Aliases: `#alias:server`, `channel:#alias:server`, hoặc `matrix:channel:#alias:server`

Tra cứu thư mục trực tiếp sử dụng tài khoản Matrix đã đăng nhập:

- Tra cứu người dùng truy vấn thư mục người dùng Matrix trên homeserver đó.
- Tra cứu room chấp nhận room IDs và aliases rõ ràng trực tiếp, sau đó quay lại tìm kiếm tên room đã tham gia cho tài khoản đó.
- Tra cứu tên room đã tham gia là nỗ lực tốt nhất. Nếu một tên room không thể được giải quyết thành ID hoặc alias, nó bị bỏ qua bởi runtime allowlist resolution.

## Tham khảo cấu hình

- `enabled`: bật hoặc tắt kênh.
- `name`: nhãn tùy chọn cho tài khoản.
- `defaultAccount`: ID tài khoản ưu tiên khi nhiều tài khoản Matrix được cấu hình.
- `homeserver`: URL homeserver, ví dụ `https://matrix.example.org`.
- `allowPrivateNetwork`: cho phép tài khoản Matrix này kết nối với các homeserver riêng/nội bộ. Bật điều này khi homeserver giải quyết đến `localhost`, IP LAN/Tailscale, hoặc một host nội bộ như `matrix-synapse`.
- `userId`: ID người dùng Matrix đầy đủ, ví dụ `@bot:example.org`.
- `accessToken`: access token cho xác thực dựa trên token.
- `password`: mật khẩu cho đăng nhập dựa trên mật khẩu.
- `deviceId`: ID thiết bị Matrix rõ ràng.
- `deviceName`: tên hiển thị thiết bị cho đăng nhập mật khẩu.
- `avatarUrl`: URL avatar tự lưu trữ cho đồng bộ hồ sơ và cập nhật `set-profile`.
- `initialSyncLimit`: giới hạn sự kiện sync khởi động.
- `encryption`: bật E2EE.
- `allowlistOnly`: buộc hành vi chỉ allowlist cho DMs và rooms.
- `groupPolicy`: `open`, `allowlist`, hoặc `disabled`.
- `groupAllowFrom`: allowlist của user IDs cho traffic room.
- Các mục `groupAllowFrom` nên là user IDs Matrix đầy đủ. Tên không giải quyết được bị bỏ qua tại runtime.
- `replyToMode`: `off`, `first`, hoặc `all`.
- `threadReplies`: `off`, `inbound`, hoặc `always`.
- `threadBindings`: ghi đè theo kênh cho định tuyến session ràng buộc thread và vòng đời.
- `startupVerification`: chế độ yêu cầu tự xác minh tự động khi khởi động (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: thời gian chờ trước khi thử lại các yêu cầu xác minh khởi động tự động.
- `textChunkLimit`: kích thước chunk tin nhắn outbound.
- `chunkMode`: `length` hoặc `newline`.
- `responsePrefix`: tiền tố tin nhắn tùy chọn cho các trả lời outbound.
- `ackReaction`: ghi đè phản ứng ack tùy chọn cho kênh/tài khoản này.
- `ackReactionScope`: ghi đè phạm vi phản ứng ack tùy chọn (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: chế độ thông báo phản ứng inbound (`own`, `off`).
- `mediaMaxMb`: giới hạn kích thước media outbound tính bằng MB.
- `autoJoin`: chính sách tự động tham gia lời mời (`always`, `allowlist`, `off`). Mặc định: `off`.
- `autoJoinAllowlist`: rooms/aliases được phép khi `autoJoin` là `allowlist`. Các mục alias được giải quyết thành room IDs trong quá trình xử lý lời mời; OpenClaw không tin tưởng trạng thái alias được tuyên bố bởi room được mời.
- `dm`: khối chính sách DM (`enabled`, `policy`, `allowFrom`).
- Các mục `dm.allowFrom` nên là user IDs Matrix đầy đủ trừ khi bạn đã giải quyết chúng thông qua tra cứu thư mục trực tiếp.
- `accounts`: ghi đè theo tài khoản có tên. Các giá trị `channels.matrix` cấp cao nhất hoạt động như mặc định cho các mục này.
- `groups`: bản đồ chính sách theo room. Ưu tiên room IDs hoặc aliases; tên room không giải quyết được bị bỏ qua tại runtime. Danh tính session/group sử dụng ID room ổn định sau khi giải quyết, trong khi các nhãn có thể đọc được vẫn đến từ tên room.
- `rooms`: alias cũ cho `groups`.
- `actions`: kiểm soát công cụ theo hành động (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).\n
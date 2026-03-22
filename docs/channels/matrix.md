---
summary: "Khám phá cách thiết lập và cấu hình Matrix với OpenClaw, tối ưu hóa trải nghiệm giao tiếp và quản lý kênh hiệu quả."
read_when:
  - Thiết lập Matrix trong OpenClaw
  - Cấu hình Matrix E2EE và xác minh
title: "Hướng Dẫn Cấu Hình Matrix Trên OpenClaw"
---

# Matrix (plugin)

Matrix là plugin kênh Matrix cho OpenClaw. Nó sử dụng `matrix-js-sdk` chính thức và hỗ trợ tin nhắn trực tiếp (DM), phòng, luồng, media, phản ứng, thăm dò ý kiến, vị trí và mã hóa đầu cuối (E2EE).

## Yêu cầu plugin

Matrix là một plugin và không được tích hợp sẵn với OpenClaw.

Cài đặt từ npm:

```bash
openclaw plugins install @openclaw/matrix
```

Cài đặt từ bản sao cục bộ:

```bash
openclaw plugins install ./extensions/matrix
```

Xem [Plugins](/tools/plugin) để biết hành vi và quy tắc cài đặt plugin.

## Thiết lập

1. Cài đặt plugin.
2. Tạo tài khoản Matrix trên máy chủ của bạn.
3. Cấu hình `channels.matrix` với:
   - `homeserver` + `accessToken`, hoặc
   - `homeserver` + `userId` + `password`.
4. Khởi động lại gateway.
5. Bắt đầu một DM với bot hoặc mời bot vào phòng.

Các bước thiết lập tương tác:

```bash
openclaw channels add
openclaw configure --section channels
```

Những gì wizard Matrix thực sự yêu cầu:

- URL của homeserver
- Phương thức xác thực: access token hoặc password
- user ID chỉ khi chọn xác thực bằng password
- Tên thiết bị tùy chọn
- Có bật E2EE hay không
- Có cấu hình truy cập phòng Matrix ngay không

Hành vi của wizard:

- Nếu biến môi trường xác thực Matrix đã tồn tại cho tài khoản đã chọn và tài khoản đó chưa có xác thực lưu trong cấu hình, wizard sẽ cung cấp một lối tắt qua biến môi trường và chỉ ghi `enabled: true` cho tài khoản đó.
- Khi thêm tài khoản Matrix khác một cách tương tác, tên tài khoản nhập vào sẽ được chuẩn hóa thành ID tài khoản được sử dụng trong cấu hình và biến môi trường. Ví dụ, `Ops Bot` trở thành `ops-bot`.
- Các lời nhắc danh sách cho phép DM chấp nhận giá trị đầy đủ `@user:server` ngay lập tức. Tên hiển thị chỉ hoạt động khi tra cứu thư mục trực tiếp tìm thấy một kết quả khớp chính xác; nếu không, wizard sẽ yêu cầu thử lại với ID Matrix đầy đủ.
- Các lời nhắc danh sách cho phép phòng chấp nhận ID phòng và bí danh trực tiếp. Chúng cũng có thể giải quyết tên phòng đã tham gia trực tiếp, nhưng các tên không được giải quyết chỉ được giữ lại như đã nhập trong quá trình thiết lập và bị bỏ qua sau đó bởi quá trình giải quyết danh sách cho phép khi chạy. Ưu tiên `!room:server` hoặc `#alias:server`.
- Danh tính phòng/phiên khi chạy sử dụng ID phòng Matrix ổn định. Các bí danh được khai báo trong phòng chỉ được sử dụng làm đầu vào tra cứu, không phải là khóa phiên dài hạn hoặc danh tính nhóm ổn định.
- Để giải quyết tên phòng trước khi lưu chúng, sử dụng `openclaw channels resolve --channel matrix "Project Room"`.

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

Thiết lập dựa trên password (token được lưu vào bộ nhớ cache sau khi đăng nhập):

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

Matrix lưu trữ thông tin xác thực đã lưu vào bộ nhớ cache trong `~/.openclaw/credentials/matrix/`.
Tài khoản mặc định sử dụng `credentials.json`; các tài khoản có tên sử dụng `credentials-<account>.json`.

Các biến môi trường tương đương (được sử dụng khi khóa cấu hình không được đặt):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Đối với các tài khoản không mặc định, sử dụng các biến môi trường theo phạm vi tài khoản:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

Ví dụ cho tài khoản `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

Đối với ID tài khoản đã chuẩn hóa `ops-bot`, sử dụng:

- `MATRIX_OPS_BOT_HOMESERVER`
- `MATRIX_OPS_BOT_ACCESS_TOKEN`

Wizard tương tác chỉ cung cấp lối tắt qua biến môi trường khi các biến môi trường xác thực đó đã có sẵn và tài khoản đã chọn chưa có xác thực Matrix lưu trong cấu hình.

## Ví dụ cấu hình

Đây là cấu hình cơ bản thực tế với ghép đôi DM, danh sách cho phép phòng và E2EE được bật:

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

## Phòng bot-to-bot

Mặc định, các tin nhắn Matrix từ các tài khoản Matrix OpenClaw khác được cấu hình sẽ bị bỏ qua.

Sử dụng `allowBots` khi bạn muốn có lưu lượng Matrix giữa các agent:

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

- `allowBots: true` chấp nhận tin nhắn từ các tài khoản bot Matrix khác trong các phòng và DM được phép.
- `allowBots: "mentions"` chỉ chấp nhận những tin nhắn đó khi chúng đề cập rõ ràng đến bot này trong phòng. DM vẫn được phép.
- `groups.<room>.allowBots` ghi đè cài đặt cấp tài khoản cho một phòng.
- OpenClaw vẫn bỏ qua các tin nhắn từ cùng một ID người dùng Matrix để tránh vòng lặp tự trả lời.
- Matrix không cung cấp cờ bot gốc ở đây; OpenClaw coi "do bot tạo ra" là "được gửi bởi một tài khoản Matrix khác được cấu hình trên gateway OpenClaw này".

Sử dụng danh sách cho phép phòng nghiêm ngặt và yêu cầu đề cập khi bật lưu lượng bot-to-bot trong các phòng chia sẻ.

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

Bao gồm khóa khôi phục đã lưu trong đầu ra có thể đọc được bằng máy:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Khởi tạo trạng thái ký chéo và xác minh:

```bash
openclaw matrix verify bootstrap
```

Hỗ trợ nhiều tài khoản: sử dụng `channels.matrix.accounts` với thông tin xác thực cho từng tài khoản và `name` tùy chọn. Xem [Tham chiếu cấu hình](/gateway/configuration-reference#multi-account-all-channels) cho mẫu chia sẻ.

Chẩn đoán khởi tạo chi tiết:

```bash
openclaw matrix verify bootstrap --verbose
```

Buộc đặt lại danh tính ký chéo mới trước khi khởi tạo:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Xác minh thiết bị này bằng khóa khôi phục:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Chi tiết xác minh thiết bị chi tiết:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Kiểm tra sức khỏe sao lưu khóa phòng:

```bash
openclaw matrix verify backup status
```

Chẩn đoán sức khỏe sao lưu chi tiết:

```bash
openclaw matrix verify backup status --verbose
```

Khôi phục khóa phòng từ sao lưu máy chủ:

```bash
openclaw matrix verify backup restore
```

Chẩn đoán khôi phục chi tiết:

```bash
openclaw matrix verify backup restore --verbose
```

Xóa sao lưu máy chủ hiện tại và tạo cơ sở sao lưu mới:

```bash
openclaw matrix verify backup reset --yes
```

Tất cả các lệnh `verify` đều ngắn gọn theo mặc định (bao gồm cả ghi nhật ký SDK nội bộ yên tĩnh) và chỉ hiển thị chẩn đoán chi tiết với `--verbose`.
Sử dụng `--json` để có đầu ra đầy đủ có thể đọc được bằng máy khi viết script.

Trong các thiết lập nhiều tài khoản, các lệnh CLI Matrix sử dụng tài khoản Matrix mặc định ngầm định trừ khi bạn truyền `--account <id>`.
Nếu bạn cấu hình nhiều tài khoản có tên, hãy đặt `channels.matrix.defaultAccount` trước hoặc các thao tác CLI ngầm định đó sẽ dừng lại và yêu cầu bạn chọn tài khoản rõ ràng.
Sử dụng `--account` bất cứ khi nào bạn muốn xác minh hoặc các thao tác thiết bị nhắm mục tiêu vào một tài khoản có tên rõ ràng:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Khi mã hóa bị tắt hoặc không khả dụng cho một tài khoản có tên, các cảnh báo Matrix và lỗi xác minh chỉ ra khóa cấu hình của tài khoản đó, ví dụ `channels.matrix.accounts.assistant.encryption`.

### Ý nghĩa của "đã xác minh"

OpenClaw coi thiết bị Matrix này là đã xác minh chỉ khi nó được xác minh bởi danh tính ký chéo của bạn.
Trong thực tế, `openclaw matrix verify status --verbose` hiển thị ba tín hiệu tin cậy:

- `Locally trusted`: thiết bị này chỉ được tin cậy bởi client hiện tại
- `Cross-signing verified`: SDK báo cáo thiết bị đã được xác minh thông qua ký chéo
- `Signed by owner`: thiết bị được ký bởi khóa tự ký của bạn

`Verified by owner` trở thành `yes` chỉ khi có xác minh ký chéo hoặc ký bởi chủ sở hữu.
Tin cậy cục bộ tự nó không đủ để OpenClaw coi thiết bị là đã xác minh hoàn toàn.

### Những gì khởi tạo làm

`openclaw matrix verify bootstrap` là lệnh sửa chữa và thiết lập cho các tài khoản Matrix được mã hóa.
Nó thực hiện tất cả các bước sau theo thứ tự:

- khởi tạo lưu trữ bí mật, tái sử dụng khóa khôi phục hiện có khi có thể
- khởi tạo ký chéo và tải lên các khóa ký chéo công khai bị thiếu
- cố gắng đánh dấu và ký chéo thiết bị hiện tại
- tạo một bản sao lưu khóa phòng phía máy chủ mới nếu chưa có

Nếu máy chủ yêu cầu xác thực tương tác để tải lên các khóa ký chéo, OpenClaw thử tải lên mà không cần xác thực trước, sau đó với `m.login.dummy`, sau đó với `m.login.password` khi `channels.matrix.password` được cấu hình.

Sử dụng `--force-reset-cross-signing` chỉ khi bạn muốn loại bỏ danh tính ký chéo hiện tại và tạo một danh tính mới.

Nếu bạn muốn loại bỏ bản sao lưu khóa phòng hiện tại và bắt đầu một cơ sở sao lưu mới cho các tin nhắn trong tương lai, sử dụng `openclaw matrix verify backup reset --yes`.
Chỉ làm điều này khi bạn chấp nhận rằng lịch sử mã hóa cũ không thể khôi phục sẽ không thể truy cập được.

### Cơ sở sao lưu mới

Nếu bạn muốn giữ cho các tin nhắn mã hóa trong tương lai hoạt động và chấp nhận mất lịch sử cũ không thể khôi phục, hãy chạy các lệnh này theo thứ tự:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Thêm `--account <id>` vào mỗi lệnh khi bạn muốn nhắm mục tiêu vào một tài khoản Matrix có tên rõ ràng.

### Hành vi khởi động

Khi `encryption: true`, Matrix mặc định `startupVerification` là `"if-unverified"`.
Khi khởi động, nếu thiết bị này vẫn chưa được xác minh, Matrix sẽ yêu cầu tự xác minh trong một client Matrix khác,
bỏ qua các yêu cầu trùng lặp trong khi một yêu cầu đã đang chờ xử lý, và áp dụng một khoảng thời gian chờ trước khi thử lại sau khi khởi động lại.
Các lần thử yêu cầu thất bại sẽ thử lại sớm hơn so với các lần tạo yêu cầu thành công theo mặc định.
Đặt `startupVerification: "off"` để tắt các yêu cầu khởi động tự động, hoặc điều chỉnh `startupVerificationCooldownHours`
nếu bạn muốn một khoảng thời gian thử lại ngắn hơn hoặc dài hơn.

Khởi động cũng thực hiện một lần khởi tạo mã hóa bảo thủ tự động.
Lần khởi tạo đó cố gắng tái sử dụng lưu trữ bí mật hiện tại và danh tính ký chéo trước tiên, và tránh đặt lại ký chéo trừ khi bạn chạy một luồng sửa chữa khởi tạo rõ ràng.

Nếu khởi động phát hiện trạng thái khởi tạo bị hỏng và `channels.matrix.password` được cấu hình, OpenClaw có thể thử một đường sửa chữa nghiêm ngặt hơn.
Nếu thiết bị hiện tại đã được ký bởi chủ sở hữu, OpenClaw sẽ giữ lại danh tính đó thay vì tự động đặt lại nó.

Nâng cấp từ plugin Matrix công khai trước đó:

- OpenClaw tự động tái sử dụng cùng tài khoản Matrix, access token và danh tính thiết bị khi có thể.
- Trước khi bất kỳ thay đổi di chuyển Matrix nào có thể thực hiện được, OpenClaw tạo hoặc tái sử dụng một bản sao lưu dưới `~/Backups/openclaw-migrations/`.
- Nếu bạn sử dụng nhiều tài khoản Matrix, hãy đặt `channels.matrix.defaultAccount` trước khi nâng cấp từ bố cục lưu trữ phẳng cũ để OpenClaw biết tài khoản nào nên nhận trạng thái kế thừa chia sẻ đó.
- Nếu plugin trước đó lưu trữ một khóa giải mã sao lưu khóa phòng Matrix cục bộ, khởi động hoặc `openclaw doctor --fix` sẽ nhập nó vào luồng khóa khôi phục mới tự động.
- Nếu access token Matrix thay đổi sau khi di chuyển đã được chuẩn bị, khởi động bây giờ quét các gốc lưu trữ hash token anh em cho trạng thái khôi phục kế thừa đang chờ trước khi từ bỏ trạng thái Matrix trống.
- Nếu access token Matrix thay đổi sau đó cho cùng tài khoản, máy chủ, và người dùng, OpenClaw bây giờ ưu tiên tái sử dụng gốc lưu trữ hiện có hoàn chỉnh nhất thay vì bắt đầu từ một thư mục trạng thái Matrix trống.
- Vào lần khởi động gateway tiếp theo, các khóa phòng đã sao lưu được khôi phục tự động vào cửa hàng mã hóa mới.
- Nếu plugin cũ có các khóa phòng chỉ cục bộ chưa bao giờ được sao lưu, OpenClaw sẽ cảnh báo rõ ràng. Những khóa đó không thể được xuất tự động từ cửa hàng mã hóa rust trước đó, vì vậy một số lịch sử mã hóa cũ có thể vẫn không thể truy cập được cho đến khi được khôi phục thủ công.
- Xem [Di chuyển Matrix](/install/migrating-matrix) để biết luồng nâng cấp đầy đủ, giới hạn, lệnh khôi phục và các thông báo di chuyển phổ biến.

Trạng thái runtime mã hóa được tổ chức dưới các gốc hash token theo tài khoản, theo người dùng trong
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Thư mục đó chứa cửa hàng đồng bộ (`bot-storage.json`), cửa hàng mã hóa (`crypto/`),
tệp khóa khôi phục (`recovery-key.json`), ảnh chụp nhanh IndexedDB (`crypto-idb-snapshot.json`),
ràng buộc luồng (`thread-bindings.json`), và trạng thái xác minh khởi động (`startup-verification.json`)
khi các tính năng đó đang được sử dụng.
Khi token thay đổi nhưng danh tính tài khoản vẫn giữ nguyên, OpenClaw tái sử dụng gốc tốt nhất hiện có
cho bộ ba tài khoản/máy chủ/người dùng đó để trạng thái đồng bộ trước đó, trạng thái mã hóa, ràng buộc luồng,
và trạng thái xác minh khởi động vẫn hiển thị.

### Mô hình cửa hàng mã hóa Node

Matrix E2EE trong plugin này sử dụng đường mã hóa Rust `matrix-js-sdk` chính thức trong Node.
Đường này mong đợi sự tồn tại của IndexedDB khi bạn muốn trạng thái mã hóa tồn tại qua các lần khởi động lại.

Hiện tại OpenClaw cung cấp điều đó trong Node bằng cách:

- sử dụng `fake-indexeddb` làm API IndexedDB giả lập mà SDK mong đợi
- khôi phục nội dung IndexedDB mã hóa Rust từ `crypto-idb-snapshot.json` trước `initRustCrypto`
- lưu trữ nội dung IndexedDB đã cập nhật trở lại `crypto-idb-snapshot.json` sau khi khởi tạo và trong runtime

Đây là sự tương thích/ổn định lưu trữ, không phải là một triển khai mã hóa tùy chỉnh.
Tệp ảnh chụp nhanh là trạng thái runtime nhạy cảm và được lưu trữ với quyền truy cập tệp hạn chế.
Dưới mô hình bảo mật của OpenClaw, máy chủ gateway và thư mục trạng thái cục bộ OpenClaw đã nằm trong ranh giới nhà điều hành tin cậy, vì vậy đây chủ yếu là một mối quan tâm về độ bền hoạt động hơn là một ranh giới tin cậy từ xa riêng biệt.

Cải tiến dự kiến:

- thêm hỗ trợ SecretRef cho vật liệu khóa Matrix bền vững để khóa khôi phục và các bí mật mã hóa cửa hàng liên quan có thể được lấy từ các nhà cung cấp bí mật OpenClaw thay vì chỉ từ các tệp cục bộ

## Thông báo xác minh tự động

Matrix hiện đăng các thông báo vòng đời xác minh trực tiếp vào phòng xác minh DM nghiêm ngặt dưới dạng tin nhắn `m.notice`.
Điều đó bao gồm:

- thông báo yêu cầu xác minh
- thông báo sẵn sàng xác minh (với hướng dẫn "Xác minh bằng emoji" rõ ràng)
- thông báo bắt đầu và hoàn thành xác minh
- chi tiết SAS (emoji và số thập phân) khi có sẵn

Các yêu cầu xác minh đến từ một client Matrix khác được theo dõi và tự động chấp nhận bởi OpenClaw.
Đối với các luồng tự xác minh, OpenClaw cũng bắt đầu luồng SAS tự động khi xác minh emoji trở nên khả dụng và xác nhận phía của mình.
Đối với các yêu cầu xác minh từ một người dùng/thiết bị Matrix khác, OpenClaw tự động chấp nhận yêu cầu và sau đó chờ luồng SAS tiếp tục bình thường.
Bạn vẫn cần so sánh emoji hoặc SAS số thập phân trong client Matrix của mình và xác nhận "Chúng khớp" ở đó để hoàn thành xác minh.

OpenClaw không tự động chấp nhận các luồng trùng lặp tự khởi tạo một cách mù quáng. Khởi động bỏ qua việc tạo một yêu cầu mới khi một yêu cầu tự xác minh đã đang chờ xử lý.

Các thông báo giao thức/hệ thống xác minh không được chuyển tiếp đến pipeline chat agent, vì vậy chúng không tạo ra `NO_REPLY`.

### Vệ sinh thiết bị

Các thiết bị Matrix do OpenClaw quản lý cũ có thể tích tụ trên tài khoản và làm cho việc tin tưởng phòng mã hóa trở nên khó hiểu hơn.
Liệt kê chúng với:

```bash
openclaw matrix devices list
```

Xóa các thiết bị do OpenClaw quản lý cũ với:

```bash
openclaw matrix devices prune-stale
```

### Sửa chữa phòng trực tiếp

Nếu trạng thái tin nhắn trực tiếp bị mất đồng bộ, OpenClaw có thể kết thúc với các ánh xạ `m.direct` cũ chỉ vào các phòng solo cũ thay vì DM trực tiếp. Kiểm tra ánh xạ hiện tại cho một đối tác với:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Sửa chữa nó với:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Luồng sửa chữa giữ logic cụ thể của Matrix bên trong plugin:

- nó ưu tiên một DM 1:1 nghiêm ngặt đã được ánh xạ trong `m.direct`
- nếu không, nó quay lại bất kỳ DM 1:1 nghiêm ngặt nào hiện đang tham gia với người dùng đó
- nếu không có DM nào khỏe mạnh tồn tại, nó tạo một phòng trực tiếp mới và viết lại `m.direct` để chỉ vào nó

Luồng sửa chữa không tự động xóa các phòng cũ. Nó chỉ chọn DM khỏe mạnh và cập nhật ánh xạ để các tin nhắn Matrix mới, thông báo xác minh và các luồng tin nhắn trực tiếp khác nhắm mục tiêu lại phòng đúng.

## Luồng

Matrix hỗ trợ các luồng Matrix gốc cho cả trả lời tự động và gửi công cụ tin nhắn.

- `threadReplies: "off"` giữ các trả lời ở cấp cao nhất.
- `threadReplies: "inbound"` trả lời trong một luồng chỉ khi tin nhắn đến đã ở trong luồng đó.
- `threadReplies: "always"` giữ các trả lời phòng trong một luồng bắt nguồn từ tin nhắn kích hoạt.
- Các tin nhắn luồng đến bao gồm tin nhắn gốc của luồng làm ngữ cảnh agent bổ sung.
- Gửi công cụ tin nhắn bây giờ tự động kế thừa luồng Matrix hiện tại khi mục tiêu là cùng một phòng, hoặc cùng một mục tiêu người dùng DM, trừ khi một `threadId` rõ ràng được cung cấp.
- Các ràng buộc luồng runtime được hỗ trợ cho Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, và `/acp spawn` ràng buộc luồng bây giờ hoạt động trong các phòng và DM Matrix.
- `/focus` phòng/DM Matrix cấp cao nhất tạo một luồng Matrix mới và ràng buộc nó với phiên mục tiêu khi `threadBindings.spawnSubagentSessions=true`.
- Chạy `/focus` hoặc `/acp spawn --thread here` bên trong một luồng Matrix hiện có ràng buộc luồng hiện tại thay thế.

### Cấu hình Ràng buộc Luồng

Matrix kế thừa các mặc định toàn cầu từ `session.threadBindings`, và cũng hỗ trợ ghi đè theo kênh:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Các cờ spawn ràng buộc luồng Matrix là tùy chọn:

- Đặt `threadBindings.spawnSubagentSessions: true` để cho phép `/focus` cấp cao nhất tạo và ràng buộc các luồng Matrix mới.
- Đặt `threadBindings.spawnAcpSessions: true` để cho phép `/acp spawn --thread auto|here` ràng buộc các phiên ACP với các luồng Matrix.

## Phản ứng

Matrix hỗ trợ các hành động phản ứng ra ngoài, thông báo phản ứng đến và phản ứng xác nhận đến.

- Công cụ phản ứng ra ngoài được kiểm soát bởi `channels["matrix"].actions.reactions`.
- `react` thêm một phản ứng vào một sự kiện Matrix cụ thể.
- `reactions` liệt kê tóm tắt phản ứng hiện tại cho một sự kiện Matrix cụ thể.
- `emoji=""` xóa các phản ứng của tài khoản bot trên sự kiện đó.
- `remove: true` chỉ xóa phản ứng emoji được chỉ định từ tài khoản bot.

Phản ứng xác nhận sử dụng thứ tự giải quyết OpenClaw tiêu chuẩn:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- dự phòng emoji danh tính agent

Phạm vi phản ứng xác nhận được giải quyết theo thứ tự này:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Chế độ thông báo phản ứng được giải quyết theo thứ tự này:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- mặc định: `own`

Hành vi hiện tại:

- `reactionNotifications: "own"` chuyển tiếp các sự kiện `m.reaction` được thêm vào khi chúng nhắm mục tiêu các tin nhắn Matrix do bot tạo ra.
- `reactionNotifications: "off"` tắt các sự kiện hệ thống phản ứng.
- Việc xóa phản ứng vẫn chưa được tổng hợp thành các sự kiện hệ thống vì Matrix hiển thị chúng dưới dạng các chỉnh sửa, không phải là các xóa `m.reaction` độc lập.

## Ví dụ về chính sách DM và phòng

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

Xem [Groups](/channels/groups) để biết hành vi danh sách cho phép và yêu cầu đề cập.

Ví dụ ghép đôi cho DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Nếu một người dùng Matrix chưa được chấp thuận tiếp tục nhắn tin cho bạn trước khi được chấp thuận, OpenClaw sẽ tái sử dụng mã ghép đôi đang chờ xử lý và có thể gửi lại một lời nhắc sau một khoảng thời gian ngắn thay vì tạo mã mới.

Xem [Pairing](/channels/pairing) để biết luồng ghép đôi DM chia sẻ và bố cục lưu trữ.

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
Đặt `defaultAccount` khi bạn muốn OpenClaw ưu tiên một tài khoản Matrix có tên cho định tuyến ngầm định, thăm dò và các thao tác CLI.
Nếu bạn cấu hình nhiều tài khoản có tên, hãy đặt `defaultAccount` hoặc truyền `--account <id>` cho các lệnh CLI dựa vào lựa chọn tài khoản ngầm định.
Truyền `--account <id>` cho `openclaw matrix verify ...` và `openclaw matrix devices ...` khi bạn muốn ghi đè lựa chọn ngầm định đó cho một lệnh.

## Máy chủ riêng/LAN

Mặc định, OpenClaw chặn các máy chủ Matrix riêng/nội bộ để bảo vệ SSRF trừ khi bạn
rõ ràng chọn tham gia cho từng tài khoản.

Nếu máy chủ của bạn chạy trên localhost, một IP LAN/Tailscale, hoặc một tên máy chủ nội bộ, bật
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

Tùy chọn tham gia này chỉ cho phép các mục tiêu riêng/nội bộ đáng tin cậy. Các máy chủ công khai không mã hóa như
`http://matrix.example.org:8008` vẫn bị chặn. Ưu tiên `https://` bất cứ khi nào có thể.

## Giải quyết mục tiêu

Matrix chấp nhận các dạng mục tiêu này ở bất kỳ đâu OpenClaw yêu cầu bạn cho một phòng hoặc mục tiêu người dùng:

- Người dùng: `@user:server`, `user:@user:server`, hoặc `matrix:user:@user:server`
- Phòng: `!room:server`, `room:!room:server`, hoặc `matrix:room:!room:server`
- Bí danh: `#alias:server`, `channel:#alias:server`, hoặc `matrix:channel:#alias:server`

Tra cứu thư mục trực tiếp sử dụng tài khoản Matrix đã đăng nhập:

- Tra cứu người dùng truy vấn thư mục người dùng Matrix trên máy chủ đó.
- Tra cứu phòng chấp nhận ID phòng và bí danh rõ ràng trực tiếp, sau đó quay lại tìm kiếm tên phòng đã tham gia cho tài khoản đó.
- Tra cứu tên phòng đã tham gia là nỗ lực tốt nhất. Nếu một tên phòng không thể được giải quyết thành ID hoặc bí danh, nó sẽ bị bỏ qua bởi quá trình giải quyết danh sách cho phép khi chạy.

## Tham chiếu cấu hình

- `enabled`: bật hoặc tắt kênh.
- `name`: nhãn tùy chọn cho tài khoản.
- `defaultAccount`: ID tài khoản ưu tiên khi nhiều tài khoản Matrix được cấu hình.
- `homeserver`: URL máy chủ, ví dụ `https://matrix.example.org`.
- `allowPrivateNetwork`: cho phép tài khoản Matrix này kết nối với các máy chủ riêng/nội bộ. Bật điều này khi máy chủ giải quyết đến `localhost`, một IP LAN/Tailscale, hoặc một máy chủ nội bộ như `matrix-synapse`.
- `userId`: ID người dùng Matrix đầy đủ, ví dụ `@bot:example.org`.
- `accessToken`: access token cho xác thực dựa trên token.
- `password`: mật khẩu cho đăng nhập dựa trên mật khẩu.
- `deviceId`: ID thiết bị Matrix rõ ràng.
- `deviceName`: tên hiển thị thiết bị cho đăng nhập bằng mật khẩu.
- `avatarUrl`: URL avatar tự lưu trữ cho đồng bộ hồ sơ và cập nhật `set-profile`.
- `initialSyncLimit`: giới hạn sự kiện đồng bộ khởi động.
- `encryption`: bật E2EE.
- `allowlistOnly`: buộc hành vi chỉ danh sách cho phép cho DM và phòng.
- `groupPolicy`: `open`, `allowlist`, hoặc `disabled`.
- `groupAllowFrom`: danh sách cho phép ID người dùng cho lưu lượng phòng.
- Các mục `groupAllowFrom` nên là ID người dùng Matrix đầy đủ. Các tên không được giải quyết bị bỏ qua khi chạy.
- `replyToMode`: `off`, `first`, hoặc `all`.
- `threadReplies`: `off`, `inbound`, hoặc `always`.
- `threadBindings`: ghi đè theo kênh cho định tuyến và vòng đời phiên ràng buộc luồng.
- `startupVerification`: chế độ yêu cầu tự xác minh tự động khi khởi động (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: thời gian chờ trước khi thử lại các yêu cầu xác minh khởi động tự động.
- `textChunkLimit`: kích thước đoạn tin nhắn gửi ra.
- `chunkMode`: `length` hoặc `newline`.
- `responsePrefix`: tiền tố tin nhắn tùy chọn cho các trả lời gửi ra.
- `ackReaction`: ghi đè phản ứng xác nhận tùy chọn cho kênh/tài khoản này.
- `ackReactionScope`: ghi đè phạm vi phản ứng xác nhận tùy chọn (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: chế độ thông báo phản ứng đến (`own`, `off`).
- `mediaMaxMb`: giới hạn kích thước media gửi ra tính bằng MB.
- `autoJoin`: chính sách tự động tham gia lời mời (`always`, `allowlist`, `off`). Mặc định: `off`.
- `autoJoinAllowlist`: các phòng/bí danh được phép khi `autoJoin` là `allowlist`. Các mục bí danh được giải quyết thành ID phòng trong quá trình xử lý lời mời; OpenClaw không tin tưởng trạng thái bí danh được tuyên bố bởi phòng được mời.
- `dm`: khối chính sách DM (`enabled`, `policy`, `allowFrom`).
- Các mục `dm.allowFrom` nên là ID người dùng Matrix đầy đủ trừ khi bạn đã giải quyết chúng thông qua tra cứu thư mục trực tiếp.
- `accounts`: ghi đè theo tài khoản có tên. Các giá trị `channels.matrix` cấp cao nhất hoạt động như mặc định cho các mục này.
- `groups`: bản đồ chính sách theo phòng. Ưu tiên ID phòng hoặc bí danh; các tên phòng không được giải quyết bị bỏ qua khi chạy. Danh tính phiên/nhóm sử dụng ID phòng ổn định sau khi giải quyết, trong khi các nhãn có thể đọc được vẫn đến từ tên phòng.
- `rooms`: bí danh cũ cho `groups`.
- `actions`: kiểm soát công cụ theo hành động (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

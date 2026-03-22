---
summary: "Slash commands: text vs native, cấu hình, và các lệnh hỗ trợ"
read_when:
  - Sử dụng hoặc cấu hình lệnh chat
  - Gỡ lỗi định tuyến lệnh hoặc quyền truy cập
title: "Lệnh Slash"
---

# Lệnh Slash

Các lệnh được xử lý bởi Gateway. Hầu hết các lệnh phải được gửi dưới dạng một tin nhắn **độc lập** bắt đầu bằng `/`.
Lệnh chat bash chỉ dành cho host sử dụng `! <cmd>` (với `/bash <cmd>` là một alias).

Có hai hệ thống liên quan:

- **Commands**: tin nhắn độc lập `/...`.
- **Directives**: `/think`, `/fast`, `/verbose`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Directives sẽ bị loại bỏ khỏi tin nhắn trước khi mô hình xử lý.
  - Trong các tin nhắn chat thông thường (không chỉ có directive), chúng được coi là "gợi ý nội tuyến" và **không** duy trì cài đặt phiên.
  - Trong các tin nhắn chỉ có directive (tin nhắn chỉ chứa directives), chúng duy trì trong phiên và trả lời với một thông báo xác nhận.
  - Directives chỉ được áp dụng cho **người gửi được ủy quyền**. Nếu `commands.allowFrom` được thiết lập, đây là danh sách cho phép duy nhất được sử dụng; nếu không, ủy quyền đến từ danh sách cho phép kênh/cặp và `commands.useAccessGroups`.
    Người gửi không được ủy quyền sẽ thấy directives được xử lý như văn bản thông thường.

Cũng có một số **phím tắt nội tuyến** (chỉ dành cho người gửi được cho phép): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Chúng chạy ngay lập tức, bị loại bỏ trước khi mô hình xử lý tin nhắn, và phần văn bản còn lại tiếp tục qua luồng thông thường.

## Cấu hình

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: false,
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

- `commands.text` (mặc định `true`) cho phép phân tích `/...` trong tin nhắn chat.
  - Trên các nền tảng không có lệnh native (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), lệnh văn bản vẫn hoạt động ngay cả khi bạn đặt giá trị này là `false`.
- `commands.native` (mặc định `"auto"`) đăng ký lệnh native.
  - Auto: bật cho Discord/Telegram; tắt cho Slack (cho đến khi bạn thêm lệnh slash); bỏ qua cho các nhà cung cấp không hỗ trợ native.
  - Đặt `channels.discord.commands.native`, `channels.telegram.commands.native`, hoặc `channels.slack.commands.native` để ghi đè theo nhà cung cấp (bool hoặc `"auto"`).
  - `false` xóa các lệnh đã đăng ký trước đó trên Discord/Telegram khi khởi động. Lệnh Slack được quản lý trong ứng dụng Slack và không bị xóa tự động.
- `commands.nativeSkills` (mặc định `"auto"`) đăng ký lệnh **skill** native khi được hỗ trợ.
  - Auto: bật cho Discord/Telegram; tắt cho Slack (Slack yêu cầu tạo một lệnh slash cho mỗi skill).
  - Đặt `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills`, hoặc `channels.slack.commands.nativeSkills` để ghi đè theo nhà cung cấp (bool hoặc `"auto"`).
- `commands.bash` (mặc định `false`) cho phép `! <cmd>` chạy lệnh shell của host (`/bash <cmd>` là một alias; yêu cầu danh sách cho phép `tools.elevated`).
- `commands.bashForegroundMs` (mặc định `2000`) kiểm soát thời gian bash chờ trước khi chuyển sang chế độ nền (`0` chuyển ngay lập tức).
- `commands.config` (mặc định `false`) cho phép `/config` (đọc/ghi `openclaw.json`).
- `commands.mcp` (mặc định `false`) cho phép `/mcp` (đọc/ghi cấu hình MCP do OpenClaw quản lý dưới `mcp.servers`).
- `commands.plugins` (mặc định `false`) cho phép `/plugins` (khám phá/trạng thái plugin cộng với bật/tắt).
- `commands.debug` (mặc định `false`) cho phép `/debug` (ghi đè chỉ runtime).
- `commands.allowFrom` (tùy chọn) thiết lập danh sách cho phép theo nhà cung cấp cho ủy quyền lệnh. Khi được cấu hình, đây là nguồn ủy quyền duy nhất cho các lệnh và directives (danh sách cho phép kênh/cặp và `commands.useAccessGroups` bị bỏ qua). Sử dụng `"*"` cho mặc định toàn cầu; các khóa cụ thể nhà cung cấp ghi đè nó.
- `commands.useAccessGroups` (mặc định `true`) thực thi danh sách cho phép/chính sách cho các lệnh khi `commands.allowFrom` không được thiết lập.

## Danh sách lệnh

Văn bản + native (khi được bật):

- `/help`
- `/commands`
- `/skill <name> [input]` (chạy một skill theo tên)
- `/status` (hiển thị trạng thái hiện tại; bao gồm sử dụng/hạn ngạch của nhà cung cấp mô hình hiện tại khi có sẵn)
- `/allowlist` (liệt kê/thêm/xóa các mục danh sách cho phép)
- `/approve <id> allow-once|allow-always|deny` (giải quyết các yêu cầu phê duyệt exec)
- `/context [list|detail|json]` (giải thích “context”; `detail` hiển thị kích thước theo tệp + công cụ + skill + hệ thống)
- `/btw <question>` (đặt câu hỏi phụ tạm thời về phiên hiện tại mà không thay đổi ngữ cảnh phiên trong tương lai; xem [/tools/btw](/tools/btw))
- `/export-session [path]` (alias: `/export`) (xuất phiên hiện tại sang HTML với toàn bộ hệ thống)
- `/whoami` (hiển thị id người gửi của bạn; alias: `/id`)
- `/session idle <duration|off>` (quản lý tự động không tập trung khi không hoạt động cho các liên kết luồng tập trung)
- `/session max-age <duration|off>` (quản lý tự động không tập trung khi đạt tuổi tối đa cho các liên kết luồng tập trung)
- `/subagents list|kill|log|info|send|steer|spawn` (kiểm tra, điều khiển, hoặc tạo các phiên bản sub-agent cho phiên hiện tại)
- `/acp spawn|cancel|steer|close|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|sessions` (kiểm tra và điều khiển các phiên runtime ACP)
- `/agents` (liệt kê các agent liên kết luồng cho phiên này)
- `/focus <target>` (Discord: liên kết luồng này, hoặc một luồng mới, với một mục tiêu phiên/subagent)
- `/unfocus` (Discord: xóa liên kết luồng hiện tại)
- `/kill <id|#|all>` (ngay lập tức hủy bỏ một hoặc tất cả các sub-agent đang chạy cho phiên này; không có thông báo xác nhận)
- `/steer <id|#> <message>` (điều khiển một sub-agent đang chạy ngay lập tức: trong khi chạy khi có thể, nếu không thì hủy công việc hiện tại và khởi động lại với thông điệp điều khiển)
- `/tell <id|#> <message>` (alias cho `/steer`)
- `/config show|get|set|unset` (lưu cấu hình vào đĩa, chỉ dành cho chủ sở hữu; yêu cầu `commands.config: true`)
- `/mcp show|get|set|unset` (quản lý cấu hình máy chủ MCP của OpenClaw, chỉ dành cho chủ sở hữu; yêu cầu `commands.mcp: true`)
- `/plugins list|show|get|enable|disable` (kiểm tra các plugin đã phát hiện và bật/tắt, chỉ dành cho chủ sở hữu khi ghi; yêu cầu `commands.plugins: true`)
- `/debug show|set|unset|reset` (ghi đè runtime, chỉ dành cho chủ sở hữu; yêu cầu `commands.debug: true`)
- `/usage off|tokens|full|cost` (chân trang sử dụng mỗi phản hồi hoặc tóm tắt chi phí cục bộ)
- `/tts off|always|inbound|tagged|status|provider|limit|summary|audio` (kiểm soát TTS; xem [/tts](/tools/tts))
  - Discord: lệnh native là `/voice` (Discord dành riêng `/tts`); văn bản `/tts` vẫn hoạt động.
- `/stop`
- `/restart`
- `/dock-telegram` (alias: `/dock_telegram`) (chuyển đổi trả lời sang Telegram)
- `/dock-discord` (alias: `/dock_discord`) (chuyển đổi trả lời sang Discord)
- `/dock-slack` (alias: `/dock_slack`) (chuyển đổi trả lời sang Slack)
- `/activation mention|always` (chỉ nhóm)
- `/send on|off|inherit` (chỉ dành cho chủ sở hữu)
- `/reset` hoặc `/new [model]` (gợi ý mô hình tùy chọn; phần còn lại được chuyển qua)
- `/think <off|minimal|low|medium|high|xhigh>` (lựa chọn động theo mô hình/nhà cung cấp; alias: `/thinking`, `/t`)
- `/fast status|on|off` (bỏ qua arg hiển thị trạng thái chế độ nhanh hiện tại)
- `/verbose on|full|off` (alias: `/v`)
- `/reasoning on|off|stream` (alias: `/reason`; khi bật, gửi một tin nhắn riêng biệt có tiền tố `Reasoning:`; `stream` = chỉ bản nháp Telegram)
- `/elevated on|off|ask|full` (alias: `/elev`; `full` bỏ qua phê duyệt exec)
- `/exec host=<sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` (gửi `/exec` để hiển thị hiện tại)
- `/model <name>` (alias: `/models`; hoặc `/<alias>` từ `agents.defaults.models.*.alias`)
- `/queue <mode>` (cộng với các tùy chọn như `debounce:2s cap:25 drop:summarize`; gửi `/queue` để xem cài đặt hiện tại)
- `/bash <command>` (chỉ dành cho host; alias cho `! <command>`; yêu cầu `commands.bash: true` + danh sách cho phép `tools.elevated`)

Chỉ văn bản:

- `/compact [instructions]` (xem [/concepts/compaction](/concepts/compaction))
- `! <command>` (chỉ dành cho host; một lần một lệnh; sử dụng `!poll` + `!stop` cho các công việc chạy lâu)
- `!poll` (kiểm tra đầu ra / trạng thái; chấp nhận `sessionId` tùy chọn; `/bash poll` cũng hoạt động)
- `!stop` (dừng công việc bash đang chạy; chấp nhận `sessionId` tùy chọn; `/bash stop` cũng hoạt động)

Ghi chú:

- Các lệnh chấp nhận một `:` tùy chọn giữa lệnh và tham số (ví dụ: `/think: high`, `/send: on`, `/help:`).
- `/new <model>` chấp nhận một alias mô hình, `provider/model`, hoặc tên nhà cung cấp (khớp mờ); nếu không khớp, văn bản được coi là nội dung tin nhắn.
- Để có phân tích chi tiết sử dụng nhà cung cấp, sử dụng `openclaw status --usage`.
- `/allowlist add|remove` yêu cầu `commands.config=true` và tuân theo `configWrites` của kênh.
- Trong các kênh nhiều tài khoản, `/allowlist --account <id>` và `/config set channels.<provider>.accounts.<id>...` cũng tuân theo `configWrites` của tài khoản mục tiêu.
- `/usage` kiểm soát chân trang sử dụng mỗi phản hồi; `/usage cost` in ra tóm tắt chi phí cục bộ từ nhật ký phiên OpenClaw.
- `/restart` được bật theo mặc định; đặt `commands.restart: false` để tắt nó.
- Lệnh native chỉ dành cho Discord: `/vc join|leave|status` kiểm soát các kênh thoại (yêu cầu `channels.discord.voice` và lệnh native; không có sẵn dưới dạng văn bản).
- Các lệnh liên kết luồng của Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) yêu cầu các liên kết luồng hiệu quả được bật (`session.threadBindings.enabled` và/hoặc `channels.discord.threadBindings.enabled`).
- Tham khảo lệnh ACP và hành vi runtime: [ACP Agents](/tools/acp-agents).
- `/verbose` dành cho gỡ lỗi và tăng cường hiển thị; giữ nó **tắt** trong sử dụng bình thường.
- `/fast on|off` duy trì một ghi đè phiên. Sử dụng tùy chọn `inherit` của Giao diện người dùng Sessions để xóa nó và quay lại mặc định cấu hình.
- Tóm tắt lỗi công cụ vẫn được hiển thị khi có liên quan, nhưng văn bản lỗi chi tiết chỉ được bao gồm khi `/verbose` là `on` hoặc `full`.
- `/reasoning` (và `/verbose`) có rủi ro trong cài đặt nhóm: chúng có thể tiết lộ lý do nội bộ hoặc đầu ra công cụ mà bạn không muốn tiết lộ. Nên để chúng tắt, đặc biệt là trong các cuộc trò chuyện nhóm.
- **Đường dẫn nhanh:** các tin nhắn chỉ có lệnh từ người gửi được cho phép được xử lý ngay lập tức (bỏ qua hàng đợi + mô hình).
- **Nhóm đề cập:** các tin nhắn chỉ có lệnh từ người gửi được cho phép bỏ qua yêu cầu đề cập.
- **Phím tắt nội tuyến (chỉ dành cho người gửi được cho phép):** một số lệnh cũng hoạt động khi được nhúng trong một tin nhắn thông thường và bị loại bỏ trước khi mô hình xử lý phần văn bản còn lại.
  - Ví dụ: `hey /status` kích hoạt một phản hồi trạng thái, và phần văn bản còn lại tiếp tục qua luồng thông thường.
- Hiện tại: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Các tin nhắn chỉ có lệnh không được ủy quyền bị bỏ qua một cách im lặng, và các token `/...` nội tuyến được xử lý như văn bản thông thường.
- **Lệnh skill:** các skill có thể được người dùng gọi được hiển thị dưới dạng lệnh slash. Tên được làm sạch thành `a-z0-9_` (tối đa 32 ký tự); các xung đột nhận hậu tố số (ví dụ: `_2`).
  - `/skill <name> [input]` chạy một skill theo tên (hữu ích khi giới hạn lệnh native ngăn cản các lệnh theo skill).
  - Theo mặc định, các lệnh skill được chuyển tiếp đến mô hình như một yêu cầu thông thường.
  - Các skill có thể tùy chọn khai báo `command-dispatch: tool` để định tuyến lệnh trực tiếp đến một công cụ (xác định, không có mô hình).
  - Ví dụ: `/prose` (plugin OpenProse) — xem [OpenProse](/prose).
- **Tham số lệnh native:** Discord sử dụng tự động hoàn thành cho các tùy chọn động (và menu nút khi bạn bỏ qua các tham số bắt buộc). Telegram và Slack hiển thị một menu nút khi một lệnh hỗ trợ các lựa chọn và bạn bỏ qua tham số.

## Bề mặt sử dụng (hiển thị ở đâu)

- **Sử dụng/hạn ngạch nhà cung cấp** (ví dụ: “Claude 80% còn lại”) xuất hiện trong `/status` cho nhà cung cấp mô hình hiện tại khi theo dõi sử dụng được bật.
- **Token/chi phí mỗi phản hồi** được kiểm soát bởi `/usage off|tokens|full` (được đính kèm vào các phản hồi thông thường).
- `/model status` liên quan đến **mô hình/xác thực/điểm cuối**, không phải sử dụng.

## Lựa chọn mô hình (`/model`)

`/model` được triển khai dưới dạng một directive.

Ví dụ:

```
/model
/model list
/model 3
/model openai/gpt-5.2
/model opus@anthropic:default
/model status
```

Ghi chú:

- `/model` và `/model list` hiển thị một bộ chọn nhỏ gọn, được đánh số (gia đình mô hình + nhà cung cấp có sẵn).
- Trên Discord, `/model` và `/models` mở một bộ chọn tương tác với các menu thả xuống nhà cung cấp và mô hình cộng với một bước Gửi.
- `/model <#>` chọn từ bộ chọn đó (và ưu tiên nhà cung cấp hiện tại khi có thể).
- `/model status` hiển thị chế độ xem chi tiết, bao gồm điểm cuối nhà cung cấp được cấu hình (`baseUrl`) và chế độ API (`api`) khi có sẵn.

## Ghi đè gỡ lỗi

`/debug` cho phép bạn thiết lập các ghi đè cấu hình **chỉ runtime** (bộ nhớ, không phải đĩa). Chỉ dành cho chủ sở hữu. Bị tắt theo mặc định; bật với `commands.debug: true`.

Ví dụ:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Ghi chú:

- Các ghi đè áp dụng ngay lập tức cho các lần đọc cấu hình mới, nhưng **không** ghi vào `openclaw.json`.
- Sử dụng `/debug reset` để xóa tất cả các ghi đè và quay lại cấu hình trên đĩa.

## Cập nhật cấu hình

`/config` ghi vào cấu hình trên đĩa của bạn (`openclaw.json`). Chỉ dành cho chủ sở hữu. Bị tắt theo mặc định; bật với `commands.config: true`.

Ví dụ:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Ghi chú:

- Cấu hình được xác thực trước khi ghi; các thay đổi không hợp lệ bị từ chối.
- Các cập nhật `/config` duy trì qua các lần khởi động lại.

## Cập nhật MCP

`/mcp` ghi định nghĩa máy chủ MCP do OpenClaw quản lý dưới `mcp.servers`. Chỉ dành cho chủ sở hữu. Bị tắt theo mặc định; bật với `commands.mcp: true`.

Ví dụ:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Ghi chú:

- `/mcp` lưu cấu hình trong cấu hình OpenClaw, không phải cài đặt dự án do Pi sở hữu.
- Các bộ điều hợp runtime quyết định các phương tiện nào thực sự có thể thực thi.

## Cập nhật Plugin

`/plugins` cho phép các nhà vận hành kiểm tra các plugin đã phát hiện và bật/tắt trong cấu hình. Các luồng chỉ đọc có thể sử dụng `/plugin` làm alias. Bị tắt theo mặc định; bật với `commands.plugins: true`.

Ví dụ:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Ghi chú:

- `/plugins list` và `/plugins show` sử dụng khám phá plugin thực tế chống lại không gian làm việc hiện tại cộng với cấu hình trên đĩa.
- `/plugins enable|disable` chỉ cập nhật cấu hình plugin; nó không cài đặt hoặc gỡ cài đặt plugin.
- Sau khi thay đổi bật/tắt, khởi động lại gateway để áp dụng chúng.

## Ghi chú bề mặt

- **Lệnh văn bản** chạy trong phiên chat thông thường (DMs chia sẻ `main`, các nhóm có phiên riêng).
- **Lệnh native** sử dụng các phiên cách ly:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (tiền tố có thể cấu hình qua `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (nhắm mục tiêu phiên chat qua `CommandTargetSessionKey`)
- **`/stop`** nhắm mục tiêu phiên chat đang hoạt động để có thể hủy bỏ chạy hiện tại.
- **Slack:** `channels.slack.slashCommand` vẫn được hỗ trợ cho một lệnh kiểu `/openclaw`. Nếu bạn bật `commands.native`, bạn phải tạo một lệnh slash Slack cho mỗi lệnh tích hợp (cùng tên với `/help`). Menu tham số lệnh cho Slack được cung cấp dưới dạng nút Block Kit tạm thời.
  - Ngoại lệ native Slack: đăng ký `/agentstatus` (không phải `/status`) vì Slack dành riêng `/status`. Văn bản `/status` vẫn hoạt động trong tin nhắn Slack.

## Câu hỏi phụ BTW

`/btw` là một **câu hỏi phụ** nhanh về phiên hiện tại.

Không giống như chat thông thường:

- nó sử dụng phiên hiện tại làm ngữ cảnh nền,
- nó chạy như một cuộc gọi **một lần không công cụ** riêng biệt,
- nó không thay đổi ngữ cảnh phiên trong tương lai,
- nó không được ghi vào lịch sử phiên,
- nó được cung cấp dưới dạng kết quả phụ trực tiếp thay vì một tin nhắn trợ lý thông thường.

Điều đó làm cho `/btw` hữu ích khi bạn muốn một sự làm rõ tạm thời trong khi nhiệm vụ chính vẫn tiếp tục.

Ví dụ:

```text
/btw chúng ta đang làm gì bây giờ?
```

Xem [Câu hỏi phụ BTW](/tools/btw) để biết hành vi đầy đủ và chi tiết UX khách hàng.

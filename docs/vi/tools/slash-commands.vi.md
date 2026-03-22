---
summary: "Slash commands: text vs native, cấu hình, và các lệnh hỗ trợ"
read_when:
  - Sử dụng hoặc cấu hình lệnh chat
  - Debug routing lệnh hoặc quyền truy cập
title: "Slash Commands"
---

# Slash commands

Gateway xử lý các lệnh. Hầu hết lệnh phải gửi dưới dạng tin nhắn **độc lập** bắt đầu bằng `/`. Lệnh bash chỉ host dùng `! <cmd>` (với `/bash <cmd>` là alias).

Có hai hệ thống liên quan:

- **Commands**: tin nhắn độc lập `/...`.
- **Directives**: `/think`, `/fast`, `/verbose`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Directives bị loại bỏ khỏi tin nhắn trước khi model thấy.
  - Trong tin nhắn chat bình thường (không chỉ directive), chúng được xem như "inline hints" và **không** duy trì cài đặt session.
  - Trong tin nhắn chỉ có directive, chúng duy trì session và phản hồi với xác nhận.
  - Directives chỉ áp dụng cho **senders được ủy quyền**. Nếu `commands.allowFrom` được đặt, đây là allowlist duy nhất được dùng; nếu không, ủy quyền đến từ allowlists/pairing của channel cộng với `commands.useAccessGroups`. Senders không được ủy quyền thấy directives như văn bản thường.

Cũng có một số **inline shortcuts** (chỉ senders được ủy quyền/allowlist): `/help`, `/commands`, `/status`, `/whoami` (`/id`). Chúng chạy ngay lập tức, bị loại bỏ trước khi model thấy tin nhắn, và văn bản còn lại tiếp tục qua luồng bình thường.

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
  - Trên các nền tảng không có lệnh native (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), lệnh text vẫn hoạt động ngay cả khi đặt thành `false`.
- `commands.native` (mặc định `"auto"`) đăng ký lệnh native.
  - Auto: bật cho Discord/Telegram; tắt cho Slack (cho đến khi thêm slash commands); bỏ qua cho providers không hỗ trợ native.
  - Đặt `channels.discord.commands.native`, `channels.telegram.commands.native`, hoặc `channels.slack.commands.native` để ghi đè theo provider (bool hoặc `"auto"`).
  - `false` xóa các lệnh đã đăng ký trước đó trên Discord/Telegram khi khởi động. Lệnh Slack được quản lý trong ứng dụng Slack và không tự động xóa.
- `commands.nativeSkills` (mặc định `"auto"`) đăng ký lệnh **skill** native khi được hỗ trợ.
  - Auto: bật cho Discord/Telegram; tắt cho Slack (Slack yêu cầu tạo một slash command cho mỗi skill).
  - Đặt `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills`, hoặc `channels.slack.commands.nativeSkills` để ghi đè theo provider (bool hoặc `"auto"`).
- `commands.bash` (mặc định `false`) cho phép `! <cmd>` chạy lệnh shell host (`/bash <cmd>` là alias; yêu cầu allowlists `tools.elevated`).
- `commands.bashForegroundMs` (mặc định `2000`) kiểm soát thời gian bash chờ trước khi chuyển sang chế độ nền (`0` chuyển ngay lập tức).
- `commands.config` (mặc định `false`) cho phép `/config` (đọc/ghi `openclaw.json`).
- `commands.mcp` (mặc định `false`) cho phép `/mcp` (đọc/ghi cấu hình MCP do OpenClaw quản lý dưới `mcp.servers`).
- `commands.plugins` (mặc định `false`) cho phép `/plugins` (khám phá/trạng thái plugin cộng với bật/tắt).
- `commands.debug` (mặc định `false`) cho phép `/debug` (ghi đè chỉ runtime).
- `commands.allowFrom` (tùy chọn) đặt một allowlist theo provider cho ủy quyền lệnh. Khi được cấu hình, đây là nguồn ủy quyền duy nhất cho lệnh và directives (allowlists/pairing của channel và `commands.useAccessGroups` bị bỏ qua). Sử dụng `"*"` cho mặc định toàn cầu; các khóa cụ thể của provider ghi đè nó.
- `commands.useAccessGroups` (mặc định `true`) thực thi allowlists/chính sách cho lệnh khi `commands.allowFrom` không được đặt.

## Danh sách lệnh

Text + native (khi bật):

- `/help`
- `/commands`
- `/skill <name> [input]` (chạy một skill theo tên)
- `/status` (hiển thị trạng thái hiện tại; bao gồm sử dụng/quota của provider model hiện tại khi có sẵn)
- `/allowlist` (liệt kê/thêm/xóa mục allowlist)
- `/approve <id> allow-once|allow-always|deny` (giải quyết yêu cầu phê duyệt exec)
- `/context [list|detail|json]` (giải thích “context”; `detail` hiển thị kích thước prompt theo file + tool + skill + hệ thống)
- `/btw <question>` (hỏi một câu hỏi phụ tạm thời về session hiện tại mà không thay đổi context session tương lai; xem [/tools/btw](/tools/btw))
- `/export-session [path]` (alias: `/export`) (xuất session hiện tại sang HTML với prompt hệ thống đầy đủ)
- `/whoami` (hiển thị sender id của bạn; alias: `/id`)
- `/session idle <duration|off>` (quản lý tự động unfocus khi không hoạt động cho ràng buộc thread tập trung)
- `/session max-age <duration|off>` (quản lý tự động unfocus khi đạt max-age cho ràng buộc thread tập trung)
- `/subagents list|kill|log|info|send|steer|spawn` (kiểm tra, điều khiển, hoặc spawn sub-agent cho session hiện tại)
- `/acp spawn|cancel|steer|close|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|sessions` (kiểm tra và điều khiển session runtime ACP)
- `/agents` (liệt kê agents ràng buộc thread cho session này)
- `/focus <target>` (Discord: ràng buộc thread này, hoặc một thread mới, vào một session/subagent target)
- `/unfocus` (Discord: xóa ràng buộc thread hiện tại)
- `/kill <id|#|all>` (ngay lập tức hủy một hoặc tất cả sub-agents đang chạy cho session này; không có tin nhắn xác nhận)
- `/steer <id|#> <message>` (điều khiển một sub-agent đang chạy ngay lập tức: trong quá trình khi có thể, nếu không thì hủy công việc hiện tại và khởi động lại với tin nhắn điều khiển)
- `/tell <id|#> <message>` (alias cho `/steer`)
- `/config show|get|set|unset` (lưu cấu hình vào đĩa, chỉ chủ sở hữu; yêu cầu `commands.config: true`)
- `/mcp show|get|set|unset` (quản lý cấu hình server MCP của OpenClaw, chỉ chủ sở hữu; yêu cầu `commands.mcp: true`)
- `/plugins list|show|get|enable|disable` (kiểm tra plugins đã phát hiện và bật/tắt, chỉ chủ sở hữu cho ghi; yêu cầu `commands.plugins: true`)
- `/debug show|set|unset|reset` (ghi đè runtime, chỉ chủ sở hữu; yêu cầu `commands.debug: true`)
- `/usage off|tokens|full|cost` (footer sử dụng per-response hoặc tóm tắt chi phí local)
- `/tts off|always|inbound|tagged|status|provider|limit|summary|audio` (kiểm soát TTS; xem [/tts](/tools/tts))
  - Discord: lệnh native là `/voice` (Discord giữ `/tts`); text `/tts` vẫn hoạt động.
- `/stop`
- `/restart`
- `/dock-telegram` (alias: `/dock_telegram`) (chuyển phản hồi sang Telegram)
- `/dock-discord` (alias: `/dock_discord`) (chuyển phản hồi sang Discord)
- `/dock-slack` (alias: `/dock_slack`) (chuyển phản hồi sang Slack)
- `/activation mention|always` (chỉ nhóm)
- `/send on|off|inherit` (chỉ chủ sở hữu)
- `/reset` hoặc `/new [model]` (gợi ý model tùy chọn; phần còn lại được truyền qua)
- `/think <off|minimal|low|medium|high|xhigh>` (lựa chọn động theo model/provider; alias: `/thinking`, `/t`)
- `/fast status|on|off` (bỏ qua arg hiển thị trạng thái fast-mode hiện tại)
- `/verbose on|full|off` (alias: `/v`)
- `/reasoning on|off|stream` (alias: `/reason`; khi bật, gửi một tin nhắn riêng biệt có tiền tố `Reasoning:`; `stream` = chỉ Telegram draft)
- `/elevated on|off|ask|full` (alias: `/elev`; `full` bỏ qua phê duyệt exec)
- `/exec host=<sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` (gửi `/exec` để hiển thị hiện tại)
- `/model <name>` (alias: `/models`; hoặc `/<alias>` từ `agents.defaults.models.*.alias`)
- `/queue <mode>` (cộng với các tùy chọn như `debounce:2s cap:25 drop:summarize`; gửi `/queue` để xem cài đặt hiện tại)
- `/bash <command>` (chỉ host; alias cho `! <command>`; yêu cầu `commands.bash: true` + allowlists `tools.elevated`)

Chỉ text:

- `/compact [instructions]` (xem [/concepts/compaction](/concepts/compaction))
- `! <command>` (chỉ host; một lần một; sử dụng `!poll` + `!stop` cho công việc chạy dài)
- `!poll` (kiểm tra output / trạng thái; chấp nhận `sessionId` tùy chọn; `/bash poll` cũng hoạt động)
- `!stop` (dừng công việc bash đang chạy; chấp nhận `sessionId` tùy chọn; `/bash stop` cũng hoạt động)

Ghi chú:

- Lệnh chấp nhận `:` tùy chọn giữa lệnh và args (ví dụ: `/think: high`, `/send: on`, `/help:`).
- `/new <model>` chấp nhận alias model, `provider/model`, hoặc tên provider (khớp mờ); nếu không khớp, văn bản được xem như nội dung tin nhắn.
- Để có phân tích sử dụng provider đầy đủ, sử dụng `openclaw status --usage`.
- `/allowlist add|remove` yêu cầu `commands.config=true` và tuân theo `configWrites` của channel.
- Trong các kênh nhiều tài khoản, `/allowlist --account <id>` và `/config set channels.<provider>.accounts.<id>...` cũng tuân theo `configWrites` của tài khoản mục tiêu.
- `/usage` kiểm soát footer sử dụng per-response; `/usage cost` in ra tóm tắt chi phí local từ logs session OpenClaw.
- `/restart` được bật mặc định; đặt `commands.restart: false` để tắt nó.
- Lệnh native chỉ Discord: `/vc join|leave|status` kiểm soát kênh voice (yêu cầu `channels.discord.voice` và lệnh native; không có sẵn dưới dạng text).
- Lệnh ràng buộc thread Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) yêu cầu ràng buộc thread hiệu quả được bật (`session.threadBindings.enabled` và/hoặc `channels.discord.threadBindings.enabled`).
- Tham khảo lệnh ACP và hành vi runtime: [ACP Agents](/tools/acp-agents).
- `/verbose` dành cho debug và tăng cường hiển thị; giữ **tắt** trong sử dụng bình thường.
- `/fast on|off` duy trì ghi đè session. Sử dụng tùy chọn `inherit` của Sessions UI để xóa nó và quay lại mặc định cấu hình.
- Tóm tắt lỗi công cụ vẫn được hiển thị khi cần thiết, nhưng văn bản lỗi chi tiết chỉ được bao gồm khi `/verbose` là `on` hoặc `full`.
- `/reasoning` (và `/verbose`) có rủi ro trong cài đặt nhóm: chúng có thể tiết lộ lý do nội bộ hoặc output công cụ mà bạn không muốn lộ. Nên để tắt, đặc biệt trong chat nhóm.
- **Fast path:** tin nhắn chỉ lệnh từ senders được allowlist xử lý ngay lập tức (bỏ qua queue + model).
- **Group mention gating:** tin nhắn chỉ lệnh từ senders được allowlist bỏ qua yêu cầu mention.
- **Inline shortcuts (chỉ senders được allowlist):** một số lệnh cũng hoạt động khi nhúng trong tin nhắn bình thường và bị loại bỏ trước khi model thấy văn bản còn lại.
  - Ví dụ: `hey /status` kích hoạt phản hồi trạng thái, và văn bản còn lại tiếp tục qua luồng bình thường.
- Hiện tại: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Tin nhắn chỉ lệnh không được ủy quyền bị bỏ qua im lặng, và tokens `/...` inline được xem như văn bản thường.
- **Skill commands:** skills `user-invocable` được hiển thị dưới dạng slash commands. Tên được chuẩn hóa thành `a-z0-9_` (tối đa 32 ký tự); xung đột có hậu tố số (ví dụ: `_2`).
  - `/skill <name> [input]` chạy một skill theo tên (hữu ích khi giới hạn lệnh native ngăn cản lệnh per-skill).
  - Theo mặc định, lệnh skill được chuyển tiếp đến model như một yêu cầu bình thường.
  - Skills có thể tùy chọn khai báo `command-dispatch: tool` để định tuyến lệnh trực tiếp đến một công cụ (xác định, không model).
  - Ví dụ: `/prose` (plugin OpenProse) — xem [OpenProse](/prose).
- **Native command arguments:** Discord sử dụng autocomplete cho các tùy chọn động (và menu nút khi bạn bỏ qua args bắt buộc). Telegram và Slack hiển thị menu nút khi một lệnh hỗ trợ lựa chọn và bạn bỏ qua arg.

## Usage surfaces (hiển thị ở đâu)

- **Provider usage/quota** (ví dụ: “Claude 80% left”) hiển thị trong `/status` cho provider model hiện tại khi theo dõi sử dụng được bật.
- **Per-response tokens/cost** được kiểm soát bởi `/usage off|tokens|full` (được thêm vào phản hồi bình thường).
- `/model status` là về **models/auth/endpoints**, không phải sử dụng.

## Model selection (`/model`)

`/model` được triển khai dưới dạng directive.

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

- `/model` và `/model list` hiển thị một picker nhỏ gọn, có số (gia đình model + providers có sẵn).
- Trên Discord, `/model` và `/models` mở một picker tương tác với dropdowns provider và model cộng với bước Submit.
- `/model <#>` chọn từ picker đó (và ưu tiên provider hiện tại khi có thể).
- `/model status` hiển thị chi tiết, bao gồm endpoint provider cấu hình (`baseUrl`) và chế độ API (`api`) khi có sẵn.

## Debug overrides

`/debug` cho phép bạn đặt ghi đè cấu hình **chỉ runtime** (trong bộ nhớ, không trên đĩa). Chỉ chủ sở hữu. Tắt mặc định; bật với `commands.debug: true`.

Ví dụ:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Ghi chú:

- Ghi đè áp dụng ngay lập tức cho các lần đọc cấu hình mới, nhưng **không** ghi vào `openclaw.json`.
- Sử dụng `/debug reset` để xóa tất cả ghi đè và quay lại cấu hình trên đĩa.

## Cập nhật cấu hình

`/config` ghi vào cấu hình trên đĩa (`openclaw.json`). Chỉ chủ sở hữu. Tắt mặc định; bật với `commands.config: true`.

Ví dụ:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Ghi chú:

- Cấu hình được xác thực trước khi ghi; thay đổi không hợp lệ bị từ chối.
- Cập nhật `/config` duy trì qua các lần khởi động lại.

## Cập nhật MCP

`/mcp` ghi định nghĩa server MCP do OpenClaw quản lý dưới `mcp.servers`. Chỉ chủ sở hữu. Tắt mặc định; bật với `commands.mcp: true`.

Ví dụ:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Ghi chú:

- `/mcp` lưu cấu hình trong cấu hình OpenClaw, không phải cài đặt dự án do Pi sở hữu.
- Bộ điều hợp runtime quyết định các phương tiện nào thực sự có thể thực thi.

## Cập nhật Plugin

`/plugins` cho phép operators kiểm tra plugins đã phát hiện và bật/tắt trong cấu hình. Luồng chỉ đọc có thể sử dụng `/plugin` làm alias. Tắt mặc định; bật với `commands.plugins: true`.

Ví dụ:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Ghi chú:

- `/plugins list` và `/plugins show` sử dụng khám phá plugin thực tế chống lại workspace hiện tại cộng với cấu hình trên đĩa.
- `/plugins enable|disable` chỉ cập nhật cấu hình plugin; nó không cài đặt hoặc gỡ cài đặt plugins.
- Sau khi thay đổi bật/tắt, khởi động lại gateway để áp dụng chúng.

## Ghi chú Surface

- **Text commands** chạy trong session chat bình thường (DMs chia sẻ `main`, nhóm có session riêng).
- **Native commands** sử dụng session cô lập:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefix có thể cấu hình qua `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (nhắm vào session chat qua `CommandTargetSessionKey`)
- **`/stop`** nhắm vào session chat đang hoạt động để có thể hủy chạy hiện tại.
- **Slack:** `channels.slack.slashCommand` vẫn được hỗ trợ cho một lệnh `/openclaw`-style duy nhất. Nếu bật `commands.native`, bạn phải tạo một lệnh slash Slack cho mỗi lệnh tích hợp (cùng tên với `/help`). Menu argument lệnh cho Slack được cung cấp dưới dạng nút Block Kit ephemeral.
  - Ngoại lệ native Slack: đăng ký `/agentstatus` (không phải `/status`) vì Slack giữ `/status`. Text `/status` vẫn hoạt động trong tin nhắn Slack.

## Câu hỏi phụ BTW

`/btw` là một **câu hỏi phụ** nhanh về session hiện tại.

Không giống như chat bình thường:

- nó sử dụng session hiện tại làm context nền,
- nó chạy như một cuộc gọi **không công cụ** một lần,
- nó không thay đổi context session tương lai,
- nó không được ghi vào lịch sử transcript,
- nó được gửi dưới dạng kết quả phụ trực tiếp thay vì tin nhắn trợ lý bình thường.

Điều đó làm cho `/btw` hữu ích khi bạn muốn một sự làm rõ tạm thời trong khi nhiệm vụ chính vẫn tiếp tục.

Ví dụ:

```text
/btw what are we doing right now?
```

Xem [BTW Side Questions](/tools/btw) để biết đầy đủ hành vi và chi tiết UX client.\n
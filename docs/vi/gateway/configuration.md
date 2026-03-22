---
summary: "Tổng quan cấu hình: các tác vụ phổ biến, thiết lập nhanh và liên kết đến tài liệu tham khảo đầy đủ"
read_when:
  - Thiết lập OpenClaw lần đầu tiên
  - Tìm kiếm các mẫu cấu hình phổ biến
  - Điều hướng đến các phần cấu hình cụ thể
title: "Cấu hình"
---

# Cấu hình

OpenClaw đọc file cấu hình tùy chọn dạng <Tooltip tip="JSON5 hỗ trợ chú thích và dấu phẩy cuối">**JSON5**</Tooltip> từ `~/.openclaw/openclaw.json`.

Nếu file này không tồn tại, OpenClaw sẽ sử dụng các giá trị mặc định an toàn. Các lý do phổ biến để thêm cấu hình:

- Kết nối các kênh và kiểm soát ai có thể nhắn tin cho bot
- Thiết lập mô hình, công cụ, sandboxing, hoặc tự động hóa (cron, hooks)
- Điều chỉnh phiên, phương tiện, mạng, hoặc giao diện người dùng

Xem [tài liệu tham khảo đầy đủ](/gateway/configuration-reference) cho mọi trường có sẵn.

<Tip>
**Mới với cấu hình?** Bắt đầu với `openclaw onboard` để thiết lập tương tác, hoặc tham khảo hướng dẫn [Ví dụ Cấu hình](/gateway/configuration-examples) để có các cấu hình hoàn chỉnh có thể sao chép.
</Tip>

## Cấu hình tối thiểu

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Chỉnh sửa cấu hình

<Tabs>
  <Tab title="Trình hướng dẫn tương tác">
    ```bash
    openclaw onboard       # quy trình onboarding đầy đủ
    openclaw configure     # trình hướng dẫn cấu hình
    ```
  </Tab>
  <Tab title="CLI (dòng lệnh ngắn)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Giao diện điều khiển">
    Mở [http://127.0.0.1:18789](http://127.0.0.1:18789) và sử dụng tab **Config**.
    Giao diện điều khiển hiển thị một form từ schema cấu hình, với một trình chỉnh sửa **Raw JSON** như một lối thoát.
  </Tab>
  <Tab title="Chỉnh sửa trực tiếp">
    Chỉnh sửa trực tiếp `~/.openclaw/openclaw.json`. Gateway sẽ theo dõi file và áp dụng thay đổi tự động (xem [tải lại nóng](#config-hot-reload)).
  </Tab>
</Tabs>

## Xác thực nghiêm ngặt

<Warning>
OpenClaw chỉ chấp nhận các cấu hình hoàn toàn khớp với schema. Các khóa không xác định, kiểu dữ liệu sai định dạng, hoặc giá trị không hợp lệ sẽ khiến Gateway **từ chối khởi động**. Ngoại lệ duy nhất ở cấp gốc là `$schema` (chuỗi), để các trình chỉnh sửa có thể đính kèm metadata JSON Schema.
</Warning>

Khi xác thực thất bại:

- Gateway không khởi động
- Chỉ các lệnh chẩn đoán hoạt động (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Chạy `openclaw doctor` để xem các vấn đề cụ thể
- Chạy `openclaw doctor --fix` (hoặc `--yes`) để áp dụng sửa chữa

## Các tác vụ phổ biến

<AccordionGroup>
  <Accordion title="Thiết lập một kênh (WhatsApp, Telegram, Discord, v.v.)">
    Mỗi kênh có phần cấu hình riêng dưới `channels.<provider>`. Xem trang kênh chuyên dụng để biết các bước thiết lập:

    - [WhatsApp](/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/channels/telegram) — `channels.telegram`
    - [Discord](/channels/discord) — `channels.discord`
    - [Slack](/channels/slack) — `channels.slack`
    - [Signal](/channels/signal) — `channels.signal`
    - [iMessage](/channels/imessage) — `channels.imessage`
    - [Google Chat](/channels/googlechat) — `channels.googlechat`
    - [Mattermost](/channels/mattermost) — `channels.mattermost`
    - [Microsoft Teams](/channels/msteams) — `channels.msteams`

    Tất cả các kênh đều chia sẻ cùng một mẫu chính sách DM:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // chỉ dành cho allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Chọn và cấu hình mô hình">
    Thiết lập mô hình chính và các mô hình dự phòng tùy chọn:

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.2"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.2": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` định nghĩa danh mục mô hình và hoạt động như danh sách cho phép cho `/model`.
    - Tham chiếu mô hình sử dụng định dạng `provider/model` (ví dụ: `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` kiểm soát việc giảm kích thước hình ảnh transcript/tool (mặc định `1200`); giá trị thấp hơn thường giảm sử dụng vision-token trong các lần chạy nhiều ảnh chụp màn hình.
    - Xem [Models CLI](/concepts/models) để chuyển đổi mô hình trong chat và [Model Failover](/concepts/model-failover) cho việc xoay vòng xác thực và hành vi dự phòng.
    - Đối với các nhà cung cấp tùy chỉnh/tự lưu trữ, xem [Custom providers](/gateway/configuration-reference#custom-providers-and-base-urls) trong tài liệu tham khảo.

  </Accordion>

  <Accordion title="Kiểm soát ai có thể nhắn tin cho bot">
    Quyền truy cập DM được kiểm soát theo từng kênh qua `dmPolicy`:

    - `"pairing"` (mặc định): người gửi không xác định nhận mã ghép đôi một lần để phê duyệt
    - `"allowlist"`: chỉ những người gửi trong `allowFrom` (hoặc cửa hàng cho phép ghép đôi)
    - `"open"`: cho phép tất cả DM đến (yêu cầu `allowFrom: ["*"]`)
    - `"disabled"`: bỏ qua tất cả DM

    Đối với nhóm, sử dụng `groupPolicy` + `groupAllowFrom` hoặc danh sách cho phép cụ thể cho từng kênh.

    Xem [tài liệu tham khảo đầy đủ](/gateway/configuration-reference#dm-and-group-access) để biết chi tiết theo từng kênh.

  </Accordion>

  <Accordion title="Thiết lập kiểm soát nhắc đến trong chat nhóm">
    Tin nhắn nhóm mặc định yêu cầu **nhắc đến**. Cấu hình mẫu theo từng agent:

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **Nhắc đến metadata**: nhắc đến @-native (WhatsApp nhấn để nhắc đến, Telegram @bot, v.v.)
    - **Mẫu văn bản**: mẫu regex an toàn trong `mentionPatterns`
    - Xem [tài liệu tham khảo đầy đủ](/gateway/configuration-reference#group-chat-mention-gating) để biết ghi đè theo từng kênh và chế độ tự chat.

  </Accordion>

  <Accordion title="Điều chỉnh giám sát sức khỏe kênh gateway">
    Kiểm soát mức độ tích cực của gateway khi khởi động lại các kênh có vẻ không hoạt động:

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - Đặt `gateway.channelHealthCheckMinutes: 0` để vô hiệu hóa khởi động lại giám sát sức khỏe toàn cầu.
    - `channelStaleEventThresholdMinutes` nên lớn hơn hoặc bằng khoảng thời gian kiểm tra.
    - Sử dụng `channels.<provider>.healthMonitor.enabled` hoặc `channels.<provider>.accounts.<id>.healthMonitor.enabled` để vô hiệu hóa tự động khởi động lại cho một kênh hoặc tài khoản mà không vô hiệu hóa giám sát toàn cầu.
    - Xem [Health Checks](/gateway/health) để gỡ lỗi hoạt động và [tài liệu tham khảo đầy đủ](/gateway/configuration-reference#gateway) cho tất cả các trường.

  </Accordion>

  <Accordion title="Cấu hình phiên và đặt lại">
    Phiên kiểm soát tính liên tục và cô lập của cuộc trò chuyện:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // khuyến nghị cho nhiều người dùng
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - `dmScope`: `main` (chia sẻ) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: mặc định toàn cầu cho định tuyến phiên ràng buộc theo luồng (Discord hỗ trợ `/focus`, `/unfocus`, `/agents`, `/session idle`, và `/session max-age`).
    - Xem [Quản lý phiên](/concepts/session) để biết phạm vi, liên kết danh tính, và chính sách gửi.
    - Xem [tài liệu tham khảo đầy đủ](/gateway/configuration-reference#session) cho tất cả các trường.

  </Accordion>

  <Accordion title="Kích hoạt sandboxing">
    Chạy các phiên agent trong các container Docker cô lập:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    Xây dựng hình ảnh trước: `scripts/sandbox-setup.sh`

    Xem [Sandboxing](/gateway/sandboxing) để biết hướng dẫn đầy đủ và [tài liệu tham khảo đầy đủ](/gateway/configuration-reference#agents-defaults-sandbox) cho tất cả các tùy chọn.

  </Accordion>

  <Accordion title="Kích hoạt đẩy dựa trên relay cho các bản dựng iOS chính thức">
    Đẩy dựa trên relay được cấu hình trong `openclaw.json`.

    Đặt điều này trong cấu hình gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Tùy chọn. Mặc định: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    Tương đương CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Điều này làm gì:

    - Cho phép gateway gửi `push.test`, wake nudges, và reconnect wakes thông qua relay bên ngoài.
    - Sử dụng một quyền gửi phạm vi đăng ký được chuyển tiếp bởi ứng dụng iOS đã ghép đôi. Gateway không cần một token relay toàn bộ triển khai.
    - Ràng buộc mỗi đăng ký dựa trên relay với danh tính gateway mà ứng dụng iOS đã ghép đôi, do đó một gateway khác không thể tái sử dụng đăng ký đã lưu trữ.
    - Giữ các bản dựng iOS cục bộ/thủ công trên APNs trực tiếp. Các gửi dựa trên relay chỉ áp dụng cho các bản dựng phân phối chính thức đã đăng ký thông qua relay.
    - Phải khớp với URL cơ sở relay được nhúng trong bản dựng iOS chính thức/TestFlight, để lưu lượng đăng ký và gửi đến cùng một triển khai relay.

    Quy trình từ đầu đến cuối:

    1. Cài đặt một bản dựng iOS chính thức/TestFlight đã được biên dịch với cùng URL cơ sở relay.
    2. Cấu hình `gateway.push.apns.relay.baseUrl` trên gateway.
    3. Ghép đôi ứng dụng iOS với gateway và để cả hai phiên node và operator kết nối.
    4. Ứng dụng iOS lấy danh tính gateway, đăng ký với relay sử dụng App Attest cộng với biên lai ứng dụng, và sau đó xuất bản payload `push.apns.register` dựa trên relay đến gateway đã ghép đôi.
    5. Gateway lưu trữ handle relay và quyền gửi, sau đó sử dụng chúng cho `push.test`, wake nudges, và reconnect wakes.

    Ghi chú hoạt động:

    - Nếu bạn chuyển ứng dụng iOS sang một gateway khác, kết nối lại ứng dụng để nó có thể xuất bản một đăng ký relay mới ràng buộc với gateway đó.
    - Nếu bạn phát hành một bản dựng iOS mới trỏ đến một triển khai relay khác, ứng dụng sẽ làm mới đăng ký relay đã lưu trữ thay vì tái sử dụng nguồn gốc relay cũ.

    Ghi chú tương thích:

    - `OPENCLAW_APNS_RELAY_BASE_URL` và `OPENCLAW_APNS_RELAY_TIMEOUT_MS` vẫn hoạt động như các ghi đè môi trường tạm thời.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` vẫn là một lối thoát phát triển chỉ dành cho loopback; không lưu trữ URL relay HTTP trong cấu hình.

    Xem [Ứng dụng iOS](/platforms/ios#relay-backed-push-for-official-builds) để biết quy trình từ đầu đến cuối và [Luồng xác thực và tin cậy](/platforms/ios#authentication-and-trust-flow) cho mô hình bảo mật relay.

  </Accordion>

  <Accordion title="Thiết lập heartbeat (kiểm tra định kỳ)">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`: chuỗi thời gian (`30m`, `2h`). Đặt `0m` để vô hiệu hóa.
    - `target`: `last` | `whatsapp` | `telegram` | `discord` | `none`
    - `directPolicy`: `allow` (mặc định) hoặc `block` cho các mục tiêu heartbeat kiểu DM
    - Xem [Heartbeat](/gateway/heartbeat) để biết hướng dẫn đầy đủ.

  </Accordion>

  <Accordion title="Cấu hình cron jobs">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2,
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: loại bỏ các phiên chạy cô lập đã hoàn thành khỏi `sessions.json` (mặc định `24h`; đặt `false` để vô hiệu hóa).
    - `runLog`: loại bỏ `cron/runs/<jobId>.jsonl` theo kích thước và số dòng giữ lại.
    - Xem [Cron jobs](/automation/cron-jobs) để biết tổng quan tính năng và ví dụ CLI.

  </Accordion>

  <Accordion title="Thiết lập webhooks (hooks)">
    Kích hoạt các điểm cuối webhook HTTP trên Gateway:

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    Ghi chú bảo mật:
    - Xem tất cả nội dung payload hook/webhook là đầu vào không đáng tin cậy.
    - Giữ các cờ bỏ qua nội dung không an toàn bị vô hiệu hóa (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) trừ khi thực hiện gỡ lỗi có phạm vi chặt chẽ.
    - Đối với các agent điều khiển bằng hook, ưu tiên các tầng mô hình hiện đại mạnh mẽ và chính sách công cụ nghiêm ngặt (ví dụ chỉ nhắn tin cộng với sandboxing nếu có thể).

    Xem [tài liệu tham khảo đầy đủ](/gateway/configuration-reference#hooks) cho tất cả các tùy chọn ánh xạ và tích hợp Gmail.

  </Accordion>

  <Accordion title="Cấu hình định tuyến đa agent">
    Chạy nhiều agent cô lập với các workspace và phiên riêng biệt:

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    Xem [Multi-Agent](/concepts/multi-agent) và [tài liệu tham khảo đầy đủ](/gateway/configuration-reference#multi-agent-routing) cho các quy tắc ràng buộc và hồ sơ truy cập theo từng agent.

  </Accordion>

  <Accordion title="Chia cấu hình thành nhiều file ($include)">
    Sử dụng `$include` để tổ chức các cấu hình lớn:

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **File đơn**: thay thế đối tượng chứa
    - **Mảng file**: hợp nhất sâu theo thứ tự (cái sau thắng)
    - **Khóa cùng cấp**: hợp nhất sau khi bao gồm (ghi đè giá trị đã bao gồm)
    - **Bao gồm lồng nhau**: hỗ trợ tối đa 10 cấp độ sâu
    - **Đường dẫn tương đối**: được giải quyết tương đối với file bao gồm
    - **Xử lý lỗi**: lỗi rõ ràng cho các file bị thiếu, lỗi phân tích cú pháp, và bao gồm vòng tròn

  </Accordion>
</AccordionGroup>

## Tải lại cấu hình nóng

Gateway theo dõi `~/.openclaw/openclaw.json` và áp dụng thay đổi tự động — không cần khởi động lại thủ công cho hầu hết các thiết lập.

### Chế độ tải lại

| Chế độ                | Hành vi                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------- |
| **`hybrid`** (mặc định) | Áp dụng nóng các thay đổi an toàn ngay lập tức. Tự động khởi động lại cho các thay đổi quan trọng. |
| **`hot`**             | Chỉ áp dụng nóng các thay đổi an toàn. Ghi nhật ký cảnh báo khi cần khởi động lại — bạn tự xử lý. |
| **`restart`**         | Khởi động lại Gateway trên bất kỳ thay đổi cấu hình nào, an toàn hay không.              |
| **`off`**             | Vô hiệu hóa theo dõi file. Các thay đổi có hiệu lực khi khởi động lại thủ công tiếp theo. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Cái gì áp dụng nóng và cái gì cần khởi động lại

Hầu hết các trường áp dụng nóng mà không cần downtime. Trong chế độ `hybrid`, các thay đổi yêu cầu khởi động lại được xử lý tự động.

| Danh mục             | Trường                                                                | Cần khởi động lại? |
| -------------------- | --------------------------------------------------------------------- | ------------------ |
| Kênh                 | `channels.*`, `web` (WhatsApp) — tất cả các kênh tích hợp và mở rộng  | Không              |
| Agent & mô hình      | `agent`, `agents`, `models`, `routing`                                | Không              |
| Tự động hóa          | `hooks`, `cron`, `agent.heartbeat`                                    | Không              |
| Phiên & tin nhắn     | `session`, `messages`                                                 | Không              |
| Công cụ & phương tiện | `tools`, `browser`, `skills`, `audio`, `talk`                        | Không              |
| Giao diện & khác     | `ui`, `logging`, `identity`, `bindings`                               | Không              |
| Máy chủ Gateway      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)                  | **Có**             |
| Hạ tầng              | `discovery`, `canvasHost`, `plugins`                                  | **Có**             |

<Note>
`gateway.reload` và `gateway.remote` là ngoại lệ — thay đổi chúng không kích hoạt khởi động lại.
</Note>

## Cấu hình RPC (cập nhật lập trình)

<Note>
Các RPC ghi điều khiển (`config.apply`, `config.patch`, `update.run`) bị giới hạn tốc độ **3 yêu cầu mỗi 60 giây** cho mỗi `deviceId+clientIp`. Khi bị giới hạn, RPC trả về `UNAVAILABLE` với `retryAfterMs`.
</Note>

<AccordionGroup>
  <Accordion title="config.apply (thay thế toàn bộ)">
    Xác thực + ghi toàn bộ cấu hình và khởi động lại Gateway trong một bước.

    <Warning>
    `config.apply` thay thế **toàn bộ cấu hình**. Sử dụng `config.patch` cho các cập nhật từng phần, hoặc `openclaw config set` cho các khóa đơn lẻ.
    </Warning>

    Tham số:

    - `raw` (chuỗi) — payload JSON5 cho toàn bộ cấu hình
    - `baseHash` (tùy chọn) — hash cấu hình từ `config.get` (yêu cầu khi cấu hình tồn tại)
    - `sessionKey` (tùy chọn) — khóa phiên cho ping thức dậy sau khởi động lại
    - `note` (tùy chọn) — ghi chú cho sentinel khởi động lại
    - `restartDelayMs` (tùy chọn) — độ trễ trước khi khởi động lại (mặc định 2000)

    Yêu cầu khởi động lại được hợp nhất trong khi một yêu cầu đã đang chờ/xử lý, và một khoảng thời gian làm mát 30 giây áp dụng giữa các chu kỳ khởi động lại.

    ```bash
    openclaw gateway call config.get --params '{}'  # lấy payload.hash
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (cập nhật từng phần)">
    Hợp nhất một cập nhật từng phần vào cấu hình hiện có (ngữ nghĩa JSON merge patch):

    - Các đối tượng hợp nhất đệ quy
    - `null` xóa một khóa
    - Mảng thay thế

    Tham số:

    - `raw` (chuỗi) — JSON5 chỉ với các khóa cần thay đổi
    - `baseHash` (bắt buộc) — hash cấu hình từ `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — giống như `config.apply`

    Hành vi khởi động lại khớp với `config.apply`: hợp nhất các khởi động lại đang chờ cộng với một khoảng thời gian làm mát 30 giây giữa các chu kỳ khởi động lại.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## Biến môi trường

OpenClaw đọc các biến môi trường từ tiến trình cha cộng với:

- `.env` từ thư mục làm việc hiện tại (nếu có)
- `~/.openclaw/.env` (dự phòng toàn cầu)

Không file nào ghi đè các biến môi trường hiện có. Bạn cũng có thể đặt các biến môi trường nội tuyến trong cấu hình:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Nhập biến môi trường Shell (tùy chọn)">
  Nếu được kích hoạt và các khóa mong đợi không được đặt, OpenClaw chạy shell đăng nhập của bạn và chỉ nhập các khóa còn thiếu:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Tương đương biến môi trường: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Thay thế biến môi trường trong giá trị cấu hình">
  Tham chiếu các biến môi trường trong bất kỳ giá trị chuỗi cấu hình nào với `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Quy tắc:

- Chỉ các tên viết hoa được khớp: `[A-Z_][A-Z0-9_]*`
- Các biến thiếu/rỗng gây ra lỗi khi tải
- Thoát với `$${VAR}` để xuất ra nguyên văn
- Hoạt động bên trong các file `$include`
- Thay thế nội tuyến: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Tham chiếu bí mật (env, file, exec)">
  Đối với các trường hỗ trợ đối tượng SecretRef, bạn có thể sử dụng:

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

Chi tiết SecretRef (bao gồm `secrets.providers` cho `env`/`file`/`exec`) có trong [Quản lý Bí mật](/gateway/secrets).
Các đường dẫn thông tin xác thực được hỗ trợ được liệt kê trong [Bề mặt Thông tin Xác thực SecretRef](/reference/secretref-credential-surface).
</Accordion>

Xem [Môi trường](/help/environment) để biết thứ tự ưu tiên và nguồn đầy đủ.

## Tài liệu tham khảo đầy đủ

Để biết tài liệu tham khảo đầy đủ từng trường, xem **[Tài liệu Tham khảo Cấu hình](/gateway/configuration-reference)**.

---

_Liên quan: [Ví dụ Cấu hình](/gateway/configuration-examples) · [Tài liệu Tham khảo Cấu hình](/gateway/configuration-reference) · [Doctor](/gateway/doctor)_

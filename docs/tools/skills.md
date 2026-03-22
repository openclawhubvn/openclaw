---
summary: "Khám phá cách quản lý workspace, quy tắc gating và cấu hình môi trường hiệu quả với OpenClaw."
read_when:
  - Thêm hoặc chỉnh sửa kỹ năng
  - Thay đổi quy tắc gating hoặc tải kỹ năng
title: "Hướng Dẫn Cấu Hình Kỹ Năng OpenClaw"
---

# Kỹ năng (OpenClaw)

OpenClaw sử dụng thư mục kỹ năng tương thích với **[AgentSkills](https://agentskills.io)** để hướng dẫn agent cách sử dụng công cụ. Mỗi kỹ năng là một thư mục chứa `SKILL.md` với YAML frontmatter và hướng dẫn. OpenClaw tải các **kỹ năng đi kèm** cùng với các tùy chỉnh cục bộ tùy chọn và lọc chúng khi tải dựa trên môi trường, cấu hình và sự hiện diện của binary.

## Vị trí và thứ tự ưu tiên

Kỹ năng được tải từ **ba** nơi:

1. **Kỹ năng đi kèm**: đi kèm với cài đặt (gói npm hoặc OpenClaw.app)
2. **Kỹ năng quản lý/cục bộ**: `~/.openclaw/skills`
3. **Kỹ năng workspace**: `<workspace>/skills`

Nếu tên kỹ năng trùng lặp, thứ tự ưu tiên là:

`<workspace>/skills` (cao nhất) → `~/.openclaw/skills` → kỹ năng đi kèm (thấp nhất)

Ngoài ra, bạn có thể cấu hình thêm thư mục kỹ năng (thấp nhất) qua `skills.load.extraDirs` trong `~/.openclaw/openclaw.json`.

## Kỹ năng theo agent vs kỹ năng chia sẻ

Trong các thiết lập **multi-agent**, mỗi agent có workspace riêng. Điều này có nghĩa là:

- **Kỹ năng theo agent** nằm trong `<workspace>/skills` chỉ dành cho agent đó.
- **Kỹ năng chia sẻ** nằm trong `~/.openclaw/skills` (quản lý/cục bộ) và có thể truy cập bởi **tất cả các agent** trên cùng một máy.
- **Thư mục chia sẻ** cũng có thể được thêm qua `skills.load.extraDirs` (thấp nhất) nếu bạn muốn một gói kỹ năng chung được sử dụng bởi nhiều agent.

Nếu cùng một tên kỹ năng tồn tại ở nhiều nơi, thứ tự ưu tiên thông thường áp dụng: workspace thắng, sau đó là quản lý/cục bộ, rồi đến đi kèm.

## Plugin + kỹ năng

Plugin có thể đi kèm kỹ năng riêng bằng cách liệt kê thư mục `skills` trong `openclaw.plugin.json` (đường dẫn tương đối từ gốc plugin). Kỹ năng từ plugin được tải khi plugin được kích hoạt và tuân theo quy tắc ưu tiên kỹ năng thông thường. Bạn có thể kiểm soát chúng qua `metadata.openclaw.requires.config` trên mục cấu hình của plugin. Xem [Plugins](/tools/plugin) để khám phá/cấu hình và [Tools](/tools) cho bề mặt công cụ mà những kỹ năng đó dạy.

## ClawHub (cài đặt + đồng bộ)

ClawHub là registry kỹ năng công khai cho OpenClaw. Duyệt tại [https://clawhub.com](https://clawhub.com). Sử dụng nó để khám phá, cài đặt, cập nhật và sao lưu kỹ năng. Hướng dẫn đầy đủ: [ClawHub](/tools/clawhub).

Các luồng phổ biến:

- Cài đặt một kỹ năng vào workspace:
  - `clawhub install <skill-slug>`
- Cập nhật tất cả các kỹ năng đã cài đặt:
  - `clawhub update --all`
- Đồng bộ (quét + xuất bản cập nhật):
  - `clawhub sync --all`

Mặc định, `clawhub` cài đặt vào `./skills` dưới thư mục làm việc hiện tại (hoặc quay về workspace OpenClaw đã cấu hình). OpenClaw nhận diện điều đó là `<workspace>/skills` trong phiên tiếp theo.

## Ghi chú bảo mật

- Xem kỹ năng từ bên thứ ba như **mã không đáng tin cậy**. Đọc kỹ trước khi kích hoạt.
- Ưu tiên chạy trong môi trường sandbox cho các đầu vào không đáng tin cậy và công cụ rủi ro. Xem [Sandboxing](/gateway/sandboxing).
- Khám phá kỹ năng workspace và extra-dir chỉ chấp nhận gốc kỹ năng và các file `SKILL.md` có đường dẫn thực được giải quyết nằm trong gốc đã cấu hình.
- `skills.entries.*.env` và `skills.entries.*.apiKey` tiêm bí mật vào quá trình **host** cho lượt agent đó (không phải sandbox). Giữ bí mật khỏi các prompt và log.
- Để có mô hình mối đe dọa rộng hơn và danh sách kiểm tra, xem [Security](/gateway/security).

## Định dạng (AgentSkills + Pi-compatible)

`SKILL.md` phải bao gồm ít nhất:

```markdown
---
name: image-lab
description: Tạo hoặc chỉnh sửa hình ảnh thông qua quy trình làm việc hình ảnh hỗ trợ nhà cung cấp
---
```

Ghi chú:

- Chúng tôi tuân theo đặc tả AgentSkills cho bố cục/mục đích.
- Bộ phân tích cú pháp được sử dụng bởi agent nhúng chỉ hỗ trợ các khóa frontmatter **một dòng**.
- `metadata` nên là một **đối tượng JSON một dòng**.
- Sử dụng `{baseDir}` trong hướng dẫn để tham chiếu đường dẫn thư mục kỹ năng.
- Các khóa frontmatter tùy chọn:
  - `homepage` — URL được hiển thị là “Website” trong giao diện kỹ năng macOS (cũng được hỗ trợ qua `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (mặc định: `true`). Khi `true`, kỹ năng được hiển thị như một lệnh slash của người dùng.
  - `disable-model-invocation` — `true|false` (mặc định: `false`). Khi `true`, kỹ năng bị loại khỏi prompt mô hình (vẫn có sẵn qua lệnh người dùng).
  - `command-dispatch` — `tool` (tùy chọn). Khi được đặt là `tool`, lệnh slash bỏ qua mô hình và gửi trực tiếp đến công cụ.
  - `command-tool` — tên công cụ để gọi khi `command-dispatch: tool` được đặt.
  - `command-arg-mode` — `raw` (mặc định). Đối với gửi công cụ, chuyển tiếp chuỗi args thô đến công cụ (không phân tích cú pháp cốt lõi).

    Công cụ được gọi với các tham số:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Gating (bộ lọc khi tải)

OpenClaw **lọc kỹ năng khi tải** sử dụng `metadata` (JSON một dòng):

```markdown
---
name: image-lab
description: Tạo hoặc chỉnh sửa hình ảnh thông qua quy trình làm việc hình ảnh hỗ trợ nhà cung cấp
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

Các trường dưới `metadata.openclaw`:

- `always: true` — luôn bao gồm kỹ năng (bỏ qua các cổng khác).
- `emoji` — emoji tùy chọn được sử dụng bởi giao diện kỹ năng macOS.
- `homepage` — URL tùy chọn được hiển thị là “Website” trong giao diện kỹ năng macOS.
- `os` — danh sách tùy chọn các nền tảng (`darwin`, `linux`, `win32`). Nếu được đặt, kỹ năng chỉ đủ điều kiện trên các hệ điều hành đó.
- `requires.bins` — danh sách; mỗi cái phải tồn tại trên `PATH`.
- `requires.anyBins` — danh sách; ít nhất một cái phải tồn tại trên `PATH`.
- `requires.env` — danh sách; biến môi trường phải tồn tại **hoặc** được cung cấp trong cấu hình.
- `requires.config` — danh sách các đường dẫn `openclaw.json` phải đúng.
- `primaryEnv` — tên biến môi trường liên kết với `skills.entries.<name>.apiKey`.
- `install` — mảng tùy chọn các đặc tả cài đặt được sử dụng bởi giao diện kỹ năng macOS (brew/node/go/uv/download).

Ghi chú về sandboxing:

- `requires.bins` được kiểm tra trên **host** khi tải kỹ năng.
- Nếu một agent được sandbox, binary cũng phải tồn tại **bên trong container**.
  Cài đặt nó qua `agents.defaults.sandbox.docker.setupCommand` (hoặc một image tùy chỉnh).
  `setupCommand` chạy một lần sau khi container được tạo.
  Cài đặt gói cũng yêu cầu egress mạng, FS gốc có thể ghi, và người dùng root trong sandbox.
  Ví dụ: kỹ năng `summarize` (`skills/summarize/SKILL.md`) cần CLI `summarize`
  trong container sandbox để chạy ở đó.

Ví dụ cài đặt:

```markdown
---
name: gemini
description: Sử dụng Gemini CLI để hỗ trợ mã hóa và tra cứu tìm kiếm Google.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Cài đặt Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

Ghi chú:

- Nếu nhiều cài đặt được liệt kê, gateway chọn một tùy chọn ưu tiên **duy nhất** (brew khi có sẵn, nếu không thì node).
- Nếu tất cả các cài đặt là `download`, OpenClaw liệt kê từng mục để bạn có thể thấy các artifact có sẵn.
- Các đặc tả cài đặt có thể bao gồm `os: ["darwin"|"linux"|"win32"]` để lọc tùy chọn theo nền tảng.
- Cài đặt Node tuân theo `skills.install.nodeManager` trong `openclaw.json` (mặc định: npm; tùy chọn: npm/pnpm/yarn/bun).
  Điều này chỉ ảnh hưởng đến **cài đặt kỹ năng**; runtime Gateway vẫn nên là Node
  (Bun không được khuyến nghị cho WhatsApp/Telegram).
- Cài đặt Go: nếu `go` bị thiếu và `brew` có sẵn, gateway cài đặt Go qua Homebrew trước và đặt `GOBIN` vào `bin` của Homebrew khi có thể.
- Cài đặt Download: `url` (bắt buộc), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (mặc định: tự động khi phát hiện archive), `stripComponents`, `targetDir` (mặc định: `~/.openclaw/tools/<skillKey>`).

Nếu không có `metadata.openclaw`, kỹ năng luôn đủ điều kiện (trừ khi bị vô hiệu hóa trong cấu hình hoặc bị chặn bởi `skills.allowBundled` cho kỹ năng đi kèm).

## Ghi đè cấu hình (`~/.openclaw/openclaw.json`)

Kỹ năng đi kèm/quản lý có thể được bật/tắt và cung cấp giá trị môi trường:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // hoặc chuỗi plaintext
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

Lưu ý: nếu tên kỹ năng chứa dấu gạch ngang, hãy đặt khóa trong dấu ngoặc kép (JSON5 cho phép khóa có dấu ngoặc kép).

Nếu bạn muốn tạo/chỉnh sửa hình ảnh trong OpenClaw, sử dụng công cụ cốt lõi `image_generate` với `agents.defaults.imageGenerationModel` thay vì kỹ năng đi kèm. Các ví dụ kỹ năng ở đây dành cho quy trình làm việc tùy chỉnh hoặc từ bên thứ ba.

Các khóa cấu hình khớp với **tên kỹ năng** theo mặc định. Nếu một kỹ năng định nghĩa `metadata.openclaw.skillKey`, sử dụng khóa đó dưới `skills.entries`.

Quy tắc:

- `enabled: false` vô hiệu hóa kỹ năng ngay cả khi nó được đi kèm/cài đặt.
- `env`: chỉ được tiêm **nếu** biến chưa được đặt trong quá trình.
- `apiKey`: tiện lợi cho các kỹ năng khai báo `metadata.openclaw.primaryEnv`.
  Hỗ trợ chuỗi plaintext hoặc đối tượng SecretRef (`{ source, provider, id }`).
- `config`: túi tùy chọn cho các trường tùy chỉnh theo kỹ năng; các khóa tùy chỉnh phải nằm ở đây.
- `allowBundled`: danh sách cho phép tùy chọn chỉ dành cho **kỹ năng đi kèm**. Nếu được đặt, chỉ các kỹ năng đi kèm trong danh sách mới đủ điều kiện (kỹ năng quản lý/workspace không bị ảnh hưởng).

## Tiêm môi trường (mỗi lần chạy agent)

Khi một lần chạy agent bắt đầu, OpenClaw:

1. Đọc metadata kỹ năng.
2. Áp dụng bất kỳ `skills.entries.<key>.env` hoặc `skills.entries.<key>.apiKey` vào `process.env`.
3. Xây dựng prompt hệ thống với các kỹ năng **đủ điều kiện**.
4. Khôi phục môi trường gốc sau khi lượt chạy kết thúc.

Điều này **được giới hạn trong lượt chạy agent**, không phải môi trường shell toàn cầu.

## Ảnh chụp phiên (hiệu suất)

OpenClaw chụp ảnh các kỹ năng đủ điều kiện **khi một phiên bắt đầu** và tái sử dụng danh sách đó cho các lượt tiếp theo trong cùng phiên. Thay đổi kỹ năng hoặc cấu hình có hiệu lực trong phiên mới tiếp theo.

Kỹ năng cũng có thể làm mới giữa phiên khi trình theo dõi kỹ năng được bật hoặc khi một node từ xa đủ điều kiện mới xuất hiện (xem bên dưới). Hãy nghĩ về điều này như một **tải lại nóng**: danh sách làm mới được nhận diện trong lượt agent tiếp theo.

## Node macOS từ xa (gateway Linux)

Nếu Gateway đang chạy trên Linux nhưng một **node macOS** được kết nối **với `system.run` được cho phép** (bảo mật phê duyệt Exec không được đặt thành `deny`), OpenClaw có thể coi các kỹ năng chỉ dành cho macOS là đủ điều kiện khi các binary cần thiết có mặt trên node đó. Agent nên thực thi các kỹ năng đó thông qua công cụ `nodes` (thường là `nodes.run`).

Điều này dựa vào node báo cáo hỗ trợ lệnh của nó và một kiểm tra bin qua `system.run`. Nếu node macOS ngắt kết nối sau đó, các kỹ năng vẫn hiển thị; các lần gọi có thể thất bại cho đến khi node kết nối lại.

## Trình theo dõi kỹ năng (tự động làm mới)

Mặc định, OpenClaw theo dõi các thư mục kỹ năng và cập nhật ảnh chụp kỹ năng khi các file `SKILL.md` thay đổi. Cấu hình điều này dưới `skills.load`:

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

## Tác động token (danh sách kỹ năng)

Khi kỹ năng đủ điều kiện, OpenClaw tiêm một danh sách XML gọn gàng của các kỹ năng có sẵn vào prompt hệ thống (thông qua `formatSkillsForPrompt` trong `pi-coding-agent`). Chi phí là xác định:

- **Chi phí cơ bản (chỉ khi có ≥1 kỹ năng):** 195 ký tự.
- **Mỗi kỹ năng:** 97 ký tự + độ dài của các giá trị `<name>`, `<description>`, và `<location>` đã được escape XML.

Công thức (ký tự):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Ghi chú:

- Escape XML mở rộng `& < > " '` thành các thực thể (`&amp;`, `&lt;`, v.v.), tăng độ dài.
- Số lượng token thay đổi theo bộ phân tích cú pháp mô hình. Ước tính kiểu OpenAI là ~4 ký tự/token, vì vậy **97 ký tự ≈ 24 token** mỗi kỹ năng cộng với độ dài trường thực tế của bạn.

## Vòng đời kỹ năng quản lý

OpenClaw cung cấp một bộ kỹ năng cơ bản dưới dạng **kỹ năng đi kèm** như một phần của cài đặt (gói npm hoặc OpenClaw.app). `~/.openclaw/skills` tồn tại cho các ghi đè cục bộ (ví dụ, ghim/sửa một kỹ năng mà không thay đổi bản sao đi kèm). Kỹ năng workspace do người dùng sở hữu và ghi đè cả hai khi có xung đột tên.

## Tham chiếu cấu hình

Xem [Cấu hình kỹ năng](/tools/skills-config) để biết đầy đủ về cấu trúc cấu hình.

## Tìm kiếm thêm kỹ năng?

Duyệt [https://clawhub.com](https://clawhub.com).

---

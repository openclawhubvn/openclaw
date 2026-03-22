---
summary: "Kỹ năng: managed vs workspace, quy tắc gating, và cấu hình/env wiring"
read_when:
  - Thêm hoặc chỉnh sửa kỹ năng
  - Thay đổi quy tắc gating hoặc load kỹ năng
title: "Kỹ năng"
---

# Kỹ năng (OpenClaw)

OpenClaw sử dụng thư mục kỹ năng tương thích **[AgentSkills](https://agentskills.io)** để dạy agent cách sử dụng công cụ. Mỗi kỹ năng là một thư mục chứa `SKILL.md` với YAML frontmatter và hướng dẫn. OpenClaw tải **kỹ năng đi kèm** cùng với các tùy chọn ghi đè local, và lọc chúng khi tải dựa trên môi trường, cấu hình và sự hiện diện của binary.

## Vị trí và thứ tự ưu tiên

Kỹ năng được tải từ **ba** nơi:

1. **Kỹ năng đi kèm**: đi kèm với cài đặt (npm package hoặc OpenClaw.app)
2. **Kỹ năng managed/local**: `~/.openclaw/skills`
3. **Kỹ năng workspace**: `<workspace>/skills`

Nếu tên kỹ năng trùng lặp, thứ tự ưu tiên là:

`<workspace>/skills` (cao nhất) → `~/.openclaw/skills` → kỹ năng đi kèm (thấp nhất)

Ngoài ra, có thể cấu hình thêm thư mục kỹ năng (thấp nhất) qua `skills.load.extraDirs` trong `~/.openclaw/openclaw.json`.

## Kỹ năng per-agent vs shared

Trong thiết lập **multi-agent**, mỗi agent có workspace riêng. Điều này có nghĩa:

- **Kỹ năng per-agent** nằm trong `<workspace>/skills` chỉ cho agent đó.
- **Kỹ năng shared** nằm trong `~/.openclaw/skills` (managed/local) và có thể thấy bởi **tất cả các agent** trên cùng máy.
- **Thư mục shared** cũng có thể thêm qua `skills.load.extraDirs` (thấp nhất) nếu muốn dùng chung gói kỹ năng cho nhiều agent.

Nếu tên kỹ năng trùng lặp ở nhiều nơi, áp dụng thứ tự ưu tiên thông thường: workspace thắng, sau đó managed/local, rồi đến đi kèm.

## Plugins + kỹ năng

Plugins có thể đi kèm kỹ năng riêng bằng cách liệt kê thư mục `skills` trong `openclaw.plugin.json` (đường dẫn tương đối từ gốc plugin). Kỹ năng plugin tải khi plugin được bật và tuân theo quy tắc ưu tiên kỹ năng thông thường. Có thể gating chúng qua `metadata.openclaw.requires.config` trên mục cấu hình plugin. Xem [Plugins](/tools/plugin) để khám phá/cấu hình và [Tools](/tools) cho bề mặt công cụ mà những kỹ năng đó dạy.

## ClawHub (cài đặt + đồng bộ)

ClawHub là registry kỹ năng công khai cho OpenClaw. Duyệt tại [https://clawhub.com](https://clawhub.com). Dùng để khám phá, cài đặt, cập nhật và sao lưu kỹ năng. Hướng dẫn đầy đủ: [ClawHub](/tools/clawhub).

Luồng phổ biến:

- Cài đặt kỹ năng vào workspace:
  - `clawhub install <skill-slug>`
- Cập nhật tất cả kỹ năng đã cài:
  - `clawhub update --all`
- Đồng bộ (quét + xuất bản cập nhật):
  - `clawhub sync --all`

Mặc định, `clawhub` cài vào `./skills` dưới thư mục làm việc hiện tại (hoặc fallback vào workspace OpenClaw đã cấu hình). OpenClaw nhận diện đó là `<workspace>/skills` trong phiên tiếp theo.

## Ghi chú bảo mật

- Xem kỹ năng bên thứ ba như **mã không tin cậy**. Đọc trước khi bật.
- Ưu tiên chạy sandbox cho input không tin cậy và công cụ rủi ro. Xem [Sandboxing](/gateway/sandboxing).
- Khám phá kỹ năng workspace và extra-dir chỉ chấp nhận root kỹ năng và file `SKILL.md` có realpath đã giải quyết nằm trong root đã cấu hình.
- `skills.entries.*.env` và `skills.entries.*.apiKey` tiêm secrets vào **quá trình host** cho lượt agent đó (không phải sandbox). Giữ secrets ngoài prompts và logs.
- Để có mô hình mối đe dọa rộng hơn và checklist, xem [Security](/gateway/security).

## Định dạng (AgentSkills + Pi-compatible)

`SKILL.md` phải bao gồm ít nhất:

```markdown
---
name: image-lab
description: Tạo hoặc chỉnh sửa hình ảnh qua workflow hình ảnh hỗ trợ provider
---
```

Ghi chú:

- Tuân theo spec AgentSkills cho layout/intent.
- Parser dùng bởi agent nhúng hỗ trợ **khóa frontmatter một dòng**.
- `metadata` nên là **đối tượng JSON một dòng**.
- Dùng `{baseDir}` trong hướng dẫn để tham chiếu đường dẫn thư mục kỹ năng.
- Khóa frontmatter tùy chọn:
  - `homepage` — URL hiển thị là “Website” trong macOS Skills UI (cũng hỗ trợ qua `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (mặc định: `true`). Khi `true`, kỹ năng được hiển thị như lệnh slash của người dùng.
  - `disable-model-invocation` — `true|false` (mặc định: `false`). Khi `true`, kỹ năng bị loại khỏi prompt model (vẫn có sẵn qua lệnh người dùng).
  - `command-dispatch` — `tool` (tùy chọn). Khi đặt là `tool`, lệnh slash bỏ qua model và gửi trực tiếp đến công cụ.
  - `command-tool` — tên công cụ để gọi khi `command-dispatch: tool` được đặt.
  - `command-arg-mode` — `raw` (mặc định). Đối với dispatch công cụ, chuyển tiếp chuỗi args thô đến công cụ (không phân tích cú pháp lõi).

    Công cụ được gọi với tham số:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Gating (bộ lọc load-time)

OpenClaw **lọc kỹ năng khi tải** sử dụng `metadata` (JSON một dòng):

```markdown
---
name: image-lab
description: Tạo hoặc chỉnh sửa hình ảnh qua workflow hình ảnh hỗ trợ provider
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
- `emoji` — emoji tùy chọn dùng bởi macOS Skills UI.
- `homepage` — URL tùy chọn hiển thị là “Website” trong macOS Skills UI.
- `os` — danh sách nền tảng tùy chọn (`darwin`, `linux`, `win32`). Nếu đặt, kỹ năng chỉ đủ điều kiện trên các OS đó.
- `requires.bins` — danh sách; mỗi cái phải tồn tại trên `PATH`.
- `requires.anyBins` — danh sách; ít nhất một cái phải tồn tại trên `PATH`.
- `requires.env` — danh sách; biến môi trường phải tồn tại **hoặc** được cung cấp trong cấu hình.
- `requires.config` — danh sách đường dẫn `openclaw.json` phải đúng.
- `primaryEnv` — tên biến môi trường liên kết với `skills.entries.<name>.apiKey`.
- `install` — mảng tùy chọn của các spec cài đặt dùng bởi macOS Skills UI (brew/node/go/uv/download).

Ghi chú về sandboxing:

- `requires.bins` được kiểm tra trên **host** khi tải kỹ năng.
- Nếu agent bị sandbox, binary cũng phải tồn tại **trong container**.
  Cài đặt nó qua `agents.defaults.sandbox.docker.setupCommand` (hoặc image tùy chỉnh).
  `setupCommand` chạy một lần sau khi container được tạo.
  Cài đặt package cũng yêu cầu egress mạng, FS root có thể ghi, và user root trong sandbox.
  Ví dụ: kỹ năng `summarize` (`skills/summarize/SKILL.md`) cần CLI `summarize`
  trong container sandbox để chạy ở đó.

Ví dụ cài đặt:

```markdown
---
name: gemini
description: Sử dụng Gemini CLI cho hỗ trợ mã hóa và tra cứu Google.
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

- Nếu nhiều installer được liệt kê, gateway chọn một tùy chọn ưu tiên **duy nhất** (brew khi có, nếu không thì node).
- Nếu tất cả installer là `download`, OpenClaw liệt kê từng mục để bạn có thể thấy các artifact có sẵn.
- Các spec installer có thể bao gồm `os: ["darwin"|"linux"|"win32"]` để lọc tùy chọn theo nền tảng.
- Cài đặt Node tuân theo `skills.install.nodeManager` trong `openclaw.json` (mặc định: npm; tùy chọn: npm/pnpm/yarn/bun).
  Điều này chỉ ảnh hưởng đến **cài đặt kỹ năng**; runtime Gateway vẫn nên là Node
  (Bun không được khuyến nghị cho WhatsApp/Telegram).
- Cài đặt Go: nếu `go` thiếu và `brew` có sẵn, gateway cài đặt Go qua Homebrew trước và đặt `GOBIN` vào `bin` của Homebrew khi có thể.
- Cài đặt Download: `url` (bắt buộc), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (mặc định: tự động khi phát hiện archive), `stripComponents`, `targetDir` (mặc định: `~/.openclaw/tools/<skillKey>`).

Nếu không có `metadata.openclaw`, kỹ năng luôn đủ điều kiện (trừ khi bị vô hiệu hóa trong cấu hình hoặc bị chặn bởi `skills.allowBundled` cho kỹ năng đi kèm).

## Ghi đè cấu hình (`~/.openclaw/openclaw.json`)

Kỹ năng đi kèm/managed có thể được bật/tắt và cung cấp giá trị env:

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

Ghi chú: nếu tên kỹ năng chứa dấu gạch ngang, hãy đặt key trong dấu ngoặc kép (JSON5 cho phép key có dấu ngoặc kép).

Nếu muốn tạo/chỉnh sửa hình ảnh stock trong OpenClaw, sử dụng công cụ lõi `image_generate` với `agents.defaults.imageGenerationModel` thay vì kỹ năng đi kèm. Ví dụ kỹ năng ở đây dành cho workflow tùy chỉnh hoặc bên thứ ba.

Các key cấu hình mặc định khớp với **tên kỹ năng**. Nếu kỹ năng định nghĩa `metadata.openclaw.skillKey`, sử dụng key đó dưới `skills.entries`.

Quy tắc:

- `enabled: false` vô hiệu hóa kỹ năng ngay cả khi nó được đi kèm/cài đặt.
- `env`: chỉ tiêm **nếu** biến chưa được đặt trong quá trình.
- `apiKey`: tiện lợi cho kỹ năng khai báo `metadata.openclaw.primaryEnv`.
  Hỗ trợ chuỗi plaintext hoặc đối tượng SecretRef (`{ source, provider, id }`).
- `config`: túi tùy chọn cho các trường tùy chỉnh per-skill; các key tùy chỉnh phải nằm ở đây.
- `allowBundled`: danh sách cho phép tùy chọn chỉ cho **kỹ năng đi kèm**. Nếu đặt, chỉ kỹ năng đi kèm trong danh sách mới đủ điều kiện (kỹ năng managed/workspace không bị ảnh hưởng).

## Tiêm môi trường (mỗi lần chạy agent)

Khi một lần chạy agent bắt đầu, OpenClaw:

1. Đọc metadata kỹ năng.
2. Áp dụng bất kỳ `skills.entries.<key>.env` hoặc `skills.entries.<key>.apiKey` vào `process.env`.
3. Xây dựng prompt hệ thống với các kỹ năng **đủ điều kiện**.
4. Khôi phục môi trường gốc sau khi lần chạy kết thúc.

Điều này **được giới hạn trong lần chạy agent**, không phải môi trường shell toàn cầu.

## Snapshot phiên (hiệu suất)

OpenClaw snapshot các kỹ năng đủ điều kiện **khi một phiên bắt đầu** và tái sử dụng danh sách đó cho các lượt tiếp theo trong cùng phiên. Thay đổi kỹ năng hoặc cấu hình có hiệu lực trong phiên mới tiếp theo.

Kỹ năng cũng có thể làm mới giữa phiên khi watcher kỹ năng được bật hoặc khi một node remote đủ điều kiện mới xuất hiện (xem bên dưới). Hãy nghĩ về điều này như một **hot reload**: danh sách làm mới được nhận diện trong lượt agent tiếp theo.

## Node macOS remote (Gateway Linux)

Nếu Gateway chạy trên Linux nhưng một **node macOS** được kết nối **với `system.run` cho phép** (bảo mật phê duyệt Exec không đặt thành `deny`), OpenClaw có thể xem kỹ năng chỉ dành cho macOS là đủ điều kiện khi các binary cần thiết có mặt trên node đó. Agent nên thực thi các kỹ năng đó qua công cụ `nodes` (thường là `nodes.run`).

Điều này dựa vào node báo cáo hỗ trợ lệnh của nó và một bin probe qua `system.run`. Nếu node macOS ngắt kết nối sau đó, kỹ năng vẫn hiển thị; các lần gọi có thể thất bại cho đến khi node kết nối lại.

## Watcher kỹ năng (tự động làm mới)

Mặc định, OpenClaw theo dõi thư mục kỹ năng và tăng snapshot kỹ năng khi file `SKILL.md` thay đổi. Cấu hình điều này dưới `skills.load`:

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

## Tác động Token (danh sách kỹ năng)

Khi kỹ năng đủ điều kiện, OpenClaw tiêm một danh sách XML gọn gàng của các kỹ năng có sẵn vào prompt hệ thống (qua `formatSkillsForPrompt` trong `pi-coding-agent`). Chi phí là xác định:

- **Chi phí cơ bản (chỉ khi ≥1 kỹ năng):** 195 ký tự.
- **Mỗi kỹ năng:** 97 ký tự + độ dài của các giá trị `<name>`, `<description>`, và `<location>` đã escape XML.

Công thức (ký tự):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Ghi chú:

- Escape XML mở rộng `& < > " '` thành các thực thể (`&amp;`, `&lt;`, v.v.), tăng độ dài.
- Số lượng token thay đổi theo tokenizer model. Ước tính kiểu OpenAI là ~4 ký tự/token, nên **97 ký tự ≈ 24 token** mỗi kỹ năng cộng với độ dài trường thực tế của bạn.

## Vòng đời kỹ năng managed

OpenClaw cung cấp một bộ kỹ năng cơ bản dưới dạng **kỹ năng đi kèm** như một phần của cài đặt (npm package hoặc OpenClaw.app). `~/.openclaw/skills` tồn tại cho ghi đè local (ví dụ, ghim/sửa lỗi một kỹ năng mà không thay đổi bản sao đi kèm). Kỹ năng workspace do người dùng sở hữu và ghi đè cả hai khi có xung đột tên.

## Tham chiếu cấu hình

Xem [Cấu hình kỹ năng](/tools/skills-config) để biết đầy đủ schema cấu hình.

## Tìm kiếm thêm kỹ năng?

Duyệt [https://clawhub.com](https://clawhub.com).

---\n
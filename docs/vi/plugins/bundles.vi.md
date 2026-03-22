---
summary: "Cài đặt và sử dụng các gói Codex, Claude, và Cursor như plugin OpenClaw"
read_when:
  - Muốn cài đặt gói tương thích Codex, Claude, hoặc Cursor
  - Cần hiểu cách OpenClaw ánh xạ nội dung gói vào các tính năng gốc
  - Đang debug phát hiện gói hoặc thiếu tính năng
title: "Plugin Bundles"
---

# Plugin Bundles

OpenClaw có thể cài đặt plugin từ ba hệ sinh thái bên ngoài: **Codex**, **Claude**, và **Cursor**. Đây được gọi là **bundles** — các gói nội dung và metadata mà OpenClaw ánh xạ vào các tính năng gốc như skills, hooks, và công cụ MCP.

<Info>
  Bundles **không** giống như plugin gốc của OpenClaw. Plugin gốc chạy in-process và có thể đăng ký bất kỳ khả năng nào. Bundles là các gói nội dung với ánh xạ tính năng chọn lọc và ranh giới tin cậy hẹp hơn.
</Info>

## Tại sao bundles tồn tại

Nhiều plugin hữu ích được phát hành dưới định dạng Codex, Claude, hoặc Cursor. Thay vì yêu cầu tác giả viết lại thành plugin gốc OpenClaw, OpenClaw phát hiện các định dạng này và ánh xạ nội dung được hỗ trợ vào tập tính năng gốc. Điều này có nghĩa là có thể cài đặt một gói lệnh Claude hoặc một gói kỹ năng Codex và sử dụng ngay lập tức.

## Cài đặt một bundle

<Steps>
  <Step title="Cài đặt từ thư mục, archive, hoặc marketplace">
    ```bash
    # Thư mục local
    openclaw plugins install ./my-bundle

    # Archive
    openclaw plugins install ./my-bundle.tgz

    # Claude marketplace
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="Xác minh phát hiện">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Bundles hiển thị dưới dạng `Format: bundle` với subtype là `codex`, `claude`, hoặc `cursor`.

  </Step>

  <Step title="Khởi động lại và sử dụng">
    ```bash
    openclaw gateway restart
    ```

    Các tính năng được ánh xạ (skills, hooks, công cụ MCP) sẽ có sẵn trong phiên tiếp theo.

  </Step>
</Steps>

## OpenClaw ánh xạ gì từ bundles

Không phải mọi tính năng của bundle đều chạy trong OpenClaw hiện tại. Dưới đây là những gì hoạt động và những gì được phát hiện nhưng chưa được kết nối.

### Đã hỗ trợ

| Tính năng     | Cách ánh xạ                                                                                          | Áp dụng cho    |
| ------------- | ---------------------------------------------------------------------------------------------------- | -------------- |
| Nội dung skill| Gốc skill của bundle tải như skill OpenClaw thông thường                                             | Tất cả định dạng|
| Lệnh          | `commands/` và `.cursor/commands/` được coi là gốc skill                                             | Claude, Cursor |
| Hook packs    | Layout `HOOK.md` + `handler.ts` kiểu OpenClaw                                                        | Codex          |
| Công cụ MCP   | Cấu hình MCP của bundle được hợp nhất vào cài đặt Pi nhúng; các server stdio được hỗ trợ được khởi chạy như subprocesses | Tất cả định dạng|
| Cài đặt       | `settings.json` của Claude được nhập làm mặc định Pi nhúng                                           | Claude         |

### Được phát hiện nhưng không thực thi

Những thứ này được nhận diện và hiển thị trong chẩn đoán, nhưng OpenClaw không chạy chúng:

- `agents`, `hooks.json` automation, `lspServers`, `outputStyles` của Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` của Cursor
- Metadata inline/app của Codex ngoài báo cáo khả năng

## Định dạng bundle

<AccordionGroup>
  <Accordion title="Codex bundles">
    Dấu hiệu: `.codex-plugin/plugin.json`

    Nội dung tùy chọn: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Bundles Codex phù hợp nhất với OpenClaw khi sử dụng gốc skill và thư mục hook-pack kiểu OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Claude bundles">
    Hai chế độ phát hiện:

    - **Dựa trên manifest:** `.claude-plugin/plugin.json`
    - **Không manifest:** layout Claude mặc định (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `settings.json`)

    Hành vi đặc thù của Claude:

    - `commands/` được coi là nội dung skill
    - `settings.json` được nhập vào cài đặt Pi nhúng (các khóa override shell được làm sạch)
    - `.mcp.json` phơi bày các công cụ stdio được hỗ trợ cho Pi nhúng
    - `hooks/hooks.json` được phát hiện nhưng không thực thi
    - Các đường dẫn thành phần tùy chỉnh trong manifest là bổ sung (chúng mở rộng mặc định, không thay thế)

  </Accordion>

  <Accordion title="Cursor bundles">
    Dấu hiệu: `.cursor-plugin/plugin.json`

    Nội dung tùy chọn: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` được coi là nội dung skill
    - `.cursor/rules/`, `.cursor/agents/`, và `.cursor/hooks.json` chỉ được phát hiện

  </Accordion>
</AccordionGroup>

## Thứ tự phát hiện

OpenClaw kiểm tra định dạng plugin gốc trước:

1. `openclaw.plugin.json` hoặc `package.json` hợp lệ với `openclaw.extensions` — được coi là **plugin gốc**
2. Dấu hiệu bundle (`.codex-plugin/`, `.claude-plugin/`, hoặc layout Claude/Cursor mặc định) — được coi là **bundle**

Nếu một thư mục chứa cả hai, OpenClaw sử dụng đường dẫn gốc. Điều này ngăn các gói định dạng kép bị cài đặt một phần như bundles.

## Bảo mật

Bundles có ranh giới tin cậy hẹp hơn so với plugin gốc:

- OpenClaw **không** tải các module runtime bundle tùy ý in-process
- Đường dẫn skills và hook-pack phải nằm trong root plugin (kiểm tra ranh giới)
- Các file cài đặt được đọc với cùng kiểm tra ranh giới
- Các server MCP stdio được hỗ trợ có thể được khởi chạy như subprocesses

Điều này làm cho bundles an toàn hơn mặc định, nhưng vẫn nên coi các bundles bên thứ ba là nội dung tin cậy cho các tính năng mà chúng phơi bày.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Bundle được phát hiện nhưng khả năng không chạy">
    Chạy `openclaw plugins inspect <id>`. Nếu một khả năng được liệt kê nhưng được đánh dấu là không kết nối, đó là giới hạn sản phẩm — không phải lỗi cài đặt.
  </Accordion>

  <Accordion title="File lệnh Claude không xuất hiện">
    Đảm bảo bundle được kích hoạt và các file markdown nằm trong gốc `commands/` hoặc `skills/` được phát hiện.
  </Accordion>

  <Accordion title="Cài đặt Claude không áp dụng">
    Chỉ cài đặt Pi nhúng từ `settings.json` được hỗ trợ. OpenClaw không coi cài đặt bundle là các bản vá cấu hình thô.
  </Accordion>

  <Accordion title="Hooks Claude không thực thi">
    `hooks/hooks.json` chỉ được phát hiện. Nếu cần hooks có thể chạy, sử dụng layout hook-pack OpenClaw hoặc phát hành plugin gốc.
  </Accordion>
</AccordionGroup>

## Liên quan

- [Cài đặt và Cấu hình Plugins](/tools/plugin)
- [Xây dựng Plugins](/plugins/building-plugins) — tạo plugin gốc
- [Plugin Manifest](/plugins/manifest) — schema manifest gốc\n
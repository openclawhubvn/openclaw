---
summary: "Tìm hiểu cách cài đặt và sử dụng các gói Codex, Claude, Cursor như plugin để tối ưu hóa trải nghiệm OpenClaw."
read_when:
  - Bạn muốn cài đặt một gói tương thích với Codex, Claude, hoặc Cursor
  - Bạn cần hiểu cách OpenClaw ánh xạ nội dung gói thành các tính năng gốc
  - Bạn đang gỡ lỗi phát hiện gói hoặc thiếu khả năng
title: "Hướng Dẫn Cài Đặt Gói Plugin OpenClaw"
---

# Gói Plugin

OpenClaw có thể cài đặt plugin từ ba hệ sinh thái bên ngoài: **Codex**, **Claude**, và **Cursor**. Đây được gọi là **gói** — các gói nội dung và siêu dữ liệu mà OpenClaw ánh xạ thành các tính năng gốc như kỹ năng, hooks, và công cụ MCP.

<Info>
  Gói **không** giống như plugin gốc của OpenClaw. Plugin gốc chạy trong quá trình và có thể đăng ký bất kỳ khả năng nào. Gói là các gói nội dung với ánh xạ tính năng chọn lọc và ranh giới tin cậy hẹp hơn.
</Info>

## Tại sao gói tồn tại

Nhiều plugin hữu ích được phát hành dưới định dạng Codex, Claude, hoặc Cursor. Thay vì yêu cầu tác giả viết lại chúng thành plugin gốc của OpenClaw, OpenClaw phát hiện các định dạng này và ánh xạ nội dung được hỗ trợ của chúng vào bộ tính năng gốc. Điều này có nghĩa là bạn có thể cài đặt một gói lệnh Claude hoặc một gói kỹ năng Codex và sử dụng ngay lập tức.

## Cài đặt một gói

<Steps>
  <Step title="Cài đặt từ thư mục, tệp lưu trữ, hoặc marketplace">
    ```bash
    # Thư mục cục bộ
    openclaw plugins install ./my-bundle

    # Tệp lưu trữ
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

    Gói hiển thị dưới dạng `Format: bundle` với một loại phụ là `codex`, `claude`, hoặc `cursor`.

  </Step>

  <Step title="Khởi động lại và sử dụng">
    ```bash
    openclaw gateway restart
    ```

    Các tính năng được ánh xạ (kỹ năng, hooks, công cụ MCP) sẽ có sẵn trong phiên tiếp theo.

  </Step>
</Steps>

## OpenClaw ánh xạ gì từ gói

Không phải mọi tính năng của gói đều chạy trong OpenClaw hiện nay. Dưới đây là những gì hoạt động và những gì được phát hiện nhưng chưa được kết nối.

### Đã hỗ trợ

| Tính năng     | Cách ánh xạ                                                                                          | Áp dụng cho    |
| ------------- | ---------------------------------------------------------------------------------------------------- | -------------- |
| Nội dung kỹ năng | Gốc kỹ năng của gói tải như kỹ năng OpenClaw thông thường                                          | Tất cả định dạng|
| Lệnh          | `commands/` và `.cursor/commands/` được coi là gốc kỹ năng                                           | Claude, Cursor |
| Gói hook      | Bố cục `HOOK.md` + `handler.ts` kiểu OpenClaw                                                        | Codex          |
| Công cụ MCP   | Cấu hình MCP của gói được hợp nhất vào cài đặt Pi nhúng; các máy chủ stdio được hỗ trợ được khởi chạy dưới dạng quy trình con | Tất cả định dạng|
| Cài đặt       | `settings.json` của Claude được nhập làm mặc định Pi nhúng                                           | Claude         |

### Được phát hiện nhưng không thực thi

Những điều này được nhận diện và hiển thị trong chẩn đoán, nhưng OpenClaw không chạy chúng:

- `agents`, `hooks.json` tự động hóa, `lspServers`, `outputStyles` của Claude
- `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules` của Cursor
- Siêu dữ liệu nội tuyến/ứng dụng của Codex ngoài báo cáo khả năng

## Định dạng gói

<AccordionGroup>
  <Accordion title="Gói Codex">
    Dấu hiệu: `.codex-plugin/plugin.json`

    Nội dung tùy chọn: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Gói Codex phù hợp nhất với OpenClaw khi chúng sử dụng gốc kỹ năng và thư mục gói hook kiểu OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="Gói Claude">
    Hai chế độ phát hiện:

    - **Dựa trên manifest:** `.claude-plugin/plugin.json`
    - **Không có manifest:** bố cục Claude mặc định (`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `settings.json`)

    Hành vi đặc thù của Claude:

    - `commands/` được coi là nội dung kỹ năng
    - `settings.json` được nhập vào cài đặt Pi nhúng (các khóa ghi đè shell được làm sạch)
    - `.mcp.json` hiển thị các công cụ stdio được hỗ trợ cho Pi nhúng
    - `hooks/hooks.json` được phát hiện nhưng không thực thi
    - Các đường dẫn thành phần tùy chỉnh trong manifest là bổ sung (chúng mở rộng mặc định, không thay thế chúng)

  </Accordion>

  <Accordion title="Gói Cursor">
    Dấu hiệu: `.cursor-plugin/plugin.json`

    Nội dung tùy chọn: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/` được coi là nội dung kỹ năng
    - `.cursor/rules/`, `.cursor/agents/`, và `.cursor/hooks.json` chỉ được phát hiện

  </Accordion>
</AccordionGroup>

## Thứ tự phát hiện

OpenClaw kiểm tra định dạng plugin gốc trước:

1. `openclaw.plugin.json` hoặc `package.json` hợp lệ với `openclaw.extensions` — được coi là **plugin gốc**
2. Dấu hiệu gói (`.codex-plugin/`, `.claude-plugin/`, hoặc bố cục Claude/Cursor mặc định) — được coi là **gói**

Nếu một thư mục chứa cả hai, OpenClaw sử dụng đường dẫn gốc. Điều này ngăn các gói định dạng kép bị cài đặt một phần dưới dạng gói.

## Bảo mật

Gói có ranh giới tin cậy hẹp hơn so với plugin gốc:

- OpenClaw **không** tải các mô-đun runtime gói tùy ý trong quá trình
- Đường dẫn kỹ năng và gói hook phải nằm trong thư mục gốc plugin (được kiểm tra ranh giới)
- Các tệp cài đặt được đọc với cùng kiểm tra ranh giới
- Các máy chủ MCP stdio được hỗ trợ có thể được khởi chạy dưới dạng quy trình con

Điều này làm cho gói an toàn hơn theo mặc định, nhưng bạn vẫn nên coi các gói bên thứ ba là nội dung đáng tin cậy cho các tính năng mà chúng cung cấp.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Gói được phát hiện nhưng khả năng không chạy">
    Chạy `openclaw plugins inspect <id>`. Nếu một khả năng được liệt kê nhưng được đánh dấu là không kết nối, đó là giới hạn sản phẩm — không phải cài đặt bị lỗi.
  </Accordion>

  <Accordion title="Tệp lệnh Claude không xuất hiện">
    Đảm bảo gói được kích hoạt và các tệp markdown nằm trong gốc `commands/` hoặc `skills/` được phát hiện.
  </Accordion>

  <Accordion title="Cài đặt Claude không áp dụng">
    Chỉ cài đặt Pi nhúng từ `settings.json` được hỗ trợ. OpenClaw không coi cài đặt gói là các bản vá cấu hình thô.
  </Accordion>

  <Accordion title="Hooks Claude không thực thi">
    `hooks/hooks.json` chỉ được phát hiện. Nếu bạn cần hooks có thể chạy, hãy sử dụng bố cục gói hook của OpenClaw hoặc phát hành một plugin gốc.
  </Accordion>
</AccordionGroup>

## Liên quan

- [Cài đặt và Cấu hình Plugin](/tools/plugin)
- [Xây dựng Plugin](/plugins/building-plugins) — tạo một plugin gốc
- [Manifest Plugin](/plugins/manifest) — lược đồ manifest gốc

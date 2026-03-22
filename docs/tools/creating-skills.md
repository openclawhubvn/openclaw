---
title: "Hướng Dẫn Tạo Skills Trong OpenClaw"
summary: "Khám phá cách tạo và kiểm tra kỹ năng tùy chỉnh trong OpenClaw với SKILL.md, nâng cao hiệu suất làm việc của bạn."
read_when:
  - Bạn đang tạo một kỹ năng tùy chỉnh mới trong workspace
  - Bạn cần một quy trình bắt đầu nhanh cho các kỹ năng dựa trên SKILL.md
---

# Tạo Skills

Skills hướng dẫn agent cách và khi nào sử dụng công cụ. Mỗi skill là một thư mục chứa file `SKILL.md` với phần đầu YAML và hướng dẫn markdown.

Để biết cách skills được tải và ưu tiên, xem [Skills](/tools/skills).

## Tạo skill đầu tiên

<Steps>
  <Step title="Tạo thư mục skill">
    Skills nằm trong workspace của bạn. Tạo một thư mục mới:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="Viết SKILL.md">
    Tạo file `SKILL.md` trong thư mục đó. Phần đầu YAML định nghĩa metadata, và phần thân markdown chứa hướng dẫn cho agent.

    ```markdown
    ---
    name: hello_world
    description: Một skill đơn giản để chào hỏi.
    ---

    # Skill Hello World

    Khi người dùng yêu cầu một lời chào, sử dụng công cụ `echo` để nói
    "Hello từ skill tùy chỉnh của bạn!".
    ```

  </Step>

  <Step title="Thêm công cụ (tùy chọn)">
    Bạn có thể định nghĩa các schema công cụ tùy chỉnh trong phần đầu YAML hoặc hướng dẫn agent sử dụng các công cụ hệ thống có sẵn (như `exec` hoặc `browser`). Skills cũng có thể được đóng gói trong plugins cùng với các công cụ mà chúng tài liệu.

  </Step>

  <Step title="Tải skill">
    Bắt đầu một phiên mới để OpenClaw nhận diện skill:

    ```bash
    # Từ chat
    /new

    # Hoặc khởi động lại gateway
    openclaw gateway restart
    ```

    Kiểm tra skill đã được tải:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="Kiểm tra">
    Gửi một tin nhắn để kích hoạt skill:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Hoặc chỉ cần trò chuyện với agent và yêu cầu một lời chào.

  </Step>
</Steps>

## Tham khảo metadata của skill

Phần đầu YAML hỗ trợ các trường sau:

| Trường                              | Bắt buộc | Mô tả                                      |
| ----------------------------------- | -------- | ------------------------------------------ |
| `name`                              | Có       | Định danh duy nhất (snake_case)            |
| `description`                       | Có       | Mô tả ngắn gọn hiển thị cho agent          |
| `metadata.openclaw.os`              | Không    | Bộ lọc hệ điều hành (`["darwin"]`, `["linux"]`, v.v.) |
| `metadata.openclaw.requires.bins`   | Không    | Các binary cần thiết trên PATH             |
| `metadata.openclaw.requires.config` | Không    | Các khóa cấu hình cần thiết                |

## Thực hành tốt nhất

- **Ngắn gọn** — hướng dẫn model _làm gì_, không phải cách trở thành AI
- **An toàn là trên hết** — nếu skill sử dụng `exec`, đảm bảo không cho phép chèn lệnh tùy ý từ đầu vào không tin cậy
- **Kiểm tra cục bộ** — sử dụng `openclaw agent --message "..."` để kiểm tra trước khi chia sẻ
- **Sử dụng ClawHub** — duyệt và đóng góp skills tại [ClawHub](https://clawhub.com)

## Nơi lưu trữ skills

| Vị trí                            | Ưu tiên   | Phạm vi               |
| --------------------------------- | --------- | --------------------- |
| `\<workspace\>/skills/`           | Cao nhất  | Theo từng agent       |
| `~/.openclaw/skills/`             | Trung bình| Chia sẻ (tất cả agents)|
| Đóng gói (kèm theo OpenClaw)      | Thấp nhất | Toàn cầu              |
| `skills.load.extraDirs`           | Thấp nhất | Thư mục chia sẻ tùy chỉnh |

## Liên quan

- [Tham khảo Skills](/tools/skills) — cách tải, ưu tiên và quy tắc chặn
- [Cấu hình Skills](/tools/skills-config) — schema cấu hình `skills.*`
- [ClawHub](/tools/clawhub) — registry skill công khai
- [Xây dựng Plugins](/plugins/building-plugins) — plugins có thể đóng gói skills

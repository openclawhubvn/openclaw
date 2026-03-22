---
title: "Tạo Skills"
summary: "Xây dựng và kiểm thử kỹ năng tùy chỉnh với SKILL.md"
read_when:
  - Đang tạo kỹ năng mới trong workspace
  - Cần workflow khởi động nhanh cho skills dựa trên SKILL.md
---

# Tạo Skills

Skills hướng dẫn agent cách và khi nào sử dụng công cụ. Mỗi skill là một thư mục chứa file `SKILL.md` với YAML frontmatter và hướng dẫn markdown.

Để biết cách load và ưu tiên skills, xem [Skills](/tools/skills).

## Tạo skill đầu tiên

<Steps>
  <Step title="Tạo thư mục skill">
    Skills nằm trong workspace. Tạo thư mục mới:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="Viết SKILL.md">
    Tạo `SKILL.md` trong thư mục đó. Frontmatter định nghĩa metadata, phần markdown chứa hướng dẫn cho agent.

    ```markdown
    ---
    name: hello_world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    Khi người dùng yêu cầu chào hỏi, dùng công cụ `echo` để nói
    "Hello from your custom skill!".
    ```

  </Step>

  <Step title="Thêm công cụ (tùy chọn)">
    Có thể định nghĩa schema công cụ tùy chỉnh trong frontmatter hoặc hướng dẫn agent dùng công cụ hệ thống có sẵn (như `exec` hoặc `browser`). Skills cũng có thể đi kèm trong plugins cùng với công cụ mà chúng tài liệu.

  </Step>

  <Step title="Load skill">
    Bắt đầu session mới để OpenClaw nhận diện skill:

    ```bash
    # Từ chat
    /new

    # Hoặc khởi động lại gateway
    openclaw gateway restart
    ```

    Kiểm tra skill đã load:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="Kiểm thử">
    Gửi tin nhắn kích hoạt skill:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Hoặc chat với agent và yêu cầu chào hỏi.

  </Step>
</Steps>

## Tham chiếu metadata skill

YAML frontmatter hỗ trợ các trường sau:

| Trường                             | Bắt buộc | Mô tả                                       |
| ---------------------------------- | -------- | ------------------------------------------- |
| `name`                             | Có       | Định danh duy nhất (snake_case)             |
| `description`                      | Có       | Mô tả ngắn gọn hiển thị cho agent           |
| `metadata.openclaw.os`             | Không    | Lọc OS (`["darwin"]`, `["linux"]`, v.v.)    |
| `metadata.openclaw.requires.bins`  | Không    | Binaries cần thiết trên PATH                |
| `metadata.openclaw.requires.config`| Không    | Các key config cần thiết                    |

## Thực hành tốt nhất

- **Ngắn gọn** — hướng dẫn model _làm gì_, không phải cách làm AI
- **An toàn trước tiên** — nếu skill dùng `exec`, đảm bảo không cho phép chèn lệnh tùy ý từ input không tin cậy
- **Kiểm thử local** — dùng `openclaw agent --message "..."` để kiểm thử trước khi chia sẻ
- **Dùng ClawHub** — duyệt và đóng góp skills tại [ClawHub](https://clawhub.com)

## Vị trí lưu trữ skills

| Vị trí                           | Ưu tiên   | Phạm vi               |
| -------------------------------- | ----------| --------------------- |
| `\<workspace\>/skills/`          | Cao nhất  | Theo từng agent       |
| `~/.openclaw/skills/`            | Trung bình| Chia sẻ (tất cả agents)|
| Đi kèm (cùng OpenClaw)           | Thấp nhất | Toàn cục              |
| `skills.load.extraDirs`          | Thấp nhất | Thư mục chia sẻ tùy chỉnh |

## Liên quan

- [Tham chiếu Skills](/tools/skills) — cách load, ưu tiên và quy tắc gating
- [Cấu hình Skills](/tools/skills-config) — schema config `skills.*`
- [ClawHub](/tools/clawhub) — registry skill công khai
- [Xây dựng Plugins](/plugins/building-plugins) — plugins có thể đi kèm skills\n
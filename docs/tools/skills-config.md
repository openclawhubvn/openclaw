---
summary: "Tìm hiểu cách cấu hình kỹ năng trong OpenClaw với hướng dẫn chi tiết và ví dụ thực tế, giúp tối ưu hóa trải nghiệm người dùng."
read_when:
  - Thêm hoặc chỉnh sửa cấu hình kỹ năng
  - Điều chỉnh danh sách cho phép hoặc hành vi cài đặt
title: "Hướng Dẫn Cấu Hình Kỹ Năng OpenClaw"
---

# Cấu hình Kỹ năng

Tất cả cấu hình liên quan đến kỹ năng nằm dưới `skills` trong `~/.openclaw/openclaw.json`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime vẫn là Node; không khuyến nghị dùng bun)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // hoặc chuỗi plaintext
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

Đối với việc tạo/chỉnh sửa hình ảnh tích hợp sẵn, ưu tiên `agents.defaults.imageGenerationModel`
cùng công cụ cốt lõi `image_generate`. `skills.entries.*` chỉ dành cho quy trình kỹ năng tùy chỉnh hoặc của bên thứ ba.

Ví dụ:

- Cài đặt kiểu Native Nano Banana: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Cài đặt kiểu Native fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Các trường

- `allowBundled`: danh sách cho phép tùy chọn chỉ dành cho kỹ năng **đi kèm**. Khi được thiết lập, chỉ những kỹ năng đi kèm trong danh sách mới đủ điều kiện (kỹ năng quản lý/khu vực làm việc không bị ảnh hưởng).
- `load.extraDirs`: thư mục kỹ năng bổ sung để quét (ưu tiên thấp nhất).
- `load.watch`: theo dõi thư mục kỹ năng và làm mới ảnh chụp nhanh kỹ năng (mặc định: true).
- `load.watchDebounceMs`: thời gian chờ cho sự kiện theo dõi kỹ năng tính bằng mili giây (mặc định: 250).
- `install.preferBrew`: ưu tiên cài đặt qua brew khi có sẵn (mặc định: true).
- `install.nodeManager`: ưu tiên trình cài đặt node (`npm` | `pnpm` | `yarn` | `bun`, mặc định: npm). Điều này chỉ ảnh hưởng đến **cài đặt kỹ năng**; runtime Gateway vẫn nên là Node (không khuyến nghị dùng Bun cho WhatsApp/Telegram).
- `entries.<skillKey>`: ghi đè theo từng kỹ năng.

Các trường theo từng kỹ năng:

- `enabled`: đặt `false` để vô hiệu hóa một kỹ năng ngay cả khi nó đã được đi kèm/cài đặt.
- `env`: biến môi trường được tiêm vào khi chạy agent (chỉ khi chưa được thiết lập).
- `apiKey`: tiện ích tùy chọn cho các kỹ năng khai báo biến môi trường chính. Hỗ trợ chuỗi plaintext hoặc đối tượng SecretRef (`{ source, provider, id }`).

## Ghi chú

- Các khóa dưới `entries` mặc định ánh xạ tới tên kỹ năng. Nếu một kỹ năng định nghĩa `metadata.openclaw.skillKey`, sử dụng khóa đó thay thế.
- Thay đổi đối với kỹ năng sẽ được cập nhật trong lần chạy agent tiếp theo khi chế độ theo dõi được bật.

### Kỹ năng trong sandbox + biến môi trường

Khi một phiên làm việc được **sandboxed**, các quy trình kỹ năng chạy bên trong Docker. Sandbox **không** kế thừa `process.env` của máy chủ.

Sử dụng một trong các cách sau:

- `agents.defaults.sandbox.docker.env` (hoặc theo từng agent `agents.list[].sandbox.docker.env`)
- tích hợp biến môi trường vào hình ảnh sandbox tùy chỉnh của bạn

Biến môi trường toàn cục `env` và `skills.entries.<skill>.env/apiKey` chỉ áp dụng cho các lần chạy trên **máy chủ**.

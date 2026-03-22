# Cấu hình Skills

Tất cả cấu hình liên quan đến skills nằm trong `skills` tại `~/.openclaw/openclaw.json`.

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

Để tạo/chỉnh sửa ảnh tích hợp sẵn, ưu tiên dùng `agents.defaults.imageGenerationModel` cùng công cụ `image_generate` cốt lõi. `skills.entries.*` chỉ dành cho workflow skill tùy chỉnh hoặc bên thứ ba.

Ví dụ:

- Cài đặt kiểu Native Nano Banana: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Cài đặt kiểu Native fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Các trường

- `allowBundled`: danh sách trắng tùy chọn cho skills **bundled**. Khi thiết lập, chỉ các skills bundled trong danh sách mới hợp lệ (skills managed/workspace không bị ảnh hưởng).
- `load.extraDirs`: thư mục skill bổ sung để quét (ưu tiên thấp nhất).
- `load.watch`: theo dõi thư mục skill và làm mới snapshot skills (mặc định: true).
- `load.watchDebounceMs`: thời gian debounce cho sự kiện watcher skill tính bằng mili giây (mặc định: 250).
- `install.preferBrew`: ưu tiên cài đặt qua brew khi có sẵn (mặc định: true).
- `install.nodeManager`: ưu tiên trình cài đặt node (`npm` | `pnpm` | `yarn` | `bun`, mặc định: npm). Chỉ ảnh hưởng đến **cài đặt skill**; runtime Gateway vẫn nên là Node (không khuyến nghị dùng Bun cho WhatsApp/Telegram).
- `entries.<skillKey>`: ghi đè từng skill.

Trường từng skill:

- `enabled`: đặt `false` để vô hiệu hóa skill ngay cả khi nó được bundled/cài đặt.
- `env`: biến môi trường được tiêm vào khi chạy agent (chỉ khi chưa được thiết lập).
- `apiKey`: tiện ích tùy chọn cho skills khai báo biến môi trường chính. Hỗ trợ chuỗi plaintext hoặc đối tượng SecretRef (`{ source, provider, id }`).

## Ghi chú

- Các khóa dưới `entries` mặc định ánh xạ tới tên skill. Nếu skill định nghĩa `metadata.openclaw.skillKey`, dùng khóa đó thay thế.
- Thay đổi skills sẽ được cập nhật trong lượt agent tiếp theo khi watcher được bật.

### Skills sandboxed + biến môi trường

Khi session **sandboxed**, các tiến trình skill chạy trong Docker. Sandbox **không** thừa hưởng `process.env` của host.

Sử dụng một trong các cách sau:

- `agents.defaults.sandbox.docker.env` (hoặc từng agent `agents.list[].sandbox.docker.env`)
- nhúng biến môi trường vào image sandbox tùy chỉnh

`env` toàn cục và `skills.entries.<skill>.env/apiKey` chỉ áp dụng cho các lần chạy **host**.\n
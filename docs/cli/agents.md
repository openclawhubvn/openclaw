---
summary: "Khám phá cách sử dụng CLI để quản lý OpenClaw Agents: liệt kê, thêm, xóa, ràng buộc và kết nối hiệu quả."
read_when:
  - Bạn muốn có nhiều agent độc lập (workspaces + định tuyến + xác thực)
title: "Hướng Dẫn Sử Dụng CLI OpenClaw Agents"
---

# `openclaw agents`

Quản lý các agent độc lập (workspaces + xác thực + định tuyến).

Liên quan:

- Định tuyến đa agent: [Định tuyến Đa Agent](/concepts/multi-agent)
- Workspace của agent: [Workspace của Agent](/concepts/agent-workspace)

## Ví dụ

```bash
openclaw agents list
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## Ràng buộc định tuyến

Sử dụng ràng buộc định tuyến để gán lưu lượng kênh đầu vào cho một agent cụ thể.

Liệt kê ràng buộc:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Thêm ràng buộc:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Nếu bạn bỏ qua `accountId` (`--bind <channel>`), OpenClaw sẽ tự động xác định từ các thiết lập mặc định của kênh và plugin khi có sẵn.

### Hành vi phạm vi ràng buộc

- Một ràng buộc không có `accountId` chỉ khớp với tài khoản mặc định của kênh.
- `accountId: "*"` là phương án dự phòng cho toàn bộ kênh (tất cả tài khoản) và ít cụ thể hơn so với ràng buộc tài khoản rõ ràng.
- Nếu cùng một agent đã có ràng buộc kênh khớp mà không có `accountId`, và sau đó bạn ràng buộc với `accountId` rõ ràng hoặc đã xác định, OpenClaw sẽ nâng cấp ràng buộc hiện có thay vì thêm bản sao.

Ví dụ:

```bash
# ràng buộc chỉ kênh ban đầu
openclaw agents bind --agent work --bind telegram

# sau đó nâng cấp lên ràng buộc theo tài khoản
openclaw agents bind --agent work --bind telegram:ops
```

Sau khi nâng cấp, định tuyến cho ràng buộc đó sẽ được giới hạn cho `telegram:ops`. Nếu bạn cũng muốn định tuyến tài khoản mặc định, hãy thêm nó rõ ràng (ví dụ `--bind telegram:default`).

Xóa ràng buộc:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

## Tệp danh tính

Mỗi workspace của agent có thể bao gồm một `IDENTITY.md` tại thư mục gốc của workspace:

- Đường dẫn ví dụ: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` đọc từ thư mục gốc của workspace (hoặc một `--identity-file` cụ thể)

Đường dẫn avatar được xác định tương đối so với thư mục gốc của workspace.

## Đặt danh tính

`set-identity` ghi các trường vào `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (đường dẫn tương đối workspace, URL http(s), hoặc data URI)

Tải từ `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Ghi đè các trường rõ ràng:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

Mẫu cấu hình:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "OpenClaw",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```

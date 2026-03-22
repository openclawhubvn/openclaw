# `openclaw agents`

Quản lý các agent độc lập (workspaces + auth + routing).

Liên quan:

- Multi-agent routing: [Multi-Agent Routing](/concepts/multi-agent)
- Agent workspace: [Agent workspace](/concepts/agent-workspace)

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

## Routing bindings

Dùng routing bindings để gán traffic từ channel inbound vào một agent cụ thể.

Liệt kê bindings:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Thêm bindings:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Nếu bỏ qua `accountId` (`--bind <channel>`), OpenClaw sẽ tự động lấy từ channel defaults và plugin setup hooks nếu có.

### Hành vi phạm vi binding

- Binding không có `accountId` chỉ khớp với tài khoản mặc định của channel.
- `accountId: "*"` là fallback cho toàn bộ channel (tất cả tài khoản) và ít cụ thể hơn binding tài khoản rõ ràng.
- Nếu agent đã có binding channel khớp mà không có `accountId`, và sau đó bind với `accountId` rõ ràng hoặc đã được giải quyết, OpenClaw sẽ nâng cấp binding hiện có thay vì thêm bản sao.

Ví dụ:

```bash
# binding chỉ cho channel ban đầu
openclaw agents bind --agent work --bind telegram

# sau đó nâng cấp lên binding theo tài khoản
openclaw agents bind --agent work --bind telegram:ops
```

Sau khi nâng cấp, routing cho binding đó sẽ được giới hạn cho `telegram:ops`. Nếu muốn routing cho tài khoản mặc định, thêm nó rõ ràng (ví dụ `--bind telegram:default`).

Xóa bindings:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

## Identity files

Mỗi agent workspace có thể bao gồm một `IDENTITY.md` tại thư mục gốc của workspace:

- Ví dụ đường dẫn: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` đọc từ thư mục gốc của workspace (hoặc một `--identity-file` rõ ràng)

Đường dẫn avatar được giải quyết tương đối so với thư mục gốc của workspace.

## Set identity

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
```\n
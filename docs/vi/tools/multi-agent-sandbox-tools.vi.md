---
summary: "Sandbox và hạn chế công cụ theo từng agent, thứ tự ưu tiên và ví dụ"
title: Cấu hình Sandbox & Công cụ cho Multi-Agent
read_when: "Khi cần sandbox hoặc chính sách cho phép/từ chối công cụ theo từng agent trong multi-agent gateway."
status: active
---

# Cấu hình Sandbox & Công cụ cho Multi-Agent

Mỗi agent trong hệ thống multi-agent có thể ghi đè chính sách sandbox và công cụ toàn cục. Trang này hướng dẫn cấu hình từng agent, quy tắc ưu tiên và ví dụ.

- **Backend và chế độ Sandbox**: xem [Sandboxing](/gateway/sandboxing).
- **Debug công cụ bị chặn**: xem [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) và `openclaw sandbox explain`.
- **Chế độ Elevated**: xem [Elevated Mode](/tools/elevated).

Xác thực theo từng agent: mỗi agent đọc từ kho auth riêng tại `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. Không chia sẻ credentials giữa các agent. Nếu cần chia sẻ, copy `auth-profiles.json` vào `agentDir` của agent khác.

---

## Ví dụ cấu hình

### Ví dụ 1: Agent Cá nhân + Gia đình bị hạn chế

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Personal Assistant",
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "family",
        "name": "Family Bot",
        "workspace": "~/.openclaw/workspace-family",
        "sandbox": {
          "mode": "all",
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"]
        }
      }
    ]
  },
  "bindings": [
    {
      "agentId": "family",
      "match": {
        "provider": "whatsapp",
        "accountId": "*",
        "peer": {
          "kind": "group",
          "id": "120363424282127706@g.us"
        }
      }
    }
  ]
}
```

**Kết quả:**

- Agent `main`: Chạy trên host, truy cập đầy đủ công cụ
- Agent `family`: Chạy trong Docker (mỗi agent một container), chỉ có công cụ `read`

---

### Ví dụ 2: Agent Công việc với Sandbox chia sẻ

```json
{
  "agents": {
    "list": [
      {
        "id": "personal",
        "workspace": "~/.openclaw/workspace-personal",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "work",
        "workspace": "~/.openclaw/workspace-work",
        "sandbox": {
          "mode": "all",
          "scope": "shared",
          "workspaceRoot": "/tmp/work-sandboxes"
        },
        "tools": {
          "allow": ["read", "write", "apply_patch", "exec"],
          "deny": ["browser", "gateway", "discord"]
        }
      }
    ]
  }
}
```

---

### Ví dụ 2b: Hồ sơ mã hóa toàn cầu + agent chỉ nhắn tin

```json
{
  "tools": { "profile": "coding" },
  "agents": {
    "list": [
      {
        "id": "support",
        "tools": { "profile": "messaging", "allow": ["slack"] }
      }
    ]
  }
}
```

**Kết quả:**

- Các agent mặc định có công cụ mã hóa
- Agent `support` chỉ nhắn tin (+ công cụ Slack)

---

### Ví dụ 3: Chế độ Sandbox khác nhau cho từng Agent

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main", // Mặc định toàn cục
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace",
        "sandbox": {
          "mode": "off" // Ghi đè: main không bao giờ sandbox
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // Ghi đè: public luôn sandbox
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch"]
        }
      }
    ]
  }
}
```

---

## Thứ tự ưu tiên cấu hình

Khi có cả cấu hình toàn cục (`agents.defaults.*`) và cấu hình riêng cho agent (`agents.list[].*`):

### Cấu hình Sandbox

Cấu hình riêng cho agent ghi đè toàn cục:

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

**Lưu ý:**

- `agents.list[].sandbox.{docker,browser,prune}.*` ghi đè `agents.defaults.sandbox.{docker,browser,prune}.*` cho agent đó (bỏ qua khi scope sandbox là `"shared"`).

### Hạn chế Công cụ

Thứ tự lọc:

1. **Hồ sơ công cụ** (`tools.profile` hoặc `agents.list[].tools.profile`)
2. **Hồ sơ công cụ theo provider** (`tools.byProvider[provider].profile` hoặc `agents.list[].tools.byProvider[provider].profile`)
3. **Chính sách công cụ toàn cục** (`tools.allow` / `tools.deny`)
4. **Chính sách công cụ theo provider** (`tools.byProvider[provider].allow/deny`)
5. **Chính sách công cụ riêng cho agent** (`agents.list[].tools.allow/deny`)
6. **Chính sách provider cho agent** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **Chính sách công cụ sandbox** (`tools.sandbox.tools` hoặc `agents.list[].tools.sandbox.tools`)
8. **Chính sách công cụ subagent** (`tools.subagents.tools`, nếu có)

Mỗi cấp chỉ có thể hạn chế thêm công cụ, không thể cấp lại công cụ đã bị từ chối từ các cấp trước. Nếu `agents.list[].tools.sandbox.tools` được đặt, nó thay thế `tools.sandbox.tools` cho agent đó. Nếu `agents.list[].tools.profile` được đặt, nó ghi đè `tools.profile` cho agent đó. Các khóa công cụ provider chấp nhận `provider` (ví dụ `google-antigravity`) hoặc `provider/model` (ví dụ `openai/gpt-5.2`).

Chính sách công cụ hỗ trợ `group:*` mở rộng thành nhiều công cụ. Xem [Tool groups](/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) để biết danh sách đầy đủ.

Ghi đè nâng cao theo agent (`agents.list[].tools.elevated`) có thể hạn chế thêm exec nâng cao cho các agent cụ thể. Xem [Elevated Mode](/tools/elevated) để biết chi tiết.

---

## Chuyển đổi từ Single Agent

**Trước (single agent):**

```json
{
  "agents": {
    "defaults": {
      "workspace": "~/.openclaw/workspace",
      "sandbox": {
        "mode": "non-main"
      }
    }
  },
  "tools": {
    "sandbox": {
      "tools": {
        "allow": ["read", "write", "apply_patch", "exec"],
        "deny": []
      }
    }
  }
}
```

**Sau (multi-agent với các hồ sơ khác nhau):**

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      }
    ]
  }
}
```

Cấu hình `agent.*` cũ được chuyển đổi bởi `openclaw doctor`; ưu tiên `agents.defaults` + `agents.list` trong tương lai.

---

## Ví dụ Hạn chế Công cụ

### Agent chỉ đọc

```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### Agent thực thi an toàn (không sửa file)

```json
{
  "tools": {
    "allow": ["read", "exec", "process"],
    "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
  }
}
```

### Agent chỉ giao tiếp

```json
{
  "tools": {
    "sessions": { "visibility": "tree" },
    "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
    "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
  }
}
```

---

## Lỗi thường gặp: "non-main"

`agents.defaults.sandbox.mode: "non-main"` dựa trên `session.mainKey` (mặc định `"main"`), không phải id agent. Các session nhóm/kênh luôn có key riêng, nên được coi là non-main và sẽ bị sandbox. Nếu muốn agent không bao giờ sandbox, đặt `agents.list[].sandbox.mode: "off"`.

---

## Kiểm tra

Sau khi cấu hình sandbox và công cụ cho multi-agent:

1. **Kiểm tra phân giải agent:**

   ```exec
   openclaw agents list --bindings
   ```

2. **Xác minh container sandbox:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **Kiểm tra hạn chế công cụ:**
   - Gửi tin nhắn yêu cầu công cụ bị hạn chế
   - Xác minh agent không thể sử dụng công cụ bị từ chối

4. **Theo dõi log:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## Khắc phục sự cố

### Agent không bị sandbox dù `mode: "all"`

- Kiểm tra xem có `agents.defaults.sandbox.mode` toàn cục ghi đè không
- Cấu hình riêng cho agent có ưu tiên, nên đặt `agents.list[].sandbox.mode: "all"`

### Công cụ vẫn có sẵn dù trong danh sách từ chối

- Kiểm tra thứ tự lọc công cụ: toàn cục → agent → sandbox → subagent
- Mỗi cấp chỉ có thể hạn chế thêm, không thể cấp lại
- Xác minh với log: `[tools] filtering tools for agent:${agentId}`

### Container không tách biệt theo agent

- Đặt `scope: "agent"` trong cấu hình sandbox riêng cho agent
- Mặc định là `"session"` tạo một container mỗi session

---

## Xem thêm

- [Sandboxing](/gateway/sandboxing) -- tham khảo sandbox đầy đủ (chế độ, phạm vi, backend, image)
- [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) -- debug "tại sao bị chặn?"
- [Elevated Mode](/tools/elevated)
- [Multi-Agent Routing](/concepts/multi-agent)
- [Cấu hình Sandbox](/gateway/configuration-reference#agents-defaults-sandbox)
- [Quản lý Session](/concepts/session)\n
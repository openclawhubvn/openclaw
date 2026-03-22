# Chế độ Elevated

Khi agent chạy trong sandbox, lệnh `exec` bị giới hạn trong môi trường sandbox. **Chế độ Elevated** cho phép agent thoát ra và chạy lệnh trên gateway host, với các cổng phê duyệt có thể cấu hình.

> Chế độ Elevated chỉ thay đổi hành vi khi agent **đang sandboxed**. Với agent không sandboxed, `exec` đã chạy trên host.

## Chỉ thị

Điều khiển chế độ Elevated theo từng session bằng slash command:

| Chỉ thị          | Chức năng                                             |
| ---------------- | ----------------------------------------------------- |
| `/elevated on`   | Chạy trên gateway host, giữ phê duyệt exec            |
| `/elevated ask`  | Giống như `on` (alias)                                |
| `/elevated full` | Chạy trên gateway host **và** bỏ qua phê duyệt exec   |
| `/elevated off`  | Quay lại chạy trong sandbox                           |

Cũng có thể dùng `/elev on|off|ask|full`.

Gửi `/elevated` không có tham số để xem mức hiện tại.

## Cách hoạt động

<Steps>
  <Step title="Kiểm tra khả dụng">
    Phải bật Elevated trong config và sender phải nằm trong allowlist:

    ```json5
    {
      tools: {
        elevated: {
          enabled: true,
          allowFrom: {
            discord: ["user-id-123"],
            whatsapp: ["+15555550123"],
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Thiết lập mức độ">
    Gửi tin nhắn chỉ có chỉ thị để đặt mặc định cho session:

    ```
    /elevated full
    ```

    Hoặc dùng inline (chỉ áp dụng cho tin nhắn đó):

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="Lệnh chạy trên host">
    Khi Elevated hoạt động, các lệnh `exec` sẽ được chuyển hướng tới gateway host thay vì sandbox. Ở chế độ `full`, bỏ qua phê duyệt exec. Ở chế độ `on`/`ask`, vẫn áp dụng các quy tắc phê duyệt đã cấu hình.
  </Step>
</Steps>

## Thứ tự ưu tiên

1. **Chỉ thị inline** trên tin nhắn (chỉ áp dụng cho tin nhắn đó)
2. **Ghi đè session** (đặt bằng cách gửi tin nhắn chỉ có chỉ thị)
3. **Mặc định toàn cục** (`agents.defaults.elevatedDefault` trong config)

## Khả dụng và allowlists

- **Cổng toàn cục**: `tools.elevated.enabled` (phải là `true`)
- **Allowlist sender**: `tools.elevated.allowFrom` với danh sách theo kênh
- **Cổng từng agent**: `agents.list[].tools.elevated.enabled` (chỉ có thể hạn chế thêm)
- **Allowlist từng agent**: `agents.list[].tools.elevated.allowFrom` (sender phải khớp cả toàn cục + từng agent)
- **Discord fallback**: nếu `tools.elevated.allowFrom.discord` bị bỏ qua, `channels.discord.allowFrom` được dùng làm fallback
- **Tất cả cổng phải thông qua**; nếu không Elevated được coi là không khả dụng

Định dạng mục allowlist:

| Tiền tố                 | Khớp với                          |
| ----------------------- | --------------------------------- |
| (không có)              | Sender ID, E.164, hoặc trường From|
| `name:`                 | Tên hiển thị của sender           |
| `username:`             | Tên người dùng của sender         |
| `tag:`                  | Tag của sender                    |
| `id:`, `from:`, `e164:` | Nhắm mục tiêu danh tính cụ thể    |

## Những gì Elevated không kiểm soát

- **Chính sách công cụ**: nếu `exec` bị từ chối bởi chính sách công cụ, Elevated không thể ghi đè
- **Tách biệt với `/exec`**: chỉ thị `/exec` điều chỉnh mặc định exec theo session cho sender được ủy quyền và không yêu cầu chế độ Elevated

## Liên quan

- [Exec tool](/tools/exec) — thực thi lệnh shell
- [Exec approvals](/tools/exec-approvals) — hệ thống phê duyệt và allowlist
- [Sandboxing](/gateway/sandboxing) — cấu hình sandbox
- [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)\n
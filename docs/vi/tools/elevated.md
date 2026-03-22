---
summary: "Chế độ nâng cao: chạy lệnh trên máy chủ gateway từ agent bị cô lập"
read_when:
  - Điều chỉnh mặc định chế độ nâng cao, danh sách cho phép, hoặc hành vi lệnh gạch chéo
  - Hiểu cách agent bị cô lập có thể truy cập máy chủ
title: "Chế độ Nâng Cao"
---

# Chế độ Nâng Cao

Khi một agent chạy trong môi trường cô lập, các lệnh `exec` của nó bị giới hạn trong môi trường đó. **Chế độ nâng cao** cho phép agent thoát ra và chạy lệnh trên máy chủ gateway, với các cổng phê duyệt có thể cấu hình.

<Info>
  Chế độ nâng cao chỉ thay đổi hành vi khi agent đang **bị cô lập**. Đối với các agent không bị cô lập, `exec` đã chạy trên máy chủ.
</Info>

## Chỉ thị

Điều khiển chế độ nâng cao theo từng phiên với các lệnh gạch chéo:

| Chỉ thị          | Chức năng                                               |
| ---------------- | ------------------------------------------------------- |
| `/elevated on`   | Chạy trên máy chủ gateway, giữ lại phê duyệt exec       |
| `/elevated ask`  | Giống như `on` (tên khác)                              |
| `/elevated full` | Chạy trên máy chủ gateway **và** bỏ qua phê duyệt exec  |
| `/elevated off`  | Quay lại thực thi bị giới hạn trong môi trường cô lập   |

Cũng có thể sử dụng dưới dạng `/elev on|off|ask|full`.

Gửi `/elevated` không có tham số để xem mức hiện tại.

## Cách hoạt động

<Steps>
  <Step title="Kiểm tra khả dụng">
    Chế độ nâng cao phải được bật trong cấu hình và người gửi phải có trong danh sách cho phép:

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
    Gửi một tin nhắn chỉ có chỉ thị để thiết lập mặc định cho phiên:

    ```
    /elevated full
    ```

    Hoặc sử dụng trong dòng (áp dụng cho tin nhắn đó):

    ```
    /elevated on chạy script triển khai
    ```

  </Step>

  <Step title="Lệnh chạy trên máy chủ">
    Khi chế độ nâng cao hoạt động, các cuộc gọi `exec` được chuyển đến máy chủ gateway thay vì môi trường cô lập. Trong chế độ `full`, phê duyệt exec bị bỏ qua. Trong chế độ `on`/`ask`, các quy tắc phê duyệt đã cấu hình vẫn áp dụng.
  </Step>
</Steps>

## Thứ tự giải quyết

1. **Chỉ thị trong dòng** trên tin nhắn (chỉ áp dụng cho tin nhắn đó)
2. **Ghi đè phiên** (được thiết lập bằng cách gửi một tin nhắn chỉ có chỉ thị)
3. **Mặc định toàn cầu** (`agents.defaults.elevatedDefault` trong cấu hình)

## Khả dụng và danh sách cho phép

- **Cổng toàn cầu**: `tools.elevated.enabled` (phải là `true`)
- **Danh sách cho phép người gửi**: `tools.elevated.allowFrom` với danh sách theo kênh
- **Cổng theo agent**: `agents.list[].tools.elevated.enabled` (chỉ có thể hạn chế thêm)
- **Danh sách cho phép theo agent**: `agents.list[].tools.elevated.allowFrom` (người gửi phải khớp cả toàn cầu + theo agent)
- **Dự phòng Discord**: nếu `tools.elevated.allowFrom.discord` bị bỏ qua, `channels.discord.allowFrom` được sử dụng làm dự phòng
- **Tất cả các cổng phải thông qua**; nếu không, chế độ nâng cao được coi là không khả dụng

Định dạng mục danh sách cho phép:

| Tiền tố                 | Khớp với                          |
| ----------------------- | --------------------------------- |
| (không có)              | ID người gửi, E.164, hoặc trường From |
| `name:`                 | Tên hiển thị của người gửi        |
| `username:`             | Tên người dùng của người gửi      |
| `tag:`                  | Thẻ của người gửi                 |
| `id:`, `from:`, `e164:` | Nhắm mục tiêu danh tính cụ thể    |

## Những gì chế độ nâng cao không kiểm soát

- **Chính sách công cụ**: nếu `exec` bị từ chối bởi chính sách công cụ, chế độ nâng cao không thể ghi đè
- **Riêng biệt với `/exec`**: chỉ thị `/exec` điều chỉnh mặc định exec theo phiên cho người gửi được ủy quyền và không yêu cầu chế độ nâng cao

## Liên quan

- [Công cụ Exec](/tools/exec) — thực thi lệnh shell
- [Phê duyệt Exec](/tools/exec-approvals) — hệ thống phê duyệt và danh sách cho phép
- [Cô lập](/gateway/sandboxing) — cấu hình môi trường cô lập
- [Cô lập vs Chính sách Công cụ vs Nâng Cao](/gateway/sandbox-vs-tool-policy-vs-elevated)

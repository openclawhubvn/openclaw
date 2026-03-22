---
summary: "Khám phá cách sử dụng lệnh OpenClaw Memory để quản lý trạng thái, chỉ mục và tìm kiếm hiệu quả."
read_when:
  - Bạn muốn lập chỉ mục hoặc tìm kiếm bộ nhớ ngữ nghĩa
  - Bạn đang gỡ lỗi khả năng bộ nhớ hoặc lập chỉ mục
title: "Hướng Dẫn Sử Dụng OpenClaw Memory CLI"
---

# `openclaw memory`

Quản lý lập chỉ mục và tìm kiếm bộ nhớ ngữ nghĩa.
Được cung cấp bởi plugin bộ nhớ đang hoạt động (mặc định: `memory-core`; đặt `plugins.slots.memory = "none"` để vô hiệu hóa).

Liên quan:

- Khái niệm bộ nhớ: [Memory](/concepts/memory)
- Plugins: [Plugins](/tools/plugin)

## Ví dụ

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory index --force
openclaw memory search "meeting notes"
openclaw memory search --query "deployment" --max-results 20
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## Tùy chọn

`memory status` và `memory index`:

- `--agent <id>`: chỉ định phạm vi cho một agent duy nhất. Nếu không có, các lệnh này sẽ chạy cho mỗi agent đã cấu hình; nếu không có danh sách agent nào được cấu hình, chúng sẽ quay về agent mặc định.
- `--verbose`: xuất nhật ký chi tiết trong quá trình kiểm tra và lập chỉ mục.

`memory status`:

- `--deep`: kiểm tra khả năng vector + embedding.
- `--index`: chạy lập chỉ mục lại nếu kho lưu trữ bị thay đổi (bao gồm `--deep`).
- `--json`: xuất kết quả dưới dạng JSON.

`memory index`:

- `--force`: buộc lập chỉ mục lại toàn bộ.

`memory search`:

- Đầu vào truy vấn: có thể truyền dưới dạng `[query]` hoặc `--query <text>`.
- Nếu cả hai đều được cung cấp, `--query` sẽ được ưu tiên.
- Nếu không có cái nào được cung cấp, lệnh sẽ thoát với lỗi.
- `--agent <id>`: chỉ định phạm vi cho một agent duy nhất (mặc định: agent mặc định).
- `--max-results <n>`: giới hạn số lượng kết quả trả về.
- `--min-score <n>`: lọc các kết quả có điểm thấp.
- `--json`: xuất kết quả dưới dạng JSON.

Lưu ý:

- `memory index --verbose` in chi tiết từng giai đoạn (nhà cung cấp, mô hình, nguồn, hoạt động theo lô).
- `memory status` bao gồm bất kỳ đường dẫn bổ sung nào được cấu hình qua `memorySearch.extraPaths`.
- Nếu các trường khóa API bộ nhớ từ xa đang hoạt động được cấu hình dưới dạng SecretRefs, lệnh sẽ giải quyết các giá trị đó từ ảnh chụp nhanh của gateway đang hoạt động. Nếu gateway không khả dụng, lệnh sẽ thất bại nhanh chóng.
- Lưu ý về phiên bản gateway: đường dẫn lệnh này yêu cầu một gateway hỗ trợ `secrets.resolve`; các gateway cũ hơn sẽ trả về lỗi phương thức không xác định.

# `openclaw memory`

Quản lý việc index và tìm kiếm bộ nhớ ngữ nghĩa. Được cung cấp bởi plugin memory đang hoạt động (mặc định: `memory-core`; đặt `plugins.slots.memory = "none"` để tắt).

Liên quan:

- Khái niệm Memory: [Memory](/concepts/memory)
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

- `--agent <id>`: chỉ định một agent cụ thể. Nếu không có, lệnh sẽ chạy cho từng agent đã cấu hình; nếu không có danh sách agent, sẽ dùng agent mặc định.
- `--verbose`: xuất log chi tiết trong quá trình kiểm tra và index.

`memory status`:

- `--deep`: kiểm tra vector + khả năng embedding.
- `--index`: chạy reindex nếu store bị bẩn (bao gồm `--deep`).
- `--json`: xuất kết quả dưới dạng JSON.

`memory index`:

- `--force`: ép buộc reindex toàn bộ.

`memory search`:

- Đầu vào truy vấn: dùng `[query]` hoặc `--query <text>`.
- Nếu có cả hai, `--query` sẽ được ưu tiên.
- Nếu không có, lệnh sẽ báo lỗi và thoát.
- `--agent <id>`: chỉ định một agent cụ thể (mặc định: agent mặc định).
- `--max-results <n>`: giới hạn số lượng kết quả trả về.
- `--min-score <n>`: lọc bỏ các kết quả có điểm thấp.
- `--json`: xuất kết quả dưới dạng JSON.

Ghi chú:

- `memory index --verbose` in chi tiết từng giai đoạn (provider, model, nguồn, hoạt động batch).
- `memory status` bao gồm các đường dẫn bổ sung được cấu hình qua `memorySearch.extraPaths`.
- Nếu các trường API key remote memory được cấu hình là SecretRefs, lệnh sẽ lấy giá trị từ snapshot gateway đang hoạt động. Nếu gateway không khả dụng, lệnh sẽ báo lỗi ngay.
- Lưu ý về phiên bản gateway: đường dẫn lệnh này yêu cầu gateway hỗ trợ `secrets.resolve`; các gateway cũ hơn sẽ trả về lỗi phương thức không xác định.\n
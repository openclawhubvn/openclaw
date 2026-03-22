---
summary: "Khám phá cách áp dụng bản vá nhiều file hiệu quả với công cụ apply_patch. Nâng cao hiệu suất công việc của bạn ngay hôm nay."
read_when:
  - Cần chỉnh sửa cấu trúc file trên nhiều file
  - Muốn ghi lại hoặc gỡ lỗi các chỉnh sửa dựa trên bản vá
title: "Hướng Dẫn Sử Dụng Công Cụ Apply Patch"
---

# Công cụ apply_patch

Áp dụng thay đổi file bằng định dạng bản vá có cấu trúc. Điều này lý tưởng cho các chỉnh sửa nhiều file hoặc nhiều đoạn, nơi một lệnh `edit` đơn lẻ có thể không đủ linh hoạt.

Công cụ này chấp nhận một chuỗi `input` duy nhất bao gồm một hoặc nhiều thao tác trên file:

```
*** Begin Patch
*** Add File: path/to/file.txt
+line 1
+line 2
*** Update File: src/app.ts
@@
-old line
+new line
*** Delete File: obsolete.txt
*** End Patch
```

## Tham số

- `input` (bắt buộc): Nội dung đầy đủ của bản vá bao gồm `*** Begin Patch` và `*** End Patch`.

## Lưu ý

- Đường dẫn trong bản vá hỗ trợ cả đường dẫn tương đối (từ thư mục workspace) và đường dẫn tuyệt đối.
- `tools.exec.applyPatch.workspaceOnly` mặc định là `true` (chỉ trong workspace). Chỉ đặt thành `false` nếu bạn thực sự muốn `apply_patch` ghi/xóa ngoài thư mục workspace.
- Sử dụng `*** Move to:` trong một đoạn `*** Update File:` để đổi tên file.
- `*** End of File` đánh dấu một chèn chỉ EOF khi cần thiết.
- Tính năng thử nghiệm và bị vô hiệu hóa theo mặc định. Kích hoạt với `tools.exec.applyPatch.enabled`.
- Chỉ dành cho OpenAI (bao gồm OpenAI Codex). Có thể giới hạn theo mô hình qua `tools.exec.applyPatch.allowModels`.
- Cấu hình chỉ nằm dưới `tools.exec`.

## Ví dụ

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```

---
summary: "Sử dụng công cụ apply_patch để áp dụng patch nhiều file"
read_when:
  - Cần chỉnh sửa file có cấu trúc trên nhiều file
  - Muốn ghi lại hoặc debug các chỉnh sửa dựa trên patch
title: "Công cụ apply_patch"
---

# Công cụ apply_patch

Áp dụng thay đổi file bằng định dạng patch có cấu trúc. Thích hợp cho các chỉnh sửa nhiều file hoặc nhiều hunk, nơi một lệnh `edit` đơn lẻ sẽ dễ bị lỗi.

Công cụ nhận một chuỗi `input` chứa một hoặc nhiều thao tác file:

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

- `input` (bắt buộc): Nội dung patch đầy đủ bao gồm `*** Begin Patch` và `*** End Patch`.

## Lưu ý

- Đường dẫn patch hỗ trợ cả đường dẫn tương đối (từ thư mục workspace) và đường dẫn tuyệt đối.
- `tools.exec.applyPatch.workspaceOnly` mặc định là `true` (chỉ trong workspace). Chỉ đặt thành `false` nếu muốn `apply_patch` ghi/xóa ngoài thư mục workspace.
- Sử dụng `*** Move to:` trong một hunk `*** Update File:` để đổi tên file.
- `*** End of File` đánh dấu chèn chỉ EOF khi cần.
- Tính năng thử nghiệm và mặc định bị tắt. Kích hoạt với `tools.exec.applyPatch.enabled`.
- Chỉ dành cho OpenAI (bao gồm OpenAI Codex). Có thể giới hạn theo model qua `tools.exec.applyPatch.allowModels`.
- Cấu hình chỉ nằm dưới `tools.exec`.

## Ví dụ

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```\n
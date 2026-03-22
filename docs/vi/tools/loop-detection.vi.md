---
title: "Phát hiện vòng lặp công cụ"
summary: "Cách bật và điều chỉnh bảo vệ phát hiện vòng lặp gọi công cụ lặp lại"
read_when:
  - Người dùng báo cáo agent bị kẹt trong vòng lặp gọi công cụ
  - Cần điều chỉnh bảo vệ gọi lặp lại
  - Đang chỉnh sửa chính sách công cụ/runtime của agent
---

# Phát hiện vòng lặp công cụ

OpenClaw giúp ngăn agent bị kẹt trong các vòng lặp gọi công cụ lặp lại. Tính năng này **mặc định bị tắt**.

Chỉ bật khi cần, vì có thể chặn các cuộc gọi hợp lệ nếu cài đặt quá nghiêm ngặt.

## Tại sao cần có

- Phát hiện chuỗi lặp lại không tiến triển.
- Phát hiện vòng lặp tần suất cao không có kết quả (cùng công cụ, cùng input, lỗi lặp lại).
- Phát hiện mẫu gọi lặp lại cụ thể cho các công cụ polling đã biết.

## Khối cấu hình

Mặc định toàn cục:

```json5
{
  tools: {
    loopDetection: {
      enabled: false,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

Ghi đè theo agent (tùy chọn):

```json5
{
  agents: {
    list: [
      {
        id: "safe-runner",
        tools: {
          loopDetection: {
            enabled: true,
            warningThreshold: 8,
            criticalThreshold: 16,
          },
        },
      },
    ],
  },
}
```

### Hành vi của các trường

- `enabled`: Công tắc chính. `false` nghĩa là không thực hiện phát hiện vòng lặp.
- `historySize`: số lượng cuộc gọi công cụ gần đây được giữ lại để phân tích.
- `warningThreshold`: ngưỡng trước khi phân loại mẫu là chỉ cảnh báo.
- `criticalThreshold`: ngưỡng để chặn mẫu vòng lặp lặp lại.
- `globalCircuitBreakerThreshold`: ngưỡng ngắt toàn cục không tiến triển.
- `detectors.genericRepeat`: phát hiện mẫu lặp lại cùng công cụ + cùng tham số.
- `detectors.knownPollNoProgress`: phát hiện mẫu polling đã biết không thay đổi trạng thái.
- `detectors.pingPong`: phát hiện mẫu ping-pong luân phiên.

## Cài đặt khuyến nghị

- Bắt đầu với `enabled: true`, giữ nguyên mặc định.
- Giữ thứ tự ngưỡng là `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Nếu gặp false positives:
  - tăng `warningThreshold` và/hoặc `criticalThreshold`
  - (tùy chọn) tăng `globalCircuitBreakerThreshold`
  - tắt chỉ detector gây vấn đề
  - giảm `historySize` để bớt nghiêm ngặt về ngữ cảnh lịch sử

## Log và hành vi mong đợi

Khi phát hiện vòng lặp, OpenClaw báo cáo sự kiện vòng lặp và chặn hoặc giảm nhẹ chu kỳ công cụ tiếp theo tùy theo mức độ nghiêm trọng. Điều này bảo vệ người dùng khỏi tiêu tốn token không kiểm soát và bị khóa trong khi vẫn giữ quyền truy cập công cụ bình thường.

- Ưu tiên cảnh báo và giảm nhẹ tạm thời trước.
- Chỉ leo thang khi có bằng chứng lặp lại tích lũy.

## Ghi chú

- `tools.loopDetection` được hợp nhất với ghi đè cấp agent.
- Cấu hình theo agent hoàn toàn ghi đè hoặc mở rộng giá trị toàn cục.
- Nếu không có cấu hình, bảo vệ vẫn tắt.\n
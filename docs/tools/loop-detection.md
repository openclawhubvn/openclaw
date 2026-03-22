---
title: "Hướng Dẫn Phát Hiện Vòng Lặp Công Cụ"
summary: "Tìm hiểu cách kích hoạt và điều chỉnh bảo vệ để phát hiện vòng lặp công cụ hiệu quả, đảm bảo hệ thống hoạt động ổn định."
read_when:
  - Người dùng báo cáo agent bị kẹt trong việc lặp lại gọi công cụ
  - Cần điều chỉnh bảo vệ gọi lặp lại
  - Đang chỉnh sửa chính sách công cụ/thời gian chạy của agent
---

# Phát hiện vòng lặp công cụ

OpenClaw có thể ngăn chặn agent bị kẹt trong các mẫu lặp lại gọi công cụ. Tính năng này **mặc định bị vô hiệu hóa**.

Chỉ kích hoạt khi cần thiết, vì có thể chặn các cuộc gọi lặp lại hợp lệ nếu cài đặt quá nghiêm ngặt.

## Tại sao cần tính năng này

- Phát hiện các chuỗi lặp lại không tiến triển.
- Phát hiện vòng lặp tần suất cao không có kết quả (cùng công cụ, cùng đầu vào, lỗi lặp lại).
- Phát hiện các mẫu gọi lặp lại cụ thể cho các công cụ thăm dò đã biết.

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

Ghi đè theo từng agent (tùy chọn):

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
- `warningThreshold`: ngưỡng trước khi phân loại một mẫu là chỉ cảnh báo.
- `criticalThreshold`: ngưỡng để chặn các mẫu vòng lặp lặp lại.
- `globalCircuitBreakerThreshold`: ngưỡng ngắt toàn cục khi không có tiến triển.
- `detectors.genericRepeat`: phát hiện các mẫu lặp lại cùng công cụ + cùng tham số.
- `detectors.knownPollNoProgress`: phát hiện các mẫu thăm dò đã biết không có thay đổi trạng thái.
- `detectors.pingPong`: phát hiện các mẫu ping-pong luân phiên.

## Cài đặt khuyến nghị

- Bắt đầu với `enabled: true`, giữ nguyên mặc định.
- Giữ thứ tự ngưỡng là `warningThreshold < criticalThreshold < globalCircuitBreakerThreshold`.
- Nếu xảy ra dương tính giả:
  - tăng `warningThreshold` và/hoặc `criticalThreshold`
  - (tùy chọn) tăng `globalCircuitBreakerThreshold`
  - vô hiệu hóa chỉ detector gây ra vấn đề
  - giảm `historySize` để bớt nghiêm ngặt về ngữ cảnh lịch sử

## Nhật ký và hành vi mong đợi

Khi phát hiện vòng lặp, OpenClaw báo cáo sự kiện vòng lặp và chặn hoặc giảm nhẹ chu kỳ công cụ tiếp theo tùy theo mức độ nghiêm trọng. Điều này bảo vệ người dùng khỏi việc tiêu tốn token không kiểm soát và bị kẹt, đồng thời vẫn duy trì truy cập công cụ bình thường.

- Ưu tiên cảnh báo và giảm nhẹ tạm thời trước.
- Chỉ leo thang khi có bằng chứng lặp lại tích lũy.

## Ghi chú

- `tools.loopDetection` được kết hợp với ghi đè cấp agent.
- Cấu hình theo từng agent hoàn toàn ghi đè hoặc mở rộng giá trị toàn cục.
- Nếu không có cấu hình, các biện pháp bảo vệ sẽ không hoạt động.

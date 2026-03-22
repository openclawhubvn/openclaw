---
title: "Hướng Dẫn Tỉa Bớt Phiên Làm Việc OpenClaw"
summary: "Tối ưu hóa hiệu suất bằng cách tỉa bớt phiên làm việc, giảm tải ngữ cảnh và cải thiện tốc độ xử lý công cụ."
read_when:
  - Bạn muốn giảm sự phát triển ngữ cảnh LLM từ kết quả công cụ
  - Bạn đang điều chỉnh agents.defaults.contextPruning
---

# Tỉa Bớt Phiên Làm Việc

Tỉa bớt phiên làm việc giúp loại bỏ **kết quả công cụ cũ** khỏi ngữ cảnh trong bộ nhớ ngay trước mỗi lần gọi LLM. Nó **không** viết lại lịch sử phiên trên đĩa (`*.jsonl`).

## Khi nào nó hoạt động

- Khi `mode: "cache-ttl"` được kích hoạt và lần gọi Anthropic cuối cùng cho phiên đã cũ hơn `ttl`.
- Chỉ ảnh hưởng đến các tin nhắn gửi đến mô hình cho yêu cầu đó.
- Chỉ hoạt động cho các cuộc gọi API Anthropic (và các mô hình OpenRouter Anthropic).
- Để đạt kết quả tốt nhất, hãy khớp `ttl` với chính sách `cacheRetention` của mô hình (`short` = 5 phút, `long` = 1 giờ).
- Sau khi tỉa, cửa sổ TTL được đặt lại để các yêu cầu tiếp theo giữ cache cho đến khi `ttl` hết hạn lần nữa.

## Mặc định thông minh (Anthropic)

- Hồ sơ **OAuth hoặc setup-token**: kích hoạt tỉa `cache-ttl` và đặt nhịp tim là `1 giờ`.
- Hồ sơ **API key**: kích hoạt tỉa `cache-ttl`, đặt nhịp tim là `30 phút`, và mặc định `cacheRetention: "short"` trên các mô hình Anthropic.
- Nếu bạn đặt bất kỳ giá trị nào trong số này một cách rõ ràng, OpenClaw sẽ **không** ghi đè chúng.

## Cải thiện gì (chi phí + hành vi cache)

- **Tại sao tỉa:** Cache prompt của Anthropic chỉ áp dụng trong TTL. Nếu một phiên không hoạt động quá TTL, yêu cầu tiếp theo sẽ cache lại toàn bộ prompt trừ khi bạn tỉa nó trước.
- **Cái gì rẻ hơn:** tỉa bớt giảm kích thước **cacheWrite** cho yêu cầu đầu tiên sau khi TTL hết hạn.
- **Tại sao việc đặt lại TTL quan trọng:** một khi tỉa bớt chạy, cửa sổ cache được đặt lại, vì vậy các yêu cầu tiếp theo có thể tái sử dụng prompt đã cache mới thay vì cache lại toàn bộ lịch sử.
- **Nó không làm gì:** tỉa bớt không thêm token hoặc "nhân đôi" chi phí; nó chỉ thay đổi những gì được cache trong yêu cầu đầu tiên sau TTL.

## Những gì có thể được tỉa

- Chỉ các tin nhắn `toolResult`.
- Tin nhắn người dùng + trợ lý **không bao giờ** bị sửa đổi.
- Các tin nhắn trợ lý cuối cùng `keepLastAssistants` được bảo vệ; kết quả công cụ sau đó không bị tỉa.
- Nếu không có đủ tin nhắn trợ lý để thiết lập điểm cắt, tỉa bớt bị bỏ qua.
- Kết quả công cụ chứa **khối hình ảnh** bị bỏ qua (không bao giờ bị tỉa/xóa).

## Ước lượng cửa sổ ngữ cảnh

Tỉa bớt sử dụng một cửa sổ ngữ cảnh ước lượng (ký tự ≈ token × 4). Cửa sổ cơ bản được xác định theo thứ tự sau:

1. Ghi đè `models.providers.*.models[].contextWindow`.
2. Định nghĩa mô hình `contextWindow` (từ registry mô hình).
3. Mặc định `200000` token.

Nếu `agents.defaults.contextTokens` được đặt, nó được coi là giới hạn (tối thiểu) trên cửa sổ đã xác định.

## Chế độ

### cache-ttl

- Tỉa bớt chỉ chạy nếu lần gọi Anthropic cuối cùng cũ hơn `ttl` (mặc định `5 phút`).
- Khi nó chạy: cùng hành vi tỉa mềm + xóa cứng như trước.

## Tỉa mềm và tỉa cứng

- **Tỉa mềm**: chỉ dành cho kết quả công cụ quá lớn.
  - Giữ đầu + đuôi, chèn `...`, và thêm ghi chú với kích thước gốc.
  - Bỏ qua kết quả có khối hình ảnh.
- **Xóa cứng**: thay thế toàn bộ kết quả công cụ bằng `hardClear.placeholder`.

## Lựa chọn công cụ

- `tools.allow` / `tools.deny` hỗ trợ ký tự đại diện `*`.
- Deny thắng.
- So khớp không phân biệt chữ hoa chữ thường.
- Danh sách cho phép trống => tất cả công cụ được phép.

## Tương tác với các giới hạn khác

- Công cụ tích hợp sẵn đã tự cắt ngắn đầu ra của chúng; tỉa bớt phiên là một lớp bổ sung ngăn chặn các cuộc trò chuyện kéo dài tích lũy quá nhiều đầu ra công cụ trong ngữ cảnh mô hình.
- Nén là riêng biệt: nén tóm tắt và lưu trữ, tỉa bớt là tạm thời cho mỗi yêu cầu. Xem [/concepts/compaction](/concepts/compaction).

## Mặc định (khi được kích hoạt)

- `ttl`: `"5 phút"`
- `keepLastAssistants`: `3`
- `softTrimRatio`: `0.3`
- `hardClearRatio`: `0.5`
- `minPrunableToolChars`: `50000`
- `softTrim`: `{ maxChars: 4000, headChars: 1500, tailChars: 1500 }`
- `hardClear`: `{ enabled: true, placeholder: "[Nội dung kết quả công cụ cũ đã bị xóa]" }`

## Ví dụ

Mặc định (tắt):

```json5
{
  agents: { defaults: { contextPruning: { mode: "off" } } },
}
```

Kích hoạt tỉa bớt theo TTL:

```json5
{
  agents: { defaults: { contextPruning: { mode: "cache-ttl", ttl: "5m" } } },
}
```

Giới hạn tỉa bớt cho các công cụ cụ thể:

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl",
        tools: { allow: ["exec", "read"], deny: ["*image*"] },
      },
    },
  },
}
```

Xem tham khảo cấu hình: [Cấu hình Gateway](/gateway/configuration)

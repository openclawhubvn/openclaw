---
title: "Session Pruning"
summary: "Session pruning: cắt tỉa kết quả tool để giảm phình to context"
read_when:
  - Muốn giảm phình to context LLM từ output của tool
  - Đang tinh chỉnh agents.defaults.contextPruning
---

# Session Pruning

Session pruning cắt tỉa **kết quả tool cũ** khỏi context trong bộ nhớ ngay trước mỗi lần gọi LLM. Không ghi đè lịch sử session trên đĩa (`*.jsonl`).

## Khi nào chạy

- Khi `mode: "cache-ttl"` bật và lần gọi Anthropic cuối cho session cũ hơn `ttl`.
- Chỉ ảnh hưởng đến message gửi đến model cho request đó.
- Chỉ hoạt động với các cuộc gọi API Anthropic (và model OpenRouter Anthropic).
- Để tối ưu, khớp `ttl` với chính sách `cacheRetention` của model (`short` = 5 phút, `long` = 1 giờ).
- Sau khi prune, cửa sổ TTL reset để các request tiếp theo giữ cache cho đến khi `ttl` hết hạn.

## Smart defaults (Anthropic)

- Profile **OAuth hoặc setup-token**: bật pruning `cache-ttl` và đặt heartbeat là `1h`.
- Profile **API key**: bật pruning `cache-ttl`, đặt heartbeat là `30m`, và mặc định `cacheRetention: "short"` trên model Anthropic.
- Nếu đã đặt các giá trị này rõ ràng, OpenClaw sẽ **không** ghi đè.

## Cải thiện gì (chi phí + hành vi cache)

- **Tại sao prune:** Cache prompt Anthropic chỉ áp dụng trong TTL. Nếu session không hoạt động quá TTL, request tiếp theo sẽ cache lại toàn bộ prompt trừ khi cắt tỉa trước.
- **Giảm chi phí gì:** pruning giảm kích thước **cacheWrite** cho request đầu tiên sau khi TTL hết hạn.
- **Tại sao reset TTL quan trọng:** khi pruning chạy, cửa sổ cache reset, nên các request tiếp theo có thể tái sử dụng prompt đã cache thay vì cache lại toàn bộ lịch sử.
- **Không làm gì:** pruning không thêm token hay "nhân đôi" chi phí; chỉ thay đổi cái gì được cache trong request đầu tiên sau TTL.

## Cái gì có thể prune

- Chỉ message `toolResult`.
- Message user + assistant **không bao giờ** bị chỉnh sửa.
- Các message assistant cuối `keepLastAssistants` được bảo vệ; kết quả tool sau đó không bị prune.
- Nếu không đủ message assistant để xác định cutoff, bỏ qua pruning.
- Kết quả tool chứa **image blocks** bị bỏ qua (không cắt tỉa/xóa).

## Ước lượng cửa sổ context

Pruning dùng ước lượng cửa sổ context (chars ≈ tokens × 4). Cửa sổ cơ bản được xác định theo thứ tự:

1. Ghi đè `models.providers.*.models[].contextWindow`.
2. Định nghĩa model `contextWindow` (từ registry model).
3. Mặc định `200000` tokens.

Nếu `agents.defaults.contextTokens` được đặt, nó được coi là giới hạn (min) trên cửa sổ đã xác định.

## Mode

### cache-ttl

- Pruning chỉ chạy nếu lần gọi Anthropic cuối cũ hơn `ttl` (mặc định `5m`).
- Khi chạy: hành vi soft-trim + hard-clear như trước.

## Soft vs hard pruning

- **Soft-trim**: chỉ cho kết quả tool quá lớn.
  - Giữ đầu + đuôi, chèn `...`, và thêm ghi chú kích thước gốc.
  - Bỏ qua kết quả có image blocks.
- **Hard-clear**: thay thế toàn bộ kết quả tool bằng `hardClear.placeholder`.

## Chọn tool

- `tools.allow` / `tools.deny` hỗ trợ `*` wildcards.
- Deny thắng.
- So khớp không phân biệt chữ hoa/thường.
- Danh sách allow trống => tất cả tool được phép.

## Tương tác với giới hạn khác

- Tool tích hợp sẵn đã tự cắt ngắn output; session pruning là lớp bổ sung ngăn chat dài tích lũy quá nhiều output tool trong context model.
- Compaction là riêng biệt: compaction tóm tắt và lưu trữ, pruning là tạm thời cho mỗi request. Xem [/concepts/compaction](/concepts/compaction).

## Mặc định (khi bật)

- `ttl`: `"5m"`
- `keepLastAssistants`: `3`
- `softTrimRatio`: `0.3`
- `hardClearRatio`: `0.5`
- `minPrunableToolChars`: `50000`
- `softTrim`: `{ maxChars: 4000, headChars: 1500, tailChars: 1500 }`
- `hardClear`: `{ enabled: true, placeholder: "[Old tool result content cleared]" }`

## Ví dụ

Mặc định (tắt):

```json5
{
  agents: { defaults: { contextPruning: { mode: "off" } } },
}
```

Bật pruning theo TTL:

```json5
{
  agents: { defaults: { contextPruning: { mode: "cache-ttl", ttl: "5m" } } },
}
```

Giới hạn pruning cho tool cụ thể:

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

Xem tham khảo cấu hình: [Gateway Configuration](/gateway/configuration)\n
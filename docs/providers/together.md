---
title: "Hướng Dẫn Cài Đặt Together AI"
summary: "Tìm hiểu cách cài đặt và cấu hình Together AI, bao gồm xác thực và lựa chọn mô hình phù hợp cho nhu cầu của bạn."
read_when:
  - Bạn muốn sử dụng Together AI với OpenClaw
  - Bạn cần biến môi trường API key hoặc lựa chọn xác thực CLI
---

# Together AI

[Together AI](https://together.ai) cung cấp quyền truy cập vào các mô hình mã nguồn mở hàng đầu như Llama, DeepSeek, Kimi và nhiều mô hình khác thông qua một API thống nhất.

- Nhà cung cấp: `together`
- Xác thực: `TOGETHER_API_KEY`
- API: Tương thích với OpenAI

## Bắt đầu nhanh

1. Thiết lập API key (khuyến nghị: lưu trữ cho Gateway):

```bash
openclaw onboard --auth-choice together-api-key
```

2. Thiết lập mô hình mặc định:

```json5
{
  agents: {
    defaults: {
      model: { primary: "together/moonshotai/Kimi-K2.5" },
    },
  },
}
```

## Ví dụ không tương tác

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

Lệnh này sẽ thiết lập `together/moonshotai/Kimi-K2.5` làm mô hình mặc định.

## Lưu ý về môi trường

Nếu Gateway chạy dưới dạng daemon (launchd/systemd), hãy đảm bảo `TOGETHER_API_KEY` có sẵn cho tiến trình đó (ví dụ, trong `~/.openclaw/.env` hoặc thông qua `env.shellEnv`).

## Các mô hình có sẵn

Together AI cung cấp quyền truy cập vào nhiều mô hình mã nguồn mở phổ biến:

- **GLM 4.7 Fp8** - Mô hình mặc định với cửa sổ ngữ cảnh 200K
- **Llama 3.3 70B Instruct Turbo** - Theo dõi hướng dẫn nhanh, hiệu quả
- **Llama 4 Scout** - Mô hình thị giác với khả năng hiểu hình ảnh
- **Llama 4 Maverick** - Thị giác và lý luận nâng cao
- **DeepSeek V3.1** - Mô hình mã hóa và lý luận mạnh mẽ
- **DeepSeek R1** - Mô hình lý luận nâng cao
- **Kimi K2 Instruct** - Mô hình hiệu suất cao với cửa sổ ngữ cảnh 262K

Tất cả các mô hình đều hỗ trợ hoàn thành chat tiêu chuẩn và tương thích với API OpenAI.

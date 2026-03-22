---
title: "Together AI"
summary: "Cài đặt Together AI (xác thực + chọn model)"
read_when:
  - Muốn dùng Together AI với OpenClaw
  - Cần biến môi trường API key hoặc chọn xác thực qua CLI
---

# Together AI

[Together AI](https://together.ai) cung cấp quyền truy cập vào các model mã nguồn mở hàng đầu như Llama, DeepSeek, Kimi,... thông qua một API thống nhất.

- Provider: `together`
- Auth: `TOGETHER_API_KEY`
- API: Tương thích OpenAI

## Bắt đầu nhanh

1. Thiết lập API key (khuyến nghị: lưu cho Gateway):

```bash
openclaw onboard --auth-choice together-api-key
```

2. Thiết lập model mặc định:

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

Lệnh này sẽ đặt `together/moonshotai/Kimi-K2.5` làm model mặc định.

## Lưu ý môi trường

Nếu Gateway chạy dưới dạng daemon (launchd/systemd), đảm bảo `TOGETHER_API_KEY` có sẵn cho tiến trình đó (ví dụ, trong `~/.openclaw/.env` hoặc qua `env.shellEnv`).

## Các model có sẵn

Together AI cung cấp quyền truy cập vào nhiều model mã nguồn mở phổ biến:

- **GLM 4.7 Fp8** - Model mặc định với cửa sổ ngữ cảnh 200K
- **Llama 3.3 70B Instruct Turbo** - Theo dõi hướng dẫn nhanh, hiệu quả
- **Llama 4 Scout** - Model thị giác với khả năng hiểu hình ảnh
- **Llama 4 Maverick** - Thị giác và lý luận nâng cao
- **DeepSeek V3.1** - Model mã hóa và lý luận mạnh mẽ
- **DeepSeek R1** - Model lý luận nâng cao
- **Kimi K2 Instruct** - Model hiệu suất cao với cửa sổ ngữ cảnh 262K

Tất cả các model hỗ trợ hoàn thành chat tiêu chuẩn và tương thích với API OpenAI.\n
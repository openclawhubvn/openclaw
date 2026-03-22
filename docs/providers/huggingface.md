---
summary: "Thiết lập và cấu hình Hugging Face Inference, bao gồm xác thực và lựa chọn mô hình, để tối ưu hóa quá trình suy luận AI."
read_when:
  - Bạn muốn sử dụng Hugging Face Inference với OpenClaw
  - Bạn cần biến môi trường token HF hoặc lựa chọn xác thực qua CLI
title: "Hướng Dẫn Cấu Hình Hugging Face Inference"
---

# Hugging Face (Inference)

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) cung cấp các hoàn thành hội thoại tương thích với OpenAI thông qua một API router duy nhất. Bạn có thể truy cập nhiều mô hình (DeepSeek, Llama, và nhiều hơn nữa) chỉ với một token. OpenClaw sử dụng **endpoint tương thích OpenAI** (chỉ hoàn thành hội thoại); để chuyển đổi văn bản thành hình ảnh, nhúng, hoặc giọng nói, hãy sử dụng trực tiếp [HF inference clients](https://huggingface.co/docs/api-inference/quicktour).

- Nhà cung cấp: `huggingface`
- Xác thực: `HUGGINGFACE_HUB_TOKEN` hoặc `HF_TOKEN` (token chi tiết với quyền **Gọi đến Inference Providers**)
- API: Tương thích OpenAI (`https://router.huggingface.co/v1`)
- Thanh toán: Một token HF duy nhất; [giá cả](https://huggingface.co/docs/inference-providers/pricing) theo mức giá của nhà cung cấp với một tầng miễn phí.

## Bắt đầu nhanh

1. Tạo một token chi tiết tại [Hugging Face → Settings → Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) với quyền **Gọi đến Inference Providers**.
2. Chạy onboarding và chọn **Hugging Face** trong danh sách nhà cung cấp, sau đó nhập API key khi được yêu cầu:

```bash
openclaw onboard --auth-choice huggingface-api-key
```

3. Trong danh sách **Default Hugging Face model**, chọn mô hình bạn muốn (danh sách được tải từ Inference API khi bạn có token hợp lệ; nếu không, một danh sách tích hợp sẵn sẽ được hiển thị). Lựa chọn của bạn sẽ được lưu làm mô hình mặc định.
4. Bạn cũng có thể đặt hoặc thay đổi mô hình mặc định sau này trong cấu hình:

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
    },
  },
}
```

## Ví dụ không tương tác

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

Điều này sẽ đặt `huggingface/deepseek-ai/DeepSeek-R1` làm mô hình mặc định.

## Lưu ý về môi trường

Nếu Gateway chạy dưới dạng daemon (launchd/systemd), đảm bảo `HUGGINGFACE_HUB_TOKEN` hoặc `HF_TOKEN` có sẵn cho tiến trình đó (ví dụ, trong `~/.openclaw/.env` hoặc thông qua `env.shellEnv`).

## Khám phá mô hình và danh sách onboarding

OpenClaw khám phá các mô hình bằng cách gọi trực tiếp **Inference endpoint**:

```bash
GET https://router.huggingface.co/v1/models
```

(Tùy chọn: gửi `Authorization: Bearer $HUGGINGFACE_HUB_TOKEN` hoặc `$HF_TOKEN` để có danh sách đầy đủ; một số endpoint trả về một phần mà không cần xác thực.) Phản hồi theo kiểu OpenAI `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

Khi bạn cấu hình một Hugging Face API key (qua onboarding, `HUGGINGFACE_HUB_TOKEN`, hoặc `HF_TOKEN`), OpenClaw sử dụng GET này để khám phá các mô hình hoàn thành hội thoại có sẵn. Trong quá trình **thiết lập tương tác**, sau khi bạn nhập token, bạn sẽ thấy một danh sách **Default Hugging Face model** được điền từ danh sách đó (hoặc từ danh mục tích hợp sẵn nếu yêu cầu thất bại). Khi chạy (ví dụ, khi Gateway khởi động), nếu có key, OpenClaw lại gọi **GET** `https://router.huggingface.co/v1/models` để làm mới danh mục. Danh sách này được hợp nhất với danh mục tích hợp sẵn (cho các thông tin như cửa sổ ngữ cảnh và chi phí). Nếu yêu cầu thất bại hoặc không có key, chỉ danh mục tích hợp sẵn được sử dụng.

## Tên mô hình và tùy chọn có thể chỉnh sửa

- **Tên từ API:** Tên hiển thị của mô hình được **lấy từ GET /v1/models** khi API trả về `name`, `title`, hoặc `display_name`; nếu không, nó được suy ra từ id mô hình (ví dụ: `deepseek-ai/DeepSeek-R1` → “DeepSeek R1”).
- **Ghi đè tên hiển thị:** Bạn có thể đặt nhãn tùy chỉnh cho mỗi mô hình trong cấu hình để nó hiển thị theo cách bạn muốn trong CLI và UI:

```json5
{
  agents: {
    defaults: {
      models: {
        "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (nhanh)" },
        "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (rẻ)" },
      },
    },
  },
}
```

- **Lựa chọn nhà cung cấp / chính sách:** Thêm hậu tố vào **id mô hình** để chọn cách router chọn backend:
  - **`:fastest`** — thông lượng cao nhất (router chọn; lựa chọn nhà cung cấp **bị khóa** — không có bộ chọn backend tương tác).
  - **`:cheapest`** — chi phí thấp nhất cho mỗi token đầu ra (router chọn; lựa chọn nhà cung cấp **bị khóa**).
  - **`:provider`** — buộc một backend cụ thể (ví dụ: `:sambanova`, `:together`).

  Khi bạn chọn **:cheapest** hoặc **:fastest** (ví dụ, trong danh sách mô hình onboarding), nhà cung cấp bị khóa: router quyết định theo chi phí hoặc tốc độ và không có bước “ưu tiên backend cụ thể” tùy chọn nào được hiển thị. Bạn có thể thêm các mục này làm các mục riêng biệt trong `models.providers.huggingface.models` hoặc đặt `model.primary` với hậu tố. Bạn cũng có thể đặt thứ tự mặc định của mình trong [Inference Provider settings](https://hf.co/settings/inference-providers) (không có hậu tố = sử dụng thứ tự đó).

- **Hợp nhất cấu hình:** Các mục hiện có trong `models.providers.huggingface.models` (ví dụ, trong `models.json`) được giữ lại khi cấu hình được hợp nhất. Vì vậy, bất kỳ `name`, `alias`, hoặc tùy chọn mô hình tùy chỉnh nào bạn đặt ở đó đều được bảo toàn.

## ID mô hình và ví dụ cấu hình

Tham chiếu mô hình sử dụng dạng `huggingface/<org>/<model>` (ID kiểu Hub). Danh sách dưới đây là từ **GET** `https://router.huggingface.co/v1/models`; danh mục của bạn có thể bao gồm nhiều hơn.

**Ví dụ về ID (từ endpoint inference):**

| Mô hình                | Tham chiếu (tiền tố với `huggingface/`) |
| ---------------------- | --------------------------------------- |
| DeepSeek R1            | `deepseek-ai/DeepSeek-R1`               |
| DeepSeek V3.2          | `deepseek-ai/DeepSeek-V3.2`             |
| Qwen3 8B               | `Qwen/Qwen3-8B`                         |
| Qwen2.5 7B Instruct    | `Qwen/Qwen2.5-7B-Instruct`              |
| Qwen3 32B              | `Qwen/Qwen3-32B`                        |
| Llama 3.3 70B Instruct | `meta-llama/Llama-3.3-70B-Instruct`     |
| Llama 3.1 8B Instruct  | `meta-llama/Llama-3.1-8B-Instruct`      |
| GPT-OSS 120B           | `openai/gpt-oss-120b`                   |
| GLM 4.7                | `zai-org/GLM-4.7`                       |
| Kimi K2.5              | `moonshotai/Kimi-K2.5`                  |

Bạn có thể thêm `:fastest`, `:cheapest`, hoặc `:provider` (ví dụ: `:together`, `:sambanova`) vào id mô hình. Đặt thứ tự mặc định của bạn trong [Inference Provider settings](https://hf.co/settings/inference-providers); xem [Inference Providers](https://huggingface.co/docs/inference-providers) và **GET** `https://router.huggingface.co/v1/models` để có danh sách đầy đủ.

### Ví dụ cấu hình hoàn chỉnh

**DeepSeek R1 chính với Qwen dự phòng:**

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "huggingface/deepseek-ai/DeepSeek-R1",
        fallbacks: ["huggingface/Qwen/Qwen3-8B"],
      },
      models: {
        "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
        "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
      },
    },
  },
}
```

**Qwen làm mặc định, với các biến thể :cheapest và :fastest:**

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/Qwen/Qwen3-8B" },
      models: {
        "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
        "huggingface/Qwen/Qwen3-8B:cheapest": { alias: "Qwen3 8B (rẻ nhất)" },
        "huggingface/Qwen/Qwen3-8B:fastest": { alias: "Qwen3 8B (nhanh nhất)" },
      },
    },
  },
}
```

**DeepSeek + Llama + GPT-OSS với các alias:**

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "huggingface/deepseek-ai/DeepSeek-V3.2",
        fallbacks: [
          "huggingface/meta-llama/Llama-3.3-70B-Instruct",
          "huggingface/openai/gpt-oss-120b",
        ],
      },
      models: {
        "huggingface/deepseek-ai/DeepSeek-V3.2": { alias: "DeepSeek V3.2" },
        "huggingface/meta-llama/Llama-3.3-70B-Instruct": { alias: "Llama 3.3 70B" },
        "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
      },
    },
  },
}
```

**Buộc một backend cụ thể với :provider:**

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/deepseek-ai/DeepSeek-R1:together" },
      models: {
        "huggingface/deepseek-ai/DeepSeek-R1:together": { alias: "DeepSeek R1 (Together)" },
      },
    },
  },
}
```

**Nhiều mô hình Qwen và DeepSeek với hậu tố chính sách:**

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest" },
      models: {
        "huggingface/Qwen/Qwen2.5-7B-Instruct": { alias: "Qwen2.5 7B" },
        "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest": { alias: "Qwen2.5 7B (rẻ)" },
        "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (nhanh)" },
        "huggingface/meta-llama/Llama-3.1-8B-Instruct": { alias: "Llama 3.1 8B" },
      },
    },
  },
}
```

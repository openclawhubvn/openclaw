---
summary: "Thiết lập Hugging Face Inference (auth + chọn model)"
read_when:
  - Muốn dùng Hugging Face Inference với OpenClaw
  - Cần biến môi trường token HF hoặc chọn auth qua CLI
title: "Hugging Face (Inference)"
---

# Hugging Face (Inference)

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) cung cấp chat completions tương thích OpenAI qua một router API duy nhất. Có thể truy cập nhiều model (DeepSeek, Llama, v.v.) chỉ với một token. OpenClaw dùng **endpoint tương thích OpenAI** (chỉ chat completions); với text-to-image, embeddings, hoặc speech, dùng trực tiếp [HF inference clients](https://huggingface.co/docs/api-inference/quicktour).

- Provider: `huggingface`
- Auth: `HUGGINGFACE_HUB_TOKEN` hoặc `HF_TOKEN` (token chi tiết với quyền **Make calls to Inference Providers**)
- API: Tương thích OpenAI (`https://router.huggingface.co/v1`)
- Billing: Một token HF; [giá](https://huggingface.co/docs/inference-providers/pricing) theo mức của provider với gói miễn phí.

## Bắt đầu nhanh

1. Tạo token chi tiết tại [Hugging Face → Settings → Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) với quyền **Make calls to Inference Providers**.
2. Chạy onboarding và chọn **Hugging Face** trong dropdown provider, sau đó nhập API key khi được yêu cầu:

```bash
openclaw onboard --auth-choice huggingface-api-key
```

3. Trong dropdown **Default Hugging Face model**, chọn model muốn dùng (danh sách tải từ Inference API khi có token hợp lệ; nếu không sẽ hiện danh sách mặc định). Lựa chọn này được lưu làm model mặc định.
4. Có thể đặt hoặc thay đổi model mặc định sau trong config:

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

Sẽ đặt `huggingface/deepseek-ai/DeepSeek-R1` làm model mặc định.

## Lưu ý môi trường

Nếu Gateway chạy dưới dạng daemon (launchd/systemd), đảm bảo `HUGGINGFACE_HUB_TOKEN` hoặc `HF_TOKEN` có sẵn cho process đó (ví dụ, trong `~/.openclaw/.env` hoặc qua `env.shellEnv`).

## Khám phá model và dropdown onboarding

OpenClaw khám phá model bằng cách gọi trực tiếp **Inference endpoint**:

```bash
GET https://router.huggingface.co/v1/models
```

(Tùy chọn: gửi `Authorization: Bearer $HUGGINGFACE_HUB_TOKEN` hoặc `$HF_TOKEN` để có danh sách đầy đủ; một số endpoint trả về một phần danh sách nếu không có auth.) Phản hồi theo kiểu OpenAI `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

Khi cấu hình API key Hugging Face (qua onboarding, `HUGGINGFACE_HUB_TOKEN`, hoặc `HF_TOKEN`), OpenClaw dùng GET này để khám phá các model chat-completion có sẵn. Trong **thiết lập tương tác**, sau khi nhập token, sẽ thấy dropdown **Default Hugging Face model** được điền từ danh sách đó (hoặc từ catalog mặc định nếu yêu cầu thất bại). Khi chạy (ví dụ, khởi động Gateway), nếu có key, OpenClaw lại gọi **GET** `https://router.huggingface.co/v1/models` để làm mới catalog. Danh sách được gộp với catalog mặc định (cho metadata như context window và chi phí). Nếu yêu cầu thất bại hoặc không có key, chỉ dùng catalog mặc định.

## Tên model và tùy chọn chỉnh sửa

- **Tên từ API:** Tên hiển thị model **được lấy từ GET /v1/models** khi API trả về `name`, `title`, hoặc `display_name`; nếu không, lấy từ model id (ví dụ `deepseek-ai/DeepSeek-R1` → “DeepSeek R1”).
- **Ghi đè tên hiển thị:** Có thể đặt nhãn tùy chỉnh cho mỗi model trong config để hiển thị theo ý muốn trong CLI và UI:

```json5
{
  agents: {
    defaults: {
      models: {
        "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (fast)" },
        "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheap)" },
      },
    },
  },
}
```

- **Chọn provider / policy:** Thêm hậu tố vào **model id** để chọn cách router chọn backend:
  - **`:fastest`** — throughput cao nhất (router chọn; khóa lựa chọn provider — không có picker backend tương tác).
  - **`:cheapest`** — chi phí thấp nhất cho mỗi token đầu ra (router chọn; khóa lựa chọn provider).
  - **`:provider`** — ép buộc backend cụ thể (ví dụ `:sambanova`, `:together`).

  Khi chọn **:cheapest** hoặc **:fastest** (ví dụ trong dropdown model onboarding), provider bị khóa: router quyết định theo chi phí hoặc tốc độ và không có bước “ưu tiên backend cụ thể” tùy chọn. Có thể thêm các mục này làm mục riêng trong `models.providers.huggingface.models` hoặc đặt `model.primary` với hậu tố. Cũng có thể đặt thứ tự mặc định trong [Inference Provider settings](https://hf.co/settings/inference-providers) (không có hậu tố = dùng thứ tự đó).

- **Gộp config:** Các mục hiện có trong `models.providers.huggingface.models` (ví dụ trong `models.json`) được giữ lại khi gộp config. Vì vậy, bất kỳ `name`, `alias`, hoặc tùy chọn model tùy chỉnh nào đã đặt ở đó đều được bảo toàn.

## Model IDs và ví dụ cấu hình

Tham chiếu model dùng dạng `huggingface/<org>/<model>` (ID kiểu Hub). Danh sách dưới đây từ **GET** `https://router.huggingface.co/v1/models`; catalog của bạn có thể bao gồm nhiều hơn.

**Ví dụ ID (từ inference endpoint):**

| Model                  | Ref (thêm tiền tố `huggingface/`)   |
| ---------------------- | ----------------------------------- |
| DeepSeek R1            | `deepseek-ai/DeepSeek-R1`           |
| DeepSeek V3.2          | `deepseek-ai/DeepSeek-V3.2`         |
| Qwen3 8B               | `Qwen/Qwen3-8B`                     |
| Qwen2.5 7B Instruct    | `Qwen/Qwen2.5-7B-Instruct`          |
| Qwen3 32B              | `Qwen/Qwen3-32B`                    |
| Llama 3.3 70B Instruct | `meta-llama/Llama-3.3-70B-Instruct` |
| Llama 3.1 8B Instruct  | `meta-llama/Llama-3.1-8B-Instruct`  |
| GPT-OSS 120B           | `openai/gpt-oss-120b`               |
| GLM 4.7                | `zai-org/GLM-4.7`                   |
| Kimi K2.5              | `moonshotai/Kimi-K2.5`              |

Có thể thêm `:fastest`, `:cheapest`, hoặc `:provider` (ví dụ `:together`, `:sambanova`) vào model id. Đặt thứ tự mặc định trong [Inference Provider settings](https://hf.co/settings/inference-providers); xem [Inference Providers](https://huggingface.co/docs/inference-providers) và **GET** `https://router.huggingface.co/v1/models` để có danh sách đầy đủ.

### Ví dụ cấu hình hoàn chỉnh

**Primary DeepSeek R1 với Qwen fallback:**

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
        "huggingface/Qwen/Qwen3-8B:cheapest": { alias: "Qwen3 8B (cheapest)" },
        "huggingface/Qwen/Qwen3-8B:fastest": { alias: "Qwen3 8B (fastest)" },
      },
    },
  },
}
```

**DeepSeek + Llama + GPT-OSS với alias:**

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

**Ép buộc backend cụ thể với :provider:**

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

**Nhiều model Qwen và DeepSeek với hậu tố policy:**

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest" },
      models: {
        "huggingface/Qwen/Qwen2.5-7B-Instruct": { alias: "Qwen2.5 7B" },
        "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest": { alias: "Qwen2.5 7B (cheap)" },
        "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (fast)" },
        "huggingface/meta-llama/Llama-3.1-8B-Instruct": { alias: "Llama 3.1 8B" },
      },
    },
  },
}
```\n
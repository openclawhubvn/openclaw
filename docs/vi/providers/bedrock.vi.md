---
summary: "Sử dụng mô hình Amazon Bedrock (Converse API) với OpenClaw"
read_when:
  - Muốn dùng mô hình Amazon Bedrock với OpenClaw
  - Cần thiết lập AWS credential/region để gọi mô hình
title: "Amazon Bedrock"
---

# Amazon Bedrock

OpenClaw có thể dùng mô hình **Amazon Bedrock** qua **Bedrock Converse** streaming provider của pi‑ai. Bedrock auth dùng **AWS SDK default credential chain**, không dùng API key.

## pi-ai hỗ trợ gì

- Provider: `amazon-bedrock`
- API: `bedrock-converse-stream`
- Auth: AWS credentials (biến môi trường, shared config, hoặc instance role)
- Region: `AWS_REGION` hoặc `AWS_DEFAULT_REGION` (mặc định: `us-east-1`)

## Tự động phát hiện mô hình

Nếu phát hiện AWS credentials, OpenClaw có thể tự động phát hiện mô hình Bedrock hỗ trợ **streaming** và **text output**. Phát hiện dùng `bedrock:ListFoundationModels` và được cache (mặc định: 1 giờ).

Cấu hình nằm trong `models.bedrockDiscovery`:

```json5
{
  models: {
    bedrockDiscovery: {
      enabled: true,
      region: "us-east-1",
      providerFilter: ["anthropic", "amazon"],
      refreshInterval: 3600,
      defaultContextWindow: 32000,
      defaultMaxTokens: 4096,
    },
  },
}
```

Ghi chú:

- `enabled` mặc định là `true` khi có AWS credentials.
- `region` mặc định là `AWS_REGION` hoặc `AWS_DEFAULT_REGION`, sau đó là `us-east-1`.
- `providerFilter` khớp với tên provider của Bedrock (ví dụ `anthropic`).
- `refreshInterval` là giây; đặt `0` để tắt cache.
- `defaultContextWindow` (mặc định: `32000`) và `defaultMaxTokens` (mặc định: `4096`) dùng cho mô hình phát hiện (ghi đè nếu biết giới hạn mô hình).

## Onboarding

1. Đảm bảo AWS credentials có sẵn trên **gateway host**:

```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"
# Tùy chọn:
export AWS_SESSION_TOKEN="..."
export AWS_PROFILE="your-profile"
# Tùy chọn (Bedrock API key/bearer token):
export AWS_BEARER_TOKEN_BEDROCK="..."
```

2. Thêm Bedrock provider và mô hình vào config (không cần `apiKey`):

```json5
{
  models: {
    providers: {
      "amazon-bedrock": {
        baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
        api: "bedrock-converse-stream",
        auth: "aws-sdk",
        models: [
          {
            id: "us.anthropic.claude-opus-4-6-v1:0",
            name: "Claude Opus 4.6 (Bedrock)",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "amazon-bedrock/us.anthropic.claude-opus-4-6-v1:0" },
    },
  },
}
```

## EC2 Instance Roles

Khi chạy OpenClaw trên EC2 instance với IAM role, AWS SDK tự động dùng instance metadata service (IMDS) để xác thực. Tuy nhiên, OpenClaw hiện chỉ kiểm tra biến môi trường, không kiểm tra IMDS credentials.

**Cách khắc phục:** Đặt `AWS_PROFILE=default` để báo hiệu có AWS credentials. Xác thực thực tế vẫn dùng instance role qua IMDS.

```bash
# Thêm vào ~/.bashrc hoặc shell profile
export AWS_PROFILE=default
export AWS_REGION=us-east-1
```

**Quyền IAM cần thiết** cho EC2 instance role:

- `bedrock:InvokeModel`
- `bedrock:InvokeModelWithResponseStream`
- `bedrock:ListFoundationModels` (để tự động phát hiện)

Hoặc gắn policy `AmazonBedrockFullAccess`.

## Thiết lập nhanh (AWS path)

```bash
# 1. Tạo IAM role và instance profile
aws iam create-role --role-name EC2-Bedrock-Access \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy --role-name EC2-Bedrock-Access \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam create-instance-profile --instance-profile-name EC2-Bedrock-Access
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-Bedrock-Access \
  --role-name EC2-Bedrock-Access

# 2. Gắn vào EC2 instance
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. Trên EC2 instance, bật discovery
openclaw config set models.bedrockDiscovery.enabled true
openclaw config set models.bedrockDiscovery.region us-east-1

# 4. Đặt biến môi trường khắc phục
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Kiểm tra mô hình đã được phát hiện
openclaw models list
```

## Ghi chú

- Bedrock yêu cầu **model access** được bật trong tài khoản/region AWS.
- Tự động phát hiện cần quyền `bedrock:ListFoundationModels`.
- Nếu dùng profiles, đặt `AWS_PROFILE` trên gateway host.
- OpenClaw ưu tiên nguồn credential theo thứ tự: `AWS_BEARER_TOKEN_BEDROCK`, sau đó `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, rồi `AWS_PROFILE`, cuối cùng là default AWS SDK chain.
- Hỗ trợ reasoning phụ thuộc vào mô hình; kiểm tra Bedrock model card để biết khả năng hiện tại.
- Nếu muốn quản lý key dễ hơn, có thể đặt proxy tương thích OpenAI trước Bedrock và cấu hình như OpenAI provider.\n
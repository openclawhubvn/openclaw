---
summary: "Khám phá cách tích hợp Amazon Bedrock với OpenClaw để tối ưu hóa khả năng xử lý ngôn ngữ tự nhiên của bạn."
read_when:
  - Bạn muốn sử dụng mô hình Amazon Bedrock với OpenClaw
  - Bạn cần thiết lập thông tin xác thực/region AWS để gọi mô hình
title: "Hướng Dẫn Sử Dụng Amazon Bedrock API"
---

# Amazon Bedrock

OpenClaw có thể sử dụng các mô hình **Amazon Bedrock** thông qua nhà cung cấp streaming **Bedrock Converse** của pi‑ai. Xác thực Bedrock sử dụng **chuỗi thông tin xác thực mặc định của AWS SDK**, không phải khóa API.

## Những gì pi-ai hỗ trợ

- Nhà cung cấp: `amazon-bedrock`
- API: `bedrock-converse-stream`
- Xác thực: Thông tin xác thực AWS (biến môi trường, cấu hình chia sẻ, hoặc vai trò instance)
- Region: `AWS_REGION` hoặc `AWS_DEFAULT_REGION` (mặc định: `us-east-1`)

## Khám phá mô hình tự động

Nếu phát hiện thông tin xác thực AWS, OpenClaw có thể tự động khám phá các mô hình Bedrock hỗ trợ **streaming** và **đầu ra văn bản**. Quá trình khám phá sử dụng `bedrock:ListFoundationModels` và được lưu trữ tạm thời (mặc định: 1 giờ).

Các tùy chọn cấu hình nằm dưới `models.bedrockDiscovery`:

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

- `enabled` mặc định là `true` khi có thông tin xác thực AWS.
- `region` mặc định là `AWS_REGION` hoặc `AWS_DEFAULT_REGION`, sau đó là `us-east-1`.
- `providerFilter` khớp với tên nhà cung cấp Bedrock (ví dụ `anthropic`).
- `refreshInterval` là giây; đặt `0` để tắt lưu trữ tạm thời.
- `defaultContextWindow` (mặc định: `32000`) và `defaultMaxTokens` (mặc định: `4096`) được sử dụng cho các mô hình được khám phá (ghi đè nếu bạn biết giới hạn mô hình của mình).

## Hướng dẫn bắt đầu

1. Đảm bảo thông tin xác thực AWS có sẵn trên **máy chủ gateway**:

```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"
# Tùy chọn:
export AWS_SESSION_TOKEN="..."
export AWS_PROFILE="your-profile"
# Tùy chọn (khóa API/bearer token của Bedrock):
export AWS_BEARER_TOKEN_BEDROCK="..."
```

2. Thêm nhà cung cấp và mô hình Bedrock vào cấu hình của bạn (không cần `apiKey`):

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

## Vai trò Instance EC2

Khi chạy OpenClaw trên một instance EC2 với vai trò IAM đính kèm, AWS SDK sẽ tự động sử dụng dịch vụ metadata của instance (IMDS) để xác thực. Tuy nhiên, việc phát hiện thông tin xác thực của OpenClaw hiện chỉ kiểm tra các biến môi trường, không phải thông tin xác thực IMDS.

**Giải pháp:** Đặt `AWS_PROFILE=default` để báo hiệu rằng thông tin xác thực AWS có sẵn. Việc xác thực thực tế vẫn sử dụng vai trò instance thông qua IMDS.

```bash
# Thêm vào ~/.bashrc hoặc profile shell của bạn
export AWS_PROFILE=default
export AWS_REGION=us-east-1
```

**Quyền IAM cần thiết** cho vai trò instance EC2:

- `bedrock:InvokeModel`
- `bedrock:InvokeModelWithResponseStream`
- `bedrock:ListFoundationModels` (để khám phá tự động)

Hoặc đính kèm chính sách quản lý `AmazonBedrockFullAccess`.

## Thiết lập nhanh (đường dẫn AWS)

```bash
# 1. Tạo vai trò IAM và profile instance
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

# 2. Đính kèm vào instance EC2 của bạn
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. Trên instance EC2, kích hoạt khám phá
openclaw config set models.bedrockDiscovery.enabled true
openclaw config set models.bedrockDiscovery.region us-east-1

# 4. Đặt các biến môi trường giải pháp
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Kiểm tra mô hình đã được khám phá
openclaw models list
```

## Ghi chú

- Bedrock yêu cầu **quyền truy cập mô hình** được kích hoạt trong tài khoản/region AWS của bạn.
- Khám phá tự động cần quyền `bedrock:ListFoundationModels`.
- Nếu bạn sử dụng profile, hãy đặt `AWS_PROFILE` trên máy chủ gateway.
- OpenClaw hiển thị nguồn thông tin xác thực theo thứ tự: `AWS_BEARER_TOKEN_BEDROCK`, sau đó `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, sau đó `AWS_PROFILE`, cuối cùng là chuỗi mặc định của AWS SDK.
- Hỗ trợ reasoning phụ thuộc vào mô hình; kiểm tra thẻ mô hình Bedrock để biết khả năng hiện tại.
- Nếu bạn thích luồng khóa được quản lý, bạn cũng có thể đặt một proxy tương thích với OpenAI trước Bedrock và cấu hình nó như một nhà cung cấp OpenAI.

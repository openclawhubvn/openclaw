---
summary: "Triển khai OpenClaw Gateway lên Kubernetes cluster với Kustomize"
read_when:
  - Muốn chạy OpenClaw trên Kubernetes cluster
  - Muốn test OpenClaw trong môi trường Kubernetes
title: "Kubernetes"
---

# OpenClaw trên Kubernetes

Điểm khởi đầu tối giản để chạy OpenClaw trên Kubernetes — chưa sẵn sàng cho production. Bao gồm các tài nguyên cốt lõi và cần tùy chỉnh theo môi trường của bạn.

## Tại sao không dùng Helm?

OpenClaw chỉ là một container với vài file cấu hình. Tùy chỉnh thú vị nằm ở nội dung agent (file markdown, skills, config overrides), không phải ở hạ tầng. Kustomize xử lý overlays mà không cần đến Helm chart. Nếu deployment phức tạp hơn, có thể thêm Helm chart lên trên các manifest này.

## Cần chuẩn bị

- Kubernetes cluster đang chạy (AKS, EKS, GKE, k3s, kind, OpenShift, v.v.)
- `kubectl` kết nối với cluster
- API key cho ít nhất một model provider

## Bắt đầu nhanh

```bash
# Thay bằng provider của bạn: ANTHROPIC, GEMINI, OPENAI, hoặc OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Lấy gateway token và dán vào Control UI:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Để debug local, `./scripts/k8s/deploy.sh --show-token` sẽ in token sau khi deploy.

## Test local với Kind

Nếu chưa có cluster, tạo một cái local với [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # tự động phát hiện docker hoặc podman
./scripts/k8s/create-kind.sh --delete  # xóa cluster
```

Sau đó deploy như thường với `./scripts/k8s/deploy.sh`.

## Từng bước

### 1) Deploy

**Option A** — API key trong environment (một bước):

```bash
# Thay bằng provider của bạn: ANTHROPIC, GEMINI, OPENAI, hoặc OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Script tạo Kubernetes Secret với API key và gateway token tự động, sau đó deploy. Nếu Secret đã tồn tại, giữ nguyên gateway token hiện tại và các provider key không thay đổi.

**Option B** — tạo secret riêng:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Dùng `--show-token` với lệnh nào cũng được nếu muốn in token ra stdout để test local.

### 2) Truy cập gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Những gì được deploy

```
Namespace: openclaw (có thể cấu hình qua OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Single pod, init container + gateway
├── Service/openclaw           # ClusterIP trên port 18789
├── PersistentVolumeClaim      # 10Gi cho trạng thái và config của agent
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## Tùy chỉnh

### Hướng dẫn agent

Sửa `AGENTS.md` trong `scripts/k8s/manifests/configmap.yaml` và redeploy:

```bash
./scripts/k8s/deploy.sh
```

### Cấu hình Gateway

Sửa `openclaw.json` trong `scripts/k8s/manifests/configmap.yaml`. Xem [Gateway configuration](/gateway/configuration) để tham khảo đầy đủ.

### Thêm providers

Chạy lại với các key bổ sung:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Các provider key hiện có vẫn giữ trong Secret trừ khi bạn ghi đè.

Hoặc patch Secret trực tiếp:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### Namespace tùy chỉnh

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### Image tùy chỉnh

Sửa trường `image` trong `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:latest # hoặc ghim vào một phiên bản cụ thể từ https://github.com/openclaw/openclaw/releases
```

### Expose ngoài port-forward

Các manifest mặc định bind gateway vào loopback trong pod. Điều này hoạt động với `kubectl port-forward`, nhưng không hoạt động với `Service` hoặc Ingress cần truy cập IP pod.

Nếu muốn expose gateway qua Ingress hoặc load balancer:

- Thay đổi gateway bind trong `scripts/k8s/manifests/configmap.yaml` từ `loopback` sang bind không phải loopback phù hợp với mô hình triển khai
- Giữ gateway auth bật và dùng entrypoint TLS-terminated phù hợp
- Cấu hình Control UI cho remote access theo mô hình bảo mật web hỗ trợ (ví dụ HTTPS/Tailscale Serve và các origin được phép khi cần)

## Re-deploy

```bash
./scripts/k8s/deploy.sh
```

Áp dụng tất cả manifest và khởi động lại pod để cập nhật config hoặc secret.

## Teardown

```bash
./scripts/k8s/deploy.sh --delete
```

Xóa namespace và tất cả tài nguyên trong đó, bao gồm PVC.

## Ghi chú kiến trúc

- Gateway mặc định bind vào loopback trong pod, setup đi kèm là cho `kubectl port-forward`
- Không có tài nguyên scope cluster — tất cả nằm trong một namespace
- Security: `readOnlyRootFilesystem`, `drop: ALL` capabilities, non-root user (UID 1000)
- Config mặc định giữ Control UI trên đường local-access an toàn hơn: loopback bind cộng với `kubectl port-forward` tới `http://127.0.0.1:18789`
- Nếu vượt ra ngoài localhost access, dùng mô hình remote hỗ trợ: HTTPS/Tailscale cộng với gateway bind và Control UI origin settings phù hợp
- Secrets được tạo trong thư mục tạm và áp dụng trực tiếp vào cluster — không có secret nào được ghi vào repo checkout

## Cấu trúc file

```
scripts/k8s/
├── deploy.sh                   # Tạo namespace + secret, deploy qua kustomize
├── create-kind.sh              # Local Kind cluster (tự động phát hiện docker/podman)
└── manifests/
    ├── kustomization.yaml      # Kustomize base
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # Pod spec với security hardening
    ├── pvc.yaml                # 10Gi persistent storage
    └── service.yaml            # ClusterIP trên 18789
```\n
---
summary: "Tìm hiểu cách triển khai OpenClaw Gateway trên Kubernetes bằng Kustomize, đảm bảo hệ thống hoạt động hiệu quả."
read_when:
  - Bạn muốn chạy OpenClaw trên cụm Kubernetes
  - Bạn muốn thử nghiệm OpenClaw trong môi trường Kubernetes
title: "Hướng Dẫn Cài Đặt OpenClaw Trên Kubernetes"
---

# OpenClaw trên Kubernetes

Điểm khởi đầu tối giản để chạy OpenClaw trên Kubernetes — không phải triển khai sẵn sàng cho sản xuất. Bao gồm các tài nguyên cốt lõi và có thể điều chỉnh theo môi trường của bạn.

## Tại sao không dùng Helm?

OpenClaw là một container đơn với một số file cấu hình. Tùy chỉnh thú vị nằm ở nội dung agent (file markdown, kỹ năng, ghi đè cấu hình), không phải ở việc tạo mẫu hạ tầng. Kustomize xử lý các lớp phủ mà không cần đến sự phức tạp của Helm chart. Nếu triển khai của bạn trở nên phức tạp hơn, có thể thêm Helm chart lên trên các manifest này.

## Bạn cần gì

- Một cụm Kubernetes đang chạy (AKS, EKS, GKE, k3s, kind, OpenShift, v.v.)
- `kubectl` kết nối với cụm của bạn
- Một API key cho ít nhất một nhà cung cấp mô hình

## Bắt đầu nhanh

```bash
# Thay thế bằng nhà cung cấp của bạn: ANTHROPIC, GEMINI, OPENAI, hoặc OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Lấy token gateway và dán vào Control UI:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Để gỡ lỗi cục bộ, `./scripts/k8s/deploy.sh --show-token` sẽ in token sau khi triển khai.

## Thử nghiệm cục bộ với Kind

Nếu bạn không có cụm, tạo một cụm cục bộ với [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # tự động phát hiện docker hoặc podman
./scripts/k8s/create-kind.sh --delete  # xóa cụm
```

Sau đó triển khai như thường lệ với `./scripts/k8s/deploy.sh`.

## Từng bước

### 1) Triển khai

**Lựa chọn A** — API key trong môi trường (một bước):

```bash
# Thay thế bằng nhà cung cấp của bạn: ANTHROPIC, GEMINI, OPENAI, hoặc OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

Script tạo một Kubernetes Secret với API key và một token gateway tự động tạo, sau đó triển khai. Nếu Secret đã tồn tại, nó sẽ giữ lại token gateway hiện tại và bất kỳ key nhà cung cấp nào không bị thay đổi.

**Lựa chọn B** — tạo secret riêng:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Sử dụng `--show-token` với bất kỳ lệnh nào nếu bạn muốn in token ra stdout để thử nghiệm cục bộ.

### 2) Truy cập gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Những gì được triển khai

```
Namespace: openclaw (có thể cấu hình qua OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Pod đơn, container khởi tạo + gateway
├── Service/openclaw           # ClusterIP trên cổng 18789
├── PersistentVolumeClaim      # 10Gi cho trạng thái và cấu hình agent
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Token gateway + API keys
```

## Tùy chỉnh

### Hướng dẫn agent

Chỉnh sửa `AGENTS.md` trong `scripts/k8s/manifests/configmap.yaml` và triển khai lại:

```bash
./scripts/k8s/deploy.sh
```

### Cấu hình gateway

Chỉnh sửa `openclaw.json` trong `scripts/k8s/manifests/configmap.yaml`. Xem [Cấu hình Gateway](/gateway/configuration) để tham khảo đầy đủ.

### Thêm nhà cung cấp

Chạy lại với các key bổ sung đã xuất:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Các key nhà cung cấp hiện có sẽ được giữ lại trong Secret trừ khi bạn ghi đè chúng.

Hoặc vá Secret trực tiếp:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### Namespace tùy chỉnh

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### Hình ảnh tùy chỉnh

Chỉnh sửa trường `image` trong `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:latest # hoặc ghim vào một phiên bản cụ thể từ https://github.com/openclaw/openclaw/releases
```

### Mở rộng ngoài port-forward

Các manifest mặc định gắn gateway vào loopback bên trong pod. Điều này hoạt động với `kubectl port-forward`, nhưng không hoạt động với `Service` hoặc đường dẫn Ingress của Kubernetes cần truy cập IP của pod.

Nếu bạn muốn mở rộng gateway qua Ingress hoặc load balancer:

- Thay đổi bind của gateway trong `scripts/k8s/manifests/configmap.yaml` từ `loopback` sang một bind không phải loopback phù hợp với mô hình triển khai của bạn
- Giữ xác thực gateway được bật và sử dụng một điểm đầu vào được kết thúc TLS đúng cách
- Cấu hình Control UI để truy cập từ xa bằng mô hình bảo mật web được hỗ trợ (ví dụ HTTPS/Tailscale Serve và các nguồn gốc được phép rõ ràng khi cần)

## Triển khai lại

```bash
./scripts/k8s/deploy.sh
```

Điều này áp dụng tất cả các manifest và khởi động lại pod để cập nhật bất kỳ thay đổi cấu hình hoặc secret nào.

## Gỡ bỏ

```bash
./scripts/k8s/deploy.sh --delete
```

Điều này xóa namespace và tất cả tài nguyên trong đó, bao gồm cả PVC.

## Ghi chú kiến trúc

- Gateway mặc định gắn vào loopback bên trong pod, vì vậy thiết lập đi kèm là cho `kubectl port-forward`
- Không có tài nguyên phạm vi cụm — mọi thứ nằm trong một namespace duy nhất
- Bảo mật: `readOnlyRootFilesystem`, `drop: ALL` capabilities, người dùng không phải root (UID 1000)
- Cấu hình mặc định giữ Control UI trên đường dẫn truy cập cục bộ an toàn hơn: bind loopback cộng với `kubectl port-forward` đến `http://127.0.0.1:18789`
- Nếu bạn di chuyển ngoài truy cập localhost, hãy sử dụng mô hình từ xa được hỗ trợ: HTTPS/Tailscale cộng với bind gateway và cài đặt nguồn gốc Control UI phù hợp
- Secrets được tạo trong thư mục tạm thời và áp dụng trực tiếp vào cụm — không có tài liệu bí mật nào được ghi vào repo checkout

## Cấu trúc file

```
scripts/k8s/
├── deploy.sh                   # Tạo namespace + secret, triển khai qua kustomize
├── create-kind.sh              # Cụm Kind cục bộ (tự động phát hiện docker/podman)
└── manifests/
    ├── kustomization.yaml      # Kustomize base
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # Pod spec với bảo mật nâng cao
    ├── pvc.yaml                # Lưu trữ bền vững 10Gi
    └── service.yaml            # ClusterIP trên 18789
```

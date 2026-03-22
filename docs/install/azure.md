---
summary: "Triển khai OpenClaw Gateway 24/7 trên Azure Linux VM, đảm bảo hiệu suất và tính bền vững cho hệ thống của bạn."
read_when:
  - Bạn muốn OpenClaw chạy 24/7 trên Azure với bảo mật Network Security Group
  - Bạn muốn một OpenClaw Gateway chất lượng sản xuất, luôn hoạt động trên Azure Linux VM của mình
  - Bạn muốn quản trị an toàn với Azure Bastion SSH
title: "Hướng Dẫn Cài Đặt OpenClaw Trên Azure"
---

# OpenClaw trên Azure Linux VM

Hướng dẫn này thiết lập một Azure Linux VM với Azure CLI, áp dụng bảo mật Network Security Group (NSG), cấu hình Azure Bastion để truy cập SSH, và cài đặt OpenClaw.

## Bạn sẽ làm gì

- Tạo mạng Azure (VNet, subnets, NSG) và tài nguyên tính toán với Azure CLI
- Áp dụng quy tắc Network Security Group để chỉ cho phép SSH từ Azure Bastion
- Sử dụng Azure Bastion để truy cập SSH (không có IP công cộng trên VM)
- Cài đặt OpenClaw bằng script cài đặt
- Xác minh Gateway

## Bạn cần gì

- Một tài khoản Azure có quyền tạo tài nguyên tính toán và mạng
- Azure CLI đã được cài đặt (xem [hướng dẫn cài đặt Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) nếu cần)
- Một cặp khóa SSH (hướng dẫn sẽ bao gồm cách tạo nếu cần)
- ~20-30 phút

## Cấu hình triển khai

<Steps>
  <Step title="Đăng nhập vào Azure CLI">
    ```bash
    az login
    az extension add -n ssh
    ```

    Phần mở rộng `ssh` là cần thiết cho việc tạo đường hầm SSH gốc của Azure Bastion.

  </Step>

  <Step title="Đăng ký nhà cung cấp tài nguyên cần thiết (một lần)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    Xác minh đăng ký. Chờ cho đến khi cả hai hiển thị `Registered`.

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="Thiết lập biến triển khai">
    ```bash
    RG="rg-openclaw"
    LOCATION="westus2"
    VNET_NAME="vnet-openclaw"
    VNET_PREFIX="10.40.0.0/16"
    VM_SUBNET_NAME="snet-openclaw-vm"
    VM_SUBNET_PREFIX="10.40.2.0/24"
    BASTION_SUBNET_PREFIX="10.40.1.0/26"
    NSG_NAME="nsg-openclaw-vm"
    VM_NAME="vm-openclaw"
    ADMIN_USERNAME="openclaw"
    BASTION_NAME="bas-openclaw"
    BASTION_PIP_NAME="pip-openclaw-bastion"
    ```

    Điều chỉnh tên và phạm vi CIDR để phù hợp với môi trường của bạn. Subnet Bastion phải ít nhất là `/26`.

  </Step>

  <Step title="Chọn khóa SSH">
    Sử dụng khóa công khai hiện có nếu bạn đã có:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    Nếu chưa có khóa SSH, tạo một khóa:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="Chọn kích thước VM và kích thước đĩa OS">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    Chọn kích thước VM và kích thước đĩa OS có sẵn trong tài khoản và khu vực của bạn:

    - Bắt đầu nhỏ cho nhu cầu sử dụng nhẹ và mở rộng sau
    - Sử dụng nhiều vCPU/RAM/đĩa hơn cho tự động hóa nặng, nhiều kênh, hoặc khối lượng công việc mô hình/công cụ lớn hơn
    - Nếu kích thước VM không có sẵn trong khu vực hoặc hạn ngạch tài khoản của bạn, chọn SKU gần nhất có sẵn

    Liệt kê các kích thước VM có sẵn trong khu vực mục tiêu của bạn:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    Kiểm tra mức sử dụng/hạn ngạch vCPU và đĩa hiện tại của bạn:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## Triển khai tài nguyên Azure

<Steps>
  <Step title="Tạo nhóm tài nguyên">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="Tạo nhóm bảo mật mạng">
    Tạo NSG và thêm quy tắc để chỉ subnet Bastion có thể SSH vào VM.

    ```bash
    az network nsg create \
      -g "${RG}" -n "${NSG_NAME}" -l "${LOCATION}"

    # Cho phép SSH từ chỉ subnet Bastion
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n AllowSshFromBastionSubnet --priority 100 \
      --access Allow --direction Inbound --protocol Tcp \
      --source-address-prefixes "${BASTION_SUBNET_PREFIX}" \
      --destination-port-ranges 22

    # Từ chối SSH từ internet công cộng
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyInternetSsh --priority 110 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes Internet \
      --destination-port-ranges 22

    # Từ chối SSH từ các nguồn VNet khác
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyVnetSsh --priority 120 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes VirtualNetwork \
      --destination-port-ranges 22
    ```

    Các quy tắc được đánh giá theo thứ tự ưu tiên (số thấp nhất trước): lưu lượng Bastion được cho phép ở mức 100, sau đó tất cả SSH khác bị chặn ở mức 110 và 120.

  </Step>

  <Step title="Tạo mạng ảo và subnets">
    Tạo VNet với subnet VM (đính kèm NSG), sau đó thêm subnet Bastion.

    ```bash
    az network vnet create \
      -g "${RG}" -n "${VNET_NAME}" -l "${LOCATION}" \
      --address-prefixes "${VNET_PREFIX}" \
      --subnet-name "${VM_SUBNET_NAME}" \
      --subnet-prefixes "${VM_SUBNET_PREFIX}"

    # Đính kèm NSG vào subnet VM
    az network vnet subnet update \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n "${VM_SUBNET_NAME}" --nsg "${NSG_NAME}"

    # AzureBastionSubnet — tên được yêu cầu bởi Azure
    az network vnet subnet create \
      -g "${RG}" --vnet-name "${VNET_NAME}" \
      -n AzureBastionSubnet \
      --address-prefixes "${BASTION_SUBNET_PREFIX}"
    ```

  </Step>

  <Step title="Tạo VM">
    VM không có IP công cộng. Truy cập SSH chỉ thông qua Azure Bastion.

    ```bash
    az vm create \
      -g "${RG}" -n "${VM_NAME}" -l "${LOCATION}" \
      --image "Canonical:ubuntu-24_04-lts:server:latest" \
      --size "${VM_SIZE}" \
      --os-disk-size-gb "${OS_DISK_SIZE_GB}" \
      --storage-sku StandardSSD_LRS \
      --admin-username "${ADMIN_USERNAME}" \
      --ssh-key-values "${SSH_PUB_KEY}" \
      --vnet-name "${VNET_NAME}" \
      --subnet "${VM_SUBNET_NAME}" \
      --public-ip-address "" \
      --nsg ""
    ```

    `--public-ip-address ""` ngăn không cho IP công cộng được gán. `--nsg ""` bỏ qua việc tạo NSG cho mỗi NIC (NSG cấp subnet xử lý bảo mật).

    **Tái tạo:** Lệnh trên sử dụng `latest` cho hình ảnh Ubuntu. Để cố định một phiên bản cụ thể, liệt kê các phiên bản có sẵn và thay thế `latest`:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Tạo Azure Bastion">
    Azure Bastion cung cấp truy cập SSH được quản lý đến VM mà không cần lộ IP công cộng. SKU tiêu chuẩn với tạo đường hầm là cần thiết cho `az network bastion ssh` dựa trên CLI.

    ```bash
    az network public-ip create \
      -g "${RG}" -n "${BASTION_PIP_NAME}" -l "${LOCATION}" \
      --sku Standard --allocation-method Static

    az network bastion create \
      -g "${RG}" -n "${BASTION_NAME}" -l "${LOCATION}" \
      --vnet-name "${VNET_NAME}" \
      --public-ip-address "${BASTION_PIP_NAME}" \
      --sku Standard --enable-tunneling true
    ```

    Việc cung cấp Bastion thường mất 5-10 phút nhưng có thể mất đến 15-30 phút ở một số khu vực.

  </Step>
</Steps>

## Cài đặt OpenClaw

<Steps>
  <Step title="SSH vào VM thông qua Azure Bastion">
    ```bash
    VM_ID="$(az vm show -g "${RG}" -n "${VM_NAME}" --query id -o tsv)"

    az network bastion ssh \
      --name "${BASTION_NAME}" \
      --resource-group "${RG}" \
      --target-resource-id "${VM_ID}" \
      --auth-type ssh-key \
      --username "${ADMIN_USERNAME}" \
      --ssh-key ~/.ssh/id_ed25519
    ```

  </Step>

  <Step title="Cài đặt OpenClaw (trong shell VM)">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh -o /tmp/install.sh
    bash /tmp/install.sh
    rm -f /tmp/install.sh
    ```

    Trình cài đặt sẽ cài đặt Node LTS và các phụ thuộc nếu chưa có, cài đặt OpenClaw và khởi chạy trình hướng dẫn onboarding. Xem [Cài đặt](/install) để biết chi tiết.

  </Step>

  <Step title="Xác minh Gateway">
    Sau khi hoàn tất onboarding:

    ```bash
    openclaw gateway status
    ```

    Hầu hết các nhóm Azure doanh nghiệp đã có giấy phép GitHub Copilot. Nếu bạn thuộc trường hợp này, chúng tôi khuyên bạn nên chọn nhà cung cấp GitHub Copilot trong trình hướng dẫn onboarding của OpenClaw. Xem [nhà cung cấp GitHub Copilot](/providers/github-copilot).

  </Step>
</Steps>

## Cân nhắc chi phí

Azure Bastion SKU tiêu chuẩn chạy khoảng **140 USD/tháng** và VM (Standard_B2as_v2) chạy khoảng **55 USD/tháng**.

Để giảm chi phí:

- **Giải phóng VM** khi không sử dụng (ngừng tính phí tính toán; phí đĩa vẫn còn). OpenClaw Gateway sẽ không thể truy cập khi VM bị giải phóng — khởi động lại khi cần sử dụng:

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # khởi động lại sau
  ```

- **Xóa Bastion khi không cần thiết** và tạo lại khi cần truy cập SSH. Bastion là thành phần chi phí lớn nhất và chỉ mất vài phút để cung cấp.
- **Sử dụng SKU Bastion cơ bản** (~38 USD/tháng) nếu bạn chỉ cần SSH dựa trên Portal và không yêu cầu tạo đường hầm CLI (`az network bastion ssh`).

## Dọn dẹp

Để xóa tất cả tài nguyên được tạo bởi hướng dẫn này:

```bash
az group delete -n "${RG}" --yes --no-wait
```

Điều này sẽ xóa nhóm tài nguyên và mọi thứ bên trong nó (VM, VNet, NSG, Bastion, IP công cộng).

## Bước tiếp theo

- Thiết lập các kênh nhắn tin: [Channels](/channels)
- Ghép nối thiết bị cục bộ làm node: [Nodes](/nodes)
- Cấu hình Gateway: [Cấu hình Gateway](/gateway/configuration)
- Để biết thêm chi tiết về triển khai OpenClaw trên Azure với nhà cung cấp mô hình GitHub Copilot: [OpenClaw trên Azure với GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)

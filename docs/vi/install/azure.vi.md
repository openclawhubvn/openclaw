---
summary: "Chạy OpenClaw Gateway 24/7 trên Azure Linux VM với trạng thái bền vững"
read_when:
  - Muốn chạy OpenClaw 24/7 trên Azure với Network Security Group được siết chặt
  - Cần OpenClaw Gateway chuẩn production, luôn hoạt động trên Azure Linux VM tự quản lý
  - Muốn quản trị an toàn với Azure Bastion SSH
title: "Azure"
---

# OpenClaw trên Azure Linux VM

Hướng dẫn này giúp dựng Azure Linux VM với Azure CLI, áp dụng siết chặt Network Security Group (NSG), cấu hình Azure Bastion để truy cập SSH, và cài đặt OpenClaw.

## Bạn sẽ làm gì

- Tạo mạng Azure (VNet, subnets, NSG) và tài nguyên compute bằng Azure CLI
- Áp dụng quy tắc NSG để chỉ cho phép SSH từ Azure Bastion
- Dùng Azure Bastion để truy cập SSH (không có IP công khai trên VM)
- Cài đặt OpenClaw bằng script cài đặt
- Kiểm tra Gateway

## Cần chuẩn bị

- Tài khoản Azure có quyền tạo tài nguyên compute và network
- Đã cài Azure CLI (xem [hướng dẫn cài Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) nếu cần)
- Cặp khóa SSH (hướng dẫn sẽ bao gồm cách tạo nếu cần)
- ~20-30 phút

## Cấu hình triển khai

<Steps>
  <Step title="Đăng nhập Azure CLI">
    ```bash
    az login
    az extension add -n ssh
    ```

    Cần `ssh` extension để dùng Azure Bastion native SSH tunneling.

  </Step>

  <Step title="Đăng ký resource providers cần thiết (một lần)">
    ```bash
    az provider register --namespace Microsoft.Compute
    az provider register --namespace Microsoft.Network
    ```

    Kiểm tra đăng ký. Đợi đến khi cả hai hiện `Registered`.

    ```bash
    az provider show --namespace Microsoft.Compute --query registrationState -o tsv
    az provider show --namespace Microsoft.Network --query registrationState -o tsv
    ```

  </Step>

  <Step title="Đặt biến triển khai">
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

    Điều chỉnh tên và CIDR ranges phù hợp với môi trường. Subnet Bastion phải ít nhất `/26`.

  </Step>

  <Step title="Chọn khóa SSH">
    Dùng khóa công khai hiện có nếu đã có:

    ```bash
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

    Nếu chưa có khóa SSH, tạo một cái:

    ```bash
    ssh-keygen -t ed25519 -a 100 -f ~/.ssh/id_ed25519 -C "you@example.com"
    SSH_PUB_KEY="$(cat ~/.ssh/id_ed25519.pub)"
    ```

  </Step>

  <Step title="Chọn kích thước VM và dung lượng đĩa OS">
    ```bash
    VM_SIZE="Standard_B2as_v2"
    OS_DISK_SIZE_GB=64
    ```

    Chọn kích thước VM và dung lượng đĩa OS có sẵn trong subscription và khu vực:

    - Bắt đầu nhỏ cho nhu cầu nhẹ và mở rộng sau
    - Dùng nhiều vCPU/RAM/đĩa hơn cho tự động hóa nặng, nhiều kênh, hoặc tải công cụ/mô hình lớn
    - Nếu kích thước VM không có sẵn trong khu vực hoặc quota subscription, chọn SKU gần nhất

    Liệt kê kích thước VM có sẵn trong khu vực mục tiêu:

    ```bash
    az vm list-skus --location "${LOCATION}" --resource-type virtualMachines -o table
    ```

    Kiểm tra vCPU và đĩa hiện tại/quota:

    ```bash
    az vm list-usage --location "${LOCATION}" -o table
    ```

  </Step>
</Steps>

## Triển khai tài nguyên Azure

<Steps>
  <Step title="Tạo resource group">
    ```bash
    az group create -n "${RG}" -l "${LOCATION}"
    ```
  </Step>

  <Step title="Tạo network security group">
    Tạo NSG và thêm quy tắc để chỉ subnet Bastion có thể SSH vào VM.

    ```bash
    az network nsg create \
      -g "${RG}" -n "${NSG_NAME}" -l "${LOCATION}"

    # Cho phép SSH từ subnet Bastion
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n AllowSshFromBastionSubnet --priority 100 \
      --access Allow --direction Inbound --protocol Tcp \
      --source-address-prefixes "${BASTION_SUBNET_PREFIX}" \
      --destination-port-ranges 22

    # Chặn SSH từ internet công cộng
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyInternetSsh --priority 110 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes Internet \
      --destination-port-ranges 22

    # Chặn SSH từ nguồn VNet khác
    az network nsg rule create \
      -g "${RG}" --nsg-name "${NSG_NAME}" \
      -n DenyVnetSsh --priority 120 \
      --access Deny --direction Inbound --protocol Tcp \
      --source-address-prefixes VirtualNetwork \
      --destination-port-ranges 22
    ```

    Quy tắc được đánh giá theo thứ tự ưu tiên (số nhỏ trước): traffic Bastion được cho phép ở 100, sau đó tất cả SSH khác bị chặn ở 110 và 120.

  </Step>

  <Step title="Tạo virtual network và subnets">
    Tạo VNet với subnet VM (gắn NSG), sau đó thêm subnet Bastion.

    ```bash
    az network vnet create \
      -g "${RG}" -n "${VNET_NAME}" -l "${LOCATION}" \
      --address-prefixes "${VNET_PREFIX}" \
      --subnet-name "${VM_SUBNET_NAME}" \
      --subnet-prefixes "${VM_SUBNET_PREFIX}"

    # Gắn NSG vào subnet VM
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
    VM không có IP công khai. Truy cập SSH chỉ qua Azure Bastion.

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

    `--public-ip-address ""` ngăn không cho gán IP công khai. `--nsg ""` bỏ qua tạo NSG cho từng NIC (NSG cấp subnet xử lý bảo mật).

    **Tái tạo:** Lệnh trên dùng `latest` cho image Ubuntu. Để cố định phiên bản cụ thể, liệt kê các phiên bản có sẵn và thay `latest`:

    ```bash
    az vm image list \
      --publisher Canonical --offer ubuntu-24_04-lts \
      --sku server --all -o table
    ```

  </Step>

  <Step title="Tạo Azure Bastion">
    Azure Bastion cung cấp truy cập SSH quản lý đến VM mà không cần lộ IP công khai. Standard SKU với tunneling cần thiết cho `az network bastion ssh` qua CLI.

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

    Bastion thường mất 5-10 phút để provision nhưng có thể mất đến 15-30 phút ở một số khu vực.

  </Step>
</Steps>

## Cài đặt OpenClaw

<Steps>
  <Step title="SSH vào VM qua Azure Bastion">
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

    Trình cài đặt sẽ cài Node LTS và các phụ thuộc nếu chưa có, cài OpenClaw và khởi chạy wizard onboarding. Xem [Install](/install) để biết chi tiết.

  </Step>

  <Step title="Kiểm tra Gateway">
    Sau khi hoàn tất onboarding:

    ```bash
    openclaw gateway status
    ```

    Hầu hết các team Azure doanh nghiệp đã có license GitHub Copilot. Nếu đúng vậy, nên chọn provider GitHub Copilot trong wizard onboarding của OpenClaw. Xem [GitHub Copilot provider](/providers/github-copilot).

  </Step>
</Steps>

## Cân nhắc chi phí

Azure Bastion Standard SKU chạy khoảng **\$140/tháng** và VM (Standard_B2as_v2) chạy khoảng **\$55/tháng**.

Để giảm chi phí:

- **Deallocate VM** khi không dùng (ngừng tính phí compute; vẫn tính phí đĩa). OpenClaw Gateway sẽ không truy cập được khi VM bị deallocate — khởi động lại khi cần:

  ```bash
  az vm deallocate -g "${RG}" -n "${VM_NAME}"
  az vm start -g "${RG}" -n "${VM_NAME}"   # khởi động lại sau
  ```

- **Xóa Bastion khi không cần** và tạo lại khi cần truy cập SSH. Bastion là thành phần chi phí lớn nhất và chỉ mất vài phút để provision.
- **Dùng Basic Bastion SKU** (~\$38/tháng) nếu chỉ cần SSH qua Portal và không cần tunneling qua CLI (`az network bastion ssh`).

## Dọn dẹp

Để xóa tất cả tài nguyên được tạo bởi hướng dẫn này:

```bash
az group delete -n "${RG}" --yes --no-wait
```

Lệnh này sẽ xóa resource group và mọi thứ bên trong (VM, VNet, NSG, Bastion, IP công khai).

## Bước tiếp theo

- Thiết lập kênh nhắn tin: [Channels](/channels)
- Ghép nối thiết bị local làm nodes: [Nodes](/nodes)
- Cấu hình Gateway: [Gateway configuration](/gateway/configuration)
- Để biết thêm chi tiết về triển khai OpenClaw trên Azure với model provider GitHub Copilot: [OpenClaw on Azure with GitHub Copilot](https://github.com/johnsonshi/openclaw-azure-github-copilot)\n
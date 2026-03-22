---
summary: "Di chuyển (migrate) một cài đặt OpenClaw từ máy này sang máy khác"
read_when:
  - Bạn đang chuyển OpenClaw sang laptop/máy chủ mới
  - Bạn muốn giữ nguyên các phiên làm việc, xác thực và đăng nhập kênh (WhatsApp, v.v.)
title: "Hướng Dẫn Di Chuyển"
---

# Di Chuyển OpenClaw Sang Máy Mới

Hướng dẫn này giúp di chuyển gateway OpenClaw sang máy mới mà không cần thực hiện lại quá trình onboarding.

## Những Gì Được Di Chuyển

Khi bạn sao chép **thư mục trạng thái** (`~/.openclaw/` mặc định) và **workspace**, bạn sẽ giữ lại:

- **Cấu hình** -- `openclaw.json` và tất cả cài đặt gateway
- **Xác thực** -- API keys, OAuth tokens, hồ sơ thông tin đăng nhập
- **Phiên làm việc** -- lịch sử hội thoại và trạng thái agent
- **Trạng thái kênh** -- đăng nhập WhatsApp, phiên Telegram, v.v.
- **Tệp workspace** -- `MEMORY.md`, `USER.md`, kỹ năng và gợi ý

<Tip>
Chạy `openclaw status` trên máy cũ để xác nhận đường dẫn thư mục trạng thái.
Các hồ sơ tùy chỉnh sử dụng `~/.openclaw-<profile>/` hoặc một đường dẫn được thiết lập qua `OPENCLAW_STATE_DIR`.
</Tip>

## Các Bước Di Chuyển

<Steps>
  <Step title="Dừng gateway và sao lưu">
    Trên máy **cũ**, dừng gateway để các tệp không bị thay đổi trong quá trình sao chép, sau đó nén lại:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Nếu bạn sử dụng nhiều hồ sơ (ví dụ: `~/.openclaw-work`), hãy nén từng cái riêng biệt.

  </Step>

  <Step title="Cài đặt OpenClaw trên máy mới">
    [Cài đặt](/install) CLI (và Node nếu cần) trên máy mới.
    Không sao nếu quá trình onboarding tạo ra một `~/.openclaw/` mới -- bạn sẽ ghi đè nó ngay sau đây.
  </Step>

  <Step title="Sao chép thư mục trạng thái và workspace">
    Chuyển tệp nén qua `scp`, `rsync -a`, hoặc ổ đĩa ngoài, sau đó giải nén:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Đảm bảo các thư mục ẩn đã được bao gồm và quyền sở hữu tệp phù hợp với người dùng sẽ chạy gateway.

  </Step>

  <Step title="Chạy doctor và kiểm tra">
    Trên máy mới, chạy [Doctor](/gateway/doctor) để áp dụng các di chuyển cấu hình và sửa chữa dịch vụ:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

## Các Lỗi Thường Gặp

<AccordionGroup>
  <Accordion title="Không khớp hồ sơ hoặc state-dir">
    Nếu gateway cũ sử dụng `--profile` hoặc `OPENCLAW_STATE_DIR` và gateway mới không sử dụng,
    các kênh sẽ xuất hiện như đã đăng xuất và các phiên sẽ trống.
    Khởi chạy gateway với hồ sơ hoặc state-dir **giống** như bạn đã di chuyển, sau đó chạy lại `openclaw doctor`.
  </Accordion>

  <Accordion title="Chỉ sao chép openclaw.json">
    Tệp cấu hình không đủ. Thông tin xác thực nằm dưới `credentials/`, và trạng thái agent nằm dưới `agents/`.
    Luôn di chuyển **toàn bộ** thư mục trạng thái.
  </Accordion>

  <Accordion title="Quyền và quyền sở hữu">
    Nếu bạn sao chép dưới quyền root hoặc chuyển đổi người dùng, gateway có thể không đọc được thông tin xác thực.
    Đảm bảo thư mục trạng thái và workspace thuộc quyền sở hữu của người dùng chạy gateway.
  </Accordion>

  <Accordion title="Chế độ từ xa">
    Nếu giao diện người dùng của bạn trỏ đến một gateway **từ xa**, máy chủ từ xa sở hữu các phiên và workspace.
    Di chuyển máy chủ gateway, không phải laptop của bạn. Xem [FAQ](/help/faq#where-does-openclaw-store-its-data).
  </Accordion>

  <Accordion title="Bí mật trong bản sao lưu">
    Thư mục trạng thái chứa API keys, OAuth tokens, và thông tin đăng nhập kênh.
    Lưu trữ bản sao lưu được mã hóa, tránh các kênh truyền không an toàn, và thay đổi khóa nếu nghi ngờ bị lộ.
  </Accordion>
</AccordionGroup>

## Danh Sách Kiểm Tra Xác Minh

Trên máy mới, xác nhận:

- [ ] `openclaw status` hiển thị gateway đang chạy
- [ ] Các kênh vẫn kết nối (không cần ghép đôi lại)
- [ ] Bảng điều khiển mở và hiển thị các phiên hiện có
- [ ] Các tệp workspace (bộ nhớ, cấu hình) có mặt

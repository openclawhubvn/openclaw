---
summary: "Di chuyển (migrate) cài đặt OpenClaw từ máy này sang máy khác"
read_when:
  - Đang chuyển OpenClaw sang laptop/server mới
  - Muốn giữ nguyên session, auth, và đăng nhập channel (WhatsApp, v.v.)
title: "Hướng dẫn Migration"
---

# Di chuyển OpenClaw sang Máy Mới

Hướng dẫn này giúp chuyển OpenClaw gateway sang máy mới mà không cần làm lại onboarding.

## Những Gì Được Di Chuyển

Khi copy **thư mục state** (`~/.openclaw/` mặc định) và **workspace**, bạn giữ được:

- **Config** -- `openclaw.json` và tất cả cài đặt gateway
- **Auth** -- API keys, OAuth tokens, credential profiles
- **Sessions** -- lịch sử hội thoại và trạng thái agent
- **Channel state** -- đăng nhập WhatsApp, session Telegram, v.v.
- **Workspace files** -- `MEMORY.md`, `USER.md`, skills, và prompts

<Tip>
Chạy `openclaw status` trên máy cũ để xác nhận đường dẫn thư mục state.
Profile tùy chỉnh dùng `~/.openclaw-<profile>/` hoặc đường dẫn được set qua `OPENCLAW_STATE_DIR`.
</Tip>

## Các Bước Di Chuyển

<Steps>
  <Step title="Dừng gateway và sao lưu">
    Trên máy **cũ**, dừng gateway để file không thay đổi trong lúc copy, sau đó nén lại:

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    Nếu dùng nhiều profile (ví dụ `~/.openclaw-work`), nén từng cái riêng biệt.

  </Step>

  <Step title="Cài đặt OpenClaw trên máy mới">
    [Cài đặt](/install) CLI (và Node nếu cần) trên máy mới.
    Không sao nếu onboarding tạo mới `~/.openclaw/` -- sẽ ghi đè sau.
  </Step>

  <Step title="Copy thư mục state và workspace">
    Chuyển file nén qua `scp`, `rsync -a`, hoặc ổ đĩa ngoài, sau đó giải nén:

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    Đảm bảo đã bao gồm thư mục ẩn và quyền sở hữu file khớp với user sẽ chạy gateway.

  </Step>

  <Step title="Chạy doctor và kiểm tra">
    Trên máy mới, chạy [Doctor](/gateway/doctor) để áp dụng migration config và sửa dịch vụ:

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

## Những Lỗi Thường Gặp

<AccordionGroup>
  <Accordion title="Sai profile hoặc state-dir">
    Nếu gateway cũ dùng `--profile` hoặc `OPENCLAW_STATE_DIR` mà cái mới không dùng,
    các channel sẽ bị đăng xuất và session trống.
    Khởi chạy gateway với profile hoặc state-dir **giống** như đã migrate, sau đó chạy lại `openclaw doctor`.
  </Accordion>

  <Accordion title="Chỉ copy openclaw.json">
    File config không đủ. Credentials nằm trong `credentials/`, và trạng thái agent nằm trong `agents/`.
    Luôn migrate **toàn bộ** thư mục state.
  </Accordion>

  <Accordion title="Quyền và quyền sở hữu">
    Nếu copy dưới quyền root hoặc đổi user, gateway có thể không đọc được credentials.
    Đảm bảo thư mục state và workspace thuộc quyền sở hữu của user chạy gateway.
  </Accordion>

  <Accordion title="Chế độ remote">
    Nếu UI trỏ đến gateway **remote**, host remote sở hữu session và workspace.
    Migrate host gateway, không phải laptop local. Xem [FAQ](/help/faq#where-does-openclaw-store-its-data).
  </Accordion>

  <Accordion title="Secrets trong backup">
    Thư mục state chứa API keys, OAuth tokens, và channel credentials.
    Lưu backup mã hóa, tránh kênh truyền không an toàn, và xoay vòng keys nếu nghi ngờ bị lộ.
  </Accordion>
</AccordionGroup>

## Checklist Kiểm Tra

Trên máy mới, xác nhận:

- [ ] `openclaw status` hiển thị gateway đang chạy
- [ ] Các channel vẫn kết nối (không cần ghép đôi lại)
- [ ] Dashboard mở và hiển thị session hiện có
- [ ] Workspace files (memory, configs) có mặt\n
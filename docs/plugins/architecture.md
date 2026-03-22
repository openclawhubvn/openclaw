---
summary: "Nội dung bên trong Plugin: mô hình khả năng, quyền sở hữu, hợp đồng, quy trình tải, và các trợ giúp runtime"
read_when:
  - Xây dựng hoặc gỡ lỗi plugin OpenClaw gốc
  - Hiểu mô hình khả năng của plugin hoặc ranh giới quyền sở hữu
  - Làm việc trên quy trình tải plugin hoặc registry
  - Triển khai các hook runtime của provider hoặc plugin kênh
title: "Nội dung Bên trong Plugin"
sidebarTitle: "Nội dung Bên trong"
---

# Nội dung Bên trong Plugin

<Info>
  Trang này dành cho **nhà phát triển và người đóng góp plugin**. Nếu bạn chỉ muốn
  cài đặt và sử dụng plugin, xem [Plugins](/tools/plugin). Nếu bạn muốn xây dựng
  một plugin, xem [Xây dựng Plugins](/plugins/building-plugins).
</Info>

Trang này bao gồm kiến trúc nội bộ của hệ thống plugin OpenClaw.

## Mô hình khả năng công khai

Khả năng là mô hình **plugin gốc** công khai bên trong OpenClaw. Mỗi plugin gốc OpenClaw đăng ký với một hoặc nhiều loại khả năng:

| Khả năng            | Phương thức đăng ký                                | Ví dụ plugin              |
| ------------------- | -------------------------------------------------- | ------------------------- |
| Suy luận văn bản    | `api.registerProvider(...)`                       | `openai`, `anthropic`     |
| Giọng nói           | `api.registerSpeechProvider(...)`                 | `elevenlabs`, `microsoft` |
| Hiểu biết truyền thông | `api.registerMediaUnderstandingProvider(...)` | `openai`, `google`        |
| Tạo hình ảnh        | `api.registerImageGenerationProvider(...)`        | `openai`, `google`        |
| Tìm kiếm web        | `api.registerWebSearchProvider(...)`              | `google`                  |
| Kênh / nhắn tin     | `api.registerChannel(...)`                        | `msteams`, `matrix`       |

Một plugin không đăng ký khả năng nào nhưng cung cấp hook, công cụ, hoặc dịch vụ là một plugin **chỉ có hook cũ**. Mẫu này vẫn được hỗ trợ đầy đủ.

### Quan điểm tương thích bên ngoài

Mô hình khả năng đã được tích hợp vào lõi và được sử dụng bởi các plugin gốc/bundled ngày nay, nhưng khả năng tương thích plugin bên ngoài vẫn cần một tiêu chuẩn chặt chẽ hơn "nó được xuất, do đó nó được đóng băng."

Hướng dẫn hiện tại:

- **plugin bên ngoài hiện có:** giữ cho tích hợp dựa trên hook hoạt động; coi đây là tiêu chuẩn tương thích
- **plugin gốc/bundled mới:** ưu tiên đăng ký khả năng rõ ràng hơn là tiếp cận theo nhà cung cấp hoặc thiết kế chỉ có hook mới
- **plugin bên ngoài áp dụng đăng ký khả năng:** được phép, nhưng coi các bề mặt trợ giúp cụ thể cho khả năng là đang phát triển trừ khi tài liệu rõ ràng đánh dấu một hợp đồng là ổn định

Quy tắc thực tế:

- API đăng ký khả năng là hướng đi dự định
- hook cũ vẫn là con đường an toàn nhất không bị phá vỡ cho plugin bên ngoài trong quá trình chuyển đổi
- các subpath trợ giúp xuất không phải tất cả đều bằng nhau; ưu tiên hợp đồng được tài liệu rõ ràng, không phải các trợ giúp xuất ngẫu nhiên

### Hình dạng Plugin

OpenClaw phân loại mỗi plugin đã tải vào một hình dạng dựa trên hành vi đăng ký thực tế của nó (không chỉ là metadata tĩnh):

- **plain-capability** -- đăng ký chính xác một loại khả năng (ví dụ như một plugin chỉ có provider như `mistral`)
- **hybrid-capability** -- đăng ký nhiều loại khả năng (ví dụ `openai` sở hữu suy luận văn bản, giọng nói, hiểu biết truyền thông, và tạo hình ảnh)
- **hook-only** -- chỉ đăng ký hook (đã được gõ hoặc tùy chỉnh), không có khả năng, công cụ, lệnh, hoặc dịch vụ
- **non-capability** -- đăng ký công cụ, lệnh, dịch vụ, hoặc tuyến đường nhưng không có khả năng

Sử dụng `openclaw plugins inspect <id>` để xem hình dạng và phân tích khả năng của một plugin. Xem [CLI reference](/cli/plugins#inspect) để biết chi tiết.

### Hook cũ

Hook `before_agent_start` vẫn được hỗ trợ như một con đường tương thích cho các plugin chỉ có hook. Các plugin thực tế cũ vẫn phụ thuộc vào nó.

Hướng đi:

- giữ cho nó hoạt động
- tài liệu hóa nó như là cũ
- ưu tiên `before_model_resolve` cho công việc ghi đè model/provider
- ưu tiên `before_prompt_build` cho công việc biến đổi prompt
- chỉ loại bỏ sau khi sử dụng thực tế giảm và độ phủ fixture chứng minh an toàn di chuyển

### Tín hiệu tương thích

Khi bạn chạy `openclaw doctor` hoặc `openclaw plugins inspect <id>`, bạn có thể thấy một trong những nhãn này:

| Tín hiệu                  | Ý nghĩa                                                      |
| ------------------------- | ------------------------------------------------------------ |
| **config valid**          | Cấu hình phân tích tốt và plugin được giải quyết             |
| **compatibility advisory**| Plugin sử dụng một mẫu cũ nhưng được hỗ trợ (ví dụ: `hook-only`) |
| **legacy warning**        | Plugin sử dụng `before_agent_start`, đã bị loại bỏ           |
| **hard error**            | Cấu hình không hợp lệ hoặc plugin không tải được             |

Cả `hook-only` và `before_agent_start` sẽ không phá vỡ plugin của bạn hôm nay -- `hook-only` là lời khuyên, và `before_agent_start` chỉ kích hoạt cảnh báo. Những tín hiệu này cũng xuất hiện trong `openclaw status --all` và `openclaw plugins doctor`.

## Tổng quan kiến trúc

Hệ thống plugin của OpenClaw có bốn lớp:

1. **Manifest + khám phá**
   OpenClaw tìm các plugin ứng viên từ các đường dẫn được cấu hình, gốc workspace, gốc mở rộng toàn cầu, và các mở rộng bundled. Khám phá đọc các manifest `openclaw.plugin.json` gốc cộng với các manifest bundle được hỗ trợ trước tiên.
2. **Kích hoạt + xác thực**
   Lõi quyết định liệu một plugin đã được khám phá có được kích hoạt, vô hiệu hóa, chặn, hay được chọn cho một slot độc quyền như bộ nhớ.
3. **Tải runtime**
   Các plugin OpenClaw gốc được tải trong quá trình thông qua jiti và đăng ký khả năng vào một registry trung tâm. Các bundle tương thích được chuẩn hóa thành các bản ghi registry mà không cần nhập mã runtime.
4. **Tiêu thụ bề mặt**
   Phần còn lại của OpenClaw đọc registry để hiển thị công cụ, kênh, thiết lập provider, hook, tuyến HTTP, lệnh CLI, và dịch vụ.

Ranh giới thiết kế quan trọng:

- khám phá + xác thực cấu hình nên hoạt động từ **metadata manifest/schema** mà không cần thực thi mã plugin
- hành vi runtime gốc đến từ đường dẫn `register(api)` của module plugin

Sự phân chia đó cho phép OpenClaw xác thực cấu hình, giải thích các plugin bị thiếu/vô hiệu hóa, và xây dựng gợi ý UI/schema trước khi runtime đầy đủ hoạt động.

### Plugin kênh và công cụ tin nhắn chia sẻ

Plugin kênh không cần đăng ký một công cụ gửi/chỉnh sửa/phản hồi riêng cho các hành động chat thông thường. OpenClaw giữ một công cụ `message` chia sẻ trong lõi, và plugin kênh sở hữu việc khám phá và thực thi cụ thể cho kênh đằng sau nó.

Ranh giới hiện tại là:

- lõi sở hữu máy chủ công cụ `message` chia sẻ, dây nối prompt, ghi sổ phiên/chủ đề, và phân phối thực thi
- plugin kênh sở hữu khám phá hành động có phạm vi, khám phá khả năng, và bất kỳ mảnh schema cụ thể cho kênh nào
- plugin kênh thực thi hành động cuối cùng thông qua bộ điều hợp hành động của họ

Đối với plugin kênh, bề mặt SDK là
`ChannelMessageActionAdapter.describeMessageTool(...)`. Lời gọi khám phá thống nhất đó cho phép một plugin trả về các hành động, khả năng, và đóng góp schema có thể nhìn thấy của nó cùng nhau để những phần đó không bị tách rời.

Lõi truyền phạm vi runtime vào bước khám phá đó. Các trường quan trọng bao gồm:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` inbound đáng tin cậy

Điều đó quan trọng cho các plugin nhạy cảm với ngữ cảnh. Một kênh có thể ẩn hoặc hiển thị các hành động tin nhắn dựa trên tài khoản hoạt động, phòng/chủ đề/tin nhắn hiện tại, hoặc danh tính người yêu cầu đáng tin cậy mà không cần mã hóa cứng các nhánh cụ thể cho kênh trong công cụ `message` lõi.

Đây là lý do tại sao các thay đổi định tuyến runner nhúng vẫn là công việc của plugin: runner chịu trách nhiệm chuyển tiếp danh tính chat/phiên hiện tại vào ranh giới khám phá plugin để công cụ `message` chia sẻ hiển thị bề mặt thuộc sở hữu kênh đúng cho lượt hiện tại.

Đối với các trợ giúp thực thi thuộc sở hữu kênh, các plugin bundled nên giữ runtime thực thi bên trong các module mở rộng của riêng họ. Lõi không còn sở hữu các runtime hành động tin nhắn Discord, Slack, Telegram, hoặc WhatsApp dưới `src/agents/tools`. Chúng tôi không xuất bản các subpath `plugin-sdk/*-action-runtime` riêng biệt, và các plugin bundled nên nhập mã runtime cục bộ của riêng họ trực tiếp từ các module thuộc sở hữu mở rộng của họ.

Đối với các cuộc thăm dò cụ thể, có hai đường thực thi:

- `outbound.sendPoll` là cơ sở chia sẻ cho các kênh phù hợp với mô hình thăm dò chung
- `actions.handleAction("poll")` là đường ưu tiên cho ngữ nghĩa thăm dò cụ thể cho kênh hoặc các tham số thăm dò bổ sung

Lõi hiện trì hoãn phân tích thăm dò chia sẻ cho đến khi plugin poll dispatch từ chối hành động, do đó các bộ xử lý thăm dò thuộc sở hữu plugin có thể chấp nhận các trường thăm dò cụ thể cho kênh mà không bị chặn bởi trình phân tích thăm dò chung trước.

Xem [Quy trình tải](#load-pipeline) để biết trình tự khởi động đầy đủ.

## Mô hình quyền sở hữu khả năng

OpenClaw coi một plugin gốc là ranh giới quyền sở hữu cho một **công ty** hoặc một **tính năng**, không phải là một túi tích hợp không liên quan.

Điều đó có nghĩa là:

- một plugin công ty thường nên sở hữu tất cả các bề mặt hướng OpenClaw của công ty đó
- một plugin tính năng thường nên sở hữu toàn bộ bề mặt tính năng mà nó giới thiệu
- các kênh nên tiêu thụ các khả năng lõi chia sẻ thay vì triển khai lại hành vi provider một cách tùy tiện

Ví dụ:

- plugin `openai` bundled sở hữu hành vi model-provider OpenAI và hành vi hiểu biết giọng nói + truyền thông + tạo hình ảnh OpenAI
- plugin `elevenlabs` bundled sở hữu hành vi giọng nói ElevenLabs
- plugin `microsoft` bundled sở hữu hành vi giọng nói Microsoft
- plugin `google` bundled sở hữu hành vi model-provider Google cộng với hành vi hiểu biết truyền thông + tạo hình ảnh + tìm kiếm web Google
- các plugin `minimax`, `mistral`, `moonshot`, và `zai` bundled sở hữu các backend hiểu biết truyền thông của họ
- plugin `voice-call` là một plugin tính năng: nó sở hữu vận chuyển cuộc gọi, công cụ, CLI, tuyến đường, và runtime, nhưng nó tiêu thụ khả năng TTS/STT lõi thay vì phát minh ra một ngăn xếp giọng nói thứ hai

Trạng thái cuối cùng dự định là:

- OpenAI sống trong một plugin ngay cả khi nó trải dài các mô hình văn bản, giọng nói, hình ảnh, và video trong tương lai
- một nhà cung cấp khác có thể làm điều tương tự cho khu vực bề mặt của riêng mình
- các kênh không quan tâm plugin nhà cung cấp nào sở hữu provider; họ tiêu thụ hợp đồng khả năng chia sẻ được lõi phơi bày

Đây là sự khác biệt chính:

- **plugin** = ranh giới quyền sở hữu
- **khả năng** = hợp đồng lõi mà nhiều plugin có thể triển khai hoặc tiêu thụ

Vì vậy, nếu OpenClaw thêm một miền mới như video, câu hỏi đầu tiên không phải là "nhà cung cấp nào nên mã hóa cứng xử lý video?" Câu hỏi đầu tiên là "hợp đồng khả năng video lõi là gì?" Khi hợp đồng đó tồn tại, các plugin nhà cung cấp có thể đăng ký với nó và các plugin kênh/tính năng có thể tiêu thụ nó.

Nếu khả năng chưa tồn tại, động thái đúng thường là:

1. định nghĩa khả năng còn thiếu trong lõi
2. phơi bày nó thông qua API/runtime plugin một cách có gõ
3. dây nối kênh/tính năng chống lại khả năng đó
4. để các plugin nhà cung cấp đăng ký triển khai

Điều này giữ cho quyền sở hữu rõ ràng trong khi tránh hành vi lõi phụ thuộc vào một nhà cung cấp duy nhất hoặc một đường mã plugin cụ thể.

### Tầng khả năng

Sử dụng mô hình tinh thần này khi quyết định nơi mã thuộc về:

- **tầng khả năng lõi**: điều phối chia sẻ, chính sách, quy tắc hợp nhất cấu hình, ngữ nghĩa phân phối, và hợp đồng có gõ
- **tầng plugin nhà cung cấp**: API cụ thể cho nhà cung cấp, xác thực, danh mục mô hình, tổng hợp giọng nói, tạo hình ảnh, backend video trong tương lai, điểm cuối sử dụng
- **tầng plugin kênh/tính năng**: tích hợp Slack/Discord/cuộc gọi thoại/v.v. tiêu thụ các khả năng lõi và trình bày chúng trên một bề mặt

Ví dụ, TTS tuân theo hình dạng này:

- lõi sở hữu chính sách TTS thời gian trả lời, thứ tự dự phòng, sở thích, và phân phối kênh
- `openai`, `elevenlabs`, và `microsoft` sở hữu các triển khai tổng hợp
- `voice-call` tiêu thụ trợ giúp runtime TTS điện thoại

Mẫu đó nên được ưu tiên cho các khả năng trong tương lai.

### Ví dụ plugin công ty đa khả năng

Một plugin công ty nên cảm thấy gắn kết từ bên ngoài. Nếu OpenClaw có các hợp đồng chia sẻ cho mô hình, giọng nói, hiểu biết truyền thông, và tìm kiếm web, một nhà cung cấp có thể sở hữu tất cả các bề mặt của mình ở một nơi:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk";
import {
  buildOpenAISpeechProvider,
  createPluginBackedWebSearchProvider,
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider(
      buildOpenAISpeechProvider({
        id: "exampleai",
        // vendor speech config
      }),
    );

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

Điều quan trọng không phải là tên trợ giúp chính xác. Hình dạng quan trọng:

- một plugin sở hữu bề mặt nhà cung cấp
- lõi vẫn sở hữu các hợp đồng khả năng
- các plugin kênh và tính năng tiêu thụ `api.runtime.*` trợ giúp, không phải mã nhà cung cấp
- các bài kiểm tra hợp đồng có thể khẳng định rằng plugin đã đăng ký các khả năng mà nó tuyên bố sở hữu

### Ví dụ khả năng: hiểu biết video

OpenClaw đã coi hiểu biết hình ảnh/âm thanh/video là một khả năng chia sẻ. Mô hình quyền sở hữu tương tự áp dụng ở đó:

1. lõi định nghĩa hợp đồng hiểu biết truyền thông
2. các plugin nhà cung cấp đăng ký `describeImage`, `transcribeAudio`, và
   `describeVideo` khi áp dụng
3. các plugin kênh và tính năng tiêu thụ hành vi lõi chia sẻ thay vì dây nối trực tiếp vào mã nhà cung cấp

Điều đó tránh việc mã hóa cứng các giả định video của một nhà cung cấp vào lõi. Plugin sở hữu bề mặt nhà cung cấp; lõi sở hữu hợp đồng khả năng và hành vi dự phòng.

Nếu OpenClaw thêm một miền mới sau này, chẳng hạn như tạo video, hãy sử dụng lại trình tự tương tự: định nghĩa khả năng lõi trước, sau đó để các plugin nhà cung cấp đăng ký triển khai chống lại nó.

Cần một danh sách kiểm tra triển khai cụ thể? Xem
[Capability Cookbook](/tools/capability-cookbook).

## Hợp đồng và thực thi

Bề mặt API plugin được gõ và tập trung trong `OpenClawPluginApi`. Hợp đồng đó định nghĩa các điểm đăng ký được hỗ trợ và các trợ giúp runtime mà một plugin có thể dựa vào.

Tại sao điều này quan trọng:

- tác giả plugin có một tiêu chuẩn nội bộ ổn định
- lõi có thể từ chối quyền sở hữu trùng lặp như hai plugin đăng ký cùng một id provider
- khởi động có thể hiển thị chẩn đoán có thể hành động cho đăng ký không đúng định dạng
- các bài kiểm tra hợp đồng có thể thực thi quyền sở hữu plugin bundled và ngăn chặn sự trôi dạt im lặng

Có hai lớp thực thi:

1. **thực thi đăng ký runtime**
   Registry plugin xác thực các đăng ký khi plugin tải. Ví dụ: id provider trùng lặp, id provider giọng nói trùng lặp, và đăng ký không đúng định dạng tạo ra chẩn đoán plugin thay vì hành vi không xác định.
2. **bài kiểm tra hợp đồng**
   Các plugin bundled được ghi lại trong các registry hợp đồng trong quá trình chạy thử nghiệm để OpenClaw có thể khẳng định quyền sở hữu một cách rõ ràng. Ngày nay điều này được sử dụng cho các model provider, speech provider, web search provider, và quyền sở hữu đăng ký bundled.

Hiệu ứng thực tế là OpenClaw biết, ngay từ đầu, plugin nào sở hữu bề mặt nào. Điều đó cho phép lõi và các kênh kết hợp liền mạch vì quyền sở hữu được tuyên bố, có gõ, và có thể kiểm tra thay vì ngầm định.

### Những gì thuộc về một hợp đồng

Hợp đồng plugin tốt là:

- có gõ
- nhỏ
- cụ thể cho khả năng
- thuộc sở hữu của lõi
- có thể tái sử dụng bởi nhiều plugin
- có thể tiêu thụ bởi các kênh/tính năng mà không cần kiến thức về nhà cung cấp

Hợp đồng plugin xấu là:

- chính sách cụ thể cho nhà cung cấp ẩn trong lõi
- lối thoát plugin một lần bỏ qua registry
- mã kênh truy cập thẳng vào triển khai nhà cung cấp
- đối tượng runtime ngẫu nhiên không phải là một phần của `OpenClawPluginApi` hoặc `api.runtime`

Khi nghi ngờ, nâng cao mức độ trừu tượng: định nghĩa khả năng trước, sau đó để plugin cắm vào nó.

## Mô hình thực thi

Các plugin OpenClaw gốc chạy **trong quá trình** với Gateway. Chúng không bị sandbox. Một plugin gốc đã tải có cùng ranh giới tin cậy cấp quy trình như mã lõi.

Hệ quả:

- một plugin gốc có thể đăng ký công cụ, bộ xử lý mạng, hook, và dịch vụ
- lỗi plugin gốc có thể làm sập hoặc làm mất ổn định gateway
- một plugin gốc độc hại tương đương với thực thi mã tùy ý bên trong quá trình OpenClaw

Các bundle tương thích an toàn hơn theo mặc định vì OpenClaw hiện coi chúng là các gói metadata/nội dung. Trong các bản phát hành hiện tại, điều đó chủ yếu có nghĩa là các kỹ năng bundled.

Sử dụng danh sách cho phép và các đường dẫn cài đặt/tải rõ ràng cho các plugin không bundled. Xem các plugin workspace như mã thời gian phát triển, không phải mặc định sản xuất.

Lưu ý tin cậy quan trọng:

- `plugins.allow` tin cậy **id plugin**, không phải nguồn gốc.
- Một plugin workspace có cùng id với một plugin bundled cố ý che bóng bản sao bundled khi plugin workspace đó được kích hoạt/cho phép.
- Điều này là bình thường và hữu ích cho phát triển cục bộ, kiểm tra bản vá, và sửa lỗi nóng.

## Ranh giới xuất

OpenClaw xuất các khả năng, không phải sự tiện lợi triển khai.

Giữ đăng ký khả năng công khai. Cắt giảm các trợ giúp xuất không phải hợp đồng:

- các subpath trợ giúp cụ thể cho plugin bundled
- các subpath ống dẫn runtime không được dự định là API công khai
- các trợ giúp tiện lợi cụ thể cho nhà cung cấp
- các trợ giúp thiết lập/khởi động là chi tiết triển khai

## Quy trình tải

Khi khởi động, OpenClaw thực hiện đại khái như sau:

1. khám phá các gốc plugin ứng viên
2. đọc các manifest bundle gốc hoặc tương thích và metadata gói
3. từ chối các ứng viên không an toàn
4. chuẩn hóa cấu hình plugin (`plugins.enabled`, `allow`, `deny`, `entries`, `slots`, `load.paths`)
5. quyết định kích hoạt cho mỗi ứng viên
6. tải các module gốc đã kích hoạt thông qua jiti
7. gọi các hook `register(api)` gốc và thu thập các đăng ký vào registry plugin
8. phơi bày registry cho các lệnh/bề mặt runtime

Các cổng an toàn xảy ra **trước** khi thực thi runtime. Các ứng viên bị chặn khi mục thoát khỏi gốc plugin, đường dẫn có thể ghi toàn cầu, hoặc quyền sở hữu đường dẫn trông đáng ngờ đối với các plugin không bundled.

### Hành vi ưu tiên manifest

Manifest là nguồn sự thật của mặt phẳng điều khiển. OpenClaw sử dụng nó để:

- xác định plugin
- khám phá các kênh/kỹ năng/schema cấu hình đã khai báo hoặc khả năng bundle
- xác thực `plugins.entries.<id>.config`
- tăng cường nhãn/placeholder UI điều khiển
- hiển thị metadata cài đặt/danh mục

Đối với các plugin gốc, module runtime là phần mặt phẳng dữ liệu. Nó đăng ký hành vi thực tế như hook, công cụ, lệnh, hoặc luồng provider.

### Những gì bộ tải cache

OpenClaw giữ các cache ngắn trong quá trình cho:

- kết quả khám phá
- dữ liệu registry manifest
- các registry plugin đã tải

Các cache này giảm bớt khởi động đột ngột và chi phí lệnh lặp lại. Chúng an toàn để nghĩ như các cache hiệu suất ngắn hạn, không phải là sự tồn tại.

Lưu ý hiệu suất:

- Đặt `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` hoặc
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` để vô hiệu hóa các cache này.
- Điều chỉnh cửa sổ cache với `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` và
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Mô hình registry

Các plugin đã tải không trực tiếp thay đổi ngẫu nhiên các global lõi. Chúng đăng ký vào một registry plugin trung tâm.

Registry theo dõi:

- bản ghi plugin (danh tính, nguồn, nguồn gốc, trạng thái, chẩn đoán)
- công cụ
- hook cũ và hook đã gõ
- kênh
- provider
- bộ xử lý RPC gateway
- tuyến HTTP
- người đăng ký CLI
- dịch vụ nền
- lệnh thuộc sở hữu plugin

Các tính năng lõi sau đó đọc từ registry thay vì nói chuyện trực tiếp với các module plugin. Điều này giữ cho việc tải một chiều:

- module plugin -> đăng ký registry
- runtime lõi -> tiêu thụ registry

Sự tách biệt đó quan trọng cho khả năng bảo trì. Nó có nghĩa là hầu hết các bề mặt lõi chỉ cần một điểm tích hợp: "đọc registry", không phải "trường hợp đặc biệt cho mỗi module plugin".

## Callback ràng buộc cuộc trò chuyện

Các plugin ràng buộc một cuộc trò chuyện có thể phản ứng khi một phê duyệt được giải quyết.

Sử dụng `api.onConversationBindingResolved(...)` để nhận một callback sau khi một yêu cầu ràng buộc được phê duyệt hoặc từ chối:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Một ràng buộc hiện tồn tại cho plugin này + cuộc trò chuyện.
        console.log(event.binding?.conversationId);
        return;
      }

      // Yêu cầu đã bị từ chối; xóa bất kỳ trạng thái chờ cục bộ nào.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Các trường payload callback:

- `status`: `"approved"` hoặc `"denied"`
- `decision`: `"allow-once"`, `"allow-always"`, hoặc `"deny"`
- `binding`: ràng buộc đã được giải quyết cho các yêu cầu được phê duyệt
- `request`: tóm tắt yêu cầu ban đầu, gợi ý tách rời, id người gửi, và metadata cuộc trò chuyện

Callback này chỉ là thông báo. Nó không thay đổi ai được phép ràng buộc một cuộc trò chuyện, và nó chạy sau khi xử lý phê duyệt lõi hoàn tất.

## Hook runtime của provider

Các plugin provider hiện có hai lớp:

- metadata manifest: `providerAuthEnvVars` cho tra cứu xác thực môi trường rẻ trước khi tải runtime, cộng với `providerAuthChoices` cho nhãn lựa chọn xác thực/khởi động rẻ và metadata cờ CLI trước khi tải runtime
- hook thời gian cấu hình: `catalog` / `discovery` cũ
- hook runtime: `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`, `capabilities`, `prepareExtraParams`, `wrapStreamFn`, `formatApiKey`, `refreshOAuth`, `buildAuthDoctorHint`, `isCacheTtlEligible`, `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`, `isBinaryThinking`, `supportsXHighThinking`, `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot`

OpenClaw vẫn sở hữu vòng lặp agent chung, dự phòng, xử lý bản ghi, và chính sách công cụ. Các hook này là bề mặt mở rộng cho hành vi cụ thể của provider mà không cần một phương tiện suy luận tùy chỉnh hoàn toàn.

Sử dụng manifest `providerAuthEnvVars` khi provider có thông tin xác thực dựa trên môi trường mà các đường dẫn xác thực/trạng thái/chọn mô hình chung nên thấy mà không cần tải runtime plugin. Sử dụng manifest `providerAuthChoices` khi các bề mặt CLI lựa chọn xác thực/khởi động nên biết id lựa chọn của provider, nhãn nhóm, và dây nối xác thực một cờ đơn giản mà không cần tải runtime provider. Giữ `envVars` runtime provider cho các gợi ý hướng tới nhà điều hành như nhãn khởi động hoặc biến thiết lập client-id/client-secret OAuth.

### Thứ tự hook và sử dụng

Đối với các plugin model/provider, OpenClaw gọi các hook theo thứ tự đại khái này.
Cột "Khi nào sử dụng" là hướng dẫn quyết định nhanh.

| #   | Hook                          | Nó làm gì                                                                             | Khi nào sử dụng                                                                          |
| --- | ----------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1   | `catalog`                     | Xuất bản cấu hình provider vào `models.providers` trong quá trình tạo `models.json`          | Provider sở hữu một danh mục hoặc mặc định URL cơ sở                                         |
| --  | _(tra cứu mô hình tích hợp)_     | OpenClaw thử đường dẫn registry/danh mục bình thường trước                                    | _(không phải là một hook plugin)_                                                                |
| 2   | `resolveDynamicModel`         | Dự phòng đồng bộ cho các id mô hình thuộc sở hữu provider chưa có trong registry cục bộ                 | Provider chấp nhận các id mô hình upstream tùy ý                                        |
| 3   | `prepareDynamicModel`         | Khởi động không đồng bộ, sau đó `resolveDynamicModel` chạy lại                                     | Provider cần metadata mạng trước khi giải quyết các id không xác định                         |
| 4   | `normalizeResolvedModel`      | Viết lại cuối cùng trước khi runner nhúng sử dụng mô hình đã giải quyết                         | Provider cần viết lại phương tiện nhưng vẫn sử dụng một phương tiện lõi                    |
| 5   | `capabilities`                | Metadata bản ghi/công cụ thuộc sở hữu provider được sử dụng bởi logic lõi chia sẻ                     | Provider cần các quirks bản ghi/gia đình provider                                     |
| 6   | `prepareExtraParams`          | Bình thường hóa tham số yêu cầu trước khi áp dụng các tùy chọn luồng chung                        | Provider cần các tham số yêu cầu mặc định hoặc dọn dẹp tham số theo provider                  |
| 7   | `wrapStreamFn`                | Bộ bao luồng sau khi các bộ bao chung được áp dụng                                        | Provider cần các tiêu đề yêu cầu/bộ tương thích mô hình mà không cần một phương tiện tùy chỉnh |
| 8   | `formatApiKey`                | Bộ định dạng hồ sơ xác thực: hồ sơ lưu trữ trở thành chuỗi `apiKey` runtime               | Provider lưu trữ metadata xác thực bổ sung và cần một hình dạng token runtime tùy chỉnh           |
| 9   | `refreshOAuth`                | Ghi đè làm mới OAuth cho các điểm cuối làm mới tùy chỉnh hoặc chính sách thất bại làm mới            | Provider không phù hợp với các bộ làm mới `pi-ai` chia sẻ                                  |
| 10  | `buildAuthDoctorHint`         | Gợi ý sửa chữa được thêm vào khi làm mới OAuth thất bại                                            | Provider cần hướng dẫn sửa chữa xác thực thuộc sở hữu provider sau khi thất bại làm mới             |
| 11  | `isCacheTtlEligible`          | Chính sách cache prompt cho các provider proxy/backhaul                                         | Provider cần điều chỉnh TTL cache cụ thể cho proxy                                       |
| 12  | `buildMissingAuthMessage`     | Thay thế cho thông báo khôi phục xác thực thiếu chung                                | Provider cần một gợi ý khôi phục xác thực thiếu cụ thể cho provider                        |
| 13  | `suppressBuiltInModel`        | Đàn áp mô hình upstream cũ cộng với gợi ý lỗi hướng tới người dùng tùy chọn                    | Provider cần ẩn các hàng upstream cũ hoặc thay thế chúng bằng một gợi ý nhà cung cấp        |
| 14  | `augmentModelCatalog`         | Các hàng danh mục tổng hợp/cuối cùng được thêm vào sau khi khám phá                                    | Provider cần các hàng tổng hợp tương thích về phía trước trong `models list` và các bộ chọn            |
| 15  | `isBinaryThinking`            | Chuyển đổi lý luận bật/tắt cho các provider suy nghĩ nhị phân                                    | Provider chỉ phơi bày suy nghĩ nhị phân bật/tắt                                         |
| 16  | `supportsXHighThinking`       | Hỗ trợ lý luận `xhigh` cho các mô hình được chọn                                            | Provider muốn `xhigh` chỉ trên một tập hợp con của các mô hình                                    |
| 17  | `resolveDefaultThinkingLevel` | Mức `/think` mặc định cho một gia đình mô hình cụ thể                                       | Provider sở hữu chính sách `/think` mặc định cho một gia đình mô hình                             |
| 18  | `isModernModelRef`            | Bộ lọc hồ sơ trực tiếp và lựa chọn khói cho bộ so khớp mô hình hiện đại                        | Provider sở hữu so khớp mô hình hiện đại/khói ưu tiên                                    |
| 19  | `prepareRuntimeAuth`          | Trao đổi thông tin xác thực đã cấu hình thành token/khóa runtime thực tế ngay trước khi suy luận | Provider cần trao đổi token hoặc thông tin xác thực yêu cầu ngắn hạn                    |
| 20  | `resolveUsageAuth`            | Giải quyết thông tin xác thực sử dụng/thanh toán cho `/usage` và các bề mặt trạng thái liên quan               | Provider cần phân tích token sử dụng/quota tùy chỉnh hoặc thông tin xác thực sử dụng khác      |
| 21  | `fetchUsageSnapshot`          | Lấy và bình thường hóa các snapshot sử dụng/quota cụ thể cho provider sau khi xác thực được giải quyết       | Provider cần một điểm cuối sử dụng cụ thể cho provider hoặc trình phân tích payload                  |

Nếu provider cần một giao thức dây tùy chỉnh hoàn toàn hoặc bộ thực thi yêu cầu tùy chỉnh, đó là một lớp mở rộng khác. Các hook này dành cho hành vi provider vẫn chạy trên vòng lặp suy luận bình thường của OpenClaw.

### Ví dụ provider

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### Ví dụ tích hợp

- Anthropic sử dụng `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `resolveDefaultThinkingLevel`, và `isModernModelRef` vì nó sở hữu Claude
  4.6 tương thích về phía trước, gợi ý gia đình provider, hướng dẫn sửa chữa xác thực, tích hợp điểm cuối sử dụng, đủ điều kiện cache prompt, và chính sách suy nghĩ mặc định/thích ứng Claude.
- OpenAI sử dụng `resolveDynamicModel`, `normalizeResolvedModel`, và
  `capabilities` cộng với `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking`, và `isModernModelRef`
  vì nó sở hữu GPT-5.4 tương thích về phía trước, chuẩn hóa trực tiếp OpenAI
  `openai-completions` -> `openai-responses`, gợi ý xác thực Codex-aware, đàn áp Spark, hàng danh mục tổng hợp OpenAI, và chính sách suy nghĩ GPT-5 /
  mô hình trực tiếp.
- OpenRouter sử dụng `catalog` cộng với `resolveDynamicModel` và
  `prepareDynamicModel` vì provider là pass-through và có thể phơi bày các id mô hình mới trước khi cập nhật danh mục tĩnh của OpenClaw; nó cũng sử dụng
  `capabilities`, `wrapStreamFn`, và `isCacheTtlEligible` để giữ
  tiêu đề yêu cầu cụ thể cho provider, metadata định tuyến, bản vá lý luận, và
  chính sách cache prompt ra khỏi lõi.
- GitHub Copilot sử dụng `catalog`, `auth`, `resolveDynamicModel`, và
  `capabilities` cộng với `prepareRuntimeAuth` và `fetchUsageSnapshot` vì nó
  cần đăng nhập thiết bị thuộc sở hữu provider, hành vi dự phòng mô hình, quirks bản ghi Claude,
  trao đổi token GitHub -> Copilot, và một điểm cuối sử dụng thuộc sở hữu provider.
- OpenAI Codex sử dụng `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth`, và `augmentModelCatalog` cộng
  với `prepareExtraParams`, `resolveUsageAuth`, và `fetchUsageSnapshot` vì nó
  vẫn chạy trên các phương tiện OpenAI lõi nhưng sở hữu chuẩn hóa phương tiện/URL cơ sở của nó,
  chính sách dự phòng làm mới OAuth, lựa chọn phương tiện mặc định,
  hàng danh mục Codex tổng hợp, và tích hợp điểm cuối sử dụng ChatGPT.
- Google AI Studio và Gemini CLI OAuth sử dụng `resolveDynamicModel` và
  `isModernModelRef` vì họ sở hữu Gemini 3.1 tương thích về phía trước và
  so khớp mô hình hiện đại; Gemini CLI OAuth cũng sử dụng `formatApiKey`,
  `resolveUsageAuth`, và `fetchUsageSnapshot` cho định dạng token, phân tích token,
  và dây nối điểm cuối quota.
- Moonshot sử dụng `catalog` cộng với `wrapStreamFn` vì nó vẫn sử dụng phương tiện OpenAI chia sẻ
  nhưng cần bình thường hóa payload suy nghĩ thuộc sở hữu provider.
- Kilocode sử dụng `catalog`, `capabilities`, `wrapStreamFn`, và
  `isCacheTtlEligible` vì nó cần tiêu đề yêu cầu thuộc sở hữu provider,
  bình thường hóa payload lý luận, gợi ý bản ghi Gemini, và điều chỉnh TTL cache Anthropic.
- Z.AI sử dụng `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth`, và `fetchUsageSnapshot` vì nó sở hữu GLM-5 dự phòng,
  mặc định `tool_stream`, UX suy nghĩ nhị phân, so khớp mô hình hiện đại, và cả
  thông tin xác thực sử dụng + lấy quota.
- Mistral, OpenCode Zen, và OpenCode Go chỉ sử dụng `capabilities` để giữ
  quirks bản ghi/công cụ ra khỏi lõi.
- Các provider bundled chỉ có danh mục như `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `modelstudio`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway`, và `volcengine` chỉ sử dụng
  `catalog`.
- Cổng Qwen sử dụng `catalog`, `auth`, và `refreshOAuth`.
- MiniMax và Xiaomi sử dụng `catalog` cộng với các hook sử dụng vì hành vi `/usage`
  của họ thuộc sở hữu plugin mặc dù suy luận vẫn chạy qua các phương tiện chia sẻ.

## Trợ giúp runtime

Các plugin có thể truy cập các trợ giúp lõi đã chọn thông qua `api.runtime`. Đối với TTS:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Ghi chú:

- `textToSpeech` trả về payload đầu ra TTS lõi bình thường cho các bề mặt file/voice-note.
- Sử dụng cấu hình `messages.tts` lõi và lựa chọn provider.
- Trả về bộ đệm âm thanh PCM + tỷ lệ mẫu. Các plugin phải tái mẫu/mã hóa cho các provider.
- `listVoices` là tùy chọn cho mỗi provider. Sử dụng nó cho các bộ chọn giọng nói thuộc sở hữu nhà cung cấp hoặc các luồng thiết lập.
- Danh sách giọng nói có thể bao gồm metadata phong phú hơn như ngôn ngữ, giới tính, và thẻ cá nhân cho các bộ chọn nhận thức nhà cung cấp.
- OpenAI và ElevenLabs hỗ trợ điện thoại hôm nay. Microsoft thì không.

Các plugin cũng có thể đăng ký các provider giọng nói thông qua `api.registerSpeechProvider(...)`.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

Ghi chú:

- Giữ chính sách TTS, dự phòng, và phân phối trả lời trong lõi.
- Sử dụng các provider giọng nói cho hành vi tổng hợp thuộc sở hữu nhà cung cấp.
- Đầu vào Microsoft `edge` cũ được bình thường hóa thành id provider `microsoft`.
- Mô hình quyền sở hữu ưu tiên là hướng tới công ty: một plugin nhà cung cấp có thể sở hữu
  văn bản, giọng nói, hình ảnh, và các provider truyền thông trong tương lai khi OpenClaw thêm các
  hợp đồng khả năng đó.

Đối với hiểu biết hình ảnh/âm thanh/video, các plugin đăng ký một provider
hiểu biết truyền thông đã gõ thay vì một túi khóa/giá trị chung:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Ghi chú:

- Giữ điều phối, dự phòng, cấu hình, và dây nối kênh trong lõi.
- Giữ hành vi nhà cung cấp trong plugin provider.
- Mở rộng bổ sung nên giữ có gõ: phương thức tùy chọn mới, trường kết quả tùy chọn mới, khả năng tùy chọn mới.
- Nếu OpenClaw thêm một khả năng mới như tạo video sau này, định nghĩa
  hợp đồng khả năng lõi trước, sau đó để các plugin nhà cung cấp đăng ký chống lại nó.

Đối với các trợ giúp runtime hiểu biết truyền thông, các plugin có thể gọi:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

Đối với chuyển đổi âm thanh, các plugin có thể sử dụng runtime hiểu biết truyền thông hoặc
bí danh STT cũ:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Tùy chọn khi MIME không thể suy ra một cách đáng tin cậy:
  mime: "audio/ogg",
});
```

Ghi chú:

- `api.runtime.mediaUnderstanding.*` là bề mặt chia sẻ ưu tiên cho
  hiểu biết hình ảnh/âm thanh/video.
- Sử dụng cấu hình âm thanh hiểu biết truyền thông lõi (`tools.media.audio`) và thứ tự dự phòng provider.
- Trả về `{ text: undefined }` khi không có đầu ra chuyển đổi nào được tạo ra (ví dụ như đầu vào bị bỏ qua/không được hỗ trợ).
- `api.runtime.stt.transcribeAudioFile(...)` vẫn còn như một bí danh tương thích.

Các plugin cũng có thể khởi chạy các lần chạy subagent nền thông qua `api.runtime.subagent`:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Mở rộng truy vấn này thành các tìm kiếm tiếp theo tập trung.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Ghi chú:

- `provider` và `model` là các ghi đè tùy chọn cho mỗi lần chạy, không phải là các thay đổi phiên liên tục.
- OpenClaw chỉ tôn trọng các trường ghi đè đó cho các người gọi đáng tin cậy.
- Đối với các lần chạy dự phòng thuộc sở hữu plugin, các nhà điều hành phải chọn tham gia với `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Sử dụng `plugins.entries.<id>.subagent.allowedModels` để hạn chế các plugin đáng tin cậy đến các mục tiêu `provider/model` chính thức cụ thể, hoặc `"*"` để cho phép bất kỳ mục tiêu nào một cách rõ ràng.
- Các lần chạy subagent plugin không đáng tin cậy vẫn hoạt động, nhưng các yêu cầu ghi đè bị từ chối thay vì âm thầm quay lại.

Đối với tìm kiếm web, các plugin có thể tiêu thụ trợ giúp runtime chia sẻ thay vì
truy cập vào dây nối công cụ agent:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "Trợ giúp runtime plugin OpenClaw",
    count: 5,
  },
});
```

Các plugin cũng có thể đăng ký các provider tìm kiếm web thông qua
`api.registerWebSearchProvider(...)`.

Ghi chú:

- Giữ lựa chọn provider, giải quyết thông tin xác thực, và ngữ nghĩa yêu cầu chia sẻ trong lõi.
- Sử dụng các provider tìm kiếm web cho các phương tiện tìm kiếm cụ thể cho nhà cung cấp.
- `api.runtime.webSearch.*` là bề mặt chia sẻ ưu tiên cho các plugin tính năng/kênh cần hành vi tìm kiếm mà không phụ thuộc vào bộ bao công cụ agent.

## Tuyến HTTP Gateway

Các plugin có thể phơi bày các điểm cuối HTTP với `api.registerHttpRoute(...)`.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Các trường tuyến:

- `path`: đường dẫn tuyến dưới máy chủ HTTP gateway.
- `auth`: bắt buộc. Sử dụng `"gateway"` để yêu cầu xác thực gateway bình thường, hoặc `"plugin"` cho xác thực/quá trình xác minh webhook do plugin quản lý.
- `match`: tùy chọn. `"exact"` (mặc định) hoặc `"prefix"`.
- `replaceExisting`: tùy chọn. Cho phép cùng một plugin thay thế đăng ký tuyến hiện có của chính nó.
- `handler`: trả về `true` khi tuyến đã xử lý yêu cầu.

Ghi chú:

- `api.registerHttpHandler(...)` đã lỗi thời. Sử dụng `api.registerHttpRoute(...)`.
- Các tuyến plugin phải khai báo `auth` một cách rõ ràng.
- Các xung đột `path + match` chính xác bị từ chối trừ khi `replaceExisting: true`, và một plugin không thể thay thế tuyến của plugin khác.
- Các tuyến chồng chéo với các mức `auth` khác nhau bị từ chối. Giữ các chuỗi rơi qua `exact`/`prefix` trên cùng một mức xác thực chỉ.

## Đường dẫn import Plugin SDK

Khi viết plugin, hãy sử dụng các subpath của SDK thay vì import toàn bộ từ `openclaw/plugin-sdk`:

- `openclaw/plugin-sdk/plugin-entry` để đăng ký plugin.
- `openclaw/plugin-sdk/core` cho các hợp đồng chung mà plugin có thể sử dụng.
- Các thành phần ổn định như `openclaw/plugin-sdk/channel-setup`, `openclaw/plugin-sdk/channel-pairing`, `openclaw/plugin-sdk/channel-contract`, `openclaw/plugin-sdk/channel-feedback`, `openclaw/plugin-sdk/channel-inbound`, `openclaw/plugin-sdk/channel-lifecycle`, `openclaw/plugin-sdk/channel-reply-pipeline`, `openclaw/plugin-sdk/command-auth`, `openclaw/plugin-sdk/secret-input`, và `openclaw/plugin-sdk/webhook-ingress` để thiết lập, xác thực, phản hồi, và kết nối webhook. `channel-inbound` là nơi chứa các công cụ như debounce, khớp mention, định dạng phong bì, và trợ giúp ngữ cảnh phong bì inbound.
- Các subpath theo domain như `openclaw/plugin-sdk/channel-config-helpers`, `openclaw/plugin-sdk/allow-from`, `openclaw/plugin-sdk/channel-config-schema`, `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/config-runtime`, `openclaw/plugin-sdk/infra-runtime`, `openclaw/plugin-sdk/agent-runtime`, `openclaw/plugin-sdk/lazy-runtime`, `openclaw/plugin-sdk/reply-history`, `openclaw/plugin-sdk/routing`, `openclaw/plugin-sdk/status-helpers`, `openclaw/plugin-sdk/runtime-store`, và `openclaw/plugin-sdk/directory-runtime` cho các trợ giúp runtime/config chung.
- `openclaw/plugin-sdk/channel-runtime` chỉ còn lại như một lớp tương thích. Mã mới nên import các thành phần hẹp hơn.
- Các phần mở rộng nội bộ được đóng gói vẫn là riêng tư. Plugin bên ngoài chỉ nên sử dụng các subpath `openclaw/plugin-sdk/*`. Mã lõi/test của OpenClaw có thể sử dụng các điểm vào công khai của repo dưới `extensions/<id>/index.js`, `api.js`, `runtime-api.js`, `setup-entry.js`, và các file có phạm vi hẹp như `login-qr-api.js`. Không bao giờ import `extensions/<id>/src/*` từ lõi hoặc từ một phần mở rộng khác.
- Phân chia điểm vào repo:
  - `extensions/<id>/api.js` là nơi chứa các helper/types,
  - `extensions/<id>/runtime-api.js` là nơi chứa runtime-only,
  - `extensions/<id>/index.js` là điểm vào plugin được đóng gói,
  - `extensions/<id>/setup-entry.js` là điểm vào plugin setup.
- Không còn subpath công khai nào được gắn thương hiệu kênh. Các helper và runtime cụ thể của kênh nằm dưới `extensions/<id>/api.js` và `extensions/<id>/runtime-api.js`; hợp đồng SDK công khai là các thành phần chung được chia sẻ.

Lưu ý về tương thích:

- Tránh sử dụng root `openclaw/plugin-sdk` cho mã mới.
- Ưu tiên các thành phần hẹp và ổn định trước. Các subpath mới hơn như setup/pairing/reply/feedback/contract/inbound/threading/command/secret-input/webhook/infra/allowlist/status/message-tool là hợp đồng dự định cho công việc plugin mới được đóng gói và bên ngoài.
- Các helper cụ thể cho phần mở rộng được đóng gói không ổn định theo mặc định. Nếu một helper chỉ cần thiết cho một phần mở rộng được đóng gói, hãy giữ nó sau seam `api.js` hoặc `runtime-api.js` của phần mở rộng thay vì đưa nó vào `openclaw/plugin-sdk/<extension>`.
- Các thanh được gắn thương hiệu kênh được đóng gói vẫn là riêng tư trừ khi chúng được thêm lại vào hợp đồng công khai.
- Các subpath cụ thể về khả năng như `image-generation`, `media-understanding`, và `speech` tồn tại vì các plugin được đóng gói/native sử dụng chúng hiện nay. Sự hiện diện của chúng không tự động có nghĩa là mọi helper được xuất ra đều là một hợp đồng bên ngoài đóng băng lâu dài.

## Sơ đồ công cụ tin nhắn

Plugin nên sở hữu các đóng góp schema `describeMessageTool(...)` cụ thể cho kênh. Giữ các trường cụ thể của nhà cung cấp trong plugin, không phải trong lõi chia sẻ.

Đối với các đoạn schema có thể chia sẻ, sử dụng lại các helper chung được xuất qua `openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` cho các payload kiểu lưới nút
- `createMessageToolCardSchema()` cho các payload thẻ có cấu trúc

Nếu một hình dạng schema chỉ có ý nghĩa cho một nhà cung cấp, hãy định nghĩa nó trong nguồn của plugin đó thay vì đưa nó vào SDK chia sẻ.

## Giải quyết mục tiêu kênh

Plugin kênh nên sở hữu các ngữ nghĩa mục tiêu cụ thể cho kênh. Giữ host outbound chung và sử dụng bề mặt adapter nhắn tin cho các quy tắc của nhà cung cấp:

- `messaging.inferTargetChatType({ to })` quyết định liệu một mục tiêu đã được chuẩn hóa nên được coi là `direct`, `group`, hay `channel` trước khi tra cứu thư mục.
- `messaging.targetResolver.looksLikeId(raw, normalized)` cho lõi biết liệu một đầu vào nên bỏ qua trực tiếp đến giải quyết giống id thay vì tìm kiếm thư mục.
- `messaging.targetResolver.resolveTarget(...)` là phương án dự phòng của plugin khi lõi cần một giải quyết cuối cùng do nhà cung cấp sở hữu sau khi chuẩn hóa hoặc sau khi bỏ lỡ thư mục.
- `messaging.resolveOutboundSessionRoute(...)` sở hữu việc xây dựng tuyến đường phiên cụ thể của nhà cung cấp khi một mục tiêu đã được giải quyết.

Phân chia đề xuất:

- Sử dụng `inferTargetChatType` cho các quyết định phân loại nên xảy ra trước khi tìm kiếm đồng nghiệp/nhóm.
- Sử dụng `looksLikeId` cho các kiểm tra "xem đây như một id mục tiêu rõ ràng/native".
- Sử dụng `resolveTarget` cho phương án dự phòng chuẩn hóa cụ thể của nhà cung cấp, không phải cho tìm kiếm thư mục rộng.
- Giữ các id native của nhà cung cấp như chat ids, thread ids, JIDs, handles, và room ids bên trong các giá trị `target` hoặc các tham số cụ thể của nhà cung cấp, không phải trong các trường SDK chung.

## Thư mục dựa trên cấu hình

Các plugin tạo ra các mục thư mục từ cấu hình nên giữ logic đó trong plugin và sử dụng lại các helper chia sẻ từ `openclaw/plugin-sdk/directory-runtime`.

Sử dụng điều này khi một kênh cần các đồng nghiệp/nhóm dựa trên cấu hình như:

- các đồng nghiệp DM dựa trên danh sách cho phép
- các bản đồ kênh/nhóm được cấu hình
- các phương án dự phòng thư mục tĩnh theo tài khoản

Các helper chia sẻ trong `directory-runtime` chỉ xử lý các hoạt động chung:

- lọc truy vấn
- áp dụng giới hạn
- trợ giúp loại bỏ/chuẩn hóa
- xây dựng `ChannelDirectoryEntry[]`

Kiểm tra tài khoản cụ thể của kênh và chuẩn hóa id nên giữ trong triển khai plugin.

## Danh mục nhà cung cấp

Plugin nhà cung cấp có thể định nghĩa các danh mục mô hình cho suy luận với `registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` trả về cùng một hình dạng mà OpenClaw ghi vào `models.providers`:

- `{ provider }` cho một mục nhà cung cấp
- `{ providers }` cho nhiều mục nhà cung cấp

Sử dụng `catalog` khi plugin sở hữu các id mô hình cụ thể của nhà cung cấp, các URL cơ sở mặc định, hoặc metadata mô hình được bảo vệ bởi xác thực.

`catalog.order` kiểm soát khi nào danh mục của plugin hợp nhất so với các nhà cung cấp ngầm định của OpenClaw:

- `simple`: các nhà cung cấp dựa trên API-key hoặc môi trường đơn giản
- `profile`: các nhà cung cấp xuất hiện khi có hồ sơ xác thực
- `paired`: các nhà cung cấp tổng hợp nhiều mục nhà cung cấp liên quan
- `late`: lượt cuối cùng, sau các nhà cung cấp ngầm định khác

Các nhà cung cấp sau cùng sẽ thắng khi có xung đột khóa, vì vậy các plugin có thể cố ý ghi đè một mục nhà cung cấp tích hợp với cùng id nhà cung cấp.

Tương thích:

- `discovery` vẫn hoạt động như một bí danh cũ
- nếu cả `catalog` và `discovery` đều được đăng ký, OpenClaw sẽ sử dụng `catalog`

## Kiểm tra kênh chỉ đọc

Nếu plugin của bạn đăng ký một kênh, hãy ưu tiên triển khai `plugin.config.inspectAccount(cfg, accountId)` cùng với `resolveAccount(...)`.

Tại sao:

- `resolveAccount(...)` là đường dẫn runtime. Nó được phép giả định rằng các thông tin xác thực đã được vật chất hóa đầy đủ và có thể thất bại nhanh khi thiếu các bí mật cần thiết.
- Các đường dẫn lệnh chỉ đọc như `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, và các luồng sửa chữa doctor/config không nên cần vật chất hóa các thông tin xác thực runtime chỉ để mô tả cấu hình.

Hành vi `inspectAccount(...)` được khuyến nghị:

- Chỉ trả về trạng thái tài khoản mô tả.
- Bảo toàn `enabled` và `configured`.
- Bao gồm các trường nguồn/trạng thái thông tin xác thực khi có liên quan, chẳng hạn như:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Bạn không cần trả về các giá trị token thô chỉ để báo cáo tính khả dụng chỉ đọc. Trả về `tokenStatus: "available"` (và trường nguồn tương ứng) là đủ cho các lệnh kiểu trạng thái.
- Sử dụng `configured_unavailable` khi một thông tin xác thực được cấu hình qua SecretRef nhưng không khả dụng trong đường dẫn lệnh hiện tại.

Điều này cho phép các lệnh chỉ đọc báo cáo "đã cấu hình nhưng không khả dụng trong đường dẫn lệnh này" thay vì bị lỗi hoặc báo cáo sai rằng tài khoản chưa được cấu hình.

## Gói package

Một thư mục plugin có thể bao gồm một `package.json` với `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Mỗi mục trở thành một plugin. Nếu gói liệt kê nhiều phần mở rộng, id plugin sẽ trở thành `name/<fileBase>`.

Nếu plugin của bạn import các phụ thuộc npm, hãy cài đặt chúng trong thư mục đó để `node_modules` có sẵn (`npm install` / `pnpm install`).

Rào chắn bảo mật: mỗi mục `openclaw.extensions` phải ở trong thư mục plugin sau khi giải quyết symlink. Các mục thoát khỏi thư mục package sẽ bị từ chối.

Lưu ý bảo mật: `openclaw plugins install` cài đặt các phụ thuộc plugin với `npm install --ignore-scripts` (không có script vòng đời). Giữ cây phụ thuộc plugin "JS/TS thuần" và tránh các package yêu cầu xây dựng `postinstall`.

Tùy chọn: `openclaw.setupEntry` có thể trỏ đến một module chỉ dành cho setup nhẹ. Khi OpenClaw cần các bề mặt setup cho một plugin kênh bị vô hiệu hóa, hoặc khi một plugin kênh được kích hoạt nhưng vẫn chưa được cấu hình, nó tải `setupEntry` thay vì toàn bộ điểm vào plugin. Điều này giúp khởi động và setup nhẹ hơn khi điểm vào plugin chính của bạn cũng kết nối các công cụ, hook, hoặc mã chỉ dành cho runtime khác.

Tùy chọn: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` có thể cho phép một plugin kênh vào cùng đường dẫn `setupEntry` trong giai đoạn khởi động trước khi gateway bắt đầu lắng nghe, ngay cả khi kênh đã được cấu hình.

Chỉ sử dụng điều này khi `setupEntry` bao phủ đầy đủ bề mặt khởi động phải tồn tại trước khi gateway bắt đầu lắng nghe. Trong thực tế, điều đó có nghĩa là mục setup phải đăng ký mọi khả năng mà kênh sở hữu mà khởi động phụ thuộc vào, chẳng hạn như:

- đăng ký kênh tự nó
- bất kỳ tuyến HTTP nào phải có sẵn trước khi gateway bắt đầu lắng nghe
- bất kỳ phương thức, công cụ, hoặc dịch vụ gateway nào phải tồn tại trong cùng cửa sổ đó

Nếu mục nhập đầy đủ của bạn vẫn sở hữu bất kỳ khả năng khởi động cần thiết nào, đừng bật cờ này. Giữ plugin ở hành vi mặc định và để OpenClaw tải mục nhập đầy đủ trong quá trình khởi động.

Ví dụ:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Metadata danh mục kênh

Plugin kênh có thể quảng cáo metadata setup/discovery qua `openclaw.channel` và gợi ý cài đặt qua `openclaw.install`. Điều này giữ cho dữ liệu danh mục lõi không có dữ liệu.

Ví dụ:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "extensions/nextcloud-talk",
      "defaultChoice": "npm"
    }
  }
}
```

OpenClaw cũng có thể hợp nhất **danh mục kênh bên ngoài** (ví dụ, một xuất khẩu registry MPM). Thả một file JSON tại một trong các vị trí sau:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Hoặc trỏ `OPENCLAW_PLUGIN_CATALOG_PATHS` (hoặc `OPENCLAW_MPM_CATALOG_PATHS`) đến một hoặc nhiều file JSON (phân tách bằng dấu phẩy/chấm phẩy/`PATH`). Mỗi file nên chứa `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`.

## Plugin động cơ ngữ cảnh

Plugin động cơ ngữ cảnh sở hữu việc điều phối ngữ cảnh phiên cho việc nhập, lắp ráp, và nén. Đăng ký chúng từ plugin của bạn với `api.registerContextEngine(id, factory)`, sau đó chọn động cơ hoạt động với `plugins.slots.contextEngine`.

Sử dụng điều này khi plugin của bạn cần thay thế hoặc mở rộng pipeline ngữ cảnh mặc định thay vì chỉ thêm tìm kiếm bộ nhớ hoặc hook.

```ts
export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Nếu động cơ của bạn **không** sở hữu thuật toán nén, hãy giữ `compact()` được triển khai và ủy quyền nó một cách rõ ràng:

```ts
import { delegateCompactionToRuntime } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Thêm một khả năng mới

Khi một plugin cần hành vi không phù hợp với API hiện tại, đừng vượt qua hệ thống plugin với một truy cập riêng tư. Thêm khả năng còn thiếu.

Trình tự được khuyến nghị:

1. định nghĩa hợp đồng lõi
   Quyết định hành vi chia sẻ nào lõi nên sở hữu: chính sách, dự phòng, hợp nhất cấu hình, vòng đời, ngữ nghĩa đối mặt kênh, và hình dạng trợ giúp runtime.
2. thêm các bề mặt đăng ký/runtime plugin có kiểu
   Mở rộng `OpenClawPluginApi` và/hoặc `api.runtime` với bề mặt khả năng có kiểu nhỏ nhất hữu ích.
3. kết nối lõi + người tiêu dùng kênh/tính năng
   Các kênh và plugin tính năng nên tiêu thụ khả năng mới thông qua lõi, không phải bằng cách import một triển khai của nhà cung cấp trực tiếp.
4. đăng ký các triển khai của nhà cung cấp
   Các plugin của nhà cung cấp sau đó đăng ký backend của họ chống lại khả năng.
5. thêm phạm vi hợp đồng
   Thêm các bài kiểm tra để quyền sở hữu và hình dạng đăng ký vẫn rõ ràng theo thời gian.

Đây là cách OpenClaw giữ quan điểm mà không trở nên cứng nhắc với quan điểm của một nhà cung cấp. Xem [Capability Cookbook](/tools/capability-cookbook) để biết danh sách kiểm tra file cụ thể và ví dụ đã làm việc.

### Danh sách kiểm tra khả năng

Khi bạn thêm một khả năng mới, triển khai thường nên chạm vào các bề mặt này cùng nhau:

- các loại hợp đồng lõi trong `src/<capability>/types.ts`
- trợ giúp runtime/runner lõi trong `src/<capability>/runtime.ts`
- bề mặt đăng ký API plugin trong `src/plugins/types.ts`
- kết nối registry plugin trong `src/plugins/registry.ts`
- phơi bày runtime plugin trong `src/plugins/runtime/*` khi các plugin tính năng/kênh cần tiêu thụ nó
- trợ giúp kiểm tra/bắt giữ trong `src/test-utils/plugin-registration.ts`
- các khẳng định quyền sở hữu/hợp đồng trong `src/plugins/contracts/registry.ts`
- tài liệu operator/plugin trong `docs/`

Nếu một trong những bề mặt đó bị thiếu, đó thường là dấu hiệu khả năng chưa được tích hợp đầy đủ.

### Mẫu khả năng

Mẫu tối thiểu:

```ts
// hợp đồng lõi
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// API plugin
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// trợ giúp runtime chia sẻ cho plugin tính năng/kênh
const clip = await api.runtime.videoGeneration.generateFile({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Mẫu kiểm tra hợp đồng:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Điều đó giữ cho quy tắc đơn giản:

- lõi sở hữu hợp đồng khả năng + điều phối
- plugin của nhà cung cấp sở hữu các triển khai của nhà cung cấp
- plugin tính năng/kênh tiêu thụ các trợ giúp runtime
- các bài kiểm tra hợp đồng giữ quyền sở hữu rõ ràng

---
summary: "Nội dung bên trong Plugin: mô hình khả năng, quyền sở hữu, hợp đồng, pipeline tải, và trợ giúp runtime"
read_when:
  - Xây dựng hoặc debug plugin native OpenClaw
  - Hiểu mô hình khả năng plugin hoặc ranh giới quyền sở hữu
  - Làm việc trên pipeline tải plugin hoặc registry
  - Triển khai hooks runtime provider hoặc channel plugin
title: "Nội dung bên trong Plugin"
sidebarTitle: "Nội dung bên trong"
---

# Nội dung bên trong Plugin

<Info>
  Trang này dành cho **nhà phát triển và người đóng góp plugin**. Nếu chỉ muốn
  cài đặt và sử dụng plugin, xem [Plugins](/tools/plugin). Nếu muốn xây dựng
  plugin, xem [Building Plugins](/plugins/building-plugins).
</Info>

Trang này bao quát kiến trúc nội bộ của hệ thống plugin OpenClaw.

## Mô hình khả năng công khai

Khả năng là mô hình **plugin native** công khai trong OpenClaw. Mỗi plugin native OpenClaw đăng ký với một hoặc nhiều loại khả năng:

| Khả năng             | Phương thức đăng ký                              | Ví dụ plugin              |
| ------------------- | --------------------------------------------- | ------------------------- |
| Text inference      | `api.registerProvider(...)`                   | `openai`, `anthropic`     |
| Speech              | `api.registerSpeechProvider(...)`             | `elevenlabs`, `microsoft` |
| Media understanding | `api.registerMediaUnderstandingProvider(...)` | `openai`, `google`        |
| Image generation    | `api.registerImageGenerationProvider(...)`    | `openai`, `google`        |
| Web search          | `api.registerWebSearchProvider(...)`          | `google`                  |
| Channel / messaging | `api.registerChannel(...)`                    | `msteams`, `matrix`       |

Plugin đăng ký không có khả năng nào nhưng cung cấp hooks, công cụ, hoặc dịch vụ là plugin **chỉ có hook cũ**. Mẫu này vẫn được hỗ trợ đầy đủ.

### Quan điểm tương thích bên ngoài

Mô hình khả năng đã được tích hợp vào core và được sử dụng bởi các plugin native/bundled ngày nay, nhưng khả năng tương thích plugin bên ngoài vẫn cần một tiêu chuẩn chặt chẽ hơn "nó được xuất ra, do đó nó được đóng băng."

Hướng dẫn hiện tại:

- **plugin bên ngoài hiện có:** giữ cho tích hợp dựa trên hook hoạt động; coi đây là tiêu chuẩn tương thích
- **plugin native/bundled mới:** ưu tiên đăng ký khả năng rõ ràng hơn là tiếp cận theo nhà cung cấp hoặc thiết kế chỉ có hook mới
- **plugin bên ngoài áp dụng đăng ký khả năng:** được phép, nhưng coi các bề mặt trợ giúp cụ thể khả năng là đang phát triển trừ khi tài liệu đánh dấu rõ ràng một hợp đồng là ổn định

Quy tắc thực tế:

- API đăng ký khả năng là hướng đi dự định
- hook cũ vẫn là con đường an toàn nhất không gây gián đoạn cho plugin bên ngoài trong quá trình chuyển đổi
- các subpath trợ giúp xuất ra không phải tất cả đều bằng nhau; ưu tiên hợp đồng hẹp được tài liệu hóa, không phải các trợ giúp xuất ra ngẫu nhiên

### Hình dạng Plugin

OpenClaw phân loại mỗi plugin đã tải vào một hình dạng dựa trên hành vi đăng ký thực tế (không chỉ metadata tĩnh):

- **plain-capability** -- đăng ký chính xác một loại khả năng (ví dụ như plugin chỉ có provider như `mistral`)
- **hybrid-capability** -- đăng ký nhiều loại khả năng (ví dụ `openai` sở hữu text inference, speech, media understanding, và image generation)
- **hook-only** -- chỉ đăng ký hooks (typed hoặc custom), không có khả năng, công cụ, lệnh, hoặc dịch vụ
- **non-capability** -- đăng ký công cụ, lệnh, dịch vụ, hoặc routes nhưng không có khả năng

Dùng `openclaw plugins inspect <id>` để xem hình dạng và phân tích khả năng của plugin. Xem [CLI reference](/cli/plugins#inspect) để biết chi tiết.

### Hooks cũ

Hook `before_agent_start` vẫn được hỗ trợ như một con đường tương thích cho plugin chỉ có hook. Các plugin thực tế cũ vẫn phụ thuộc vào nó.

Hướng đi:

- giữ cho nó hoạt động
- tài liệu hóa nó như là cũ
- ưu tiên `before_model_resolve` cho công việc override model/provider
- ưu tiên `before_prompt_build` cho công việc biến đổi prompt
- chỉ loại bỏ sau khi sử dụng thực tế giảm và coverage fixture chứng minh an toàn di chuyển

### Tín hiệu tương thích

Khi chạy `openclaw doctor` hoặc `openclaw plugins inspect <id>`, có thể thấy một trong những nhãn này:

| Tín hiệu                  | Ý nghĩa                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Config phân tích tốt và plugin được giải quyết                       |
| **compatibility advisory** | Plugin sử dụng một mẫu cũ nhưng được hỗ trợ (ví dụ `hook-only`) |
| **legacy warning**         | Plugin sử dụng `before_agent_start`, đã bị loại bỏ        |
| **hard error**             | Config không hợp lệ hoặc plugin không tải được                   |

Cả `hook-only` và `before_agent_start` sẽ không làm hỏng plugin của bạn hôm nay -- `hook-only` là tư vấn, và `before_agent_start` chỉ kích hoạt cảnh báo. Những tín hiệu này cũng xuất hiện trong `openclaw status --all` và `openclaw plugins doctor`.

## Tổng quan kiến trúc

Hệ thống plugin của OpenClaw có bốn lớp:

1. **Manifest + discovery**
   OpenClaw tìm các plugin ứng viên từ các đường dẫn được cấu hình, gốc workspace, gốc extension toàn cầu, và các extension bundled. Discovery đọc các manifest `openclaw.plugin.json` native cộng với các manifest bundle được hỗ trợ trước tiên.
2. **Enablement + validation**
   Core quyết định liệu một plugin đã phát hiện có được bật, tắt, chặn, hay được chọn cho một slot độc quyền như memory.
3. **Runtime loading**
   Plugin native OpenClaw được tải trong quá trình thông qua jiti và đăng ký khả năng vào một registry trung tâm. Các bundle tương thích được chuẩn hóa thành các bản ghi registry mà không cần nhập mã runtime.
4. **Surface consumption**
   Phần còn lại của OpenClaw đọc registry để hiển thị công cụ, channel, thiết lập provider, hooks, HTTP routes, CLI commands, và dịch vụ.

Ranh giới thiết kế quan trọng:

- discovery + config validation nên hoạt động từ **metadata manifest/schema** mà không thực thi mã plugin
- hành vi runtime native đến từ đường dẫn `register(api)` của module plugin

Sự phân chia này cho phép OpenClaw xác thực config, giải thích plugin bị thiếu/tắt, và xây dựng gợi ý UI/schema trước khi runtime đầy đủ hoạt động.

### Channel plugins và công cụ tin nhắn chia sẻ

Channel plugins không cần đăng ký một công cụ send/edit/react riêng cho các hành động chat bình thường. OpenClaw giữ một công cụ `message` chia sẻ trong core, và channel plugins sở hữu discovery và thực thi cụ thể channel đằng sau nó.

Ranh giới hiện tại là:

- core sở hữu host công cụ `message` chia sẻ, wiring prompt, bookkeeping session/thread, và dispatch thực thi
- channel plugins sở hữu discovery hành động có phạm vi, discovery khả năng, và bất kỳ fragment schema cụ thể channel nào
- channel plugins thực thi hành động cuối cùng thông qua adapter hành động của chúng

Đối với channel plugins, bề mặt SDK là `ChannelMessageActionAdapter.describeMessageTool(...)`. Cuộc gọi discovery thống nhất này cho phép một plugin trả về các hành động, khả năng, và đóng góp schema có thể nhìn thấy của nó cùng nhau để các phần đó không bị trôi dạt.

Core truyền phạm vi runtime vào bước discovery đó. Các trường quan trọng bao gồm:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` inbound đáng tin cậy

Điều này quan trọng đối với các plugin nhạy cảm với ngữ cảnh. Một channel có thể ẩn hoặc hiển thị các hành động tin nhắn dựa trên tài khoản hoạt động, phòng/thread/tin nhắn hiện tại, hoặc danh tính requester đáng tin cậy mà không cần hardcoding các nhánh cụ thể channel trong công cụ `message` core.

Đây là lý do tại sao các thay đổi routing embedded-runner vẫn là công việc của plugin: runner chịu trách nhiệm chuyển tiếp danh tính chat/session hiện tại vào ranh giới discovery plugin để công cụ `message` chia sẻ hiển thị bề mặt thuộc sở hữu channel đúng cho lượt hiện tại.

Đối với các trợ giúp thực thi thuộc sở hữu channel, các plugin bundled nên giữ runtime thực thi bên trong các module extension của riêng chúng. Core không còn sở hữu các runtime hành động tin nhắn Discord, Slack, Telegram, hoặc WhatsApp dưới `src/agents/tools`. Chúng tôi không xuất bản các subpath `plugin-sdk/*-action-runtime` riêng biệt, và các plugin bundled nên nhập mã runtime cục bộ của riêng chúng trực tiếp từ các module thuộc sở hữu extension của chúng.

Đối với polls cụ thể, có hai đường thực thi:

- `outbound.sendPoll` là cơ sở chia sẻ cho các channel phù hợp với mô hình poll chung
- `actions.handleAction("poll")` là đường ưu tiên cho ngữ nghĩa poll cụ thể channel hoặc các tham số poll bổ sung

Core hiện trì hoãn phân tích poll chia sẻ cho đến khi plugin poll dispatch từ chối hành động, vì vậy các handler poll thuộc sở hữu plugin có thể chấp nhận các trường poll cụ thể channel mà không bị chặn bởi parser poll chung trước.

Xem [Load pipeline](#load-pipeline) để biết trình tự khởi động đầy đủ.

## Mô hình quyền sở hữu khả năng

OpenClaw coi một plugin native là ranh giới quyền sở hữu cho một **công ty** hoặc một **tính năng**, không phải là một túi tích hợp không liên quan.

Điều đó có nghĩa là:

- một plugin công ty thường nên sở hữu tất cả các bề mặt hướng OpenClaw của công ty đó
- một plugin tính năng thường nên sở hữu toàn bộ bề mặt tính năng mà nó giới thiệu
- các channel nên tiêu thụ các khả năng core chia sẻ thay vì triển khai lại hành vi provider một cách tùy tiện

Ví dụ:

- plugin `openai` bundled sở hữu hành vi model-provider OpenAI và hành vi speech + media-understanding + image-generation OpenAI
- plugin `elevenlabs` bundled sở hữu hành vi speech ElevenLabs
- plugin `microsoft` bundled sở hữu hành vi speech Microsoft
- plugin `google` bundled sở hữu hành vi model-provider Google cộng với hành vi media-understanding + image-generation + web-search Google
- các plugin `minimax`, `mistral`, `moonshot`, và `zai` bundled sở hữu backend media-understanding của chúng
- plugin `voice-call` là một plugin tính năng: nó sở hữu transport cuộc gọi, công cụ, CLI, routes, và runtime, nhưng nó tiêu thụ khả năng TTS/STT core thay vì phát minh ra một stack speech thứ hai

Trạng thái cuối cùng dự định là:

- OpenAI sống trong một plugin ngay cả khi nó trải dài các mô hình văn bản, speech, hình ảnh, và video tương lai
- một nhà cung cấp khác có thể làm tương tự cho khu vực bề mặt của riêng mình
- các channel không quan tâm plugin nhà cung cấp nào sở hữu provider; chúng tiêu thụ hợp đồng khả năng chia sẻ được core phơi bày

Đây là sự phân biệt chính:

- **plugin** = ranh giới quyền sở hữu
- **khả năng** = hợp đồng core mà nhiều plugin có thể triển khai hoặc tiêu thụ

Vì vậy, nếu OpenClaw thêm một miền mới như video, câu hỏi đầu tiên không phải là "nhà cung cấp nào nên hardcode xử lý video?" Câu hỏi đầu tiên là "hợp đồng khả năng video core là gì?" Khi hợp đồng đó tồn tại, các plugin nhà cung cấp có thể đăng ký chống lại nó và các plugin channel/tính năng có thể tiêu thụ nó.

Nếu khả năng chưa tồn tại, động thái đúng thường là:

1. định nghĩa khả năng thiếu trong core
2. phơi bày nó thông qua API/runtime plugin một cách có kiểu
3. wiring các channel/tính năng chống lại khả năng đó
4. cho phép các plugin nhà cung cấp đăng ký triển khai

Điều này giữ cho quyền sở hữu rõ ràng trong khi tránh hành vi core phụ thuộc vào một nhà cung cấp duy nhất hoặc một đường dẫn mã cụ thể plugin.

### Tầng khả năng

Sử dụng mô hình tinh thần này khi quyết định nơi mã thuộc về:

- **tầng khả năng core**: orchestration chia sẻ, chính sách, quy tắc hợp nhất config, ngữ nghĩa phân phối, và hợp đồng có kiểu
- **tầng plugin nhà cung cấp**: API cụ thể nhà cung cấp, auth, catalog mô hình, tổng hợp speech, tạo hình ảnh, backend video tương lai, điểm cuối sử dụng
- **tầng plugin channel/tính năng**: tích hợp Slack/Discord/cuộc gọi thoại/v.v. tiêu thụ các khả năng core và trình bày chúng trên một bề mặt

Ví dụ, TTS tuân theo hình dạng này:

- core sở hữu chính sách TTS thời gian trả lời, thứ tự fallback, prefs, và phân phối channel
- `openai`, `elevenlabs`, và `microsoft` sở hữu các triển khai tổng hợp
- `voice-call` tiêu thụ trợ giúp runtime TTS telephony

Mẫu đó nên được ưu tiên cho các khả năng tương lai.

### Ví dụ plugin công ty đa khả năng

Một plugin công ty nên cảm thấy gắn kết từ bên ngoài. Nếu OpenClaw có các hợp đồng chia sẻ cho mô hình, speech, media understanding, và web search, một nhà cung cấp có thể sở hữu tất cả các bề mặt của nó ở một nơi:

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
- core vẫn sở hữu các hợp đồng khả năng
- các plugin channel và tính năng tiêu thụ `api.runtime.*` trợ giúp, không phải mã nhà cung cấp
- các bài kiểm tra hợp đồng có thể khẳng định rằng plugin đã đăng ký các khả năng mà nó tuyên bố sở hữu

### Ví dụ khả năng: hiểu video

OpenClaw đã coi hiểu hình ảnh/âm thanh/video là một khả năng chia sẻ. Mô hình quyền sở hữu tương tự áp dụng ở đó:

1. core định nghĩa hợp đồng media-understanding
2. các plugin nhà cung cấp đăng ký `describeImage`, `transcribeAudio`, và `describeVideo` nếu có
3. các plugin channel và tính năng tiêu thụ hành vi core chia sẻ thay vì wiring trực tiếp đến mã nhà cung cấp

Điều đó tránh việc nướng các giả định video của một nhà cung cấp vào core. Plugin sở hữu bề mặt nhà cung cấp; core sở hữu hợp đồng khả năng và hành vi fallback.

Nếu OpenClaw thêm một miền mới sau này, chẳng hạn như tạo video, hãy sử dụng lại trình tự tương tự: định nghĩa khả năng core trước, sau đó cho phép các plugin nhà cung cấp đăng ký triển khai chống lại nó.

Cần một checklist triển khai cụ thể? Xem [Capability Cookbook](/tools/capability-cookbook).

## Hợp đồng và thực thi

Bề mặt API plugin được định kiểu và tập trung trong `OpenClawPluginApi`. Hợp đồng đó định nghĩa các điểm đăng ký được hỗ trợ và các trợ giúp runtime mà một plugin có thể dựa vào.

Tại sao điều này quan trọng:

- tác giả plugin có một tiêu chuẩn nội bộ ổn định
- core có thể từ chối quyền sở hữu trùng lặp như hai plugin đăng ký cùng một id provider
- khởi động có thể hiển thị chẩn đoán có thể hành động cho đăng ký không đúng định dạng
- các bài kiểm tra hợp đồng có thể thực thi quyền sở hữu đăng ký plugin bundled và ngăn chặn sự trôi dạt im lặng

Có hai lớp thực thi:

1. **thực thi đăng ký runtime**
   Registry plugin xác thực các đăng ký khi plugin tải. Ví dụ: id provider trùng lặp, id provider speech trùng lặp, và đăng ký không đúng định dạng tạo ra chẩn đoán plugin thay vì hành vi không xác định.
2. **bài kiểm tra hợp đồng**
   Các plugin bundled được chụp trong các registry hợp đồng trong quá trình chạy thử nghiệm để OpenClaw có thể khẳng định quyền sở hữu một cách rõ ràng. Ngày nay điều này được sử dụng cho các model providers, speech providers, web search providers, và quyền sở hữu đăng ký bundled.

Hiệu ứng thực tế là OpenClaw biết, ngay từ đầu, plugin nào sở hữu bề mặt nào. Điều đó cho phép core và các channel kết hợp liền mạch vì quyền sở hữu được khai báo, định kiểu, và có thể kiểm tra thay vì ngầm định.

### Những gì thuộc về một hợp đồng

Hợp đồng plugin tốt là:

- định kiểu
- nhỏ
- cụ thể khả năng
- thuộc sở hữu của core
- có thể tái sử dụng bởi nhiều plugin
- có thể tiêu thụ bởi các channel/tính năng mà không cần kiến thức nhà cung cấp

Hợp đồng plugin xấu là:

- chính sách cụ thể nhà cung cấp ẩn trong core
- các lối thoát plugin một lần bỏ qua registry
- mã channel tiếp cận thẳng vào một triển khai nhà cung cấp
- các đối tượng runtime ad hoc không phải là một phần của `OpenClawPluginApi` hoặc `api.runtime`

Khi nghi ngờ, nâng cao mức độ trừu tượng: định nghĩa khả năng trước, sau đó cho phép các plugin cắm vào nó.

## Mô hình thực thi

Plugin native OpenClaw chạy **trong quá trình** với Gateway. Chúng không được sandbox. Một plugin native đã tải có cùng ranh giới tin cậy cấp độ quá trình như mã core.

Hệ quả:

- một plugin native có thể đăng ký công cụ, handler mạng, hooks, và dịch vụ
- một lỗi plugin native có thể làm sập hoặc làm mất ổn định gateway
- một plugin native độc hại tương đương với thực thi mã tùy ý bên trong quá trình OpenClaw

Các bundle tương thích an toàn hơn theo mặc định vì OpenClaw hiện coi chúng là các gói metadata/nội dung. Trong các bản phát hành hiện tại, điều đó chủ yếu có nghĩa là các kỹ năng bundled.

Sử dụng allowlists và các đường dẫn cài đặt/tải rõ ràng cho các plugin không bundled. Đối xử với các plugin workspace như mã thời gian phát triển, không phải mặc định sản xuất.

Lưu ý tin cậy quan trọng:

- `plugins.allow` tin cậy **id plugin**, không phải nguồn gốc nguồn.
- Một plugin workspace với cùng id như một plugin bundled cố tình che bóng bản sao bundled khi plugin workspace đó được bật/cho phép.
- Điều này là bình thường và hữu ích cho phát triển cục bộ, kiểm tra bản vá, và hotfix.

## Ranh giới xuất khẩu

OpenClaw xuất khẩu khả năng, không phải sự tiện lợi triển khai.

Giữ đăng ký khả năng công khai. Cắt giảm các trợ giúp xuất khẩu không phải hợp đồng:

- các subpath trợ giúp cụ thể plugin bundled
- các subpath plumbing runtime không được dự định là API công khai
- các trợ giúp tiện lợi cụ thể nhà cung cấp
- các trợ giúp thiết lập/onboarding là chi tiết triển khai

## Load pipeline

Khi khởi động, OpenClaw thực hiện đại khái như sau:

1. khám phá các gốc plugin ứng viên
2. đọc các manifest native hoặc bundle tương thích và metadata package
3. từ chối các ứng viên không an toàn
4. chuẩn hóa config plugin (`plugins.enabled`, `allow`, `deny`, `entries`, `slots`, `load.paths`)
5. quyết định enablement cho mỗi ứng viên
6. tải các module native đã bật thông qua jiti
7. gọi các hooks `register(api)` native và thu thập các đăng ký vào registry plugin
8. phơi bày registry cho các bề mặt commands/runtime

Các cổng an toàn xảy ra **trước** khi thực thi runtime. Các ứng viên bị chặn khi entry thoát khỏi gốc plugin, đường dẫn có thể ghi toàn cầu, hoặc quyền sở hữu đường dẫn trông đáng ngờ đối với các plugin không bundled.

### Hành vi manifest-first

Manifest là nguồn sự thật của mặt phẳng điều khiển. OpenClaw sử dụng nó để:

- xác định plugin
- khám phá các channel/skills/config schema đã khai báo hoặc khả năng bundle
- xác thực `plugins.entries.<id>.config`
- tăng cường nhãn/placeholder UI điều khiển
- hiển thị metadata cài đặt/catalog

Đối với các plugin native, module runtime là phần mặt phẳng dữ liệu. Nó đăng ký hành vi thực tế như hooks, công cụ, lệnh, hoặc luồng provider.

### Những gì loader cache

OpenClaw giữ các cache ngắn trong quá trình cho:

- kết quả khám phá
- dữ liệu registry manifest
- các registry plugin đã tải

Các cache này giảm bớt overhead khởi động bursty và lệnh lặp lại. Chúng an toàn để nghĩ như các cache hiệu suất ngắn hạn, không phải sự tồn tại.

Lưu ý hiệu suất:

- Đặt `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` hoặc `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` để vô hiệu hóa các cache này.
- Điều chỉnh cửa sổ cache với `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` và `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Mô hình registry

Các plugin đã tải không trực tiếp thay đổi ngẫu nhiên các globals core. Chúng đăng ký vào một registry plugin trung tâm.

Registry theo dõi:

- bản ghi plugin (danh tính, nguồn, nguồn gốc, trạng thái, chẩn đoán)
- công cụ
- hooks cũ và hooks typed
- channels
- providers
- handlers RPC gateway
- HTTP routes
- CLI registrars
- dịch vụ nền
- lệnh thuộc sở hữu plugin

Các tính năng core sau đó đọc từ registry thay vì nói chuyện trực tiếp với các module plugin. Điều này giữ cho việc tải một chiều:

- module plugin -> đăng ký registry
- runtime core -> tiêu thụ registry

Sự phân tách đó quan trọng đối với khả năng bảo trì. Nó có nghĩa là hầu hết các bề mặt core chỉ cần một điểm tích hợp: "đọc registry", không phải "trường hợp đặc biệt mỗi module plugin".

## Callbacks binding cuộc trò chuyện

Các plugin bind một cuộc trò chuyện có thể phản ứng khi một phê duyệt được giải quyết.

Sử dụng `api.onConversationBindingResolved(...)` để nhận một callback sau khi một yêu cầu bind được phê duyệt hoặc từ chối:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Một binding hiện tồn tại cho plugin + cuộc trò chuyện này.
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
- `binding`: binding đã giải quyết cho các yêu cầu được phê duyệt
- `request`: tóm tắt yêu cầu gốc, gợi ý detach, id sender, và metadata cuộc trò chuyện

Callback này chỉ là thông báo. Nó không thay đổi ai được phép bind một cuộc trò chuyện, và nó chạy sau khi xử lý phê duyệt core hoàn tất.

## Hooks runtime provider

Các plugin provider hiện có hai lớp:

- metadata manifest: `providerAuthEnvVars` cho lookup env-auth rẻ trước khi tải runtime, cộng với `providerAuthChoices` cho nhãn onboarding/auth-choice rẻ và metadata flag CLI trước khi tải runtime
- hooks thời gian config: `catalog` / `discovery` cũ
- hooks runtime: `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`, `capabilities`, `prepareExtraParams`, `wrapStreamFn`, `formatApiKey`, `refreshOAuth`, `buildAuthDoctorHint`, `isCacheTtlEligible`, `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`, `isBinaryThinking`, `supportsXHighThinking`, `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot`

OpenClaw vẫn sở hữu vòng lặp agent chung, failover, xử lý transcript, và chính sách công cụ. Các hooks này là bề mặt mở rộng cho hành vi cụ thể provider mà không cần một transport suy luận tùy chỉnh hoàn toàn.

Sử dụng manifest `providerAuthEnvVars` khi provider có các thông tin xác thực dựa trên env mà các đường dẫn auth/status/model-picker chung nên thấy mà không cần tải runtime plugin. Sử dụng manifest `providerAuthChoices` khi các bề mặt CLI onboarding/auth-choice nên biết id lựa chọn của provider, nhãn nhóm, và wiring auth một flag đơn giản mà không cần tải runtime provider. Giữ `envVars` runtime provider cho các gợi ý hướng operator như nhãn onboarding hoặc các biến thiết lập client-id/client-secret OAuth.

### Thứ tự và sử dụng hook

Đối với các plugin model/provider, OpenClaw gọi các hooks theo thứ tự đại khái này. Cột "Khi nào sử dụng" là hướng dẫn quyết định nhanh.

| #   | Hook                          | Nó làm gì                                                                             | Khi nào sử dụng                                                                          |
| --- | ----------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1   | `catalog`                     | Xuất bản config provider vào `models.providers` trong quá trình tạo `models.json`          | Provider sở hữu một catalog hoặc mặc định URL cơ sở                                         |
| --  | _(built-in model lookup)_     | OpenClaw thử đường dẫn registry/catalog bình thường trước                                    | _(không phải một hook plugin)_                                                                |
| 2   | `resolveDynamicModel`         | Fallback đồng bộ cho các id model thuộc sở hữu provider không có trong registry cục bộ yet                 | Provider chấp nhận các id model upstream tùy ý                                        |
| 3   | `prepareDynamicModel`         | Warm-up không đồng bộ, sau đó `resolveDynamicModel` chạy lại                                     | Provider cần metadata mạng trước khi giải quyết các id không xác định                         |
| 4   | `normalizeResolvedModel`      | Viết lại cuối cùng trước khi runner nhúng sử dụng model đã giải quyết                         | Provider cần viết lại transport nhưng vẫn sử dụng một transport core                    |
| 5   | `capabilities`                | Metadata transcript/tooling thuộc sở hữu provider được sử dụng bởi logic core chia sẻ                     | Provider cần các quirks transcript/provider-family                                     |
| 6   | `prepareExtraParams`          | Chuẩn hóa tham số yêu cầu trước khi các tùy chọn stream chung được áp dụng                        | Provider cần các tham số yêu cầu mặc định hoặc dọn dẹp tham số per-provider                  |
| 7   | `wrapStreamFn`                | Wrapper stream sau khi các wrapper chung được áp dụng                                        | Provider cần các wrapper headers/body/model yêu cầu mà không có một transport tùy chỉnh |
| 8   | `formatApiKey`                | Formatter auth-profile: profile được lưu trữ trở thành chuỗi `apiKey` runtime               | Provider lưu trữ metadata auth bổ sung và cần một hình dạng token runtime tùy chỉnh           |
| 9   | `refreshOAuth`                | Override refresh OAuth cho các điểm cuối refresh tùy chỉnh hoặc chính sách refresh-failure            | Provider không phù hợp với các refreshers `pi-ai` chia sẻ                                  |
| 10  | `buildAuthDoctorHint`         | Gợi ý sửa chữa được đính kèm khi refresh OAuth thất bại                                            | Provider cần hướng dẫn sửa chữa auth thuộc sở hữu provider sau khi refresh thất bại             |
| 11  | `isCacheTtlEligible`          | Chính sách cache-prompt cho các provider proxy/backhaul                                         | Provider cần gating TTL cache cụ thể proxy                                       |
| 12  | `buildMissingAuthMessage`     | Thay thế cho thông điệp khôi phục auth thiếu chung                                | Provider cần một gợi ý khôi phục auth thiếu cụ thể provider                        |
| 13  | `suppressBuiltInModel`        | Ức chế model upstream cũ cộng với gợi ý lỗi hướng người dùng tùy chọn                    | Provider cần ẩn các hàng upstream cũ hoặc thay thế chúng bằng một gợi ý nhà cung cấp        |
| 14  | `augmentModelCatalog`         | Các hàng catalog tổng hợp/cuối cùng được đính kèm sau khi discovery                                    | Provider cần các hàng forward-compat tổng hợp trong `models list` và pickers            |
| 15  | `isBinaryThinking`            | Chuyển đổi lý luận bật/tắt cho các provider binary-thinking                                    | Provider chỉ phơi bày lý luận bật/tắt                                         |
| 16  | `supportsXHighThinking`       | Hỗ trợ lý luận `xhigh` cho các model được chọn                                            | Provider muốn `xhigh` chỉ trên một tập hợp con của các model                                    |
| 17  | `resolveDefaultThinkingLevel` | Mức `/think` mặc định cho một gia đình model cụ thể                                       | Provider sở hữu chính sách `/think` mặc định cho một gia đình model                             |
| 18  | `isModernModelRef`            | Bộ lọc profile live/smoke cho các model hiện đại                        | Provider sở hữu khớp model ưu tiên live/smoke                                    |
| 19  | `prepareRuntimeAuth`          | Trao đổi một thông tin xác thực được cấu hình thành token/key runtime thực tế ngay trước khi suy luận | Provider cần một trao đổi token hoặc thông tin xác thực yêu cầu ngắn hạn                    |
| 20  | `resolveUsageAuth`            | Giải quyết thông tin xác thực sử dụng/billing cho `/usage` và các bề mặt trạng thái liên quan               | Provider cần phân tích token sử dụng/quota tùy chỉnh hoặc một thông tin xác thực sử dụng khác      |
| 21  | `fetchUsageSnapshot`          | Lấy và chuẩn hóa các snapshot sử dụng/quota cụ thể provider sau khi auth được giải quyết       | Provider cần một điểm cuối sử dụng cụ thể provider hoặc parser payload                  |

Nếu provider cần một giao thức dây tùy chỉnh hoàn toàn hoặc một executor yêu cầu tùy chỉnh, đó là một lớp mở rộng khác. Các hooks này dành cho hành vi provider vẫn chạy trên vòng lặp suy luận bình thường của OpenClaw.

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

### Ví dụ tích hợp sẵn

- Anthropic sử dụng `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`, `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`, `resolveDefaultThinkingLevel`, và `isModernModelRef` vì nó sở hữu Claude 4.6 forward-compat, gợi ý provider-family, hướng dẫn sửa chữa auth, tích hợp điểm cuối sử dụng, eligibility cache-prompt, và chính sách suy nghĩ mặc định/adaptive Claude.
- OpenAI sử dụng `resolveDynamicModel`, `normalizeResolvedModel`, và `capabilities` cộng với `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`, `supportsXHighThinking`, và `isModernModelRef` vì nó sở hữu GPT-5.4 forward-compat, normalization `openai-completions` -> `openai-responses` trực tiếp OpenAI, gợi ý auth Codex-aware, suppression Spark, các hàng list OpenAI tổng hợp, và chính sách suy nghĩ / live-model GPT-5.
- OpenRouter sử dụng `catalog` cộng với `resolveDynamicModel` và `prepareDynamicModel` vì provider là pass-through và có thể phơi bày các id model mới trước khi các cập nhật catalog tĩnh của OpenClaw; nó cũng sử dụng `capabilities`, `wrapStreamFn`, và `isCacheTtlEligible` để giữ các headers yêu cầu cụ thể provider, metadata routing, patches lý luận, và chính sách cache-prompt ra khỏi core.
- GitHub Copilot sử dụng `catalog`, `auth`, `resolveDynamicModel`, và `capabilities` cộng với `prepareRuntimeAuth` và `fetchUsageSnapshot` vì nó cần login thiết bị thuộc sở hữu provider, hành vi fallback model, quirks transcript Claude, một trao đổi token GitHub -> Copilot, và một điểm cuối sử dụng thuộc sở hữu provider.
- OpenAI Codex sử dụng `catalog`, `resolveDynamicModel`, `normalizeResolvedModel`, `refreshOAuth`, và `augmentModelCatalog` cộng với `prepareExtraParams`, `resolveUsageAuth`, và `fetchUsageSnapshot` vì nó vẫn chạy trên các transports OpenAI core nhưng sở hữu normalization transport/base URL của nó, chính sách fallback refresh OAuth, lựa chọn transport mặc định, các hàng catalog Codex tổng hợp, và tích hợp điểm cuối sử dụng ChatGPT.
- Google AI Studio và Gemini CLI OAuth sử dụng `resolveDynamicModel` và `isModernModelRef` vì chúng sở hữu fallback forward-compat Gemini 3.1 và khớp model hiện đại; Gemini CLI OAuth cũng sử dụng `formatApiKey`, `resolveUsageAuth`, và `fetchUsageSnapshot` cho định dạng token, phân tích token, và wiring điểm cuối quota.
- Moonshot sử dụng `catalog` cộng với `wrapStreamFn` vì nó vẫn sử dụng transport OpenAI chia sẻ nhưng cần normalization payload lý luận thuộc sở hữu provider.
- Kilocode sử dụng `catalog`, `capabilities`, `wrapStreamFn`, và `isCacheTtlEligible` vì nó cần các headers yêu cầu thuộc sở hữu provider, normalization payload lý luận, gợi ý transcript Gemini, và gating TTL cache Anthropic.
- Z.AI sử dụng `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`, `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`, `resolveUsageAuth`, và `fetchUsageSnapshot` vì nó sở hữu fallback GLM-5, mặc định `tool_stream`, UX lý luận binary, khớp model hiện đại, và cả thông tin xác thực sử dụng + lấy quota.
- Mistral, OpenCode Zen, và OpenCode Go chỉ sử dụng `capabilities` để giữ các quirks transcript/tooling ra khỏi core.
- Các providers bundled chỉ có catalog như `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `modelstudio`, `nvidia`, `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway`, và `volcengine` chỉ sử dụng `catalog`.
- Cổng Qwen sử dụng `catalog`, `auth`, và `refreshOAuth`.
- MiniMax và Xiaomi sử dụng `catalog` cộng với các hooks sử dụng vì hành vi `/usage` của chúng thuộc sở hữu plugin mặc dù suy luận vẫn chạy thông qua các transports chia sẻ.

## Trợ giúp runtime

Các plugin có thể truy cập các trợ giúp core được chọn thông qua `api.runtime`. Đối với TTS:

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

- `textToSpeech` trả về payload đầu ra TTS core bình thường cho các bề mặt file/voice-note.
- Sử dụng cấu hình `messages.tts` core và lựa chọn provider.
- Trả về buffer âm thanh PCM + tỷ lệ mẫu. Các plugin phải resample/encode cho các providers.
- `listVoices` là tùy chọn cho mỗi provider. Sử dụng nó cho các pickers giọng nói thuộc sở hữu nhà cung cấp hoặc các luồng thiết lập.
- Các danh sách giọng nói có thể bao gồm metadata phong phú hơn như locale, giới tính, và thẻ cá nhân cho các pickers thuộc sở hữu nhà cung cấp.
- OpenAI và ElevenLabs hỗ trợ telephony hôm nay. Microsoft không.

Các plugin cũng có thể đăng ký các providers speech thông qua `api.registerSpeechProvider(...)`.

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

- Giữ chính sách TTS, fallback, và phân phối trả lời trong core.
- Sử dụng các providers speech cho hành vi tổng hợp thuộc sở hữu nhà cung cấp.
- Đầu vào Microsoft `edge` cũ được chuẩn hóa thành id provider `microsoft`.
- Mô hình quyền sở hữu ưu tiên là hướng công ty: một plugin nhà cung cấp có thể sở hữu text, speech, image, và các providers media tương lai khi OpenClaw thêm các hợp đồng khả năng đó.

Đối với hiểu hình ảnh/âm thanh/video, các plugin đăng ký một provider media-understanding có kiểu thay vì một túi key/value chung:

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

- Giữ orchestration, fallback, config, và wiring channel trong core.
- Giữ hành vi nhà cung cấp trong plugin provider.
- Mở rộng bổ sung nên giữ kiểu: các phương thức tùy chọn mới, các trường kết quả tùy chọn mới, các khả năng tùy chọn mới.
- Nếu OpenClaw thêm một khả năng mới như tạo video sau này, định nghĩa hợp đồng khả năng core trước, sau đó cho phép các plugin nhà cung cấp đăng ký chống lại nó.

Đối với các trợ giúp runtime media-understanding, các plugin có thể gọi:

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

Đối với transcription âm thanh, các plugin có thể sử dụng runtime media-understanding hoặc alias STT cũ:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Tùy chọn khi MIME không thể suy ra một cách đáng tin cậy:
  mime: "audio/ogg",
});
```

Ghi chú:

- `api.runtime.mediaUnderstanding.*` là bề mặt chia sẻ ưu tiên cho hiểu hình ảnh/âm thanh/video.
- Sử dụng cấu hình âm thanh media-understanding core (`tools.media.audio`) và thứ tự fallback provider.
- Trả về `{ text: undefined }` khi không có đầu ra transcription nào được tạo ra (ví dụ như đầu vào bị bỏ qua/không được hỗ trợ).
- `api.runtime.stt.transcribeAudioFile(...)` vẫn còn như một alias tương thích.

Các plugin cũng có thể khởi chạy các lần chạy subagent nền thông qua `api.runtime.subagent`:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Ghi chú:

- `provider` và `model` là các override tùy chọn per-run, không phải thay đổi session persistent.
- OpenClaw chỉ tôn trọng các trường override đó cho các callers đáng tin cậy.
- Đối với các lần chạy fallback thuộc sở hữu plugin, các operators phải opt in với `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Sử dụng `plugins.entries.<id>.subagent.allowedModels` để hạn chế các plugins đáng tin cậy đến các mục tiêu `provider/model` canonical cụ thể, hoặc `"*"` để cho phép bất kỳ mục tiêu nào một cách rõ ràng.
- Các lần chạy subagent plugin không đáng tin cậy vẫn hoạt động, nhưng các yêu cầu override bị từ chối thay vì âm thầm fallback.

Đối với tìm kiếm web, các plugin có thể tiêu thụ trợ giúp runtime chia sẻ thay vì tiếp cận vào wiring công cụ agent:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Các plugin cũng có thể đăng ký các providers tìm kiếm web thông qua `api.registerWebSearchProvider(...)`.

Ghi chú:

- Giữ lựa chọn provider, giải quyết thông tin xác thực, và ngữ nghĩa yêu cầu chia sẻ trong core.
- Sử dụng các providers tìm kiếm web cho các transports tìm kiếm cụ thể nhà cung cấp.
- `api.runtime.webSearch.*` là bề mặt chia sẻ ưu tiên cho các plugin tính năng/channel cần hành vi tìm kiếm mà không phụ thuộc vào wrapper công cụ agent.

## Gateway HTTP routes

Các plugin có thể phơi bày các endpoints HTTP với `api.registerHttpRoute(...)`.

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

Các trường route:

- `path`: đường dẫn route dưới server HTTP gateway.
- `auth`: bắt buộc. Sử dụng `"gateway"` để yêu cầu auth gateway bình thường, hoặc `"plugin"` cho xác thực quản lý plugin/verification webhook.
- `match`: tùy chọn. `"exact"` (mặc định) hoặc `"prefix"`.
- `replaceExisting`: tùy chọn. Cho phép cùng một plugin thay thế đăng ký route hiện có của chính nó.
- `handler`: trả về `true` khi route đã xử lý yêu cầu.

Ghi chú:

- `api.registerHttpHandler(...)` đã lỗi thời. Sử dụng `api.registerHttpRoute(...)`.
- Các route plugin phải khai báo `auth` rõ ràng.
- Các xung đột `path + match` chính xác bị từ chối trừ khi `replaceExisting: true`, và một plugin không thể thay thế route của plugin khác.
- Các route chồng chéo với các mức `auth` khác nhau bị từ chối. Giữ các chuỗi fallthrough `exact`/`prefix` trên cùng một mức auth chỉ.

## Đường dẫn import SDK plugin

Sử dụng các subpath SDK thay vì import `openclaw/plugin-sdk` nguyên khối khi viết plugin:

- `openclaw/plugin-sdk/plugin-entry` cho các nguyên thủy đăng ký plugin.
- `openclaw/plugin-sdk/core` cho hợp đồng plugin-facing chia sẻ chung.
- Các nguyên thủy channel ổn định như `openclaw/plugin-sdk/channel-setup`, `openclaw/plugin-sdk/channel-pairing`, `openclaw/plugin-sdk/channel-contract`, `openclaw/plugin-sdk/channel-feedback`, `openclaw/plugin-sdk/channel-inbound`, `openclaw/plugin-sdk/channel-lifecycle`, `openclaw/plugin-sdk/channel-reply-pipeline`, `openclaw/plugin-sdk/command-auth`, `openclaw/plugin-sdk/secret-input`, và `openclaw/plugin-sdk/webhook-ingress` cho wiring thiết lập/auth/reply/webhook chia sẻ. `channel-inbound` là ngôi nhà chia sẻ cho debounce, khớp mention, định dạng phong bì, và trợ giúp ngữ cảnh phong bì inbound.
- Các subpath domain như `openclaw/plugin-sdk/channel-config-helpers`, `openclaw/plugin-sdk/allow-from`, `openclaw/plugin-sdk/channel-config-schema`, `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/config-runtime`, `openclaw/plugin-sdk/infra-runtime`, `openclaw/plugin-sdk/agent-runtime`, `openclaw/plugin-sdk/lazy-runtime`, `openclaw/plugin-sdk/reply-history`, `openclaw/plugin-sdk/routing`, `openclaw/plugin-sdk/status-helpers`, `openclaw/plugin-sdk/runtime-store`, và `openclaw/plugin-sdk/directory-runtime` cho trợ giúp runtime/config chia sẻ.
- `openclaw/plugin-sdk/channel-runtime` chỉ còn lại như một shim tương thích. Mã mới nên import các nguyên thủy hẹp hơn thay thế.
- Các nội bộ extension bundled vẫn còn riêng tư. Các plugin bên ngoài chỉ nên sử dụng các subpath `openclaw/plugin-sdk/*`. Mã core/test OpenClaw có thể sử dụng các điểm nhập công khai repo dưới `extensions/<id>/index.js`, `api.js`, `runtime-api.js`, `setup-entry.js`, và các tệp có phạm vi hẹp như `login-qr-api.js`. Không bao giờ import `extensions/<id>/src/*` từ core hoặc từ một extension khác.
- Split điểm nhập repo:
  `extensions/<id>/api.js` là barrel trợ giúp/types,
  `extensions/<id>/runtime-api.js` là barrel chỉ runtime,
  `extensions/<id>/index.js` là điểm nhập plugin bundled,
  và `extensions/<id>/setup-entry.js` là điểm nhập plugin setup.
- Không còn các subpath công khai có thương hiệu channel bundled. Các seam trợ giúp và runtime cụ thể channel sống dưới `extensions/<id>/api.js` và `extensions/<id>/runtime-api.js`; hợp đồng SDK công khai là các nguyên thủy chia sẻ chung thay thế.

Lưu ý tương thích:

- Tránh barrel `openclaw/plugin-sdk` gốc cho mã mới.
- Ưu tiên các nguyên thủy ổn định hẹp trước. Các subpath setup/pairing/reply/feedback/contract/inbound/threading/command/secret-input/webhook/infra/allowlist/status/message-tool mới hơn là hợp đồng dự định cho công việc plugin bundled và bên ngoài mới.
  Phân tích/matching mục tiêu thuộc về `openclaw/plugin-sdk/channel-targets`.
  Các cổng hành động tin nhắn và trợ giúp id tin nhắn phản ứng thuộc về `openclaw/plugin-sdk/channel-actions`.
- Các barrels trợ giúp cụ thể extension bundled không ổn định theo mặc định. Nếu một trợ giúp chỉ cần thiết bởi một extension bundled, giữ nó sau seam `api.js` hoặc `runtime-api.js` cục bộ của extension thay vì thăng tiến nó vào `openclaw/plugin-sdk/<extension>`.
- Các barrels có thương hiệu channel bundled vẫn còn riêng tư trừ khi chúng được thêm lại vào hợp đồng công khai.
- Các subpath cụ thể khả năng như `image-generation`, `media-understanding`, và `speech` tồn tại vì các plugin native/bundled sử dụng chúng ngày nay. Sự hiện diện của chúng không tự nó có nghĩa là mọi trợ giúp xuất khẩu là một hợp đồng bên ngoài đóng băng dài hạn.

## Schemas công cụ tin nhắn

Các plugin nên sở hữu các đóng góp schema `describeMessageTool(...)` cụ thể channel. Giữ các trường cụ thể provider trong plugin, không phải trong core chia sẻ.

Đối với các fragment schema portable chia sẻ, tái sử dụng các trợ giúp chung được xuất khẩu thông qua `openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` cho các payload kiểu button-grid
- `createMessageToolCardSchema()` cho các payload card có cấu trúc

Nếu một hình dạng schema chỉ có ý nghĩa cho một provider, định nghĩa nó trong nguồn của plugin đó thay vì thăng tiến nó vào SDK chia sẻ.

## Giải quyết mục tiêu channel

Các plugin channel nên sở hữu ngữ nghĩa mục tiêu cụ thể channel. Giữ host outbound chia sẻ chung và sử dụng bề mặt adapter tin nhắn cho các quy tắc provider:

- `messaging.inferTargetChatType({ to })` quyết định liệu một mục tiêu đã chuẩn hóa nên được coi là `direct`, `group`, hoặc `channel` trước khi tra cứu directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` cho core biết liệu một đầu vào nên bỏ qua trực tiếp đến giải quyết id-like thay vì tìm kiếm directory.
- `messaging.targetResolver.resolveTarget(...)` là fallback plugin khi core cần một giải quyết thuộc sở hữu provider cuối cùng sau khi chuẩn hóa hoặc sau một miss directory.
- `messaging.resolveOutboundSessionRoute(...)` sở hữu xây dựng route session cụ thể provider một khi một mục tiêu được giải quyết.

Split được đề xuất:

- Sử dụng `inferTargetChatType` cho các quyết định danh mục nên xảy ra trước khi tìm kiếm peers/groups.
- Sử dụng `looksLikeId` cho các kiểm tra "đối xử với điều này như một id mục tiêu rõ ràng/native".
- Sử dụng `resolveTarget` cho fallback chuẩn hóa cụ thể provider, không phải cho tìm kiếm directory rộng.
- Giữ các id native provider như chat ids, thread ids, JIDs, handles, và room ids bên trong các giá trị `target` hoặc các params cụ thể provider, không phải trong các trường SDK chung.

## Directories dựa trên config

Các plugin mà derive các entries directory từ config nên giữ logic đó trong plugin và tái sử dụng các trợ giúp chia sẻ từ `openclaw/plugin-sdk/directory-runtime`.

Sử dụng điều này khi một channel cần các peers/groups dựa trên config như:

- các peers DM driven allowlist
- các maps channel/group được cấu hình
- các fallbacks directory tĩnh có phạm vi tài khoản

Các trợ giúp chia sẻ trong `directory-runtime` chỉ xử lý các hoạt động chung:

- lọc truy vấn
- áp dụng giới hạn
- trợ giúp deduping/chuẩn hóa
- xây dựng `ChannelDirectoryEntry[]`

Kiểm tra tài khoản cụ thể channel và chuẩn hóa id nên ở lại trong triển khai plugin.

## Catalogs provider

Các plugin provider có thể định nghĩa các catalog model cho suy luận với `registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` trả về cùng hình dạng OpenClaw ghi vào `models.providers`:

- `{ provider }` cho một entry provider
- `{ providers }` cho nhiều entry provider

Sử dụng `catalog` khi plugin sở hữu các id model cụ thể provider, mặc định URL cơ sở, hoặc metadata model auth-gated.

`catalog.order` kiểm soát khi một catalog plugin hợp nhất so với các providers implicit built-in của OpenClaw:

- `simple`: các providers driven API-key hoặc env plain
- `profile`: các providers xuất hiện khi các profiles auth tồn tại
- `paired`: các providers tổng hợp nhiều entry provider liên quan
- `late`: pass cuối cùng, sau các providers implicit khác

Các providers sau thắng trên xung đột key, vì vậy các plugin có thể cố ý override một entry provider built-in với cùng id provider.

Tương thích:

- `discovery` vẫn hoạt động như một alias cũ
- nếu cả `catalog` và `discovery` đều được đăng ký, OpenClaw sử dụng `catalog`

## Kiểm tra channel chỉ đọc

Nếu plugin của bạn đăng ký một channel, ưu tiên triển khai `plugin.config.inspectAccount(cfg, accountId)` cùng với `resolveAccount(...)`.

Tại sao:

- `resolveAccount(...)` là đường dẫn runtime. Nó được phép giả định rằng các thông tin xác thực đã được materialized đầy đủ và có thể thất bại nhanh khi các secrets cần thiết bị thiếu.
- Các đường dẫn lệnh chỉ đọc như `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, và các luồng sửa chữa doctor/config không nên cần materialize các thông tin xác thực runtime chỉ để mô tả cấu hình.

Hành vi `inspectAccount(...)` được đề xuất:

- Chỉ trả về trạng thái tài khoản mô tả.
- Bảo tồn `enabled` và `configured`.
- Bao gồm các trường nguồn/trạng thái thông tin xác thực khi có liên quan, chẳng hạn như:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Bạn không cần trả về các giá trị token thô chỉ để báo cáo tính khả dụng chỉ đọc. Trả về `tokenStatus: "available"` (và trường nguồn phù hợp) là đủ cho các lệnh kiểu trạng thái.
- Sử dụng `configured_unavailable` khi một thông tin xác thực được cấu hình thông qua SecretRef nhưng không khả dụng trong đường dẫn lệnh hiện tại.

Điều này cho phép các lệnh chỉ đọc báo cáo "được cấu hình nhưng không khả dụng trong đường dẫn lệnh này" thay vì sập hoặc báo cáo sai tài khoản là không được cấu hình.

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

Mỗi entry trở thành một plugin. Nếu pack liệt kê nhiều extensions, id plugin trở thành `name/<fileBase>`.

Nếu plugin của bạn nhập các deps npm, cài đặt chúng trong thư mục đó để `node_modules` có sẵn (`npm install` / `pnpm install`).

Guardrail bảo mật: mỗi entry `openclaw.extensions` phải ở lại bên trong thư mục plugin sau khi giải quyết symlink. Các entry thoát khỏi thư mục package bị từ chối.

Lưu ý bảo mật: `openclaw plugins install` cài đặt các phụ thuộc plugin với `npm install --ignore-scripts` (không có scripts lifecycle). Giữ cây phụ thuộc plugin "JS/TS thuần" và tránh các packages yêu cầu các builds `postinstall`.

Tùy chọn: `openclaw.setupEntry` có thể chỉ vào một module chỉ setup nhẹ. Khi OpenClaw cần các bề mặt setup cho một plugin channel bị tắt, hoặc khi một plugin channel được bật nhưng vẫn chưa được cấu hình, nó tải `setupEntry` thay vì entry plugin đầy đủ. Điều này giữ cho khởi động và setup nhẹ hơn khi entry plugin chính của bạn cũng wiring các công cụ, hooks, hoặc mã chỉ runtime khác.

Tùy chọn: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` có thể opt một plugin channel vào cùng đường dẫn `setupEntry` trong giai đoạn khởi động pre-listen của gateway, ngay cả khi channel đã được cấu hình.

Sử dụng điều này chỉ khi `setupEntry` bao phủ đầy đủ bề mặt khởi động phải tồn tại trước khi gateway bắt đầu lắng nghe. Trong thực tế, điều đó có nghĩa là entry setup phải đăng ký mọi khả năng thuộc sở hữu channel mà khởi động phụ thuộc vào, chẳng hạn như:

- đăng ký channel tự nó
- bất kỳ HTTP routes nào phải có sẵn trước khi gateway bắt đầu lắng nghe
- bất kỳ phương thức gateway, công cụ, hoặc dịch vụ nào phải tồn tại trong cùng cửa sổ đó

Nếu entry đầy đủ của bạn vẫn sở hữu bất kỳ khả năng khởi động cần thiết nào, không bật cờ này. Giữ plugin trên hành vi mặc định và để OpenClaw tải entry đầy đủ trong quá trình khởi động.

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

### Metadata catalog channel

Các plugin channel có thể quảng cáo metadata setup/discovery thông qua `openclaw.channel` và các gợi ý cài đặt thông qua `openclaw.install`. Điều này giữ cho dữ liệu catalog core không có dữ liệu.

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

OpenClaw cũng có thể hợp nhất **các catalogs channel bên ngoài** (ví dụ, một xuất registry MPM). Thả một tệp JSON tại một trong các vị trí:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Hoặc chỉ `OPENCLAW_PLUGIN_CATALOG_PATHS` (hoặc `OPENCLAW_MPM_CATALOG_PATHS`) vào một hoặc nhiều tệp JSON (phân cách bằng dấu phẩy/dấu chấm phẩy/`PATH`). Mỗi tệp nên chứa `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`.

## Plugins động cơ ngữ cảnh

Các plugins động cơ ngữ cảnh sở hữu orchestration ngữ cảnh session cho ingest, assembly, và compaction. Đăng ký chúng từ plugin của bạn với `api.registerContextEngine(id, factory)`, sau đó chọn động cơ hoạt động với `plugins.slots.contextEngine`.

Sử dụng điều này khi plugin của bạn cần thay thế hoặc mở rộng pipeline ngữ cảnh mặc định thay vì chỉ thêm tìm kiếm memory hoặc hooks.

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

Nếu động cơ của bạn **không** sở hữu thuật toán compaction, giữ `compact()` được triển khai và ủy quyền nó một cách rõ ràng:

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

Khi một plugin cần hành vi không phù hợp với API hiện tại, không bỏ qua hệ thống plugin với một reach-in riêng tư. Thêm khả năng thiếu.

Trình tự đề xuất:

1. định nghĩa hợp đồng core
   Quyết định hành vi chia sẻ nào core nên sở hữu: chính sách, fallback, hợp nhất config, vòng đời, ngữ nghĩa facing channel, và hình dạng trợ giúp runtime.
2. thêm các bề mặt đăng ký/runtime plugin có kiểu
   Mở rộng `OpenClawPluginApi` và/hoặc `api.runtime` với bề mặt khả năng có kiểu nhỏ nhất hữu ích.
3. wiring các consumers core + channel/tính năng
   Các channel và plugin tính năng nên tiêu thụ khả năng mới thông qua core, không phải bằng cách nhập một triển khai nhà cung cấp trực tiếp.
4. đăng ký các triển khai nhà cung cấp
   Các plugin nhà cung cấp sau đó đăng ký các backend của chúng chống lại khả năng.
5. thêm coverage hợp đồng
   Thêm các bài kiểm tra để quyền sở hữu và hình dạng đăng ký vẫn rõ ràng theo thời gian.

Đây là cách OpenClaw giữ cho ý kiến mà không trở thành hardcoded với một thế giới quan của một nhà cung cấp. Xem [Capability Cookbook](/tools/capability-cookbook) để biết một checklist file cụ thể và ví dụ đã làm việc.

### Checklist khả năng

Khi bạn thêm một khả năng mới, triển khai thường nên chạm vào các bề mặt này cùng nhau:

- các loại hợp đồng core trong `src/<capability>/types.ts`
- trợ giúp runner/runtime core trong `src/<capability>/runtime.ts`
- bề mặt đăng ký API plugin trong `src/plugins/types.ts`
- wiring registry plugin trong `src/plugins/registry.ts`
- phơi bày runtime plugin trong `src/plugins/runtime/*` khi các plugin tính năng/channel cần tiêu thụ nó
- trợ giúp capture/test trong `src/test-utils/plugin-registration.ts`
- các khẳng định quyền sở hữu/hợp đồng trong `src/plugins/contracts/registry.ts`
- tài liệu operator/plugin trong `docs/`

Nếu một trong những bề mặt đó bị thiếu, đó thường là dấu hiệu khả năng chưa được tích hợp đầy đủ.

### Mẫu khả năng

Mẫu tối thiểu:

```ts
// hợp đồng core
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

// trợ giúp runtime chia sẻ cho các plugin tính năng/channel
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

- core sở hữu hợp đồng khả năng + orchestration
- các plugin nhà cung cấp sở hữu các triển khai nhà cung cấp
- các plugin tính năng/channel tiêu thụ các trợ giúp runtime
- các bài kiểm tra hợp đồng giữ cho quyền sở hữu rõ ràng\n
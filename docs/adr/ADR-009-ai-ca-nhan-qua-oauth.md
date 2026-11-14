# ADR-009: Phụ huynh dùng tài khoản AI cá nhân (OAuth hoặc tự dán khoá) để chấm bài bằng hạn mức của họ

- **Trạng thái**: Đề xuất (chờ chủ dự án duyệt)
- **Ngày**: 2026-11-14 (GIA-81)
- **Người quyết định**: chủ dự án
- **Liên quan**: ADR-002 (Supabase), ADR-003 (AI chấm bài), ADR-007 (mở web công khai), ADR-008 (LM Studio), GIA-77 (Plus dùng Gemini trả phí), rủi ro R-001, R-007

## Bối cảnh

- Chủ dự án muốn phụ huynh **đăng nhập bằng tài khoản AI của chính họ** (Google/Gemini, OpenAI/ChatGPT,
  Anthropic/Claude…) để app chấm bài bằng hạn mức và tiền của phụ huynh, giảm chi phí và giới hạn của khoá dự án.
- Hiện nay: khoá AI của dự án nằm trong Supabase secrets; gói miễn phí dùng Gemini miễn phí, Plus dùng Gemini trả phí
  (ADR-003, GIA-77); LM Studio ở nhà đang đề xuất (ADR-008). Đăng nhập app: email + mã, Google (Supabase Auth), ẩn danh.
  Hàm AI chạy ở Supabase Edge Functions (150 s gói Free / 400 s gói trả phí).
- Người dùng cuối là **trẻ 6-11 tuổi**; người cầm tài khoản là phụ huynh. Điều khoản Gemini API cấm app hướng tới người
  dưới 18 tuổi (R-001).
- Phạm vi GIA-81: chỉ nghiên cứu và thiết kế, không sửa code, không đăng ký ứng dụng OAuth.

Có hai việc khác nhau hay bị gộp làm một, cần tách ra:

1. **Đăng nhập bằng gói tiêu dùng** (Gemini app / Google AI Pro, ChatGPT Plus, Claude Pro/Max): phụ huynh đã trả tiền
   tháng cho nhà cung cấp, app "mượn" hạn mức đó.
2. **Uỷ quyền gọi API bằng tài khoản nhà phát triển của phụ huynh** (Google Cloud project, tài khoản OpenRouter, khoá API):
   phụ huynh phải có tài khoản API riêng và tự trả tiền theo lượt.

## Kết quả tra cứu từng nhà cung cấp (tra ngày 14/11/2026)

### Google (Gemini)

| Câu hỏi | Kết quả | Nguồn |
|---|---|---|
| Có OAuth để app bên thứ ba gọi Gemini API bằng tài khoản người dùng? | **Có về kỹ thuật.** Hướng dẫn OAuth của Gemini API dùng scope `https://www.googleapis.com/auth/cloud-platform` và `.../generative-language.retriever`; yêu cầu gửi kèm header `x-goog-user-project` là **một Google Cloud project đã bật Generative Language API**. Trang ghi rõ đây là cách "phù hợp cho môi trường thử nghiệm" | [Gemini API: OAuth quickstart](https://aistudio.google.com/docs/oauth) (chuyển từ `ai.google.dev/gemini-api/docs/oauth`) |
| Hạn mức, tiền tính cho ai? | Cho **Cloud project** ghi trong `x-goog-user-project`. Muốn tính cho phụ huynh thì **mỗi phụ huynh phải tự tạo Cloud project, bật API, gắn thẻ thanh toán**. Chỉ project có tài khoản thanh toán mới là "Paid Service" (không dùng dữ liệu để cải thiện sản phẩm) | [Gemini API Additional Terms](https://aistudio.google.com/docs/terms) (hiệu lực 23/03/2026) |
| Gói tiêu dùng (Gemini app, Google AI Pro/Ultra) dùng qua app bên thứ ba? | **Không.** Google tuyên bố dùng phần mềm bên thứ ba để truy cập Antigravity/Gemini CLI bằng OAuth là vi phạm điều khoản; từ 02/2026 đã khoá nhiều tài khoản (kể cả tài khoản trả phí) vì dùng OAuth đó trong công cụ khác như OpenClaw. Google khuyên dùng khoá API Vertex/AI Studio. Điều khoản Gemini API cũng ghi API "dành cho nhà phát triển… mục đích chuyên môn hoặc kinh doanh, không cho mục đích tiêu dùng" | [Diễn đàn Google AI: tài khoản bị khoá vì OpenClaw](https://discuss.ai.google.dev/t/account-restricted-without-warning-google-ai-ultra-oauth-via-openclaw/122778), [Gigazine 24/02/2026](https://gigazine.net/gsc_news/en/20260224-google-gemini-openclaw-accounts-banned), [Gemini API Terms](https://aistudio.google.com/docs/terms) |
| Duyệt app | Scope nhạy cảm/hạn chế cần **Google OAuth verification**: chưa duyệt thì tối đa **100 người dùng mới** và hiện màn cảnh báo "ứng dụng chưa xác minh"; duyệt scope nhạy cảm thường **3-5 ngày làm việc**, cần chính sách riêng tư, video demo, giải thích từng scope và vì sao scope hẹp hơn không đủ. Scope hạn chế cần **đánh giá bảo mật hằng năm** của đơn vị được Google chỉ định (CASA, tốn phí). `cloud-platform` cho quyền "xem, sửa, cấu hình, xoá dữ liệu Google Cloud" của phụ huynh — quá rộng cho việc chấm bài; trang danh sách scope không ghi nhãn nhạy cảm/hạn chế, phải xem trong Cloud Console khi đăng ký | [Unverified apps](https://support.google.com/cloud/answer/7454865), [Sensitive scope verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification), [Restricted scope verification](https://support.google.com/cloud/answer/13464321), [OAuth 2.0 scopes](https://developers.google.com/identity/protocols/oauth2/scopes) |
| Độ tuổi, trẻ em | Người dùng API phải **từ 18 tuổi**; **cấm** API Client "hướng tới hoặc có khả năng được người dưới 18 tuổi truy cập". Điều khoản này áp vào **app**, không phụ thuộc ai trả tiền: phụ huynh trả tiền cũng không gỡ được R-001 | [Gemini API Terms](https://aistudio.google.com/docs/terms) |

**Kết luận Google: Không.** Gói tiêu dùng bị cấm; đường Cloud project về kỹ thuật làm được nhưng bắt phụ huynh tự lập
Google Cloud + thẻ thanh toán, xin scope rất rộng, và vẫn vướng điều khoản dưới 18 tuổi.

### OpenAI (ChatGPT)

| Câu hỏi | Kết quả | Nguồn |
|---|---|---|
| Có OAuth cho app bên thứ ba? | **Có: "Sign in with ChatGPT"** (OAuth 2.0 Authorization Code + PKCE `S256` + OpenID Connect). Chỉ đăng nhập: scope `openid profile email`. Dùng gói ChatGPT: thêm `offline_access resource.invoke chatgpt.tokens.use.direct`, `resource=https://api.openai.com/v1`. Gọi `POST /v1/responses` bằng token của người dùng; nhận được **chữ, ảnh, file** nếu model hỗ trợ | [Sign in with ChatGPT](https://developers.openai.com/siwc), [Sign-in (open-source)](https://developers.openai.com/siwc/token-sharing-open-source/sign-in), [Preview limitations](https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations) |
| Token | Access token **1 giờ**; refresh token **30 ngày**, mỗi lần làm mới được refresh token mới (xoay vòng). Không lưu token ở trình duyệt, log, analytics | [Token reference](https://developers.openai.com/siwc/token-sharing-open-source/token-reference) |
| Hạn mức, tiền tính cho ai? | Tính vào **gói ChatGPT Plus/Pro của người dùng** (không thấy ghi Free/Team/Business). Plus dùng chung giới hạn 5 giờ với mọi app; người dùng đặt trần hằng tuần cho từng app. Hết hạn mức: lỗi `429 subscription_sharing_usage_limit_exceeded`, OpenAI **không tự chuyển** sang tính tiền khác | [SIWC full docs](https://developers.openai.com/siwc/llms-full.txt), [Errors and recovery](https://developers.openai.com/siwc/token-sharing-open-source/errors-and-recovery) |
| Ai được dùng? | App **mã nguồn mở / chạy trên máy người dùng**: tự đăng ký. App **thương mại hoặc chạy trên máy chủ**: "chỉ cho một số đối tác thương mại được chọn, dạng dùng thử giới hạn", phải điền **form đăng ký quan tâm** và chờ. Tài liệu chỉ mô tả redirect loopback (`127.0.0.1`), **không nói gì về app di động** | [On your website](https://developers.openai.com/siwc/website), [Request a client ID](https://developers.openai.com/siwc/request-client-id) |
| Độ tuổi, trẻ em | Trang SIWC không nói. Hướng dẫn API cho người dưới 18 tuổi: cần thêm biện pháp an toàn; **không xử lý dữ liệu cá nhân trẻ dưới 13 tuổi khi chưa bật zero data retention**; OpenAI có quyền kiểm tra. Không rõ dữ liệu đi qua gói ChatGPT của phụ huynh được lưu/dùng thế nào | [Under 18 API Guidance](https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance) |

**Kết luận OpenAI: Có điều kiện.** Đây là nhà cung cấp duy nhất chính thức cho app bên thứ ba dùng gói tiêu dùng, nhưng
app của dự án (có thu phí, chạy trên máy chủ, có app di động) phải được OpenAI nhận vào chương trình dùng thử, và phải
làm rõ với OpenAI về dữ liệu trẻ dưới 13 tuổi (zero data retention) trước khi dùng.

### Anthropic (Claude)

| Câu hỏi | Kết quả | Nguồn |
|---|---|---|
| Có OAuth cho app bên thứ ba? | **Không.** "Anthropic không cho phép nhà phát triển bên thứ ba đưa đăng nhập Claude.ai vào app của họ, hoặc chuyển yêu cầu qua thông tin đăng nhập gói Free, Pro, Max, Ultra thay cho người dùng của họ"; cũng không được "thu thập, lưu hoặc làm trung gian" thông tin đăng nhập/session Claude.ai. Nhà phát triển phải dùng **khoá API từ Claude Console** hoặc nhà cung cấp cloud. Tài liệu API chỉ có khoá API và Workload Identity Federation (cho máy chủ, không phải đăng nhập người dùng) | [Claude Code: Legal and compliance](https://code.claude.com/docs/en/legal-and-compliance), [Claude API overview](https://platform.claude.com/docs/en/api/overview) |
| Gói tiêu dùng | Điều khoản tiêu dùng: cấm truy cập bằng cách tự động "trừ khi qua khoá API của Anthropic"; không được chia sẻ thông tin đăng nhập hay khoá API; tài khoản Claude.ai **từ 18 tuổi**. Từ 01-02/2026 Anthropic đã chặn dùng token gói Pro/Max trong công cụ bên thứ ba | [Consumer Terms](https://www.anthropic.com/legal/consumer-terms) (hiệu lực 08/10/2025), [The Register 20/02/2026](https://www.theregister.com/2026/02/20/anthropic_clarifies_ban_third_party_claude_access) |
| Trẻ em (khi dùng API) | Cho phép app phục vụ trẻ vị thành niên nếu có: biện pháp kỹ thuật (kiểm soát độ tuổi, lọc nội dung, giám sát), tuân thủ luật bảo vệ trẻ em/dữ liệu và **ghi công khai** trên trang web, **thông báo người dùng đang nói chuyện với AI**. Anthropic có thể kiểm tra | [Guidelines for Organizations Serving Minors](https://support.claude.com/en/articles/9307344-responsible-use-of-anthropic-s-models-guidelines-for-organizations-serving-minors) |

**Kết luận Anthropic: Không** (qua OAuth/gói Pro-Max). Chỉ còn đường phụ huynh tự dán khoá API (xem BYOK).

### Nhà cung cấp khác

| Nhà cung cấp | Kết quả | Nguồn |
|---|---|---|
| **OpenRouter** (cổng gọi nhiều model, có Gemini, Claude, GPT) | **Có OAuth PKCE công khai, không cần đăng ký hay duyệt app**: chuyển người dùng tới `openrouter.ai/auth?callback_url=…&code_challenge=…`, đổi `code` + `code_verifier` tại `POST /api/v1/auth/keys` lấy **một khoá API thuộc tài khoản người dùng**; "yêu cầu tính vào credit OpenRouter của chính họ". Người dùng phải **nạp trước credit** (thẻ quốc tế). Tài khoản **từ 18 tuổi**. Mặc định không lưu nội dung prompt; có cài đặt chỉ dùng nhà cung cấp zero data retention (cài ở tài khoản người dùng). Tài liệu không nói về callback cho app di động (deep link) hay cách người dùng thu hồi khoá — cần thử | [OAuth PKCE](https://openrouter.ai/docs/use-cases/oauth-pkce), [Terms](https://openrouter.ai/terms) (cập nhật 31/08/2026), [Privacy and logging](https://openrouter.ai/docs/guides/privacy) |
| Hugging Face (Inference Providers) | Có scope OAuth `inference-api` trong thực tế, nhưng **không tìm được tài liệu chính thức** xác nhận tiền tính vào tài khoản người đăng nhập. Không xét tiếp | [HF Inference Providers pricing](https://huggingface.co/docs/inference-providers/pricing) |

**Kết luận OpenRouter: Có điều kiện** (làm được ngay về kỹ thuật, nhưng phụ huynh phải lập tài khoản và nạp tiền
trước; thêm một bên trung gian nhận ảnh bài của bé; điều khoản của model gốc, ví dụ Gemini dưới 18 tuổi, vẫn cần xét).

### Phương án so sánh: phụ huynh tự dán khoá API (BYOK)

Phụ huynh tạo khoá ở AI Studio (Gemini), Claude Console hoặc OpenAI Platform rồi dán vào màn hình Ba Mẹ.

- **Tiền**: tính vào tài khoản của phụ huynh, theo lượt. Không cần nhà cung cấp duyệt app.
- **Điều khoản**: phụ huynh trở thành "nhà phát triển" dùng API; Gemini API vẫn cấm app cho dưới 18 tuổi và "không cho mục
  đích tiêu dùng"; Anthropic/OpenAI cho phép app phục vụ trẻ nếu đủ biện pháp an toàn (trách nhiệm vẫn ở app của dự án).
- **Lưu trữ**: khoá là bí mật giá trị cao (lộ = phụ huynh mất tiền). Phải mã hoá ở máy chủ, không bao giờ trả về app,
  chỉ hiện 4 ký tự cuối; kiểm tra khoá bằng một lời gọi rẻ trước khi lưu.
- **Trải nghiệm**: khó với phụ huynh không rành công nghệ (lập tài khoản nhà phát triển, gắn thẻ, tạo và dán khoá).
  Không tự làm mới, không tự thu hồi; phụ huynh tự huỷ khoá ở trang nhà cung cấp.

## Bảng so sánh tổng hợp

| Phương án | Được dùng? | Ai trả tiền | Cần nhà cung cấp duyệt app | Điều khoản trẻ em | Trải nghiệm phụ huynh |
|---|---|---|---|---|---|
| Google: gói Gemini / Google AI Pro qua OAuth | **Không** (bị cấm, có khoá tài khoản) | — | — | — | — |
| Google: OAuth + Cloud project của phụ huynh | **Không** (khuyến nghị) | Phụ huynh (Cloud billing) | Có: verification scope nhạy cảm (3-5 ngày, chưa duyệt tối đa 100 người) | Vướng: cấm app cho dưới 18 tuổi | Rất khó (tự lập Google Cloud) |
| OpenAI: Sign in with ChatGPT (Plus/Pro) | **Có điều kiện** | Gói ChatGPT của phụ huynh | Có: app thương mại phải xin vào bản dùng thử | Chưa rõ; trẻ dưới 13 cần zero data retention | Dễ (1 lần đăng nhập) nếu được nhận |
| Anthropic: đăng nhập Claude Pro/Max | **Không** (bị cấm rõ ràng) | — | — | — | — |
| OpenRouter OAuth PKCE | **Có điều kiện** | Credit OpenRouter của phụ huynh (nạp trước) | Không | Chủ tài khoản 18+; điều khoản model gốc vẫn áp | Trung bình (lập tài khoản, nạp tiền) |
| BYOK (tự dán khoá Gemini/Claude/OpenAI) | **Có điều kiện** | Tài khoản API của phụ huynh | Không | Gemini vướng dưới 18; Claude/OpenAI cần biện pháp an toàn | Khó |

## Quyết định (đề xuất)

1. **Không làm "đăng nhập bằng tài khoản AI cá nhân" bây giờ.** Hai nhà cung cấp lớn (Google, Anthropic) **cấm** dùng gói
   tiêu dùng qua app bên thứ ba và đã khoá tài khoản người dùng vi phạm: làm thì chính tài khoản của phụ huynh có thể bị
   khoá. Đường Google Cloud không hợp với phụ huynh và không gỡ được R-001.
2. **OpenAI Sign in with ChatGPT là hướng duy nhất đáng theo dõi.** Nếu chủ dự án muốn: chủ dự án tự điền
   [form đăng ký quan tâm](https://openai.com/form/sign-in-with-chatgpt-interest/) của OpenAI (agent không đăng ký thay),
   hỏi rõ (a) app di động có được không, (b) app cho học sinh tiểu học có được không, (c) zero data retention cho trẻ dưới
   13 tuổi. Chỉ mở ticket code khi OpenAI cấp client ID và trả lời được (a)-(c).
3. **OpenRouter và BYOK: không làm cho người dùng phổ thông.** Có thể làm sau, dạng "tuỳ chọn nâng cao cho phụ huynh rành
   công nghệ", chỉ khi chủ dự án thấy có nhu cầu thật (ví dụ hỏi nhóm thử). Ưu tiên OpenRouter OAuth hơn BYOK vì không phải
   dán khoá tay và khoá thuộc về phụ huynh.
4. **Giảm chi phí và giới hạn của khoá dự án bằng đường đang có**: Gemini trả phí cho Plus (GIA-77, cũng gỡ việc dùng dữ
   liệu của gói miễn phí), Claude dự phòng, LM Studio ở nhà (ADR-008), cầu dao `GIOI_HAN_CHUNG_NGAY` và cảnh báo ngân sách
   (GIA-72). Giá gói Plus phải đủ trả tiền AI.

## Thiết kế nếu sau này làm (OpenAI SIWC hoặc OpenRouter)

Để ticket code sau này không phải nghiên cứu lại. Chưa làm gì trong GIA-81.

**Kết nối**
- App/web mở trang đăng nhập của nhà cung cấp bằng Authorization Code + PKCE (`expo-auth-session` trên app,
  chuyển trang trên web), `state` chống giả mạo. `code_verifier` chỉ nằm trong bộ nhớ app đến khi đổi mã.
- App gửi `code` + `code_verifier` tới Edge Function mới `ket-noi-ai` (bắt buộc đăng nhập Supabase, **không cho tài khoản
  ẩn danh** vì phụ huynh phải là người lớn có tài khoản thật). Hàm đổi mã lấy token ở phía máy chủ; token **không bao giờ
  quay về app**.

**Lưu token**
- Bảng `ai_ca_nhan` (`user_id` khoá chính, tham chiếu `auth.users` **`on delete cascade`**; `nha_cung_cap`;
  `token_ma_hoa`, `iv`, `phien_ban_khoa`; `het_han_luc`; `trang_thai`: `hoat_dong` / `het_han_muc` / `bi_thu_hoi`;
  `tao_luc`, `dung_lan_cuoi`). Bật RLS, **không có policy nào cho client** (chỉ Edge Function dùng service role đọc/ghi);
  app chỉ thấy trạng thái qua một view hoặc hàm trả `nha_cung_cap`, `trang_thai`.
- Mã hoá AES-256-GCM trong Edge Function bằng khoá `AI_CA_NHAN_KHOA` trong Supabase secrets (có số phiên bản để đổi
  khoá), hoặc dùng Supabase Vault. Không ghi token vào log, Sentry, comment.

**Gọi thay người dùng và làm mới**
- `cham-bai`, `hoi-co`: nếu người dùng có `ai_ca_nhan` đang `hoat_dong` thì thử AI cá nhân **trước**, rồi mới tới chuỗi
  của dự án theo gói (miễn phí: Gemini miễn phí; Plus: Gemini trả phí → Claude; LM Studio cuối nếu ADR-008 được duyệt).
  Lượt chấm bằng AI cá nhân **không trừ** lượt ngày của dự án và không tính vào `GIOI_HAN_CHUNG_NGAY`, nhưng vẫn có trần
  riêng để chống lạm dụng (ví dụ 50 bài/ngày).
- OpenAI: access token 1 giờ, refresh token xoay vòng 30 ngày. Làm mới trong Edge Function, **khoá dòng** (`select … for
  update`) để hai yêu cầu cùng lúc không dùng một refresh token hai lần. Làm mới thất bại → `bi_thu_hoi`, báo phụ huynh kết
  nối lại. OpenRouter: khoá không hết hạn, không cần làm mới.
- Hết hạn mức (`429 subscription_sharing_usage_limit_exceeded` hoặc OpenRouter hết credit): đặt `het_han_muc` có thời gian
  thử lại, **chuyển sang chuỗi của dự án** như người dùng thường (không báo lỗi cho bé), và hiện cho phụ huynh dòng "Tài khoản
  AI của ba mẹ đã hết lượt, app dùng AI của Gia sư". Không tự suy đoán thời điểm hạn mức hồi lại.
- Ghi vào `luot_cham` loại engine (`ca_nhan_openai`, `ca_nhan_openrouter`) để thống kê.

**Thu hồi**
- Nút "Ngắt kết nối" trong màn Ba Mẹ: xoá dòng `ai_ca_nhan`, gọi API thu hồi của nhà cung cấp nếu có (OpenAI: kiểm tra
  endpoint revoke trong tài liệu khi làm; OpenRouter: tài liệu chưa nêu, hướng dẫn phụ huynh tự xoá khoá ở trang Keys).
- `xoa-tai-khoan`: xoá `auth.users` kéo theo xoá dòng (cascade); thêm bước gọi thu hồi như trên.

**Chính sách riêng tư phải sửa trước khi bật** (`src/app/chinh-sach-rieng-tu.tsx` và bản trên App Store / Google Play)
- Khi ba mẹ kết nối tài khoản AI riêng: ảnh bài và câu hỏi của bé được gửi tới nhà cung cấp đó **dưới tài khoản và điều
  khoản của ba mẹ** (dữ liệu có thể được lưu/dùng theo cài đặt tài khoản của ba mẹ); dự án không kiểm soát việc này.
- App lưu gì (token mã hoá, không lưu mật khẩu), ngắt kết nối thế nào, xoá tài khoản thì xoá token.
- Ba mẹ đồng ý rõ ràng (ô tích) trước khi kết nối. Theo Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 (hiệu lực 01/01/2026) và
  Nghị định 356/2025/NĐ-CP, xử lý dữ liệu trẻ em cần đồng ý của cha mẹ, trẻ từ 7 tuổi cần cả đồng ý của trẻ (theo bản tóm
  tắt báo chí, cần đối chiếu văn bản gốc trước khi viết chính sách).

## Hệ quả

- **Dễ hơn**: không đụng code, không đăng ký app với Google/OpenAI/Anthropic; không đặt tài khoản của phụ huynh vào rủi ro
  bị khoá; tập trung giải R-001/R-007 bằng gói trả phí (GIA-77).
- **Khó hơn**: chi phí AI vẫn do dự án trả; phải tính giá Plus đủ bù tiền AI.
- **Nếu sau này làm** (SIWC hoặc OpenRouter): thêm một nơi giữ bí mật của người dùng (bảng mã hoá, đổi khoá), thêm một bên
  nhận ảnh bài của bé, thêm việc hỗ trợ phụ huynh khi kết nối lỗi. Thay đổi đăng nhập/dữ liệu trẻ em nên chủ dự án phải review
  (R-005).

## Chi phí

| Hạng mục | Chi phí cho dự án | Ghi chú |
|---|---|---|
| Nghiên cứu (GIA-81) | 0 đ | |
| Đăng ký OAuth app Google + verification scope nhạy cảm | 0 đ tiền phí, 3-5 ngày làm việc trở lên | Không khuyến nghị làm |
| Scope hạn chế của Google (đánh giá bảo mật hằng năm) | Tốn phí, trang Google không công bố giá | Không cần nếu không làm Google |
| OpenAI SIWC | 0 đ (theo tài liệu), phải chờ OpenAI nhận | Tiền AI do gói ChatGPT của phụ huynh |
| OpenRouter OAuth | 0 đ cho dự án | Phụ huynh nạp credit; OpenRouter thu phí trên credit (xem trang giá khi làm) |
| Làm code nếu duyệt (ước lượng) | Khoảng 13-16 điểm | Xem ticket đề xuất dưới |

## Ticket code đề xuất (chỉ tạo khi chủ dự án duyệt hướng làm)

1. **PO/chủ dự án**: điền form SIWC của OpenAI, hỏi 3 câu (a)-(c) ở Quyết định mục 2. Không cần code.
2. **Dùng chung, Security** (5 điểm): migration bảng `ai_ca_nhan` (RLS, cascade), mã hoá AES-GCM + secret
   `AI_CA_NHAN_KHOA`, Edge Function `ket-noi-ai` / `ngat-ai`, test.
3. **Dùng chung** (3 điểm): engine `ca_nhan_*` đứng đầu chuỗi trong `cham-bai`, `hoi-co`; làm mới token có khoá dòng;
   xử lý hết hạn mức → chuyển chuỗi dự án; ghi `luot_cham`.
4. **Mobile + Web** (3 + 2 điểm): màn "Tài khoản AI của ba mẹ" trong khu Ba Mẹ (kết nối, trạng thái, ngắt), không cho tài
   khoản ẩn danh.
5. **Docs/Security** (1-2 điểm): sửa chính sách riêng tư (app + cửa hàng), `xoa-tai-khoan` thu hồi token.

## Điều kiện xem xét lại

- OpenAI mở SIWC cho app thương mại/di động, hoặc nhận dự án vào bản dùng thử.
- Google hoặc Anthropic công bố cách chính thức cho app bên thứ ba dùng gói tiêu dùng của người dùng.
- Điều khoản Gemini API bỏ điều cấm app cho dưới 18 tuổi.
- Nhóm thử cho thấy nhiều phụ huynh đã có tài khoản API/OpenRouter và muốn tự trả tiền.

## Nguồn tham khảo (tra ngày 14/11/2026)

- Gemini API OAuth quickstart: https://aistudio.google.com/docs/oauth
- Gemini API Additional Terms (hiệu lực 23/03/2026): https://aistudio.google.com/docs/terms
- Google OAuth 2.0 scopes: https://developers.google.com/identity/protocols/oauth2/scopes
- Google Unverified apps: https://support.google.com/cloud/answer/7454865
- Google Sensitive scope verification: https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification
- Google Restricted scope verification: https://support.google.com/cloud/answer/13464321
- Google khoá tài khoản dùng OAuth trong công cụ bên thứ ba: https://discuss.ai.google.dev/t/account-restricted-without-warning-google-ai-ultra-oauth-via-openclaw/122778 ,
  https://gigazine.net/gsc_news/en/20260224-google-gemini-openclaw-accounts-banned
- OpenAI Sign in with ChatGPT: https://developers.openai.com/siwc , https://developers.openai.com/siwc/llms-full.txt ,
  https://developers.openai.com/siwc/website , https://developers.openai.com/siwc/token-sharing-open-source/sign-in ,
  https://developers.openai.com/siwc/token-sharing-open-source/token-reference ,
  https://developers.openai.com/siwc/token-sharing-open-source/errors-and-recovery ,
  https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations
- OpenAI Under 18 API Guidance: https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance
- Anthropic Claude Code Legal and compliance: https://code.claude.com/docs/en/legal-and-compliance
- Anthropic Consumer Terms: https://www.anthropic.com/legal/consumer-terms
- Anthropic Guidelines for Organizations Serving Minors: https://support.claude.com/en/articles/9307344-responsible-use-of-anthropic-s-models-guidelines-for-organizations-serving-minors
- Claude API overview: https://platform.claude.com/docs/en/api/overview
- The Register (20/02/2026): https://www.theregister.com/2026/02/20/anthropic_clarifies_ban_third_party_claude_access
- OpenRouter OAuth PKCE: https://openrouter.ai/docs/use-cases/oauth-pkce · Terms: https://openrouter.ai/terms ·
  Privacy: https://openrouter.ai/docs/guides/privacy
- Hugging Face Inference Providers pricing: https://huggingface.co/docs/inference-providers/pricing
- Luật Bảo vệ dữ liệu cá nhân 2025 (tóm tắt): https://vneconomy.vn/nhung-diem-moi-trong-luat-bao-ve-du-lieu-ca-nhan-tu-112026.htm
- Nội bộ: ADR-003, ADR-007, ADR-008, `src/app/chinh-sach-rieng-tu.tsx`, `supabase/functions/`

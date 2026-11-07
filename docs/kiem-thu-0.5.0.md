# Danh sách kiểm thử bản 0.5.0

Dùng để test lại toàn bộ app một lần. Thay đổi so với 0.4.0: xem [CHANGELOG.md](../CHANGELOG.md).
Bài mẫu có đáp án: `mau-bai-tap/dap-an.md` (chỉ có trên máy, không đưa lên GitHub).

## Cần chuẩn bị trước

| Việc | Vì sao | Trạng thái 05/11 |
|---|---|---|
| Deploy `cham-bai` | Cần cho GIA-49, 50, 53, 55 | Xong 06/11 (v20) |
| Build 0.5.0 iOS và Android | Trình quét trang và đọc chữ cần bản build mới | Chỉ có bản dev trên máy giả lập iPhone; Android chưa build lần nào |
| AI trên máy chủ chạy được | Log 06/11 trên v20: Gemini chấm 1 trang quá 120 giây, Claude hết tiền (GIA-19, GIA-21) | **Đang lỗi, chặn mọi test chấm bài bằng máy chủ** |
| LM Studio bật ở máy tính trong nhà | Để test dự phòng GIA-54 | Đã thử 06/11: 1 trang khoảng 4 phút, 2 trang khoảng 8 phút |
| iPhone hoặc Android thật | Máy giả lập không chụp được bằng trình quét | Cần có |

Ghi kết quả: đánh `[x]` nếu đạt. Không đạt thì ghi ảnh hoặc mô tả vào ticket tương ứng trên Linear.

## A. Chức năng mới

### Chụp và chọn ảnh
- [ ] **Quét trang (GIA-47, máy thật).** Bấm Chụp ngay, đưa vở vào khung. Đúng: khung bám mép giấy, ảnh ra đã cắt sát, thẳng, còn màu.
- [ ] **Đóng trình quét (GIA-47, máy thật).** Bấm X. Đúng: về lại màn Quét bài, không mở thêm camera.
- [ ] **Quét nhiều trang (GIA-47, máy thật).** Quét 3 trang một lượt. Đúng: có đủ Trang 1, 2, 3 đúng thứ tự.
- [ ] **Bản cũ nhận OTA (GIA-47, GIA-53).** Máy còn cài 0.4.0 nhận OTA. Đúng: Chụp mở camera thường, chấm vẫn được.
- [ ] **Ảnh mờ (GIA-48).** Chụp rung tay hoặc chọn ảnh mờ. Đúng: nhắc chụp lại; "Vẫn dùng ảnh này" giữ ảnh; "Chụp lại"/"Bỏ ảnh này" bỏ ảnh.
- [ ] **Ảnh tối (GIA-48).** Chụp trong phòng tối. Đúng: báo ảnh hơi tối.
- [ ] **Ảnh lóa (GIA-48).** Chụp có đốm đèn lớn trên giấy. Đúng: báo bị lóa.
- [ ] **Ảnh tốt không bị chặn nhầm (GIA-48).** Chụp 5 trang vở thật đủ sáng. Đúng: không trang nào bị nhắc. Bị nhắc nhầm thì ghi lại để chỉnh ngưỡng.
- [ ] **Không mất lượt (GIA-48).** Bị nhắc rồi bỏ ảnh. Đúng: số lượt chấm trong ngày không đổi.
- [ ] **Chọn trùng ảnh album (GIA-50).** Chọn lại một ảnh đã có. Đúng: báo "Trang này con chọn rồi", số trang không tăng.

### Chấm bài (cần máy chủ chạy được)
- [ ] **Nhiều trang (GIA-49).** Chấm 3 trang. Đúng: có bài của cả 3 trang, câu hỏi ghi "Trang k –", điểm theo số câu đúng của cả bài.
- [ ] **Thời gian chờ (GIA-49).** Bấm giờ bài 1 trang và 3 trang. Đúng: 3 trang không lâu hơn 1 trang quá ~30%. Ghi số giây vào GIA-49.
- [ ] **Lời nhận xét chung (GIA-49).** Nghe lời cô bài 3 trang. Đúng: 3–5 câu, không đọc nối lời từng trang.
- [ ] **Một trang lỗi (GIA-49).** Đúng: báo chưa chấm được và hoàn lượt, không ra kết quả thiếu trang.
- [ ] **Chụp một trang hai lần (GIA-50).** Đúng: báo "Có trang chụp trùng", điểm không tính đôi.
- [ ] **Hai trang cùng mẫu, làm khác nhau (GIA-50).** Đúng: giữ cả hai, không bị coi là trùng.
- [ ] **Độ nét (GIA-52).** Chấm 7 bộ mẫu ở 2200 và 1600 điểm ảnh. Ghi số lỗi bắt được, thời gian, chi phí vào GIA-52 rồi chốt mức.
- [ ] **Đáp án tự tính (GIA-53, cần deploy và bản build mới).** Chấm `toan2`, `toan5`. Đúng: 2 x 7 = 14, 18 : 2 = 9, 3 + 47 + 20 = 70, 90 - 45 - 15 = 30.
- [ ] **Chữ viết tay thật (GIA-53).** Chấm bài Toán do bé viết. Đúng: không có câu bị chấm sai vì máy đọc nhầm đề.
- [ ] **Dạng code không tính (GIA-53).** Đặt tính cột, đổi đơn vị, đồng hồ, bài lời văn, phép chia có dư, phân số. Đúng: cô vẫn chấm đúng.
- [ ] **Dạng bài riêng (GSTH-038 / GIA-20).** Bài nối, tô màu, bảng, khoanh, vẽ hình, chữ viết tay. Đúng: dạng nào cũng có mục riêng, chấm đúng.
- [ ] **Tiếng Việt (GIA-53).** Chấm `tv1` đến `tv5`. Đúng: bắt đủ lỗi trong `dap-an.md`.

### Dự phòng LM Studio (GIA-54)
- [ ] **Máy chủ lỗi, có LM Studio.** Đúng: bài vẫn chấm được, có báo "chấm bằng AI trên máy tính ở nhà".
- [ ] **Hết lượt trong ngày.** Đúng: báo hết lượt, không chuyển sang LM Studio.
- [ ] **Máy chủ lỗi, LM Studio tắt.** Đúng: báo lời dễ hiểu, không chữ kỹ thuật.
- [ ] **Hỏi cô khi máy chủ lỗi.** Đúng: LM Studio trả lời.
- [ ] **Bài nhiều trang qua LM Studio.** Lưu ý: nhánh này vẫn gửi cả bài một lần, nên có thể sót trang. Ghi lại nếu gặp.

### Gói Plus (GSTH-040 / GIA-22)
- [ ] **Xem các gói và Khôi phục.** Đúng: phải qua cổng phụ huynh trước; lỗi hiện lời dễ hiểu.

## B. Kiểm tra lại chức năng cũ

- [ ] Đăng nhập Ba Mẹ bằng email (mã 6 số) và Google; đăng xuất, vào lại.
- [ ] Tạo và sửa hồ sơ bé: tên, lớp, ảnh đại diện; đổi lớp ngay ở màn Quét bài.
- [ ] Trang chủ: lời chào, "Nghe Cô dặn hôm nay", chuỗi ngày, số sao.
- [ ] Ảnh không phải bài tập, bài sai lớp: hỏi ba mẹ, chọn chụp lại hoặc đổi lớp.
- [ ] Hết 3 lượt miễn phí: báo hết lượt, mời xem gói Plus qua cổng phụ huynh.
- [ ] Mất mạng khi chấm: báo lời dễ hiểu, không mất lượt.
- [ ] Màn Chữa bài: đọc lời nhận xét, dừng đọc, "Thử lại câu này".
- [ ] Hỏi cô ở từng câu: gõ và nói bằng micro, iOS và **Android thật** (GIA-24).
- [ ] Giọng Cô và Thầy.
- [ ] +15 sao mỗi bài, chuỗi ngày học; màn Tiến độ.
- [ ] Xem lại bài cũ kèm ảnh, kể cả sau khi cài bản mới (GSTH-037).
- [ ] Xoá tài khoản (dùng tài khoản thử).
- [ ] Chính sách riêng tư mở được, có dòng về LM Studio.
- [ ] Trợ năng: chữ to, vùng bấm đủ lớn, đọc màn hình có nhãn.

## C. Rủi ro đã biết

- **Gemini quá 120 giây.** Máy chủ thử Gemini 120 giây rồi mới sang Claude, app chỉ chờ 150 giây. Claude gần như không còn thời gian. Ảnh 2200 điểm ảnh có thể làm chậm thêm, cần đo.
- **LM Studio chấm từ bản chép, không nhìn lại ảnh.** Bài hình dễ sai: bản test 06/11 sót lỗi đếm hình tam giác trong `toan5`.
- **`expo-doctor` báo 2 mục.** Thiếu `expo-asset` (`expo-audio` cần, có thể gây lỗi ngoài Expo Go) và 23 thư viện lệch bản vá so với SDK. Nên xử lý trước khi build 0.5.0.
- **Ngưỡng ảnh mờ** mới chỉnh trên ảnh mẫu giả lập, ảnh thật có thể cần chỉnh lại.

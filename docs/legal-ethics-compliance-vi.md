# Tuân thủ Pháp luật, Đạo đức Xã hội & Đạo đức Nghề nghiệp

Tài liệu này cung cấp phân tích toàn diện về các yếu tố pháp luật, đạo đức xã hội và đạo đức nghề nghiệp áp dụng cho Hệ thống POS & Quản lý Quán cà phê. Mỗi luật, khung đạo đức và tiêu chuẩn bảo mật được ánh xạ cụ thể đến các quyết định triển khai trong mã nguồn.

---

## Mục lục

- [1. Tuân thủ Pháp luật (Luật)](#1-tuân-thủ-pháp-luật-luật)
  - [1.1 Luật An toàn thông tin mạng 2015](#11-luật-an-toàn-thông-tin-mạng-2015)
  - [1.2 Luật An ninh mạng 2018](#12-luật-an-ninh-mạng-2018)
  - [1.3 Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân](#13-nghị-định-132023nd-cp-về-bảo-vệ-dữ-liệu-cá-nhân)
  - [1.4 Luật Giao dịch điện tử 2005](#14-luật-giao-dịch-điện-tử-2005)
  - [1.5 Luật Công nghệ thông tin 2006](#15-luật-công-nghệ-thông-tin-2006)
  - [1.6 Luật Sở hữu trí tuệ 2005](#16-luật-sở-hữu-trí-tuệ-2005)
  - [1.7 Tuân thủ Bảo mật Thanh toán](#17-tuân-thủ-bảo-mật-thanh-toán)
- [2. Đạo đức Xã hội](#2-đạo-đức-xã-hội)
  - [2.1 Tính minh bạch và công bằng](#21-tính-minh-bạch-và-công-bằng)
  - [2.2 Tác động xã hội tích cực](#22-tác-động-xã-hội-tích-cực)
  - [2.3 Trách nhiệm với cộng đồng](#23-trách-nhiệm-với-cộng-đồng)
- [3. Đạo đức Nghề nghiệp](#3-đạo-đức-nghề-nghiệp)
  - [3.1 Bộ quy tắc đạo đức ACM/IEEE cho Kỹ sư phần mềm](#31-bộ-quy-tắc-đạo-đức-acmieee-cho-kỹ-sư-phần-mềm)
  - [3.2 Tuân thủ OWASP Top 10 về bảo mật](#32-tuân-thủ-owasp-top-10-về-bảo-mật)
  - [3.3 Nguyên tắc ISO/IEC 27001](#33-nguyên-tắc-isoiec-27001)
  - [3.4 Bảo mật như trách nhiệm đạo đức](#34-bảo-mật-như-trách-nhiệm-đạo-đức)
  - [3.5 Minh bạch trong phát triển](#35-minh-bạch-trong-phát-triển)
- [4. Tài liệu tham khảo](#4-tài-liệu-tham-khảo)

---

## 1. Tuân thủ Pháp luật (Luật)

### 1.1 Luật An toàn thông tin mạng 2015

**Luật:** Luật An toàn thông tin mạng số 86/2015/QH13
**Thông qua:** 19/11/2015 bởi Quốc hội (Khóa XIII, Kỳ họp thứ 10)
**Có hiệu lực:** 01/07/2016
**Sửa đổi bởi:** Luật số 35/2018/QH14 ngày 20/11/2018

Luật này quy định về hoạt động bảo vệ thông tin trên mạng tại Việt Nam. Các điều khoản liên quan đến dự án:

| Điều | Quy định | Áp dụng trong dự án |
|------|----------|-------------------|
| **Điều 26** | Bảo vệ thông tin cá nhân trên mạng | Mật khẩu mã hóa bằng argon2id; JWT tokens qua HTTP-only cookies; AWS Secrets Manager cho cấu hình nhạy cảm |
| **Điều 27** | Cấm thu thập/lưu trữ dữ liệu cá nhân khi chưa được đồng ý | Hệ thống chỉ thu thập dữ liệu tối thiểu (tên đăng nhập, mật khẩu đã mã hóa, vai trò); không thu thập dữ liệu cá nhân khách hàng |
| **Điều 28** | Trách nhiệm bảo vệ thông tin cá nhân | RBAC đảm bảo chỉ MANAGER mới truy cập được dữ liệu nhân viên nhạy cảm (lương, thông tin cá nhân) |

**Triển khai:**
- `backend/src/auth/strategies/jwt.strategy.ts` — Xác thực JWT với HTTP-only cookies
- `backend/src/settings/settings.service.ts` — Mã hóa AES-256-GCM cho khóa API khi lưu trữ
- `backend/src/users/user.entity.ts` — Mật khẩu lưu dưới dạng băm argon2id, không bao giờ plain text

> **Toàn văn:** https://vanban.chinhphu.vn/?pageid=27160&docid=183196
> **Bản tiếng Anh:** https://extendmax.vn/law-on-cybersecurity-no-86-2015-qh13

---

### 1.2 Luật An ninh mạng 2018

**Luật:** Luật An ninh mạng số 24/2018/QH14
**Thông qua:** 12/06/2018 bởi Quốc hội (Khóa XIV, Kỳ họp thứ 5)
**Có hiệu lực:** 01/01/2019

Luật này quy định về bảo vệ an ninh quốc gia và bảo đảm trật tự, an toàn trên không gian mạng. Các điều khoản liên quan:

| Điều | Quy định | Áp dụng trong dự án |
|------|----------|-------------------|
| **Điều 8** | Các hành vi bị cấm bao gồm tấn công mạng, đánh cắp dữ liệu | Rate limiting (100 yêu cầu/phút), kiểm tra đầu vào, cấu hình CORS |
| **Điều 26** | Bảo vệ thông tin cá nhân trên không gian mạng | HTTPS/TLS qua Cloudflare Origin CA; mã hóa Full Strict mode |
| **Điều 29** | Yêu cầu bảo mật an ninh mạng cho hệ thống thông tin | Quét bảo mật CodeQL trên mỗi PR; quét lỗ hổng dependencies |

**Triển khai:**
- `frontend/vite.config.ts` — Cấu hình CORS cho truy cập API
- `.github/workflows/codeql.yml` — Quét bảo mật tự động (SQL injection, XSS, prototype pollution)
- Cloudflare CDN — Mã hóa TLS đầu cuối (Full Strict mode) giữa CDN và ALB

> **Toàn văn:** https://vanban.chinhphu.vn/?pageid=27160&docid=194589

---

### 1.3 Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân

**Nghị định:** Nghị định số 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân
**Ban hành:** 17/04/2023 bởi Chính phủ
**Có hiệu lực:** 01/07/2023

Đây là Nghị định bảo vệ dữ liệu cá nhân (PDPD) của Việt Nam, tương đương gần nhất với GDPR. Các điều khoản chính:

| Điều | Quy định | Áp dụng trong dự án |
|------|----------|-------------------|
| **Điều 3** | Giải thích từ ngữ — định nghĩa dữ liệu cá nhân | Hệ thống chỉ xử lý: tên đăng nhập, mật khẩu đã mã hóa, họ tên, số điện thoại, vai trò, hồ sơ nhân viên |
| **Điều 9** | Quyền của chủ thể dữ liệu (được biết, đồng ý, xóa, hạn chế xử lý) | Người dùng có thể đổi mật khẩu; MANAGER có thể xóa hồ sơ nhân viên |
| **Điều 11** | Trách nhiệm của bên kiểm soát dữ liệu (biện pháp kỹ thuật + tổ chức) | Mã hóa AES-256-GCM cho khóa API; RBAC; xác thực JWT; rate limiting |
| **Điều 21** | Xử lý dữ liệu không cần đồng ý (nghĩa vụ pháp lý, thực hiện hợp đồng) | Dữ liệu nhân viên xử lý theo hợp đồng lao động; dữ liệu người dùng theo thỏa thuận dịch vụ |

**Triển khai Privacy by Design:**
- Hệ thống KHÔNG thu thập dữ liệu cá nhân khách hàng — thanh toán qua QR diễn ra trực tiếp giữa khách hàng và ngân hàng
- Khóa API SePay được mã hóa khi lưu trữ bằng AES-256-GCM (khóa suy ra từ JWT_SECRET qua SHA-256)
- `backend/src/settings/settings.service.ts` — Phương thức `encrypt()` / `decrypt()` cho cài đặt nhạy cảm

> **Toàn văn (Tiếng Anh):** https://thuvienphapluat.vn/van-ban/EN/Cong-nghe-thong-tin/Decree-No-13-2023-ND-CP-dated-April-17-2023-on-protection-of-personal-data/564343/tieng-anh.aspx
> **Toàn văn (Tiếng Việt):** https://thuvienphapluat.vn/van-ban/Cong-nghe-thong-tin/Nghi-dinh-13-2023-ND-CP-bao-ve-du-lieu-ca-nhan-564343.aspx

---

### 1.4 Luật Giao dịch điện tử 2005

**Luật:** Luật Giao dịch điện tử số 51/2005/QH11
**Thông qua:** 29/11/2005 bởi Quốc hội (Khóa XI, Kỳ họp thứ 8)
**Có hiệu lực:** 01/03/2006

Luật này cung cấp khung pháp lý cho giao dịch điện tử tại Việt Nam. Các điều khoản liên quan:

| Điều | Quy định | Áp dụng trong dự án |
|------|----------|-------------------|
| **Điều 5** | Giá trị pháp lý của giao dịch điện tử | Đơn hàng, thanh toán và giao dịch được ghi nhận điện tử có giá trị pháp lý |
| **Điều 31** | Bảo mật giao dịch điện tử | Xác thực JWT; mã hóa HTTPS; kiểm tra đầu vào |
| **Điều 34** | Tính toàn vẹn dữ liệu điện tử | immudb cung cấp bằng chứng mật mã về tính toàn vẹn giao dịch |

**Triển khai:**
- Tất cả đơn hàng, thanh toán và giao dịch được ghi nhận điện tử với timestamp
- immudb cung cấp lưu trữ chống giả mạo, chỉ thêm không xóa cho lịch sử giao dịch
- `backend/src/transactions/immudb.service.ts` — Xác minh mật mã dữ liệu lưu trữ

> **Toàn văn (Tiếng Việt):** https://vanban.chinhphu.vn/default.aspx?pageid=27160&docid=29675
> **Toàn văn (Tiếng Anh):** https://vanbanphapluat.co/law-no-51-2005-qh11-of-november-29-2005-on-e-transactions

---

### 1.5 Luật Công nghệ thông tin 2006

**Luật:** Luật Công nghệ thông tin số 67/2006/QH11
**Thông qua:** 29/06/2006 bởi Quốc hội (Khóa XI, Kỳ họp thứ 9)
**Có hiệu lực:** 01/01/2007
**Lưu ý:** Được thay thế bởi Luật Chuyển đổi số số 148/2025/QH15 (có hiệu lực 01/07/2026)

Luật này cung cấp khung pháp lý cho ứng dụng và phát triển công nghệ thông tin tại Việt Nam. Các điều khoản liên quan:

| Điều | Quy định | Áp dụng trong dự án |
|------|----------|-------------------|
| **Điều 6** | Quyền và nghĩa vụ của tổ chức trong lĩnh vực CNTT | Dự án tuân thủ giấy phép mã nguồn mở; tôn trọng sở hữu trí tuệ của tất cả dependencies |
| **Điều 51** | Quản lý an toàn thông tin | Bảo mật nhiều lớp: xác thực JWT, RBAC, rate limiting, kiểm tra đầu vào, mã hóa secrets |

**Triển khai:**
- Tất cả dependencies đều là mã nguồn mở với giấy phép宽松 (MIT, Apache 2.0, BSD)
- Kiến trúc bảo mật tuân thủ nguyên tắc defense-in-depth

> **Toàn văn (Tiếng Anh):** https://www.wipo.int/wipolex/en/legislation/details/16315
> **Toàn văn (Tiếng Việt):** https://thuvienphapluat.vn/van-ban/Cong-nghe-thong-tin/Luat-Cong-nghe-thong-tin-2006-298865.aspx

---

### 1.6 Luật Sở hữu trí tuệ 2005

**Luật:** Luật Sở hữu trí tuệ số 50/2005/QH11
**Thông qua:** 29/11/2005 bởi Quốc hội
**Có hiệu lực:** 01/07/2006
**Sửa đổi:** 2009, 2019, 2022, 2025

Luật này bảo vệ sở hữu trí tuệ tại Việt Nam, bao gồm phần mềm. Các điều khoản chính:

| Điều | Quy định | Áp dụng trong dự án |
|------|----------|-------------------|
| **Điều 22** | Chương trình máy tính là tác phẩm được bảo vệ (tương đương tác phẩm văn học) | Mã nguồn là tác phẩm gốc của nhóm phát triển; được bảo vệ tự động khi tạo ra |
| **Điều 59** | Các đối tượng không được bảo hộ sáng chế (phần mềm thuần túy) | Phần mềm được bảo vệ bởi bản quyền, không phải bằng sáng chế |
| **Điều 75** | Bản quyền phát sinh tự động khi tạo ra | Không yêu cầu đăng ký, nhưng đăng ký là bằng chứng pháp lý quan trọng |

**Triển khai:**
- Tất cả mã nguồn gốc được bảo vệ bởi bản quyền khi tạo ra
- Dependencies sử dụng theo giấy phép mã nguồn mở tương ứng (MIT, Apache 2.0, BSD)
- Không sử dụng mã nguồn độc quyền từ bên thứ ba mà không có giấy phép phù hợp

> **Toàn văn (Tiếng Việt):** https://thuvienphapluat.vn/van-ban/Cong-nghe-thong-tin/Luat-Suu-huu-tri-tue-2005-298865.aspx
> **Bản dịch tiếng Anh:** https://www.wipo.int/wipolex/en/legislation/details/16315

---

### 1.7 Tuân thủ Bảo mật Thanh toán

Hệ thống thanh toán tích hợp với SePay (cổng thanh toán Việt Nam) và VietQR (tiêu chuẩn QR Việt Nam). Các biện pháp tuân thủ:

| Yêu cầu | Triển khai |
|---------|------------|
| **PCI DSS (điều chỉnh)** | Không xử lý dữ liệu thẻ; chỉ chuyển khoản ngân hàng qua SePay API. Hệ thống không bao giờ chạm vào thông tin ngân hàng thô. |
| **Bảo mật SePay API** | Khóa API được mã hóa khi lưu trữ (AES-256-GCM); lưu trong AWS Secrets Manager cho production |
| **Tiêu chuẩn VietQR** | Mã QR được tạo theo đặc tả VietQR (https://vietqr.net) với tài khoản ngân hàng, số tiền và mã thanh toán |
| **Tính toàn vẹn giao dịch** | immudb cung cấp nhật ký kiểm toán bất biến; khi đã ghi, giao dịch không thể sửa đổi hoặc xóa |
| **Khớp mã thanh toán** | Mã 12 ký tự alphanumeric cho mỗi đơn hàng; xác minh SePay khớp dựa trên mã trong mô tả giao dịch |

**Triển khai:**
- `backend/src/payments/payment.service.ts` — Tạo QR và xác minh SePay
- `backend/src/transactions/sepay.service.ts` — Tích hợp SePay API với khớp mã
- `backend/src/transactions/immudb.service.ts` — Ghi giao dịch bất biến

> **Tài liệu SePay API:** https://docs.sepay.vn/api-tai-khoan-ngan-hang.html
> **API Giao dịch SePay:** https://docs.sepay.vn/api-giao-dich.html
> **Tiêu chuẩn VietQR:** https://vietqr.net

---

## 2. Đạo đức Xã hội

### 2.1 Tính minh bạch và công bằng

| Nguyên tắc | Triển khai |
|------------|------------|
| **Lịch sử giao dịch bất biến** | immudb đảm bảo không ai (kể cả MANAGER) có thể sửa đổi hoặc xóa bản ghi thanh toán. Cung cấp bằng chứng mật mã về tính toàn vẹn tài chính. |
| **Phân quyền rõ ràng** | STAFF không thể sửa giá, quản lý bàn, hoặc truy cập thông tin lương. MANAGER có toàn quyền nhưng mọi hành động đều được ghi nhận. |
| **Không thu thập dữ liệu khách hàng** | POS không yêu cầu nhận dạng khách hàng. Thanh toán qua QR diễn ra trực tiếp giữa khách hàng và ngân hàng — hệ thống chỉ nhận kết quả xác minh từ SePay. |
| **Privacy by design** | Phù hợp với nguyên tắc Nghị định 13/2023/NĐ-CP: chỉ thu thập những gì cần thiết, bảo vệ những gì đã thu thập. |

### 2.2 Tác động xã hội tích cực

| Tác động | Mô tả |
|----------|-------|
| **Giảm sai sót vận hành** | Đặt hàng kỹ thuật số loại bỏ lỗi viết tay, cải thiện chất lượng dịch vụ cho khách hàng |
| **Quản lý thời gian thực** | Dashboard cung cấp doanh thu, trạng thái đơn hàng, tình trạng bàn theo thời gian thực — giúp ra quyết định kinh doanh kịp thời |
| **Chi phí vận hành thấp** | AWS Fargate Spot giảm chi phí hosting ~70% so với on-demand, giúp quán cà phê nhỏ tiếp cận công nghệ quản lý hiện đại |
| **Giao diện song ngữ** | Hỗ trợ tiếng Việt và tiếng Anh đảm bảo khả năng tiếp cận cho người dùng Việt Nam và khách quốc tế |

### 2.3 Trách nhiệm với cộng đồng

| Trách nhiệm | Triển khai |
|-------------|------------|
| **Tuân thủ mã nguồn mở** | Tất cả dependencies đều mã nguồn mở (NestJS, React, TypeORM, Vitest, Playwright). Giấy phép mỗi thư viện được tôn trọng và không vi phạm. |
| **Accessibility (WCAG)** | Điểm accessibility Lighthouse ≥ 0.9. Hệ thống có thể sử dụng bởi người khuyết tật. |
| **Không giám sát** | Hệ thống không theo dõi hành vi khách hàng, không thu thập dữ liệu cá nhân khách hàng, không triển khai tính năng giám sát. |

---

## 3. Đạo đức Nghề nghiệp

### 3.1 Bộ quy tắc đạo đức ACM/IEEE cho Kỹ sư phần mềm

Dự án tuân thủ **Software Engineering Code of Ethics and Professional Practice (Version 5.2)** được khuyến nghị bởi ACM/IEEE-CS Joint Task Force. Bộ quy tắc này chứa 8 nguyên tắc:

| # | Nguyên tắc | Mô tả | Áp dụng trong dự án |
|---|-----------|-------|-------------------|
| 1 | **PUBLIC** | Hành động phù hợp với lợi ích công cộng | Không thu thập dữ liệu khách hàng; thanh toán minh bạch qua nhật ký kiểm toán immudb |
| 2 | **CLIENT AND EMPLOYER** | Hành động vì lợi ích tốt nhất của khách hàng và người sử dụng lao động | Bảo vệ dữ liệu nhân viên (mã hóa, RBAC); secrets không bao giờ hard-code |
| 3 | **PRODUCT** | Đảm bảo sản phẩm đạt tiêu chuẩn nghề nghiệp cao nhất | 230 unit tests + E2E tests; CI/CD với 5 workflows; kiểm tra đầu vào |
| 4 | **JUDGMENT** | Duy trì tính chính trực và độc lập | Quy trình code review; không merge code chưa pass tests |
| 5 | **MANAGEMENT** | Thúc đẩy quản lý phần mềm đạo đức | RBAC với phân tách MANAGER/STAFF rõ ràng; nhật ký kiểm toán qua immudb |
| 6 | **PROFESSION** | Phát triển tính toàn vẹn nghề nghiệp | 9 file tài liệu toàn diện; tài liệu API Swagger tự động tạo |
| 7 | **COLLEAGUES** | Công bằng và hỗ trợ đồng nghiệp | Git workflow; quy trình PR review; tài liệu đầy đủ |
| 8 | **SELF** | Học tập suốt đời và thực hành đạo đức | Công nghệ mới nhất (NestJS 11, React 19, Vite 8); cập nhật dependencies tự động qua Dependabot |

> **Toàn văn:** https://www.acm.org/code-of-ethics/software-engineering-code
> **Tham chiếu IEEE:** https://www.computer.org/education/code-of-ethics

---

### 3.2 Tuân thủ OWASP Top 10 về bảo mật

Dự án xử lý các rủi ro bảo mật ứng dụng web OWASP Top 10:2021:

| Rủi ro OWASP | Xếp hạng | Giảm thiểu trong dự án |
|--------------|----------|----------------------|
| **A01: Broken Access Control** | #1 | Xác thực JWT + RBAC (MANAGER/STAFF); `RolesGuard` trên mọi endpoint được bảo vệ; `ProtectedRoute` trên frontend |
| **A02: Cryptographic Failures** | #2 | Băm mật khẩu argon2id; mã hóa AES-256-GCM cho khóa API; HTTP-only cookies; HTTPS qua Cloudflare |
| **A03: Injection** | #3 | Truy vấn tham số hóa TypeORM (không raw SQL); class-validator với `whitelist: true`; quét CodeQL |
| **A04: Insecure Design** | #4 | Defense-in-depth: CORS → Rate Limiter → JWT Auth → Roles Guard → Validation Pipe → Controller → Service |
| **A05: Security Misconfiguration** | #5 | Mặc định an toàn: `whitelist: true`, `forbidNonWhitelisted: true`; không có debug mode trong production |
| **A07: XSS** | #7 | React tự động escape theo mặc định; HTTP-only cookies ngăn JS truy cập token |
| **A08: Software and Data Integrity** | #8 | CI/CD pipeline với cổng kiểm tra; quét CodeQL; nhật ký kiểm toán bất biến immudb |
| **A09: Security Logging and Monitoring** | #9 | CloudWatch logs; GlobalExceptionFilter ghi tất cả lỗi; kiểm toán giao dịch immudb |

> **OWASP Top 10:2021:** https://owasp.org/Top10/
> **OWASP Broken Access Control:** https://owasp.org/Top10/A01_2021-Broken_Access_Control/
> **OWASP Injection:** https://owasp.org/Top10/A03_2021-Injection/

---

### 3.3 Nguyên tắc ISO/IEC 27001

Mặc dù chưa được chứng nhận chính thức, dự án triển khai các nguyên tắc chính từ ISO/IEC 27001 (Hệ thống Quản lý An toàn Thông tin):

| Nguyên tắc | Triển khai |
|------------|------------|
| **Tính bảo mật (Confidentiality)** | Băm mật khẩu argon2id; mã hóa AES-256-GCM cho khóa API; JWT cookies HTTP-only; AWS Secrets Manager |
| **Tính toàn vẹn (Integrity)** | Nhật ký kiểm toán bất biến immudb; ràng buộc khóa ngoại TypeORM; kiểm tra đầu vào qua class-validator |
| **Tính sẵn sàng (Availability)** | Graceful degradation (ứng dụng hoạt động mà không có immudb); ECS Fargate với health checks; bảo vệ DDoS Cloudflare |

> **Tổng quan ISO/IEC 27001:** https://www.iso.org/isoiec-27001-information-security.html

---

### 3.4 Bảo mật như trách nhiệm đạo đức

Bảo vệ dữ liệu người dùng và giao dịch tài chính không chỉ là yêu cầu kỹ thuật — đó là **trách nhiệm đạo đức** của người phát triển phần mềm (Nguyên tắc ACM/IEEE 1: PUBLIC):

| Trách nhiệm | Triển khai |
|-------------|------------|
| **Mật khẩu không bao giờ lưu plain text** | Băm argon2id là bắt buộc, không phải tùy chọn |
| **Khóa API mã hóa khi lưu trữ** | Mã hóa AES-256-GCM cho khóa API SePay trong cơ sở dữ liệu |
| **Secrets không bao giờ hard-code** | tất cả giá trị nhạy cảm quản lý qua AWS Secrets Manager; không bao giờ commit vào git |
| **Nguyên tắc đặc quyền tối thiểu** | Nhân viên chỉ có quyền truy cập tối thiểu cần thiết cho công việc; Quản lý có quyền cao hơn nhưng mọi hành động đều được ghi nhận |
| **Không có backdoor** | Mọi endpoint đều được bảo vệ bởi xác thực JWT và phân quyền dựa trên vai trò |

### 3.5 Minh bạch trong phát triển

| Thực hành | Triển khai |
|-----------|------------|
| **Không có backdoor** | Hệ thống không có cơ chế truy cập ẩn. Mọi endpoint đều được ghi trong Swagger. |
| **Nhật ký kiểm toán đầy đủ** | immudb cung cấp bằng chứng mật mã về mọi giao dịch — không thể sửa đổi hoặc xóa bởi bất kỳ ai |
| **Graceful degradation** | Hệ thống tiếp tục hoạt động khi immudb hoặc SePay gặp sự cố — không để lỗi hệ thống ảnh hưởng kinh doanh |
| **Kiểm thử toàn diện** | 230 unit tests + E2E tests chạy trên mỗi lần push; không merge code chưa pass tests |
| **Tài liệu hóa** | 9 file docs bao gồm kiến trúc, API, cơ sở dữ liệu, triển khai, CI/CD, môi trường, bắt đầu và sổ tay vận hành |

---

## 4. Tài liệu tham khảo

### Luật và quy định Việt Nam

| Văn bản | Liên kết |
|---------|----------|
| Luật An toàn thông tin mạng 2015 (86/2015/QH13) | https://vanban.chinhphu.vn/?pageid=27160&docid=183196 |
| Luật An ninh mạng 2018 (24/2018/QH14) | https://vanban.chinhphu.vn/?pageid=27160&docid=194589 |
| Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân | https://thuvienphapluat.vn/van-ban/EN/Cong-nghe-thong-tin/Decree-No-13-2023-ND-CP-dated-April-17-2023-on-protection-of-personal-data/564343/tieng-anh.aspx |
| Luật Giao dịch điện tử 2005 (51/2005/QH11) | https://vanban.chinhphu.vn/default.aspx?pageid=27160&docid=29675 |
| Luật Công nghệ thông tin 2006 (67/2006/QH11) | https://thuvienphapluat.vn/van-ban/Cong-nghe-thong-tin/Luat-Cong-nghe-thong-tin-2006-298865.aspx |
| Luật Sở hữu trí tuệ 2005 (50/2005/QH11) | https://thuvienphapluat.vn/van-ban/Cong-nghe-thong-tin/Luat-Suu-huu-tri-tue-2005-298865.aspx |

### Tiêu chuẩn và khung quốc tế

| Văn bản | Liên kết |
|---------|----------|
| ACM/IEEE Software Engineering Code of Ethics (v5.2) | https://www.acm.org/code-of-ethics/software-engineering-code |
| IEEE Code of Ethics for Software Engineers | https://www.computer.org/education/code-of-ethics |
| OWASP Top 10:2021 | https://owasp.org/Top10/ |
| ISO/IEC 27001 An toàn thông tin | https://www.iso.org/isoiec-27001-information-security.html |
| WIPO Lex (Bản dịch tiếng Anh Luật SHTT Việt Nam) | https://www.wipo.int/wipolex/en/legislation/details/16315 |

### Tài liệu tích hợp thanh toán

| Văn bản | Liên kết |
|---------|----------|
| SePay API Tài khoản ngân hàng | https://docs.sepay.vn/api-tai-khoan-ngan-hang.html |
| SePay API Giao dịch | https://docs.sepay.vn/api-giao-dich.html |
| Tiêu chuẩn VietQR | https://vietqr.net |

### Tham khảo ngành

| Văn bản | Liên kết |
|---------|----------|
| CVTA (Canada-Vietnam Tech Association) Code of Ethics | https://vicait.org/ethics/ |
| Burning Bros — Tiêu chuẩn chuyên môn IT tại Việt Nam | https://www.burningbros.io/blog/professionalism-standards-for-it-experts-in-vietnam-a-comprehensive-guide |
| Law Gratis — Đạo đức nghề nghiệp tại Việt Nam | https://www.lawgratis.com/blog-detail/professional-ethics-at-vietnam |

---

*Tài liệu này được biên soạn như một phần của dự án môn học Hệ thống POS & Quản lý Quán cà phê, 2026.*

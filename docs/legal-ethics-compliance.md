# Legal, Social Ethics & Professional Ethics Compliance

This document provides a comprehensive analysis of the legal, social ethics, and professional ethics considerations for the Coffee Shop POS & Management System. It maps each applicable law, ethical framework, and security standard to specific implementation decisions in the codebase.

---

## Table of Contents

- [1. Legal Compliance (Luật)](#1-legal-compliance-luật)
  - [1.1 Luật An toàn thông tin mạng 2015](#11-luật-an-toàn-thông-tin-mạng-2015)
  - [1.2 Luật An ninh mạng 2018](#12-luật-an-ninh-mạng-2018)
  - [1.3 Nghị định 13/2023/NĐ-CP (PDPD)](#13-nghị-định-132023nd-cp-pdpd)
  - [1.4 Luật Giao dịch điện tử 2005](#14-luật-giao-dịch-điện-tử-2005)
  - [1.5 Luật Công nghệ thông tin 2006](#15-luật-công-nghệ-thông-tin-2006)
  - [1.6 Luật Sở hữu trí tuệ 2005](#16-luật-sở-hữu-trí-tuệ-2005)
  - [1.7 Payment Security Compliance](#17-payment-security-compliance)
- [2. Social Ethics (Đạo đức xã hội)](#2-social-ethics-đạo-đức-xã-hội)
  - [2.1 Transparency and Fairness](#21-transparency-and-fairness)
  - [2.2 Positive Social Impact](#22-positive-social-impact)
  - [2.3 Community Responsibility](#23-community-responsibility)
- [3. Professional Ethics (Đạo đức nghề nghiệp)](#3-professional-ethics-đạo-đức-nghề-nghiệp)
  - [3.1 ACM/IEEE Software Engineering Code of Ethics](#31-acmieee-software-engineering-code-of-ethics)
  - [3.2 OWASP Top 10 Security Compliance](#32-owasp-top-10-security-compliance)
  - [3.3 ISO/IEC 27001 Principles](#33-isoiec-27001-principles)
  - [3.4 Security as Ethical Responsibility](#34-security-as-ethical-responsibility)
  - [3.5 Transparency in Development](#35-transparency-in-development)
- [4. References](#4-references)

---

## 1. Legal Compliance (Luật)

### 1.1 Luật An toàn thông tin mạng 2015

**Law:** Luật An toàn thông tin mạng số 86/2015/QH13
**Adopted:** 19/11/2015 by the National Assembly (Khóa XIII, Kỳ họp thứ 10)
**Effective:** 01/07/2016
**Amended by:** Luật số 35/2018/QH14 ngày 20/11/2018

This law governs the protection of information on networks in Vietnam. Key provisions relevant to this project:

| Article | Provision | Application in Project |
|---------|-----------|----------------------|
| **Điều 26** | Protection of personal information on networks | Passwords hashed with argon2id; JWT tokens via HTTP-only cookies; AWS Secrets Manager for sensitive config |
| **Điều 27** | Prohibition on collecting/storing personal data without consent | System collects minimal data (username, hashed password, role); no customer personal data collected |
| **Điều 28** | Responsibility to protect personal information | RBAC ensures only MANAGER can access sensitive employee data (salary, personal details) |

**Implementation:**
- `backend/src/auth/strategies/jwt.strategy.ts` — JWT authentication with HTTP-only cookies
- `backend/src/settings/settings.service.ts` — AES-256-GCM encryption for API keys at rest
- `backend/src/users/user.entity.ts` — Password field stored as argon2id hash, never plain text

> **Full text:** https://vanban.chinhphu.vn/?pageid=27160&docid=183196
> **English translation:** https://extendmax.vn/law-on-cybersecurity-no-86-2015-qh13

---

### 1.2 Luật An ninh mạng 2018

**Law:** Luật An ninh mạng số 24/2018/QH14
**Adopted:** 12/06/2018 by the National Assembly (Khóa XIV, Kỳ họp thứ 5)
**Effective:** 01/01/2019

This law governs cybersecurity protection and national security on cyberspace. Key provisions:

| Article | Provision | Application in Project |
|---------|-----------|----------------------|
| **Điều 8** | Prohibited acts including cyberattacks, data theft | Rate limiting (100 req/min), input validation, CORS configuration |
| **Điều 26** | Protection of personal information on cyberspace | HTTPS/TLS via Cloudflare Origin CA; Full Strict mode encryption |
| **Điều 29** | Cybersecurity requirements for information systems | CodeQL security scanning on every PR; dependency vulnerability scanning |

**Implementation:**
- `frontend/vite.config.ts` — CORS configuration for API access
- `.github/workflows/codeql.yml` — Automated security scanning (SQL injection, XSS, prototype pollution)
- Cloudflare CDN — End-to-end TLS encryption (Full Strict mode) between CDN and ALB

> **Full text:** https://vanban.chinhphu.vn/?pageid=27160&docid=194589

---

### 1.3 Nghị định 13/2023/NĐ-CP (PDPD)

**Decree:** Nghị định số 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân
**Issued:** 17/04/2023 by the Government
**Effective:** 01/07/2023

This is Vietnam's Personal Data Protection Decree (PDPD), the closest equivalent to GDPR. Key provisions:

| Article | Provision | Application in Project |
|---------|-----------|----------------------|
| **Điều 3** | Definition of personal data | System only processes: username, hashed password, full name, phone, role, employee records |
| **Điều 9** | Rights of data subjects (know, consent, delete, restrict) | Users can change passwords; MANAGER can delete employee records |
| **Điều 11** | Responsibilities of data controllers (technical + organizational measures) | AES-256-GCM encryption for API keys; RBAC; JWT auth; rate limiting |
| **Điều 21** | Data processing without consent (legal obligation, contract performance) | Employee data processed under employment contract; user data under service agreement |

**Privacy by Design implementation:**
- System does NOT collect customer personal data — payment via QR code happens directly between customer and bank
- SePay API key encrypted at rest using AES-256-GCM (key derived from JWT_SECRET via SHA-256)
- `backend/src/settings/settings.service.ts` — `encrypt()` / `decrypt()` methods for sensitive settings

> **Full text (English):** https://thuvienphapluat.vn/van-ban/EN/Cong-nghe-thong-tin/Decree-No-13-2023-ND-CP-dated-April-17-2023-on-protection-of-personal-data/564343/tieng-anh.aspx
> **Full text (Vietnamese):** https://thuvienphapluat.vn/van-ban/Cong-nghe-thong-tin/Nghi-dinh-13-2023-ND-CP-bao-ve-du-lieu-ca-nhan-564343.aspx

---

### 1.4 Luật Giao dịch điện tử 2005

**Law:** Luật Giao dịch điện tử số 51/2005/QH11
**Adopted:** 29/11/2005 by the National Assembly (Khóa XI, Kỳ họp thứ 8)
**Effective:** 01/03/2006

This law provides the legal framework for electronic transactions in Vietnam. Relevant provisions:

| Article | Provision | Application in Project |
|---------|-----------|----------------------|
| **Điều 5** | Legal validity of electronic transactions | Orders, payments, and transactions recorded digitally have legal validity |
| **Điều 31** | Security of electronic transactions | JWT authentication; HTTPS encryption; input validation |
| **Điều 34** | Integrity of electronic data | immudb immutable audit log provides cryptographic proof of transaction integrity |

**Implementation:**
- All orders, payments, and transactions are recorded digitally with timestamps
- immudb provides tamper-proof, append-only storage for transaction history
- `backend/src/transactions/immudb.service.ts` — Cryptographic verification of stored data

> **Full text (Vietnamese):** https://vanban.chinhphu.vn/default.aspx?pageid=27160&docid=29675
> **Full text (English):** https://vanbanphapluat.co/law-no-51-2005-qh11-of-november-29-2005-on-e-transactions

---

### 1.5 Luật Công nghệ thông tin 2006

**Law:** Luật Công nghệ thông tin số 67/2006/QH11
**Adopted:** 29/06/2006 by the National Assembly (Khóa XI, Kỳ họp thứ 9)
**Effective:** 01/01/2007
**Note:** Replaced by Luật Chuyển đổi số số 148/2025/QH15 (effective 01/07/2026)

This law provides the legal framework for IT application and development in Vietnam. Relevant provisions:

| Article | Provision | Application in Project |
|---------|-----------|----------------------|
| **Điều 6** | Rights and obligations of organizations in IT | Project follows open-source licensing; respects intellectual property of all dependencies |
| **Điều 51** | Information security management | Multi-layered security: JWT auth, RBAC, rate limiting, input validation, encrypted secrets |

**Implementation:**
- All dependencies are open-source with permissive licenses (MIT, Apache 2.0, BSD)
- Security architecture follows defense-in-depth principle

> **Full text (English):** https://www.wipo.int/wipolex/en/legislation/details/16315
> **Full text (Vietnamese):** https://thuvienphapluat.vn/van-ban/Cong-nghe-thong-tin/Luat-Cong-nghe-thong-tin-2006-298865.aspx

---

### 1.6 Luật Sở hữu trí tuệ 2005

**Law:** Luật Sở hữu trí tuệ số 50/2005/QH11
**Adopted:** 29/11/2005 by the National Assembly
**Effective:** 01/07/2006
**Amended:** 2009, 2019, 2022, 2025

This law protects intellectual property in Vietnam, including software. Key provisions:

| Article | Provision | Application in Project |
|---------|-----------|----------------------|
| **Điều 22** | Computer programs as protected works (equivalent to literary works) | Source code is original work of the development team; protected automatically upon creation |
| **Điều 59** | Objects not protected as inventions (software per se) | Software is protected by copyright, not patent |
| **Điều 75** | Copyright arises automatically upon creation | No registration required, but registration serves as legal evidence |

**Implementation:**
- All original source code is protected by copyright upon creation
- Dependencies used under their respective open-source licenses (MIT, Apache 2.0, BSD)
- No proprietary code from third parties is used without proper licensing

> **Full text (Vietnamese):** https://thuvienphapluat.vn/van-ban/Cong-nghe-thong-tin/Luat-Suu-huu-tri-tue-2005-298865.aspx
> **English translation:** https://www.wipo.int/wipolex/en/legislation/details/16315

---

### 1.7 Payment Security Compliance

The payment system integrates with SePay (Vietnamese payment aggregator) and VietQR (Vietnamese QR standard). Compliance measures:

| Requirement | Implementation |
|-------------|---------------|
| **PCI DSS (adapted)** | No card data processed; bank transfers only via SePay API. System never touches raw bank credentials. |
| **SePay API Security** | API key encrypted at rest (AES-256-GCM); stored in AWS Secrets Manager for production |
| **VietQR Standard** | QR codes generated per VietQR specification (https://vietqr.net) with bank account, amount, and payment code |
| **Transaction Integrity** | immudb provides immutable audit trail; once logged, transactions cannot be modified or deleted |
| **Payment Code Matching** | 12-character alphanumeric code per order; SePay verification matches by code in transaction description |

**Implementation:**
- `backend/src/payments/payment.service.ts` — QR generation and SePay verification
- `backend/src/transactions/sepay.service.ts` — SePay API integration with code-based matching
- `backend/src/transactions/immudb.service.ts` — Immutable transaction logging

> **SePay API Documentation:** https://docs.sepay.vn/api-tai-khoan-ngan-hang.html
> **SePay Transaction API:** https://docs.sepay.vn/api-giao-dich.html
> **VietQR Standard:** https://vietqr.net

---

## 2. Social Ethics (Đạo đức xã hội)

### 2.1 Transparency and Fairness

| Principle | Implementation |
|-----------|---------------|
| **Immutable transaction history** | immudb ensures no one (not even MANAGER) can modify or delete payment records. Provides cryptographic proof of financial integrity. |
| **Clear role separation** | STAFF cannot modify prices, manage tables, or access salary information. MANAGER has full access but all actions are recorded. |
| **No customer data collection** | POS system does not require customer identification. Payment via QR happens directly between customer and bank — system only receives verification result from SePay. |
| **Privacy by design** | Consistent with Nghị định 13/2023/NĐ-CP principle: collect only what is necessary, protect what is collected. |

### 2.2 Positive Social Impact

| Impact | Description |
|--------|-------------|
| **Reduced operational errors** | Digital ordering eliminates handwritten order mistakes, improving service quality for customers |
| **Real-time management visibility** | Dashboard provides live revenue, order status, and table occupancy — enabling informed business decisions during peak hours |
| **Low operational cost** | AWS Fargate Spot reduces hosting costs by ~70% compared to on-demand, making modern management technology accessible to small coffee shops |
| **Bilingual interface** | Vietnamese and English support ensures accessibility for Vietnamese users and international visitors |

### 2.3 Community Responsibility

| Responsibility | Implementation |
|----------------|---------------|
| **Open-source compliance** | All dependencies are open-source (NestJS, React, TypeORM, Vitest, Playwright). Each library's license is respected and not violated. |
| **Accessibility (WCAG)** | Lighthouse accessibility score ≥ 0.9. System usable by people with disabilities. |
| **No surveillance** | System does not track customer behavior, collect customer personal data, or implement surveillance features. |

---

## 3. Professional Ethics (Đạo đức nghề nghiệp)

### 3.1 ACM/IEEE Software Engineering Code of Ethics

The project adheres to the **Software Engineering Code of Ethics and Professional Practice (Version 5.2)** recommended by the ACM/IEEE-CS Joint Task Force. This code contains 8 principles:

| # | Principle | Description | Application in Project |
|---|-----------|-------------|----------------------|
| 1 | **PUBLIC** | Act consistently with the public interest | No customer data collection; transparent payment via immudb audit log |
| 2 | **CLIENT AND EMPLOYER** | Act in best interest of client/employer | Employee data protection (encryption, RBAC); secrets never hard-coded |
| 3 | **PRODUCT** | Meet highest professional standards | 230 unit tests + E2E tests; CI/CD with 5 workflows; input validation |
| 4 | **JUDGMENT** | Maintain integrity and independence | Code review process; no merge without passing tests |
| 5 | **MANAGEMENT** | Promote ethical software management | RBAC with clear MANAGER/STAFF separation; audit trail via immudb |
| 6 | **PROFESSION** | Advance integrity of the profession | 9 comprehensive docs files; auto-generated Swagger API docs |
| 7 | **COLLEAGUES** | Be fair and supportive of colleagues | Git workflow; PR review process; comprehensive documentation |
| 8 | **SELF** | Lifelong learning and ethical practice | Latest technologies (NestJS 11, React 19, Vite 8); automated dependency updates via Dependabot |

> **Full text:** https://www.acm.org/code-of-ethics/software-engineering-code
> **IEEE reference:** https://www.computer.org/education/code-of-ethics

---

### 3.2 OWASP Top 10 Security Compliance

The project addresses the OWASP Top 10:2021 web application security risks:

| OWASP Risk | Ranking | Mitigation in Project |
|------------|---------|----------------------|
| **A01: Broken Access Control** | #1 | JWT authentication + RBAC (MANAGER/STAFF); `RolesGuard` on every protected endpoint; `ProtectedRoute` on frontend |
| **A02: Cryptographic Failures** | #2 | argon2id password hashing; AES-256-GCM for API keys; HTTP-only cookies; HTTPS via Cloudflare |
| **A03: Injection** | #3 | TypeORM parameterized queries (no raw SQL); class-validator with `whitelist: true`; CodeQL scanning |
| **A04: Insecure Design** | #4 | Defense-in-depth: CORS → Rate Limiter → JWT Auth → Roles Guard → Validation Pipe → Controller → Service |
| **A05: Security Misconfiguration** | #5 | Secure defaults: `whitelist: true`, `forbidNonWhitelisted: true`; no debug mode in production |
| **A07: XSS** | #7 | React auto-escapes by default; HTTP-only cookies prevent JS access to tokens |
| **A08: Software and Data Integrity** | #8 | CI/CD pipeline with test gates; CodeQL scanning; immudb immutable audit log |
| **A09: Security Logging and Monitoring** | #9 | CloudWatch logs; GlobalExceptionFilter logs all errors; immudb transaction audit |

> **OWASP Top 10:2021:** https://owasp.org/Top10/
> **OWASP Broken Access Control:** https://owasp.org/Top10/A01_2021-Broken_Access_Control/
> **OWASP Injection:** https://owasp.org/Top10/A03_2021-Injection/

---

### 3.3 ISO/IEC 27001 Principles

While not formally certified, the project implements key principles from ISO/IEC 27001 (Information Security Management System):

| Principle | Implementation |
|-----------|---------------|
| **Confidentiality** | argon2id password hashing; AES-256-GCM encryption for API keys; HTTP-only JWT cookies; AWS Secrets Manager |
| **Integrity** | immudb immutable audit log; TypeORM foreign key constraints; input validation via class-validator |
| **Availability** | Graceful degradation (app works without immudb); ECS Fargate with health checks; Cloudflare DDoS protection |

> **ISO/IEC 27001 overview:** https://www.iso.org/isoiec-27001-information-security.html

---

### 3.4 Security as Ethical Responsibility

Protecting user data and financial transactions is not just a technical requirement — it is an **ethical responsibility** of software developers (ACM/IEEE Principle 1: PUBLIC):

| Responsibility | Implementation |
|----------------|---------------|
| **Passwords never stored in plain text** | argon2id hashing is mandatory, not optional |
| **API keys encrypted at rest** | AES-256-GCM encryption for SePay API key in database |
| **Secrets never hard-coded** | All sensitive values managed via AWS Secrets Manager; never committed to git |
| **Least privilege principle** | Staff have minimum access needed for their role; Manager has elevated access but all actions are recorded |
| **No backdoors** | Every endpoint protected by JWT authentication and role-based authorization |

### 3.5 Transparency in Development

| Practice | Implementation |
|----------|---------------|
| **No backdoors** | System has no hidden access mechanisms. All endpoints documented in Swagger. |
| **Full audit trail** | immudb provides cryptographic proof of every transaction — cannot be modified or deleted by anyone |
| **Graceful degradation** | System continues operating when immudb or SePay is unavailable — no system failure impacts business operations |
| **Comprehensive testing** | 230 unit tests + E2E tests run on every push; no merge without passing tests |
| **Documentation** | 9 docs files covering architecture, API, database, deployment, CI/CD, environment, getting started, and runbook |

---

## 4. References

### Vietnamese Laws and Regulations

| Document | Link |
|----------|------|
| Luật An toàn thông tin mạng 2015 (86/2015/QH13) | https://vanban.chinhphu.vn/?pageid=27160&docid=183196 |
| Luật An ninh mạng 2018 (24/2018/QH14) | https://vanban.chinhphu.vn/?pageid=27160&docid=194589 |
| Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân | https://thuvienphapluat.vn/van-ban/EN/Cong-nghe-thong-tin/Decree-No-13-2023-ND-CP-dated-April-17-2023-on-protection-of-personal-data/564343/tieng-anh.aspx |
| Luật Giao dịch điện tử 2005 (51/2005/QH11) | https://vanban.chinhphu.vn/default.aspx?pageid=27160&docid=29675 |
| Luật Công nghệ thông tin 2006 (67/2006/QH11) | https://thuvienphapluat.vn/van-ban/Cong-nghe-thong-tin/Luat-Cong-nghe-thong-tin-2006-298865.aspx |
| Luật Sở hữu trí tuệ 2005 (50/2005/QH11) | https://thuvienphapluat.vn/van-ban/Cong-nghe-thong-tin/Luat-Suu-huu-tri-tue-2005-298865.aspx |

### International Standards and Frameworks

| Document | Link |
|----------|------|
| ACM/IEEE Software Engineering Code of Ethics (v5.2) | https://www.acm.org/code-of-ethics/software-engineering-code |
| IEEE Code of Ethics for Software Engineers | https://www.computer.org/education/code-of-ethics |
| OWASP Top 10:2021 | https://owasp.org/Top10/ |
| ISO/IEC 27001 Information Security | https://www.iso.org/isoiec-27001-information-security.html |
| WIPO Lex (Vietnam IP Law English translation) | https://www.wipo.int/wipolex/en/legislation/details/16315 |

### Payment Integration Documentation

| Document | Link |
|----------|------|
| SePay Bank Account API | https://docs.sepay.vn/api-tai-khoan-ngan-hang.html |
| SePay Transaction API | https://docs.sepay.vn/api-giao-dich.html |
| VietQR Standard | https://vietqr.net |

### Industry References

| Document | Link |
|----------|------|
| CVTA (Canada-Vietnam Tech Association) Code of Ethics | https://vicait.org/ethics/ |
| Burning Bros — IT Professionalism Standards in Vietnam | https://www.burningbros.io/blog/professionalism-standards-for-it-experts-in-vietnam-a-comprehensive-guide |
| Law Gratis — Professional Ethics in Vietnam | https://www.lawgratis.com/blog-detail/professional-ethics-at-vietnam |

---

*This document was compiled as part of the Coffee Shop POS & Management System course project, 2026.*

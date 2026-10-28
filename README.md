# Scholarship Eligibility and Application Deadline Navigator (AidPath)

> **AidPath** is an end-to-end web application that eliminates scattered scholarship deadlines, ambiguous eligibility criteria, and unorganized document preparation. Built with a reassuring education-navigator aesthetic featuring light blue, crisp white, and deep plum surfaces, with progress rails and itemized explanation cards.

---

## 🌟 Key Features

1. **Curated Sourced Scholarship Directory**
   - High-value awards ($1,000 – $20,000) sourced from genuine foundations and institutions.
   - Sourced provider links, verified deadlines, renewable flags, and award amounts.
   - Real-time search, multi-criteria filtering (education level, discipline, need vs. merit, verification status), and dynamic sorting.

2. **Last-Verified Dates & 90-Day SLA Staleness Tracking**
   - Every scholarship tracks `last_verified_at`, `verified_by_name`, and verification notes.
   - Built-in SLA automation: Opportunities unverified for > 90 days are automatically flagged as stale (`flagged_stale`) with an amber warning banner.

3. **Rule-Based Eligibility Explanation Engine**
   - Evaluates applicant profiles against mandatory and soft criteria:
     - Cumulative GPA benchmarks
     - Education level alignment (High School Senior, Undergrad, Grad)
     - Major and discipline matching (including cross-disciplinary STEM & arts)
     - Citizenship and legal residency status
     - Household income ceilings / demonstrated financial need
     - First-generation college student mandates
     - Preferred identity / demographic focus tags
   - Generates transparent, itemized explanation cards with explicit `PASS`, `WARNING`, `FAIL`, or `INFO` statuses, user values vs. requirements, and actionable tips.
   - Calculates match score percentage and categorization: `ELIGIBLE` (100% mandatory met), `PARTIALLY_ELIGIBLE`, or `INELIGIBLE`.

4. **Document Preparation Checklists**
   - Automatically instantiates custom required document checklists when a scholarship is saved (e.g., Official Transcripts, Letters of Recommendation, Personal Statements, FAFSA Student Aid Reports, Portfolios).
   - Students update document readiness status: `Missing`, `In Progress`, `Ready / Prepared`, `Submitted`.
   - Simulates file attachments and stores personal notes per item.
   - Live application readiness progress rail recalculates completion percentage in real time.

5. **Opportunity Pipeline & Stage Transitions**
   - 6-stage lifecycle: `Considering` &rarr; `Preparing Documents` &rarr; `Submitted` &rarr; `Under Review` &rarr; `Awarded` &rarr; `Declined`.
   - Real-time deadline countdowns with urgency color coding (`Urgent: <= 3 days`, `Urgent: <= 14 days`, `Upcoming`, `Expired`).
   - Tracks total potential aid in pipeline and total secured/won aid.
   - Every stage transition records an immutable audit log entry.

6. **Operator Stale-Record Review Desk**
   - Dedicated workflow for staff (`operator` & `admin`) to audit opportunities exceeding the 90-day verification SLA.
   - Operators open official sponsor portals, confirm active deadlines and award amounts, enter verification findings, and click "Confirm & Mark Verified Today".
   - Immediately clears staleness flag and logs verification audit records.

7. **Administration, Operational Metrics & Immutable Audit Trail**
   - Operational dashboard tracking total funding in directory, verification SLA compliance %, active students, and audit event counts.
   - Curate new scholarships with custom rules and document checklist templates.
   - Full audit trail viewer inspecting timestamp, actor, role, action, and JSON event details.

8. **One-Click Persona Switcher**
   - Seamless role switching in the navigation bar to test all user boundaries without re-authenticating:
     - 👩‍🎓 **Elena Rostova** (Student): Undergrad CS, 3.82 GPA, First-Gen, $48k income.
     - 👨‍🎓 **Marcus Chen** (Student): High School Senior, Biology/Pre-Med, 3.40 GPA, $72k income.
     - 👩‍💼 **Sarah Jenkins** (Operator / Staff): Verification coordinator. Access to Stale Record Review Desk.
     - 👨‍🏫 **Dr. Arthur Vance** (Administrator): Program director. Full curation, metrics, and audit log access.
     - 👤 **Guest Visitor**: Public browsing and interactive quick eligibility calculator.

---

## 🛠️ System Architecture

- **Frontend**: Semantic HTML5, Custom CSS3 Design System, Vanilla JavaScript (ES Modules). Zero heavy framework dependencies.
- **Backend**: Node.js & Express 5 REST API.
- **Database**: Supabase PostgreSQL with complete migrations (`01_schema.sql`), synthetic seed data (`01_seed_scholarships.sql`), and Row Level Security (RLS) policies.
- **Resilience Fallback**: Includes pre-seeded in-memory relational data store that functions immediately out of the box when remote Supabase credentials are not configured, ensuring zero test friction.

```
AidPath Project/
├── .env.example                       # Environment template
├── .env                               # Local configuration
├── package.json                       # Dependencies & execution scripts
├── README.md                          # Documentation & completion report
├── database/
│   ├── migrations/
│   │   └── 01_schema.sql              # PostgreSQL DDL, tables, triggers & RLS
│   ├── seeds/
│   │   └── 01_seed_scholarships.sql   # Realistic synthetic seed data
│   └── test_db_setup.js               # Supabase connection & schema verification
├── server/
│   ├── config/
│   │   ├── env.js                     # Config loader
│   │   └── supabase.js                # Supabase client & resilient repository
│   ├── middleware/
│   │   ├── auth.js                    # Identity & RBAC middleware
│   │   └── errorHandler.js            # Centralized API error handler
│   ├── services/
│   │   ├── eligibilityEngine.js       # Rule-based eligibility explanation engine
│   │   ├── scholarshipService.js      # Sourced directory, staleness & verification
│   │   ├── applicationService.js      # Pipeline stages & deadline countdowns
│   │   ├── checklistService.js        # Document checklist state & attachments
│   │   ├── auditService.js            # Immutable audit logging
│   │   └── metricsService.js          # Student & operational statistics
│   ├── routes/
│   │   ├── authRoutes.js              # /api/auth
│   │   ├── scholarshipRoutes.js       # /api/scholarships
│   │   ├── eligibilityRoutes.js       # /api/eligibility
│   │   ├── applicationRoutes.js       # /api/applications
│   │   ├── checklistRoutes.js         # /api/checklists
│   │   ├── auditRoutes.js             # /api/audit-logs
│   │   └── metricsRoutes.js           # /api/metrics
│   └── index.js                       # Express bootstrap & static server
├── public/
│   ├── index.html                     # Application HTML shell
│   ├── css/
│   │   └── styles.css                 # Reassuring light blue, white & plum design system
│   └── js/
│       ├── api.js                     # API client wrapper
│       ├── state.js                   # Reactive state store
│       ├── app.js                     # Router, notifications, persona switcher
│       └── components/
│           ├── landing.js             # Hero & Profile->Match->Prepare->Apply rail
│           ├── directory.js           # Curated catalog, search, filter, sort
│           ├── eligibility.js         # Rule breakdown explanation cards
│           ├── applications.js        # Opportunity pipeline & urgency rails
│           ├── checklist.js           # Document preparation manager
│           ├── staleReview.js         # Operator stale record review desk
│           ├── admin.js               # Administration, curation & audit trail
│           └── profileModal.js        # Student profile criteria editor
└── tests/
    └── run-tests.js                   # Automated test suite (11 test cases)
```

---

## 🚀 Quickstart & Execution

### 1. Prerequisites
- **Node.js** v18+ or v24+
- **pnpm** (or npm)

### 2. Installation
```powershell
pnpm install
```

### 3. Running the Application
```powershell
pnpm start
```
The server will start listening at:
**`http://localhost:3000`**

Open your browser and navigate to `http://localhost:3000`.

---

## 🗄️ Supabase PostgreSQL Configuration

The application is engineered to connect directly to Supabase PostgreSQL or run in resilient fallback mode.

### Current Database Connection Status:
- **Supabase Cloud Project**: `uhzdmdrywgweserluara` (`https://uhzdmdrywgweserluara.supabase.co`)
- **Connection Mode**: Live Supabase PostgreSQL
- **Schema & Seed**: Applied and verified across all 8 tables (`profiles`, `scholarships`, `scholarship_requirements`, `scholarship_documents`, `saved_scholarships`, `application_checklists`, `verification_reviews`, `audit_logs`).
- **Health Verification**: `/api/health` reports `supabase_connected: true`.

---

## 🧪 Automated Testing

AidPath includes an automated test suite covering unit rules, API integration, staleness transitions, and role boundaries:

```powershell
pnpm test
```

### Tests executed:
- **Rule-Based Eligibility Engine**:
  - GPA threshold passing vs. borderline warning vs. failure.
  - Major and degree standing exclusions.
  - First-generation and need-based threshold confirmations.
- **Curated Directory & Staleness**:
  - Retrieval of active curated scholarships with computed days unverified.
  - Keyword and multi-filter precision.
  - Operator verification resetting staleness and writing audit history.
- **Application Pipeline**:
  - Opportunity saving and automatic checklist generation.
  - Multi-stage progression (`considering` &rarr; `preparing` &rarr; `submitted`).
- **Document Checklist**:
  - Document status updates (`missing` &rarr; `ready`) and file attachment simulation.
- **Operational & Student Metrics**:
  - Verification SLA rate and total funding calculations.
  - Student pipeline valuation and checklist health score.
- **Security & Role Boundaries**:
  - Verification that student personas are denied access (HTTP 403 Forbidden) when requesting operator/admin-only endpoints.

---

## 📡 API Reference Overview

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `GET` | `/api/health` | Service and Supabase database connection health | Public |
| `GET` | `/api/auth/me` | Current persona profile | Public |
| `GET` | `/api/auth/personas` | Seeded demo personas for one-click testing | Public |
| `PUT` | `/api/auth/profile` | Update student profile academic & financial criteria | Student |
| `GET` | `/api/scholarships` | Search, filter, and sort curated directory | Public |
| `GET` | `/api/scholarships/:id` | Detailed scholarship rules and document templates | Public |
| `GET` | `/api/scholarships/stale/list` | Stale scholarships exceeding 90-day SLA | Operator / Admin |
| `POST` | `/api/scholarships/:id/verify` | Verify scholarship and reset staleness | Operator / Admin |
| `POST` | `/api/scholarships` | Curate and publish new scholarship | Admin |
| `POST` | `/api/eligibility/evaluate-all` | Batch evaluate rules across all directory awards | Public / Student |
| `POST` | `/api/eligibility/check-single` | Single scholarship itemized rule breakdown | Public / Student |
| `POST` | `/api/eligibility/quick-check` | Anonymous quick match calculator for landing hero | Visitor |
| `GET` | `/api/applications` | Student saved opportunities with stage & deadlines | Student |
| `POST` | `/api/applications` | Save scholarship to tracker (auto-instantiates checklist) | Student |
| `PATCH`| `/api/applications/:id/stage` | Transition application lifecycle stage | Student |
| `DELETE`| `/api/applications/:id` | Remove opportunity from pipeline | Student |
| `GET` | `/api/checklists/:savedId` | Document preparation checklist for an application | Student |
| `PATCH`| `/api/checklists/item/:itemId` | Update document readiness status, notes, or file | Student |
| `GET` | `/api/metrics/student` | Personalized student pipeline & readiness stats | Student |
| `GET` | `/api/metrics/operational` | System SLA compliance, stale counts & fund total | Operator / Admin |
| `GET` | `/api/audit-logs` | Immutable audit trail with actor and detail logs | Operator / Admin |

---

## 📋 Completion Report

- **Curated Sourced Directory**: Complete with 8 realistic foundation & university awards, official URLs, renewable flags, and deadlines.
- **Last-Verified Dates & Staleness Review**: Fully implemented with 90-day threshold calculation, stale review table, link verification form, and audit logging.
- **Rule-Based Eligibility Engine**: Complete with itemized breakdown cards explaining GPA, degree level, major, citizenship, need, and first-gen status.
- **Document Checklist**: Auto-generated on save with status dropdowns, file attachments, and live progress bars.
- **Application Pipeline**: 6-stage lifecycle with deadline countdown badges and award tracking.
- **UI/UX Aesthetics**: Reassuring educational navigator with custom CSS3 light blue, white, and plum palette; zero dead buttons or fake confirmations.
- **Tests Run**: 11 automated test cases passing with zero errors; live HTTP end-to-end testing verified.

/**
 * CVA IT Policy Templates
 * Run with: npm run db:seed:policies
 *
 * Seeds 12 comprehensive IT policies tailored for Central Valley Ag (CVA),
 * an agricultural cooperative. All policies are set to PUBLISHED with an
 * annual review schedule. Replace [CVA-CONTACT] and [CVA-SYSTEM] placeholders
 * with actual names/systems.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ONE_YEAR = new Date();
ONE_YEAR.setFullYear(ONE_YEAR.getFullYear() + 1);

const policies = [
  {
    title: "Information Security Policy",
    slug: "information-security-policy",
    category: "Security",
    summary: "Master IT security policy establishing CVA's security program, principles, and responsibilities.",
    tags: ["Security", "Compliance", "Governance"],
    content: `# Information Security Policy

**Owner:** IT Department — Chief Technology Officer
**Classification:** Internal
**Review Frequency:** Annual

---

## 1. Purpose

This Information Security Policy establishes Central Valley Ag's (CVA) commitment to protecting the confidentiality, integrity, and availability of all information assets. It defines the security program, assigns accountability, and provides the foundation for all subordinate security policies and standards.

## 2. Scope

This policy applies to all CVA employees, contractors, vendors, and third parties who access CVA information systems, networks, data, or facilities. It covers all CVA-owned, leased, or managed systems and data regardless of location.

## 3. Policy Statement

CVA is committed to:
- Protecting the confidentiality of farmer data, member financial information, and business-sensitive data
- Maintaining the integrity and accuracy of all operational and financial records
- Ensuring the availability of critical agricultural management systems and communications
- Complying with all applicable laws, regulations, and contractual obligations related to information security

## 4. Security Program

CVA maintains an Information Security Program that includes:

### 4.1 Risk Management
- Annual risk assessments covering all critical information systems
- Risk treatment plans reviewed and approved by senior leadership
- Continuous monitoring of the threat landscape relevant to agricultural cooperatives

### 4.2 Security Controls
CVA implements security controls aligned with the **NIST Cybersecurity Framework** and **CIS Controls**, including:
- Access management and least-privilege principles
- Endpoint protection on all managed devices
- Network segmentation between operational (OT/precision ag) and corporate IT systems
- Encryption of data in transit and at rest for Confidential and Restricted data
- Regular vulnerability scanning and patch management
- Security event logging and monitoring

### 4.3 Incident Response
CVA maintains an Incident Response Plan to detect, contain, and recover from security incidents. All employees are required to report suspected incidents immediately to [CVA-CONTACT: IT Security].

### 4.4 Business Continuity
Critical systems are protected by documented business continuity and disaster recovery plans, tested at least annually.

## 5. Roles and Responsibilities

| Role | Responsibility |
|------|---------------|
| CTO | Owns the security program; accountable to leadership |
| IT Team | Implements and maintains security controls |
| All Employees | Comply with policies; report incidents and anomalies |
| Managers | Ensure team compliance; support security training |
| Vendors/Third Parties | Comply with CVA security requirements per contract |

## 6. Security Awareness

All employees must complete security awareness training:
- Upon hire (within 30 days)
- Annually thereafter
- Following significant incidents or policy changes

## 7. Policy Hierarchy

This policy is the top-level document. Supporting policies include:
- Acceptable Use Policy
- Password Management Policy
- Data Classification Policy
- Incident Response Plan
- Network Security Policy
- And others as listed in the CVA IT Policy Register

## 8. Compliance and Enforcement

Violations of this policy may result in disciplinary action, up to and including termination of employment or contract. Violations involving legal or regulatory breaches will be reported to appropriate authorities.

## 9. Exceptions

Exceptions to this policy must be documented, risk-assessed, and approved by the CTO. Exceptions are time-limited and subject to review.

## 10. Review

This policy is reviewed annually or following significant changes to CVA's business, technology environment, or regulatory requirements.
`,
  },

  {
    title: "Incident Response Plan",
    slug: "incident-response-plan",
    category: "Security",
    summary: "Procedures for detecting, responding to, and recovering from IT security incidents.",
    tags: ["Security", "Compliance"],
    content: `# Incident Response Plan

**Owner:** IT Department — Chief Technology Officer
**Classification:** Confidential
**Review Frequency:** Annual

---

## 1. Purpose

This plan establishes procedures for identifying, containing, investigating, and recovering from information security incidents at Central Valley Ag. Effective incident response minimizes damage, reduces recovery time, and protects CVA's members, data, and reputation.

## 2. Scope

This plan covers all security incidents involving CVA information systems, data, networks, employees, and third-party services.

## 3. Incident Definition

A **security incident** is any event that threatens the confidentiality, integrity, or availability of CVA information or systems, including but not limited to:
- Unauthorized access or data breaches
- Ransomware or malware infections
- Phishing attacks (successful or attempted)
- Insider threats
- System outages caused by attack
- Loss or theft of devices containing CVA data

## 4. Incident Classification

| Severity | Description | Response Time |
|----------|-------------|---------------|
| **P1 — Critical** | Active breach, ransomware, data exfiltration | Immediate (< 1 hour) |
| **P2 — High** | Confirmed compromise, service disruption | < 4 hours |
| **P3 — Medium** | Suspected compromise, policy violation | < 24 hours |
| **P4 — Low** | Minor event, no confirmed compromise | < 72 hours |

## 5. Incident Response Phases

### Phase 1: Detection & Identification
- Monitor alerts from endpoint protection, SIEM, and network tools
- Receive reports from employees (via IT help desk or email: [CVA-CONTACT: security@cva.internal])
- Confirm the incident and classify severity

### Phase 2: Containment
- **Short-term containment:** Isolate affected systems from the network
- **Evidence preservation:** Preserve logs, disk images, and relevant artifacts
- **Communication:** Notify CTO; activate Incident Response Team

### Phase 3: Eradication
- Identify and remove the root cause (malware, unauthorized accounts, vulnerabilities)
- Patch or remediate affected systems
- Verify no persistence mechanisms remain

### Phase 4: Recovery
- Restore systems from clean backups
- Monitor for recurrence for minimum 30 days
- Return to normal operations with enhanced monitoring

### Phase 5: Post-Incident Review
- Conduct lessons-learned meeting within 2 weeks
- Document timeline, actions taken, and root cause
- Update controls and procedures to prevent recurrence
- File final incident report

## 6. Incident Response Team

| Role | Responsibility |
|------|---------------|
| Incident Commander (CTO) | Overall coordination; external communications |
| IT Lead | Technical containment and recovery |
| Legal/Compliance | Regulatory notifications; legal hold |
| HR | Employee-related incidents |
| Communications | Internal/member communications |

## 7. External Notification Requirements

Depending on the type of data involved, CVA may have legal obligations to notify:
- Affected members and employees (data breach laws)
- State Attorney General (varies by state)
- Federal agencies (e.g., USDA, FTC for cooperative data)
- Cyber insurance provider (within 24–72 hours per policy terms)

**Legal/Compliance must be notified immediately for any incident involving personal data.**

## 8. Evidence Handling

- Do not power off affected systems without IT approval (evidence may be lost)
- Preserve logs for minimum 90 days following an incident
- Maintain chain of custody for all evidence
- Do not communicate incident details externally without CTO/Legal approval

## 9. Contact Information

- IT Help Desk: [CVA-CONTACT: helpdesk@cva.internal / ext. XXXX]
- Security Lead: [CVA-CONTACT: Name, direct line]
- CTO: [CVA-CONTACT: Name, direct line]
- Cyber Insurance: [CVA-CONTACT: Provider, policy number, 24-hr claim line]
`,
  },

  {
    title: "Business Continuity & Disaster Recovery Policy",
    slug: "business-continuity-disaster-recovery-policy",
    category: "Operations",
    summary: "Policy for maintaining operations and recovering IT systems following disruptive events.",
    tags: ["Compliance", "Operations"],
    content: `# Business Continuity & Disaster Recovery Policy

**Owner:** IT Department — Chief Technology Officer
**Classification:** Confidential
**Review Frequency:** Annual

---

## 1. Purpose

This policy ensures Central Valley Ag can maintain critical operations and recover IT systems following disruptions including natural disasters, ransomware, hardware failure, or other business-impacting events. Given CVA's agricultural cooperative context, continuity of grain management, member financial systems, and field operations is essential.

## 2. Scope

This policy applies to all CVA IT systems, infrastructure, and business processes that support member services, grain operations, financial reporting, and communications.

## 3. Business Impact Analysis

CVA defines system criticality as follows:

| Tier | Recovery Time Objective (RTO) | Recovery Point Objective (RPO) | Examples |
|------|-------------------------------|-------------------------------|---------|
| **Tier 1 — Critical** | < 4 hours | < 1 hour | Grain management, member portal, financial systems |
| **Tier 2 — Essential** | < 24 hours | < 4 hours | Email, HR systems, policy platform |
| **Tier 3 — Standard** | < 72 hours | < 24 hours | Reporting, analytics, non-critical databases |

## 4. Backup Requirements

### 4.1 Backup Schedule
- **Tier 1 systems:** Continuous replication or hourly snapshots
- **Tier 2 systems:** Daily backups
- **Tier 3 systems:** Weekly backups

### 4.2 Backup Storage
- Backups must be stored in at least two geographically separate locations
- At least one copy must be stored off-site or in a separate cloud region
- Backups must be encrypted using AES-256

### 4.3 Backup Testing
- Restoration tests must be performed quarterly for Tier 1 systems
- Annual full DR test covering all tiers
- Test results must be documented and reviewed by IT leadership

## 5. Disaster Recovery Procedures

### 5.1 Declaration
A disaster is formally declared by the CTO or designated alternate when:
- A Tier 1 system outage exceeds or is expected to exceed its RTO
- CVA's primary data center or hosting environment is compromised
- A ransomware or destructive attack has occurred

### 5.2 Recovery Steps
1. Activate the Incident Response Team
2. Assess scope and impact of disruption
3. Notify leadership and key stakeholders
4. Initiate recovery from clean backups (verified pre-incident)
5. Test restored systems before returning to production
6. Monitor for 48 hours post-recovery
7. Conduct post-recovery review

## 6. Alternate Operations

During a disruption, CVA may operate using:
- Offline or manual fallback procedures for grain intake (documented separately)
- Alternative communication channels (personal cell phones, out-of-band messaging)
- Cloud-based temporary systems (pre-approved providers only)

## 7. Testing and Maintenance

- Full DR test: annually, documented
- Tabletop exercises: semi-annually
- Plan review: annually or after any significant infrastructure change
- Test results reviewed by CTO and reported to senior leadership

## 8. Vendor and Third-Party Dependencies

Critical vendors and cloud providers must:
- Provide documented SLAs aligned with CVA's RTO/RPO requirements
- Have their own tested BCPs
- Notify CVA of incidents impacting CVA's systems within 4 hours

## 9. Review

This plan is reviewed annually and updated following any significant infrastructure change, declared disaster, or major test finding.
`,
  },

  {
    title: "Vendor & Third-Party Risk Management Policy",
    slug: "vendor-third-party-risk-management-policy",
    category: "Governance",
    summary: "Requirements for assessing and managing security risks from vendors and third-party service providers.",
    tags: ["Security", "Compliance", "Governance"],
    content: `# Vendor & Third-Party Risk Management Policy

**Owner:** IT Department — Chief Technology Officer
**Classification:** Internal
**Review Frequency:** Annual

---

## 1. Purpose

Central Valley Ag relies on numerous third-party vendors and service providers. This policy establishes requirements for assessing, managing, and monitoring the security risks those vendors introduce to CVA's systems and data.

## 2. Scope

This policy applies to all vendors, contractors, and service providers who:
- Access CVA information systems or networks
- Process, store, or transmit CVA or member data
- Provide critical infrastructure or software services to CVA

## 3. Vendor Risk Tiers

| Tier | Criteria | Due Diligence Required |
|------|----------|----------------------|
| **Critical** | Access to Restricted or Confidential data; hosts core systems | Full assessment, contractual security requirements, annual review |
| **High** | Access to Internal data; significant operational dependency | Security questionnaire, contractual requirements, annual review |
| **Medium** | Limited data access; non-critical services | Basic questionnaire, standard contract terms |
| **Low** | No data access; commodity services | Standard contract, periodic review |

## 4. Vendor Onboarding Requirements

Before engaging a new vendor, IT must:
1. **Classify** the vendor using the risk tier framework above
2. **Assess** security controls (questionnaire, certifications, SOC 2 report)
3. **Review** the vendor's privacy policy and data processing practices
4. **Contract** — ensure the agreement includes:
   - Data protection and confidentiality obligations
   - Security incident notification requirements (within 24 hours)
   - Right to audit (for Critical/High vendors)
   - Data return and deletion upon contract termination
   - Compliance with applicable laws
5. **Approve** — obtain IT and Legal sign-off before data access is granted

## 5. Ongoing Monitoring

- **Critical vendors:** Annual reassessment; monitor for security incidents
- **High vendors:** Annual review of security posture
- **All vendors:** Monitor for data breaches, regulatory actions, or significant operational changes
- Maintain a **Vendor Register** in [CVA-SYSTEM: IT asset/GRC system]

## 6. Access Management for Vendors

- Vendor access must be provisioned on a least-privilege basis
- All vendor accounts must be tied to named individuals (no shared accounts)
- Vendor access must be revoked immediately upon contract termination
- Remote vendor access must use CVA-approved methods (VPN, jump server)
- Vendor activity must be logged and reviewed for Critical vendors

## 7. Cloud and SaaS Vendors

Cloud service providers hosting CVA data must:
- Be located in or replicate data to U.S.-based data centers (unless approved exception)
- Support data export and deletion upon request
- Provide transparency into subprocessors and data handling

## 8. Incident Notification

Vendors must notify CVA within 24 hours of discovering any security incident that affects CVA data or systems. Notification must go to [CVA-CONTACT: CTO and IT Security Lead].

## 9. Non-Compliance

Failure by a vendor to meet CVA's security requirements is grounds for contract termination. CVA reserves the right to audit Critical and High vendors at any time with reasonable notice.
`,
  },

  {
    title: "Data Retention & Disposal Policy",
    slug: "data-retention-disposal-policy",
    category: "Data Governance",
    summary: "Standards for retaining, archiving, and securely disposing of CVA data assets.",
    tags: ["Data", "Compliance"],
    content: `# Data Retention & Disposal Policy

**Owner:** IT Department — Chief Technology Officer
**Classification:** Internal
**Review Frequency:** Annual

---

## 1. Purpose

This policy establishes minimum retention periods for CVA data and requires secure disposal of data and physical media when retention periods expire. Proper retention supports legal compliance, operational needs, and data minimization principles.

## 2. Scope

This policy applies to all CVA data regardless of format (electronic, paper, or other media) and all employees, contractors, and vendors who create, store, or process CVA data.

## 3. Retention Schedule

| Data Category | Retention Period | Authority |
|---------------|-----------------|-----------|
| Member financial records | 7 years | IRS / Cooperative law |
| Grain transaction records | 7 years | USDA / tax requirements |
| Employee HR records | 7 years post-employment | FLSA, state labor law |
| Payroll records | 7 years | IRS |
| Contracts and agreements | 7 years post-expiration | Business need / statute of limitations |
| Email — general business | 3 years | Business need |
| Email — legal/regulatory matters | Indefinite (legal hold) | Legal |
| IT security logs | 1 year | Security best practice |
| Backup media | Per backup schedule (max 90 days rolling) | IT policy |
| Marketing and communications | 3 years | Business need |
| Agricultural field/operational data | 5 years | USDA program requirements |

## 4. Legal Holds

When litigation, investigation, or regulatory inquiry is anticipated or active:
- Normal retention schedules are **suspended** for relevant data
- IT must place affected systems and accounts under legal hold
- Legal counsel must authorize release of hold
- Do not delete any data subject to a legal hold

## 5. Data Disposal Requirements

### 5.1 Electronic Data
- **Standard deletion** is insufficient — data must be securely overwritten or cryptographically erased
- Hard drives and SSDs: use NIST 800-88 compliant erasure (DoD 5220.22-M for HDDs; cryptographic erase for SSDs)
- Cloud data: confirm deletion via vendor process and request written confirmation for Confidential/Restricted data

### 5.2 Physical Media
- CDs/DVDs, USB drives: physical destruction (shredding)
- Hard drives removed from service: secure wipe per above, or physical destruction by certified vendor
- Paper records containing Confidential or Restricted data: cross-cut shredding only

### 5.3 Certificate of Destruction
For Critical/High-risk media, obtain a certificate of destruction from the disposal vendor.

### 5.4 End-of-Life Devices
All CVA-issued devices must be processed through IT before disposal or repurposing. IT will ensure data is securely wiped and document the disposal.

## 6. Responsibilities

| Role | Responsibility |
|------|---------------|
| IT | Technical enforcement; device disposal process |
| Managers | Ensure team follows retention schedules |
| Legal/Compliance | Legal holds; regulatory guidance |
| All Employees | Do not delete records prior to scheduled date; notify IT of potential holds |

## 7. Review

This policy is reviewed annually and updated for changes in applicable laws or regulations.
`,
  },

  {
    title: "Mobile Device Management & BYOD Policy",
    slug: "mobile-device-management-byod-policy",
    category: "Security",
    summary: "Requirements for CVA-managed and personal devices used to access CVA systems.",
    tags: ["Security", "Hardware", "Access Control"],
    content: `# Mobile Device Management & BYOD Policy

**Owner:** IT Department — Chief Technology Officer
**Classification:** Internal
**Review Frequency:** Annual

---

## 1. Purpose

This policy establishes security requirements for mobile devices used to access CVA systems and data, including both CVA-issued devices and personally owned devices (Bring Your Own Device — BYOD).

## 2. Scope

This policy applies to all smartphones, tablets, and laptops used to access CVA email, applications, or data — regardless of ownership.

## 3. CVA-Issued Devices

All CVA-issued mobile devices must:
- Be enrolled in CVA's Mobile Device Management (MDM) system: [CVA-SYSTEM: MDM platform]
- Have a 6-digit PIN or biometric lock enabled
- Use full-device encryption
- Have CVA-approved endpoint protection installed
- Receive software updates within 14 days of release
- Connect via VPN for access to internal CVA systems
- Be reported to IT within 4 hours of loss or theft

CVA IT reserves the right to remotely wipe CVA-issued devices in the event of loss, theft, or termination of employment.

## 4. BYOD (Personally Owned Devices)

CVA permits limited use of personal devices for business purposes under the following conditions:

### 4.1 Eligibility
- Employees must register their personal device with IT
- Device must meet minimum security requirements (below)

### 4.2 Minimum Security Requirements
- OS version: within 2 major releases of current (e.g., iOS 16+ / Android 12+)
- Device PIN or biometric authentication enabled
- Full-device encryption enabled
- Screen auto-lock within 5 minutes of inactivity
- Device must not be jailbroken or rooted

### 4.3 BYOD Access Limitations
- BYOD devices may access CVA email and the policy portal
- BYOD devices may **not** access CVA financial systems, grain management systems, or Restricted-classified data without CTO approval
- CVA may install a mobile app container (e.g., Intune app protection) to isolate CVA data

### 4.4 Employee Privacy
- CVA will only manage CVA-specific apps and data on BYOD devices — not personal content
- In the event of a security incident, CVA may require the employee to surrender the device for forensic review
- Upon leaving CVA, CVA data will be remotely removed from the device (container wipe only)

## 5. Lost or Stolen Devices

Report any lost or stolen device containing CVA data to IT immediately at [CVA-CONTACT: helpdesk number/email]. IT will:
1. Disable access credentials
2. Initiate remote wipe of CVA data
3. Document the incident

## 6. App and Software Policy

- CVA-issued devices may only have apps installed from official app stores or CVA-approved sources
- Corporate data must not be stored in personal cloud storage (Dropbox, iCloud personal, etc.)
- CVA-approved cloud storage: [CVA-SYSTEM: e.g., SharePoint, OneDrive for Business]

## 7. Separation of CVA and Personal Data

Employees must not:
- Forward CVA email to personal email accounts
- Store CVA data on personal cloud services
- Take screenshots of CVA systems containing Confidential or Restricted data
`,
  },

  {
    title: "Cloud Services Governance Policy",
    slug: "cloud-services-governance-policy",
    category: "Governance",
    summary: "Framework for evaluating, approving, and managing cloud services used by CVA.",
    tags: ["Software", "Compliance", "Governance"],
    content: `# Cloud Services Governance Policy

**Owner:** IT Department — Chief Technology Officer
**Classification:** Internal
**Review Frequency:** Annual

---

## 1. Purpose

This policy establishes a framework for evaluating, approving, and managing cloud services (IaaS, PaaS, SaaS) used by CVA. It prevents unmanaged "shadow IT" and ensures cloud services meet CVA's security and compliance requirements.

## 2. Scope

This policy applies to all cloud-based services used for CVA business purposes, including free-tier services that involve CVA data.

## 3. Approved Cloud Services

CVA maintains a **Cloud Services Register** in [CVA-SYSTEM: IT asset/GRC system] listing all approved services. Services on the register have been evaluated and approved by IT.

Current approved services include: [CVA-SYSTEM: Maintain this list separately or link to register]

## 4. Requesting a New Cloud Service

Any employee wishing to use a new cloud service must:
1. Submit a request to IT via [CVA-CONTACT: IT help desk or procurement process]
2. Provide the service name, vendor, business purpose, and data types involved
3. IT will evaluate the service against the criteria below
4. Approval required from CTO for services involving Confidential or Restricted data

**No CVA data may be entered into a new cloud service until IT approval is received.**

## 5. Evaluation Criteria

IT evaluates cloud services on:
- Data residency (must be U.S.-based for member and financial data)
- Encryption at rest and in transit
- Access controls and SSO/MFA support
- SOC 2 Type II or equivalent certification
- Data portability and deletion capabilities
- Vendor financial stability and longevity
- Compliance with USDA/GIPSA requirements where applicable

## 6. Data Classification Restrictions

| Cloud Service Type | Public Data | Internal Data | Confidential Data | Restricted Data |
|--------------------|-------------|--------------|------------------|----------------|
| Approved SaaS | ✓ | ✓ | CTO approval | Not permitted |
| Approved IaaS/PaaS | ✓ | ✓ | ✓ | With controls |
| Unapproved service | ✓ | Not permitted | Not permitted | Not permitted |

## 7. Shadow IT

Using unapproved cloud services for CVA business purposes is prohibited. IT conducts periodic scans to identify unauthorized services. Discovery of shadow IT will result in:
- Mandatory migration to an approved alternative or service termination
- Security review of any data that may have been exposed
- Potential disciplinary action for repeat violations

## 8. Ongoing Management

For all approved cloud services, IT will:
- Review access and licenses at least annually
- Ensure offboarded employees are removed within 24 hours
- Monitor vendor security status and breach notifications
- Re-evaluate services that undergo significant changes in ownership or terms

## 9. Contract Requirements

All cloud service agreements must be reviewed by Legal/Procurement before signing. Key contract requirements:
- Data processing agreement (DPA) for services involving personal data
- SLA aligned with CVA's business requirements
- Notification of data breaches within 24 hours
- Data deletion within 30 days of contract termination
`,
  },

  {
    title: "Network Security Policy",
    slug: "network-security-policy",
    category: "Network",
    summary: "Standards for securing CVA's network infrastructure, segmentation, and remote access.",
    tags: ["Security", "Network", "Compliance"],
    content: `# Network Security Policy

**Owner:** IT Department — Chief Technology Officer
**Classification:** Internal
**Review Frequency:** Annual

---

## 1. Purpose

This policy establishes requirements for securing CVA's network infrastructure to protect against unauthorized access, data interception, and disruption of operations.

## 2. Scope

This policy covers all CVA network infrastructure including wired and wireless networks, remote access, and connections to third-party systems.

## 3. Network Segmentation

CVA's network must be segmented to limit the impact of a breach:

| Segment | Purpose | Access |
|---------|---------|--------|
| **Corporate LAN** | Business systems, workstations | Employees, VPN users |
| **OT / Precision Ag** | Agricultural sensors, control systems, GPS equipment | IT and operations staff only |
| **Guest / Field Devices** | Guest Wi-Fi, field tablets | Internet only; no access to corporate LAN |
| **DMZ** | Internet-facing systems (web, email gateway) | Limited, monitored |
| **Server VLAN** | Internal servers and databases | IT and application accounts only |

**The OT/precision ag network must be strictly isolated from the corporate network.** Cross-segment access requires documented business justification and IT approval.

## 4. Firewall and Perimeter Security

- All external network connections must pass through CVA's perimeter firewall
- Firewall rules follow a deny-all, permit-by-exception model
- Firewall rules must be reviewed and revalidated annually
- All unused ports and services must be disabled
- Firewall logs must be retained for minimum 90 days

## 5. Wireless Networks

- All CVA wireless networks must use WPA3 or WPA2-Enterprise encryption
- Guest and corporate SSIDs must be on separate VLANs
- Default equipment passwords must be changed before deployment
- Wi-Fi coverage should be limited to CVA premises where possible
- Rogue access point detection must be enabled

## 6. Remote Access

- All remote access to CVA internal systems requires an approved VPN
- VPN access requires multi-factor authentication
- Split-tunneling is disabled — all traffic routes through CVA VPN while connected
- Remote desktop (RDP) to internal systems is only permitted via VPN or jump server
- Direct RDP exposure to the internet is prohibited

## 7. DNS and Web Filtering

- CVA uses DNS filtering to block known malicious domains
- Web filtering categories are configured to block: malware, phishing, illegal content, and peer-to-peer file sharing
- Exceptions require IT manager approval and are documented

## 8. Network Monitoring

- CVA maintains network monitoring tools to detect anomalous traffic
- Security events are logged to a central SIEM (or equivalent)
- Alerts for suspicious activity must be investigated within 4 hours during business hours
- Network logs are retained for minimum 90 days

## 9. Network Equipment

- All network devices must run supported firmware/software versions
- Default credentials must be changed on all network devices before deployment
- Network device management access is restricted to IT staff via secure protocols (SSH, HTTPS)
- Annual network vulnerability assessments covering critical infrastructure

## 10. Third-Party Network Connections

- Connections from third-party vendors to CVA's network require IT approval
- Third-party connections must be limited in scope, time-bound where possible, and use VPN or secure tunnels
- Third-party network activity must be logged
`,
  },

  {
    title: "Patch Management Policy",
    slug: "patch-management-policy",
    category: "Operations",
    summary: "Requirements and timelines for applying security patches to CVA systems and software.",
    tags: ["Security", "Software", "Compliance"],
    content: `# Patch Management Policy

**Owner:** IT Department — Chief Technology Officer
**Classification:** Internal
**Review Frequency:** Annual

---

## 1. Purpose

Unpatched vulnerabilities are a leading cause of data breaches. This policy establishes timelines and processes for applying security patches to all CVA systems to minimize exposure to known vulnerabilities.

## 2. Scope

This policy applies to all CVA-managed systems including servers, workstations, network infrastructure, cloud instances, and third-party applications.

## 3. Patch Classification and Response Times

| Severity | CVSS Score | Patch Deadline | Example |
|----------|------------|---------------|---------|
| **Critical** | 9.0 – 10.0 | 72 hours | Actively exploited RCE vulnerabilities |
| **High** | 7.0 – 8.9 | 7 days | Authentication bypass, privilege escalation |
| **Medium** | 4.0 – 6.9 | 30 days | Information disclosure, DoS |
| **Low** | 0.1 – 3.9 | 90 days | Minor, limited impact |

Emergency out-of-band patches (e.g., Log4Shell, HAFNIUM) may override standard timelines. CTO authorizes emergency patching actions.

## 4. Patch Management Process

### 4.1 Identification
- Subscribe to vendor security advisories for all software in use
- Monitor CISA Known Exploited Vulnerabilities (KEV) catalog
- Run vulnerability scans monthly (critical systems) and quarterly (others)

### 4.2 Assessment
- Evaluate patch applicability to CVA systems
- Assess risk of patch (functional impact, compatibility)
- Prioritize based on exploitability and CVA exposure

### 4.3 Testing
- Test patches in a non-production environment before deploying to critical production systems
- Emergency patches for Critical vulnerabilities may bypass full testing with CTO approval

### 4.4 Deployment
- Deploy patches using centralized management tools: [CVA-SYSTEM: patch management platform]
- Staggered rollout: test group → pilot group → full deployment
- Deployments during maintenance windows for critical systems (unless emergency)

### 4.5 Verification
- Confirm patches applied successfully via scan or management console
- Document patch status in asset management system

## 5. Exceptions

If a patch cannot be applied within the required window (due to operational constraints):
- Document the reason and compensating controls
- Obtain CTO approval
- Set a hard exception expiration date (maximum 90 days)

## 6. Operating System End-of-Life

Operating systems and software that are past end-of-life (EOL) and no longer receiving security updates must:
- Be upgraded or replaced within 6 months of EOL date
- If upgrade is not feasible, be isolated from the network with documented compensating controls and CTO approval

## 7. Reporting

IT will produce a monthly patch compliance report showing:
- Percentage of systems within compliance targets
- Outstanding critical and high patches with aging
- Exceptions and their status

Report reviewed by CTO monthly.
`,
  },

  {
    title: "Backup & Recovery Policy",
    slug: "backup-recovery-policy",
    category: "Operations",
    summary: "Requirements for backing up CVA data and verifying the ability to recover it.",
    tags: ["Compliance", "Operations"],
    content: `# Backup & Recovery Policy

**Owner:** IT Department — Chief Technology Officer
**Classification:** Internal
**Review Frequency:** Annual

---

## 1. Purpose

This policy ensures CVA data is backed up regularly and that backups can be successfully restored when needed. Reliable backups are critical to recovery from ransomware, hardware failure, accidental deletion, and disasters.

## 2. Scope

This policy covers all CVA production systems containing business data, including on-premises servers, cloud-hosted systems, and critical workstations.

## 3. Backup Requirements

### 3.1 Coverage
The following must be backed up:
- All production servers and databases
- Network-attached storage (NAS) containing business data
- Critical configuration files for network and security devices
- Cloud-hosted databases and file storage

Employee workstations: local data should be stored on network drives that are included in server backups. IT provides guidance on approved storage locations.

### 3.2 Frequency

| System Tier | Backup Frequency | Retention |
|-------------|-----------------|-----------|
| Tier 1 (Critical) | Hourly snapshots + daily full | 90 days daily, 1 year monthly |
| Tier 2 (Essential) | Daily full + weekly full | 30 days daily, 1 year weekly |
| Tier 3 (Standard) | Weekly full | 90 days |

### 3.3 Backup Storage
- **3-2-1 Rule:** At least 3 copies, on 2 different media types, with 1 copy off-site/cloud
- Backups must be stored in a physically separate location from production systems
- Cloud backup storage must be in a separate account or region from production
- **Air-gapped or immutable backups** are required for Tier 1 systems (protect against ransomware)
- Backups must be encrypted (AES-256) in storage and transit

## 4. Backup Monitoring

- Backup job status must be reviewed daily by IT
- Failed backups must be investigated and resolved within 24 hours
- Alert notifications must be configured for backup failures

## 5. Recovery Testing

Backups are only valuable if they can be restored:

| System Tier | Recovery Test Frequency | Method |
|-------------|------------------------|--------|
| Tier 1 | Quarterly | Full restore test to isolated environment |
| Tier 2 | Semi-annually | Full restore test |
| Tier 3 | Annually | Sample restore test |

Test results must be documented. Failed tests must be investigated and remediated before the system is considered protected.

## 6. Ransomware Protection

To protect backups from ransomware:
- Backup systems must not be accessible via the same credentials as production
- Immutable or write-once storage must be used for at least one backup copy
- Offline or air-gapped backups are preferred for critical data

## 7. Recovery Procedure

1. Identify the cause of data loss or system failure
2. Determine the appropriate recovery point (based on RPO and incident timeline)
3. Restore to an isolated environment first; verify data integrity
4. Obtain approval before restoring to production
5. Monitor restored systems for 48 hours
6. Document the recovery and lessons learned

## 8. Reporting

Monthly backup compliance report includes:
- Backup success rates by system
- Storage consumption trends
- Recovery tests completed and results
- Any policy exceptions

Reviewed by CTO monthly.
`,
  },

  {
    title: "AI & Generative AI Usage Policy",
    slug: "ai-generative-ai-usage-policy",
    category: "Governance",
    summary: "Policy governing the use of AI tools, including generative AI, at CVA.",
    tags: ["Software", "Compliance", "Governance"],
    content: `# AI & Generative AI Usage Policy

**Owner:** IT Department — Chief Technology Officer
**Classification:** Internal
**Review Frequency:** Annual (or as technology evolves)

---

## 1. Purpose

Artificial intelligence tools — including generative AI (such as ChatGPT, Microsoft Copilot, and similar tools) — offer significant productivity benefits but also introduce risks related to data privacy, accuracy, and intellectual property. This policy establishes guidelines for the responsible use of AI tools at CVA.

## 2. Scope

This policy applies to all CVA employees, contractors, and vendors using AI tools for CVA business purposes, whether on CVA-provided or personal devices.

## 3. Approved AI Tools

CVA maintains a list of approved AI tools in the Cloud Services Register. To use an AI tool for business purposes, it must be on the approved list or receive IT approval.

**Currently approved tools:** [CVA-SYSTEM: Link to Cloud Services Register or list here]

If you want to use a new AI tool, submit a request to IT for evaluation.

## 4. Prohibited Uses

The following are strictly prohibited regardless of the tool used:

- Entering **Restricted or Confidential CVA data** into any AI tool not specifically approved for that data type, including:
  - Member financial or personal data (names, account numbers, Social Security numbers)
  - Grain contracts, pricing, or transaction details not intended for public disclosure
  - Employee personal information
  - Legal documents under privilege
- Using AI to generate content intended to **deceive or mislead** members, regulators, or the public
- Using AI to bypass CVA security controls or generate malicious code
- Using AI to produce content that violates CVA's Code of Conduct, anti-harassment policy, or applicable law

## 5. Acceptable Uses

AI tools may be used for:
- Drafting and editing internal communications, documents, and policy content (with human review)
- Summarizing publicly available information for research
- Writing and debugging code (non-sensitive systems)
- Brainstorming and ideation
- Agricultural market research using publicly available data

## 6. Data Privacy Guidelines

Before using an AI tool, consider:
1. **What data are you entering?** Never enter Restricted or Confidential data.
2. **Is the tool approved for this data type?** Check the Cloud Services Register.
3. **Does the vendor train on your inputs?** Review the tool's privacy settings and CVA's subscription terms.
4. **Could this output contain confidential third-party data?** Apply critical judgment to all AI outputs.

## 7. AI Output Review

AI-generated content must be reviewed by a human before being:
- Shared externally with members, partners, or regulators
- Used in official CVA communications
- Relied upon for business, legal, or financial decisions

AI tools can produce plausible-sounding but incorrect information ("hallucinations"). **Verify critical facts independently.**

## 8. Intellectual Property

- AI-generated content may have unclear copyright status. Do not use AI-generated content in legal filings, patents, or externally published materials without legal review.
- Do not enter third-party copyrighted material into AI tools without authorization.

## 9. Transparency

When AI has substantially contributed to a deliverable shared externally (member communications, regulatory submissions), disclose its use appropriately and ensure a human is accountable for the accuracy of the content.

## 10. Training and Awareness

CVA will provide guidance on responsible AI use as part of the annual security awareness training program. Employees with questions should contact [CVA-CONTACT: IT team or CTO].

## 11. Policy Evolution

This is a rapidly evolving area. This policy will be reviewed at minimum annually and updated as AI technology and associated risks change.
`,
  },

  {
    title: "Physical & Environmental Security Policy",
    slug: "physical-environmental-security-policy",
    category: "Security",
    summary: "Requirements for protecting CVA facilities, equipment, and data from physical threats.",
    tags: ["Security", "Compliance", "Hardware"],
    content: `# Physical & Environmental Security Policy

**Owner:** IT Department — Chief Technology Officer
**Classification:** Internal
**Review Frequency:** Annual

---

## 1. Purpose

This policy establishes requirements to protect CVA's physical facilities, equipment, and information from unauthorized access, theft, damage, and environmental threats. Physical security is a foundational component of CVA's overall security program.

## 2. Scope

This policy applies to all CVA locations, including grain elevators, offices, data centers/server rooms, and field facilities where IT equipment is deployed.

## 3. Physical Access Control

### 3.1 Facilities
- All CVA buildings must have physical access controls (keyed entry, card access, or equivalent)
- Access to CVA facilities must be restricted to authorized personnel
- Visitor access must be controlled: visitors must sign in, be escorted in sensitive areas, and sign out
- Access rights must be reviewed when employees change roles or leave CVA

### 3.2 Server Rooms and Data Centers
- Server rooms must have separate access controls from general facility access
- Access is restricted to IT staff and authorized personnel
- Access logs for server rooms must be maintained and reviewed monthly
- Tailgating (following someone through a secured door) is prohibited

### 3.3 Grain Elevators and Remote Sites
- OT equipment (control systems, sensors, network equipment) at remote locations must be secured in locked enclosures
- Remote IT equipment rooms should have access logs (key sign-out log or electronic access)

## 4. Environmental Controls

### 4.1 Server Rooms
- Server rooms must maintain temperature between 65°F–77°F and relative humidity 45%–55%
- Environmental monitoring (temperature, humidity, water detection) must be configured with alerts
- Adequate cooling capacity with redundant cooling units for critical server rooms
- Fire suppression appropriate for electronic equipment (gaseous suppression preferred)

### 4.2 Power
- UPS (uninterruptible power supply) for all critical server and network equipment
- Generator backup for primary server locations
- Regular UPS battery testing (at minimum annually)

## 5. Equipment Security

- All server and network equipment must be labeled with CVA asset tags
- Equipment must be physically secured (racks locked, equipment bolted where appropriate)
- Removal of equipment from CVA facilities requires IT authorization
- Decommissioned equipment must be processed through IT for data sanitization before disposal

## 6. Clean Desk Policy

Employees must:
- Secure sensitive documents (lock in drawers or cabinets) when not at their desk
- Not leave passwords, PINs, or access codes written down at their workstations
- Lock their workstation screen when leaving their desk (Ctrl+L / Windows+L)
- Shred confidential documents rather than discarding in trash

## 7. Monitoring and Surveillance

- CVA may use video surveillance at facilities, particularly at entry/exit points and server rooms
- Surveillance footage is retained for minimum 30 days
- Surveillance is disclosed to employees per applicable law

## 8. Physical Security Incidents

Report any of the following immediately to your manager and IT:
- Unauthorized individuals in CVA facilities
- Loss or theft of equipment or access credentials
- Damaged or tampered equipment or access controls
- Evidence of break-in or attempted unauthorized access

## 9. Portable Equipment

- CVA laptops and mobile devices must not be left unattended in vehicles or public places
- Confidential or Restricted data must not be stored on portable devices without encryption
- CVA-issued USB drives must be encrypted; personal USB drives may not be used on CVA systems unless approved
`,
  },
];

async function main() {
  console.log("Seeding CVA IT Policy Templates...\n");

  const adminUser = await prisma.user.findUnique({ where: { email: "admin@cva.internal" } });
  if (!adminUser) {
    throw new Error("Admin user not found. Please run `npm run db:seed` first.");
  }

  const allTags = await prisma.tag.findMany();
  const tagMap = Object.fromEntries(allTags.map((t) => [t.name, t.id]));

  // Ensure any missing tags are created
  const allNeededTags = Array.from(new Set(policies.flatMap((p) => p.tags)));
  for (const tagName of allNeededTags) {
    if (!tagMap[tagName]) {
      const t = await prisma.tag.upsert({ where: { name: tagName }, update: {}, create: { name: tagName } });
      tagMap[tagName] = t.id;
      console.log(`  + Created tag: ${tagName}`);
    }
  }

  let created = 0;
  let skipped = 0;

  for (const p of policies) {
    const existing = await prisma.policy.findUnique({ where: { slug: p.slug } });
    if (existing) {
      console.log(`  ~ Skipped (exists): ${p.title}`);
      skipped++;
      continue;
    }

    await prisma.policy.create({
      data: {
        title:             p.title,
        slug:              p.slug,
        summary:           p.summary,
        content:           p.content,
        category:          p.category,
        status:            "PUBLISHED",
        publishedAt:       new Date(),
        reviewFrequency:   "ANNUAL",
        nextReviewDate:    ONE_YEAR,
        reviewReminderDays: 30,
        createdById:       adminUser.id,
        tags: {
          create: p.tags.filter((t) => tagMap[t]).map((t) => ({ tagId: tagMap[t] })),
        },
      },
    });

    console.log(`  ✓ Created: ${p.title}`);
    created++;
  }

  console.log(`\n✓ Done — ${created} policies created, ${skipped} skipped (already exist).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

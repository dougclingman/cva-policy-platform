import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ─── Permissions ────────────────────────────────────────────────────────────
  const permissionDefs = [
    { name: "policies:read",    resource: "policies", action: "read",    description: "View published policies" },
    { name: "policies:create",  resource: "policies", action: "create",  description: "Create new policies" },
    { name: "policies:update",  resource: "policies", action: "update",  description: "Edit existing policies" },
    { name: "policies:delete",  resource: "policies", action: "delete",  description: "Delete policies" },
    { name: "policies:publish", resource: "policies", action: "publish", description: "Publish and archive policies" },
    { name: "policies:review",  resource: "policies", action: "review",  description: "Approve or reject policy reviews" },
    { name: "admin:view",          resource: "admin", action: "view",          description: "Access admin panel" },
    { name: "admin:users",         resource: "admin", action: "users",         description: "Manage users" },
    { name: "admin:roles",         resource: "admin", action: "roles",         description: "Manage roles and permissions" },
    { name: "admin:sso",           resource: "admin", action: "sso",           description: "Configure SSO" },
    { name: "admin:notifications", resource: "admin", action: "notifications", description: "Configure email notifications" },
  ];

  const permissions: Record<string, { id: string }> = {};
  for (const def of permissionDefs) {
    const p = await prisma.permission.upsert({
      where: { name: def.name },
      update: {},
      create: def,
    });
    permissions[def.name] = p;
  }
  console.log(`  ✓ ${permissionDefs.length} permissions`);

  // ─── Roles ──────────────────────────────────────────────────────────────────
  const roleDefs = [
    {
      name: "Admin",
      description: "Full platform access — manages users, roles, settings, and all policies",
      isSystem: true,
      permissions: Object.keys(permissions),
    },
    {
      name: "Policy Manager",
      description: "Creates, edits, publishes, and archives policies",
      isSystem: true,
      permissions: ["policies:read", "policies:create", "policies:update", "policies:delete", "policies:publish"],
    },
    {
      name: "Reviewer",
      description: "Reviews and approves policies before publication",
      isSystem: true,
      permissions: ["policies:read", "policies:review"],
    },
    {
      name: "Viewer",
      description: "Read-only access to published policies",
      isSystem: true,
      permissions: ["policies:read"],
    },
  ];

  const roles: Record<string, { id: string }> = {};
  for (const def of roleDefs) {
    const role = await prisma.role.upsert({
      where: { name: def.name },
      update: { description: def.description },
      create: { name: def.name, description: def.description, isSystem: def.isSystem },
    });
    roles[def.name] = role;

    // Assign permissions
    for (const permName of def.permissions) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permissions[permName].id } },
        update: {},
        create: { roleId: role.id, permissionId: permissions[permName].id },
      });
    }
  }
  console.log(`  ✓ ${roleDefs.length} roles with permissions`);

  // ─── Admin User ─────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("Admin@CVA2024!", 12);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@cva.internal" },
    update: {},
    create: {
      email: "admin@cva.internal",
      name: "CVA Administrator",
      password: adminPassword,
      isActive: true,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: roles["Admin"].id } },
    update: {},
    create: { userId: adminUser.id, roleId: roles["Admin"].id },
  });

  // Demo users
  const demoUsers = [
    { email: "pm@cva.internal", name: "Policy Manager Demo", role: "Policy Manager" },
    { email: "reviewer@cva.internal", name: "Reviewer Demo", role: "Reviewer" },
    { email: "viewer@cva.internal", name: "Viewer Demo", role: "Viewer" },
  ];
  const demoPassword = await bcrypt.hash("Demo@CVA2024!", 12);
  for (const demo of demoUsers) {
    const u = await prisma.user.upsert({
      where: { email: demo.email },
      update: {},
      create: { email: demo.email, name: demo.name, password: demoPassword, isActive: true },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: u.id, roleId: roles[demo.role].id } },
      update: {},
      create: { userId: u.id, roleId: roles[demo.role].id },
    });
  }
  console.log("  ✓ Admin + 3 demo users");

  // ─── Sample Tags ────────────────────────────────────────────────────────────
  const tagNames = ["Security", "Compliance", "Network", "Data", "HR", "Software", "Hardware", "Access Control"];
  for (const name of tagNames) {
    await prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log("  ✓ 8 tags");

  // ─── Sample Policies ────────────────────────────────────────────────────────
  const samplePolicies = [
    {
      title: "Acceptable Use Policy",
      slug: "acceptable-use-policy",
      category: "Governance",
      summary: "Defines acceptable use of CVA IT systems and resources.",
      status: "PUBLISHED" as const,
      content: `# Acceptable Use Policy

## 1. Purpose
This policy establishes guidelines for the acceptable use of CVA's information technology resources, including computers, networks, and software systems.

## 2. Scope
This policy applies to all employees, contractors, consultants, and other personnel who use CVA IT resources.

## 3. Acceptable Use
- Use IT resources for authorized CVA business purposes
- Protect confidentiality of CVA data and third-party information
- Report security incidents promptly to the IT team

## 4. Prohibited Activities
- Unauthorized access to systems or data
- Installation of unlicensed software
- Transmission of confidential data via unencrypted channels
- Use of IT resources for personal gain or illegal activities

## 5. Enforcement
Violations may result in disciplinary action up to and including termination.
`,
    },
    {
      title: "Password Management Policy",
      slug: "password-management-policy",
      category: "Security",
      summary: "Requirements for creating and managing secure passwords.",
      status: "PUBLISHED" as const,
      content: `# Password Management Policy

## 1. Purpose
To establish minimum password requirements that protect CVA systems from unauthorized access.

## 2. Password Requirements
- Minimum 12 characters in length
- Must include uppercase, lowercase, numbers, and special characters
- Must not contain dictionary words or personal information
- Must not reuse the last 12 passwords

## 3. Multi-Factor Authentication
MFA is required for:
- VPN access
- Administrative accounts
- Cloud service logins
- Remote access to internal systems

## 4. Password Storage
Passwords must never be:
- Written down or stored in plain text
- Shared with colleagues or IT staff
- Sent via email or messaging applications

## 5. Password Manager
CVA provides an approved enterprise password manager. All employees are required to use it.
`,
    },
    {
      title: "Data Classification Policy",
      slug: "data-classification-policy",
      category: "Data Governance",
      summary: "Framework for classifying and handling CVA data assets.",
      status: "UNDER_REVIEW" as const,
      content: `# Data Classification Policy

## 1. Classification Levels

### Public
Information that may be freely shared externally without risk.

### Internal
Information intended for internal use only. Unauthorized disclosure could cause minor harm.

### Confidential
Sensitive business information. Unauthorized disclosure could cause significant harm.

### Restricted
Highly sensitive information (PII, financial data). Requires strict access controls and encryption.

## 2. Handling Requirements
| Level       | Encryption at Rest | Encryption in Transit | Access Control |
|-------------|-------------------|----------------------|----------------|
| Public      | Optional          | Optional             | None           |
| Internal    | Recommended       | Required             | Role-based     |
| Confidential| Required          | Required             | Need-to-know   |
| Restricted  | Required (AES-256)| Required (TLS 1.2+)  | Explicit auth  |
`,
    },
    {
      title: "Remote Work Security Policy",
      slug: "remote-work-security-policy",
      category: "Security",
      summary: "Security requirements for employees working remotely.",
      status: "DRAFT" as const,
      content: `# Remote Work Security Policy

## 1. Purpose
Ensure security of CVA systems and data when accessed remotely.

## 2. Requirements
- VPN must be used for all access to internal CVA systems
- Device must have approved endpoint protection installed
- Public Wi-Fi may only be used when connected via VPN
- Screen must be locked when unattended

## 3. Approved Devices
Only CVA-issued or approved BYOD devices with MDM enrollment may access CVA systems remotely.

## 4. Incident Reporting
Report lost or stolen devices immediately to the IT help desk.
`,
    },
  ];

  const adminUserFull = await prisma.user.findUnique({ where: { email: "admin@cva.internal" } });
  const tags = await prisma.tag.findMany();
  const tagMap = Object.fromEntries(tags.map((t) => [t.name, t.id]));

  for (const p of samplePolicies) {
    const existing = await prisma.policy.findUnique({ where: { slug: p.slug } });
    if (!existing) {
      await prisma.policy.create({
        data: {
          title: p.title,
          slug: p.slug,
          category: p.category,
          summary: p.summary,
          content: p.content,
          status: p.status,
          publishedAt: p.status === "PUBLISHED" ? new Date() : null,
          createdById: adminUserFull!.id,
          tags: {
            create:
              p.category === "Security"
                ? [{ tagId: tagMap["Security"] }, { tagId: tagMap["Compliance"] }]
                : [{ tagId: tagMap["Compliance"] }],
          },
        },
      });
    }
  }
  console.log("  ✓ 4 sample policies");

  // ─── SSO Config (placeholder) ────────────────────────────────────────────────
  const ssoCount = await prisma.sSOConfig.count();
  if (ssoCount === 0) {
    await prisma.sSOConfig.create({ data: { provider: "saml", isEnabled: false } });
  }

  // ─── Email Config (placeholder) ─────────────────────────────────────────────
  const emailCount = await prisma.emailConfig.count();
  if (emailCount === 0) {
    const emailConfig = await prisma.emailConfig.create({
      data: { isEnabled: false },
    });

    const notificationDefs = [
      { trigger: "policy.published",         name: "Policy Published",           description: "Notify team when a policy is published" },
      { trigger: "policy.review_requested",  name: "Review Requested",           description: "Notify reviewers when a policy needs review" },
      { trigger: "policy.review_completed",  name: "Review Completed",           description: "Notify policy manager when a review is completed" },
      { trigger: "policy.archived",          name: "Policy Archived",            description: "Notify when a policy is archived" },
      { trigger: "user.created",             name: "New User Created",           description: "Notify admin when a new user account is created" },
      { trigger: "user.deactivated",         name: "User Deactivated",           description: "Notify admin when a user account is deactivated" },
    ];
    for (const n of notificationDefs) {
      await prisma.emailNotification.create({
        data: { ...n, isEnabled: false, configId: emailConfig.id },
      });
    }
  }
  console.log("  ✓ SSO config + email notification templates");

  console.log("\nSeed complete!");
  console.log("─────────────────────────────────────");
  console.log("  Admin:    admin@cva.internal  /  Admin@CVA2024!");
  console.log("  PM:       pm@cva.internal     /  Demo@CVA2024!");
  console.log("  Reviewer: reviewer@cva.internal / Demo@CVA2024!");
  console.log("  Viewer:   viewer@cva.internal  / Demo@CVA2024!");
  console.log("─────────────────────────────────────");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

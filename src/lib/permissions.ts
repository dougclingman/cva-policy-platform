export const PERMISSIONS = {
  // Policies
  POLICIES_READ:    "policies:read",
  POLICIES_CREATE:  "policies:create",
  POLICIES_UPDATE:  "policies:update",
  POLICIES_DELETE:  "policies:delete",
  POLICIES_PUBLISH: "policies:publish",
  POLICIES_REVIEW:  "policies:review",
  // Admin
  ADMIN_VIEW:          "admin:view",
  ADMIN_USERS:         "admin:users",
  ADMIN_ROLES:         "admin:roles",
  ADMIN_SSO:           "admin:sso",
  ADMIN_NOTIFICATIONS: "admin:notifications",
  // Travel
  TRAVEL_MANAGE: "travel:manage",
  // Announcements
  ANNOUNCEMENTS_MANAGE: "announcements:manage",
  // On-Call
  ONCALL_MANAGE: "oncall:manage",
  // Runbooks
  RUNBOOKS_READ:   "runbooks:read",
  RUNBOOKS_MANAGE: "runbooks:manage",
  // Reports
  REPORTS_SUBMIT: "reports:submit",
  REPORTS_MANAGE: "reports:manage",
  // Projects
  PROJECTS_READ:   "projects:read",
  PROJECTS_MANAGE: "projects:manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export function hasPermission(userPermissions: string[], permission: Permission): boolean {
  return userPermissions.includes(permission);
}

export function hasAnyPermission(userPermissions: string[], permissions: Permission[]): boolean {
  return permissions.some((p) => userPermissions.includes(p));
}

export function hasAllPermissions(userPermissions: string[], permissions: Permission[]): boolean {
  return permissions.every((p) => userPermissions.includes(p));
}

export const SYSTEM_ROLES = {
  ADMIN:            "Admin",
  POLICY_MANAGER:   "Policy Manager",
  REVIEWER:         "Reviewer",
  VIEWER:           "Viewer",
  IT_SECURITY:      "IT Security",
  IT_COMMUNICATOR:  "IT Communicator",
  ONCALL_MANAGER:   "On-Call Manager",
  PROJECT_MANAGER:  "Project Manager",
} as const;

import { Role } from "../types";

export type PermissionKey =
  | "company:create"
  | "company:update"
  | "company:delete"
  | "company:read"
  | "invoice:create"
  | "invoice:update"
  | "invoice:delete"
  | "invoice:lock"
  | "invoice:unlock"
  | "invoice:read"
  | "commission:read"
  | "commission:approve"
  | "commission:mark_paid"
  | "customer:create"
  | "customer:update"
  | "customer:delete"
  | "customer:read"
  | "product:create"
  | "product:update"
  | "product:delete"
  | "product:read"
  | "product:import"
  | "audit:read";

export const PERMISSION_MATRIX: Record<PermissionKey, Role[]> = {
  "company:create": ["OWNER"],
  "company:update": ["OWNER"],
  "company:delete": ["OWNER"],
  "company:read": ["OWNER", "ACCOUNTANT"],
  "invoice:create": ["OWNER", "ACCOUNTANT"],
  "invoice:update": ["OWNER"],
  "invoice:delete": ["OWNER"],
  "invoice:lock": ["OWNER"],
  "invoice:unlock": ["OWNER"],
  "invoice:read": ["OWNER", "ACCOUNTANT", "SALES"],
  "commission:read": ["OWNER", "ACCOUNTANT", "SALES"],
  "commission:approve": ["OWNER"],
  "commission:mark_paid": ["OWNER"],
  "customer:create": ["OWNER", "ACCOUNTANT"],
  "customer:update": ["OWNER", "ACCOUNTANT"],
  "customer:delete": ["OWNER", "ACCOUNTANT"],
  "customer:read": ["OWNER", "ACCOUNTANT", "SALES"],
  "product:create": ["OWNER"],
  "product:update": ["OWNER"],
  "product:delete": ["OWNER"],
  "product:read": ["OWNER", "ACCOUNTANT", "SALES"],
  "product:import": ["OWNER"],
  "audit:read": ["OWNER", "ACCOUNTANT"],
};

export const hasAnyRole = (
  userRole: Role | undefined,
  allowedRoles: Role[]
): boolean => {
  if (!userRole) {
    return false;
  }
  return allowedRoles.includes(userRole);
};

export const hasPermission = (
  userRole: Role | undefined,
  permission: PermissionKey
): boolean => {
  if (!userRole) {
    return false;
  }
  return PERMISSION_MATRIX[permission].includes(userRole);
};

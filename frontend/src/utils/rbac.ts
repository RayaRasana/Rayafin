import { Role } from "../types";

export type PermissionKey =
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
  | "audit:read";

export const PERMISSION_MATRIX: Record<PermissionKey, Role[]> = {
  "invoice:create": ["OWNER", "ACCOUNTANT"],
  "invoice:update": ["OWNER", "ACCOUNTANT"],
  "invoice:delete": ["OWNER", "ACCOUNTANT"],
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

import React from "react";
import { useAuth } from "../../context/AuthContext";
import { Role } from "../../types";
import { hasAnyRole, hasPermission, PermissionKey } from "../../utils/rbac";

interface RoleGuardProps {
  allowed?: Role[];
  permission?: PermissionKey;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowed,
  permission,
  children,
}) => {
  const { user } = useAuth();

  const isAuthorized =
    permission !== undefined
      ? hasPermission(user?.role, permission)
      : allowed !== undefined
      ? hasAnyRole(user?.role, allowed)
      : false;

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
};

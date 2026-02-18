import React from "react";
import { useAuth } from "../../context/AuthContext";
import { Role } from "../../types";
import { hasAnyRole } from "../../utils/rbac";

interface RoleGuardProps {
  allowed: Role[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowed, children }) => {
  const { user } = useAuth();

  if (!hasAnyRole(user?.role, allowed)) {
    return null;
  }

  return <>{children}</>;
};

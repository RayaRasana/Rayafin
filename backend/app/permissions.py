from enum import Enum
from typing import Dict, FrozenSet


class RoleName(str, Enum):
    OWNER = "OWNER"
    ACCOUNTANT = "ACCOUNTANT"
    SALES = "SALES"


class PermissionKey(str, Enum):
    INVOICE_CREATE = "invoice:create"
    INVOICE_UPDATE = "invoice:update"
    INVOICE_DELETE = "invoice:delete"
    INVOICE_LOCK = "invoice:lock"
    INVOICE_UNLOCK = "invoice:unlock"
    INVOICE_READ = "invoice:read"

    COMMISSION_READ = "commission:read"
    COMMISSION_APPROVE = "commission:approve"
    COMMISSION_MARK_PAID = "commission:mark_paid"
    COMMISSION_CREATE_SNAPSHOT = "commission:create_snapshot"

    CUSTOMER_READ = "customer:read"
    CUSTOMER_CREATE = "customer:create"
    CUSTOMER_UPDATE = "customer:update"
    CUSTOMER_DELETE = "customer:delete"

    PRODUCT_READ = "product:read"
    PRODUCT_CREATE = "product:create"
    PRODUCT_UPDATE = "product:update"
    PRODUCT_DELETE = "product:delete"
    PRODUCT_IMPORT = "product:import"

    AUDIT_READ = "audit:read"


PERMISSION_MATRIX: Dict[PermissionKey, FrozenSet[RoleName]] = {
    PermissionKey.INVOICE_CREATE: frozenset({RoleName.OWNER, RoleName.ACCOUNTANT}),
    PermissionKey.INVOICE_UPDATE: frozenset({RoleName.OWNER}),
    PermissionKey.INVOICE_DELETE: frozenset({RoleName.OWNER}),
    PermissionKey.INVOICE_LOCK: frozenset({RoleName.OWNER}),
    PermissionKey.INVOICE_UNLOCK: frozenset({RoleName.OWNER}),
    PermissionKey.INVOICE_READ: frozenset({RoleName.OWNER, RoleName.ACCOUNTANT, RoleName.SALES}),

    PermissionKey.COMMISSION_READ: frozenset({RoleName.OWNER, RoleName.ACCOUNTANT, RoleName.SALES}),
    PermissionKey.COMMISSION_APPROVE: frozenset({RoleName.OWNER}),
    PermissionKey.COMMISSION_MARK_PAID: frozenset({RoleName.OWNER}),
    PermissionKey.COMMISSION_CREATE_SNAPSHOT: frozenset({RoleName.OWNER, RoleName.ACCOUNTANT}),

    PermissionKey.CUSTOMER_READ: frozenset({RoleName.OWNER, RoleName.ACCOUNTANT, RoleName.SALES}),
    PermissionKey.CUSTOMER_CREATE: frozenset({RoleName.OWNER, RoleName.ACCOUNTANT}),
    PermissionKey.CUSTOMER_UPDATE: frozenset({RoleName.OWNER, RoleName.ACCOUNTANT}),
    PermissionKey.CUSTOMER_DELETE: frozenset({RoleName.OWNER, RoleName.ACCOUNTANT}),

    PermissionKey.PRODUCT_READ: frozenset({RoleName.OWNER, RoleName.ACCOUNTANT, RoleName.SALES}),
    PermissionKey.PRODUCT_CREATE: frozenset({RoleName.OWNER}),
    PermissionKey.PRODUCT_UPDATE: frozenset({RoleName.OWNER}),
    PermissionKey.PRODUCT_DELETE: frozenset({RoleName.OWNER}),
    PermissionKey.PRODUCT_IMPORT: frozenset({RoleName.OWNER}),

    PermissionKey.AUDIT_READ: frozenset({RoleName.OWNER, RoleName.ACCOUNTANT}),
}

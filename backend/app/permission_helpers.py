"""
Permission Helper Utilities for RBAC Enforcement

Provides reusable functions for permission checks and access control
across the API.
"""

from fastapi import HTTPException
from backend.app.permissions import (
    RoleName,
    PermissionKey,
    PERMISSION_MATRIX,
)


def has_permission(role: RoleName, permission: PermissionKey) -> bool:
    """
    Check if a role has a specific permission.

    Args:
        role: The user's role
        permission: The permission to check

    Returns:
        True if the role has the permission, False otherwise
    """
    allowed_roles = PERMISSION_MATRIX.get(permission, frozenset())
    return role in allowed_roles


def require_permission_or_raise(
    role: RoleName,
    permission: PermissionKey,
    detail: str = "Insufficient permissions",
) -> None:
    """
    Verify a role has a permission, raising HTTPException if not.

    Args:
        role: The user's role
        permission: The permission to check
        detail: Custom error message

    Raises:
        HTTPException: If the role lacks the permission
    """
    if not has_permission(role, permission):
        raise HTTPException(status_code=403, detail=detail)


def can_modify_product(role: RoleName) -> bool:
    """Check if a role can create/update/delete products."""
    return has_permission(role, PermissionKey.PRODUCT_CREATE)


def can_import_products(role: RoleName) -> bool:
    """Check if a role can import products."""
    return has_permission(role, PermissionKey.PRODUCT_IMPORT)


def can_edit_invoice(role: RoleName) -> bool:
    """Check if a role can edit invoices."""
    return has_permission(role, PermissionKey.INVOICE_UPDATE)


def can_delete_invoice(role: RoleName) -> bool:
    """Check if a role can delete invoices."""
    return has_permission(role, PermissionKey.INVOICE_DELETE)


def can_manage_users(role: RoleName) -> bool:
    """Check if a role can manage users (OWNER only)."""
    return role == RoleName.OWNER


def is_owner(role: RoleName) -> bool:
    """Check if a role is OWNER."""
    return role == RoleName.OWNER


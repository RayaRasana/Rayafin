import React, { useMemo } from "react";
import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Business,
  People,
  Inventory2,
  Group,
  ReceiptLong,
  AccountBalanceWallet,
  ExitToApp,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { PERSIAN_LABELS } from "../../utils/persian";
import { hasPermission } from "../../utils/rbac";
import "./Sidebar.css";

interface SidebarProps {
  isExpanded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

interface MenuItemConfig {
  label: string;
  path: string;
  icon: React.ReactElement;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isExpanded,
  onMouseEnter,
  onMouseLeave,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const canReadCompanies = hasPermission(user?.role, "company:read");
  const canManageUsers = user?.role === "OWNER";

  const menuItems = useMemo<MenuItemConfig[]>(() => {
    const items: MenuItemConfig[] = [
      {
        label: PERSIAN_LABELS.customers,
        path: "/customers",
        icon: <People fontSize="small" />,
      },
      {
        label: PERSIAN_LABELS.products,
        path: "/products",
        icon: <Inventory2 fontSize="small" />,
      },
      {
        label: PERSIAN_LABELS.invoices,
        path: "/invoices",
        icon: <ReceiptLong fontSize="small" />,
      },
      {
        label: PERSIAN_LABELS.commissions,
        path: "/commissions",
        icon: <AccountBalanceWallet fontSize="small" />,
      },
    ];

    if (canManageUsers) {
      items.splice(2, 0, {
        label: PERSIAN_LABELS.users,
        path: "/users",
        icon: <Group fontSize="small" />,
      });
    }

    if (canReadCompanies) {
      items.unshift({
        label: PERSIAN_LABELS.companies,
        path: "/",
        icon: <Business fontSize="small" />,
      });
    }

    return items;
  }, [canReadCompanies, canManageUsers]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Box
      className={`app-sidebar ${isExpanded ? "expanded" : "collapsed"}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      dir="rtl"
    >
      <Box sx={{ px: 1.5, py: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          component="img"
          src="/logo.svg"
          alt="رایافین"
          sx={{
            width: 32,
            height: 32,
            flexShrink: 0,
          }}
        />
        <Typography
          className="sidebar-brand-text"
          sx={{
            color: "white",
            fontSize: "0.95rem",
            fontWeight: 700,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          رایافین
        </Typography>
      </Box>

      <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.2)" }} />

      <List sx={{ px: 1, py: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
        {menuItems.map((item) => {
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);

          return (
            <Tooltip
              key={item.path}
              title={isExpanded ? "" : item.label}
              placement="left"
              arrow
            >
              <ListItemButton
                onClick={() => navigate(item.path)}
                className={`sidebar-item ${isActive ? "active" : ""}`}
                sx={{
                  minHeight: 44,
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: isExpanded ? "flex-start" : "center",
                  px: isExpanded ? "16px" : "12px",
                  py: "10px",
                  gap: "12px",
                  color: "#ffffff",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.22)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    margin: 0,
                    justifyContent: "center",
                    color: "#ffffff",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  className="sidebar-item-text"
                  primaryTypographyProps={{
                    fontSize: "0.9rem",
                    color: "#ffffff",
                    whiteSpace: "nowrap",
                  }}
                />
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>

      <Box sx={{ mt: "auto", px: 1, py: 1.5 }}>
        <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.2)", mb: 1 }} />
        <Tooltip title={isExpanded ? "" : PERSIAN_LABELS.logout} placement="left" arrow>
          <ListItemButton
            onClick={handleLogout}
            className="sidebar-item"
            sx={{
              minHeight: 44,
              borderRadius: "8px",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: isExpanded ? "flex-start" : "center",
              px: isExpanded ? "16px" : "12px",
              py: "10px",
              gap: "12px",
              color: "#ffffff",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.22)",
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                margin: 0,
                justifyContent: "center",
                color: "#ffffff",
              }}
            >
              <ExitToApp fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={PERSIAN_LABELS.logout}
              className="sidebar-item-text"
              primaryTypographyProps={{
                fontSize: "0.9rem",
                color: "#ffffff",
                whiteSpace: "nowrap",
              }}
            />
          </ListItemButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

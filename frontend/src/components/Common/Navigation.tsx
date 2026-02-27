import React, { useCallback } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Container,
} from "@mui/material";
import { ExitToApp, Person } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { PERSIAN_LABELS } from "../../utils/persian";
import { hasPermission } from "../../utils/rbac";

export const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const canReadCompanies = hasPermission(user?.role, "company:read");
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleLogout = useCallback(() => {
    handleMenuClose();
    logout();
    navigate("/login");
  }, [logout, navigate, handleMenuClose]);

  const handleNavigate = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate]
  );

  return (
    <AppBar
      position="sticky"
      sx={{
        background: "linear-gradient(135deg, #D4A644 0%, #BF933A 100%)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Toolbar
          disableGutters
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.75rem 0",
          }}
        >
          {/* Logo/Brand */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              cursor: "pointer",
              transition: "transform 0.3s ease",
              mr: 4,
              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
            onClick={() => handleNavigate("/")}
          >
            <Box
              component="img"
              src="/logo.svg"
              alt="رایافین"
              sx={{
                height: 40,
                width: "auto",
                display: "block",
              }}
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "white",
                fontSize: "1.1rem",
                display: { xs: "none", sm: "block" },
              }}
            >
              رایافین
            </Typography>
          </Box>

        {/* Navigation Links */}
        <Box sx={{ display: "flex", gap: 1 }}>
          {canReadCompanies && (
            <Button
              color="inherit"
              onClick={() => handleNavigate("/")}
              sx={{
                textTransform: "none",
                fontSize: "0.95rem",
                fontWeight: 500,
                padding: "8px 16px",
                borderRadius: "8px",
                transition: "all 0.3s ease",

                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                },
              }}
            >
              {PERSIAN_LABELS.companies}
            </Button>
          )}
          <Button
            color="inherit"
            onClick={() => handleNavigate("/customers")}
            sx={{
              textTransform: "none",
              fontSize: "0.95rem",
              fontWeight: 500,
              padding: "8px 16px",
              borderRadius: "8px",
              transition: "all 0.3s ease",

              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.15)",
              },
            }}
          >
            {PERSIAN_LABELS.customers}
          </Button>
          <Button
            color="inherit"
            onClick={() => handleNavigate("/products")}
            sx={{
              textTransform: "none",
              fontSize: "0.95rem",
              fontWeight: 500,
              padding: "8px 16px",
              borderRadius: "8px",
              transition: "all 0.3s ease",

              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.15)",
              },
            }}
          >
            {PERSIAN_LABELS.products}
          </Button>
          <Button
            color="inherit"
            onClick={() => handleNavigate("/users")}
            sx={{
              textTransform: "none",
              fontSize: "0.95rem",
              fontWeight: 500,
              padding: "8px 16px",
              borderRadius: "8px",
              transition: "all 0.3s ease",

              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.15)",
              },
            }}
          >
            {PERSIAN_LABELS.users}
          </Button>
          <Button
            color="inherit"
            onClick={() => handleNavigate("/invoices")}
            sx={{
              textTransform: "none",
              fontSize: "0.95rem",
              fontWeight: 500,
              padding: "8px 16px",
              borderRadius: "8px",
              transition: "all 0.3s ease",

              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.15)",
              },
            }}
          >
            {PERSIAN_LABELS.invoices}
          </Button>
          <Button
            color="inherit"
            onClick={() => handleNavigate("/commissions")}
            sx={{
              textTransform: "none",
              fontSize: "0.95rem",
              fontWeight: 500,
              padding: "8px 16px",
              borderRadius: "8px",
              transition: "all 0.3s ease",

              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.15)",
              },
            }}
          >
            {PERSIAN_LABELS.commissions}
          </Button>
        </Box>

        {/* User Menu */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button
            onClick={handleMenuOpen}
            sx={{
              textTransform: "none",
              display: "flex",
              alignItems: "center",
              gap: 1,
              color: "white",
              padding: "8px 12px",
              borderRadius: "8px",
              transition: "all 0.3s ease",

              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.15)",
              },
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                backgroundColor: "rgba(255, 255, 255, 0.3)",
                fontSize: "0.9rem",
              }}
            >
              {user?.full_name?.charAt(0) || "U"}
            </Avatar>
            <Typography
              sx={{
                fontSize: "0.9rem",
                fontWeight: 500,
                display: { xs: "none", sm: "block" },
              }}
            >
              {user?.full_name || user?.username}
            </Typography>
          </Button>

          {/* User Menu Dropdown */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            sx={{
              "& .MuiPaper-root": {
                borderRadius: "12px",
                marginTop: "0.5rem",
              },
            }}
          >
            <MenuItem disabled>
              <Person sx={{ mr: 1 }} fontSize="small" />
              <Typography variant="body2">
                {user?.full_name || user?.username}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ExitToApp sx={{ mr: 1 }} fontSize="small" />
              <Typography variant="body2">{PERSIAN_LABELS.logout}</Typography>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
      </Container>
    </AppBar>
  );
};

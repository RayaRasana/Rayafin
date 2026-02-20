import React, { useState, useCallback } from "react";
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PERSIAN_LABELS } from "../utils/persian";
import { validateRequired, validateEmail } from "../utils/validation";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string>("");

  const handleChange = useCallback(
    (field: string, value: string) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
      // Clear error for this field when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: "",
        }));
      }
    },
    [errors]
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!validateRequired(formData.email)) {
      newErrors.email = PERSIAN_LABELS.emailRequired;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "فرمت ایمیل نامعتبر است";
    }

    if (!validateRequired(formData.password)) {
      newErrors.password = PERSIAN_LABELS.passwordRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setApiError("");

      if (!validateForm()) {
        return;
      }

      try {
        await login(formData.email, formData.password);
        navigate("/");
      } catch (error) {
        setApiError(
          error instanceof Error
            ? error.message
            : PERSIAN_LABELS.invalidCredentials
        );
      }
    },
    [formData, login, navigate, validateForm]
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #2e5090 0%, #6366f1 100%)",
        direction: "rtl",
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            padding: 4,
            borderRadius: 3,
            boxShadow: "0 20px 64px rgba(0, 0, 0, 0.15)",
          }}
        >
          {/* Logo/Header */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: "#2e5090",
                mb: 1,
              }}
            >
              رایافین
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "#64748b",
                fontSize: "1rem",
              }}
            >
              سامانه جامع مدیریت حسابداری چند‌مستاجر
            </Typography>
          </Box>

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            {/* API Error Alert */}
            {apiError && (
              <Alert
                severity="error"
                sx={{
                  borderRadius: "12px",
                  mb: 2,
                }}
              >
                {apiError}
              </Alert>
            )}

            {/* Email/Username Field */}
            <TextField
              fullWidth
              label={PERSIAN_LABELS.emailOrUsername}
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              disabled={loading}
              variant="outlined"
              sx={{
                mb: 2,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                },
              }}
            />

            {/* Password Field */}
            <TextField
              fullWidth
              label={PERSIAN_LABELS.password}
              type="password"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
              disabled={loading}
              variant="outlined"
              sx={{
                mb: 3,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                },
              }}
            />

            {/* Login Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              type="submit"
              disabled={loading}
              sx={{
                background: "linear-gradient(135deg, #3f5bd9, #2f4fc4)",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                padding: "12px",
                fontSize: "1rem",
                fontWeight: 600,
                textTransform: "none",
                boxShadow: "0 4px 12px rgba(46, 80, 144, 0.3)",
                transition: "all 0.2s ease",

                "&:hover:not(:disabled)": {
                  background: "#2f4fc4",
                  boxShadow: "0 8px 20px rgba(47, 79, 196, 0.35)",
                },

                "&:active:not(:disabled)": {
                  transform: "scale(0.98)",
                },

                "&:focus-visible": {
                  outline: "3px solid rgba(63, 91, 217, 0.35)",
                  outlineOffset: "2px",
                },

                "&:disabled": {
                  opacity: 0.7,
                },
              }}
            >
              {loading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={20} sx={{ color: "inherit" }} />
                  {PERSIAN_LABELS.loading}
                </Box>
              ) : (
                PERSIAN_LABELS.login
              )}
            </Button>

            {/* Demo Credentials Info */}
            <Box
              sx={{
                mt: 3,
                p: 2,
                backgroundColor: "#f0f9ff",
                borderRadius: "12px",
                border: "1px solid #bfdbfe",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "#1e40af",
                  textAlign: "center",
                  fontSize: "0.85rem",
                }}
              >
                برای آزمایش، از ایمیل: demo@example.com و رمز عبور: 123456
                استفاده کنید.
              </Typography>
            </Box>
          </Box>
        </Card>

        {/* Footer */}
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Typography
            variant="body2"
            sx={{
              color: "rgba(255, 255, 255, 0.7)",
            }}
          >
            © 2026 RR Accounting System. تمام حقوق محفوظ است.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

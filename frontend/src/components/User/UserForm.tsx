import React, { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
} from "@mui/material";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { User } from "../../types";
import { validateEmail, validateRequired } from "../../utils/validation";
import { PERSIAN_LABELS } from "../../utils/persian";

export interface UserFormData {
  username: string;
  email: string;
  full_name: string;
  password: string;
  company_id?: number;
}

interface UserFormProps {
  open: boolean;
  user?: User | null;
  onSave: (user: UserFormData) => void;
  onClose: () => void;
  isLoading?: boolean;
  defaultCompanyId?: number;
}

export const UserForm: React.FC<UserFormProps> = ({
  open,
  user,
  onSave,
  onClose,
  isLoading = false,
  defaultCompanyId,
}) => {
  const companies = useSelector((state: RootState) => state.companies.items);
  const [formData, setFormData] = useState<UserFormData>({
    username: "",
    email: "",
    full_name: "",
    password: "",
    company_id: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        password: "",
        company_id: user.company_id,
      });
    } else {
      setFormData({
        username: "",
        email: "",
        full_name: "",
        password: "",
        company_id: defaultCompanyId ?? companies[0]?.id,
      });
    }
    setErrors({});
  }, [user, open, companies, defaultCompanyId]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
      if (errors[name]) {
        setErrors((prev) => {
          const { [name]: _, ...rest } = prev;
          return rest;
        });
      }
    },
    [errors]
  );

  const handleCompanyChange = useCallback(
    (value: number | undefined) => {
      setFormData((prev) => ({
        ...prev,
        company_id: value,
      }));
    },
    []
  );

  const validateUserForm = useCallback((): Record<string, string> => {
    const validationErrors: Record<string, string> = {};

    if (!validateRequired(formData.full_name)) {
      validationErrors.full_name = "نام کامل الزامی است";
    }

    if (!validateRequired(formData.email)) {
      validationErrors.email = "ایمیل الزامی است";
    } else if (!validateEmail(formData.email)) {
      validationErrors.email = "ایمیل نامعتبر است";
    }

    if (!user && !validateRequired(formData.password)) {
      validationErrors.password = "رمز عبور الزامی است";
    }

    return validationErrors;
  }, [formData, user]);

  const handleSubmit = useCallback(() => {
    const validationErrors = validateUserForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSave(formData);
  }, [formData, onSave, validateUserForm]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      dir="rtl"
      PaperProps={{
        sx: {
          borderRadius: "16px",
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          fontSize: "1.25rem",
          color: "#D4A644",
        }}
      >
        {user ? PERSIAN_LABELS.editUser : PERSIAN_LABELS.addUser}
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {errors.general && (
          <Alert
            severity="error"
            sx={{
              borderRadius: "12px",
              mb: 2,
            }}
          >
            {errors.general}
          </Alert>
        )}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            fullWidth
            label={PERSIAN_LABELS.username}
            name="username"
            value={formData.username}
            onChange={handleChange}
            error={!!errors.username}
            helperText={errors.username}
            disabled={!!user || isLoading}
            dir="rtl"
          />
          <TextField
            fullWidth
            label={PERSIAN_LABELS.fullName}
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            error={!!errors.full_name}
            helperText={errors.full_name}
            disabled={isLoading}
            dir="rtl"
          />
          <TextField
            fullWidth
            label={PERSIAN_LABELS.email}
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
            disabled={isLoading}
            dir="rtl"
          />
          <TextField
            fullWidth
            label={PERSIAN_LABELS.password}
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            error={!!errors.password}
            helperText={errors.password}
            disabled={isLoading}
            dir="rtl"
          />
          <FormControl fullWidth>
            <InputLabel>{PERSIAN_LABELS.companies}</InputLabel>
            <Select
              value={formData.company_id || ""}
              onChange={(e) =>
                handleCompanyChange(e.target.value as number | undefined)
              }
              label={PERSIAN_LABELS.companies}
              disabled={isLoading}
            >
              <MenuItem value="">{PERSIAN_LABELS.companies}</MenuItem>
              {companies.map((company) => (
                <MenuItem key={company.id} value={company.id}>
                  {company.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={isLoading}
          variant="outlined"
          className="cancel-button"
        >
          {PERSIAN_LABELS.cancel}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          className="form-primary-button"
          disabled={isLoading}
        >
          {PERSIAN_LABELS.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

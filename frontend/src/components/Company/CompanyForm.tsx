import React, { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box,
} from "@mui/material";
import { Company } from "../../types";
import { getValidationErrors } from "../../utils/validation";
import { PERSIAN_LABELS } from "../../utils/persian";

interface CompanyFormProps {
  open: boolean;
  company?: Company | null;
  onSave: (company: Omit<Company, "id" | "created_at" | "updated_at">) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const CompanyForm: React.FC<CompanyFormProps> = ({
  open,
  company,
  onSave,
  onClose,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<
    Omit<Company, "id" | "created_at" | "updated_at">
  >({
    name: "",
    address: "",
    phone: "",
    email: "",
    tax_id: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        address: company.address,
        phone: company.phone,
        email: company.email,
        tax_id: company.tax_id,
      });
    } else {
      setFormData({
        name: "",
        address: "",
        phone: "",
        email: "",
        tax_id: "",
      });
    }
    setErrors({});
  }, [company, open]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (errors[name]) {
        setErrors((prev) => {
          const { [name]: _, ...rest } = prev;
          return rest;
        });
      }
    },
    [errors]
  );

  const handleSubmit = useCallback(() => {
    const validationErrors = getValidationErrors(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSave(formData);
  }, [formData, onSave]);

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
          color: "#2e5090",
        }}
      >
        {company ? PERSIAN_LABELS.editCompany : PERSIAN_LABELS.addCompany}
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
            label={PERSIAN_LABELS.companyName}
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
            disabled={isLoading}
            dir="rtl"
          />
          <TextField
            fullWidth
            label={PERSIAN_LABELS.companyAddress}
            name="address"
            value={formData.address}
            onChange={handleChange}
            error={!!errors.address}
            helperText={errors.address}
            disabled={isLoading}
            dir="rtl"
          />
          <TextField
            fullWidth
            label={PERSIAN_LABELS.companyPhone}
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            error={!!errors.phone}
            helperText={errors.phone}
            disabled={isLoading}
            dir="rtl"
          />
          <TextField
            fullWidth
            label={PERSIAN_LABELS.companyEmail}
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
            label={PERSIAN_LABELS.taxId}
            name="tax_id"
            value={formData.tax_id}
            onChange={handleChange}
            error={!!errors.tax_id}
            helperText={errors.tax_id}
            disabled={isLoading}
            dir="rtl"
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={isLoading}>
          {PERSIAN_LABELS.cancel}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading}
        >
          {PERSIAN_LABELS.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

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
import { Customer } from "../../types";
import { getValidationErrors } from "../../utils/validation";
import { PERSIAN_LABELS } from "../../utils/persian";

interface CustomerFormProps {
  open: boolean;
  customer?: Customer | null;
  onSave: (customer: Omit<Customer, "id" | "created_at" | "updated_at">) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  open,
  customer,
  onSave,
  onClose,
  isLoading = false,
}) => {
  const companies = useSelector((state: RootState) => state.companies.items);
  const [formData, setFormData] = useState<
    Omit<Customer, "id" | "created_at" | "updated_at">
  >({
    company_id: 0,
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (customer) {
      setFormData({
        company_id: customer.company_id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
      });
    } else {
      setFormData({
        company_id: companies[0]?.id || 0,
        name: "",
        email: "",
        phone: "",
        address: "",
      });
    }
    setErrors({});
  }, [customer, open, companies]);

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

  const handleCompanyChange = useCallback(
    (value: number) => {
      setFormData((prev) => ({ ...prev, company_id: value }));
    },
    []
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
        {customer ? PERSIAN_LABELS.editCustomer : PERSIAN_LABELS.addCustomer}
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
          <FormControl fullWidth>
            <InputLabel>{PERSIAN_LABELS.companies}</InputLabel>
            <Select
              value={formData.company_id}
              onChange={(e) => handleCompanyChange(e.target.value as number)}
              label={PERSIAN_LABELS.companies}
              disabled={isLoading}
            >
              {companies.map((company) => (
                <MenuItem key={company.id} value={company.id}>
                  {company.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label={PERSIAN_LABELS.customerName}
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
            label={PERSIAN_LABELS.customerEmail}
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
            label={PERSIAN_LABELS.customerPhone}
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
            label={PERSIAN_LABELS.customerAddress}
            name="address"
            value={formData.address}
            onChange={handleChange}
            error={!!errors.address}
            helperText={errors.address}
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

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Box,
} from "@mui/material";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { Product } from "../../types";
import { PERSIAN_LABELS } from "../../utils/persian";

interface ProductFormProps {
  open: boolean;
  product?: Product | null;
  onSave: (product: Omit<Product, "id" | "created_at" | "updated_at">) => void;
  onClose: () => void;
  isLoading?: boolean;
  defaultCompanyId?: number;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  open,
  product,
  onSave,
  onClose,
  isLoading = false,
  defaultCompanyId,
}) => {
  const companies = useSelector((state: RootState) => state.companies.items);
  const availableCompanies = useMemo(() => companies, [companies]);

  const [formData, setFormData] = useState<
    Omit<Product, "id" | "created_at" | "updated_at">
  >({
    company_id: 0,
    name: "",
    description: "",
    sku: "",
    unit_price: 0,
    cost_price: 0,
    stock_quantity: 0,
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const firstCompanyId = useMemo(
    () => defaultCompanyId ?? availableCompanies[0]?.id ?? 0,
    [defaultCompanyId, availableCompanies]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    if (product) {
      setFormData({
        company_id: product.company_id,
        name: product.name,
        description: product.description || "",
        sku: product.sku || "",
        unit_price: product.unit_price,
        cost_price: product.cost_price || 0,
        stock_quantity: product.stock_quantity,
        is_active: product.is_active,
      });
    } else {
      setFormData({
        company_id: firstCompanyId,
        name: "",
        description: "",
        sku: "",
        unit_price: 0,
        cost_price: 0,
        stock_quantity: 0,
        is_active: true,
      });
    }
    setErrors({});
  }, [product, open, firstCompanyId]);

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

  const handleNumberChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      const numValue = parseFloat(value) || 0;
      setFormData((prev) => ({ ...prev, [name]: numValue }));
      if (errors[name]) {
        setErrors((prev) => {
          const { [name]: _, ...rest } = prev;
          return rest;
        });
      }
    },
    [errors]
  );

  const handleCompanyChange = useCallback((value: number) => {
    setFormData((prev) => ({ ...prev, company_id: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    const validationErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      validationErrors.name = "نام محصول الزامی است";
    }

    if (formData.unit_price <= 0) {
      validationErrors.unit_price = "قیمت فروش باید بزرگتر از صفر باشد";
    }

    if (formData.stock_quantity < 0) {
      validationErrors.stock_quantity = "موجودی نمی‌تواند منفی باشد";
    }

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
      maxWidth="md"
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
        {product ? PERSIAN_LABELS.editProduct : PERSIAN_LABELS.addProduct}
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>{PERSIAN_LABELS.company}</InputLabel>
            <Select
              value={formData.company_id}
              label={PERSIAN_LABELS.company}
              onChange={(e) => handleCompanyChange(Number(e.target.value))}
              disabled={!!product}
            >
              {availableCompanies.map((company) => (
                <MenuItem key={company.id} value={company.id}>
                  {company.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label={PERSIAN_LABELS.productName}
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            required
            error={!!errors.name}
            helperText={errors.name}
          />

          <TextField
            label={PERSIAN_LABELS.productSku}
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            fullWidth
            placeholder="کد محصول"
          />

          <TextField
            label={PERSIAN_LABELS.productDescription}
            name="description"
            value={formData.description}
            onChange={handleChange}
            fullWidth
            multiline
            rows={3}
          />

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label={PERSIAN_LABELS.productUnitPrice}
              name="unit_price"
              type="number"
              value={formData.unit_price}
              onChange={handleNumberChange}
              fullWidth
              required
              error={!!errors.unit_price}
              helperText={errors.unit_price}
              inputProps={{ min: 0, step: 0.01 }}
            />

            <TextField
              label={PERSIAN_LABELS.productCostPrice}
              name="cost_price"
              type="number"
              value={formData.cost_price}
              onChange={handleNumberChange}
              fullWidth
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Box>

          <TextField
            label={PERSIAN_LABELS.productStockQuantity}
            name="stock_quantity"
            type="number"
            value={formData.stock_quantity}
            onChange={handleNumberChange}
            fullWidth
            error={!!errors.stock_quantity}
            helperText={errors.stock_quantity}
            inputProps={{ min: 0, step: 1 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={formData.is_active}
                onChange={handleChange}
                name="is_active"
              />
            }
            label={PERSIAN_LABELS.productIsActive}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          className="cancel-button"
          disabled={isLoading}
        >
          {PERSIAN_LABELS.cancel}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          className="form-primary-button"
          disabled={isLoading}
        >
          {isLoading ? PERSIAN_LABELS.loading : PERSIAN_LABELS.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

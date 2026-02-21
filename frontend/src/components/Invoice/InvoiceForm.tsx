import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  IconButton,
  Box,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material";
import { Delete, Add } from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store/store";
import { setCompanies } from "../../store/companySlice";
import { setCustomers } from "../../store/customerSlice";
import { Invoice, InvoiceItem } from "../../types";
import { validateInvoiceTotal } from "../../utils/validation";
import { PERSIAN_LABELS, INVOICE_STATUS_OPTIONS } from "../../utils/persian";
import { normalizeToHtmlDate, today } from "../../utils/dateUtils";
import { productAPI, ProductSearchResult } from "../../api/products";
import { companyAPI } from "../../api/companies";
import { customerAPI } from "../../api/customers";
import { useAuth } from "../../context/AuthContext";

interface InvoiceFormProps {
  open: boolean;
  invoice?: Invoice | null;
  onSave: (
    invoice: Omit<Invoice, "id" | "created_at" | "updated_at">,
    items: Omit<InvoiceItem, "id" | "invoice_id" | "created_at" | "updated_at">[]
  ) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  open,
  invoice,
  onSave,
  onClose,
  isLoading = false,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
  const companies = useSelector((state: RootState) => state.companies.items);
  const customers = useSelector((state: RootState) => state.customers.items);
  
  const [formData, setFormData] = useState<
    Omit<Invoice, "id" | "created_at" | "updated_at">
  >({
    company_id: 0,
    customer_id: 0,
    invoice_number: "",
    invoice_date: today(),
    due_date: today(),
    total_amount: 0,
    status: "draft",
  });

  const [items, setItems] = useState<
    Omit<InvoiceItem, "id" | "invoice_id" | "created_at" | "updated_at">[]
  >([]);

  const [newItem, setNewItem] = useState({
    description: "",
    quantity: 1,
    unit_price: 0,
    discount: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Product autocomplete state
  const [productInput, setProductInput] = useState("");
  const [productSuggestions, setProductSuggestions] = useState<ProductSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string>("");
  const [searchTimeoutId, setSearchTimeoutId] = useState<NodeJS.Timeout | null>(null);

  /**
   * Initialize companies and customers data when form mounts.
   * This ensures data is available even when navigating directly to Invoice page.
   * Loads data only if not already present (no duplicate fetching).
   */
  useEffect(() => {
    const initializeData = async () => {
      const fetchPromises: Promise<void>[] = [];

      // Load companies if not already loaded
      if (companies.length === 0) {
        fetchPromises.push(
          companyAPI.getAll().then((data) => {
            dispatch(setCompanies(data));
          }).catch((error) => {
            console.error("Failed to load companies:", error);
          })
        );
      }

      // Load customers if not already loaded
      // Use user's company_id or the first company's id
      const companyIdForCustomers = user?.company_id || companies[0]?.id;
      if (customers.length === 0 && companyIdForCustomers) {
        fetchPromises.push(
          customerAPI.getAll(companyIdForCustomers).then((data) => {
            dispatch(setCustomers(data));
          }).catch((error) => {
            console.error("Failed to load customers:", error);
          })
        );
      }

      // Execute all fetch operations in parallel
      if (fetchPromises.length > 0) {
        await Promise.all(fetchPromises);
      }
    };

    if (open) {
      initializeData();
    }
  }, [open, dispatch, companies.length, customers.length, user?.company_id]);

  useEffect(() => {
    if (invoice) {
      setFormData({
        company_id: invoice.company_id,
        customer_id: invoice.customer_id,
        invoice_number: invoice.invoice_number,
        invoice_date: normalizeToHtmlDate(invoice.invoice_date),
        due_date: normalizeToHtmlDate(invoice.due_date),
        total_amount: invoice.total_amount,
        status: invoice.status,
      });
      setItems(
        invoice.items?.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount,
          total_amount: item.total_amount,
        })) || []
      );
    } else {
      setFormData({
        company_id: companies[0]?.id || 0,
        customer_id: 0,
        invoice_number: "",
        invoice_date: today(),
        due_date: today(),
        total_amount: 0,
        status: "draft",
      });
      setItems([]);
    }
    setErrors({});
    setProductInput("");
    setProductSuggestions([]);
    setSearchError("");
  }, [invoice, open, companies]);

  useEffect(() => {
    const availableCustomerIds = customers
      .filter((customer) => customer.company_id === formData.company_id)
      .map((customer) => customer.id);

    if (availableCustomerIds.length === 0) {
      if (formData.customer_id !== 0) {
        setFormData((prev) => ({ ...prev, customer_id: 0 }));
      }
      return;
    }

    if (!availableCustomerIds.includes(formData.customer_id)) {
      setFormData((prev) => ({ ...prev, customer_id: availableCustomerIds[0] }));
    }
  }, [customers, formData.company_id, formData.customer_id]);

  /**
   * Debounced product search.
   * Called when user types in product input field.
   * Fetches matching products from backend (max 10 results).
   */
  const handleProductSearch = useCallback(
    (value: string) => {
      setProductInput(value);

      // Clear previous timeout
      if (searchTimeoutId) {
        clearTimeout(searchTimeoutId);
      }

      // If search is empty, clear suggestions
      if (!value.trim()) {
        setProductSuggestions([]);
        setSearchError("");
        return;
      }

      // Require valid company_id to search
      if (!formData.company_id || formData.company_id <= 0) {
        setSearchError("لطفاً ابتدا شرکت را انتخاب کنید");
        setProductSuggestions([]);
        return;
      }

      setSearchError("");

      // Debounce 300ms before making request
      const timeoutId = setTimeout(async () => {
        try {
          setIsSearching(true);
          const results = await productAPI.search(value, formData.company_id);
          setProductSuggestions(results);
        } catch (error: any) {
          console.error("Product search error:", error);
          setSearchError("خطا در جستجوی محصول");
          setProductSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);

      setSearchTimeoutId(timeoutId);
    },
    [formData.company_id, searchTimeoutId]
  );

  /**
   * Handle product selection from autocomplete dropdown.
   * Autofills description (name), unit_price, and sets quantity=1.
   */
  const handleProductSelect = useCallback(
    (product: ProductSearchResult | null) => {
      if (!product) {
        return;
      }

      setNewItem({
        description: product.name,
        quantity: 1,
        unit_price: product.unit_price,
        discount: 0,
      });

      setProductInput("");
      setProductSuggestions([]);
      setSearchError("");
    },
    []
  );

  /**
   * Handle exact code match on blur or Enter.
   * Calls /api/products/by-code/{code} endpoint.
   */
  const handleProductCodeBlur = useCallback(async () => {
    const trimmedInput = productInput.trim();
    if (!trimmedInput) return;

    // Require valid company_id to search
    if (!formData.company_id || formData.company_id <= 0) {
      setSearchError("لطفاً ابتدا شرکت را انتخاب کنید");
      return;
    }

    // Only try exact match if input looks like a code (no spaces, shorter than full name)
    if (trimmedInput.length <= 20) {
      try {
        setIsSearching(true);
        const product = await productAPI.getByCode(trimmedInput, formData.company_id);
        setNewItem({
          description: product.name,
          quantity: 1,
          unit_price: product.unit_price,
          discount: 0,
        });
        setProductInput("");
        setProductSuggestions([]);
        setSearchError("");
      } catch (error: any) {
        // 404 is expected if code doesn't exist - just continue with manual entry
        if (error.response?.status !== 404) {
          console.error("Product lookup error:", error);
          setSearchError("خطا در بارگذاری محصول");
        }
      } finally {
        setIsSearching(false);
      }
    }
  }, [productInput, formData.company_id]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | { name?: string; value: unknown }
    >
  ) => {
    const { name, value } = e.target as any;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<number>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name as string]: value,
    }));
  };

  const handleAddItem = () => {
    if (!newItem.description) {
      setErrors({ ...errors, description: PERSIAN_LABELS.requiredField });
      return;
    }

    const total = validateInvoiceTotal(
      newItem.quantity,
      newItem.unit_price,
      newItem.discount
    );

    const item = {
      description: newItem.description,
      quantity: newItem.quantity,
      unit_price: newItem.unit_price,
      discount: newItem.discount,
      total_amount: Math.max(0, total),
    };

    setItems([...items, item]);
    setNewItem({
      description: "",
      quantity: 1,
      unit_price: 0,
      discount: 0,
    });
    setProductInput("");
    setProductSuggestions([]);
    setSearchError("");
  };

  const handleDeleteItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total_amount, 0);
  };

  const handleSubmit = () => {
    if (!formData.invoice_number) {
      setErrors({ ...errors, invoice_number: PERSIAN_LABELS.requiredField });
      return;
    }
    if (!formData.customer_id) {
      setErrors({ ...errors, customer_id: PERSIAN_LABELS.requiredField });
      return;
    }
    if (items.length === 0) {
      setErrors({ ...errors, items: "حداقل یک اقلام لازم است" });
      return;
    }

    const totalAmount = calculateTotal();
    onSave(
      {
        ...formData,
        total_amount: totalAmount,
      },
      items
    );
  };

  const companyCustomers = customers.filter(
    (c) => c.company_id === formData.company_id
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth dir="rtl">
      <DialogTitle>
        {invoice ? PERSIAN_LABELS.editInvoice : PERSIAN_LABELS.addInvoice}
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {errors.general && <Alert severity="error">{errors.general}</Alert>}

        <Stack spacing={2}>
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel>{PERSIAN_LABELS.companies}</InputLabel>
              <Select
                name="company_id"
                value={formData.company_id}
                onChange={handleSelectChange}
                label={PERSIAN_LABELS.companies}
              >
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>{PERSIAN_LABELS.customers}</InputLabel>
              <Select
                name="customer_id"
                value={formData.customer_id || ""}
                onChange={handleSelectChange}
                label={PERSIAN_LABELS.customers}
              >
                {companyCustomers.map((customer) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              size="small"
              label={PERSIAN_LABELS.invoiceNumber}
              name="invoice_number"
              value={formData.invoice_number}
              onChange={handleChange}
              error={!!errors.invoice_number}
              helperText={errors.invoice_number}
              dir="rtl"
            />

            <TextField
              fullWidth
              size="small"
              label={PERSIAN_LABELS.status}
              name="status"
              select
              value={formData.status}
              onChange={handleChange}
              dir="rtl"
            >
              {INVOICE_STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              size="small"
              label={PERSIAN_LABELS.invoiceDate}
              name="invoice_date"
              value={formData.invoice_date}
              onChange={handleChange}
              type="date"
              dir="rtl"
            />

            <TextField
              fullWidth
              size="small"
              label={PERSIAN_LABELS.dueDate}
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              type="date"
              dir="rtl"
            />
          </Stack>

          <Box sx={{ mt: 2 }}>
            <Box sx={{ fontWeight: "bold", mb: 1 }}>
              {PERSIAN_LABELS.items}
            </Box>

            <Stack spacing={1} sx={{ mb: 2, p: 1, bgcolor: "#f5f5f5", borderRadius: 1 }}>
              <Stack direction="row" spacing={1}>
                {/* Product autocomplete with search */}
                <Autocomplete
                  fullWidth
                  size="small"
                  options={productSuggestions}
                  getOptionLabel={(option) =>
                    typeof option === "string"
                      ? option
                      : `${option.name}${option.sku ? ` (${option.sku})` : ""}`
                  }
                  inputValue={productInput}
                  onInputChange={(_, value) => handleProductSearch(value)}
                  onChange={(_, value) => handleProductSelect(value)}
                  onBlur={handleProductCodeBlur}
                  loading={isSearching}
                  noOptionsText="محصولی پیدا نشد"
                  loadingText="درحال جستجو..."
                  freeSolo
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={PERSIAN_LABELS.description}
                      dir="rtl"
                      error={!!searchError}
                      helperText={searchError}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isSearching ? (
                              <CircularProgress color="inherit" size={20} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} dir="rtl">
                      <Box>
                        <div>
                          <strong>{option.name}</strong>
                          {option.sku && (
                            <span style={{ marginRight: "8px", color: "#666" }}>
                              ({option.sku})
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "0.85em", color: "#999" }}>
                          {PERSIAN_LABELS.unitPrice}: {option.unit_price.toLocaleString()}
                        </div>
                      </Box>
                    </li>
                  )}
                />
                <TextField
                  size="small"
                  label={PERSIAN_LABELS.quantity}
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      quantity: parseFloat(e.target.value) || 0,
                    })
                  }
                  sx={{ width: "100px" }}
                  dir="rtl"
                />
                <TextField
                  size="small"
                  label={PERSIAN_LABELS.unitPrice}
                  type="number"
                  value={newItem.unit_price}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      unit_price: parseFloat(e.target.value) || 0,
                    })
                  }
                  sx={{ width: "120px" }}
                  dir="rtl"
                />
                <TextField
                  size="small"
                  label={PERSIAN_LABELS.discount}
                  type="number"
                  value={newItem.discount}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      discount: parseFloat(e.target.value) || 0,
                    })
                  }
                  sx={{ width: "100px" }}
                  dir="rtl"
                />
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleAddItem}
                  startIcon={<Add />}
                  className="form-primary-button"
                  sx={{ minWidth: "80px" }}
                >
                  {PERSIAN_LABELS.add}
                </Button>
              </Stack>
              {errors.description && (
                <Alert severity="error">{errors.description}</Alert>
              )}
            </Stack>

            <TableContainer sx={{ mb: 2, border: "1px solid #ddd" }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                  <TableRow>
                    <TableCell align="right">
                      {PERSIAN_LABELS.description}
                    </TableCell>
                    <TableCell align="right" sx={{ width: "80px" }}>
                      {PERSIAN_LABELS.quantity}
                    </TableCell>
                    <TableCell align="right" sx={{ width: "100px" }}>
                      {PERSIAN_LABELS.unitPrice}
                    </TableCell>
                    <TableCell align="right" sx={{ width: "80px" }}>
                      {PERSIAN_LABELS.discount}
                    </TableCell>
                    <TableCell align="right" sx={{ width: "100px" }}>
                      {PERSIAN_LABELS.totalAmount}
                    </TableCell>
                    <TableCell align="center" sx={{ width: "50px" }}>
                      {PERSIAN_LABELS.delete}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell align="right">{item.description}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">{item.unit_price}</TableCell>
                      <TableCell align="right">{item.discount}</TableCell>
                      <TableCell align="right">{item.total_amount}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteItem(index)}
                          color="error"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: "#f5f5f5", fontWeight: "bold" }}>
                    <TableCell colSpan={4} align="right">
                      {PERSIAN_LABELS.totalAmount}
                    </TableCell>
                    <TableCell align="right">{calculateTotal()}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onClose}
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

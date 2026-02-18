import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material";
import { Delete, Add } from "@mui/icons-material";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { Invoice, InvoiceItem } from "../../types";
import { validateInvoiceTotal } from "../../utils/validation";
import { PERSIAN_LABELS, INVOICE_STATUS_OPTIONS } from "../../utils/persian";
import { normalizeToHtmlDate, today } from "../../utils/dateUtils";

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
                <TextField
                  fullWidth
                  size="small"
                  label={PERSIAN_LABELS.description}
                  value={newItem.description}
                  onChange={(e) =>
                    setNewItem({ ...newItem, description: e.target.value })
                  }
                  dir="rtl"
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
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>{PERSIAN_LABELS.cancel}</Button>
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

import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Chip,
  Collapse,
  Card,
  Typography,
} from "@mui/material";
import {
  Edit,
  Delete,
  Add,
  KeyboardArrowDown,
  KeyboardArrowUp,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../store/store";
import {
  setInvoices,
  addInvoice,
  updateInvoice,
  deleteInvoice,
  setLoading,
} from "../../store/invoiceSlice";
import { Invoice, InvoiceItem } from "../../types";
import { invoiceAPI } from "../../api/invoices";
import { commissionAPI } from "../../api/commissions";
import { useAuth } from "../../context/AuthContext";
import { RoleGuard } from "../Common/RoleGuard";
import { InvoiceForm } from "./InvoiceForm";
import { PERSIAN_LABELS } from "../../utils/persian";
import { formatDateToPersian } from "../../utils/dateUtils";
import { hasPermission } from "../../utils/rbac";

export const InvoiceList: React.FC = () => {
  const { user } = useAuth();
  const canCreateInvoices = hasPermission(user?.role, "invoice:create");
  const canUpdateInvoices = hasPermission(user?.role, "invoice:update");
  const canDeleteInvoices = hasPermission(user?.role, "invoice:delete");
  const canCreateSnapshot = hasPermission(user?.role, "invoice:update");
  const canLockInvoices = hasPermission(user?.role, "invoice:lock");
  const dispatch = useDispatch<AppDispatch>();
  const invoices = useSelector((state: RootState) => state.invoices.items);
  const companies = useSelector((state: RootState) => state.companies.items);
  const customers = useSelector((state: RootState) => state.customers.items);
  const loading = useSelector((state: RootState) => state.invoices.loading);
  
  const [formOpen, setFormOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number>(
    user?.company_id || companies[0]?.id || 0
  );
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

  const loadInvoices = useCallback(async (companyId: number) => {
    try {
      dispatch(setLoading(true));
      const data = await invoiceAPI.getAll(companyId);
      dispatch(setInvoices(data));
    } catch (error) {
      console.error("Failed to load invoices:", error);
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  useEffect(() => {
    if (companies.length > 0 && selectedCompanyId === 0) {
      const userCompanyId =
        typeof user?.company_id === "number"
          ? companies.find((company) => company.id === user.company_id)?.id
          : undefined;
      setSelectedCompanyId(userCompanyId ?? companies[0].id);
    }
  }, [companies, selectedCompanyId, user?.company_id]);

  useEffect(() => {
    if (selectedCompanyId > 0) {
      loadInvoices(selectedCompanyId);
    }
  }, [selectedCompanyId, loadInvoices]);

  const handleAddClick = () => {
    setSelectedInvoice(null);
    setFormOpen(true);
  };

  const handleEditClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setFormOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedInvoice(null);
  };

  const handleFormSave = async (
    data: Omit<Invoice, "id" | "created_at" | "updated_at">,
    items: Omit<InvoiceItem, "id" | "invoice_id" | "created_at" | "updated_at">[]
  ) => {
    try {
      setFormLoading(true);
      if (selectedInvoice) {
        const updated = await invoiceAPI.update(selectedInvoice.id, data);
        dispatch(updateInvoice(updated));
      } else {
        const created = await invoiceAPI.create(data);
        // Create items for the invoice
        for (const item of items) {
          await invoiceAPI.createItem(created.id, item);
        }
        // Fetch the full invoice with items
        const fullInvoice = await invoiceAPI.getById(created.id);
        dispatch(addInvoice(fullInvoice));
      }
      handleFormClose();
    } catch (error) {
      console.error("Failed to save invoice:", error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteId === null) return;
    try {
      await invoiceAPI.delete(deleteId);
      dispatch(deleteInvoice(deleteId));
      setDeleteDialogOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Failed to delete invoice:", error);
    }
  };

  const handleCreateCommissionSnapshot = async (invoiceId: number) => {
    try {
      await commissionAPI.createSnapshot(invoiceId);
      alert("عکس‌العمل کمیسیون با موفقیت ایجاد شد");
    } catch (error) {
      console.error("Failed to create commission snapshot:", error);
    }
  };

  const toggleRowExpansion = (invoiceId: number) => {
    setExpandedRows((prev) =>
      prev.includes(invoiceId)
        ? prev.filter((id) => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const getCustomerName = (customerId: number) =>
    customers.find((c) => c.id === customerId)?.name || "";

  return (
    <Box sx={{ direction: "rtl" }}>
      {/* Header */}
      <Card
        sx={{
          mb: 3,
          p: 3,
          background: "linear-gradient(135deg, #2e5090 0%, #3d6ca8 100%)",
          color: "white",
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(46, 80, 144, 0.25)",
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{ justifyContent: "space-between", alignItems: "center" }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, color: "white" }}>
            {PERSIAN_LABELS.invoices}
          </Typography>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Box sx={{ minWidth: 220 }}>
              <FormControl
                fullWidth
                size="small"
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "10px",
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "transparent",
                    },
                  },
                }}
              >
                <InputLabel>{PERSIAN_LABELS.companies}</InputLabel>
                <Select
                  value={selectedCompanyId}
                  label={PERSIAN_LABELS.companies}
                  onChange={(e) => setSelectedCompanyId(e.target.value as number)}
                >
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <RoleGuard permission="invoice:create">
              <Button
                variant="outlined"
                className="add-button"
                startIcon={<Add />}
                onClick={handleAddClick}
                disabled={!canCreateInvoices}
                sx={{
                  fontWeight: 700,
                  px: 3,
                  py: 1.2,
                  "&:disabled": {
                    opacity: 0.6,
                    cursor: "not-allowed",
                  },
                }}
              >
                {PERSIAN_LABELS.addInvoice}
              </Button>
            </RoleGuard>
          </Stack>
        </Stack>
      </Card>

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          overflow: "hidden",
        }}
      >
        <Table>
          <TableHead sx={{ backgroundColor: "#f0f4f8" }}>
            <TableRow>
              <TableCell sx={{ width: "50px" }} />
              <TableCell
                align="right"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: "#2e5090",
                }}
              >
                {PERSIAN_LABELS.invoiceNumber}
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: "#2e5090",
                }}
              >
                {PERSIAN_LABELS.customers}
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: "#2e5090",
                }}
              >
                {PERSIAN_LABELS.invoiceDate}
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: "#2e5090",
                }}
              >
                {PERSIAN_LABELS.dueDate}
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: "#2e5090",
                }}
              >
                {PERSIAN_LABELS.totalAmount}
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: "#2e5090",
                }}
              >
                {PERSIAN_LABELS.status}
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  width: "150px",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: "#2e5090",
                }}
              >
                {PERSIAN_LABELS.edit}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((invoice) => (
              <React.Fragment key={invoice.id}>
                <TableRow hover>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => toggleRowExpansion(invoice.id)}
                    >
                      {expandedRows.includes(invoice.id) ? (
                        <KeyboardArrowUp />
                      ) : (
                        <KeyboardArrowDown />
                      )}
                    </IconButton>
                  </TableCell>
                  <TableCell align="right">{invoice.invoice_number}</TableCell>
                  <TableCell align="right">
                    {getCustomerName(invoice.customer_id)}
                  </TableCell>
                  <TableCell align="right">
                    {formatDateToPersian(invoice.invoice_date)}
                  </TableCell>
                  <TableCell align="right">
                    {formatDateToPersian(invoice.due_date)}
                  </TableCell>
                  <TableCell align="right">{invoice.total_amount}</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={
                        PERSIAN_LABELS[
                          invoice.status as keyof typeof PERSIAN_LABELS
                        ]
                      }
                      color={
                        invoice.status === "paid"
                          ? "success"
                          : invoice.status === "overdue"
                          ? "error"
                          : "primary"
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <RoleGuard permission="invoice:update">
                      {(canLockInvoices || !invoice.is_locked) && canUpdateInvoices && (
                        <IconButton
                          size="small"
                          onClick={() => handleEditClick(invoice)}
                          color="primary"
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      )}
                      {(canLockInvoices || invoice.status.toLowerCase() !== "paid") &&
                        canDeleteInvoices && (
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(invoice.id)}
                            color="error"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        )}
                      {canCreateSnapshot && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() =>
                            handleCreateCommissionSnapshot(invoice.id)
                          }
                          sx={{ ml: 1 }}
                        >
                          {PERSIAN_LABELS.createSnapshot}
                        </Button>
                      )}
                    </RoleGuard>
                    <RoleGuard permission="invoice:lock">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={async () => {
                          const updated = invoice.is_locked
                            ? await invoiceAPI.unlock(invoice.id)
                            : await invoiceAPI.lock(invoice.id);
                          dispatch(updateInvoice(updated));
                        }}
                        sx={{ ml: 1 }}
                      >
                        {invoice.is_locked ? "بازکردن قفل" : "قفل"}
                      </Button>
                    </RoleGuard>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={8} sx={{ p: 0 }}>
                    <Collapse
                      in={expandedRows.includes(invoice.id)}
                      timeout="auto"
                      unmountOnExit
                    >
                      <Box sx={{ p: 2, bgcolor: "#f9f9f9" }}>
                        <Box sx={{ fontWeight: "bold", mb: 1 }}>
                          {PERSIAN_LABELS.items}
                        </Box>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell align="right">
                                {PERSIAN_LABELS.description}
                              </TableCell>
                              <TableCell align="right">
                                {PERSIAN_LABELS.quantity}
                              </TableCell>
                              <TableCell align="right">
                                {PERSIAN_LABELS.unitPrice}
                              </TableCell>
                              <TableCell align="right">
                                {PERSIAN_LABELS.discount}
                              </TableCell>
                              <TableCell align="right">
                                {PERSIAN_LABELS.totalAmount}
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {invoice.items?.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell align="right">
                                  {item.description}
                                </TableCell>
                                <TableCell align="right">
                                  {item.quantity}
                                </TableCell>
                                <TableCell align="right">
                                  {item.unit_price}
                                </TableCell>
                                <TableCell align="right">
                                  {item.discount}
                                </TableCell>
                                <TableCell align="right">
                                  {item.total_amount}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <InvoiceForm
        open={formOpen}
        invoice={selectedInvoice}
        onSave={handleFormSave}
        onClose={handleFormClose}
        isLoading={formLoading}
      />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{PERSIAN_LABELS.delete}</DialogTitle>
        <DialogContent>{PERSIAN_LABELS.confirmDelete}</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            {PERSIAN_LABELS.cancel}
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
          >
            {PERSIAN_LABELS.delete}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

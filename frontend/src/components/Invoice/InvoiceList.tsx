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
import { hasAnyRole } from "../../utils/rbac";

export const InvoiceList: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;
  const canEditInvoices = hasAnyRole(role, ["OWNER", "ACCOUNTANT"]);
  const canDeleteInvoices = hasAnyRole(role, ["OWNER", "ACCOUNTANT"]);
  const canCreateSnapshot = hasAnyRole(role, ["OWNER", "ACCOUNTANT"]);
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
    companies[0]?.id || 0
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
      setSelectedCompanyId(companies[0].id);
    }
  }, [companies, selectedCompanyId]);

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
      <Stack
        direction="row"
        spacing={2}
        sx={{ mb: 3 }}
        justifyContent="space-between"
      >
        <Box sx={{ minWidth: 200 }}>
          <FormControl fullWidth size="small">
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
        <RoleGuard allowed={["OWNER", "ACCOUNTANT"]}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddClick}
            disabled={!canEditInvoices}
          >
            {PERSIAN_LABELS.addInvoice}
          </Button>
        </RoleGuard>
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: "#f5f5f5" }}>
            <TableRow>
              <TableCell sx={{ width: "50px" }} />
              <TableCell align="right">
                {PERSIAN_LABELS.invoiceNumber}
              </TableCell>
              <TableCell align="right">{PERSIAN_LABELS.customers}</TableCell>
              <TableCell align="right">
                {PERSIAN_LABELS.invoiceDate}
              </TableCell>
              <TableCell align="right">{PERSIAN_LABELS.dueDate}</TableCell>
              <TableCell align="right">{PERSIAN_LABELS.totalAmount}</TableCell>
              <TableCell align="right">{PERSIAN_LABELS.status}</TableCell>
              <TableCell align="center" sx={{ width: "150px" }}>
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
                    <RoleGuard allowed={["OWNER", "ACCOUNTANT"]}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditClick(invoice)}
                        color="primary"
                        disabled={!canEditInvoices}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(invoice.id)}
                        color="error"
                        disabled={!canDeleteInvoices}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          handleCreateCommissionSnapshot(invoice.id)
                        }
                        disabled={!canCreateSnapshot}
                        sx={{ ml: 1 }}
                      >
                        {PERSIAN_LABELS.createSnapshot}
                      </Button>
                    </RoleGuard>
                    <RoleGuard allowed={["OWNER"]}>
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

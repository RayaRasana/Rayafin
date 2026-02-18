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
  TextField,
  Card,
  Typography,
} from "@mui/material";
import { Edit, Delete, Add, Refresh } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../store/store";
import {
  setCommissions,
  addCommission,
  updateCommission,
  deleteCommission,
  setLoading,
} from "../../store/commissionSlice";
import { Commission } from "../../types";
import { commissionAPI } from "../../api/commissions";
import { useAuth } from "../../context/AuthContext";
import { RoleGuard } from "../Common/RoleGuard";
import { PERSIAN_LABELS } from "../../utils/persian";
import { validateCommissionPercent } from "../../utils/validation";
import { formatDateToPersian } from "../../utils/dateUtils";
import { hasPermission } from "../../utils/rbac";

export const CommissionList: React.FC = () => {
  const { user } = useAuth();
  const canManageCommissions = hasPermission(user?.role, "commission:approve");
  const dispatch = useDispatch<AppDispatch>();
  const commissions = useSelector((state: RootState) => state.commissions.items);
  const invoices = useSelector((state: RootState) => state.invoices.items);
  const users = useSelector((state: RootState) => state.users.items);
  const loading = useSelector((state: RootState) => state.commissions.loading);

  const [formOpen, setFormOpen] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | "all">(
    "all"
  );
  const [selectedUserId, setSelectedUserId] = useState<number | "all">("all");
  const [formData, setFormData] = useState({
    invoice_id: 0,
    user_id: 0,
    commission_percent: 0,
    commission_amount: 0,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const loadCommissions = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      let invoiceId: number | undefined = undefined;
      let userId: number | undefined = undefined;
      if (selectedInvoiceId !== "all") {
        invoiceId = selectedInvoiceId;
      }
      if (selectedUserId !== "all") {
        userId = selectedUserId;
      }
      const data = await commissionAPI.getAll(invoiceId, userId);
      dispatch(setCommissions(data));
    } catch (error) {
      console.error("Failed to load commissions:", error);
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, selectedInvoiceId, selectedUserId]);

  useEffect(() => {
    loadCommissions();
  }, [loadCommissions]);

  const handleAddClick = () => {
    setSelectedCommission(null);
    setFormData({
      invoice_id: 0,
      user_id: 0,
      commission_percent: 0,
      commission_amount: 0,
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const handleEditClick = (commission: Commission) => {
    setSelectedCommission(commission);
    setFormData({
      invoice_id: commission.invoice_id,
      user_id: commission.user_id,
      commission_percent: commission.commission_percent,
      commission_amount: commission.commission_amount,
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedCommission(null);
  };

  const handleFormSave = async () => {
    const errors: Record<string, string> = {};

    if (!formData.invoice_id) {
      errors.invoice_id = PERSIAN_LABELS.requiredField;
    }
    if (!formData.user_id) {
      errors.user_id = PERSIAN_LABELS.requiredField;
    }
    if (!validateCommissionPercent(formData.commission_percent)) {
      errors.commission_percent = "درصد کمیسیون باید بین 0 و 100 باشد";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setFormLoading(true);
      if (selectedCommission) {
        const updated = await commissionAPI.update(selectedCommission.id, {
          commission_percent: formData.commission_percent,
          commission_amount: formData.commission_amount,
        });
        dispatch(updateCommission(updated));
      } else {
        const created = await commissionAPI.create(formData as any);
        dispatch(addCommission(created));
      }
      handleFormClose();
    } catch (error) {
      console.error("Failed to save commission:", error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteId === null) return;
    try {
      await commissionAPI.delete(deleteId);
      dispatch(deleteCommission(deleteId));
      setDeleteDialogOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Failed to delete commission:", error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const getInvoiceNumber = (invoiceId: number) =>
    invoices.find((i) => i.id === invoiceId)?.invoice_number || "";

  const getUserName = (userId: number) =>
    users.find((u) => u.id === userId)?.full_name || "";

  const totalCommissions = commissions.reduce(
    (sum, c) => sum + c.commission_amount,
    0
  );

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
            {PERSIAN_LABELS.commissions}
          </Typography>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Box sx={{ minWidth: 200 }}>
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
                <InputLabel>{PERSIAN_LABELS.invoices}</InputLabel>
                <Select
                  value={selectedInvoiceId}
                  label={PERSIAN_LABELS.invoices}
                  onChange={(e) => setSelectedInvoiceId(e.target.value as number | "all")}
                >
                  <MenuItem value="all">{PERSIAN_LABELS.invoices}</MenuItem>
                  {invoices.map((invoice) => (
                    <MenuItem key={invoice.id} value={invoice.id}>
                      {invoice.invoice_number}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ minWidth: 200 }}>
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
                <InputLabel>{PERSIAN_LABELS.users}</InputLabel>
                <Select
                  value={selectedUserId}
                  label={PERSIAN_LABELS.users}
                  onChange={(e) => setSelectedUserId(e.target.value as number | "all")}
                >
                  <MenuItem value="all">{PERSIAN_LABELS.users}</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.full_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Button
              size="small"
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => loadCommissions()}
              sx={{
                color: "white",
                borderColor: "rgba(255, 255, 255, 0.8)",
                fontWeight: 600,
                borderRadius: "10px",
                px: 2,
                borderWidth: 2,
                transition: "all 0.3s ease",
                "&:hover": {
                  borderColor: "white",
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  borderWidth: 2,
                },
              }}
            >
              {PERSIAN_LABELS.search}
            </Button>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddClick}
              disabled={!canManageCommissions}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                color: "#2e5090",
                fontWeight: 700,
                borderRadius: "12px",
                px: 3,
                py: 1.2,
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
                transition: "all 0.3s ease",

                "&:hover": {
                  backgroundColor: "white",
                  transform: "translateY(-2px)",
                  boxShadow: "0 6px 24px rgba(0, 0, 0, 0.25)",
                },
                "&:disabled": {
                  backgroundColor: "rgba(255, 255, 255, 0.5)",
                  color: "#94a3b8",
                },
              }}
            >
              {PERSIAN_LABELS.add}
            </Button>
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
              <TableCell
                align="right"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: "#2e5090",
                }}
              >
                {PERSIAN_LABELS.invoices}
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: "#2e5090",
                }}
              >
                {PERSIAN_LABELS.users}
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: "#2e5090",
                }}
              >
                {PERSIAN_LABELS.commissionPercent}
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: "#2e5090",
                }}
              >
                {PERSIAN_LABELS.commissionAmount}
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: "#2e5090",
                }}
              >
                {PERSIAN_LABELS.paidDate}
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  width: "120px",
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
            {commissions.map((commission) => (
              <TableRow key={commission.id} hover>
                <TableCell align="right">
                  {getInvoiceNumber(commission.invoice_id)}
                </TableCell>
                <TableCell align="right">
                  {getUserName(commission.user_id)}
                </TableCell>
                <TableCell align="right">
                  {commission.commission_percent}%
                </TableCell>
                <TableCell align="right">
                  {commission.commission_amount}
                </TableCell>
                <TableCell align="right">
                  {commission.paid_date
                    ? formatDateToPersian(commission.paid_date)
                    : "-"}
                </TableCell>
                <TableCell align="center">
                  <RoleGuard permission="commission:approve">
                    <IconButton
                      size="small"
                      onClick={() => handleEditClick(commission)}
                      color="primary"
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(commission.id)}
                      color="error"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                    {commission.status !== "approved" && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={async () => {
                          const updated = await commissionAPI.approve(commission.id);
                          dispatch(updateCommission(updated));
                        }}
                        sx={{ ml: 1 }}
                      >
                        تایید
                      </Button>
                    )}
                    {commission.status === "approved" && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={async () => {
                          const updated = await commissionAPI.markPaid(commission.id);
                          dispatch(updateCommission(updated));
                        }}
                        sx={{ ml: 1 }}
                      >
                        پرداخت شد
                      </Button>
                    )}
                  </RoleGuard>
                </TableCell>
              </TableRow>
            ))}
            {commissions.length > 0 && (
              <TableRow sx={{ bgcolor: "#f5f5f5", fontWeight: "bold" }}>
                <TableCell colSpan={3} align="right">
                  {PERSIAN_LABELS.totalAmount}
                </TableCell>
                <TableCell align="right">{totalCommissions}</TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={formOpen} onClose={handleFormClose} maxWidth="sm" fullWidth dir="rtl">
        <DialogTitle>
          {selectedCommission
            ? PERSIAN_LABELS.commissions
            : PERSIAN_LABELS.add}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <FormControl fullWidth error={!!formErrors.invoice_id}>
              <InputLabel>{PERSIAN_LABELS.invoices}</InputLabel>
              <Select
                value={formData.invoice_id}
                onChange={(e) =>
                  setFormData({ ...formData, invoice_id: e.target.value as number })
                }
                label={PERSIAN_LABELS.invoices}
                disabled={!!selectedCommission}
              >
                {invoices.map((invoice) => (
                  <MenuItem key={invoice.id} value={invoice.id}>
                    {invoice.invoice_number}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth error={!!formErrors.user_id}>
              <InputLabel>{PERSIAN_LABELS.users}</InputLabel>
              <Select
                value={formData.user_id}
                onChange={(e) =>
                  setFormData({ ...formData, user_id: e.target.value as number })
                }
                label={PERSIAN_LABELS.users}
                disabled={!!selectedCommission}
              >
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.full_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label={PERSIAN_LABELS.commissionPercent}
              type="number"
              inputProps={{ min: "0", max: "100" }}
              value={formData.commission_percent}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  commission_percent: parseFloat(e.target.value) || 0,
                })
              }
              error={!!formErrors.commission_percent}
              helperText={formErrors.commission_percent}
              dir="rtl"
            />

            <TextField
              label={PERSIAN_LABELS.commissionAmount}
              type="number"
              value={formData.commission_amount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  commission_amount: parseFloat(e.target.value) || 0,
                })
              }
              dir="rtl"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleFormClose}>{PERSIAN_LABELS.cancel}</Button>
          <Button
            onClick={handleFormSave}
            variant="contained"
            disabled={formLoading}
          >
            {PERSIAN_LABELS.save}
          </Button>
        </DialogActions>
      </Dialog>

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

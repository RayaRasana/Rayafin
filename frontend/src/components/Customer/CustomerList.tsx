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
  Card,
  Typography,
} from "@mui/material";
import { Edit, Delete, Add } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../store/store";
import {
  setCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  setLoading,
} from "../../store/customerSlice";
import { Customer } from "../../types";
import { customerAPI } from "../../api/customers";
import { CustomerForm } from "./CustomerForm";
import { PERSIAN_LABELS } from "../../utils/persian";
import { useAuth } from "../../context/AuthContext";
import { hasPermission } from "../../utils/rbac";

export const CustomerList: React.FC = () => {
  const { user } = useAuth();
  const canCreateCustomer = hasPermission(user?.role, "customer:create");
  const canUpdateCustomer = hasPermission(user?.role, "customer:update");
  const canDeleteCustomer = hasPermission(user?.role, "customer:delete");
  const dispatch = useDispatch<AppDispatch>();
  const customers = useSelector((state: RootState) => state.customers.items);
  const companies = useSelector((state: RootState) => state.companies.items);
  const loading = useSelector((state: RootState) => state.customers.loading);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | "all">(
    user?.company_id || companies[0]?.id || "all"
  );

  const loadCustomers = useCallback(async (companyId: number) => {
    try {
      dispatch(setLoading(true));
      const data = await customerAPI.getAll(companyId);
      dispatch(setCustomers(data));
    } catch (error) {
      console.error("Failed to load customers:", error);
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  useEffect(() => {
    if (companies.length > 0 && selectedCompanyId === "all") {
      const userCompanyId =
        typeof user?.company_id === "number"
          ? companies.find((company) => company.id === user.company_id)?.id
          : undefined;
      setSelectedCompanyId(userCompanyId ?? companies[0].id);
    }
  }, [companies, selectedCompanyId, user?.company_id]);

  useEffect(() => {
    if (selectedCompanyId !== "all") {
      loadCustomers(selectedCompanyId);
    }
  }, [selectedCompanyId, loadCustomers]);

  const handleAddClick = useCallback(() => {
    if (!canCreateCustomer) {
      return;
    }
    setSelectedCustomer(null);
    setFormOpen(true);
  }, [canCreateCustomer]);

  const handleEditClick = useCallback((customer: Customer) => {
    if (!canUpdateCustomer) {
      return;
    }
    setSelectedCustomer(customer);
    setFormOpen(true);
  }, [canUpdateCustomer]);

  const handleDeleteClick = useCallback((id: number) => {
    if (!canDeleteCustomer) {
      return;
    }
    setDeleteId(id);
    setDeleteDialogOpen(true);
  }, [canDeleteCustomer]);

  const handleFormClose = useCallback(() => {
    setFormOpen(false);
    setSelectedCustomer(null);
  }, []);

  const handleFormSave = useCallback(
    async (
      data: Omit<Customer, "id" | "created_at" | "updated_at">
    ) => {
      try {
        setFormLoading(true);
        if (selectedCustomer) {
          const updated = await customerAPI.update(
            selectedCustomer.id,
            data,
            data.company_id
          );
          dispatch(updateCustomer(updated));
        } else {
          const created = await customerAPI.create(data, data.company_id);
          dispatch(addCustomer(created));
        }
        handleFormClose();
      } catch (error) {
        console.error("Failed to save customer:", error);
      } finally {
        setFormLoading(false);
      }
    },
    [selectedCustomer, dispatch, handleFormClose]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (deleteId === null) return;
    try {
      await customerAPI.delete(
        deleteId,
        selectedCompanyId === "all" ? undefined : selectedCompanyId
      );
      dispatch(deleteCustomer(deleteId));
      setDeleteDialogOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Failed to delete customer:", error);
    }
  }, [deleteId, dispatch, selectedCompanyId]);

  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setDeleteId(null);
  }, []);

  const getCompanyName = (companyId: number) => {
    return companies.find((c) => c.id === companyId)?.name || "";
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ direction: "rtl" }}>
      {/* Header */}
      <Card
        sx={{
          mb: 3,
          p: 3,
          background: "linear-gradient(135deg, #2e5090 0%, #3d6ca8 100%)",
          color: "white",
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{ justifyContent: "space-between", alignItems: "center" }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {PERSIAN_LABELS.customers}
          </Typography>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Box sx={{ minWidth: 200 }}>
              <FormControl fullWidth size="small" sx={{ backgroundColor: "white", borderRadius: "8px" }}>
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
            {canCreateCustomer && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddClick}
                sx={{
                  backgroundColor: "white",
                  color: "#2e5090",
                  fontWeight: 600,
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",

                  "&:hover": {
                    backgroundColor: "#f0f9ff",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
                  },
                }}
              >
                {PERSIAN_LABELS.addCustomer}
              </Button>
            )}
          </Stack>
        </Stack>
      </Card>

      {/* Customers Table */}
      {customers.length === 0 ? (
        <Card
          sx={{
            p: 4,
            textAlign: "center",
            borderRadius: "16px",
          }}
        >
          <Typography
            variant="body1"
            sx={{
              color: "#64748b",
            }}
          >
            {PERSIAN_LABELS.noData}
          </Typography>
        </Card>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: "16px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: "#2e5090",
                  }}
                >
                  {PERSIAN_LABELS.customerName}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: "#2e5090",
                  }}
                >
                  {PERSIAN_LABELS.customerEmail}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: "#2e5090",
                  }}
                >
                  {PERSIAN_LABELS.customerPhone}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: "#2e5090",
                  }}
                >
                  {PERSIAN_LABELS.companies}
                </TableCell>
                {(canUpdateCustomer || canDeleteCustomer) && (
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      color: "#2e5090",
                      width: "140px",
                    }}
                  >
                    {PERSIAN_LABELS.edit}
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.map((customer) => (
                <TableRow
                  key={customer.id}
                  hover
                  sx={{
                    transition: "all 0.2s ease",

                    "&:hover": {
                      backgroundColor: "#f0f9ff",
                      boxShadow: "0 4px 12px rgba(46, 80, 144, 0.08)",
                    },
                  }}
                >
                  <TableCell align="right" sx={{ textAlign: "right" }}>
                    {customer.name}
                  </TableCell>
                  <TableCell align="right" sx={{ textAlign: "right" }}>
                    {customer.email}
                  </TableCell>
                  <TableCell align="right" sx={{ textAlign: "right" }}>
                    {customer.phone}
                  </TableCell>
                  <TableCell align="right" sx={{ textAlign: "right" }}>
                    {getCompanyName(customer.company_id)}
                  </TableCell>
                  {(canUpdateCustomer || canDeleteCustomer) && (
                    <TableCell align="center">
                      <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                        {canUpdateCustomer && (
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(customer)}
                            color="primary"
                            sx={{
                              borderRadius: "8px",
                              transition: "all 0.2s ease",

                              "&:hover": {
                                backgroundColor: "#e0e7ff",
                              },
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        )}
                        {canDeleteCustomer && (
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(customer.id)}
                            color="error"
                            sx={{
                              borderRadius: "8px",
                              transition: "all 0.2s ease",

                              "&:hover": {
                                backgroundColor: "#fee2e2",
                              },
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Customer Form Dialog */}
      {(canCreateCustomer || canUpdateCustomer) && (
        <CustomerForm
          open={formOpen}
          customer={selectedCustomer}
          onSave={handleFormSave}
          onClose={handleFormClose}
          isLoading={formLoading}
          defaultCompanyId={
            selectedCompanyId === "all" ? undefined : selectedCompanyId
          }
        />
      )}

      {/* Delete Confirmation Dialog */}
      {canDeleteCustomer && (
        <Dialog
          open={deleteDialogOpen}
          onClose={handleCloseDeleteDialog}
          PaperProps={{
            sx: {
              borderRadius: "16px",
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 700, color: "#2e5090" }}>
            {PERSIAN_LABELS.delete}
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Typography>{PERSIAN_LABELS.confirmDelete}</Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={handleCloseDeleteDialog}>
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
      )}
    </Box>
  );
};

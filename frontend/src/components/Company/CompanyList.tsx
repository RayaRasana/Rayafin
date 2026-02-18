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
  Typography,
  Card,
} from "@mui/material";
import { Edit, Delete, Add } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../store/store";
import {
  setCompanies,
  addCompany,
  updateCompany,
  deleteCompany,
  setLoading,
} from "../../store/companySlice";
import { Company } from "../../types";
import { companyAPI } from "../../api/companies";
import { CompanyForm } from "./CompanyForm";
import { PERSIAN_LABELS } from "../../utils/persian";
import { useAuth } from "../../context/AuthContext";
import { hasPermission } from "../../utils/rbac";

export const CompanyList: React.FC = () => {
  const { user } = useAuth();
  const canReadCompany = hasPermission(user?.role, "company:read");
  const canCreateCompany = hasPermission(user?.role, "company:create");
  const canUpdateCompany = hasPermission(user?.role, "company:update");
  const canDeleteCompany = hasPermission(user?.role, "company:delete");
  const dispatch = useDispatch<AppDispatch>();
  const companies = useSelector((state: RootState) => state.companies.items);
  const loading = useSelector((state: RootState) => state.companies.loading);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const loadCompanies = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      const data = await companyAPI.getAll();
      dispatch(setCompanies(data));
    } catch (error) {
      console.error("Failed to load companies:", error);
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const handleAddClick = useCallback(() => {
    if (!canCreateCompany) {
      return;
    }
    setSelectedCompany(null);
    setFormOpen(true);
  }, [canCreateCompany]);

  const handleEditClick = useCallback((company: Company) => {
    if (!canUpdateCompany) {
      return;
    }
    setSelectedCompany(company);
    setFormOpen(true);
  }, [canUpdateCompany]);

  const handleDeleteClick = useCallback((id: number) => {
    if (!canDeleteCompany) {
      return;
    }
    setDeleteId(id);
    setDeleteDialogOpen(true);
  }, [canDeleteCompany]);

  const handleFormClose = useCallback(() => {
    setFormOpen(false);
    setSelectedCompany(null);
  }, []);

  const handleFormSave = useCallback(
    async (
      data: Omit<Company, "id" | "created_at" | "updated_at">
    ) => {
      try {
        setFormLoading(true);
        if (selectedCompany) {
          const updated = await companyAPI.update(selectedCompany.id, data);
          dispatch(updateCompany(updated));
        } else {
          const created = await companyAPI.create(data);
          dispatch(addCompany(created));
        }
        handleFormClose();
      } catch (error) {
        console.error("Failed to save company:", error);
      } finally {
        setFormLoading(false);
      }
    },
    [selectedCompany, dispatch, handleFormClose]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (deleteId === null) return;
    try {
      await companyAPI.delete(deleteId);
      dispatch(deleteCompany(deleteId));
      setDeleteDialogOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Failed to delete company:", error);
    }
  }, [deleteId, dispatch]);

  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setDeleteId(null);
  }, []);

  if (!canReadCompany) {
    return null;
  }

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
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(46, 80, 144, 0.25)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, color: "white" }}>
            {PERSIAN_LABELS.companies}
          </Typography>
          {canCreateCompany && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddClick}
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
              }}
            >
              {PERSIAN_LABELS.addCompany}
            </Button>
          )}
        </Box>
      </Card>

      {/* Companies Table */}
      {companies.length === 0 ? (
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
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
            overflow: "hidden",
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f0f4f8" }}>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: "#2e5090",
                  }}
                >
                  {PERSIAN_LABELS.companyName}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: "#2e5090",
                  }}
                >
                  {PERSIAN_LABELS.companyEmail}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: "#2e5090",
                  }}
                >
                  {PERSIAN_LABELS.companyPhone}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: "#2e5090",
                  }}
                >
                  {PERSIAN_LABELS.taxId}
                </TableCell>
                {(canUpdateCompany || canDeleteCompany) && (
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
              {companies.map((company) => (
                <TableRow
                  key={company.id}
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
                    {company.name}
                  </TableCell>
                  <TableCell align="right" sx={{ textAlign: "right" }}>
                    {company.email}
                  </TableCell>
                  <TableCell align="right" sx={{ textAlign: "right" }}>
                    {company.phone}
                  </TableCell>
                  <TableCell align="right" sx={{ textAlign: "right" }}>
                    {company.tax_id}
                  </TableCell>
                  {(canUpdateCompany || canDeleteCompany) && (
                    <TableCell align="center">
                      <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                        {canUpdateCompany && (
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(company)}
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
                        {canDeleteCompany && (
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(company.id)}
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

      {/* Company Form Dialog */}
      {canCreateCompany && (
        <CompanyForm
          open={formOpen}
          company={selectedCompany}
          onSave={handleFormSave}
          onClose={handleFormClose}
          isLoading={formLoading}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {canDeleteCompany && (
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
            <Button
              onClick={handleCloseDeleteDialog}
              sx={{
                color: "#64748b",
                fontWeight: 600,
              }}
            >
              {PERSIAN_LABELS.cancel}
            </Button>
            <Button
              onClick={handleConfirmDelete}
              color="error"
              variant="contained"
              sx={{
                fontWeight: 600,
                px: 3,
              }}
            >
              {PERSIAN_LABELS.delete}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

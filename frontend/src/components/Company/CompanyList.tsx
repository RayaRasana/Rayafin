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

export const CompanyList: React.FC = () => {
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
    setSelectedCompany(null);
    setFormOpen(true);
  }, []);

  const handleEditClick = useCallback((company: Company) => {
    setSelectedCompany(company);
    setFormOpen(true);
  }, []);

  const handleDeleteClick = useCallback((id: number) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  }, []);

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
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {PERSIAN_LABELS.companies}
          </Typography>
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
            {PERSIAN_LABELS.addCompany}
          </Button>
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
                  <TableCell align="center">
                    <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
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
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Company Form Dialog */}
      <CompanyForm
        open={formOpen}
        company={selectedCompany}
        onSave={handleFormSave}
        onClose={handleFormClose}
        isLoading={formLoading}
      />

      {/* Delete Confirmation Dialog */}
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
    </Box>
  );
};

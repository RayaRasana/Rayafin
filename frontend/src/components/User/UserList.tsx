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
  Chip,
  Card,
  Typography,
  MenuItem,
  Stack,
} from "@mui/material";
import { Edit, Delete, Add } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../store/store";
import {
  setUsers,
  addUser,
  updateUser,
  deleteUser,
  setLoading,
} from "../../store/userSlice";
import { User } from "../../types";
import { userAPI } from "../../api/users";
import { UserForm, UserFormData } from "./UserForm";
import { SelectField } from "../Common/SelectField";
import { PERSIAN_LABELS } from "../../utils/persian";
import { useAuth } from "../../context/AuthContext";

export const UserList: React.FC = () => {
  const { user: authUser } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const users = useSelector((state: RootState) => state.users.items);
  const companies = useSelector((state: RootState) => state.companies.items);
  const loading = useSelector((state: RootState) => state.users.loading);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number>(
    authUser?.company_id || companies[0]?.id || 0
  );

  const loadUsers = useCallback(async (companyId: number) => {
    try {
      dispatch(setLoading(true));
      const data = await userAPI.getAll(companyId);
      dispatch(setUsers(data));
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  useEffect(() => {
    if (companies.length > 0 && selectedCompanyId === 0) {
      const preferredCompanyId =
        typeof authUser?.company_id === "number"
          ? companies.find((company) => company.id === authUser.company_id)?.id
          : undefined;
      setSelectedCompanyId(preferredCompanyId ?? companies[0].id);
    }
  }, [companies, selectedCompanyId, authUser?.company_id]);

  useEffect(() => {
    if (selectedCompanyId > 0) {
      loadUsers(selectedCompanyId);
    }
  }, [selectedCompanyId, loadUsers]);

  const handleAddClick = useCallback(() => {
    setSelectedUser(null);
    setFormOpen(true);
  }, []);

  const handleEditClick = useCallback((user: User) => {
    setSelectedUser(user);
    setFormOpen(true);
  }, []);

  const handleDeleteClick = useCallback((id: number) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  }, []);

  const handleFormClose = useCallback(() => {
    setFormOpen(false);
    setSelectedUser(null);
  }, []);

  const handleFormSave = useCallback(
    async (data: UserFormData) => {
      try {
        setFormLoading(true);
        if (selectedUser) {
          const updated = await userAPI.update(selectedUser.id, {
            email: data.email,
            full_name: data.full_name,
            password: data.password || undefined,
          }, selectedCompanyId);
          dispatch(updateUser(updated));
        } else {
          const created = await userAPI.create({
            email: data.email,
            full_name: data.full_name,
            password: data.password,
          }, data.company_id || selectedCompanyId);
          dispatch(addUser(created));
        }
        await loadUsers(selectedCompanyId);
        handleFormClose();
      } catch (error) {
        console.error("Failed to save user:", error);
      } finally {
        setFormLoading(false);
      }
    },
    [selectedUser, dispatch, handleFormClose, loadUsers, selectedCompanyId]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (deleteId === null) return;
    try {
      await userAPI.delete(deleteId, selectedCompanyId);
      dispatch(deleteUser(deleteId));
      setDeleteDialogOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  }, [deleteId, dispatch, selectedCompanyId]);

  const getCompanyName = (companyId?: number) => {
    if (!companyId) return "-";
    return companies.find((c) => c.id === companyId)?.name || "-";
  };

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
          background: "linear-gradient(135deg, #D4A644 0%, #BF933A 100%)",
          color: "white",
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(212, 166, 68, 0.25)",
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, color: "white" }}>
            {PERSIAN_LABELS.users}
          </Typography>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <SelectField
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value as number)}
              options={companies.map((c) => ({ id: c.id, name: c.name }))}
              minWidth={160}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddClick}
              sx={{
                backgroundColor: "#D4A644",
                color: "#ffffff",
                fontWeight: 700,
                px: 3,
                height: 44,
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: "#BF933A",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.16)",
                },
              }}
            >
              {PERSIAN_LABELS.addUser}
            </Button>
          </Stack>
        </Stack>
      </Card>

      {/* Users Table */}
      {users.length === 0 ? (
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
              <TableRow sx={{ backgroundColor: "#FBF9F6" }}>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: "#D4A644",
                  }}
                >
                  {PERSIAN_LABELS.username}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: "#D4A644",
                  }}
                >
                  {PERSIAN_LABELS.fullName}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: "#D4A644",
                  }}
                >
                  {PERSIAN_LABELS.email}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: "#D4A644",
                  }}
                >
                  نقش
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: "#D4A644",
                  }}
                >
                  {PERSIAN_LABELS.companies}
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: "#D4A644",
                    width: "140px",
                  }}
                >
                  {PERSIAN_LABELS.edit}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow
                  key={user.id}
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
                    {user.username}
                  </TableCell>
                  <TableCell align="right" sx={{ textAlign: "right" }}>
                    {user.full_name}
                  </TableCell>
                  <TableCell align="right" sx={{ textAlign: "right" }}>
                    {user.email}
                  </TableCell>
                  <TableCell align="right" sx={{ textAlign: "right" }}>
                    <Chip label={user.role || "-"} size="small" />
                  </TableCell>
                  <TableCell align="right" sx={{ textAlign: "right" }}>
                    {getCompanyName(user.company_id)}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditClick(user)}
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
                        onClick={() => handleDeleteClick(user.id)}
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

      {/* User Form Dialog */}
      <UserForm
        open={formOpen}
        user={selectedUser}
        onSave={handleFormSave}
        onClose={handleFormClose}
        isLoading={formLoading}
        defaultCompanyId={selectedCompanyId || undefined}
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
        <DialogTitle sx={{ fontWeight: 700, color: "#D4A644" }}>
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

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
import { PERSIAN_LABELS } from "../../utils/persian";

export const UserList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const users = useSelector((state: RootState) => state.users.items);
  const companies = useSelector((state: RootState) => state.companies.items);
  const loading = useSelector((state: RootState) => state.users.loading);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      const data = await userAPI.getAll();
      dispatch(setUsers(data));
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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
          });
          dispatch(updateUser(updated));
        } else {
          const created = await userAPI.create({
            email: data.email,
            full_name: data.full_name,
            password: data.password,
          });
          dispatch(addUser(created));
        }
        await loadUsers();
        handleFormClose();
      } catch (error) {
        console.error("Failed to save user:", error);
      } finally {
        setFormLoading(false);
      }
    },
    [selectedUser, dispatch, handleFormClose, loadUsers]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (deleteId === null) return;
    try {
      await userAPI.delete(deleteId);
      dispatch(deleteUser(deleteId));
      setDeleteDialogOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  }, [deleteId, dispatch]);

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
            {PERSIAN_LABELS.users}
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
            {PERSIAN_LABELS.addUser}
          </Button>
        </Box>
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
                  {PERSIAN_LABELS.username}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: "#2e5090",
                  }}
                >
                  {PERSIAN_LABELS.fullName}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: "#2e5090",
                  }}
                >
                  {PERSIAN_LABELS.email}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: "#2e5090",
                  }}
                >
                  نقش
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

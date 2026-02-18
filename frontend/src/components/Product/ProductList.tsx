import React, { useEffect, useState, useCallback, useRef } from "react";
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
  Alert,
  Chip,
} from "@mui/material";
import { Edit, Delete, Add, Upload, Download } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../store/store";
import {
  setProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  setLoading,
} from "../../store/productSlice";
import { Product } from "../../types";
import { productAPI } from "../../api/products";
import { ProductForm } from "./ProductForm";
import { PERSIAN_LABELS } from "../../utils/persian";
import { useAuth } from "../../context/AuthContext";
import { hasPermission } from "../../utils/rbac";

export const ProductList: React.FC = () => {
  const { user } = useAuth();
  const canCreateProduct = hasPermission(user?.role, "product:create");
  const canUpdateProduct = hasPermission(user?.role, "product:update");
  const canDeleteProduct = hasPermission(user?.role, "product:delete");
  const canImportProduct = hasPermission(user?.role, "product:import");
  
  const dispatch = useDispatch<AppDispatch>();
  const products = useSelector((state: RootState) => state.products.items);
  const companies = useSelector((state: RootState) => state.companies.items);
  const loading = useSelector((state: RootState) => state.products.loading);
  
  const [formOpen, setFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | "all">(
    user?.company_id || companies[0]?.id || "all"
  );
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    imported: number;
    errors: string[];
    message: string;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProducts = useCallback(
    async (companyId: number) => {
      try {
        dispatch(setLoading(true));
        const data = await productAPI.getAll(companyId);
        dispatch(setProducts(data));
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

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
      loadProducts(selectedCompanyId);
    }
  }, [selectedCompanyId, loadProducts]);

  const handleAddClick = useCallback(() => {
    if (!canCreateProduct) {
      return;
    }
    setSelectedProduct(null);
    setFormOpen(true);
  }, [canCreateProduct]);

  const handleEditClick = useCallback(
    (product: Product) => {
      if (!canUpdateProduct) {
        return;
      }
      setSelectedProduct(product);
      setFormOpen(true);
    },
    [canUpdateProduct]
  );

  const handleDeleteClick = useCallback(
    (id: number) => {
      if (!canDeleteProduct) {
        return;
      }
      setDeleteId(id);
      setDeleteDialogOpen(true);
    },
    [canDeleteProduct]
  );

  const handleFormClose = useCallback(() => {
    setFormOpen(false);
    setSelectedProduct(null);
  }, []);

  const handleFormSave = useCallback(
    async (data: Omit<Product, "id" | "created_at" | "updated_at">) => {
      try {
        setFormLoading(true);
        if (selectedProduct) {
          const updated = await productAPI.update(
            selectedProduct.id,
            data,
            data.company_id
          );
          dispatch(updateProduct(updated));
        } else {
          const created = await productAPI.create(data, data.company_id);
          dispatch(addProduct(created));
        }
        handleFormClose();
      } catch (error) {
        console.error("Failed to save product:", error);
      } finally {
        setFormLoading(false);
      }
    },
    [selectedProduct, dispatch, handleFormClose]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (deleteId === null || selectedCompanyId === "all") return;
    try {
      await productAPI.delete(deleteId, selectedCompanyId);
      dispatch(deleteProduct(deleteId));
      setDeleteDialogOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  }, [deleteId, dispatch, selectedCompanyId]);

  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setDeleteId(null);
  }, []);

  const handleImportClick = useCallback(() => {
    if (!canImportProduct) {
      return;
    }
    setImportDialogOpen(true);
    setImportResult(null);
    setSelectedFile(null);
  }, [canImportProduct]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResult(null);
    }
  }, []);

  const handleImportSubmit = useCallback(async () => {
    if (!selectedFile || selectedCompanyId === "all") return;
    
    try {
      setImporting(true);
      const result = await productAPI.importFromFile(selectedFile, selectedCompanyId);
      setImportResult(result);
      
      if (result.success && result.imported > 0) {
        // Reload products after successful import
        await loadProducts(selectedCompanyId);
      }
    } catch (error) {
      console.error("Failed to import products:", error);
      setImportResult({
        success: false,
        imported: 0,
        errors: ["خطا در وارد کردن فایل"],
        message: "خطا در وارد کردن محصولات",
      });
    } finally {
      setImporting(false);
    }
  }, [selectedFile, selectedCompanyId, loadProducts]);

  const handleCloseImportDialog = useCallback(() => {
    setImportDialogOpen(false);
    setSelectedFile(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const downloadTemplate = useCallback(() => {
    // Create CSV template
    const headers = ["name", "description", "sku", "unit_price", "cost_price", "stock_quantity", "is_active"];
    const sample = ["محصول نمونه", "توضیحات محصول", "SKU001", "100000", "80000", "10", "true"];
    const csvContent = `${headers.join(",")}\n${sample.join(",")}`;
    
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "products_template.csv";
    link.click();
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
            {PERSIAN_LABELS.products}
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
                <InputLabel>{PERSIAN_LABELS.company}</InputLabel>
                <Select
                  value={selectedCompanyId}
                  label={PERSIAN_LABELS.company}
                  onChange={(e) => setSelectedCompanyId(Number(e.target.value))}
                >
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            {canImportProduct && (
              <Button
                variant="outlined"
                startIcon={<Upload />}
                onClick={handleImportClick}
                sx={{
                  color: "white",
                  borderColor: "rgba(255, 255, 255, 0.8)",
                  fontWeight: 600,
                  borderRadius: "10px",
                  px: 2.5,
                  borderWidth: 2,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    borderColor: "white",
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    borderWidth: 2,
                    transform: "translateY(-2px)",
                  },
                }}
              >
                {PERSIAN_LABELS.importProducts}
              </Button>
            )}
            {canCreateProduct && (
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
                {PERSIAN_LABELS.addProduct}
              </Button>
            )}
          </Stack>
        </Stack>
      </Card>

      {/* Products Table */}
      <Card
        sx={{
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          overflow: "hidden",
        }}
      >
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: "#f0f4f8" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: "#2e5090", fontSize: "0.95rem" }}>کد محصول</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#2e5090", fontSize: "0.95rem" }}>{PERSIAN_LABELS.productName}</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#2e5090", fontSize: "0.95rem" }}>توضیحات</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#2e5090", fontSize: "0.95rem" }}>قیمت فروش</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#2e5090", fontSize: "0.95rem" }}>موجودی</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#2e5090", fontSize: "0.95rem" }}>وضعیت</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#2e5090", fontSize: "0.95rem" }}>{PERSIAN_LABELS.company}</TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#2e5090", fontSize: "0.95rem", textAlign: "center" }}>عملیات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    {PERSIAN_LABELS.noData}
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id} hover>
                    <TableCell>{product.sku || "-"}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>
                      {product.description
                        ? product.description.substring(0, 50) +
                          (product.description.length > 50 ? "..." : "")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {product.unit_price.toLocaleString("fa-IR")} ریال
                    </TableCell>
                    <TableCell>{product.stock_quantity.toLocaleString("fa-IR")}</TableCell>
                    <TableCell>
                      <Chip
                        label={product.is_active ? "فعال" : "غیرفعال"}
                        color={product.is_active ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{getCompanyName(product.company_id)}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        {canUpdateProduct && (
                          <IconButton
                            onClick={() => handleEditClick(product)}
                            size="small"
                            color="primary"
                          >
                            <Edit />
                          </IconButton>
                        )}
                        {canDeleteProduct && (
                          <IconButton
                            onClick={() => handleDeleteClick(product.id)}
                            size="small"
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Product Form Dialog */}
      <ProductForm
        open={formOpen}
        product={selectedProduct}
        onSave={handleFormSave}
        onClose={handleFormClose}
        isLoading={formLoading}
        defaultCompanyId={
          selectedCompanyId !== "all" ? selectedCompanyId : undefined
        }
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} dir="rtl">
        <DialogTitle>{PERSIAN_LABELS.deleteProduct}</DialogTitle>
        <DialogContent>
          <Typography>{PERSIAN_LABELS.confirmDelete}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>{PERSIAN_LABELS.cancel}</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            {PERSIAN_LABELS.delete}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Dialog */}
      <Dialog
        open={importDialogOpen}
        onClose={handleCloseImportDialog}
        maxWidth="sm"
        fullWidth
        dir="rtl"
      >
        <DialogTitle>{PERSIAN_LABELS.importProducts}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Alert severity="info">
              فایل CSV یا Excel خود را انتخاب کنید. فایل باید شامل ستون‌های زیر باشد:
              name, description, sku, unit_price, cost_price, stock_quantity, is_active
            </Alert>

            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={downloadTemplate}
              fullWidth
            >
              {PERSIAN_LABELS.downloadTemplate}
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />

            <Button
              variant="contained"
              onClick={() => fileInputRef.current?.click()}
              fullWidth
            >
              {selectedFile ? selectedFile.name : PERSIAN_LABELS.selectFile}
            </Button>

            {importResult && (
              <Box>
                <Alert severity={importResult.success ? "success" : "error"}>
                  {importResult.message}
                  {importResult.imported > 0 && (
                    <Typography variant="body2">
                      تعداد محصولات وارد شده: {importResult.imported}
                    </Typography>
                  )}
                </Alert>
                {importResult.errors.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" color="error">
                      خطاها:
                    </Typography>
                    {importResult.errors.slice(0, 10).map((error, idx) => (
                      <Typography key={idx} variant="body2" color="error">
                        • {error}
                      </Typography>
                    ))}
                    {importResult.errors.length > 10 && (
                      <Typography variant="body2" color="text.secondary">
                        ... و {importResult.errors.length - 10} خطای دیگر
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImportDialog}>{PERSIAN_LABELS.close}</Button>
          <Button
            onClick={handleImportSubmit}
            variant="contained"
            disabled={!selectedFile || importing}
          >
            {importing ? <CircularProgress size={24} /> : PERSIAN_LABELS.uploadFile}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

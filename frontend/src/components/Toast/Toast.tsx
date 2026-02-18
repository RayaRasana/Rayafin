import React, { useState } from "react";
import { Alert, Box, Snackbar } from "@mui/material";
import { Toast as ToastType } from "../types";

interface ToastProps {
  toasts: ToastType[];
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onClose }) => {
  return (
    <Box sx={{ position: "fixed", top: 20, left: 20, zIndex: 9999 }}>
      {toasts.map((toast) => (
        <Snackbar
          key={toast.id}
          open={true}
          autoHideDuration={toast.duration || 5000}
          onClose={() => onClose(toast.id)}
          sx={{ mb: 1 }}
        >
          <Alert
            onClose={() => onClose(toast.id)}
            severity={toast.type}
            sx={{ width: "100%" }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </Box>
  );
};

import React, { ReactNode } from "react";
import { Box, Container } from "@mui/material";
import { Navigation } from "./Navigation";

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Box
      sx={{
        direction: "rtl",
        textAlign: "right",
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
      }}
    >
      <Navigation />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );
};

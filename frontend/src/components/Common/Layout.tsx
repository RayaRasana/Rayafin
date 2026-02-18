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
        backgroundColor: "#f0f4f8",
        backgroundImage: "linear-gradient(180deg, #f0f4f8 0%, #e8eef5 100%)",
      }}
    >
      <Navigation />
      <Container maxWidth="lg" sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
        {children}
      </Container>
    </Box>
  );
};

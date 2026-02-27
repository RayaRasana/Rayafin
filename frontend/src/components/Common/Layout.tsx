import React, { ReactNode, useState } from "react";
import { Box, Container } from "@mui/material";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const sidebarWidth = isExpanded ? 240 : 72;

  return (
    <Box
      sx={{
        direction: "rtl",
        textAlign: "right",
        minHeight: "100vh",
        width: "100%",
        overflowX: "hidden",
        backgroundColor: "#FBF9F6",
        backgroundImage: "linear-gradient(180deg, #FBF9F6 0%, #F5F2ED 100%)",
      }}
    >
      <Sidebar
        isExpanded={isExpanded}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      />

      <Box
        sx={{
          minHeight: "100vh",
          marginRight: `${sidebarWidth}px`,
          width: `calc(100% - ${sidebarWidth}px)`,
          transition: "margin-right 0.3s ease, width 0.3s ease",
          overflowX: "hidden",
        }}
      >
        <Container maxWidth="lg" sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};

import { createTheme } from "@mui/material/styles";

// Rayarasana Brand Colors - Extracted from Logo
// Primary: Golden/Amber from hexagon, Secondary: Cream from inner circle
const rayarasanaColors = {
  primary: "#D4A644", // Gold from logo hexagon
  primaryLight: "#E8C261", // Lighter gold
  primaryDark: "#BF933A", // Darker gold
  secondary: "#F5E6C8", // Cream from logo circles
  secondaryLight: "#FEFBF7", // Very light cream
  accent: "#10b981", // Success green
  warning: "#f59e0b", // Amber
  error: "#ef4444", // Red
  info: "#3b82f6", // Light blue
  surface: "#FBF9F6", // Warm light background
  surfaceVariant: "#F5F2ED", // Warm light variant
  outline: "#DDD5CC", // Warm border
  textPrimary: "#2B1C0C", // Dark brown
  textSecondary: "#6B5544", // Medium brown
};

export const theme = createTheme({
  direction: "rtl",
  palette: {
    mode: "light",
    primary: {
      main: rayarasanaColors.primary,
      light: rayarasanaColors.primaryLight,
      dark: rayarasanaColors.primaryDark,
      contrastText: "#ffffff",
    },
    secondary: {
      main: rayarasanaColors.secondary,
      contrastText: "#ffffff",
    },
    success: {
      main: rayarasanaColors.accent,
    },
    warning: {
      main: rayarasanaColors.warning,
    },
    error: {
      main: rayarasanaColors.error,
    },
    info: {
      main: rayarasanaColors.info,
    },
    background: {
      default: rayarasanaColors.surface,
      paper: "#ffffff",
    },
    divider: rayarasanaColors.outline,
    text: {
      primary: rayarasanaColors.textPrimary,
      secondary: rayarasanaColors.textSecondary,
    },
  },

  typography: {
    fontFamily: "'Vazirmatn', 'Segoe UI', 'Helvetica Neue', sans-serif",
    h1: {
      fontSize: "2rem",
      fontWeight: 700,
      color: rayarasanaColors.textPrimary,
    },
    h2: {
      fontSize: "1.75rem",
      fontWeight: 700,
      color: rayarasanaColors.textPrimary,
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: 600,
      color: rayarasanaColors.textPrimary,
    },
    h4: {
      fontSize: "1.25rem",
      fontWeight: 600,
      color: rayarasanaColors.textPrimary,
    },
    h5: {
      fontSize: "1rem",
      fontWeight: 600,
      color: rayarasanaColors.textPrimary,
    },
    h6: {
      fontSize: "0.875rem",
      fontWeight: 600,
      color: rayarasanaColors.textPrimary,
    },
    body1: {
      fontSize: "1rem",
      fontWeight: 400,
      color: rayarasanaColors.textPrimary,
    },
    body2: {
      fontSize: "0.875rem",
      fontWeight: 400,
      color: rayarasanaColors.textSecondary,
    },
    button: {
      fontWeight: 600,
      textTransform: "none",
      letterSpacing: "0.5px",
    },
  },

  shape: {
    borderRadius: 16, // Bubble-style rounded corners
  },

  components: {
    // AppBar
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: `0 2px 8px rgba(0, 0, 0, 0.08)`,
          background: `linear-gradient(135deg, ${rayarasanaColors.primary} 0%, ${rayarasanaColors.primaryDark} 100%)`,
        },
      },
    },

    // Buttons with bubble styling
    MuiButton: {
      defaultProps: {
        disableElevation: false,
      },
      styleOverrides: {
        root: {
          borderRadius: "12px",
          padding: "10px 16px",
          fontSize: "0.95rem",
          fontWeight: 600,
          transition: "all 0.2s ease",
          boxShadow: `0 2px 8px rgba(${parseInt(rayarasanaColors.primary.slice(1, 3), 16)}, ${parseInt(rayarasanaColors.primary.slice(3, 5), 16)}, ${parseInt(rayarasanaColors.primary.slice(5, 7), 16)}, 0.12)`,

          "&:hover": {
            boxShadow: `0 8px 16px rgba(${parseInt(rayarasanaColors.primary.slice(1, 3), 16)}, ${parseInt(rayarasanaColors.primary.slice(3, 5), 16)}, ${parseInt(rayarasanaColors.primary.slice(5, 7), 16)}, 0.24)`,
          },

          "&:active": {
            transform: "scale(0.98)",
            boxShadow: `0 2px 4px rgba(${parseInt(rayarasanaColors.primary.slice(1, 3), 16)}, ${parseInt(rayarasanaColors.primary.slice(3, 5), 16)}, ${parseInt(rayarasanaColors.primary.slice(5, 7), 16)}, 0.12)`,
          },

          "&:focus-visible": {
            outline: `3px solid ${rayarasanaColors.primary}38`,
            outlineOffset: "2px",
          },
        },

        contained: {
          background: `linear-gradient(135deg, ${rayarasanaColors.primary}, ${rayarasanaColors.primaryDark})`,
          color: "#ffffff",
          border: "1px solid transparent",

          "&:hover": {
            background: rayarasanaColors.primaryDark,
          },
        },

        outlined: {
          borderColor: rayarasanaColors.outline,
          color: rayarasanaColors.textPrimary,
          backgroundColor: rayarasanaColors.secondaryLight,

          "&:hover": {
            backgroundColor: rayarasanaColors.secondary,
            borderColor: rayarasanaColors.primary,
          },
        },

        text: {
          color: rayarasanaColors.primary,

          "&:hover": {
            backgroundColor: `${rayarasanaColors.primary}08`,
          },
        },

        containedError: {
          background: "#ef4444",
          color: "#ffffff",

          "&:hover": {
            background: "#dc2626",
          },
        },

        containedSecondary: {
          background: rayarasanaColors.secondary,
          color: rayarasanaColors.textPrimary,
          border: `1px solid ${rayarasanaColors.outline}`,

          "&:hover": {
            background: rayarasanaColors.secondaryLight,
          },
        },
      },
    },

    // Cards with bubble effect
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "16px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
          border: `1px solid ${rayarasanaColors.outline}`,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          backgroundColor: "#ffffff",

          "&:hover": {
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
            transform: "translateY(-2px)",
          },
        },
      },
    },

    // Text Fields with bubble styling
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: "12px",
            backgroundColor: rayarasanaColors.surfaceVariant,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",

            "&:hover": {
              backgroundColor: rayarasanaColors.surface,
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: rayarasanaColors.primary,
              },
            },

            "&.Mui-focused": {
              backgroundColor: rayarasanaColors.surfaceVariant,
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: rayarasanaColors.primary,
                borderWidth: "2px",
              },
            },
          },

          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: rayarasanaColors.outline,
            transition: "border-color 0.3s ease",
          },

          "& .MuiInputBase-input::placeholder": {
            color: rayarasanaColors.textSecondary,
            opacity: 0.8,
          },
        },
      },
    },

    // Input Base
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          backgroundColor: rayarasanaColors.surfaceVariant,

          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: rayarasanaColors.primary,
          },

          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: rayarasanaColors.primary,
            borderWidth: "2px",
          },
        },
      },
    },

    // Tables
    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: "separate",
          borderSpacing: "0 8px",
        },
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: rayarasanaColors.surface,
          "& .MuiTableCell-head": {
            fontWeight: 700,
            color: rayarasanaColors.textPrimary,
            backgroundColor: rayarasanaColors.surface,
            border: "none",
            padding: "16px",
            textAlign: "right",
          },
        },
      },
    },

    MuiTableBody: {
      styleOverrides: {
        root: {
          "& .MuiTableRow-root": {
            transition: "all 0.2s ease",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            margin: "8px 0",

            "&:hover": {
              backgroundColor: `${rayarasanaColors.primary}04`,
              boxShadow: `0 4px 12px rgba(${parseInt(rayarasanaColors.primary.slice(1, 3), 16)}, ${parseInt(rayarasanaColors.primary.slice(3, 5), 16)}, ${parseInt(rayarasanaColors.primary.slice(5, 7), 16)}, 0.08)`,
            },

            "& .MuiTableCell-body": {
              padding: "16px",
              border: "none",
              textAlign: "right",
              color: rayarasanaColors.textPrimary,
            },
          },
        },
      },
    },

    // Dialogs
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: "24px",
          boxShadow: "0 20px 64px rgba(0, 0, 0, 0.15)",
        },
      },
    },

    // Chips
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          fontWeight: 600,
        },
      },
    },

    // Paper/Container
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: "16px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        },
      },
    },

    // Select
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
        },
      },
    },

    // Checkbox
    MuiCheckbox: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          color: rayarasanaColors.outline,

          "&.Mui-checked": {
            color: rayarasanaColors.primary,
          },
        },
      },
    },

    // CircularProgress
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: rayarasanaColors.primary,
        },
      },
    },
  },
});

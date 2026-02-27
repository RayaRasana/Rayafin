import React from "react";
import {
  Select,
  MenuItem,
  SelectChangeEvent,
  SxProps,
  Theme,
} from "@mui/material";

interface SelectFieldProps {
  label?: string;
  value: number | string;
  onChange: (e: SelectChangeEvent<number | string>) => void;
  options: Array<{ id: number | string; name: string }>;
  minWidth?: number;
  sx?: SxProps<Theme>;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  value,
  onChange,
  options,
  minWidth = 160,
  sx,
}) => {
  return (
    <Select
      value={value}
      onChange={onChange}
      sx={{
        minWidth,
        height: 44,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderRadius: "12px",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "transparent",
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: "rgba(255, 255, 255, 0.8)",
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: "white",
          borderWidth: "2px",
        },
        ...sx,
      }}
    >
      {options.map((option) => (
        <MenuItem key={option.id} value={option.id}>
          {option.name}
        </MenuItem>
      ))}
    </Select>
  );
};

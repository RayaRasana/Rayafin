// Validation utilities

export const validateRequired = (value: string | number | undefined): boolean => {
  return value !== undefined && value !== null && String(value).trim() !== "";
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-+()]{7,}$/;
  return phoneRegex.test(phone);
};

export const validateInvoiceTotal = (
  quantity: number,
  unitPrice: number,
  discount: number
): number => {
  return quantity * unitPrice - discount;
};

export const validateCommissionPercent = (percent: number): boolean => {
  return percent >= 0 && percent <= 100;
};

export const validatePositiveNumber = (num: number): boolean => {
  return num > 0;
};

export const getValidationErrors = (data: Record<string, any>): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!validateRequired(data.name)) {
    errors.name = "نام الزامی است";
  }

  if (data.email && !validateEmail(data.email)) {
    errors.email = "ایمیل نامعتبر است";
  }

  if (data.phone && !validatePhone(data.phone)) {
    errors.phone = "شماره تلفن نامعتبر است";
  }

  if (data.commission_percent !== undefined && !validateCommissionPercent(data.commission_percent)) {
    errors.commission_percent = "درصد کمیسیون باید بین 0 و 100 باشد";
  }

  if (data.quantity && !validatePositiveNumber(data.quantity)) {
    errors.quantity = "تعداد باید بیشتر از صفر باشد";
  }

  if (data.unit_price && !validatePositiveNumber(data.unit_price)) {
    errors.unit_price = "قیمت واحد باید بیشتر از صفر باشد";
  }

  return errors;
};

export const formatCurrency = (amount: number, currency: string = "MGA") => {
  return new Intl.NumberFormat("fr-MG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

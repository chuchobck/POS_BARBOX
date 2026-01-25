export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(value || 0);

export const formatDate = (date: string | Date): string =>
  new Intl.DateTimeFormat('es-EC', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(date));

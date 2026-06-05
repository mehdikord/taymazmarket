const faNumber = new Intl.NumberFormat("fa-IR");

export function formatNumber(value: number): string {
  return faNumber.format(value);
}

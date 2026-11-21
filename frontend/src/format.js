const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });
const number = new Intl.NumberFormat("en-PH", { maximumFractionDigits: 2 });
const dateTime = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" });

export const formatPeso = (value) => peso.format(Number(value) || 0);
export const formatNumber = (value) => number.format(Number(value) || 0);
export const formatDateTime = (value) => (value ? dateTime.format(new Date(value)) : "");

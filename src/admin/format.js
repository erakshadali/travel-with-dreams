// Shared formatting and labels for the admin screens.
const TIME_ZONE = 'Asia/Kolkata';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
export const formatInr = (value) => inr.format(Number(value) || 0);

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('en-IN', { timeZone: TIME_ZONE, day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { timeZone: TIME_ZONE, day: 'numeric', month: 'short', year: 'numeric' });

export const formatShortDay = (isoDay) =>
  new Date(`${isoDay}T00:00:00+05:30`).toLocaleDateString('en-IN', { timeZone: TIME_ZONE, day: 'numeric', month: 'short' });

// Keep in step with STATUSES in server/lib/adminStore.js (the server rejects anything else).
export const STATUSES = {
  booking: ['pending', 'confirmed', 'paid', 'completed', 'cancelled'],
  enquiry: ['new', 'contacted', 'converted', 'closed'],
};

export const statusLabel = (status) => status.charAt(0).toUpperCase() + status.slice(1);

// WhatsApp wants the number in full international form without + or spaces; bare 10-digit numbers are Indian.
export function whatsappLink(phone, text) {
  const digits = String(phone).replace(/\D/g, '');
  const full = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${full}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

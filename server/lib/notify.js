// Emails the team when a booking request or enquiry comes in, using Resend's HTTP API.
//
// Env vars (all set in Vercel; alerts are silently skipped if the first two are missing):
//   RESEND_API_KEY     API key from the Resend integration
//   ALERT_EMAIL_TO     who gets the alert — one address or a comma-separated list
//   ALERT_EMAIL_FROM   optional sender, default "Travel With Dreams <onboarding@resend.dev>"
//   RESEND_API_URL     optional override (used by tests)
//
// Sending never throws: the submission is already saved by the time we get here, so a mail
// problem must not turn a successful booking into an error for the customer.
const DEFAULT_FROM = 'Travel With Dreams <onboarding@resend.dev>';
const TIMEOUT_MS = 5000;

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

// Subjects must stay on one line; customers control some of these values.
const oneLine = (value) => String(value ?? '').replace(/[\r\n\t]+/g, ' ').trim();

export const alertsEnabled = () => Boolean(process.env.RESEND_API_KEY && process.env.ALERT_EMAIL_TO);

async function send({ subject, rows, note, replyTo }) {
  if (!alertsEnabled()) return;

  const text = [...rows.map(([label, value]) => `${label}: ${value || '-'}`), '', note].join('\n');
  const html = `
    <div style="font-family:Arial,sans-serif;color:#0b1f33;max-width:560px">
      <h2 style="margin:0 0 16px">${escapeHtml(subject)}</h2>
      <table cellpadding="8" style="border-collapse:collapse;width:100%">
        ${rows
          .map(
            ([label, value]) =>
              `<tr><td style="border-bottom:1px solid #e2e9f0;color:#56697c;width:170px">${escapeHtml(label)}</td><td style="border-bottom:1px solid #e2e9f0"><strong>${escapeHtml(value || '-')}</strong></td></tr>`,
          )
          .join('')}
      </table>
      <p style="color:#56697c;margin-top:16px">${escapeHtml(note)}</p>
    </div>`;

  try {
    const response = await fetch(process.env.RESEND_API_URL || 'https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.ALERT_EMAIL_FROM || DEFAULT_FROM,
        to: process.env.ALERT_EMAIL_TO.split(',').map((address) => address.trim()).filter(Boolean),
        subject: oneLine(subject),
        text,
        html,
        reply_to: replyTo, // "Reply" in the inbox goes straight to the customer
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) console.error(`Email alert failed: HTTP ${response.status} ${await response.text()}`);
  } catch (error) {
    console.error('Email alert failed:', error.message);
  }
}

export function notifyBooking(booking) {
  return send({
    subject: `New booking request ${booking.reference}: ${booking.tripTitle} (${booking.travellers} traveller${booking.travellers === 1 ? '' : 's'})`,
    rows: [
      ['Reference', booking.reference],
      ['Trip', booking.tripTitle],
      ['Departure', booking.departureDate],
      ['Travellers', String(booking.travellers)],
      ['Estimated total (incl. GST)', inr.format(booking.total)],
      ['Name', oneLine(booking.name)],
      ['Email', oneLine(booking.email)],
      ['Phone', oneLine(booking.phone)],
      ['Special requests', booking.notes],
    ],
    note: 'Status: pending confirmation. No payment has been taken. Reply to this email to reach the customer.',
    replyTo: booking.email,
  });
}

export function notifyEnquiry(enquiry) {
  return send({
    subject: `New enquiry ${enquiry.reference} from ${oneLine(enquiry.name)}`,
    rows: [
      ['Reference', enquiry.reference],
      ['Name', oneLine(enquiry.name)],
      ['Email', oneLine(enquiry.email)],
      ['Phone', oneLine(enquiry.phone)],
      ['Interested in', enquiry.tripTitle || 'Not decided / custom trip'],
      ['Travel month', enquiry.travelMonth],
      ['Travellers', enquiry.travellers ? String(enquiry.travellers) : ''],
      ['Message', enquiry.message],
    ],
    note: 'Reply to this email to reach the customer.',
    replyTo: enquiry.email,
  });
}

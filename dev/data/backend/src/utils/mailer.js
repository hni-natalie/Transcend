const nodemailer = require('nodemailer');
const secrets = require('./secrets'); 

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const smtpUser = secrets.SMTP_USER ;
  const smtpPass = secrets.SMTP_PASSWORD; 
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT);

  if (!smtpUser || !smtpPass) {
    console.warn('[mailer] SMTP credentials not configured - emails will be logged.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  return transporter;
}

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@workfrom.com';
const MAIL_FROM = process.env.MAIL_FROM || `"WorkFrom" <${SUPPORT_EMAIL}>`;

// async function sendEmail({ to, subject, html, text }) {
async function sendEmail({ to, subject, html, text, authProvider }) {
  const client = getTransporter();

  const isMockUser = authProvider && authProvider !== 'google';
  const recipient = isMockUser ? SUPPORT_EMAIL : to;
  const emailSubject = isMockUser ? `[${to}] ${subject}` : subject;

  if (!client) {
    // console.log(`[mailer] (not sent - SMTP not configured) to=${to} subject="${subject}"`);
	console.log(`[mailer] (not sent - SMTP not configured) to=${recipient} subject="${emailSubject}"`);
	  console.log('[mailer] Set SMTP_USER, SMTP_PASSWORD, SMTP_HOST, SMTP_PORT to enable email sending');
    return { sent: false, reason: 'SMTP not configured' };
  }

  try {
    await client.sendMail({
      from: MAIL_FROM,
      to : recipient,
      subject : emailSubject,
      html,
      text: text || html.replace(/<[^>]+>/g, ' '),
    });
	console.log(`[mailer] Email sent to ${recipient}`);
    return { sent: true };
  } catch (error) {
    console.error('[mailer] Failed to send email:', error);
    return { sent: false, error: error.message };
  }
}

const formatTimestamp = (date) =>
  new Date(date).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

async function sendDataExportEmail({ to, userName, requestedAt, completedAt, authProvider }) {
  return sendEmail({
    to,
    subject: 'Your WorkFrom data export is ready',
    html: `
      <p>Hi ${userName || 'there'},</p>
      <p>This confirms your personal data request under GDPR.</p>
      <ul>
        <li>Requested at: <strong>${formatTimestamp(requestedAt)}</strong></li>
        <li>Completed at: <strong>${formatTimestamp(completedAt)}</strong></li>
      </ul>
      <p>Your data was downloaded directly to your device when you made the request. If you didn't make this request, please contact support@workfrom.com immediately.</p>
    `,
	authProvider,
  });
}

async function sendAccountDeletionRequestEmail({ to, userName, requestedAt, authProvider }) {
  return sendEmail({
    to,
    subject: 'Your WorkFrom account deletion request has been received',
    html: `
      <p>Hi ${userName || 'there'},</p>
      <p>We've received your request to permanently delete your WorkFrom account, submitted on <strong>${formatTimestamp(requestedAt)}</strong>.</p>
      <p>Our support team will carry this out within <strong>30 days</strong>. If you did not make this request, please contact us immediately at support@workfrom.com.</p>
    `,
	authProvider,
  });
}

async function notifySupportOfDeletionRequest({ userId, userEmail, userName, requestedAt}) {
  return sendEmail({
    to: SUPPORT_EMAIL,
    subject: `Account deletion request - ${userEmail}`,
    html: `
      <p>A user has requested account deletion via Settings &gt; Privacy and Data.</p>
      <ul>
        <li>User: ${userName || 'N/A'} (${userEmail})</li>
        <li>User ID: ${userId}</li>
        <li>Requested at: ${formatTimestamp(requestedAt)}</li>
      </ul>
      <p>Please take action within 30 days as outlined in our Privacy Policy.</p>
    `,
  });
}

async function sendAccountDeletionCompletedEmail({ to, userName, completedAt, authProvider }) {
  return sendEmail({
    to,
    subject: 'Your WorkFrom account has been deleted',
    html: `
      <p>Hi ${userName || 'there'},</p>
      <p>This confirms your WorkFrom account was permanently deleted on <strong>${formatTimestamp(completedAt)}</strong>, in line with your GDPR erasure request.</p>
      <p>If you did not request this, please contact us immediately at support@workfrom.com.</p>
    `,
	authProvider,
  });
}

module.exports = {
  sendEmail,
  sendDataExportEmail,
  sendAccountDeletionRequestEmail,
  notifySupportOfDeletionRequest,
  sendAccountDeletionCompletedEmail,
  SUPPORT_EMAIL,
};

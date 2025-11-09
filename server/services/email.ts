import nodemailer from 'nodemailer';
import { config } from '../config';

interface NewUserEmailOptions {
  to: string;
  firstName: string;
  lastName: string;
  password: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  if (!config.smtpHost) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort ?? 587,
    secure: typeof config.smtpSecure === 'boolean' ? config.smtpSecure : (config.smtpPort ?? 587) === 465,
    auth:
      config.smtpUser && config.smtpPassword
        ? { user: config.smtpUser, pass: config.smtpPassword }
        : undefined,
  });

  return transporter;
}

export async function sendNewUserPasswordEmail({
  to,
  firstName,
  lastName,
  password,
}: NewUserEmailOptions) {
  const fullName = `${firstName} ${lastName}`.trim();
  const subject = 'Bienvenue sur ImpactTracker';
  const greetingName = fullName || 'Bonjour';

  const textBody = `${greetingName},\n\n` +
    `Un compte ImpactTracker vient d'être créé pour vous.\n` +
    `Identifiant: ${to}\n` +
    `Mot de passe temporaire: ${password}\n\n` +
    `Connectez-vous et changez votre mot de passe dès que possible.\n\n` +
    `L'équipe ImpactTracker`;

  const htmlBody = `
    <p>${greetingName},</p>
    <p>Un compte <strong>ImpactTracker</strong> vient d'être créé pour vous.</p>
    <p>
      <strong>Identifiant :</strong> ${to}<br />
      <strong>Mot de passe temporaire :</strong> ${password}
    </p>
    <p>Connectez-vous et changez votre mot de passe dès que possible.</p>
    <p>L'équipe ImpactTracker</p>
  `;

  const mailFrom = config.smtpFromName
    ? `${config.smtpFromName} <${config.smtpFromEmail}>`
    : config.smtpFromEmail;

  const activeTransporter = getTransporter();

  if (!activeTransporter) {
    console.info('[email] SMTP configuration missing - skipping send');
    console.info(`[email] Would send welcome email to ${to}`);
    return;
  }

  try {
    await activeTransporter.sendMail({
      from: mailFrom,
      to,
      subject,
      text: textBody,
      html: htmlBody,
    });
  } catch (error) {
    console.error('[email] Failed to send welcome email', error);
    throw error;
  }
}

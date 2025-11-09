import { config } from '../config';

type NodemailerTransporter = {
  sendMail: (options: {
    from?: string;
    to: string;
    subject: string;
    text: string;
    html: string;
  }) => Promise<unknown>;
};

type NodemailerModule = {
  createTransport: (options: {
    host: string;
    port: number;
    secure: boolean;
    auth?: { user: string; pass: string };
  }) => NodemailerTransporter;
};

interface NewUserEmailOptions {
  to: string;
  firstName: string;
  lastName: string;
  password: string;
}

let transporter: NodemailerTransporter | null = null;
let cachedNodemailer: NodemailerModule | null = null;
let nodemailerLoadAttempted = false;

async function loadNodemailer(): Promise<NodemailerModule | null> {
  if (cachedNodemailer || nodemailerLoadAttempted) {
    return cachedNodemailer;
  }

  nodemailerLoadAttempted = true;

  try {
    const moduleName = 'nodemailer';
    const mod = await import(moduleName);
    const resolved = (mod?.default ?? mod) as Partial<NodemailerModule>;
    if (resolved && typeof resolved.createTransport === 'function') {
      cachedNodemailer = resolved as NodemailerModule;
      return cachedNodemailer;
    }
    console.warn('[email] nodemailer module loaded without createTransport - welcome emails disabled');
    return null;
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error ? (error as any).code : undefined;
    if (code === 'ERR_MODULE_NOT_FOUND') {
      console.warn('[email] nodemailer dependency not installed - welcome emails disabled');
    } else {
      console.error('[email] Failed to load nodemailer', error);
    }
    return null;
  }
}

async function getTransporter(): Promise<NodemailerTransporter | null> {
  if (transporter) {
    return transporter;
  }

  if (!config.smtpHost) {
    return null;
  }

  const nodemailer = await loadNodemailer();
  if (!nodemailer) {
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

  const activeTransporter = await getTransporter();

  if (!activeTransporter) {
    console.info('[email] Email transport unavailable - skipping send');
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

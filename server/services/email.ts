import { config } from '../config';

type NodemailerSentMessageInfo = {
  messageId?: string;
  [key: string]: unknown;
};

type NodemailerTransporter = {
  sendMail: (options: {
    from?: string;
    to: string;
    subject: string;
    text: string;
    html: string;
  }) => Promise<NodemailerSentMessageInfo>;
};

type NodemailerTestAccount = {
  user: string;
  pass: string;
  smtp: {
    host: string;
    port: number;
    secure: boolean;
  };
};

type NodemailerModule = {
  createTransport: (options: {
    host: string;
    port: number;
    secure: boolean;
    auth?: { user: string; pass: string };
  }) => NodemailerTransporter;
  createTestAccount?: () => Promise<NodemailerTestAccount>;
  getTestMessageUrl?: (info: NodemailerSentMessageInfo) => string | false;
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
let etherealAccount: NodemailerTestAccount | null = null;

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

async function buildConfiguredTransport(nodemailer: NodemailerModule): Promise<NodemailerTransporter | null> {
  if (!config.smtpHost) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort ?? 587,
    secure:
      typeof config.smtpSecure === 'boolean'
        ? config.smtpSecure
        : (config.smtpPort ?? 587) === 465,
    auth:
      config.smtpUser && config.smtpPassword
        ? { user: config.smtpUser, pass: config.smtpPassword }
        : undefined,
  });

  return transporter;
}

async function buildEtherealTransport(nodemailer: NodemailerModule): Promise<NodemailerTransporter | null> {
  if (!nodemailer.createTestAccount) {
    console.info('[email] Nodemailer available but no test account helper exposed - emails disabled');
    return null;
  }

  if (!etherealAccount) {
    try {
      etherealAccount = await nodemailer.createTestAccount();
      console.info(
        `[email] Using Ethereal test SMTP account ${etherealAccount.user}. Emails will be available via preview URLs.`,
      );
    } catch (error) {
      console.error('[email] Failed to create Ethereal test account', error);
      return null;
    }
  }

  transporter = nodemailer.createTransport({
    host: etherealAccount.smtp.host,
    port: etherealAccount.smtp.port,
    secure: etherealAccount.smtp.secure,
    auth: { user: etherealAccount.user, pass: etherealAccount.pass },
  });

  return transporter;
}

async function getTransporter(): Promise<NodemailerTransporter | null> {
  if (transporter) {
    return transporter;
  }

  const nodemailer = await loadNodemailer();
  if (!nodemailer) {
    return null;
  }

  if (config.smtpHost) {
    return buildConfiguredTransport(nodemailer);
  }

  return buildEtherealTransport(nodemailer);
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
    const info = await activeTransporter.sendMail({
      from: mailFrom,
      to,
      subject,
      text: textBody,
      html: htmlBody,
    });

    if (!config.smtpHost && cachedNodemailer?.getTestMessageUrl) {
      const preview = cachedNodemailer.getTestMessageUrl(info);
      if (preview) {
        console.info(`[email] Preview welcome email at ${preview}`);
      }
    }
  } catch (error) {
    console.error('[email] Failed to send welcome email', error);
    throw error;
  }
}

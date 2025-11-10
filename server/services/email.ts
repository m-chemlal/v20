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

type NodemailerModule = {
  createTransport: (options: {
    host: string;
    port: number;
    secure: boolean;
    auth?: { user: string; pass: string };
  }) => NodemailerTransporter;
};

type NewUserRole = 'admin' | 'chef_projet' | 'donateur';

interface NewUserEmailOptions {
  to: string;
  firstName: string;
  lastName: string;
  password: string;
  role: NewUserRole;
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

async function buildConfiguredTransport(
  nodemailer: NodemailerModule,
): Promise<NodemailerTransporter | null> {
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

  return buildConfiguredTransport(nodemailer);
}

async function sendViaMailtrapApi({
  to,
  fullName,
  subject,
  textBody,
  htmlBody,
}: {
  to: string;
  fullName: string;
  subject: string;
  textBody: string;
  htmlBody: string;
}): Promise<boolean> {
  if (!config.mailtrapApiToken) {
    return false;
  }

  try {
    const response = await fetch(config.mailtrapApiEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.mailtrapApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: {
          email: config.smtpFromEmail,
          name: config.smtpFromName,
        },
        to: [
          {
            email: to,
            name: fullName || undefined,
          },
        ],
        subject,
        text: textBody,
        html: htmlBody,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[email] Mailtrap API send failed', response.status, errorBody);
      return false;
    }

    console.info('[email] Sent welcome email via Mailtrap');
    return true;
  } catch (error) {
    console.error('[email] Failed to send welcome email via Mailtrap', error);
    return false;
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeBaseUrl(url: string | undefined) {
  if (!url) {
    return undefined;
  }

  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function resolveRoleCopy(role: NewUserRole) {
  switch (role) {
    case 'chef_projet':
      return {
        headline: 'Votre tableau de bord projet est prêt',
        description:
          "En tant que chef de projet, vous pouvez suivre l'avancement des actions, partager des mises à jour et coordonner votre équipe en toute simplicité.",
        bulletPoints: [
          'Planifiez vos étapes clés et attribuez les tâches à votre équipe.',
          'Suivez les indicateurs d’impact en temps réel pour vos bailleurs.',
          'Partagez des rapports clairs et inspirants en un clic.',
        ],
      };
    case 'donateur':
      return {
        headline: 'Merci de rejoindre la communauté des donateurs',
        description:
          'Suivez l’impact concret de vos contributions, recevez des actualités personnalisées et échangez directement avec les porteurs de projets.',
        bulletPoints: [
          'Visualisez les résultats et les réalisations financées par vos dons.',
          'Recevez des recommandations adaptées à vos engagements solidaires.',
          'Accédez à une messagerie dédiée pour dialoguer avec les équipes terrain.',
        ],
      };
    default:
      return {
        headline: 'Votre espace ImpactTracker vous attend',
        description:
          "Découvrez l'ensemble des outils pour piloter vos activités, accompagner les équipes et partager les progrès avec vos partenaires.",
        bulletPoints: [
          'Centralisez vos informations clés dans un tableau de bord unique.',
          'Suivez les indicateurs de performance et l’impact social en continu.',
          'Générez des rapports professionnels en quelques minutes.',
        ],
      };
  }
}

function buildTextBody({
  greeting,
  to,
  password,
  roleCopy,
  loginUrl,
}: {
  greeting: string;
  to: string;
  password: string;
  roleCopy: ReturnType<typeof resolveRoleCopy>;
  loginUrl?: string;
}) {
  const bulletLines = roleCopy.bulletPoints.map((point) => `• ${point}`).join('\n');
  const loginLine = loginUrl ? `\nConnectez-vous : ${loginUrl}\n` : '\n';

  return (
    `${greeting},\n\n` +
    `${roleCopy.description}\n\n` +
    `Identifiant : ${to}\n` +
    `Mot de passe temporaire : ${password}` +
    loginLine +
    `${bulletLines}\n\n` +
    `Pensez à modifier votre mot de passe dès votre première connexion.\n\n` +
    `Besoin d'aide ? Répondez directement à cet e-mail et notre équipe vous accompagnera.\n\n` +
    `L'équipe ImpactTracker`
  );
}

function buildHtmlBody({
  greeting,
  to,
  password,
  roleCopy,
  loginUrl,
}: {
  greeting: string;
  to: string;
  password: string;
  roleCopy: ReturnType<typeof resolveRoleCopy>;
  loginUrl?: string;
}) {
  const safeGreeting = escapeHtml(greeting);
  const safeEmail = escapeHtml(to);
  const safePassword = escapeHtml(password);
  const safeHeadline = escapeHtml(roleCopy.headline);
  const safeDescription = escapeHtml(roleCopy.description);
  const bulletItems = roleCopy.bulletPoints
    .map(
      (point) =>
        `<li style="margin-bottom: 12px; padding-left: 4px;">${escapeHtml(point)}</li>`,
    )
    .join('');

  const loginSection = loginUrl
    ? `<tr>
        <td align="center" style="padding: 24px 32px 8px;">
          <a href="${escapeHtml(loginUrl)}" style="display: inline-block; background: linear-gradient(135deg, #2563eb, #7c3aed); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 999px; font-weight: 600; font-size: 16px;">
            Accéder à mon espace
          </a>
        </td>
      </tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Bienvenue sur ImpactTracker</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 640px; background-color: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);">
            <tr>
              <td style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 40px 32px; text-align: center; color: #ffffff;">
                <div style="font-size: 14px; letter-spacing: 0.14em; font-weight: 600; text-transform: uppercase; margin-bottom: 12px;">ImpactTracker</div>
                <h1 style="margin: 0; font-size: 28px; line-height: 1.3;">Bienvenue !</h1>
                <p style="margin: 18px 0 0; font-size: 16px; opacity: 0.92;">${safeHeadline}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 36px 32px 12px; font-size: 16px; line-height: 1.6;">
                <p style="margin: 0 0 18px;">${safeGreeting},</p>
                <p style="margin: 0 0 24px;">${safeDescription}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 0 32px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;">
                  <tr>
                    <td style="background-color: #eff6ff; padding: 18px 24px; font-weight: 600; font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase; color: #1d4ed8;">Accès rapide</td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 24px; font-size: 15px; line-height: 1.6; color: #334155;">
                      <div style="margin-bottom: 12px;"><strong>Identifiant :</strong> <code style="background-color: #e2e8f0; padding: 4px 10px; border-radius: 8px; font-size: 14px;">${safeEmail}</code></div>
                      <div style="margin-bottom: 16px;"><strong>Mot de passe temporaire :</strong> <code style="background-color: #fee2e2; color: #b91c1c; padding: 4px 10px; border-radius: 8px; font-size: 14px;">${safePassword}</code></div>
                      <div style="background-color: #f8fafc; border-radius: 12px; padding: 18px 20px;">
                        <strong>Étapes suivantes :</strong>
                        <ul style="margin: 12px 0 0; padding: 0 0 0 18px; list-style-type: disc; color: #0f172a;">
                          ${bulletItems}
                        </ul>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ${loginSection}
            <tr>
              <td style="padding: 16px 32px 40px; font-size: 14px; line-height: 1.6; color: #475569;">
                <p style="margin: 0 0 12px;">Nous vous invitons à modifier votre mot de passe dès votre première connexion pour sécuriser votre espace.</p>
                <p style="margin: 0 0 12px;">Besoin d'aide ? Répondez directement à cet e-mail ou contactez-nous via la plateforme.</p>
                <p style="margin: 0; font-weight: 600; color: #1e293b;">L'équipe ImpactTracker</p>
              </td>
            </tr>
            <tr>
              <td style="background-color: #0f172a; color: #e2e8f0; text-align: center; padding: 20px 16px; font-size: 12px;">
                © ${new Date().getFullYear()} ImpactTracker. Tous droits réservés.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendNewUserPasswordEmail({
  to,
  firstName,
  lastName,
  password,
  role,
}: NewUserEmailOptions) {
  const fullName = `${firstName} ${lastName}`.trim();
  const subject = 'Bienvenue sur ImpactTracker';
  const greeting = fullName ? `Bonjour ${fullName}` : 'Bonjour';
  const roleCopy = resolveRoleCopy(role);
  const normalizedBaseUrl = normalizeBaseUrl(config.appBaseUrl);
  const loginUrl = normalizedBaseUrl ? `${normalizedBaseUrl}/login` : undefined;

  const textBody = buildTextBody({
    greeting,
    to,
    password,
    roleCopy,
    loginUrl,
  });

  const htmlBody = buildHtmlBody({
    greeting,
    to,
    password,
    roleCopy,
    loginUrl,
  });

  const mailFrom = config.smtpFromName
    ? `${config.smtpFromName} <${config.smtpFromEmail}>`
    : config.smtpFromEmail;

  const activeTransporter = await getTransporter();

  if (activeTransporter) {
    try {
      await activeTransporter.sendMail({
        from: mailFrom,
        to,
        subject,
        text: textBody,
        html: htmlBody,
      });
      return;
    } catch (error) {
      console.error('[email] Failed to send welcome email via SMTP transport', error);
      transporter = null;
    }
  }

  const sentViaMailtrap = await sendViaMailtrapApi({
    to,
    fullName,
    subject,
    textBody,
    htmlBody,
  });

  if (!sentViaMailtrap) {
    console.info('[email] Email transport unavailable - skipping send');
    console.info(`[email] Would send welcome email to ${to}`);
  }
}

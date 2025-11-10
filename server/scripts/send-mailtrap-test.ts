import crypto from 'node:crypto';
import process from 'node:process';

import { sendNewUserPasswordEmail } from '../services/email';

function generateTemporaryPassword() {
  return crypto.randomBytes(9).toString('base64url').slice(0, 12);
}

async function main() {
  const [recipientArg] = process.argv.slice(2);
  const recipient = recipientArg ?? process.env.MAILTRAP_TEST_RECIPIENT;

  if (!recipient) {
    console.error(
      'Usage: pnpm mailtrap:test <destinataire@example.com>\n' +
        'Vous pouvez aussi définir MAILTRAP_TEST_RECIPIENT dans votre fichier .env pour éviter de passer le paramètre.',
    );
    process.exitCode = 1;
    return;
  }

  console.info(`Envoi d'un e-mail de test Mailtrap vers ${recipient}...`);

  await sendNewUserPasswordEmail({
    to: recipient,
    firstName: 'Test',
    lastName: 'Mailtrap',
    password: generateTemporaryPassword(),
  });

  console.info(
    "Si vous ne voyez aucun message dans Mailtrap, vérifiez la configuration SMTP/API. Les erreurs sont affichées dans la console.",
  );
}

main().catch((error) => {
  console.error('mailtrap:test a échoué', error);
  process.exitCode = 1;
});

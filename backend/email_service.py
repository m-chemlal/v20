import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import settings
from typing import Optional
import jinja2
from pathlib import Path


async def send_email(
    to_email: str,
    subject: str,
    body_html: Optional[str] = None,
    body_text: Optional[str] = None
) -> bool:
    """Send email via SMTP"""
    if not settings.smtp_user or not settings.smtp_password:
        # In development, just log
        print(f"[EMAIL] Would send to {to_email}: {subject}")
        return True
    
    try:
        message = MIMEMultipart("alternative")
        message["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
        message["To"] = to_email
        message["Subject"] = subject
        
        if body_text:
            message.attach(MIMEText(body_text, "plain"))
        if body_html:
            message.attach(MIMEText(body_html, "html"))
        
        await aiosmtplib.send(
            message,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user,
            password=settings.smtp_password,
            use_tls=settings.smtp_use_tls
        )
        return True
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        return False


async def send_password_reset_email(to_email: str, reset_token: str, reset_url: str) -> bool:
    """Send password reset email"""
    subject = "Réinitialisation de votre mot de passe - ImpactTracker"
    body_html = f"""
    <html>
        <body>
            <h2>Réinitialisation de votre mot de passe</h2>
            <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
            <p>Cliquez sur le lien suivant pour réinitialiser votre mot de passe :</p>
            <p><a href="{reset_url}?token={reset_token}">{reset_url}?token={reset_token}</a></p>
            <p>Ce lien est valide pendant 1 heure.</p>
            <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
        </body>
    </html>
    """
    body_text = f"""
    Réinitialisation de votre mot de passe
    
    Cliquez sur le lien suivant pour réinitialiser votre mot de passe :
    {reset_url}?token={reset_token}
    
    Ce lien est valide pendant 1 heure.
    """
    return await send_email(to_email, subject, body_html, body_text)


async def send_welcome_email(to_email: str, name: str, temp_password: Optional[str] = None) -> bool:
    """Send welcome email to new user"""
    subject = "Bienvenue sur ImpactTracker"
    body_html = f"""
    <html>
        <body>
            <h2>Bienvenue {name} !</h2>
            <p>Votre compte ImpactTracker a été créé avec succès.</p>
            {"<p>Votre mot de passe temporaire est : <strong>" + temp_password + "</strong></p><p>Veuillez le changer lors de votre première connexion.</p>" if temp_password else ""}
        </body>
    </html>
    """
    return await send_email(to_email, subject, body_html)


# Plantillas de correo — ink·sai (KAN-29)

HTML listo para pegar en **Supabase → Authentication → Email Templates**. Usan tablas y estilos inline (no clases ni `<style>` externo) porque muchos clientes de correo los ignoran.

| Archivo | Sección en Supabase |
|---|---|
| `confirm-signup.html` | Confirm signup |
| `reset-password.html` | Reset password |
| `magic-link.html` | Magic link (no se usa hoy en el flujo de la app, pero Supabase la manda si algo la dispara) |

No tocar `{{ .ConfirmationURL }}` en ninguna: es la variable que Supabase reemplaza por el link real.

## Pendiente de este ticket (no cubierto por estos archivos)

- Configurar proveedor SMTP propio (Resend o Brevo) en Project Settings → Auth → SMTP — el SMTP por defecto de Supabase limita a ~2 correos/hora por proyecto.
- Verificación de dominio del remitente (SPF/DKIM).

Ambos puntos dependen de qué dominio use el estudio — pendiente de decidir con el equipo.

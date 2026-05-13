import type { CustomMessageTriggerEvent } from 'aws-lambda';

export const handler = async (event: CustomMessageTriggerEvent): Promise<CustomMessageTriggerEvent> => {
  const { triggerSource, request, response } = event;

  if (
    triggerSource === 'CustomMessage_SignUp' ||
    triggerSource === 'CustomMessage_ResendCode' ||
    triggerSource === 'CustomMessage_ForgotPassword' ||
    triggerSource === 'CustomMessage_UpdateUserAttribute'
  ) {
    const code = request.codeParameter;
    const isPasswordReset =
      triggerSource === 'CustomMessage_ForgotPassword';

    const title = isPasswordReset ? 'Reset your password' : 'Verify your email';
    const heading = isPasswordReset ? 'Reset your password' : 'Welcome to Luva! 🎉';
    const bodyText = isPasswordReset
      ? 'Use the code below to reset your password. It expires in 1 hour.'
      : 'Use the code below to confirm your email address and start your English journey.';

    response.emailSubject = isPasswordReset
      ? 'Your Luva password reset code'
      : 'Your Luva verification code';

    response.emailMessage = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f4f0;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td align="center" style="background-color:#1a1a1a;padding:32px 40px 28px;">
              <span style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">luva</span>
              <span style="font-size:28px;font-weight:800;color:#f0b429;letter-spacing:-0.5px;">.</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#1a1a1a;line-height:1.3;">${heading}</h1>
              <p style="margin:0 0 32px;font-size:15px;color:#555555;line-height:1.6;">${bodyText}</p>

              <!-- Code box -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color:#f5f4f0;border-radius:12px;padding:24px 16px;">
                    <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:#1a1a1a;font-variant-numeric:tabular-nums;">${code}</span>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:13px;color:#999999;line-height:1.5;">
                This code expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f5f4f0;padding:20px 40px;border-top:1px solid #ebebeb;">
              <p style="margin:0;font-size:12px;color:#aaaaaa;text-align:center;line-height:1.6;">
                © ${new Date().getFullYear()} Luva English &nbsp;·&nbsp; Making English learning feel natural
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  return event;
};

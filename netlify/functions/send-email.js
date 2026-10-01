// Netlify Serverless Function: send-email.js
// Uses Node.js built-in https module — works on Node 14, 16, 18+

const https = require('https');

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_NAME   = 'AutoTriage';
const SENDER_EMAIL  = 'support@autotriage.app';

function buildEmailHTML(name, spec, city, phone, email, inviteLink) {
  const groupUrl = inviteLink || 'https://chat.whatsapp.com/BlN87SABMVi7NIeypkypr9?s=sh&p=i&mlu=4&ilr=4';
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Welcome to AutoTriage</title></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:32px 16px;">
  <tr><td align="center">
    <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#1a0000,#3d0000);padding:36px 32px;text-align:center;">
          <div style="font-size:13px;font-weight:900;letter-spacing:4px;color:#ff3333;text-transform:uppercase;font-family:Arial,sans-serif;margin-bottom:6px;">AUTOTRIAGE</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;">AI-Powered Vehicle Intelligence</div>
        </td>
      </tr>

      <!-- Emoji + Greeting -->
      <tr>
        <td style="padding:36px 32px 0;text-align:center;">
          <div style="font-size:52px;margin-bottom:12px;">🎉</div>
          <div style="display:inline-block;background:#fff0f0;border:1px solid #ffcccc;color:#cc0000;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:5px 16px;border-radius:20px;margin-bottom:16px;">
            🔥 Welcome to the AutoTriage Network
          </div>
          <h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:#111111;letter-spacing:1px;">
            Greetings, ${name}!
          </h1>
          <p style="margin:0;font-size:14px;color:#555555;line-height:1.6;">
            Your <strong style="color:#111;">${spec}</strong> workshop in <strong style="color:#111;">${city}</strong><br>
            has joined the <strong style="color:#cc0000;">AutoTriage mechanic waitlist</strong>.
          </p>
        </td>
      </tr>

      <!-- Details Card -->
      <tr>
        <td style="padding:24px 32px;">
          <table width="100%" style="background:#f8f8f8;border-radius:12px;border:1px solid #eeeeee;padding:0;overflow:hidden;">
            <tr>
              <td style="background:#cc0000;padding:10px 20px;">
                <span style="color:#ffffff;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">📋 Application Details</span>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:5px 0;font-size:13px;color:#888;width:130px;">Workshop Name</td>
                    <td style="padding:5px 0;font-size:13px;color:#111;font-weight:600;">${name}</td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;font-size:13px;color:#888;">Specialization</td>
                    <td style="padding:5px 0;font-size:13px;color:#111;font-weight:600;">${spec}</td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;font-size:13px;color:#888;">City / Location</td>
                    <td style="padding:5px 0;font-size:13px;color:#111;font-weight:600;">${city}</td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;font-size:13px;color:#888;">Phone</td>
                    <td style="padding:5px 0;font-size:13px;color:#111;font-weight:600;">${phone}</td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;font-size:13px;color:#888;">Email</td>
                    <td style="padding:5px 0;font-size:13px;color:#cc0000;font-weight:600;">${email}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- What happens next -->
      <tr>
        <td style="padding:0 32px 16px;">
          <table width="100%" style="background:#fff8f0;border-radius:12px;border:1px solid #ffe4cc;padding:0;overflow:hidden;">
            <tr>
              <td style="padding:16px 20px;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#cc5500;">⚡ What happens next?</p>
                <p style="margin:0;font-size:13px;color:#666;line-height:1.7;">
                  Your workshop details and credentials have been recorded. Our team reviews submissions before verified repair leads are dispatched. All network communications are conducted through our official specialist group below.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- WhatsApp Specialist Group Invite Box -->
      <tr>
        <td style="padding:0 32px 24px;">
          <table width="100%" style="background:#f0fdf4;border-radius:12px;border:1.5px solid #22c55e;padding:0;overflow:hidden;box-shadow:0 4px 16px rgba(34,197,94,0.12);">
            <tr>
              <td style="background:#16a34a;padding:10px 20px;text-align:center;">
                <span style="color:#ffffff;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">💬 REQUIRED STEP FOR ALL MECHANICS</span>
              </td>
            </tr>
            <tr>
              <td style="padding:22px;text-align:center;">
                <h3 style="margin:0 0 8px;font-size:18px;color:#166534;font-weight:900;">AutoTriage Specialist WhatsApp Group</h3>
                <p style="margin:0 0 18px;font-size:13px;color:#374151;line-height:1.6;">
                  All AutoTriage mechanics communicate and receive priority repair leads through our official WhatsApp group. Tap below to join:
                </p>
                <a href="${groupUrl}" target="_blank" rel="noopener" style="display:inline-block;background:#25D366;color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:900;letter-spacing:1px;text-decoration:none;padding:15px 30px;border-radius:10px;box-shadow:0 4px 15px rgba(37,211,102,0.4);text-transform:uppercase;">
                  👉 JOIN SPECIALIST WHATSAPP GROUP &rarr;
                </a>
                <p style="margin:14px 0 0;font-size:11px;color:#6b7280;word-break:break-all;">
                  Direct link: <a href="${groupUrl}" style="color:#16a34a;font-weight:bold;">${groupUrl}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f8f8f8;border-top:1px solid #eeeeee;padding:20px 32px;text-align:center;">
          <p style="margin:0 0 6px;font-size:12px;color:#999;">Questions? Reply to this email or contact us at</p>
          <a href="mailto:support@autotriage.app" style="color:#cc0000;font-size:12px;font-weight:600;text-decoration:none;">support@autotriage.app</a>
          <p style="margin:12px 0 0;font-size:11px;color:#cccccc;">© 2025 AutoTriage · AI-Powered Vehicle Intelligence</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try {
    // Netlify sometimes base64-encodes the body
    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64').toString('utf-8')
      : (event.body || '{}');
    body = JSON.parse(rawBody);
  } catch(e) {
    console.error('[send-email] JSON parse failed:', e.message, '| raw body:', event.body);
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body', detail: e.message }) };
  }

  const { to, name, phone, spec, city, groupLink, type, code } = body;
  console.log(`[send-email] Parsed body — to:${to} name:${name} spec:${spec} city:${city}`);

  if (!to) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing: to (email address)', received: body }) };
  }
  if (!BREVO_API_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Email provider is not configured' }) };
  }

  const recipientName = name || to.split('@')[0];
  const inviteLink = groupLink || 'https://chat.whatsapp.com/BlN87SABMVi7NIeypkypr9?s=sh&p=i&mlu=4&ilr=4';
  const isOtp = type === 'otp' || type === 'password_reset';
  const isDriverWelcome = type === 'driver_welcome';
  let htmlContent;
  let textContent;
  if (isOtp) {
    htmlContent = `<div style="font-family:Arial,sans-serif;background:#08090d;color:#ffffff;padding:32px;text-align:center;"><div style="color:#e52b3a;font-size:18px;font-weight:900;letter-spacing:4px;">AUTO TRIAGE</div><h1 style="margin:28px 0 12px;">Security Verification</h1><p style="color:#b2b4bf;">Your verification code is:</p><div style="display:inline-block;padding:16px 24px;background:#1b1d27;border:1px solid #e52b3a;border-radius:10px;color:#ff5360;font-size:32px;font-weight:900;letter-spacing:10px;">${code || '----'}</div><p style="color:#8d909d;margin-top:24px;">This code expires in 10 minutes. If you did not request it, ignore this email.</p></div>`;
    textContent = `Your AutoTriage security verification code is ${code || 'unavailable'}. It expires in 10 minutes.`;
  } else if (isDriverWelcome) {
    htmlContent = `<!DOCTYPE html><html><body style="margin:0;background:#08090d;font-family:Arial,Helvetica,sans-serif;color:#f5f5f5;"><table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;background:#08090d;"><tr><td align="center"><table width="100%" style="max-width:560px;background:#111219;border:1px solid #2b2d38;border-radius:18px;overflow:hidden;"><tr><td style="padding:30px;text-align:center;background:linear-gradient(135deg,#24070b,#111219);border-bottom:2px solid #e52b3a;"><div style="font-size:18px;font-weight:900;letter-spacing:4px;color:#ffffff;">AUTO <span style="color:#e52b3a;">TRIAGE</span></div><div style="margin-top:9px;color:#9a9ca8;font-size:10px;letter-spacing:2px;text-transform:uppercase;">AI Vehicle Intelligence Platform</div></td></tr><tr><td style="padding:38px 32px;text-align:center;"><div style="font-size:44px;margin-bottom:16px;">&#9889;</div><div style="display:inline-block;padding:7px 15px;border:1px solid #e52b3a;border-radius:20px;color:#ff5360;font-size:10px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">ACCOUNT CREATED</div><h1 style="margin:20px 0 12px;font-size:28px;letter-spacing:1px;color:#ffffff;">WELCOME, ${recipientName}!</h1><p style="margin:0;color:#b2b4bf;font-size:14px;line-height:1.8;">Your AutoTriage account has been created successfully.</p></td></tr><tr><td style="padding:0 32px 30px;"><div style="padding:20px;background:#181a23;border:1px solid #2b2d38;border-radius:12px;"><div style="color:#ff5360;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">WHAT HAPPENS NEXT</div><p style="margin:0;color:#b2b4bf;font-size:13px;line-height:1.8;">The AutoTriage app is still in development. We will email you when launch access and the full driver experience are ready.</p></div></td></tr><tr><td style="padding:20px 32px;text-align:center;border-top:1px solid #2b2d38;color:#777b88;font-size:11px;">Questions? Contact <a href="mailto:support@autotriage.app" style="color:#ff5360;text-decoration:none;">support@autotriage.app</a><br><br>AutoTriage - AI-powered vehicle intelligence</td></tr></table></td></tr></table></body></html>`;
    textContent = `Welcome to AutoTriage, ${recipientName}! Your account has been created. The app is still in development, and we will share launch updates as they become available.`;
  } else {
    htmlContent = buildEmailHTML(recipientName, spec || 'Mechanic', city || 'N/A', phone || 'N/A', to, inviteLink);
    textContent = `Welcome to the AutoTriage Network, ${recipientName}!\n\nYour ${spec || 'Mechanic'} workshop in ${city || 'N/A'} is officially registered on the mechanic waitlist.\n\nREQUIRED STEP: Join the AutoTriage Specialist WhatsApp Group to receive onboarding updates and verified repair leads:\n${inviteLink}\n\nQuestions? Contact us at support@autotriage.app`;
  }

  const payload = JSON.stringify({
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
    to: [{ email: to, name: recipientName }],
    subject: isOtp ? `Your AutoTriage security code` : (isDriverWelcome ? `Welcome to AutoTriage, ${recipientName}!` : `Thanks for joining the AutoTriage waitlist, ${recipientName}!`),
    htmlContent,
    textContent,
    headers: {
      'X-Mailin-custom': 'autotriage-mechanics-signup'
    }
  });

  console.log(`[send-email] Sending to: ${to} | name: ${recipientName} | spec: ${spec}`);

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        console.log(`[send-email] Brevo status: ${res.statusCode} | body: ${data}`);
        try {
          const result = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: 200, headers, body: JSON.stringify({ success: true, messageId: result.messageId }) });
          } else {
            resolve({ statusCode: res.statusCode, headers, body: JSON.stringify({ error: 'Brevo error', details: result }) });
          }
        } catch(parseErr) {
          resolve({ statusCode: 500, headers, body: JSON.stringify({ error: 'Parse error', raw: data }) });
        }
      });
    });

    req.on('error', (err) => {
      console.error(`[send-email] Request error: ${err.message}`);
      resolve({ statusCode: 500, headers, body: JSON.stringify({ error: err.message }) });
    });

    req.write(payload);
    req.end();
  });
};

import urllib.request, json, ssl

api_key = 'YOUR_BREVO_API_KEY'
to_email = 'greatogah14@gmail.com'

html = """<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
<tr><td align="center">
<table style="max-width:560px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

<tr><td style="background:linear-gradient(135deg,#1a0000,#3d0000);padding:36px 32px;text-align:center;">
  <div style="font-size:13px;font-weight:900;letter-spacing:4px;color:#ff3333;text-transform:uppercase;">AUTOTRIAGE</div>
  <div style="font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;">AI-Powered Vehicle Intelligence</div>
</td></tr>

<tr><td style="padding:36px 32px;text-align:center;">
  <div style="font-size:48px;margin-bottom:12px;">&#127881;</div>
  <div style="display:inline-block;background:#fff0f0;border:1px solid #ffcccc;color:#cc0000;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:5px 16px;border-radius:20px;margin-bottom:16px;">
    &#128293; WELCOME TO AUTOTRIAGE NETWORK
  </div>
  <h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:#111;">Greetings, Test User!</h1>
  <p style="color:#555;font-size:14px;line-height:1.6;">
    Your <strong>General Mechanic</strong> workshop in <strong>Lagos</strong> has been added to the AutoTriage compliance queue!
  </p>
</td></tr>

<tr><td style="padding:0 32px 24px;">
  <table width="100%" style="background:#f8f8f8;border-radius:12px;overflow:hidden;">
  <tr><td style="background:#cc0000;padding:10px 20px;">
    <span style="color:#fff;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">&#128203; APPLICATION DETAILS</span>
  </td></tr>
  <tr><td style="padding:16px 20px;">
    <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="color:#888;font-size:13px;padding:5px 0;width:130px;">Workshop Name</td>
      <td style="color:#111;font-size:13px;font-weight:600;padding:5px 0;">Test Workshop</td>
    </tr>
    <tr>
      <td style="color:#888;font-size:13px;padding:5px 0;">Specialization</td>
      <td style="color:#111;font-size:13px;font-weight:600;padding:5px 0;">General Mechanic</td>
    </tr>
    <tr>
      <td style="color:#888;font-size:13px;padding:5px 0;">City</td>
      <td style="color:#111;font-size:13px;font-weight:600;padding:5px 0;">Lagos</td>
    </tr>
    <tr>
      <td style="color:#888;font-size:13px;padding:5px 0;">Email</td>
      <td style="color:#cc0000;font-size:13px;font-weight:600;padding:5px 0;">greatogah14@gmail.com</td>
    </tr>
    </table>
  </td></tr>
  </table>
</td></tr>

<tr><td style="padding:0 32px 24px;">
  <table width="100%" style="background:#fff8f0;border-radius:12px;border:1px solid #ffe4cc;">
  <tr><td style="padding:16px 20px;">
    <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#cc5500;">&#9889; What happens next?</p>
    <p style="margin:0;font-size:13px;color:#666;line-height:1.7;">Our compliance team will review your application and contact you before the AutoTriage public launch.</p>
  </td></tr>
  </table>
</td></tr>

<tr><td style="background:#f8f8f8;border-top:1px solid #eee;padding:20px 32px;text-align:center;">
  <p style="color:#999;font-size:12px;margin:0 0 4px;">Questions? Contact us at</p>
  <a href="mailto:support@autotriage.app" style="color:#cc0000;font-size:12px;font-weight:600;text-decoration:none;">support@autotriage.app</a>
  <p style="color:#ccc;font-size:11px;margin:10px 0 0;">&#169; 2025 AutoTriage &middot; AI-Powered Vehicle Intelligence</p>
</td></tr>

</table>
</td></tr>
</table>
</body></html>"""

data = json.dumps({
    'sender': {'name': 'AutoTriage', 'email': 'support@autotriage.app'},
    'to': [{'email': to_email, 'name': 'AutoTriage User'}],
    'subject': 'Welcome to AutoTriage Network! \U0001f389',
    'htmlContent': html,
    'textContent': 'Welcome to AutoTriage! Your General Mechanic workshop in Lagos has been added to the compliance queue. Our team will contact you before launch. Questions? support@autotriage.app'
}).encode('utf-8')

req = urllib.request.Request('https://api.brevo.com/v3/smtp/email', data=data, method='POST')
req.add_header('api-key', api_key)
req.add_header('Content-Type', 'application/json')
req.add_header('Accept', 'application/json')

ctx = ssl.create_default_context()
try:
    with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
        result = json.loads(resp.read().decode())
        print('SUCCESS! messageId:', result.get('messageId'))
        print('Check inbox + spam for:', to_email)
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print('HTTP ERROR', e.code, ':', body)
except Exception as ex:
    print('EXCEPTION:', type(ex).__name__, '-', ex)

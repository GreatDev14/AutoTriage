let sgMail;
try {
  sgMail = require('@sendgrid/mail');
} catch (e) {
  // Mock sgMail if not installed for local testing
  sgMail = {
    setApiKey: () => {},
    send: async (msg) => console.log('[MOCK SENDGRID] Email sent:', msg)
  };
}

// --- 2. SCALING: ASYNC BACKGROUND JOB QUEUE (MOCK) ---
// In production, you would push this payload to Upstash QStash, AWS SQS, or RabbitMQ
// and immediately return 202 to the client. A separate worker would pick it up.
const asyncEmailQueue = [];

function processEmailJobs() {
  if (asyncEmailQueue.length === 0) return;
  const job = asyncEmailQueue.shift();
  console.log(`[ASYNC WORKER] Processing email job ID: ${job.id}`);
  
  if (job.apiKey) {
    sgMail.setApiKey(job.apiKey);
    sgMail.send(job.msg).then(() => {
      console.log(`[ASYNC WORKER] Email job ${job.id} completed successfully.`);
    }).catch(err => {
      console.error(`[ASYNC WORKER] Email job ${job.id} failed:`, err.message);
    });
  } else {
    setTimeout(() => {
      console.log(`[ASYNC WORKER] Simulated email sent successfully for job ${job.id}`);
    }, 1500);
  }
}
setInterval(processEmailJobs, 2000); // Poll every 2 seconds

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const { to, subject, htmlContent, textContent } = req.body;
  if (!to || !subject || (!htmlContent && !textContent)) {
    return res.status(400).json({ success: false, error: 'Missing required parameters: to, subject, body' });
  }

  const apiKey = process.env.SENDGRID_API_KEY;
  const senderEmail = process.env.SENDGRID_SENDER_EMAIL || 'dispatch@autotriage.pro';

  const jobId = 'email_' + Date.now() + '_' + Math.floor(Math.random()*1000);
  const msg = {
    to: to,
    from: senderEmail,
    subject: subject,
    text: textContent || '',
    html: htmlContent || textContent
  };

  // Push to background queue instead of blocking
  asyncEmailQueue.push({ id: jobId, apiKey, msg });
  console.log(`[QUEUE] Email job ${jobId} pushed to background queue. Returning 202 Accepted immediately.`);

  // Return immediately so the client UI is not blocked!
  return res.status(202).json({
    success: true,
    message: 'Email job queued for async processing',
    jobId: jobId,
    mode: apiKey ? 'production_queued' : 'mock_queued'
  });
};

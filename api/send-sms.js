let twilio;
try {
  twilio = require('twilio');
} catch (e) {
  // Mock twilio if not installed for local testing
  twilio = () => ({
    messages: {
      create: async (msg) => {
        console.log('[MOCK TWILIO] SMS sent:', msg);
        return { sid: 'mock_sid_123' };
      }
    }
  });
}

// --- 2. SCALING: ASYNC BACKGROUND JOB QUEUE (MOCK) ---
const asyncSmsQueue = [];

function processSmsJobs() {
  if (asyncSmsQueue.length === 0) return;
  const job = asyncSmsQueue.shift();
  console.log(`[ASYNC WORKER] Processing SMS job ID: ${job.id}`);
  
  if (job.accountSid && job.authToken && job.fromNumber) {
    const client = twilio(job.accountSid, job.authToken);
    client.messages.create({
      body: job.message,
      from: job.fromNumber,
      to: job.to
    }).then(result => {
      console.log(`[ASYNC WORKER] SMS job ${job.id} completed. SID: ${result.sid}`);
    }).catch(err => {
      console.error(`[ASYNC WORKER] SMS job ${job.id} failed:`, err.message);
    });
  } else {
    setTimeout(() => {
      console.log(`[ASYNC WORKER] Simulated SMS sent successfully for job ${job.id}`);
    }, 1200);
  }
}
setInterval(processSmsJobs, 2000); // Poll every 2 seconds

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

  const { to, message } = req.body;
  if (!to || !message) {
    return res.status(400).json({ success: false, error: 'Missing required parameters: to, message' });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  const jobId = 'sms_' + Date.now() + '_' + Math.floor(Math.random()*1000);

  // Push to background queue instead of blocking
  asyncSmsQueue.push({ 
    id: jobId, 
    accountSid, 
    authToken, 
    fromNumber, 
    to, 
    message 
  });
  
  console.log(`[QUEUE] SMS job ${jobId} pushed to background queue. Returning 202 Accepted immediately.`);

  // Return immediately so the client UI is not blocked!
  return res.status(202).json({
    success: true,
    message: 'SMS job queued for async processing',
    jobId: jobId,
    mode: accountSid ? 'production_queued' : 'mock_queued'
  });
};

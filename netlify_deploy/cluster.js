const cluster = require('cluster');
const os = require('os');

// =================================================================================
// 5. SCALING: HORIZONTAL SCALING (NODE.JS CLUSTER)
// =================================================================================
// The video recommended running multiple backend instances and putting them behind 
// a Load Balancer (like AWS ECS or Kubernetes).
// Since AutoTriage uses a Node.js development server locally, we can simulate 
// horizontal scaling by using the native 'cluster' module to spawn a worker 
// process for every CPU core on the machine.

if (cluster.isMaster) {
  // Count the machine's CPUs
  const cpuCount = os.cpus().length;

  console.log('====================================================');
  console.log(`🚀 AUTOTRIAGE HORIZONTAL SCALING INITIATED`);
  console.log(`🌐 Master Load Balancer running on PID: ${process.pid}`);
  console.log(`⚙️  Spawning ${cpuCount} worker instances...`);
  console.log('====================================================');

  // Fork a worker for each CPU core
  for (let i = 0; i < cpuCount; i++) {
    cluster.fork();
  }

  // Listen for dying workers and replace them immediately (Self-Healing)
  cluster.on('exit', (worker, code, signal) => {
    console.error(`[SYSTEM WARNING] Worker ${worker.process.pid} died. Booting a replacement...`);
    cluster.fork();
  });

} else {
  // Workers share the TCP connection in this server
  // We simply require the original server.js script.
  // The Node.js cluster module will automatically balance incoming HTTP 
  // connections across all these spawned worker processes.
  
  // NOTE: Because server.js binds to port 8080 and logs on startup, 
  // it might clutter the console. We suppress the port logging in workers 
  // by overriding console.log temporarily if needed, but for demonstration 
  // we'll just require it directly.
  
  console.log(`[WORKER] Instance booted and ready on PID: ${process.pid}`);
  
  // We pass a flag so server.js knows it's a worker and doesn't print 
  // the giant "SERVER ACTIVE" banner multiple times.
  process.env.IS_CLUSTER_WORKER = 'true';
  
  require('./server.js');
}

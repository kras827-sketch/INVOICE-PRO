const net = require('net');

const checkConnection = (host, port) => {
  return new Promise((resolve) => {
    console.log(`Checking connection to ${host}:${port}...`);
    const socket = new net.Socket();
    
    socket.setTimeout(5000); // 5 second timeout

    socket.on('connect', () => {
      console.log(`✅ Successfully connected to ${host}:${port}`);
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      console.log(`❌ Timeout connecting to ${host}:${port}`);
      socket.destroy();
      resolve(false);
    });

    socket.on('error', (err) => {
      console.log(`❌ Error connecting to ${host}:${port}:`, err.message);
      resolve(false);
    });

    socket.connect(port, host);
  });
};

const runChecks = async () => {
  console.log('--- SMTP Connectivity Check ---');
  await checkConnection('smtp.gmail.com', 587); // TLS
  await checkConnection('smtp.gmail.com', 465); // SSL
  console.log('-------------------------------');
};

runChecks();

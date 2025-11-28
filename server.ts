// server.ts - Next.js Standalone
import { createServer } from 'http';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const currentPort = 3000;
const hostname = '0.0.0.0';

// Custom server without Socket.IO
async function createCustomServer() {
  try {
    // Create Next.js app
    const nextApp = next({ 
      dev,
      dir: process.cwd(),
      // In production, use the current directory where .next is located
      conf: dev ? undefined : { distDir: './.next' }
    });

    await nextApp.prepare();
    const handle = nextApp.getRequestHandler();

    // Create HTTP server for Next.js only
    const server = createServer(handle);

    // Start the server
    server.listen(currentPort, hostname, () => {
      // Console statement removed;
    });

  } catch (err) {
    // Console statement removed;
    process.exit(1);
  }
}

// Start the server
createCustomServer();

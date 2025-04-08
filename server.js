const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.IO
  const io = new Server(server, {
    cors: {
      origin: [
        process.env.NEXT_PUBLIC_APP_URL || "http://0.0.0.0:7000",
        process.env.NEXT_PUBLIC_PRODUCTION_URL || "http://43.205.206.138:7000"
      ],
      methods: ["GET", "POST"],
      credentials: true
    },
    path: '/socket.io/',
    addTrailingSlash: false,
  });

  // Socket.IO event handlers
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('rsvpUpdated', (data) => {
      // Broadcast the update to all connected clients except sender
      socket.broadcast.emit('eventUpdated', data);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });

  const PORT = process.env.PORT || 7000;
  const HOST = '0.0.0.0';
  
  server.listen(PORT, HOST, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${HOST}:${PORT}`);
    console.log(`> Socket.IO server running on port ${PORT}`);
  });
}); 
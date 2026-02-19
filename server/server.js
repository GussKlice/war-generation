const PORT = process.env.PORT || 3000;

const io = new Server(server, {
  cors: { 
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling']
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 War Generation lancé sur le port ${PORT}`);
});
const express = require("express");
const http = require("http");
const path = require("path");
const session = require("express-session");

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server);

const sessionMiddleware = session({
  secret: "metaverse-secret-key",
  resave: false,
  saveUninitialized: false
});

const chatHistory = [];
const MAX_CHAT_HISTORY = 15;

const whiteboardHistory = [];
const MAX_WHITEBOARD_HISTORY = 5000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(sessionMiddleware);

const usersDb = [
  {
    username: "nikola",
    password: "1234",
    name: "King Nikola",
    role: "admin",
    color: "#9333ea"
  },
  {
    username: "teacher",
    password: "1234",
    name: "Teacher",
    role: "teacher",
    color: "#2563eb"
  },
  {
    username: "student",
    password: "1234",
    name: "Student",
    role: "student",
    color: "#16a34a"
  },
  {
    username: "guest",
    password: "1234",
    name: "Guest",
    role: "guest",
    color: "#dc2626"
  }
];

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login.html");
  }
  next();
}

app.get("/", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login.html");
  }
  res.redirect("/index.html");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = usersDb.find(
    u => u.username === username && u.password === password
  );

  if (!user) {
    return res.redirect("/login.html?error=1");
  }

  req.session.user = {
    username: user.username,
    name: user.name,
    role: user.role,
    color: user.color
  };

  res.redirect("/index.html");
});

app.get("/me", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in" });
  }

  res.json(req.session.user);
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login.html");
  });
});

app.use("/index.html", requireLogin);
app.use(express.static(path.join(__dirname, "public")));

io.engine.use(sessionMiddleware);

const connectedUsers = {};

io.on("connection", socket => {
  const session = socket.request.session;

  if (!session || !session.user) {
    socket.disconnect();
    return;
  }

  const user = session.user;

  

  connectedUsers[socket.id] = {
    id: socket.id,
    name: user.name,
    role: user.role,
    color: user.color,
    x: 0,
    y: 1.6,
    z: 4,
    ry: 0
  };
  
  socket.emit("current-users", connectedUsers);
  socket.emit("chatHistory", chatHistory);
  socket.emit("whiteboardHistory", whiteboardHistory);

  socket.broadcast.emit("user-connected", connectedUsers[socket.id]);

socket.on("chatMessage", message => {

  if (!connectedUsers[socket.id]) return;
  if (!message) return;

  const cleanMessage = String(message)
    .trim()
    .substring(0, 300);

  if (!cleanMessage) return;

  const chatData = {
    user: user.name,
    role: user.role,
    color: user.color,
    message: cleanMessage,
    time: new Date().toISOString()
  };

  chatHistory.push(chatData);

  if (chatHistory.length > MAX_CHAT_HISTORY) {
    chatHistory.shift();
  }

  io.emit("chatMessage", chatData);
});


  socket.on("playerMove", data => {
    if (!connectedUsers[socket.id]) return;

    connectedUsers[socket.id].x = data.x;
    connectedUsers[socket.id].y = data.y;
    connectedUsers[socket.id].z = data.z;
    connectedUsers[socket.id].ry = data.ry;

    socket.broadcast.emit("playerMoved", connectedUsers[socket.id]);
  });
  socket.on("whiteboardDraw", line => {
    if (!connectedUsers[socket.id]) return;
    if (!line) return;

    const drawData = {
      x1: Number(line.x1),
      y1: Number(line.y1),
      x2: Number(line.x2),
      y2: Number(line.y2),
      color: line.color || "#000000",
      size: Number(line.size) || 3
    };

    whiteboardHistory.push(drawData);

    if (whiteboardHistory.length > MAX_WHITEBOARD_HISTORY) {
      whiteboardHistory.shift();
    }

    socket.broadcast.emit("whiteboardDraw", drawData);
  });

  socket.on("whiteboardClear", () => {
    if (!connectedUsers[socket.id]) return;

    const currentUser = connectedUsers[socket.id];

    if (currentUser.role !== "admin" && currentUser.role !== "teacher") {
      return;
    }

    whiteboardHistory.length = 0;
    io.emit("whiteboardClear");
  });
  socket.on("disconnect", () => {
    delete connectedUsers[socket.id];
    socket.broadcast.emit("user-disconnected", socket.id);
  });
});

server.listen(8080, () => {
  console.log("Server running: http://localhost:8080");
});
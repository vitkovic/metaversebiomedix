const express = require("express");
const http = require("http");
const path = require("path");
const session = require("express-session");

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
  maxHttpBufferSize: 5e6
});

const sessionMiddleware = session({
  secret: "metaverse-secret-key",
  resave: false,
  saveUninitialized: false
});

const chatHistory = [];
const MAX_CHAT_HISTORY = 15;

const whiteboardHistory = [];
const MAX_WHITEBOARD_HISTORY = 5000;



let currentMeetingScreen = {
  type: "video",
  src: "/assets/femur.mp4",
  title: "Femur"
};

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
    color: "#CC6912"
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
app.use("/rooms", requireLogin);

app.use(express.static(path.join(__dirname, "public")));

io.engine.use(sessionMiddleware);

const connectedUsers = {};

function getUsersInRoom(roomName) {
  const usersInRoom = {};

  Object.keys(connectedUsers).forEach(id => {
    if (connectedUsers[id].room === roomName) {
      usersInRoom[id] = connectedUsers[id];
    }
  });

  return usersInRoom;
}


function getOnlineUsers() {
  return Object.values(connectedUsers).map(user => ({
    name: user.name,
    role: user.role,
    color: user.color,
    room: user.room
  }));
}

function emitOnlineUsers() {
  io.emit("onlineUsersUpdate", getOnlineUsers());
}


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
    room: "lobby",
    x: 0,
    y: 1.6,
    z: 4,
    ry: 0
  };

  socket.join("lobby");

  socket.emit("chatHistory", chatHistory);
  socket.emit("whiteboardHistory", whiteboardHistory);
  socket.emit("meetingScreenChanged", currentMeetingScreen);

  socket.to("lobby").emit("user-connected", connectedUsers[socket.id]);
  
  
  emitOnlineUsers();

  socket.on("joinRoom", roomName => {
    if (!connectedUsers[socket.id]) return;

    const oldRoom = connectedUsers[socket.id].room || "lobby";
    const newRoom = roomName || "lobby";

    socket.leave(oldRoom);
    socket.to(oldRoom).emit("user-disconnected", socket.id);

    socket.join(newRoom);

    connectedUsers[socket.id].room = newRoom;
    connectedUsers[socket.id].x = 0;
    connectedUsers[socket.id].y = 1.6;
    connectedUsers[socket.id].z = 4;
    connectedUsers[socket.id].ry = 0;

    socket.emit("current-users", getUsersInRoom(newRoom));
    socket.to(newRoom).emit("user-connected", connectedUsers[socket.id]);
	
	emitOnlineUsers();

    if (newRoom === "meeting") {
      socket.emit("meetingScreenChanged", currentMeetingScreen);
    }
  });

  socket.on("chatMessage", message => {
    if (!connectedUsers[socket.id]) return;
    if (!message) return;

    const cleanMessage = String(message).trim().substring(0, 300);
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

    connectedUsers[socket.id].x = Number(data.x) || 0;
    connectedUsers[socket.id].y = Number(data.y) || 1.6;
    connectedUsers[socket.id].z = Number(data.z) || 4;
    connectedUsers[socket.id].ry = Number(data.ry) || 0;

    const room = connectedUsers[socket.id].room || "lobby";

    socket.to(room).emit("playerMoved", connectedUsers[socket.id]);
	emitOnlineUsers();
  });

  
  socket.on("whiteboardImage", data => {

    if (!connectedUsers[socket.id]) return;
    if (!data) return;

    const imageData = {
      type: "image",
      image: data.image,
      x: Number(data.x) || 100,
      y: Number(data.y) || 100,
      width: Number(data.width) || 300,
      height: Number(data.height) || 200
    };

    whiteboardHistory.push(imageData);

    if (whiteboardHistory.length > MAX_WHITEBOARD_HISTORY) {
      whiteboardHistory.shift();
    }

    io.emit("whiteboardImage", imageData);

  });
  
  
  socket.on("whiteboardDraw", line => {
    if (!connectedUsers[socket.id]) return;
    if (!line) return;

    const drawData = {
      type: "line",
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

  socket.on("whiteboardText", data => {
    if (!connectedUsers[socket.id]) return;
    if (!data) return;

    const textData = {
      type: "text",
      text: String(data.text || "").trim().substring(0, 120),
      x: Number(data.x),
      y: Number(data.y),
      color: data.color || "#000000",
      size: Number(data.size) || 28
    };

    if (!textData.text) return;

    whiteboardHistory.push(textData);

    if (whiteboardHistory.length > MAX_WHITEBOARD_HISTORY) {
      whiteboardHistory.shift();
    }

    io.emit("whiteboardText", textData);
  });

  socket.on("whiteboardClear", () => {
    if (!connectedUsers[socket.id]) return;

    whiteboardHistory.length = 0;
    io.emit("whiteboardClear");
  });

  socket.on("changeMeetingScreen", screen => {
    if (!connectedUsers[socket.id]) return;

    const currentUser = connectedUsers[socket.id];

	/*
    if (currentUser.role !== "admin") {
      return;
    }

	*/
	
    if (!screen || !screen.src) {
      return;
    }

    currentMeetingScreen = {
      type: screen.type || "video",
      src: String(screen.src),
      title: String(screen.title || "Screen")
    };

    io.to("meeting").emit("meetingScreenChanged", currentMeetingScreen);
  });

  socket.on("disconnect", () => {
    if (connectedUsers[socket.id]) {
      const room = connectedUsers[socket.id].room || "lobby";
      delete connectedUsers[socket.id];
      socket.to(room).emit("user-disconnected", socket.id);
    }
  });
});

server.listen(8080, () => {
  console.log("Server running: http://localhost:8080");
});
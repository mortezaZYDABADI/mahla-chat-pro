const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const port = process.env.PORT || 3000;

app.use(express.static("public"));

let users = {};
let leaders = { leader: null, assistants: [] };

io.on("connection", socket => {
  console.log("User connected:", socket.id);

  socket.on("register", data => {
    users[socket.id] = { ...data, id: socket.id };
    if(!leaders.leader) leaders.leader = socket.id;
    io.emit("users", users);
    socket.emit("welcome", `سلام ${data.name}! به چت روم مهلا خوش آمدید.`);
  });

  socket.on("message", msg => {
    if(users[socket.id])
      io.emit("message", { user: users[socket.id], text: msg });
  });

  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit("users", users);
  });
});

http.listen(port, () => console.log(`Server running on port ${port}`));

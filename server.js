const express = require("express");
const app = express();
const http = require("http");
const sockets = require("socket.io");
const PORT = 3000;

const server = http.createServer(app);
// connection to backend
const io = sockets(server);

/**** WHAT IS THIS? ********************/
const RoomService = require("./RoomService")(io);
io.sockets.on("connection", RoomService.listen);
io.sockets.on("error", e => console.error(e));
/************************/

// serve static files
app.use(express.static(__dirname + "/public"));
// all routes get served index page
app.get("*", (req, res) => {
	res.sendFile(`${__dirname}/public/index.html`);
});

server.listen(PORT, () => console.log("Server is listening on port:", PORT));

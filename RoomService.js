let _io;
const MAX_CLIENTS = 3;

function listen(socket) {
	// SOCKET SERVER
	const io = _io;
	//console.log("WHAT IS IO?\n", io);
	//? array of rooms
	const rooms = io.nsps["/"].adapter.rooms;
	// {socket.id { sockets: { socket.id: true }, length: 1 }}
	//console.log("ROOMS\n", rooms);

	socket.on("join", room => {
		let clients = 0;
		if (rooms[rooms]) {
			clients = rooms[room].length;
		}
		// HANDLE EVENTS OF SPECIFIC ROOM
		if (clients < MAX_CLIENTS) {
			socket.on("ready", () => {
				console.log(`** READY ** ${room}, ${socket.id}`);
				socket.broadcast.to(room).emit("ready", socket.id);
			});
			socket.on("offer", (id, message) => {
				console.log(`** OFFER ** ${message}, ${socket.id}`);
				socket.to(id).emit("offer", socket.id, message);
			});
			socket.on("answer", (id, message) => {
				console.log(`** ANSWER ** ${message}, ${socket.id}`);
				socket.to(id).emit("answer", socket.id, message);
			});
			socket.on("candidate", (id, message) => {
				console.log(`** CANDIDATE ** ${JSON.stringify(message,null,6)}, ${socket.id}`);
				// IS THIS CORRECT?
				socket.to(id).emit("candidate", socket.id, message);
			});
			socket.on("disconnect", () => {
				console.log(`** CANDIDATE ** ${room}, ${socket.id}`);
				socket.broadcast.to(room).emit("bye", socket.id);
			});
			console.log(`** JOINING ROOM ** ${room}`);
			socket.join(room);
		} else {
			socket.emit("full", room);
		}
	});
}

module.exports = function(io) {
	_io = io;
	return { listen };
};

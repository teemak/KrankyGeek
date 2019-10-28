(() => {
	/***** THIS IS WEBRTC *****/
	const socket = io.connect(window.location.origin); // CONNECTION TO BACK END
	//const socket = io("http://localhost:3000"); // CONNECTION TO BACK END
	const localVideo = document.querySelector(".localVideo");
	const remoteVideos = document.querySelector(".remoteVideos");
	const peerConnections = {};

	let room = !location.pathname.substring(1) ? "home" : location.pathname.substring(1);

	let getUserMediaAttempts = 5;
	let gettingUserMedia = false;

	const config = {
		iceServers: [
			{
				urls: ["stun:stun.l.google.com:19302"],
			},
		],
	};

	const constraints = {
		video: { facingMode: "user" },
	};

	socket.on("full", room => {
		alert("Room " + room + " is full");
	});

	socket.on("bye", id => {
		handleRemoteHangup(id);
	});

	if (room && !!room) {
		socket.emit("join", room);
	}

	window.onunload = window.onbeforeunload = () => {
		socket.close();
	};

	socket.on("ready", id => {
		if (!(localVideo instanceof HTMLVideoElement) || !localVideo.srcObject) {
			return;
		}
		const peerConnection = new RTCPeerConnection(config);
		peerConnections[id] = peerConnection;
		if (localVideo instanceof HTMLVideoElement) {
			peerConnection.addStream(localVideo.srcObject);
		}
		peerConnection
			.createOffer()
			.then(sdp => peerConnection.setLocalDescription(sdp))
			.then(() => socket.emit("offer", id, peerConnection.localDescription));

		peerConnection.onicecandidate = event => {
			if (event.candidate) {
				socket.emit("candidate", id, event.candidate);
			}
		};
	});

	socket.on("offer", (id, description) => {
		const peerConnection = new RTCPeerConnection(config);
		peerConnections[id] = peerConnection;
		if (localVideo instanceof HTMLVideoElement) {
			peerConnection.addStream(localVideo.srcObject);
		}
		peerConnection
			.setRemoteDescription(description)
			.then(() => peerConnection.createAnswer())
			.then(sdp => peerConnection.setLocalDescription(sdp))
			.then(() => socket.emit("answer", id, peerConnection.localDescription));

		peerConnection.ontrack = event => handleRemoteStreamAdded(event.stream, id);
		//peerConnection.onaddstream = event => handleRemoteStreamAdded(event.stream, id);
		peerConnection.onicecandidate = event => {
			if (event.candidate) {
				socket.emit("candidate", id, event.candidate);
			}
		};
	});

	socket.on("candidate", (id, candidate) => {
		peerConnections[id]
			.addIceCandidate(new RTCIceCandidate(candidate))
			.catch(e => console.error(e));
	});

	socket.on("answer", (id, description) => {
		peerConnections[id].setRemoteDescription(description);
	});

	const getUserMediaSuccess = stream => {
		gettingUserMedia = false;
		if (localVideo instanceof HTMLVideoElement) {
			!localVideo.srcObject && (localVideo.srcObject = stream);
		}
		socket.emit("ready");
	};

	const handleRemoteStreamAdded = (stream, id) => {
		const remoteVideo = document.createElement("video");
		remoteVideo.srcObject = stream;
		remoteVideo.setAttribute("id", id.replace(/[^a-zA-Z]+/g, "").toLowerCase());
		remoteVideo.setAttribute("playsinline", "true");
		remoteVideo.setAttribute("autoplay", "true");
		remoteVideos.appendChild(remoteVideo);
		if (remoteVideos.querySelectorAll("video").length === 1) {
			remoteVideos.setAttribute("class", "one remoteVideos");
		} else {
			remoteVideos.setAttribute("class", "remoteVideos");
		}
	};

	const getUserMediaError = error => {
		console.error(error);
		gettingUserMedia = false;
		// WHAT DOES THIS DO?
		--getUserMediaAttempts > 0 && setTimeout(getUserMediaDevices, 1000);
	};

	const getUserMediaDevices = () => {
		if (localVideo instanceof HTMLVideoElement) {
			if (localVideo.srcObject) {
				getUserMediaSuccess(localVideo.srcObject);
			} else if (!gettingUserMedia && !localVideo.srcObject) {
				gettingUserMedia = true;
				navigator.mediaDevices
					.getUserMedia(constraints)
					.then(getUserMediaSuccess)
					.catch(getUserMediaError);
			}
		}
	};

	const handleRemoteHangup = id => {
		// if there is a connection close it
		peerConnections[id] && peerConnections[id].close();
		delete peerConnections[id];
		let video = document.querySelector("#" + id.replace(/[^a-zA-Z]+/g, "").toLowerCase());
		console.log("REMOVE THIS", video);
		video.remove();
		if (remoteVideos.querySelectorAll("video").length === 1) {
			remoteVideos.setAttribute("class", "one remoteVideos");
		} else {
			remoteVideos.setAttribute("class", "remoteVideos");
		}
	};

	getUserMediaDevices();
})();

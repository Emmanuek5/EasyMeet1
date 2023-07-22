const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header-back");
const dmusers = document.querySelector("#dm-users");
const videoName = document.querySelector(".video-name");
const myUsername = user; // Replace with the current user's username

myVideo.muted = true;

backBtn.addEventListener("click", () => {
  document.querySelector(".main-left").style.display = "flex";
  document.querySelector(".main-left").style.flex = "1";
  document.querySelector(".main-right").style.display = "none";
  document.querySelector(".header-back").style.display = "none";
});

showChat.addEventListener("click", () => {
  document.querySelector(".main-right").style.display = "flex";
  document.querySelector(".main-right").style.flex = "1";
  document.querySelector(".main-left").style.display = "none";
  document.querySelector(".header-back").style.display = "block";
});

var peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "443",
});

let myVideoStream;
navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myUsername, myVideo, stream); // Use myUsername instead of "user" variable
    myVideoStream.getAudioTracks()[0].enabled = true;
    myVideoStream.getVideoTracks()[0].enabled = true;

    // Screen Share functionality
    const shareScreenButton = document.getElementById("shareScreenButton");
    let screenShareStream;

    async function startScreenShare() {
      try {
        screenShareStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        const userVideo = document.getElementById("user_" + myUsername);
        userVideo.srcObject = screenShareStream;
        userVideo.muted = true;
        socket.emit("startScreenShare");
        myVideoStream.getVideoTracks().forEach((track) => {
          track.stop();
        });
        shareScreenButton.removeEventListener("click", startScreenShare);
        userVideo.addEventListener("click", stopScreenShare);
      } catch (err) {
        console.error("Error starting screen share:", err);
      }
    }

    function stopScreenShare() {
      const userVideo = document.getElementById("user_" + myUsername);
      userVideo.srcObject = myVideoStream;
      shareScreenButton.addEventListener("click", startScreenShare);
      screenShareStream.getTracks().forEach((track) => {
        track.stop();
      });
      socket.emit("stopScreenShare");
    }

    shareScreenButton.addEventListener("click", startScreenShare);

    myVideo.addEventListener("click", stopScreenShare);

    socket.on("startScreenShare", () => {
      const userVideo = document.getElementById("user_" + myUsername);
      userVideo.srcObject = screenShareStream;
      userVideo.muted = true;
    });

    socket.on("stopScreenShare", () => {
      const userVideo = document.getElementById("user_" + myUsername);
      userVideo.srcObject = myVideoStream;
      userVideo.muted = false;
    });
    // End of Screen Share functionality

    peer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        getPeerIds().then((ids) => {
          console.log(call.peer);
          addVideoStream(ids[call.peer], video, userVideoStream);
        });
      });
    });

    socket.on("joined", (id, username) => {
      connectToNewUser(username, id, stream);
      var option = document.createElement("option");
      option.id = "dm_" + username;
      option.innerHTML = username;
      dmusers.appendChild(option);
      if (!focus) document.getElementById("chat-alert").play();
    });
    socket.on("leave", (user) => {
      document.querySelector("#user_" + user).remove();
      document.querySelector("#dm_" + user).remove();
    });
  })
  .catch((err) => {
    alertmodal(
      "",
      "To join this meet you must allow access to your microphone and camera."
    ).then(() => (location.href = "/join"));
  });

function connectToNewUser(username, id, stream) {
  const call = peer.call(id, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(username, video, userVideoStream);
  });
}

peer.on("open", (id) => {
  socket.emit("joined", room, id, user);
});

function addVideoStream(username, video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.id = "user_" + username;
    video.play();
    videoGrid.appendChild(video);
  });
  video.addEventListener("mouseover", (e) => {
    videoName.style.display = "block";
    videoName.style.left = e.pageX + "px";
    videoName.style.top = e.pageY + "px";
    videoName.innerHTML = username;
  });
  video.addEventListener("mouseleave", () => {
    videoName.style.display = "none";
  });
  video.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });
}

let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");

const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");

muteButton.addEventListener("click", () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  myVideoStream.getAudioTracks()[0].enabled = !enabled;
  const html = enabled
    ? `<i class="fas fa-microphone"></i>`
    : `<i class="fas fa-microphone-slash"></i>`;
  muteButton.classList.toggle("background-red");
  muteButton.innerHTML = html;
});

stopVideo.addEventListener("click", () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  myVideoStream.getVideoTracks()[0].enabled = !enabled;
  const html = enabled
    ? `<i class="fas fa-video"></i>`
    : `<i class="fas fa-video-slash"></i>`;
  stopVideo.classList.toggle("background-red");
  stopVideo.innerHTML = html;
});

inviteButton.addEventListener("click", () => {
  copyModal("Invite Via Link", "Copy Link", location.href);
});

document
  .getElementById("leave")
  .addEventListener("click", () => (location.href = "/join"));

function getTime() {
  var d = new Date();
  var h = d.getHours();
  var m = d.getMinutes();
  if (h > 12) {
    h = h - 12;
    if (m < 10) {
      m = "0" + String(m);
    }
    d = String(h) + ":" + String(m) + " PM";
    return d;
  } else {
    if (m < 10) {
      m = "0" + String(m);
    }
    d = String(h) + ":" + String(m) + " AM";
    return d;
  }
}

async function getPeerIds() {
  let response = await fetch("/peerids");
  return await response.json();
}

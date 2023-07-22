// JavaScript
const videoGrid = document.getElementById("video-grid");
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header-back");
const dmusers = document.querySelector("#dm-users");
const videoName = document.querySelector(".video-name");
const myUsername = user; // Replace this with the actual username

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
let myVideo;

navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    myVideo = createVideoElement(myUsername, myVideoStream, true);
    videoGrid.appendChild(myVideo);

    myVideoStream.getAudioTracks()[0].enabled = !audioOff;
    myVideoStream.getVideoTracks()[0].enabled = !videoOff;

    peer.on("call", (call) => {
      call.answer(stream);
      const username = call.metadata.username;
      const video = createVideoElement(username, stream);
      call.on("stream", (userVideoStream) => {
        addVideoStream(username, video, userVideoStream);
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
  const call = peer.call(id, stream, { metadata: { username: myUsername } });
  const video = createVideoElement(username, stream);
  call.on("stream", (userVideoStream) => {
    addVideoStream(username, video, userVideoStream);
  });
}

peer.on("open", (id) => {
  socket.emit("joined", room, id, myUsername);
});

function addVideoStream(username, video, stream) {
  video.srcObject = stream;
  videoGrid.appendChild(video);
}

function createVideoElement(username, stream, isMyVideo = false) {
  const videoContainer = document.createElement("div");
  videoContainer.classList.add("video-container");

  const videoElement = document.createElement("video");
  videoElement.srcObject = stream;
  videoElement.playsinline = true;
  videoElement.muted = isMyVideo;
  videoElement.autoplay = true;
  videoElement.classList.add("video-element");

  const userInfo = document.createElement("div");
  userInfo.classList.add("user-info");
  userInfo.innerText = username;

  videoContainer.appendChild(videoElement);
  videoContainer.appendChild(userInfo);

  return videoContainer;
}

let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");

const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");
const shareScreenButton = document.querySelector("#shareScreenButton");

muteButton.addEventListener("click", () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  myVideoStream.getAudioTracks()[0].enabled = !enabled;
  const icon = enabled ? "fa-microphone" : "fa-microphone-slash";
  muteButton.classList.toggle("background-red", !enabled);
  muteButton.innerHTML = `<i class="fas ${icon}"></i>`;
});

stopVideo.addEventListener("click", () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  myVideoStream.getVideoTracks()[0].enabled = !enabled;
  const icon = enabled ? "fa-video" : "fa-video-slash";
  stopVideo.classList.toggle("background-red", !enabled);
  stopVideo.innerHTML = `<i class="fas ${icon}"></i>`;
});

let screenShareStream;
let isScreenSharing = false;

function startScreenShare() {
  navigator.mediaDevices
    .getDisplayMedia({ video: true })
    .then((stream) => {
      const screenShareVideo = createVideoElement("Screen Share", stream);
      videoGrid.appendChild(screenShareVideo);
      isScreenSharing = true;
      screenShareStream = stream;
      peer.call([...peer.connections].pop(), stream);
      shareScreenButton.disabled = true;
    })
    .catch((err) => {
      console.error("Error accessing screen share:", err);
    });
}

function stopScreenShare() {
  if (screenShareStream) {
    screenShareStream.getTracks().forEach((track) => track.stop());
  }
  const screenShareVideo = document.querySelector(
    "#video-grid video:last-child"
  );
  if (screenShareVideo) {
    videoGrid.removeChild(screenShareVideo.parentElement);
  }
  isScreenSharing = false;
  shareScreenButton.disabled = false;
}

shareScreenButton.addEventListener("click", () => {
  if (isScreenSharing) {
    stopScreenShare();
  } else {
    startScreenShare();
  }
});

inviteButton.addEventListener("click", () => {
  copyModal("Invite Via Link", "Copy Link", location.href);
});

document
  .getElementById("leave")
  .addEventListener("click", () => (location.href = "/join"));

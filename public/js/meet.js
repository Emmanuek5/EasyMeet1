const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header-back");
const dmusers = document.querySelector("#dm-users");
const videoName = document.querySelector(".video-name");
myVideo.muted = true;

// Add a new video element for screen sharing
const screenShareVideo = document.createElement("video");
screenShareVideo.muted = true;
screenShareVideo.setAttribute("class", "screen-share-video");

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
let screenShareStream; // For storing the screen share stream
let screenShareActive = false; // To check if screen sharing is active

navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(user, myVideo, stream);
    myVideoStream.getAudioTracks()[0].enabled = audioOff == true ? false : true;
    myVideoStream.getVideoTracks()[0].enabled = videoOff == true ? false : true;

    if (audioOff) {
      myVideoStream.getAudioTracks()[0].enabled = false;
      html = `<i class="fas fa-microphone-slash"></i>`;
      muteButton.classList.toggle("background-red");
      muteButton.innerHTML = html;
    } else {
      myVideoStream.getAudioTracks()[0].enabled = true;
      html = `<i class="fas fa-microphone"></i>`;
      muteButton.innerHTML = html;
    }

    if (videoOff) {
      myVideoStream.getVideoTracks()[0].enabled = false;
      html = `<i class="fas fa-video-slash"></i>`;
      stopVideo.classList.toggle("background-red");
      stopVideo.innerHTML = html;
    } else {
      myVideoStream.getVideoTracks()[0].enabled = true;
      html = `<i class="fas fa-video"></i>`;
      stopVideo.innerHTML = html;
    }

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

  // Add mute icon if the user is muted
  if (stream.getAudioTracks()[0].enabled === false) {
    const muteIcon = document.createElement("i");
    muteIcon.classList.add("fas", "fa-microphone-slash", "mute-icon");
    video.parentElement.appendChild(muteIcon);
  }

  // Audio volume analysis and shadow effect
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = audioContext.createAnalyser();
  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);
  analyser.fftSize = 256;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function detectAudioVolume() {
    analyser.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;
    const intensity = Math.min(1, average / 128); // Normalize intensity between 0 and 1
    const shadowIntensity = 255 - Math.round(255 * intensity); // Invert intensity for shadow value
    const shadowColor = `rgba(0, 0, 255, ${shadowIntensity / 255})`; // Blue shadow with variable opacity
    video.style.boxShadow = `0 0 15px 5px ${shadowColor}`;
    requestAnimationFrame(detectAudioVolume);
  }
  detectAudioVolume();
}

let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");

const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");

muteButton.addEventListener("click", () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    html = `<i class="fas fa-microphone-slash"></i>`;
    muteButton.classList.toggle("background-red");
    muteButton.innerHTML = html;
    // Add mute icon for the local user's video
    const muteIcon = document.createElement("i");
    muteIcon.classList.add("fas", "fa-microphone-slash", "mute-icon");
    myVideo.parentElement.appendChild(muteIcon);
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    html = `<i class="fas fa-microphone"></i>`;
    muteButton.classList.toggle("background-red");
    muteButton.innerHTML = html;
    // Remove mute icon for the local user's video
    const muteIcons = document.querySelectorAll(".mute-icon");
    muteIcons.forEach((icon) => icon.parentElement.removeChild(icon));
  }
});

stopVideo.addEventListener("click", () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    html = `<i class="fas fa-video-slash"></i>`;
    stopVideo.classList.toggle("background-red");
    stopVideo.innerHTML = html;
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    html = `<i class="fas fa-video"></i>`;
    stopVideo.classList.toggle("background-red");
    stopVideo.innerHTML = html;
  }
});

// Function to handle screen share
function handleScreenShare() {
  if (!screenShareActive) {
    // Obtain screen share stream
    navigator.mediaDevices
      .getDisplayMedia({
        video: {
          cursor: "always",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      })
      .then((stream) => {
        screenShareStream = stream;
        toggleScreenShare();
        screenShareActive = true;
        // Add the new screen share video element to the page
        addVideoStream("Screen Share", screenShareVideo, stream);
        // When screen sharing is stopped, remove the screen share video element
        screenShareStream.getVideoTracks()[0].addEventListener("ended", () => {
          stopScreenShare();
        });
      })
      .catch((error) => {
        console.error("Error accessing screen share:", error);
      });
  } else {
    stopScreenShare();
  }
}

// Function to toggle screen share
function toggleScreenShare() {
  const enabled = !screenShareStream.getVideoTracks()[0].enabled;
  screenShareStream.getVideoTracks()[0].enabled = enabled;
  const icon = document.querySelector("#screenShareBtn i");
  if (enabled) {
    icon.classList.remove("fa-desktop");
    icon.classList.add("fa-stop-circle");
  } else {
    icon.classList.remove("fa-stop-circle");
    icon.classList.add("fa-desktop");
  }
}

// Function to stop screen sharing
function stopScreenShare() {
  if (screenShareActive) {
    screenShareStream.getTracks().forEach((track) => track.stop());
    screenShareActive = false;
    toggleScreenShare();
    // Remove the screen share video element from the page
    screenShareVideo.srcObject = null;
    videoGrid.removeChild(screenShareVideo);
  }
}

// Event listener for screen share button click
const screenShareBtn = document.getElementById("screenShareBtn");
screenShareBtn.addEventListener("click", handleScreenShare);

inviteButton.addEventListener("click", () => {
  copyModal(
    "Copy this link and send it to people you want to meet with",
    "Copy!",
    location.href
  );
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

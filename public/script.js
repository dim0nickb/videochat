const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header__back");

backBtn.addEventListener("click", () => {
  document.querySelector(".main__left").style.display = "flex";
  document.querySelector(".main__left").style.flex = "1";
  document.querySelector(".main__right").style.display = "none";
  document.querySelector(".header__back").style.display = "none";
});

showChat.addEventListener("click", () => {
  document.querySelector(".main__right").style.display = "flex";
  document.querySelector(".main__right").style.flex = "1";
  document.querySelector(".main__left").style.display = "none";
  document.querySelector(".header__back").style.display = "block";
});

const name = localStorage.getItem("userName");
const user = name ? name: prompt("Enter your name");
localStorage.setItem("userName", user);
localStorage.setItem("userDisconnected", false);

var peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "443",
});

const userIds = [];
let myVideoStream;
navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(stream, user, "my-video");

    peer.on("call", (call) => {
      console.log('someone call me');
      call.answer(stream);   
      call.on("stream", (userVideoStream) => {
        addVideoStream(userVideoStream, user, "user video");
      });
    });

    socket.on("user-connected", (userId, userName) => {
      console.log(`user connected, id: ${userId}, name: ${userName}`);
      connectToNewUser(userId, stream, userName);
    });

    socket.on("user-disconnected", (userId) => {
      console.log("user disconnected, id: ", userId);
      const videoPanel = document.getElementById(userId)
      if (videoPanel) {
        videoGrid.removeChild(videoPanel);
      }
      if (userIds.includes(userId)) {
        userIds.splice(userIds.indexOf(userId), 1);
      }
    });
  });

const connectToNewUser = (userId, stream, userName) => {
  console.log('I call someone' + userId);
  const call = peer.call(userId, stream);
  call.on("stream", (userVideoStream) => {
    addVideoStream(userVideoStream, userName, userId);
  });
};

peer.on("open", (id) => {
  console.log('open, id: ' + id);
  console.log('open, ROOM_ID: ' + JSON.stringify(ROOM_ID));
  console.log('open, user: ' + JSON.stringify(user));
  socket.emit("join-room", ROOM_ID, id, user);
});

const addVideoStream = (stream, userName, userId) => {
  if (stream) {
    const video = document.createElement("video");
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
      console.log("------------> loadedmetadata");
      video.play();
    });

    const videoLabel = document.createElement("div");
    videoLabel.classList.add("video-label");
    videoLabel.textContent = userName;
    const videoPanel = document.createElement("div");
    videoPanel.append(videoLabel);
    videoPanel.append(video);
    videoPanel.id = userId;
    videoPanel.classList.add("video-panel");
    videoPanel.classList.add("video-window-full");
    
    if (!videoPanel.oncick) {
      videoPanel.oncick = 1;
      videoPanel.addEventListener("click", () => {
        console.log("...click on video");
        videoPanel.classList.toggle("video-window-half");
      });
    }

    videoGrid.append(videoPanel);
  }
};

let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");

send.addEventListener("click", (e) => {
  if (text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");
muteButton.addEventListener("click", () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    html = `<i class="fas fa-microphone-slash"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    html = `<i class="fas fa-microphone"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  }
});

stopVideo.addEventListener("click", () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    html = `<i class="fas fa-video-slash"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    html = `<i class="fas fa-video"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  }
});

inviteButton.addEventListener("click", (e) => {
  prompt(
    "Copy this link and send it to people you want to meet with",
    window.location.href
  );
});

socket.on("createMessage", (message, userName) => {
  messages.innerHTML =
    messages.innerHTML +
    `<div class="message">
        <b><i class="far fa-user-circle"></i> <span> ${userName}</span> </b>
        <span>${message}</span>
    </div>`;
});

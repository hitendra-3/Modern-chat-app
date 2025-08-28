const socket = io();

const loginScreen = document.getElementById("login-screen");
const chatScreen = document.getElementById("chat-screen");
const usernameInput = document.getElementById("username-input");
const roomInput = document.getElementById("room-input");
const joinBtn = document.getElementById("join-btn");
const avatarScroll = document.getElementById("avatar-scroll");

const usersList = document.getElementById("users");
const messages = document.getElementById("messages");
const form = document.getElementById("chat-form");
const input = document.getElementById("message-input");
const roomTitle = document.getElementById("room-title");
const typingDiv = document.getElementById("typing");

let username = "";
let room = "";
let selectedAvatar = "";
let typingTimeout;

/* ---------------- One Piece Anime Avatars ---------------- */
const avatars = [
  "https://api.dicebear.com/7.x/adventurer/png?seed=MonkeyDLuffy",   // Boy 1 (Luffy)
  "https://api.dicebear.com/7.x/adventurer/png?seed=RoronoaZoro",   // Boy 2 (Zoro)
  "https://api.dicebear.com/7.x/adventurer/png?seed=Nami",          // Girl 1 (Nami)
  "https://api.dicebear.com/7.x/adventurer/png?seed=NicoRobin"      // Girl 2 (Robin)
];

// Render avatars dynamically into avatar-scroll div
avatars.forEach((url, idx) => {
  const img = document.createElement("img");
  img.src = url;
  img.classList.add("avatar-option");

  // First avatar pre-selected
  if (idx === 0) {
    img.classList.add("selected");
    selectedAvatar = url;
  }

  img.addEventListener("click", () => {
    document.querySelectorAll(".avatar-option").forEach(a => a.classList.remove("selected"));
    img.classList.add("selected");
    selectedAvatar = url;
  });

  avatarScroll.appendChild(img);
});

/* ---------------- Render Messages ---------------- */
function renderMessage({ from, content, time, avatar }) {
  const li = document.createElement("li");

  if (from === "System") {
    li.classList.add("system");
    li.textContent = content;
  } else {
    const avatarImg = document.createElement("img");
    avatarImg.src = avatar;
    avatarImg.classList.add("avatar-msg");

    const text = document.createElement("span");
    text.textContent = (from === username ? `You: ${content}` : `${from}: ${content}`);

    const timestamp = document.createElement("span");
    timestamp.classList.add("timestamp");
    timestamp.textContent = time;

    li.appendChild(avatarImg);
    li.appendChild(text);
    li.appendChild(timestamp);

    li.classList.add(from === username ? "me" : "other");
  }

  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;
}

/* ---------------- Join Button ---------------- */
function joinRoom() {
  const name = usernameInput.value.trim();
  const roomId = roomInput.value.trim();
  if (name && roomId && selectedAvatar) {
    username = name;
    room = roomId;
    socket.emit("joinRoom", { username, room, avatar: selectedAvatar });

    loginScreen.classList.add("hidden");
    chatScreen.classList.remove("hidden");
    roomTitle.textContent = `Room: ${room}`;
  } else {
    alert("Please enter your name, room ID and select avatar");
  }
}

joinBtn.addEventListener("click", joinRoom);

// Press Enter to join
[usernameInput, roomInput].forEach(inputField => {
  inputField.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // prevent accidental form submit / reload
      joinRoom();
    }
  });
});


/* ---------------- Online users list ---------------- */
socket.on("users", (users) => {
  usersList.innerHTML = "";
  users.forEach(({ username, avatar }) => {
    const li = document.createElement("li");
    const img = document.createElement("img");
    img.src = avatar;
    img.classList.add("user-avatar");
    li.appendChild(img);
    li.append(username);
    usersList.appendChild(li);
  });
});

/* ---------------- Receive messages ---------------- */
socket.on("chat message", (msg) => {
  renderMessage(msg);
});

/* ---------------- Send message ---------------- */
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = input.value;
  if (msg.trim()) {
    socket.emit("chat message", { room, msg });
    input.value = "";
    socket.emit("stop typing", { room, username });
  }
});

/* ---------------- Typing indicator ---------------- */
input.addEventListener("input", () => {
  socket.emit("typing", { room, username });
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit("stop typing", { room, username });
  }, 2000);
});

socket.on("typing", (user) => {
  if (user !== username) typingDiv.textContent = `${user} is typing...`;
});

socket.on("stop typing", (user) => {
  if (user !== username) typingDiv.textContent = "";
});

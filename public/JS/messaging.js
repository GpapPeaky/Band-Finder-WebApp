let messageHistory = [];

// No

let userType = window.localStorage.getItem("userType");
let user = JSON.parse(window.localStorage.getItem("currentUser"));

let username = user.username;
let password = user.password;

let bandName = window.localStorage.getItem("bn");

const input = document.getElementById("WESEND");

input.addEventListener("keypress", function(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMsg();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  fetchMessages();
});

async function fetchMessages() {
    const params = new URLSearchParams(window.location.search);
    const event_id = params.get('i');

    const res = await fetch("general/messageHistory", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      sender_type: userType,
      username: username,
      password,
      event_id
    })
  });

  const data = await res.json();

  messageHistory = data.messages || [];
  renderMessages();
}

function renderMessages() {
  const list = document.getElementById("messageHistoryList");
  const err = document.getElementById("msgErr");

  list.innerHTML = "";
  err.textContent = "";

  if (!messageHistory || messageHistory.length === 0) {
    err.textContent = "No messages yet.";
    return;
  }

  // Sort all messages by message_id ascending (oldest first)
  messageHistory.sort((a, b) => a.message_id - b.message_id);

  messageHistory.forEach(msg => {
    const li = document.createElement("div");
    li.classList.add("messageBox");

    const name = document.createElement("p");
    name.textContent = msg.sender === userType ? username : bandName;
    li.appendChild(name);

    const messageText = document.createElement("span");
    messageText.textContent = msg.message || msg.text || "[empty message]";
    li.appendChild(messageText);

    li.classList.add(msg.sender === userType ? "ownMessage" : "otherMessage");

    list.appendChild(li);
  });

  list.scrollTop = list.scrollHeight;
}


async function sendMsg() {
  const text = input.value.trim();
  if (!text) return;

  const params = new URLSearchParams(window.location.search);
  const event_id = params.get("i");
  if (!event_id) return console.error("No event ID in URL");

  try {
    const res = await fetch("general/sendMessage", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender_type: userType,
        username,
        password,
        message: text,
        event_id,
      }),
    });

    const data = await res.json();

    if (!data.success) {
      console.error("Message failed:", data.message || data.error);
      const err = document.getElementById("msgErr");
      if (err) err.textContent = data.message || data.error;
      return;
    }

    const list = document.getElementById("messageHistoryList");

    const li = document.createElement("div");
    li.classList.add("messageBox", "ownMessage");

    const name = document.createElement("p");
    name.textContent = username;
    li.appendChild(name);

    const messageText = document.createElement("span");
    messageText.textContent = text;
    li.appendChild(messageText);

    list.appendChild(li);
    list.scrollTop = list.scrollHeight;

    input.value = "";
  } catch (err) {
    console.error("Send message error:", err);
  }
}
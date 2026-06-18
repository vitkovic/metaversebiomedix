(function () {
  const socket = window.socket;

  if (!socket) {
    console.error("Chat error: window.socket does not exist.");
    return;
  }

  const chatBox = document.createElement("div");
  chatBox.id = "chatBox";

  chatBox.innerHTML = `
    <div id="chatTitle">Lobby chat</div>
    <div id="chatMessages"></div>

    <div id="chatInputRow">
      <input id="chatInput" type="text" placeholder="Message..." />
      <button id="chatSendBtn">Send</button>
    </div>
  `;

  document.body.appendChild(chatBox);

  const chatInput = document.getElementById("chatInput");
  const chatSendBtn = document.getElementById("chatSendBtn");
  const chatMessages = document.getElementById("chatMessages");

  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function addChatLine(data) {
    const div = document.createElement("div");

    div.innerHTML =
      `<span style="color:${data.color}; font-weight:bold;">${escapeHtml(data.user)}</span>: ${escapeHtml(data.message)}`;

    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function sendChat() {
    const msg = chatInput.value.trim();
    if (!msg) return;

    socket.emit("chatMessage", msg);

    chatInput.value = "";
    chatInput.focus();
  }

  chatSendBtn.onclick = sendChat;

  chatInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      sendChat();
    }
  });

  socket.on("chatHistory", history => {
    chatMessages.innerHTML = "";

    history.forEach(msg => {
      addChatLine(msg);
    });
  });

  socket.on("chatMessage", data => {
    addChatLine(data);
  });
})();
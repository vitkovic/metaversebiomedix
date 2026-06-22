(function () {

  const socket = window.socket;

  if (!socket) {
    console.error("avatars.js: window.socket not found");
    return;
  }

  const roomName = window.roomName || "lobby";

  function clearAvatars() {
    document.querySelectorAll("[id^='avatar-']").forEach(el => {
      el.remove();
    });
  }

  function createAvatar(id, user) {

    if (id === socket.id) return;

    if (document.getElementById("avatar-" + id)) return;

    const avatar = document.createElement("a-entity");

    avatar.setAttribute("id", "avatar-" + id);
    avatar.setAttribute("position", `${user.x} 0 ${user.z}`);
    avatar.setAttribute("rotation", `0 ${user.ry} 0`);

    avatar.innerHTML = `
      <a-cylinder
        position="0 0.8 0"
        radius="0.28"
        height="1.2"
        color="${user.color}">
      </a-cylinder>

      <a-sphere
        position="0 1.55 0"
        radius="0.32"
        color="#facc15">
      </a-sphere>

      <a-cylinder
        position="-0.38 0.85 0"
        radius="0.08"
        height="0.8"
        rotation="0 0 20"
        color="${user.color}">
      </a-cylinder>

      <a-cylinder
        position="0.38 0.85 0"
        radius="0.08"
        height="0.8"
        rotation="0 0 -20"
        color="${user.color}">
      </a-cylinder>

      <a-text
        value="${user.name}"
        align="center"
        position="0 2.15 0"
        color="white"
        width="3">
      </a-text>
    `;

    document.querySelector("a-scene").appendChild(avatar);
  }

  socket.emit("joinRoom", roomName);

  socket.on("current-users", users => {

    clearAvatars();

    Object.keys(users).forEach(id => {

      if (id === socket.id) return;

      createAvatar(id, users[id]);

    });
  });

  socket.on("user-connected", user => {

    if (user.id === socket.id) return;

    createAvatar(user.id, user);

  });

  socket.on("playerMoved", user => {

    if (user.id === socket.id) return;

    let avatar = document.getElementById("avatar-" + user.id);

    if (!avatar) {

      createAvatar(user.id, user);

      avatar = document.getElementById("avatar-" + user.id);

      if (!avatar) return;
    }

    avatar.setAttribute(
      "position",
      `${user.x} 0 ${user.z}`
    );

    avatar.setAttribute(
      "rotation",
      `0 ${user.ry} 0`
    );
  });

  socket.on("user-disconnected", id => {

    const avatar =
      document.getElementById("avatar-" + id);

    if (avatar) {
      avatar.remove();
    }
  });

  setInterval(() => {

    const player =
      document.getElementById("player");

    if (!player) return;

    const pos = player.object3D.position;
    const rot = player.object3D.rotation;

    socket.emit("playerMove", {
      x: pos.x,
      y: pos.y,
      z: pos.z,
      ry: THREE.MathUtils.radToDeg(rot.y)
    });

  }, 100);

})();
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

const penColor = document.getElementById("penColor");
const penSize = document.getElementById("penSize");
const clearBoard = document.getElementById("clearBoard");
const textModeBtn = document.getElementById("textModeBtn");
const customCrosshair = document.getElementById("customCrosshair");
const player = document.getElementById("player");


const imageBtn =
  document.getElementById("imageBtn");

const imageFile =
  document.getElementById("imageFile");
  
const textInputBox = document.getElementById("textInputBox");

const socket = window.socket;

let drawing = false;
let lastPoint = null;
let boardHover = false;
let textMode = false;

ctx.fillStyle = "white";
ctx.fillRect(0, 0, canvas.width, canvas.height);

function disableLookControls() {
  player.removeAttribute("look-controls");
}

function enableLookControls() {
  if (!player.hasAttribute("look-controls")) {
    player.setAttribute("look-controls", "");
  }
}

function showCrosshair(e) {
  customCrosshair.style.display = "block";
  customCrosshair.style.left = (e.clientX - 9) + "px";
  customCrosshair.style.top = (e.clientY - 9) + "px";
}

function hideCrosshair() {
  customCrosshair.style.display = "none";
}

function drawImage(data) {

  const img = new Image();

  img.onload = () => {

    ctx.drawImage(
      img,
      data.x,
      data.y,
      data.width,
      data.height
    );

    updateBoardTexture();

  };

  img.src = data.image;
}


function updateBoardTexture() {
  const board = document.getElementById("whiteboard3d");
  const mesh = board.getObject3D("mesh");

  if (mesh && mesh.material && mesh.material.map) {
    mesh.material.map.needsUpdate = true;
  }
}

function drawLine(line) {
  ctx.beginPath();
  ctx.moveTo(line.x1, line.y1);
  ctx.lineTo(line.x2, line.y2);
  ctx.strokeStyle = line.color || "#000000";
  ctx.lineWidth = Number(line.size) || 4;
  ctx.lineCap = "round";
  ctx.stroke();

  updateBoardTexture();
}

function drawText(data) {
  ctx.font = (Number(data.size) || 28) + "px Arial";
  ctx.fillStyle = data.color || "#000000";
  ctx.fillText(data.text, data.x, data.y);

  updateBoardTexture();
}

function getBoardPoint(event) {
  const scene = document.querySelector("a-scene");
  const camera = scene.camera;
  const renderer = scene.renderer;
  const board = document.getElementById("whiteboard3d");
  const boardMesh = board.getObject3D("mesh");

  if (!camera || !renderer || !boardMesh) return null;

  const rect = renderer.domElement.getBoundingClientRect();

  const mouse = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObject(boardMesh);

  if (intersects.length === 0) return null;

  const uv = intersects[0].uv;

  return {
    x: uv.x * canvas.width,
    y: (1 - uv.y) * canvas.height
  };
}

function stopDrawing(e, sceneCanvas) {
  drawing = false;
  lastPoint = null;
  enableLookControls();

  if (e) {
    const point = getBoardPoint(e);

    if (point) {
      boardHover = true;
      sceneCanvas.style.cursor = "none";
      showCrosshair(e);
    } else {
      boardHover = false;
      sceneCanvas.style.cursor = "default";
      hideCrosshair();
    }
  } else {
    boardHover = false;
    sceneCanvas.style.cursor = "default";
    hideCrosshair();
  }
}

textModeBtn.onclick = () => {
  textMode = !textMode;
  textModeBtn.style.background = textMode ? "#22c55e" : "";
  textModeBtn.style.color = textMode ? "white" : "";
};


imageBtn.onclick = () => {
  imageFile.click();
};

imageFile.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const img = new Image();
  const reader = new FileReader();

  reader.onload = () => {
    img.onload = () => {
      const maxWidth = 700;
      const scale = maxWidth / img.width;

      const w = maxWidth;
      const h = img.height * scale;

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = w;
      tempCanvas.height = h;

      const tempCtx = tempCanvas.getContext("2d");
      tempCtx.drawImage(img, 0, 0, w, h);

      const compressedImage =
        tempCanvas.toDataURL("image/jpeg", 0.75);

      const imageData = {
        type: "image",
        image: compressedImage,
        x: 150,
        y: 100,
        width: w,
        height: h
      };

      drawImage(imageData);
      socket.emit("whiteboardImage", imageData);
    };

    img.src = reader.result;
  };

  reader.readAsDataURL(file);

  imageFile.value = "";
});

document.querySelector("a-scene").addEventListener("loaded", () => {
  updateBoardTexture();

  const sceneCanvas = document.querySelector("a-scene").renderer.domElement;

  sceneCanvas.addEventListener("mousedown", e => {
    const point = getBoardPoint(e);
    if (!point) return;

    if (textMode) {
      disableLookControls();
      sceneCanvas.style.cursor = "default";
      hideCrosshair();

      const text = prompt("Enter text:");

      if (text && text.trim()) {
        const textData = {
          type: "text",
          text: text.trim().substring(0, 120),
          x: point.x,
          y: point.y,
          color: penColor.value,
          size: 28
        };

        drawText(textData);
        socket.emit("whiteboardText", textData);
      }

      enableLookControls();
      return;
    }

    drawing = true;
    lastPoint = point;

    disableLookControls();

    boardHover = true;
    sceneCanvas.style.cursor = "none";
    showCrosshair(e);
  });

  sceneCanvas.addEventListener("mousemove", e => {
    const point = getBoardPoint(e);

    if (point) {
      boardHover = true;
      sceneCanvas.style.cursor = "none";
      showCrosshair(e);
    } else {
      boardHover = false;

      if (!drawing) {
        sceneCanvas.style.cursor = "default";
        hideCrosshair();
      }
    }

    if (!drawing) return;
    if (!point || !lastPoint) return;

    const line = {
      type: "line",
      x1: lastPoint.x,
      y1: lastPoint.y,
      x2: point.x,
      y2: point.y,
      color: penColor.value,
      size: Number(penSize.value)
    };

    drawLine(line);
    socket.emit("whiteboardDraw", line);

    lastPoint = point;
  });

  window.addEventListener("mouseup", e => {
    if (!drawing) return;
    stopDrawing(e, sceneCanvas);
  });

  sceneCanvas.addEventListener("mouseleave", () => {
    stopDrawing(null, sceneCanvas);
  });
});

clearBoard.onclick = () => {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  updateBoardTexture();

  socket.emit("whiteboardClear");
};

socket.on("whiteboardHistory", history => {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  history.forEach(item => {

    if (item.type === "text") {
      drawText(item);
    }
    else if (item.type === "image") {
      drawImage(item);
    }
    else {
      drawLine(item);
    }

  });

  updateBoardTexture();
});

socket.on("whiteboardDraw", line => {
  drawLine(line);
});

socket.on("whiteboardText", data => {
  drawText(data);
});

socket.on("whiteboardImage", data => {
  drawImage(data);
});

socket.on("whiteboardClear", () => {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  updateBoardTexture();
});
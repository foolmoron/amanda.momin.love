// util
function debounce(func, time, context) {
    let timeoutId
    return function() {
        clearTimeout(timeoutId)
        const args = arguments
        timeoutId = setTimeout(function() { func.apply(context, args) }, time)
    }
}
function doEachAnimationFrame(func, context) {
    const wrappedFunc = () => {
        func.call(context)
        requestAnimationFrame(wrappedFunc)
    }
    requestAnimationFrame(wrappedFunc)
}
function lerp(a, b, t) {
    return a + t * (b - a)
}
function ilerp(x, a, b) {
    return (x - a) / (b - a)
}

// catch all errors
window.onerror = function(...args) {
    alert(`There was an error! Send a screenshot of this info to Momin or Amanda!\n\n` + JSON.stringify(args))
}
window.addEventListener('unhandledrejection', function(e) {
    alert(`There was an error! Send a screenshot of this info to Momin or Amanda!\n\n` + e.reason)
});

// config
const BASE_URL = "https://loves.fool.games";
const IMGUR_CLIENT_ID = "04d3c2bf3ea62ac";

// api calls
async function uploadPhoto(photoFile) {
  const form = new FormData();
  form.append("image", photoFile);
  form.append("album", "O5ELpmTrlNI41ft");
  const res = await fetch("https://api.imgur.com/3/image/", {
    method: "post",
    headers: {
      Authorization: "Client-ID " + IMGUR_CLIENT_ID,
    },
    body: form,
  }).then((res) => res.json());
  if (res.status !== 200) {
    throw new Error(res.data.error);
  }
  return res.data;
}

async function getPhoto(id) {
  const res = await fetch("https://api.imgur.com/3/image/" + id, {
    headers: {
      Authorization: "Client-ID " + IMGUR_CLIENT_ID,
    },
  }).then((res) => res.json());
  if (res.status !== 200) {
    throw new Error(res.data.error);
  }
  return res.data;
}

// callout banner color anim
function doBannerAnim(title, letters) {
  title.borderToggle = !title.borderToggle;
  title.style.setProperty(
    "--wave-border-x",
    (title.borderToggle ? 29 : 30) + "px"
  );
  title.style.setProperty(
    "--wave-border-y",
    (title.borderToggle ? 4 : 355) + "px"
  );
  letters.forEach((letter) => {
    letter.style.transform = `translateX(${lerp(
      -1.5,
      1.5,
      Math.random()
    )}%) translateY(${lerp(-2.5, 2.5, Math.random())}%) rotate(${lerp(
      -9,
      9,
      Math.random()
    )}deg)`;
    letter.style.setProperty(
      "--color-angle",
      `${lerp(0, 360, Math.random())}deg`
    );
    letter.style.backgroundPosition = `${lerp(
      -100,
      100,
      Math.random()
    )}% ${lerp(-100, 100, Math.random())}%`;
  });
}
document.querySelectorAll(".callout").forEach((callout) => {
  const title = callout.querySelector(".title");
  const letters = callout.querySelectorAll(".title span");
  let intervalId = setInterval(() => doBannerAnim(title, letters), 450);
});

// hash
let HASH = "";
function updateHash() {
  HASH = location.hash.replace("#", "");
}
window.addEventListener("hashchange", updateHash, false);
updateHash();
if (HASH === "") {
  location.hash = '#draw'
}

// main
const canvas = new fabric.Canvas("canvas", {
  isDrawingMode: true,
});
canvas.freeDrawingBrush.decimate = 4; // reduce # of points
// canvas.freeDrawingBrush.limitedToCanvasSize = true
canvas.wrapperEl.classList.add("wave-border");
canvas.wrapperEl.style.setProperty("--wave-border-x", 3 + "px");
canvas.wrapperEl.style.setProperty("--wave-border-y", 104 + "px");

const staticCanvas = new fabric.StaticCanvas("static-canvas");
staticCanvas.lowerCanvasEl.classList.add("wave-border");
staticCanvas.lowerCanvasEl.style.setProperty("--wave-border-x", 3 + "px");
staticCanvas.lowerCanvasEl.style.setProperty("--wave-border-y", 104 + "px");

function loadFromJSON(json) {
  if (!json?.objects) {
    return;
  }
  staticCanvas.renderOnAddRemove = false;
  fabric.util.enlivenObjects(json.objects, (objs) => {
    objs.forEach((item) => {
      staticCanvas.add(item);
    });
    staticCanvas.renderAll();
    staticCanvas.renderOnAddRemove = true;
    historyStack.splice(0, historyStack.length);
  });
}

// resizing
let prevCanvasWidth = 0;
let prevCanvasHeight = 0;
doEachAnimationFrame(() => {
  if (
    canvas.wrapperEl.clientWidth != prevCanvasWidth ||
    canvas.wrapperEl.clientHeight != prevCanvasHeight
  ) {
    canvas.setWidth(canvas.wrapperEl.clientWidth);
    canvas.setHeight(canvas.wrapperEl.clientHeight);
    canvas.renderAll();
    staticCanvas.setWidth(canvas.wrapperEl.clientWidth);
    staticCanvas.setHeight(canvas.wrapperEl.clientHeight);
    staticCanvas.renderAll();
    prevCanvasWidth = canvas.wrapperEl.clientWidth;
    prevCanvasHeight = canvas.wrapperEl.clientHeight;
  }
});

// uploading
const buttonContainer = document.querySelector(".button-container");
const uploadInput = document.querySelector("#upload-input");
const photoImg = document.querySelector(".photo");

buttonContainer.dataset.state = !!localStorage.getItem("UPLOAD-id")
  ? "ready"
  : "init";

function onUploadChange(file) {
  if (file) {
    startDrawing(file);
  }
}

// name
const nameInput = document.querySelector('input[name="full-name"]');
nameInput.value = localStorage.getItem("DRAW-name") || "";
nameInput.addEventListener("input", (e) =>
  localStorage.setItem("DRAW-name", nameInput.value.toString())
);

// color controls
function setColor(colorPicker, colorButtons) {
  const currentIndex = colorButtons.indexOf(colorPicker);
  localStorage.setItem("DRAW-colorIndex", currentIndex);
  // unset old
  for (let button of colorButtons) {
    button.classList.remove("selected");
  }
  // set color
  colorPicker.classList.add("selected");
  const color = colorPicker.dataset.color;
  canvas.freeDrawingBrush.color = color;
  document.querySelector(".draw-panel").style.backgroundColor = color;
}

function setupColors(initialColorIndex) {
  const colorButtons = Array.from(document.querySelectorAll(".colors > div"));
  for (let button of colorButtons) {
    button.style.backgroundColor = button.dataset.color;
    button.onclick = function (e) {
      setColor(button, colorButtons);
    };
  }
  setColor(colorButtons[initialColorIndex || 8], colorButtons);
}
setupColors(parseInt(localStorage.getItem("DRAW-colorIndex") || 8));

// width controls
const widthButtons = Array.from(document.querySelectorAll(".width"));
function setWidth(widthButton) {
  localStorage.setItem("DRAW-widthIndex", widthButtons.indexOf(widthButton));
  for (let button of widthButtons) {
    button.classList.remove("selected");
  }
  widthButton.classList.add("selected");
  canvas.freeDrawingBrush.width = parseFloat(widthButton.dataset.size);
}
for (let button of widthButtons) {
  button.onclick = function (e) {
    setWidth(e.target);
  };
}
setWidth(widthButtons[parseInt(localStorage.getItem("DRAW-widthIndex") || 1)]);

// drawing history
const historyStack = [];
let justCleared = false;

// handle when new path is drawn
canvas.on("object:added", function (e) {
  historyStack.splice(0, historyStack.length);
  justCleared = false;
  // reset submitted state
  submitState = SUBMIT_STATE.NONE;

  // add only to static
  staticCanvas.add(e.target);
  canvas.remove(e.target);

  // save drawing
  localforage.setItem("DRAW-drawing", JSON.stringify(staticCanvas.toObject()));
});

// load drawing after page load
document.addEventListener("DOMContentLoaded", (e) => {
  localforage.getItem("DRAW-drawing", function (e, value) {
    value = value ?? localStorage.getItem("DRAW-drawing");
    loadFromJSON(JSON.parse(value));
  });
});

// drawing controls
const undoButton = document.querySelector(".undo");
const redoButton = document.querySelector(".redo");
const clearButton = document.querySelector(".clear");

undoButton.onclick = function (e) {
  if (justCleared) {
    while (historyStack.length) {
      staticCanvas.add(historyStack.pop());
    }
    justCleared = false;
  } else if (staticCanvas._objects.length) {
    const latestItem = staticCanvas._objects[staticCanvas._objects.length - 1];
    historyStack.push(latestItem);
    staticCanvas.remove(latestItem);
  }
};
redoButton.onclick = function (e) {
  if (justCleared) {
    while (historyStack.length) {
      staticCanvas.add(historyStack.pop());
    }
    justCleared = false;
  } else if (historyStack.length) {
    staticCanvas.add(historyStack.pop());
  }
};
clearButton.onclick = function (e) {
  if (staticCanvas._objects.length) {
    while (staticCanvas._objects.length) {
      const latestItem =
        staticCanvas._objects[staticCanvas._objects.length - 1];
      historyStack.push(latestItem);
      staticCanvas.remove(latestItem);
    }
    justCleared = true;
    // flash canvas red
    const canvasContainer = document.querySelector(".canvas-container");
    const prevTransition = canvasContainer.style.transition;
    const prevColor = canvasContainer.style.backgroundColor;
    canvasContainer.style.transition = "none";
    canvasContainer.style.backgroundColor = "#ff5151";
    setTimeout(() => {
      canvasContainer.style.transition = prevTransition;
      canvasContainer.style.backgroundColor = prevColor;
    }, 0);
  } else {
    DEBUG_triggerLoadFromServer();
  }
};

doEachAnimationFrame(() => {
  undoButton.classList.toggle(
    "disabled",
    !justCleared && staticCanvas._objects.length == 0 && canvas.isDrawingMode
  );
  redoButton.classList.toggle(
    "disabled",
    !justCleared && !historyStack.length && canvas.isDrawingMode
  );
  clearButton.classList.toggle(
    "disabled",
    staticCanvas._objects.length == 0 && canvas.isDrawingMode
  );
});

// drawing submit
const SUBMIT_STATE = {
  NONE: "NONE",
  INPROGRESS: "INPROGRESS",
  FAILED: "FAILED",
  DONE: "DONE",
};
let submitState = SUBMIT_STATE.NONE;
async function submitDrawing() {
  if (buttonContainer.dataset.state !== "ready") {
    alert("Start a drawing before submitting!");
    return;
  }

  const id = localStorage.getItem("UPLOAD-id")
  submitState = SUBMIT_STATE.INPROGRESS;
  // calculate and cache bounds
  const group = new fabric.Group(staticCanvas.getObjects(), null, true);
  group._calcBounds();
  const bounds = {
    left: group.left,
    top: group.top,
    width: group.width,
    height: group.height,
  };
  // reset objects to center
  group.setPositionByOrigin({ x: 0, y: 0 });
  // get data and shift objects to top-left based on bounds
  const data = staticCanvas.toObject();
  data.objects.forEach(function (obj) {
    obj.left = obj.left - bounds.left;
    obj.top = obj.top - bounds.top;
  });
  // post data and dimensions
  return fetch(BASE_URL + "/drawing", {
    method: "post",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({
      name: nameInput.value || "",
      drawingId: id,
      json: data,
      dimensions: {
        width: Math.ceil(bounds.width),
        height: Math.ceil(bounds.height),
      },
    }),
  })
    .then((res) => {
      if (res.ok) {
        submitState = SUBMIT_STATE.DONE;
        alert((id.length > 10 ? 'Drawing' : 'Photo') + ' uploaded! Check it out on the TV near the DJ booth!')
        const name = nameInput.value.toString()
        localStorage.clear();
        localStorage.setItem("DRAW-name", name)
        localforage.clear();
        window.location.reload();
      } else {
        throw res.statusText;
      }
    })
    .catch((err) => {
      submitState = SUBMIT_STATE.FAILED;
    });
}

// submit buttons and drawing ability based on submit state
const submitButtons = {
  [SUBMIT_STATE.NONE]: document.querySelector(".submit-none"),
  [SUBMIT_STATE.INPROGRESS]: document.querySelector(".submit-inprogress"),
  [SUBMIT_STATE.FAILED]: document.querySelector(".submit-failed"),
  [SUBMIT_STATE.DONE]: document.querySelector(".submit-done"),
};
const submitButtonsAll = Object.values(submitButtons);
doEachAnimationFrame(() => {
  const activeButton = submitButtons[submitState];
  activeButton.style.display = null;
  submitButtonsAll
    .filter((b) => b !== activeButton)
    .forEach((b) => (b.style.display = "none"));
  canvas.wrapperEl.classList.toggle(
    "disable-draw",
    submitState === SUBMIT_STATE.INPROGRESS
  );
});

function tryStartDrawing(withPhoto) {
  if (!nameInput.value) {
    alert("Please enter your name first!");
    return;
  }
  if (withPhoto) {
    uploadInput.click();
  } else {
    startDrawing();
  }
}

async function startDrawing(file) {
  buttonContainer.dataset.state = "uploading";
  if (file) {
    try {
      const photo = await uploadPhoto(file);
      localStorage.setItem("UPLOAD-id", photo.id);
      localStorage.setItem("UPLOAD-link", photo.link);
      buttonContainer.dataset.state = "ready";
      await submitDrawing()
      return
    } catch (e) {
      buttonContainer.dataset.state = "init";
      uploadInput.value = "";
      alert(e.message);
      return;
    }
  } else {
    localStorage.setItem("UPLOAD-id", uuidv4());
  }
  buttonContainer.dataset.state = "ready";
}

// utility to replace current drawing with JSON from server
let DEBUG_loadFromServerCounter = 0;
const DEBUG_resetLoadFromServerCounter = debounce(() => {
  DEBUG_loadFromServerCounter = 0;
}, 600);
function DEBUG_triggerLoadFromServer() {
  DEBUG_loadFromServerCounter++;
  if (DEBUG_loadFromServerCounter > 5) {
    DEBUG_loadFromServer(
      prompt("Paste the code that you were given to load your drawing", "")
    );
    DEBUG_loadFromServerCounter = 0;
  }
  DEBUG_resetLoadFromServerCounter();
}
function DEBUG_loadFromServer(id) {
  if (!id || !id.toString()) {
    return;
  }
  fetch(BASE_URL + "/drawing/" + id)
    .then((res) => res.json())
    .then((json) => {
      clearButton.dispatchEvent(new Event("click"));
      loadFromJSON(json);
    });
}

// viewing
const templateGalleryImage = document.querySelector("template#tpl-gallery-image");
const viewContainer = document.querySelector('.view-container')

let viewInited = false;
async function initView() {
  if (HASH !== "view" || viewInited) {
    return;
  }
  // misc init
  document.querySelector("iframe").style.display = "none";

  // download drawings
  const drawings = (await fetch(BASE_URL + "/drawing").then((res) => res.json())).drawings;
  // add drawings as gallery images
  const records = await Promise.all(drawings.map(d => initDrawing(d.filename).then(im => ({
    filename: d.filename,
    time: d.time,
    name: d.filename.split('--')[0].replace(/_/g, ' '),
    id: d.filename.split('.')[0].split('+++')[1],
    link: im.querySelector('img').src,
  }))))
  for (const r of records) {
    gallery[r.filename] = r
  }

  viewInited = true;
}

const drawingCache = {}
async function initDrawing(drawingKey) {
  if (drawingCache[drawingKey]) {
    return drawingCache[drawingKey].cloneNode(true)
  }

  const newImage = templateGalleryImage.content.firstElementChild.cloneNode(true)
  viewContainer.appendChild(newImage)
  const id = drawingKey.split('.')[0].split('+++')[1]
  newImage.dataset.key = drawingKey
  newImage.dataset.id = id

  // load image
  const image = newImage.querySelector('.drawing')
  image.style.display = null
  const loaded = new Promise((resolve, reject) => {
    image.addEventListener('load', resolve)
    image.addEventListener('error', reject);
  })
  if (id.length > 10 || id.length <= 3) {
    image.src = `${BASE_URL}/image/${drawingKey}`
  } else {
    image.src = (await getPhoto(id)).link
  }

  // wait for image dimensions and apply aspect ratio
  try {
    await loaded
  } catch {
    newImage.remove()
    return
  }
  const aspectRatio = image.width / image.height
  if (aspectRatio > 1) {
    image.style.width = Math.min(500, image.width) + 'px'
    image.style.height = Math.min(500, image.width / aspectRatio) + 'px'
  } else {
    image.style.width = Math.min(500, image.height * aspectRatio) + 'px'
    image.style.height = Math.min(500, image.height) + 'px'
  }

  newImage.querySelector('label').textContent = drawingKey.split('--')[0].replace(/_/g, ' ')
  drawingCache[drawingKey] = newImage

  return newImage.cloneNode(true)
}

const gallery = {}
const newlyAdded = {}

async function loopView() {
  if (HASH !== "view") {
    setTimeout(loopView, 2 * 1000)
    return
  }
  await initView()

  // get all drawings
  const all = await fetch(BASE_URL + "/drawing").then((res) => res.json())
  const keys = all.drawings.map(d => d.filename)
  const newItems = keys.filter((key) => !gallery[key] && !newlyAdded[key])
  // if new drawing
  for (const k of newItems) {
    // remove from gallery
    delete gallery[k]
    newlyAdded[k] = true
    // create new popup, then add to gallery
    popupImage(k).then((link) => {
      delete newlyAdded[k]
      const draw = all.drawings.find(d => d.filename === k)
      gallery[draw.filename] = {
        filename: draw.filename,
        time: draw.time,
        name: draw.filename.split('--')[0].replace(/_/g, ' '),
        id: draw.filename.split('.')[0].split('+++')[1],
        link: link,
      }
    })
  }
  setTimeout(loopView, 2 * 1000)
}
void loopView()

async function popupImage(drawingKey) {
  const newImage = await initDrawing(drawingKey)
  viewContainer.appendChild(newImage)
  newImage.style.zIndex = 100
  newImage.style.setProperty("--r", ((Math.random() - 0.5) * 0.08) + 'turn');
  newImage.style.setProperty("--x", ((Math.random() - 0.5) * 75) + 'vw');
  newImage.style.setProperty("--y", ((Math.random()) * 37 + 12) + 'vh');
  await new Promise((resolve) => setTimeout(resolve, 100))
  newImage.classList.add('pop-in')
  await new Promise((resolve) => setTimeout(resolve, 90 * 1000))
  newImage.classList.remove('pop-in')
  newImage.classList.add('pop-out')
  await new Promise((resolve) => setTimeout(resolve, 5 * 1000))
  newImage.remove()
  return newImage.querySelector('img').src
}

const inUse = {}
async function newImageScroll() {
  // pick randomly based on age
  const sortedKeys = Object.keys(gallery).sort((a, b) => gallery[b].time - gallery[a].time)
  const r = Math.pow(Math.random(), 1.6) // scaled random to bias towards newest images
  let i = Math.floor(r * sortedKeys.length)
  while (inUse[sortedKeys[i]]) {
    i++
  }
  const drawingKey = sortedKeys[i]
  if (!drawingKey) {
    return
  }
  // init
  const newImage = await initDrawing(drawingKey)
  viewContainer.appendChild(newImage)
  newImage.classList.add('scrolling')
  const img = newImage.querySelector('img')
  img.style.width = parseFloat(img.style.width) * 0.7 + 'px'
  img.style.height = parseFloat(img.style.height) * 0.7 + 'px'
  inUse[drawingKey] = true
  // set animation params
  const t = ((Math.random()) * 45 + 45)
  newImage.style.setProperty("--y", ((Math.random()) * 49 + 9) + 'vh');
  newImage.style.setProperty("--t", t + 's');
  // play
  await new Promise((resolve) => setTimeout(resolve, 100))
  newImage.classList.add('animate')
  // die after animation is done
  await new Promise((resolve) => setTimeout(resolve, (t + 1) * 1000))
  newImage.remove()
  inUse[drawingKey] = false
}

let tView = performance.now()
let tNewItem = 0
function updateView() {
  const tNew = performance.now()
  const dt = (tNew - tView) / 1000
  tView = tNew

  // spawn gallery items
  tNewItem -= dt
  if (tNewItem <= 0) {
    tNewItem = Math.random() * 3 + 6
    void newImageScroll()
  }

  requestAnimationFrame(updateView);
}
updateView()
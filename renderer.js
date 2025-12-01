let pdfFiles = [];
let pdfDoc = null;
let scrolling = false;
let pausedByUser = false;

const viewer = document.getElementById("viewerContainer");
const speedSlider = document.getElementById("speed");
const speedValue = document.getElementById("speedValue");
const statusLabel = document.getElementById("status");

// Base speed factor (pixels per second at slider=1)
// On mobile: scale up to 40 to make autoscroll more visible on small screens
const baseSpeed = window.innerWidth <= 800 ? 40 : 20;

// Auto-resume after this many ms of inactivity following manual scroll
const autoResumeMs = 3000;
let inactivityTimer = null;

// Initialize slider display
speedValue.textContent = parseFloat(speedSlider.value).toFixed(1);

// Update displayed slider value
speedSlider.oninput = () => {
  speedValue.textContent = parseFloat(speedSlider.value).toFixed(1);
};

// Folder picker
document.getElementById("pickFolder").onclick = async () => {
  const selected = await window.api.selectFolder();
  // If the user cancelled the dialog, the main process returns null — keep existing selection
  if (selected === null) return;

  // Otherwise update the file list (may be empty if folder has no PDFs)
  if (!Array.isArray(selected)) return;
  pdfFiles = selected;
  populateFileList(pdfFiles);

  if (pdfFiles.length > 0) openPDF(pdfFiles[0]);
};

// Populate sidebar
function populateFileList(files) {
  const list = document.getElementById("fileList");
  list.innerHTML = "";

  files.forEach((file) => {
    const li = document.createElement("li");
    li.textContent = file.split("/").pop();
    li.dataset.path = file;
    li.tabIndex = 0;
    li.className =
      "cursor-pointer px-2 py-1 my-1 rounded-lg hover:bg-sidebarHover dark:hover:bg-sidebarHoverDark transition";
    li.onclick = () => {
      openPDF(file);
      setActiveListItem(file);
    };
    list.appendChild(li);
  });

  fileList.addEventListener("keydown", (e) => {
    const active = document.activeElement;
    if (!active || active.tagName !== "LI") return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (active.nextElementSibling) active.nextElementSibling.focus();
        break;
      case "ArrowUp":
        e.preventDefault();
        if (active.previousElementSibling)
          active.previousElementSibling.focus();
        break;
      case "Enter":
        e.preventDefault();
        active.click();
        break;
    }
  });
}

// Update active list item to use Tailwind

function setActiveListItem(path) {
  document.querySelectorAll("#fileList li").forEach((li) => {
    if (li.dataset.path === path) {
      li.classList.add("bg-primary", "text-white");
      li.classList.add("hover:text-black", "dark:hover:text-white");
    } else {
      li.classList.remove("bg-primary", "text-white");
      li.classList.remove("hover:text-black", "dark:hover:text-white");
    }
  });
}

// Open PDF (all pages)
async function openPDF(path) {
  pdfDoc = await pdfjsLib.getDocument(path).promise;
  viewer.innerHTML = "";

  // update UI state
  updateStatus("Ready");
  pausedByUser = false;

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    // Use smaller scale on mobile for better fit, but not too small
    const scale = window.innerWidth <= 800 ? 1.2 : 1.5;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.display = "block";
    canvas.style.margin = "20px auto";

    viewer.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    await page.render({ canvasContext: ctx, viewport }).promise;
  }

  viewer.scrollTop = 0;
  setActiveListItem(path);

  // Force layout reflow to ensure dimensions are calculated
  void viewer.offsetHeight;

  // Debug: log viewport dimensions to help diagnose scroll issues
  const canvases = viewer.querySelectorAll("canvas");
  let totalContentHeight = 0;
  canvases.forEach((c) => {
    totalContentHeight += c.offsetHeight + 40; // 40px for margins (20px top + 20px bottom)
  });

  const scrollable = totalContentHeight > viewer.clientHeight;
  console.log(
    `PDF loaded on ${
      window.innerWidth <= 800 ? "mobile" : "desktop"
    }: totalContentHeight=${totalContentHeight}, clientHeight=${
      viewer.clientHeight
    }, scrollable=${scrollable}, canvases=${canvases.length}, innerWidth=${
      window.innerWidth
    }`
  );

  if (!scrollable) {
    console.warn(
      "WARNING: Content may not be scrollable! totalContentHeight=" +
        totalContentHeight +
        ", clientHeight=" +
        viewer.clientHeight
    );
  }
}

// Smooth scrolling with time-based delta
let lastTime = null;
// Accumulator for fractional pixel movement to support very low speeds
let scrollAccumulator = 0;
// Small smoothing for delta to avoid jitter on some systems
let lastDelta = 0.016;
let scrollDebugLogged = false; // Log first scroll attempt only
function smoothScrollLoop(timestamp) {
  if (!scrolling) return;

  if (!lastTime) {
    lastTime = timestamp;
    // Log first frame
    if (!scrollDebugLogged) {
      console.log("Autoscroll started. Viewer:", {
        scrollHeight: viewer.scrollHeight,
        clientHeight: viewer.clientHeight,
        scrollTop: viewer.scrollTop,
      });
      scrollDebugLogged = true;
    }
  }
  const rawDelta = (timestamp - lastTime) / 1000; // seconds elapsed
  lastTime = timestamp;
  // EMA on delta to smooth out spikes (alpha small)
  const alpha = 0.08;
  lastDelta = alpha * rawDelta + (1 - alpha) * lastDelta;
  const delta = lastDelta;

  // Map slider to speed linearly (allow low slider values but use fractional accumulation)
  const rawVal = parseFloat(speedSlider.value);
  const sliderVal = Math.max(rawVal, 0.1); // protect against zero
  const speed = baseSpeed * sliderVal; // pixels per second

  // Accumulate fractional movement so very small speeds still eventually scroll
  scrollAccumulator += speed * delta;
  const intMove = Math.floor(scrollAccumulator);
  if (intMove > 0) {
    viewer.scrollTop += intMove;
    scrollAccumulator -= intMove;
  }

  // Stop when end reached - use maxScroll approach
  const maxScroll = viewer.scrollHeight - viewer.clientHeight;
  const isAtEnd = viewer.scrollTop >= maxScroll - 1;

  if (isAtEnd) {
    scrolling = false;
    // Clear any manual-pause state and cancel auto-resume so we don't
    // accidentally restart after finishing naturally.
    pausedByUser = false;
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
      inactivityTimer = null;
    }
    updateStatus("Finished");
    // Ensure the UI reflects that scrolling stopped by switching the
    // play/pause control back to the Play state.
    updatePlayButton(false);
    return;
  }

  requestAnimationFrame(smoothScrollLoop);
}

// Play/Pause button (combined Start/Stop)
const playPauseBtn = document.getElementById("playPause");
function updatePlayButton(isPlaying) {
  if (!playPauseBtn) return;
  playPauseBtn.setAttribute("aria-pressed", String(Boolean(isPlaying)));
  if (isPlaying) {
    playPauseBtn.classList.add("primary");
    playPauseBtn.innerHTML = `<i class="fa fa-pause"></i> Pause`;
    playPauseBtn.setAttribute("aria-label", "Pause");
  } else {
    playPauseBtn.classList.remove("primary");
    playPauseBtn.innerHTML = `<i class="fa fa-play"></i> Play`;
    playPauseBtn.setAttribute("aria-label", "Play");
  }
}

function startScrolling() {
  // Determine whether the viewer can scroll at all
  const maxScroll = viewer.scrollHeight - viewer.clientHeight;
  if (maxScroll <= 0) {
    updateStatus("PDF is not scrollable");
    console.warn("Cannot start autoscroll: viewer cannot scroll");
    return;
  }

  // If the viewer is already at the end, rewind to the top when user presses Play
  const atEnd = viewer.scrollTop >= maxScroll - 1;
  if (atEnd) {
    viewer.scrollTop = 0;
  }

  if (!scrolling) {
    scrolling = true;
    pausedByUser = false;
    lastTime = null;
    scrollAccumulator = 0; // Reset accumulator to avoid rounding errors
    scrollDebugLogged = false; // Reset debug flag
    updateStatus("Playing");
    updatePlayButton(true);
    console.log("Starting autoscroll...");
    requestAnimationFrame(smoothScrollLoop);
  }
}

function stopScrolling() {
  scrolling = false;
  pausedByUser = false;
  updateStatus("Paused");
  updatePlayButton(false);
}

function togglePlayPause() {
  if (scrolling) stopScrolling();
  else startScrolling();
}

if (playPauseBtn) {
  playPauseBtn.addEventListener("click", (e) => {
    e.preventDefault();
    togglePlayPause();
  });
  // Initialize button state
  updatePlayButton(false);
} else {
  console.warn("Play/Pause button not found!");
}

document.addEventListener("keydown", (e) => {
  const active = document.activeElement;
  const isTextarea = active && active.tagName === "TEXTAREA";
  const isTextInput =
    active &&
    active.tagName === "INPUT" &&
    ["text", "search", "email", "password", "tel", "url", "number"].includes(
      (active.type || "").toLowerCase()
    );
  const isEditable = active && active.isContentEditable;

  if (isTextarea || isTextInput || isEditable) return;

  switch (e.key) {
    case " ":
    case "Spacebar":
      e.preventDefault();
      togglePlayPause();
      break;

    case "ArrowLeft":
      e.preventDefault();
      adjustSpeed(-0.1); // decrease speed
      break;

    case "ArrowRight":
      e.preventDefault();
      adjustSpeed(0.1); // increase speed
      break;
  }
});

function adjustSpeed(delta) {
  let newVal = parseFloat(speedSlider.value) + delta;
  newVal = Math.min(
    Math.max(newVal, parseFloat(speedSlider.min)),
    parseFloat(speedSlider.max)
  );
  speedSlider.value = newVal.toFixed(1);
  speedValue.textContent = newVal.toFixed(1);
}

// Resume button handler
// (Resume button removed) — rely on auto-resume only

function updateStatus(text) {
  if (statusLabel) statusLabel.textContent = text;
}

// Manual scroll detection: pause autoscroll when user interacts
function onUserInteraction() {
  // If autoscroll active, pause and show resume control
  if (scrolling) {
    scrolling = false;
    pausedByUser = true;
    updateStatus("Paused — manual scroll");
  }

  // Reset inactivity timer for auto-resume
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    if (pausedByUser) {
      pausedByUser = false;
      scrolling = true;
      lastTime = null;
      updateStatus("Auto-resumed");
      requestAnimationFrame(smoothScrollLoop);
      setTimeout(() => updateStatus("Playing"), 700);
    }
  }, autoResumeMs);
}

// Listen for typical manual-scroll interactions on the viewer
viewer.addEventListener("wheel", onUserInteraction, { passive: true });
viewer.addEventListener("touchstart", onUserInteraction, { passive: true });
viewer.addEventListener("pointerdown", onUserInteraction, { passive: true });
viewer.addEventListener("keydown", onUserInteraction, { passive: true });

// Load last folder on startup
window.api.loadLastFolder().then((files) => {
  if (!files || files.length === 0) return;

  pdfFiles = files;
  populateFileList(pdfFiles);

  if (pdfFiles.length > 0) openPDF(pdfFiles[0]);
});

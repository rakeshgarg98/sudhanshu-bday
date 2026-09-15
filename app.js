/* =====================================================
   app.js — Gate Page Logic
   ===================================================== */

// ── Config ──────────────────────────────────────────
// Add more names/variants as needed (case-insensitive)
const VALID_NAMES = ["jaan", "jaan", "jaan123", "jaaan"];

// ── Elements ─────────────────────────────────────────
const nameInput = document.getElementById("nameInput");
const orbBtn = document.getElementById("orbBtn");
const accessLabel = document.getElementById("accessLabel");
const accessOverlay = document.getElementById("accessOverlay");
const errorText = document.getElementById("errorText");
const hintText = document.getElementById("hintText");
const starCanvas = document.getElementById("starCanvas");

// ── Starfield ─────────────────────────────────────────
(function initStars() {
  const ctx = starCanvas.getContext("2d");
  let stars = [];
  let W, H;

  function resize() {
    W = starCanvas.width = window.innerWidth;
    H = starCanvas.height = window.innerHeight;
    stars = Array.from({ length: 240 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      a: Math.random(),
      s: Math.random() * 0.008 + 0.002,
      color: ["#ffffff", "#aad4ff", "#ffd6ff", "#ffe4a0"][
        Math.floor(Math.random() * 4)
      ],
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // Deep space gradient background
    const grad = ctx.createRadialGradient(
      W / 2,
      H / 2,
      0,
      W / 2,
      H / 2,
      Math.max(W, H) * 0.8,
    );
    grad.addColorStop(0, "#0d0020");
    grad.addColorStop(0.5, "#04000d");
    grad.addColorStop(1, "#000008");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Nebula blobs
    const n1 = ctx.createRadialGradient(
      W * 0.2,
      H * 0.3,
      0,
      W * 0.2,
      H * 0.3,
      W * 0.3,
    );
    n1.addColorStop(0, "rgba(100,10,160,0.15)");
    n1.addColorStop(1, "transparent");
    ctx.fillStyle = n1;
    ctx.fillRect(0, 0, W, H);

    const n2 = ctx.createRadialGradient(
      W * 0.8,
      H * 0.6,
      0,
      W * 0.8,
      H * 0.6,
      W * 0.35,
    );
    n2.addColorStop(0, "rgba(10,60,150,0.12)");
    n2.addColorStop(1, "transparent");
    ctx.fillStyle = n2;
    ctx.fillRect(0, 0, W, H);

    // Stars
    stars.forEach((s) => {
      s.a += s.s;
      if (s.a > 1) s.s *= -1;
      if (s.a < 0) s.s *= -1;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = s.a;
      ctx.fill();
      ctx.globalAlpha = 1;
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  draw();
})();

// ── Floating Particles ────────────────────────────────
(function spawnParticles() {
  const container = document.getElementById("particles");
  const colors = ["#a855f7", "#ec4899", "#22d3ee", "#fbbf24", "#f0abfc"];
  for (let i = 0; i < 30; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const size = Math.random() * 6 + 2;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random() * 100}%;
      bottom:${Math.random() * 20}%;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      animation-duration:${6 + Math.random() * 10}s;
      animation-delay:${Math.random() * 8}s;
      filter:blur(${size > 5 ? 1 : 0}px);
    `;
    container.appendChild(p);
  }
})();

// ── Web Audio — Sound Effects ─────────────────────────
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function getAudio() {
  if (!audioCtx) audioCtx = new AudioCtx();
  return audioCtx;
}

function playTone(freq, type, duration, vol = 0.3, delay = 0) {
  const ctx = getAudio();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
  gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    ctx.currentTime + delay + duration,
  );
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

function playKeyClick() {
  playTone(600, "sine", 0.05, 0.08);
}

function playSuccess() {
  // Ascending chime
  const notes = [523, 659, 784, 1047];
  notes.forEach((f, i) => playTone(f, "sine", 0.4, 0.3, i * 0.1));
}

function playError() {
  playTone(200, "square", 0.25, 0.15);
}

// ── Name Validation ───────────────────────────────────
function isValidName(input) {
  return VALID_NAMES.includes(input.trim().toLowerCase());
}

function checkName() {
  const value = nameInput.value.trim();
  if (!value) {
    nameInput.classList.add("error");
    setTimeout(() => nameInput.classList.remove("error"), 500);
    playError();
    return;
  }

  if (isValidName(value)) {
    nameInput.classList.remove("error");
    nameInput.classList.add("success");
    errorText.classList.remove("show");
    accessLabel.textContent = "✅ Yes! Access Granted!";
    accessLabel.classList.add("granted");

    playSuccess();

    // Store name for celebrate page
    localStorage.setItem("birthdayName", value.trim());

    // Show overlay after short delay
    setTimeout(() => {
      accessOverlay.classList.add("show");
    }, 400);

    // Navigate to celebrate page
    setTimeout(() => {
      window.location.href = "celebrate.html";
    }, 2500);
  } else {
    nameInput.classList.add("error");
    nameInput.classList.remove("success");
    errorText.classList.add("show");
    accessLabel.textContent = "Tap the orb or press Enter to reveal ✨";
    accessLabel.classList.remove("granted");
    playError();
    setTimeout(() => {
      nameInput.classList.remove("error");
    }, 500);
  }
}

// ── Keyboard Listener ─────────────────────────────────
nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    checkName();
    return;
  }
  // Hide error on typing
  errorText.classList.remove("show");
  nameInput.classList.remove("error");
  playKeyClick();
});

// ── Input typing effect (remove success state on clear) ──
nameInput.addEventListener("input", () => {
  if (!nameInput.value) {
    nameInput.classList.remove("success");
    accessLabel.textContent = "Tap the orb or press Enter to reveal ✨";
    accessLabel.classList.remove("granted");
  }
});

// Expose checkName globally (for onclick)
window.checkName = checkName;

/* =====================================================
   celebrate.js — Celebration Page Logic v3
   ===================================================== */

// ── Retrieve stored name ──────────────────────────────
const storedName = localStorage.getItem("birthdayName") || "sudhanshu";
const displayName =
  storedName.charAt(0).toUpperCase() + storedName.slice(1).toLowerCase();

document.getElementById("birthdayName").textContent =
  `Happy Birthday, ${displayName}! 🎉`;
document.getElementById("nameSpan").textContent = displayName;

// ═══════════════════════════════════════════════════════
//  HAPPY BIRTHDAY AUDIO  (Web Audio API — 100% offline)
//  Rich orchestral-style synthesis: piano + bells + pad
// ═══════════════════════════════════════════════════════
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtxMain = null;
let synthNodes = [];
let audioPlaying = false;
let loopTimeout = null;

// Happy Birthday note sequence (frequency Hz, beat duration sec)
const HBD_MELODY = [
  // "Happy Birthday to you"
  [261.63, 0.35],
  [261.63, 0.15],
  [293.66, 0.5],
  [261.63, 0.5],
  [349.23, 0.5],
  [330.61, 1.0],
  [0, 0.15],
  // "Happy Birthday to you"
  [261.63, 0.35],
  [261.63, 0.15],
  [293.66, 0.5],
  [261.63, 0.5],
  [392.0, 0.5],
  [349.23, 1.0],
  [0, 0.15],
  // "Happy Birthday dear [name]"
  [261.63, 0.35],
  [261.63, 0.15],
  [523.25, 0.5],
  [440.0, 0.5],
  [349.23, 0.38],
  [330.61, 0.38],
  [293.66, 1.0],
  [0, 0.15],
  // "Happy Birthday to you"
  [466.16, 0.35],
  [466.16, 0.15],
  [440.0, 0.5],
  [349.23, 0.5],
  [392.0, 0.5],
  [349.23, 1.5],
];

function getAudioCtx() {
  if (!audioCtxMain) audioCtxMain = new AudioCtx();
  return audioCtxMain;
}

function createPianoNote(ctx, freq, startTime, duration, vol = 0.28) {
  if (freq === 0) return;

  // Master gain for this note
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);

  // Piano-style: fundamental + slight detuned copy
  [1, 2.005].forEach((detune, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(masterGain);
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq * detune, startTime);
    // ADSR envelope
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(
      vol * (idx === 0 ? 1 : 0.4),
      startTime + 0.025,
    );
    gain.gain.exponentialRampToValueAtTime(vol * 0.6, startTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.92);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
    synthNodes.push(osc);
  });

  // Bell overtone (3rd harmonic, very soft)
  const bell = ctx.createOscillator();
  const bellG = ctx.createGain();
  bell.connect(bellG);
  bellG.connect(masterGain);
  bell.type = "sine";
  bell.frequency.setValueAtTime(freq * 3, startTime);
  bellG.gain.setValueAtTime(0, startTime);
  bellG.gain.linearRampToValueAtTime(vol * 0.12, startTime + 0.015);
  bellG.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.6);
  bell.start(startTime);
  bell.stop(startTime + duration);
  synthNodes.push(bell);

  // Soft pad (sub-octave sine for warmth)
  const pad = ctx.createOscillator();
  const padG = ctx.createGain();
  pad.connect(padG);
  padG.connect(masterGain);
  pad.type = "sine";
  pad.frequency.setValueAtTime(freq * 0.5, startTime);
  padG.gain.setValueAtTime(0, startTime);
  padG.gain.linearRampToValueAtTime(vol * 0.08, startTime + 0.04);
  padG.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  pad.start(startTime);
  pad.stop(startTime + duration + 0.05);
  synthNodes.push(pad);
}

function playHBD(loop = true) {
  const ctx = getAudioCtx();
  if (ctx.state === "suspended") ctx.resume();

  synthNodes = [];
  let t = ctx.currentTime + 0.15;
  HBD_MELODY.forEach(([freq, dur]) => {
    createPianoNote(ctx, freq, t, dur);
    t += dur;
  });

  const totalDuration = t - ctx.currentTime + 0.5;
  if (loop) {
    loopTimeout = setTimeout(() => {
      if (audioPlaying) playHBD(true);
    }, totalDuration * 1000);
  }
}

function stopHBD() {
  clearTimeout(loopTimeout);
  synthNodes.forEach((n) => {
    try {
      n.stop();
    } catch (e) {}
  });
  synthNodes = [];
}

function toggleAudio() {
  const btn = document.getElementById("audioBtn");
  const icon = document.getElementById("audioIcon");

  if (audioPlaying) {
    stopHBD();
    audioPlaying = false;
    icon.textContent = "🎵";
    btn.innerHTML = "";
    btn.appendChild(icon);
    btn.appendChild(document.createTextNode(" Play Birthday Song"));
    btn.classList.remove("playing");
  } else {
    playHBD(true);
    audioPlaying = true;
    icon.textContent = "🎶";
    btn.innerHTML = "";
    btn.appendChild(icon);
    btn.appendChild(document.createTextNode(" Now Playing... 🎂"));
    btn.classList.add("playing");
  }
}

window.toggleAudio = toggleAudio;

// First user-interaction auto-start
let audioStarted = false;
function autoStartAudio() {
  if (audioStarted) return;
  audioStarted = true;
  playHBD(true);
  audioPlaying = true;
  const btn = document.getElementById("audioBtn");
  const icon = document.getElementById("audioIcon");
  if (btn && icon) {
    icon.textContent = "🎶";
    btn.innerHTML = "";
    btn.appendChild(icon);
    btn.appendChild(document.createTextNode(" Now Playing... 🎂"));
    btn.classList.add("playing");
  }
  document.removeEventListener("click", autoStartAudio);
}
// Auto-play on first click anywhere (browser policy)
document.addEventListener("click", autoStartAudio);
// Also try on page load (some browsers allow it)
window.addEventListener("load", () => {
  setTimeout(() => {
    try {
      getAudioCtx();
      autoStartAudio();
    } catch (e) {}
  }, 600);
});

// ═══════════════════════════════════════════════════════
//  STARFIELD
// ═══════════════════════════════════════════════════════
const starCanvas = document.getElementById("starCanvas");
(function initStars() {
  const ctx = starCanvas.getContext("2d");
  let stars = [],
    W,
    H;
  function resize() {
    W = starCanvas.width = window.innerWidth;
    H = starCanvas.height = window.innerHeight;
    stars = Array.from({ length: 260 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      a: Math.random(),
      s: Math.random() * 0.007 + 0.002,
      color: ["#fff", "#aad4ff", "#ffd6ff", "#ffe4a0"][
        Math.floor(Math.random() * 4)
      ],
    }));
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createRadialGradient(
      W / 2,
      H / 2,
      0,
      W / 2,
      H / 2,
      Math.max(W, H) * 0.8,
    );
    g.addColorStop(0, "#0e0022");
    g.addColorStop(0.5, "#05000f");
    g.addColorStop(1, "#000008");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const n1 = ctx.createRadialGradient(
      W * 0.25,
      H * 0.25,
      0,
      W * 0.25,
      H * 0.25,
      W * 0.38,
    );
    n1.addColorStop(0, "rgba(140,20,130,0.18)");
    n1.addColorStop(1, "transparent");
    ctx.fillStyle = n1;
    ctx.fillRect(0, 0, W, H);
    const n2 = ctx.createRadialGradient(
      W * 0.78,
      H * 0.65,
      0,
      W * 0.78,
      H * 0.65,
      W * 0.32,
    );
    n2.addColorStop(0, "rgba(20,80,200,0.13)");
    n2.addColorStop(1, "transparent");
    ctx.fillStyle = n2;
    ctx.fillRect(0, 0, W, H);
    stars.forEach((s) => {
      s.a += s.s;
      if (s.a > 1 || s.a < 0) s.s *= -1;
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

// ═══════════════════════════════════════════════════════
//  PHOTO ANIMATIONS — orbiting particles + float + shimmer
// ═══════════════════════════════════════════════════════
function initPhotoAnimations() {
  const cards = document.querySelectorAll(".photo-card-inner");

  cards.forEach((card, cardIndex) => {
    const img = card.querySelector(".pc-img");

    // ── 1. Floating bob (CSS class injection) ──────────
    img.style.animation =
      cardIndex === 0
        ? "pc-float 3.5s ease-in-out infinite, photo-pulse 3s ease-in-out infinite"
        : "pc-float-alt 4s ease-in-out infinite, photo-pulse2 3s ease-in-out 0.5s infinite";

    // ── 2. 3D tilt on mouse move ───────────────────────
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      card.style.transform = `perspective(600px) rotateX(${-dy * 14}deg) rotateY(${dx * 14}deg) scale(1.06)`;
      img.style.filter = `brightness(1.12) drop-shadow(0 0 28px ${cardIndex === 0 ? "#fbbf24" : "#22d3ee"})`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
      img.style.filter = "";
    });

    // ── 3. Canvas particle orbit around each photo ─────
    const canvas = document.createElement("canvas");
    canvas.style.cssText = `
      position:absolute; top:50%; left:50%;
      transform:translate(-50%,-50%);
      width:280px; height:280px;
      pointer-events:none; z-index:3;
      border-radius:50%;
    `;
    canvas.width = 280;
    canvas.height = 280;
    card.appendChild(canvas);

    const octx = canvas.getContext("2d");
    const CX = 140,
      CY = 140,
      R = 128;
    const particleCount = 20;
    const baseColor = cardIndex === 0 ? [251, 191, 36] : [34, 211, 238];
    const accentColor = cardIndex === 0 ? [255, 110, 180] : [168, 85, 247];

    const particles = Array.from({ length: particleCount }, (_, i) => ({
      angle: (i / particleCount) * Math.PI * 2,
      speed: 0.008 + Math.random() * 0.012,
      r: 1.5 + Math.random() * 3,
      orbit: R + (Math.random() - 0.5) * 22,
      pulse: Math.random() * Math.PI * 2,
      pulseSpd: 0.04 + Math.random() * 0.04,
      color: Math.random() > 0.5 ? baseColor : accentColor,
      trail: [],
    }));

    // Star sparks (faster, smaller)
    const sparks = Array.from({ length: 8 }, (_, i) => ({
      angle: (i / 8) * Math.PI * 2,
      speed: 0.03 + Math.random() * 0.02,
      orbit: R - 12 + Math.random() * 30,
      size: 1 + Math.random() * 2,
      color: baseColor,
    }));

    function drawOrbit() {
      octx.clearRect(0, 0, 280, 280);

      // Orbit ring glow
      octx.beginPath();
      octx.arc(CX, CY, R, 0, Math.PI * 2);
      octx.strokeStyle = `rgba(${baseColor[0]},${baseColor[1]},${baseColor[2]},0.12)`;
      octx.lineWidth = 1;
      octx.stroke();

      // Draw particles with trails
      particles.forEach((p) => {
        p.angle += p.speed * (cardIndex === 0 ? 1 : -1);
        p.pulse += p.pulseSpd;
        const pulsedR = p.r + Math.sin(p.pulse) * 1.2;
        const x = CX + Math.cos(p.angle) * p.orbit;
        const y = CY + Math.sin(p.angle) * p.orbit;

        // Trail
        p.trail.push({ x, y });
        if (p.trail.length > 10) p.trail.shift();
        p.trail.forEach((pt, i) => {
          const a = (i / p.trail.length) * 0.5;
          octx.beginPath();
          octx.arc(pt.x, pt.y, pulsedR * (i / p.trail.length), 0, Math.PI * 2);
          octx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${a})`;
          octx.fill();
        });

        // Main particle with glow
        const grad = octx.createRadialGradient(x, y, 0, x, y, pulsedR * 3);
        grad.addColorStop(
          0,
          `rgba(${p.color[0]},${p.color[1]},${p.color[2]},0.9)`,
        );
        grad.addColorStop(
          1,
          `rgba(${p.color[0]},${p.color[1]},${p.color[2]},0)`,
        );
        octx.beginPath();
        octx.arc(x, y, pulsedR * 3, 0, Math.PI * 2);
        octx.fillStyle = grad;
        octx.fill();

        octx.beginPath();
        octx.arc(x, y, pulsedR, 0, Math.PI * 2);
        octx.fillStyle = `rgba(255,255,255,0.95)`;
        octx.fill();
      });

      // Sparks (fast tiny dots)
      sparks.forEach((s) => {
        s.angle += s.speed * (cardIndex === 0 ? -1 : 1);
        const x = CX + Math.cos(s.angle) * s.orbit;
        const y = CY + Math.sin(s.angle) * s.orbit;
        octx.beginPath();
        octx.arc(x, y, s.size, 0, Math.PI * 2);
        octx.fillStyle = `rgba(${s.color[0]},${s.color[1]},${s.color[2]},0.7)`;
        octx.fill();
      });

      requestAnimationFrame(drawOrbit);
    }
    drawOrbit();

    // ── 4. Shimmer sweep across photo ─────────────────
    function addShimmer() {
      const shimmer = document.createElement("div");
      shimmer.style.cssText = `
        position:absolute; z-index:4; border-radius:50%;
        width:200px; height:200px;
        background:linear-gradient(
          105deg,
          transparent 30%,
          rgba(255,255,255,0.35) 50%,
          transparent 70%
        );
        animation:shimmer-sweep 1.2s ease-in-out forwards;
        pointer-events:none;
        top:0; left:0;
      `;
      card.appendChild(shimmer);
      setTimeout(() => shimmer.remove(), 1300);
    }
    // Shimmer every 4–6 seconds on each card with offset
    setInterval(addShimmer, 4000 + cardIndex * 2000);
    setTimeout(addShimmer, 1000 + cardIndex * 500);
  });
}

// Inject shimmer keyframe once
(function injectStyles() {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes pc-float {
      0%,100% { transform: translateY(0px) rotate(-1deg); }
      33%      { transform: translateY(-10px) rotate(0.5deg); }
      66%      { transform: translateY(-5px) rotate(1deg); }
    }
    @keyframes pc-float-alt {
      0%,100% { transform: translateY(0px) rotate(1deg); }
      40%      { transform: translateY(-12px) rotate(-0.5deg); }
      70%      { transform: translateY(-6px) rotate(-1deg); }
    }
    @keyframes shimmer-sweep {
      0%   { clip-path: polygon(0 0, 0 0, 0 100%, 0 100%); }
      50%  { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
      100% { clip-path: polygon(100% 0, 100% 0, 100% 100%, 100% 100%); opacity:0; }
    }
    .photo-card-inner {
      transition: transform 0.15s ease;
      transform-style: preserve-3d;
    }
    .pc-img {
      transition: filter 0.15s ease;
    }
  `;
  document.head.appendChild(style);
})();

// Run after DOM
window.addEventListener("load", () => {
  initPhotoAnimations();
});

// ═══════════════════════════════════════════════════════
//  CONFETTI
// ═══════════════════════════════════════════════════════
const confettiCanvas = document.getElementById("confettiCanvas");
const cCtx = confettiCanvas.getContext("2d");
let confetti = [];

function resizeConfetti() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeConfetti);
resizeConfetti();

const CONFETTI_COLORS = [
  "#ff6eb4",
  "#a855f7",
  "#22d3ee",
  "#fbbf24",
  "#f0abfc",
  "#4ade80",
  "#f97316",
  "#60a5fa",
  "#fb7185",
  "#34d399",
  "#fde68a",
];

function spawnConfetti(count = 8) {
  for (let i = 0; i < count; i++) {
    const shape = ["rect", "circle", "star"][Math.floor(Math.random() * 3)];
    confetti.push({
      x: Math.random() * confettiCanvas.width,
      y: -20,
      vx: (Math.random() - 0.5) * 5,
      vy: Math.random() * 4 + 1.5,
      color:
        CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      w: Math.random() * 12 + 5,
      h: Math.random() * 6 + 3,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.25,
      life: 1,
      decay: Math.random() * 0.003 + 0.0015,
      shape,
    });
  }
}

function drawStar(ctx, x, y, r, spikes) {
  const step = Math.PI / spikes;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const rad = i % 2 === 0 ? r : r * 0.4;
    const ang = i * step;
    const px = x + Math.cos(ang) * rad;
    const py = y + Math.sin(ang) * rad;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function drawConfetti() {
  cCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confetti = confetti.filter((c) => c.life > 0);
  confetti.forEach((c) => {
    c.x += c.vx;
    c.y += c.vy;
    c.vx += (Math.random() - 0.5) * 0.12;
    c.angle += c.spin;
    c.life -= c.decay;
    if (c.y > confettiCanvas.height + 20) {
      c.life = 0;
      return;
    }
    cCtx.save();
    cCtx.globalAlpha = c.life;
    cCtx.translate(c.x, c.y);
    cCtx.rotate(c.angle);
    cCtx.fillStyle = c.color;
    if (c.shape === "circle") {
      cCtx.beginPath();
      cCtx.arc(0, 0, c.w / 2.5, 0, Math.PI * 2);
      cCtx.fill();
    } else if (c.shape === "star") {
      drawStar(cCtx, 0, 0, c.w / 2, 5);
    } else {
      cCtx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
    }
    cCtx.restore();
  });
  requestAnimationFrame(drawConfetti);
}
drawConfetti();

let burstCount = 0;
const burstInterval = setInterval(() => {
  spawnConfetti(18);
  burstCount++;
  if (burstCount > 10) clearInterval(burstInterval);
}, 220);
setInterval(() => {
  spawnConfetti(4);
}, 1200);

// ═══════════════════════════════════════════════════════
//  BALLOONS & HEARTS
// ═══════════════════════════════════════════════════════
const balloonContainer = document.getElementById("balloons");
const BALLOON_COLORS = [
  "#ff6eb4",
  "#a855f7",
  "#22d3ee",
  "#fbbf24",
  "#f0abfc",
  "#4ade80",
  "#f97316",
  "#60a5fa",
];

function spawnBalloon() {
  const b = document.createElement("div");
  b.className = "balloon";
  const color =
    BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
  const size = 40 + Math.random() * 35;
  const dur = 7 + Math.random() * 7;
  b.style.cssText = `
    left:${Math.random() * 93}%;
    width:${size}px; height:${size * 1.2}px;
    background: radial-gradient(circle at 35% 35%, rgba(255,255,255,0.45), ${color});
    box-shadow: inset -5px -8px 18px rgba(0,0,0,0.2), 0 0 20px ${color}55;
    animation-duration:${dur}s;
    animation-delay:${Math.random() * 2}s;
  `;
  balloonContainer.appendChild(b);
  setTimeout(() => b.remove(), (dur + 3) * 1000);
}
for (let i = 0; i < 15; i++) setTimeout(spawnBalloon, i * 150);
setInterval(spawnBalloon, 1400);

const heartContainer = document.getElementById("hearts");
const FLOATY = [
  "❤️",
  "💖",
  "💗",
  "💝",
  "💕",
  "🌟",
  "✨",
  "🌸",
  "🎊",
  "⭐",
  "💫",
  "🎀",
  "🦋",
];

function spawnHeart() {
  const h = document.createElement("div");
  h.className = "heart";
  h.textContent = FLOATY[Math.floor(Math.random() * FLOATY.length)];
  const dur = 6 + Math.random() * 7;
  h.style.cssText = `
    left:${Math.random() * 94}%;
    bottom:-60px;
    font-size:${1 + Math.random() * 1.8}rem;
    animation-duration:${dur}s;
    animation-delay:${Math.random() * 4}s;
  `;
  heartContainer.appendChild(h);
  setTimeout(() => h.remove(), (dur + 4) * 1000);
}
for (let i = 0; i < 14; i++) setTimeout(spawnHeart, i * 250);
setInterval(spawnHeart, 1100);

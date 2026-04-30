import init, { CellManager } from "./pkg/game_of_life.js";

const MAX_VISIBLE_CELLS = 1000; // per axis
const DEFAULT_CELL_PX = 14;
const DRAG_THRESHOLD_PX = 4;

const canvas = document.getElementById("grid");
const ctx = canvas.getContext("2d");
const playBtn = document.getElementById("play");
const stepBtn = document.getElementById("step");
const clearBtn = document.getElementById("clear");
const speed = document.getElementById("speed");
const speedLabel = document.getElementById("speed-label");
const hud = document.getElementById("hud");

await init();
const cm = new CellManager();

// World coordinate of the top-left visible pixel, in *cell units* (fractional).
let originX = 0;
let originY = 0;
let cellPx = DEFAULT_CELL_PX;
let dpr = window.devicePixelRatio || 1;
let cssW = 0, cssH = 0;

// Pixel cell size is bumped up if the window would otherwise show >1000 cells per axis.
function recomputeCellSize() {
    const minByWidth = cssW / MAX_VISIBLE_CELLS;
    const minByHeight = cssH / MAX_VISIBLE_CELLS;
    cellPx = Math.max(DEFAULT_CELL_PX, Math.ceil(Math.max(minByWidth, minByHeight)));
}

function resize() {
    dpr = window.devicePixelRatio || 1;
    cssW = window.innerWidth;
    cssH = window.innerHeight;
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    recomputeCellSize();
    draw();
}

function viewBounds() {
    const w = Math.min(MAX_VISIBLE_CELLS, Math.ceil(cssW / cellPx) + 1);
    const h = Math.min(MAX_VISIBLE_CELLS, Math.ceil(cssH / cellPx) + 1);
    const minX = Math.floor(originX);
    const minY = Math.floor(originY);
    return { minX, minY, maxX: minX + w, maxY: minY + h };
}

function screenToCell(px, py) {
    return {
        x: Math.floor(originX + px / cellPx),
        y: Math.floor(originY + py / cellPx),
    };
}

function draw() {
    ctx.fillStyle = "#0e0e10";
    ctx.fillRect(0, 0, cssW, cssH);

    const { minX, minY, maxX, maxY } = viewBounds();

    // Grid lines (only when cells are visually large enough).
    if (cellPx >= 6) {
        ctx.strokeStyle = "#1c1c22";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let cx = minX; cx <= maxX; cx++) {
            const x = Math.round((cx - originX) * cellPx) + 0.5;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, cssH);
        }
        for (let cy = minY; cy <= maxY; cy++) {
            const y = Math.round((cy - originY) * cellPx) + 0.5;
            ctx.moveTo(0, y);
            ctx.lineTo(cssW, y);
        }
        ctx.stroke();
    }

    // Origin crosshair (cell 0,0) so panning has a reference.
    if (0 >= minX && 0 < maxX && 0 >= minY && 0 < maxY) {
        ctx.fillStyle = "#222a3a";
        const ox = (0 - originX) * cellPx;
        const oy = (0 - originY) * cellPx;
        ctx.fillRect(ox, oy, cellPx, cellPx);
    }

    // Living cells.
    const cells = cm.living_in_view(minX, minY, maxX, maxY);
    ctx.fillStyle = "#e8e8ea";
    const inset = cellPx >= 6 ? 1 : 0;
    for (let i = 0; i < cells.length; i += 2) {
        const sx = (cells[i] - originX) * cellPx;
        const sy = (cells[i + 1] - originY) * cellPx;
        ctx.fillRect(sx + inset, sy + inset, cellPx - inset * 2, cellPx - inset * 2);
    }

    hud.textContent =
        `alive ${cm.count()} · view ${maxX - minX}×${maxY - minY} · ` +
        `cell ${cellPx}px · origin (${minX}, ${minY})`;
}

// Pan + click handling.
let pointerDown = false;
let dragging = false;
let downClientX = 0, downClientY = 0;
let lastClientX = 0, lastClientY = 0;
let activePointerId = null;

canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    pointerDown = true;
    dragging = false;
    activePointerId = e.pointerId;
    downClientX = lastClientX = e.clientX;
    downClientY = lastClientY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener("pointermove", (e) => {
    if (!pointerDown || e.pointerId !== activePointerId) return;
    const dx = e.clientX - lastClientX;
    const dy = e.clientY - lastClientY;
    lastClientX = e.clientX;
    lastClientY = e.clientY;

    if (!dragging) {
        const totalDx = e.clientX - downClientX;
        const totalDy = e.clientY - downClientY;
        if (Math.hypot(totalDx, totalDy) > DRAG_THRESHOLD_PX) {
            dragging = true;
            canvas.classList.add("dragging");
        } else {
            return;
        }
    }
    originX -= dx / cellPx;
    originY -= dy / cellPx;
    draw();
});

function endPointer(e) {
    if (e.pointerId !== activePointerId) return;
    if (pointerDown && !dragging) {
        const rect = canvas.getBoundingClientRect();
        const { x, y } = screenToCell(e.clientX - rect.left, e.clientY - rect.top);
        cm.toggle(x, y);
        draw();
    }
    pointerDown = false;
    dragging = false;
    activePointerId = null;
    canvas.classList.remove("dragging");
}

canvas.addEventListener("pointerup", endPointer);
canvas.addEventListener("pointercancel", endPointer);

// Simulation loop.
let running = false;
let lastTickAt = 0;

function loop(now) {
    if (running) {
        const interval = 1000 / Number(speed.value);
        if (now - lastTickAt >= interval) {
            cm.tick();
            lastTickAt = now;
            draw();
        }
        requestAnimationFrame(loop);
    }
}

function setRunning(next) {
    running = next;
    playBtn.textContent = running ? "Stop" : "Start";
    playBtn.classList.toggle("active", running);
    if (running) {
        lastTickAt = 0;
        requestAnimationFrame(loop);
    }
}

playBtn.addEventListener("click", () => setRunning(!running));
stepBtn.addEventListener("click", () => { cm.tick(); draw(); });
clearBtn.addEventListener("click", () => { cm.clear(); draw(); });
speed.addEventListener("input", () => { speedLabel.textContent = `${speed.value}/s`; });

// Keyboard: space to play/pause, n to step, c to clear.
window.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT") return;
    if (e.code === "Space") { e.preventDefault(); setRunning(!running); }
    else if (e.key === "n" || e.key === "N") { cm.tick(); draw(); }
    else if (e.key === "c" || e.key === "C") { cm.clear(); draw(); }
});

window.addEventListener("resize", resize);
resize();

// Seed: a glider near the origin so something interesting shows up on first load.
[[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]].forEach(([x, y]) => cm.toggle(x, y));
draw();

import { $, RM, rand, pick } from './util.js';

// The two fixed canvases of a game: #sky behind the page, with a drifting glow and fireflies, and #fx in front of it,
// with sparks and rings. tone plays the pop of each firework; mood(hue) lets the sky drift to another colour.
export function pond(tone) {
  const sky = $('#sky'), fx = $('#fx'), a = sky.getContext('2d'), b = fx.getContext('2d');
  const parts = [], rings = [], flies = [], sprites = new Map();
  let W = 0, H = 0, hue = 165, target = 165, last = 0;
  function sprite(h) {
    h = ((Math.round(h / 12) * 12) % 360 + 360) % 360;
    let s = sprites.get(h);
    if (!s) {
      s = document.createElement('canvas'); s.width = s.height = 64;
      const g = s.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, '#fff'); gr.addColorStop(0.25, `hsl(${h} 100% 75%)`); gr.addColorStop(1, `hsl(${h} 100% 55% / 0)`);
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64); sprites.set(h, s);
    }
    return s;
  }
  function resize() {
    const D = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    sky.width = W; sky.height = H; fx.width = W * D; fx.height = H * D; b.setTransform(D, 0, 0, D, 0, 0);
    if (!flies.length) for (let i = 0; i < 34; i++) flies.push({ x: rand(0, W), y: rand(0, H), a: rand(0, 6.28), s: rand(8, 24), p: rand(0, 6.28), z: rand(5, 13) });
    if (RM) drawSky(0, 1);
  }
  function drawSky(now, dt) {
    a.globalCompositeOperation = 'source-over'; a.clearRect(0, 0, W, H); a.globalCompositeOperation = 'lighter';
    hue += (target - hue) * Math.min(1, dt * 1.5);
    const R = Math.max(W, H) * 0.6;
    for (let i = 0; i < 3; i++) {
      const x = W * (0.5 + 0.4 * Math.sin(now * 0.00011 * (i + 1) + i * 2.1)), y = H * (0.5 + 0.38 * Math.cos(now * 0.00013 * (i + 1.3) + i));
      const g = a.createRadialGradient(x, y, 0, x, y, R);
      g.addColorStop(0, `hsl(${hue + i * 42} 85% 48% / 0.24)`); g.addColorStop(1, `hsl(${hue + i * 42} 85% 48% / 0)`);
      a.fillStyle = g; a.fillRect(0, 0, W, H);
    }
    if (RM) return;
    const img = sprite(62);
    for (const f of flies) {
      f.a += rand(-1.2, 1.2) * dt; f.x += Math.cos(f.a) * f.s * dt; f.y += Math.sin(f.a) * f.s * dt;
      if (f.x < -20) f.x = W + 20; else if (f.x > W + 20) f.x = -20;
      if (f.y < -20) f.y = H + 20; else if (f.y > H + 20) f.y = -20;
      a.globalAlpha = 0.15 + 0.75 * Math.sin(now * 0.0016 + f.p) ** 2;
      a.drawImage(img, f.x - f.z, f.y - f.z, f.z * 2, f.z * 2);
    }
    a.globalAlpha = 1;
  }
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    drawSky(now, dt);
    b.globalCompositeOperation = 'source-over'; b.clearRect(0, 0, W, H); b.globalCompositeOperation = 'lighter';
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= dt; if (p.life <= 0) { parts.splice(i, 1); continue; }
      p.vx *= 0.96; p.vy = p.vy * 0.96 + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      const k = p.life / p.max, z = p.z * (0.35 + 0.65 * k);
      b.globalAlpha = Math.min(1, k * 1.6); b.drawImage(sprite(p.h), p.x - z, p.y - z, z * 2, z * 2);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.life -= dt; if (r.life <= 0) { rings.splice(i, 1); continue; }
      const k = 1 - r.life / r.max;
      b.globalAlpha = 1 - k; b.strokeStyle = `hsl(${r.h} 100% 72%)`; b.lineWidth = 4 * (1 - k) + 1;
      b.beginPath(); b.arc(r.x, r.y, r.r0 + (r.r1 - r.r0) * (1 - (1 - k) ** 3), 0, 6.283); b.stroke();
    }
    b.globalAlpha = 1;
    requestAnimationFrame(frame);
  }
  function burst(x, y, h, n, power, g = 140) {
    if (RM) return;
    for (let i = 0; i < n; i++) {
      const ang = rand(0, 6.283), v = power * rand(0.35, 1.5), life = rand(0.45, 1.05);
      parts.push({ x, y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, g, life, max: life, z: rand(4, 11), h: h + rand(-22, 22) });
    }
  }
  function ring(x, y, h, r0, r1, life = 0.6) { if (!RM) rings.push({ x, y, h, r0, r1, life, max: life }); }
  // fireworks over the upper half of the screen
  function celebrate(n = 9) {
    for (let k = 0; k < n; k++) setTimeout(() => {
      const x = W * rand(0.12, 0.88), y = H * rand(0.12, 0.6), h = rand(0, 360);
      burst(x, y, h, 46, 330, 220); ring(x, y, h, 6, 120, 0.8); tone(pick([784, 880, 1047, 1175, 1319]), 0, 0.3, 0.05);
    }, k * 170);
  }
  addEventListener('resize', resize); resize();
  if (!RM) requestAnimationFrame(t => { last = t; frame(t); });
  return { burst, ring, celebrate, mood(h) { target = h; if (RM) drawSky(0, 1); } };
}

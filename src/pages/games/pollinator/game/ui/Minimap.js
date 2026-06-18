// 120×120 inset minimap of the full 3200×3200 world.
// Shows player, hive, and safe pads.
//
// TODO(Phase 2): fog-of-war reveal (deferred — Phase 1 shows the full map).

import { COLORS, rgba, panel } from '../utils/renderer.js';

export const Minimap = {
  SIZE: 120,

  draw(ctx, { bee, meadow, x, y, size = 120 }) {
    const scale = size / meadow.WORLD_SIZE;
    ctx.save();
    panel(ctx, x, y, size, size, {
      fill: rgba(COLORS.obsidian, 0.7),
      stroke: COLORS.ink,
      lineWidth: 2,
      radius: 6,
    });

    // clip to the map rect
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, size, size);
    ctx.clip();

    // pads
    for (const p of meadow.pads) {
      ctx.beginPath();
      ctx.arc(x + p.x * scale, y + p.y * scale, Math.max(3, p.radius * scale), 0, Math.PI * 2);
      ctx.fillStyle = rgba(COLORS.green, 0.8);
      ctx.fill();
    }

    // hive hexagon outline
    const hx = x + meadow.hive.x * scale;
    const hy = y + meadow.hive.y * scale;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const px = hx + Math.cos(a) * 5;
      const py = hy + Math.sin(a) * 5;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // player gold dot
    ctx.beginPath();
    ctx.arc(x + bee.x * scale, y + bee.y * scale, 3, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.gold;
    ctx.fill();
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
    ctx.restore();
  },
};

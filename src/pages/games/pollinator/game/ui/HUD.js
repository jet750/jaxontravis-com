// On-canvas HUD: health bar, pollen counter, active power-up slot, healing count.
// Pure rendering — no DOM. The minimap is drawn separately by Minimap.js.

import { COLORS, FONTS, font, text, panel, roundRectPath, rgba, mixHex } from '../utils/renderer.js';
import { PowerUpPlant } from '../entities/pickups/PowerUpPlant.js';
import { clamp } from '../utils/math.js';

function hpColor(frac) {
  // green → amber → red
  if (frac > 0.5) return mixHex(COLORS.ember, COLORS.green, (frac - 0.5) / 0.5);
  return mixHex(COLORS.crimson, COLORS.ember, frac / 0.5);
}

export const HUD = {
  draw(ctx, { bee, banked, activePowerUp, w, h, isMobile }) {
    // ---- Health bar (top-left) ----
    const hx = 16;
    const hy = 26;
    const hw = 160;
    const hh = 16;
    text(ctx, '⬡ HP', hx, hy - 8, {
      fontStr: font(FONTS.body, 11, '600'),
      color: COLORS.ink,
      align: 'left',
    });
    panel(ctx, hx, hy, hw, hh, { fill: rgba(COLORS.obsidian, 0.25), stroke: COLORS.ink, lineWidth: 2, radius: 4 });
    const frac = clamp(bee.hp / bee.maxHp, 0, 1);
    ctx.save();
    ctx.fillStyle = hpColor(frac);
    const innerW = (hw - 4) * frac;
    ctx.beginPath();
    ctx.rect(hx + 2, hy + 2, innerW, hh - 4);
    ctx.fill();
    ctx.restore();
    text(ctx, `${Math.ceil(bee.hp)}/${bee.maxHp}`, hx + hw / 2, hy + hh / 2, {
      fontStr: font(FONTS.mono, 10),
      color: COLORS.ink,
    });

    // ---- Pollen counter (top-center) ----
    const cx = w / 2;
    const val = bee.carriedValue;
    let pollenColor = COLORS.gold;
    if (val > 12) pollenColor = COLORS.crimson;
    else if (val > 10) pollenColor = COLORS.ember;
    text(ctx, `${val} / 10`, cx, 22, {
      fontStr: font(FONTS.mono, 14, '700'),
      color: pollenColor,
    });
    text(ctx, `BANKED: ${banked}`, cx, 40, {
      fontStr: font(FONTS.body, 11),
      color: COLORS.ink,
      alpha: 0.8,
    });
    if (bee.overCapacity) {
      text(ctx, 'OVERLOADED — sting disabled', cx, 56, {
        fontStr: font(FONTS.body, 10, '600'),
        color: COLORS.crimson,
      });
    }

    // ---- Active power-up slot (top-right) ----
    const px = w - 48;
    const py = 16;
    panel(ctx, px, py, 32, 32, { fill: rgba(COLORS.obsidian, 0.2), stroke: COLORS.ink, lineWidth: 1.5, radius: 6 });
    if (activePowerUp) {
      PowerUpPlant.drawIcon(ctx, activePowerUp.type, px + 16, py + 16, 22);
      // clockwise depleting ring
      const remain = clamp(activePowerUp.timer / activePowerUp.duration, 0, 1);
      ctx.save();
      ctx.strokeStyle = activePowerUp.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(px + 16, py + 16, 18, -Math.PI / 2, -Math.PI / 2 + remain * Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else {
      text(ctx, 'NONE', px + 16, py + 16, {
        fontStr: font(FONTS.body, 10),
        color: rgba(COLORS.ink, 0.6),
      });
    }

    // ---- Healing items (bottom-left) ----
    const by = h - 30;
    ctx.save();
    // vial icon
    ctx.translate(20, by);
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 1.4;
    ctx.fillStyle = rgba(COLORS.green, 0.7);
    roundRectPath(ctx, -4, -8, 8, 14, 3);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    text(ctx, `× ${bee.healingItems}`, 32, by - 1, {
      fontStr: font(FONTS.mono, 13, '700'),
      color: COLORS.ink,
      align: 'left',
    });
    if (!isMobile) {
      text(ctx, 'H to use', 64, by - 1, {
        fontStr: font(FONTS.body, 10),
        color: rgba(COLORS.ink, 0.6),
        align: 'left',
      });
    }
  },
};

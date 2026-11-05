"use client";
import { useEffect, useRef } from "react";
import { geoGraticule10, geoOrthographic, geoPath, type GeoPermissibleObjects } from "d3-geo";
import { feature, mesh } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";

const D = Math.PI / 180;
const C: Record<string, [number, number]> = {
  KHI: [24.86, 67.0], LHE: [31.55, 74.34], ISB: [33.68, 73.05], LHR: [51.47, -0.45], YYZ: [43.68, -79.63],
  JFK: [40.64, -73.78], SYD: [-33.94, 151.18], AKL: [-37.0, 174.79], BER: [52.36, 13.5], GYD: [40.47, 50.05], BKK: [13.69, 100.75], SIN: [1.36, 103.99],
};
const ROUTES: [string, string][] = [["KHI", "LHR"], ["LHE", "YYZ"], ["ISB", "JFK"], ["KHI", "SYD"], ["LHE", "BER"], ["KHI", "GYD"], ["ISB", "AKL"], ["KHI", "BKK"]];
const LABELS = ["United Kingdom · visit", "Canada · visit", "USA · B1/B2", "Australia · visit", "Germany · study", "Azerbaijan · e-visa", "New Zealand · visit", "Thailand · visit"];

export const STAMPS = [
  { country: "UNITED KINGDOM", kind: "VISITOR", code: "KHI → LHR", color: "#1F4E8C", radius: "6px", x: "10%", y: "16%", rot: "-5deg" },
  { country: "CANADA", kind: "TEMP. RESIDENT", code: "LHE → YYZ", color: "#8C1F2C", radius: "50%", x: "48%", y: "13%", rot: "7deg" },
  { country: "U.S.A.", kind: "B1 / B2", code: "ISB → JFK", color: "#2F6B3A", radius: "6px", x: "8%", y: "38%", rot: "4deg" },
  { country: "AUSTRALIA", kind: "VISITOR 600", code: "KHI → SYD", color: "#6B3FA0", radius: "50%", x: "50%", y: "36%", rot: "-6deg" },
  { country: "GERMANY", kind: "STUDENT · D", code: "LHE → BER", color: "#0A1A33", radius: "6px", x: "10%", y: "60%", rot: "-3deg" },
  { country: "AZERBAIJAN", kind: "E-VISA", code: "KHI → GYD", color: "#1F4E8C", radius: "50%", x: "50%", y: "58%", rot: "9deg" },
  { country: "NEW ZEALAND", kind: "VISITOR", code: "ISB → AKL", color: "#8C1F2C", radius: "6px", x: "9%", y: "80%", rot: "-4deg" },
  { country: "THAILAND", kind: "TOURIST", code: "KHI → BKK", color: "#2F6B3A", radius: "50%", x: "50%", y: "78%", rot: "5deg" },
];

type V3 = [number, number, number];
const vec = ([lat, lon]: [number, number]): V3 => { const la = lat * D, lo = lon * D; return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)]; };
const toLL = (v: V3): [number, number] => [Math.asin(Math.max(-1, Math.min(1, v[1]))) / D, Math.atan2(v[0], v[2]) / D];
const slerp = (a: V3, b: V3, t: number): V3 => {
  const d = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])), w = Math.acos(d);
  if (w < 1e-4) return [...a] as V3;
  const s = Math.sin(w), k1 = Math.sin((1 - t) * w) / s, k2 = Math.sin(t * w) / s;
  return [a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2];
};
const routes = ROUTES.map(([f, t]) => {
  const a = vec(C[f]), b = vec(C[t]);
  const w = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
  return { f, t, a, b, w, mid: toLL(slerp(a, b, 0.5)), lift: Math.min(0.42, 0.1 + w * 0.16) };
});
const FLY = 2600, HOLD = 1300;
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function HeroGlobe2D({ onArrive, onRoute, staticFrame = false, mobile = false }: { onArrive: (i: number) => void; onRoute: (i: number) => void; staticFrame?: boolean; mobile?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cb = useRef({ onArrive, onRoute });
  cb.current = { onArrive, onRoute };

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const N = mobile ? 800 : 1500;
    const pts: V3[] = [];
    for (let i = 0; i < N; i++) { const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963229728653; pts.push([Math.cos(th) * r, y, Math.sin(th) * r]); }
    const cam = { lon: 60, lat: 22 };
    // Real continents and borders (Natural Earth). The dots above only show for the moment before this file arrives.
    const projection = geoOrthographic().clipAngle(90).precision(0.6);
    const path = geoPath(projection, ctx);
    const grid = geoGraticule10();
    let world: { land: GeoPermissibleObjects; borders: GeoPermissibleObjects; pakistan?: GeoPermissibleObjects } | null = null;
    fetch("/globe/countries-110m.json").then((r) => r.json()).then((t: Topology<{ countries: GeometryCollection; land: GeometryCollection }>) => {
      const countries = feature(t, t.objects.countries);
      world = {
        land: feature(t, t.objects.land) as GeoPermissibleObjects,
        borders: mesh(t, t.objects.countries, (a, b) => a !== b),
        pakistan: countries.features.find((c) => String(c.id) === "586"),
      };
      if (staticFrame) draw(1, routes.length - 1, true);
    }).catch(() => { /* keep the dotted globe */ });
    let w = 0, h = 0, dpr = 1, raf = 0, visible = true, last = performance.now();
    let idx = 0, elapsed = 0, arrived = false;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const ro = new ResizeObserver(() => { resize(); if (staticFrame) draw(); });
    ro.observe(canvas); resize();

    function proj(v: V3, R: number, cx: number, cy: number) {
      const a = -cam.lon * D, tl = cam.lat * D;
      const x1 = v[0] * Math.cos(a) + v[2] * Math.sin(a), z1 = -v[0] * Math.sin(a) + v[2] * Math.cos(a);
      const y2 = v[1] * Math.cos(tl) - z1 * Math.sin(tl), z2 = v[1] * Math.sin(tl) + z1 * Math.cos(tl);
      return [cx + x1 * R, cy - y2 * R, z2, x1, y2] as const;
    }
    const vis = (p: readonly number[]) => p[2] > 0 || p[3] * p[3] + p[4] * p[4] > 1.0001;
    const arcPt = (rt: (typeof routes)[number], t: number): V3 => { const v = slerp(rt.a, rt.b, t), hh = 1 + rt.lift * Math.sin(Math.PI * t); return [v[0] * hh, v[1] * hh, v[2] * hh]; };

    function draw(progress = 1, activeIdx = routes.length - 1, showAll = staticFrame) {
      const R = Math.min(w, h) * 0.42, cx = w * 0.46, cy = h * 0.47;
      ctx!.clearRect(0, 0, w, h);
      let g = ctx!.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.35);
      g.addColorStop(0, "rgba(64,132,220,.28)"); g.addColorStop(1, "rgba(64,132,220,0)");
      ctx!.fillStyle = g; ctx!.beginPath(); ctx!.arc(cx, cy, R * 1.35, 0, 7); ctx!.fill();
      g = ctx!.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
      g.addColorStop(0, "#1B4176"); g.addColorStop(1, "#081629");
      ctx!.fillStyle = g; ctx!.beginPath(); ctx!.arc(cx, cy, R, 0, 7); ctx!.fill();
      ctx!.strokeStyle = "rgba(120,170,235,.35)"; ctx!.lineWidth = 1; ctx!.stroke();
      if (world) {
        projection.scale(R).translate([cx, cy]).rotate([-cam.lon, -cam.lat]);
        const c = ctx!;
        c.beginPath(); path(grid); c.strokeStyle = "rgba(150,190,240,.07)"; c.lineWidth = 0.6; c.stroke();
        c.beginPath(); path(world.land);
        const lg = c.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R * 1.05);
        lg.addColorStop(0, "#6FA6DE"); lg.addColorStop(1, "#2C5C94");
        c.fillStyle = lg; c.fill();
        c.strokeStyle = "rgba(205,226,250,.55)"; c.lineWidth = 0.7; c.stroke();
        c.beginPath(); path(world.borders); c.strokeStyle = "rgba(10,26,51,.4)"; c.lineWidth = 0.5; c.stroke();
        if (world.pakistan) { c.beginPath(); path(world.pakistan); c.fillStyle = "rgba(242,169,59,.9)"; c.fill(); }
      } else for (const p of pts) { const q = proj(p, R, cx, cy); if (q[2] > 0) { ctx!.fillStyle = `rgba(150,190,240,${0.12 + q[2] * 0.55})`; ctx!.fillRect(q[0], q[1], 1.6, 1.6); } }
      const done = showAll ? routes.length : activeIdx;
      for (let i = 0; i < done; i++) strokeArc(i, 1, 0.22, 1.2, R, cx, cy);
      if (!showAll) strokeArc(activeIdx, progress, 1, 2.4, R, cx, cy);
      const rt = routes[Math.min(activeIdx, routes.length - 1)];
      const cities = showAll ? Object.keys(C) : ["KHI", "LHE", "ISB", rt.t];
      for (const code of cities) {
        const q = proj(vec(C[code]), R, cx, cy); if (q[2] <= 0) continue;
        const active = !showAll && (code === rt.f || code === rt.t);
        ctx!.fillStyle = active ? "#F2A93B" : "rgba(242,169,59,.6)"; ctx!.beginPath(); ctx!.arc(q[0], q[1], active ? 3.6 : 2.4, 0, 7); ctx!.fill();
        if (active) {
          const ph = (performance.now() % 1600) / 1600;
          ctx!.strokeStyle = `rgba(242,169,59,${1 - ph})`; ctx!.beginPath(); ctx!.arc(q[0], q[1], 4 + ph * 14, 0, 7); ctx!.stroke();
          ctx!.fillStyle = "#fff"; ctx!.font = "600 11px IBM Plex Mono, monospace"; ctx!.fillText(code, q[0] + 8, q[1] - 6);
        }
      }
      if (!showAll && progress < 1) {
        const p1 = proj(arcPt(rt, ease(progress)), R, cx, cy), p0 = proj(arcPt(rt, Math.max(0, ease(progress) - 0.02)), R, cx, cy);
        if (vis(p1)) {
          ctx!.save(); ctx!.translate(p1[0], p1[1]); ctx!.rotate(Math.atan2(p1[1] - p0[1], p1[0] - p0[0]));
          ctx!.fillStyle = "#fff"; ctx!.shadowColor = "#F2A93B"; ctx!.shadowBlur = 12;
          ctx!.beginPath(); ctx!.moveTo(8, 0); ctx!.lineTo(-6, -5); ctx!.lineTo(-3, 0); ctx!.lineTo(-6, 5); ctx!.closePath(); ctx!.fill(); ctx!.restore();
        }
      }
    }
    function strokeArc(i: number, prog: number, alpha: number, lw: number, R: number, cx: number, cy: number) {
      const rt = routes[i], steps = 48, upto = Math.floor(steps * ease(prog));
      let prev: readonly number[] | null = null;
      for (let s = 0; s <= upto; s++) {
        const p = proj(arcPt(rt, s / steps), R, cx, cy);
        if (prev && vis(p) && vis(prev)) {
          ctx!.strokeStyle = `rgba(242,169,59,${alpha * (alpha === 1 ? 0.4 + 0.6 * (s / steps) : 1)})`; ctx!.lineWidth = lw;
          ctx!.beginPath(); ctx!.moveTo(prev[0], prev[1]); ctx!.lineTo(p[0], p[1]); ctx!.stroke();
        }
        prev = p;
      }
    }

    if (staticFrame) { cam.lon = 50; cam.lat = 25; draw(1, routes.length - 1, true); return () => ro.disconnect(); }

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(now - last, 60); last = now;
      if (!visible || document.hidden) return;
      elapsed += dt;
      if (elapsed > FLY + HOLD) { idx = (idx + 1) % routes.length; elapsed = 0; arrived = false; cb.current.onRoute(idx); }
      const rt = routes[idx];
      let dl = ((rt.mid[1] - cam.lon + 540) % 360) - 180;
      cam.lon += dl * 0.025; cam.lat += (Math.max(-20, Math.min(35, rt.mid[0])) - cam.lat) * 0.025;
      const prog = Math.min(1, elapsed / FLY);
      if (prog >= 1 && !arrived) { arrived = true; cb.current.onArrive(idx); }
      draw(prog, idx, false);
    };
    cb.current.onRoute(0);
    raf = requestAnimationFrame(frame);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.05 });
    io.observe(canvas);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
  }, [staticFrame, mobile]);

  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />;
}

export { LABELS, ROUTES };

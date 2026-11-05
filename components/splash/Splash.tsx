import { LogoMark } from "@/components/layout/Logo";

type Style = "plane_stamp" | "globe_spin" | "passport_open" | "boarding_pass" | "logo_fade" | "off" | string;

/**
 * Intro overlay (brief §9.12), drawn in the very first paint of the page: it is part of the page's HTML and needs no JavaScript
 * download, so it shows WHILE the site loads. A small inline script decides before paint whether to keep it, and removes it when
 * the page has loaded: it stays for the chosen time counted from when it first appears, and never more than 3 s longer on a slow line.
 * Not shown: search engines, a second time in the same tab (when "once per visit" is on), Save-Data.
 * People who turn off animations see the same logo standing still instead of nothing.
 * The real page is underneath all along, so search engines and page-speed measures see it straight away.
 */
const before = (once: boolean) => `(function(){try{var d=document.documentElement,n=navigator,u=n.userAgent,c=n.connection||{};
if(/bot|crawl|spider|slurp|lighthouse|headless|preview/i.test(u)||c.saveData){d.classList.add('vf-splash-off');return}
if(${once}&&sessionStorage.getItem('vf_splash')){d.classList.add('vf-splash-off');return}
if(${once})sessionStorage.setItem('vf_splash','1');
window.__vfSplashAt=performance.now();d.classList.add('vf-splash-on')}catch(e){document.documentElement.classList.add('vf-splash-on')}})()`;

const after = (ms: number) => `(function(){var d=document.documentElement;if(!d.classList.contains('vf-splash-on'))return;var done=false;
function hide(){if(done)return;done=true;d.classList.add('vf-splash-out');setTimeout(function(){d.classList.remove('vf-splash-on','vf-splash-out');d.classList.add('vf-splash-off')},350)}
function soon(){setTimeout(hide,Math.max(0,${ms}-(performance.now()-(window.__vfSplashAt||0))))}
if(document.readyState==='complete')soon();else addEventListener('load',soon);
setTimeout(hide,${ms + 3000});
var b=document.getElementById('vf-splash-skip');if(b)b.addEventListener('click',hide)})()`;

export function SplashArt({ style, ms }: { style: Style; ms: number }) {
  return (
    <>
      <div className="vf-splash-art" style={{ position: "relative", height: 150, display: "flex", alignItems: "center", justifyContent: "center", perspective: 700 }}>
        {style === "plane_stamp" && (<>
          <svg width="84" height="84" viewBox="0 0 24 24" fill="#fff" style={{ animation: `sp-fly ${ms * 0.5}ms ease-out forwards`, filter: "drop-shadow(0 0 10px #F2A93B)" }} aria-hidden><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" /></svg>
          <div className="mono" style={{ position: "absolute", border: "3px solid #2F6B3A", color: "#6FD08A", padding: "6px 14px", borderRadius: 6, fontWeight: 600, letterSpacing: ".12em", animation: `sp-stamp ${ms}ms ease-out forwards`, background: "rgba(10,26,51,.6)" }}>APPROVED</div>
        </>)}
        {style === "globe_spin" && (
          <div style={{ width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #3E7BC4, #0B2A52 70%)", boxShadow: "0 0 40px rgba(64,132,220,.4)", animation: `sp-spin ${ms}ms ease-in-out` }} />
        )}
        {style === "passport_open" && (
          <div style={{ width: 110, height: 140, background: "#0F2A4D", border: "2px solid #F2A93B", borderRadius: "6px 12px 12px 6px", transformOrigin: "left center", animation: `sp-open ${ms * 0.7}ms ease-in-out forwards`, display: "flex", alignItems: "center", justifyContent: "center" }}><LogoMark size={48} /></div>
        )}
        {style === "boarding_pass" && (
          <div style={{ position: "relative", overflow: "hidden", width: 260, background: "#fff", borderRadius: 14, padding: "14px 18px", color: "#0A1A33", animation: `sp-slide ${ms * 0.35}ms ease-out`, display: "flex", justifyContent: "space-between" }}>
            <span className="mono" style={{ fontWeight: 600 }}>KHI</span><span>✈</span><span className="mono" style={{ fontWeight: 600 }}>ANY</span>
            <i style={{ position: "absolute", left: 0, right: 0, height: 3, background: "#F2A93B", animation: `sp-scan ${ms}ms linear` }} />
          </div>
        )}
        {!["plane_stamp", "globe_spin", "passport_open", "boarding_pass"].includes(style) && (
          <div style={{ animation: "sp-fade .6s ease-out both" }}><LogoMark size={96} /></div>
        )}
      </div>
      <p className="disp" style={{ margin: 0, color: "#fff", fontSize: 34, fontWeight: 600, animation: "sp-fade .8s ease-out both" }}>Visafeast</p>
      <span aria-hidden className="vf-splash-bar"><i /></span>
    </>
  );
}

export function Splash({ style, duration, oncePerSession, skipLabel, loadingLabel }: { style: Style; duration: number; oncePerSession: boolean; skipLabel: string; loadingLabel: string }) {
  if (style === "off") return null;
  const ms = Math.min(Math.max(duration || 2200, 800), 3000);
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: before(oncePerSession) }} />
      <div id="vf-splash" className="sky" role="status" aria-label={loadingLabel} dir="ltr">
        <SplashArt style={style} ms={ms} />
        <button type="button" id="vf-splash-skip" style={{ position: "absolute", top: 16, insetInlineEnd: 16, color: "#fff", background: "transparent", border: "1px solid rgba(255,255,255,.4)", borderRadius: 999, padding: "10px 18px", minHeight: 44, cursor: "pointer" }}>{skipLabel}</button>
      </div>
      <script dangerouslySetInnerHTML={{ __html: after(ms) }} />
    </>
  );
}

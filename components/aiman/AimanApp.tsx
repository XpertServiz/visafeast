"use client";
import { useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { AIMAN_RTL } from "@/config/locales";
import type { FundsConfig } from "@/config/aiman";
import { waLink } from "@/config/site";
import { Chat, type Bubble, type Chip } from "@/lib/aiman/chat";
import { COPY, type CopyId } from "@/lib/aiman/copy";
import type { HeroVideo } from "@/lib/types";
import { track } from "@/lib/track-client";
import { AimanVideo } from "./AimanVideo";
import { VideoGrid } from "./VideoGrid";
import { CountryPicker } from "./CountryPicker";

const LOC_FONT: Record<string, string> = { ur: "var(--urdu)", ar: "var(--arab)", fa: "var(--arab)", hi: "var(--f-devanagari), var(--body)" };
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

interface Props { country: string | null; lang: string | null; dict: Record<string, string>; funds: FundsConfig; whatsapp: string; videos: HeroVideo[] }
type Send = "idle" | "sending" | "sent" | "error";

export function AimanApp({ country, lang: locCode, dict, funds, whatsapp, videos }: Props) {
  const [, render] = useReducer((n: number) => n + 1, 0);
  const leadId = useRef<string | null>(null);
  const utm = useRef<Record<string, string>>({});
  const hooks = useRef({ onChange: () => render(), onStart: () => track("chat_started", { page: "talk-with-aiman" }), onResult: () => void submitLead() });
  const [chat] = useState(() => new Chat(dict, funds, { onChange: () => hooks.current.onChange(), onStart: () => hooks.current.onStart(), onResult: () => hooks.current.onResult() }));
  const threadRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLElement>(null);
  const [text, setText] = useState("");
  const [trap, setTrap] = useState("");
  const [send, setSend] = useState<Send>("idle");
  const hasLoc = Boolean(locCode) && Object.keys(dict).length > 0;
  const rtl = Boolean(locCode && AIMAN_RTL.includes(locCode));
  const dirAttr = rtl ? "rtl" : "ltr";
  const L = chat.lang === "loc" && hasLoc;

  useEffect(() => {
    try { const s = localStorage.getItem("aiman_lang"); if (s === "loc" || s === "en") chat.setLang(s); } catch { /* ignore */ }
    const q = new URLSearchParams(location.search);
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"]) { const v = q.get(k); if (v) utm.current[k] = v.slice(0, 120); }
    if (document.referrer) utm.current.referrer = document.referrer.slice(0, 200);
    track("page_view_aiman", { page: "talk-with-aiman" });
    return () => chat.destroy();
  }, [chat]);
  // when she has asked the last question, the same lead is updated with the visitor's answers (no second email)
  useEffect(() => { if (chat.after === "end" && leadId.current) void submitLead(true); }, [chat.after]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const t = threadRef.current; if (t) t.scrollTop = t.scrollHeight; }, [chat.items.length, chat.typing]);

  async function api(body: Record<string, unknown>) {
    const r = await fetch("/api/aiman/lead", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, country, lang: locCode, utm: utm.current, website: trap }) });
    return (await r.json().catch(() => ({}))) as { ok?: boolean; id?: string; error?: string };
  }
  /** The lead is sent by itself the moment the result shows: the visitor already gave their number and email at the start. Editing an answer updates the same lead. */
  async function submitLead(quiet = false) {
    if (!quiet) { track("result_shown", { page: "talk-with-aiman" }); setSend("sending"); }
    try {
      const j = await api({ step: "complete", id: leadId.current ?? undefined, answers: chat.ans, secs: chat.elapsed() });
      if (!j.ok) throw new Error(j.error);
      if (j.id) leadId.current = j.id;
      if (quiet) return;
      setSend("sent"); track("lead_submitted", { page: "talk-with-aiman" });
      (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq?.("track", "Lead");
    } catch { setSend("error"); }
  }

  const tx = (id: CopyId, vars?: Record<string, string | number>) => chat.tx(id, vars);
  const Bi = ({ en, loc }: { en: string; loc?: string }) => (L && loc ? <span className="loc-only" dir={dirAttr}>{loc}</span> : <>{en}{hasLoc && loc && loc !== en && <span className="ur" dir={dirAttr}>{loc}</span>}</>);
  const BiId = ({ id, vars }: { id: CopyId; vars?: Record<string, string | number> }) => { const x = tx(id, vars); return <Bi en={x.en} loc={x.loc} />; };
  const plain = (id: CopyId) => (L && dict[id] ? dict[id] : COPY[id][0]);

  const bubble = (b: Bubble) => {
    if (b.who === "ai") return <div key={b.n} className="msg ai"><Bi en={b.en} loc={b.loc} /></div>;
    const body = L && b.loc ? <span className="loc-only" dir={dirAttr} style={{ color: "inherit" }}>{b.loc}</span> : b.en;
    if (b.edit === undefined) return <div key={b.n} className="msg me">{body}</div>;
    const i = b.edit;
    return <div key={b.n} className="msg me editable" role="button" tabIndex={0} title="Tap to change this answer" onClick={() => chat.rewindTo(i)} onKeyDown={(e) => { if (e.key === "Enter") chat.rewindTo(i); }}>{body}</div>;
  };
  const chipBtn = (c: Chip) => (
    <button key={c.v + c.en} type="button" onClick={() => { if (!chat.started) chatRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); chat.press(c); }}>
      {L && c.loc ? <span className="loc-only" dir={dirAttr}>{c.loc}</span> : <>{c.en}{hasLoc && c.loc && c.loc !== c.en && <span className="ur" dir={dirAttr}>{c.loc}</span>}</>}
    </button>
  );

  const r = chat.finished ? chat.assessment() : null;
  const li = (x: { r: CopyId; f: CopyId; v?: Record<string, string | number> }) => (
    <li key={x.r + x.f}><b><BiId id={x.r} vars={x.v} /></b><span className="fix">→ <BiId id={x.f} vars={x.v} /></span></li>
  );
  const sub = (id: CopyId) => <p className="sub"><BiId id={id} /></p>;
  const goodLoc = (list: string) => { const x = tx("u_good_news", { list }); return x; };

  const switchLang = (l: "en" | "loc") => { chat.setLang(l); try { localStorage.setItem("aiman_lang", l); } catch { /* ignore */ } };
  const onType = () => { const v = text; setText(""); chat.type(v); };

  return (
    <div className="wrap" style={{ ["--loc-font" as string]: LOC_FONT[locCode ?? ""] ?? "var(--body)" }} lang="en">
      <div className="bar">
        <Link href="/" className="brand" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="logo" aria-hidden>V</div>
          <div><b>Visafeast</b><small>Talk with Aiman</small></div>
        </Link>
        {hasLoc && (
          <div className="lang" role="group" aria-label="Language">
            <button type="button" className={!L ? "on" : ""} aria-pressed={!L} onClick={() => switchLang("en")}>English</button>
            <button type="button" className={`ur-chip ${L ? "on" : ""}`} aria-pressed={L} onClick={() => switchLang("loc")} dir={dirAttr}>{dict.u_lang ?? LANG_NAME[locCode ?? ""] ?? locCode}</button>
          </div>
        )}
      </div>

      <div className="hero">
        <section className="aiman" aria-label="Aiman">
          <AimanVideo />
          <div className="aiman-cap">
            <span className="livepill"><i />{plain("u_online")}</span>
            <h2><Bi en={COPY.u_hero_h[0]} loc={dict.u_hero_h} /></h2>
            <p><Bi en={COPY.u_hero_p[0]} loc={dict.u_hero_p} /></p>
          </div>
        </section>

        <section className="chat" aria-label="Chat with Aiman" ref={chatRef}>
          <div className="chat-head">
            <b><Bi en={COPY.u_title[0]} loc={dict.u_title} /></b>
            <span className="chead-r"><span className="timer" aria-hidden>⏱ {mmss(chat.secs)}</span>
              <button type="button" className="resetbtn" onClick={() => { chat.reset(); setSend("idle"); leadId.current = null; }}>↻ {plain("u_reset")}</button></span>
          </div>
          <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={chat.progress}><i style={{ width: `${chat.progress}%` }} /></div>
          <div className="hint"><Bi en={COPY.u_hint[0]} loc={dict.u_hint} /></div>
          <div className="thread" ref={threadRef} role="log" aria-live="polite" aria-label="Chat">
            {chat.items.map(bubble)}
            {chat.typing && <div className="msg ai typing" aria-label="Aiman is typing"><i /><i /><i /></div>}
          </div>
          {chat.multi && <CountryPicker key={chat.items.length} options={chat.multi} L={L} dir={dirAttr} hasLoc={hasLoc} text={{ open: plain("u_pick"), hint: plain("u_pick_hint"), done: plain("u_done"), doneN: plain("u_done_n") }} onDone={(v) => chat.pickMulti(v)} />}
          <div className="chips">
            {chat.chips.map(chipBtn)}
            {chat.canUndo() && chat.chips.length > 0 && <button type="button" className="undo" onClick={() => chat.undo()}>{L && dict.m_undo ? dict.m_undo : COPY.m_undo[0]}</button>}
          </div>
          <form className="textrow" onSubmit={(e) => { e.preventDefault(); onType(); }}>
            <input value={text} onChange={(e) => setText(e.target.value)} maxLength={300} autoComplete="off" aria-label={plain("u_type")}
              placeholder={plain(chat.started && chat.chips.length === 0 ? "u_type" : "u_tap")} />
            <button type="submit">{plain("u_send_btn")}</button>
          </form>

          <input type="text" name="website" value={trap} onChange={(e) => setTrap(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }} />
          {r && (
            <div className="result" id="result">
              <div className={`badge ${r.qualified ? "ok" : "plan"}`}>{r.qualified ? "✅ " : "🟡 "}<BiId id={r.qualified ? "u_ok" : "u_plan"} /></div>
              {r.qualified
                ? r.qual.map((x) => <div key={x.c}><h3>{x.program}</h3>{x.soft.length ? <>{sub("u_make_stronger")}<ul className="gaps">{x.soft.map(li)}</ul></> : sub("u_well")}</div>)
                : <>
                  {r.best.map((x) => <div key={x.c}><h3>{x.program}</h3>{sub("u_strengthen_first")}<ul className="gaps">{[...x.hard, ...x.soft].map(li)}</ul></div>)}
                  {r.others.length > 0 && (() => { const x = goodLoc(r.others.map((o) => o.program).join(" · ")); return <p className="good"><Bi en={x.en} loc={x.loc} /></p>; })()}
                </>}
              <p className="sub" style={{ marginTop: 8 }}><BiId id="u_final" /></p>
              <div className="leadform">
                {send === "sending" && <p className="sub" role="status"><BiId id="u_sending_lead" /></p>}
                {send === "sent" && <p className="good"><BiId id="m_thanks" /></p>}
                {send === "error" && <><p className="err" role="alert"><BiId id="u_fail" /></p><button type="button" className="cta" onClick={() => void submitLead()}><BiId id="u_retry" /></button></>}
                <a className="cta" style={{ textAlign: "center", textDecoration: "none" }} href={waLink(`Hi Visafeast, I'm ${chat.ans.name}. I just finished the Aiman assessment.`, whatsapp)} rel="noopener"><BiId id="u_whatsapp" /></a>
              </div>
            </div>
          )}
        </section>
      </div>

      {videos.length > 0 && (
        <div className="videos">
          <h2><Bi en={COPY.u_videos[0]} loc={dict.u_videos} /></h2>
          <p />
          <VideoGrid videos={videos} playLabel={plain("u_play")} />
        </div>
      )}

      <footer>
        <span>www.visafeast.com</span><span>visafeast@gmail.com</span><span>facebook.com/visafeast</span>
        <a href={waLink("Hi Visafeast, I'd like to know about a visa.", whatsapp)} rel="noopener" style={{ marginInlineStart: "auto", fontWeight: 600 }}>{plain("u_whatsapp")}</a>
      </footer>
    </div>
  );
}

const LANG_NAME: Record<string, string> = { ur: "اردو", ar: "العربية", fa: "فارسی", hi: "हिन्दी", de: "Deutsch", es: "Español", fr: "Français", tr: "Türkçe", bn: "বাংলা", id: "Indonesia", ms: "Melayu", pt: "Português", it: "Italiano", ru: "Русский", nl: "Nederlands", ja: "日本語", zh: "中文", ko: "한국어", th: "ไทย", vi: "Tiếng Việt", pl: "Polski", el: "Ελληνικά", sv: "Svenska", da: "Dansk", no: "Norsk", fi: "Suomi", cs: "Čeština", hu: "Magyar", ro: "Română", uk: "Українська", he: "עברית", sw: "Kiswahili" };

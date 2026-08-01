"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_DAILY_TASKS,
  DEFAULT_WEEKLY_TASKS,
  DM_PAGES,
  DM_SLOTS,
  PREPARED_BY_KEY,
  Section,
  flattenKeys,
  todayKey,
  weekKey,
  sheetNumber,
  genId
} from "@/lib/tasks";

type StateMap = Record<string, any>;

function useDebouncedSave(key: string | null, dailyState: StateMap, weeklyState: StateMap | null, ready: boolean) {
  const timer = useRef<any>(null);
  useEffect(() => {
    if (!ready || !key) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: key, dailyState, weeklyState: weeklyState || {} })
      }).catch(() => {});
    }, 700);
    return () => clearTimeout(timer.current);
  }, [key, dailyState, weeklyState, ready]);
}

function Card({
  section,
  state,
  setState,
  cardId,
  number
}: {
  section: Section;
  state: StateMap;
  setState: (fn: (s: StateMap) => StateMap) => void;
  cardId: string;
  number: number;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const allKeys = useMemo(() => flattenKeys(section), [section]);
  const checkedCount = allKeys.filter((k) => state[`${cardId}_${k}`]).length;
  const total = allKeys.length;
  const done = total > 0 && checkedCount === total;

  function toggle(key: string) {
    setState((s) => ({ ...s, [`${cardId}_${key}`]: !s[`${cardId}_${key}`] }));
  }

  const notesKey = `${cardId}_notes`;

  return (
    <div className={`card ${done ? "done" : ""} ${collapsed ? "collapsed" : ""}`}>
      <div className="card-head" onClick={() => setCollapsed((c) => !c)}>
        <div className="tag-num">{number}</div>
        <div className="card-title-wrap">
          <div className="card-title">{section.title}</div>
          <div className="card-sub">{section.sub}</div>
        </div>
        <div className="card-frac">
          {checkedCount}/{total}
        </div>
        <svg className="chev" width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="card-body">
        {section.dm &&
          DM_PAGES.map((page, pi) => (
            <div key={pi}>
              <div className="group-label">{page}</div>
              <div className="dm-slots">
                {DM_SLOTS.map((slot, si) => {
                  const key = `dm_${pi}_${si}`;
                  const checked = !!state[`${cardId}_${key}`];
                  return (
                    <div
                      key={si}
                      className={`dm-slot ${checked ? "checked" : ""}`}
                      onClick={() => toggle(key)}
                    >
                      {slot}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

        {section.groups &&
          section.groups.map((g) => (
            <div key={g.id}>
              <div className="group-label">{g.label}</div>
              {g.items.map((it) => {
                const key = `${g.id}_${it.id}`;
                const checked = !!state[`${cardId}_${key}`];
                return (
                  <div key={it.id} className={`item ${checked ? "checked" : ""}`}>
                    <input
                      type="checkbox"
                      id={`${cardId}_${key}`}
                      checked={checked}
                      onChange={() => toggle(key)}
                    />
                    <label htmlFor={`${cardId}_${key}`}>{it.text}</label>
                  </div>
                );
              })}
            </div>
          ))}

        {section.items &&
          section.items.map((it) => {
            const checked = !!state[`${cardId}_${it.id}`];
            return (
              <div key={it.id} className={`item ${checked ? "checked" : ""}`}>
                <input
                  type="checkbox"
                  id={`${cardId}_${it.id}`}
                  checked={checked}
                  onChange={() => toggle(it.id)}
                />
                <label htmlFor={`${cardId}_${it.id}`}>{it.text}</label>
              </div>
            );
          })}

        <div className="notes-wrap">
          <span className="notes-label">Notes</span>
          <textarea
            className="notes-area"
            placeholder="Add a note for this task — blockers, context, who covered it..."
            value={state[notesKey] || ""}
            onChange={(e) => setState((s) => ({ ...s, [notesKey]: e.target.value }))}
          />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const date = useMemo(() => todayKey(), []);
  const wKey = useMemo(() => weekKey(), []);
  const weeklyDate = `weekly-${wKey}`;

  const [tab, setTab] = useState<"daily" | "weekly" | "suggestions">("daily");
  const [dailyState, setDailyState] = useState<StateMap>({});
  const [weeklyState, setWeeklyState] = useState<StateMap>({});
  const [dailyTasks, setDailyTasks] = useState<Section[]>(DEFAULT_DAILY_TASKS);
  const [weeklyTasks, setWeeklyTasks] = useState<Section[]>(DEFAULT_WEEKLY_TASKS);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("");

  // Each visit gets its own independent sheet once a name is entered —
  // never loaded from, or shared with, anyone else's sheet for the day.
  const [sheetKey, setSheetKey] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/report?date=${weeklyDate}`).then((r) => r.json()),
      fetch(`/api/template`).then((r) => r.json())
    ])
      .then(([w, t]) => {
        setWeeklyState(w?.report?.weeklyState || {});
        if (Array.isArray(t?.daily)) setDailyTasks(t.daily);
        if (Array.isArray(t?.weekly)) setWeeklyTasks(t.weekly);
      })
      .finally(() => setReady(true));
  }, [weeklyDate]);

  useDebouncedSave(sheetKey, dailyState, null, ready);
  useDebouncedSave(weeklyDate, {}, weeklyState, ready);

  const dailyTotal = dailyTasks.reduce((sum, s) => sum + flattenKeys(s).length, 0);
  const dailyChecked = dailyTasks.reduce(
    (sum, s) => sum + flattenKeys(s).filter((k) => dailyState[`${s.id}_${k}`]).length,
    0
  );
  const pct = dailyTotal ? Math.round((dailyChecked / dailyTotal) * 100) : 0;

  const preparedByList: string[] = Array.isArray(dailyState[PREPARED_BY_KEY])
    ? dailyState[PREPARED_BY_KEY]
    : dailyState[PREPARED_BY_KEY]
    ? [dailyState[PREPARED_BY_KEY]]
    : [];

  // Every page visit asks for a name, regardless of whether one was
  // already entered today. This resets to true on every mount, and only
  // becomes false once this visitor submits their name.
  const [nameGateOpen, setNameGateOpen] = useState(true);
  const [nameInput, setNameInput] = useState("");

  function submitName(e: React.FormEvent) {
    e.preventDefault();
    const name = nameInput.trim();
    if (!name) return;
    const newKey = `${date}::${genId()}`;
    setSheetKey(newKey);
    setDailyState({ [PREPARED_BY_KEY]: [name] });
    setNameInput("");
    setNameGateOpen(false);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  function buildPlainTextReport() {
    const dateStr = new Date().toLocaleDateString("en-IN", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
    function block(title: string, sections: Section[], state: StateMap) {
      let out = `\n${title}\n${"-".repeat(title.length)}\n`;
      sections.forEach((s) => {
        out += `\n${s.title} (${s.sub})\n`;
        if (s.dm) {
          DM_PAGES.forEach((page, pi) => {
            const res = DM_SLOTS.map((slot, si) => `${slot}: ${state[`${s.id}_dm_${pi}_${si}`] ? "Done" : "Pending"}`).join(" | ");
            out += `  ${page} — ${res}\n`;
          });
        } else if (s.groups) {
          s.groups.forEach((g) => {
            out += `  ${g.label}:\n`;
            g.items.forEach((it) => {
              out += `    ${state[`${s.id}_${g.id}_${it.id}`] ? "[x]" : "[ ]"} ${it.text}\n`;
            });
          });
        } else {
          (s.items || []).forEach((it) => {
            out += `  ${state[`${s.id}_${it.id}`] ? "[x]" : "[ ]"} ${it.text}\n`;
          });
        }
        const notes = state[`${s.id}_notes`];
        if (notes) out += `  Notes: ${notes}\n`;
      });
      return out;
    }
    return (
      `FACTORYFEED — DAILY OPS REPORT\n${dateStr}\nPrepared by: ${preparedByList.join(", ") || "—"}\n` +
      block("DAILY TASKS", dailyTasks, dailyState) +
      block("WEEKLY TASKS (current week)", weeklyTasks, weeklyState)
    );
  }

  function downloadReport() {
    const win = window.open("", "_blank");
    if (!win) return;
    const dateStr = new Date().toLocaleDateString("en-IN", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    });

    function sectionHTML(sections: Section[], state: StateMap) {
      return sections
        .map((s) => {
          let rowsHtml = "";
          if (s.dm) {
            DM_PAGES.forEach((page, pi) => {
              const res = DM_SLOTS.map((slot, si) => `${slot}: ${state[`${s.id}_dm_${pi}_${si}`] ? "Done" : "Pending"}`).join(" | ");
              rowsHtml += `<li>${page}<br><span class="r-sub">${res}</span></li>`;
            });
          } else if (s.groups) {
            s.groups.forEach((g) => {
              rowsHtml += `<li class="r-heading">${g.label}</li>`;
              g.items.forEach((it) => {
                const checked = !!state[`${s.id}_${g.id}_${it.id}`];
                rowsHtml += `<li class="${checked ? "r-done" : "r-pending"}">${checked ? "✔" : "☐"} ${it.text}</li>`;
              });
            });
          } else {
            (s.items || []).forEach((it) => {
              const checked = !!state[`${s.id}_${it.id}`];
              rowsHtml += `<li class="${checked ? "r-done" : "r-pending"}">${checked ? "✔" : "☐"} ${it.text}</li>`;
            });
          }
          const notes = state[`${s.id}_notes`];
          return `<div class="r-card"><div class="r-title">${s.title} <span class="r-sub">— ${s.sub}</span></div><ul class="r-list">${rowsHtml}</ul>${
            notes ? `<div class="r-notes"><b>Notes:</b> ${String(notes).replace(/</g, "&lt;")}</div>` : ""
          }</div>`;
        })
        .join("");
    }

    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Factoryfeed Ops Report — ${dateStr}</title>
      <style>
        body{font-family:'IBM Plex Mono',monospace, Arial, sans-serif; color:#24304A; margin:0; padding:32px; background:#fff;}
        h1{font-family:Georgia,serif; font-size:24px; margin:0 0 2px;}
        .r-date{color:#B8402F; font-weight:bold; margin-bottom:20px; font-size:13px; text-transform:uppercase; letter-spacing:.06em;}
        h2{font-size:15px; text-transform:uppercase; letter-spacing:.08em; color:#3F6357; border-bottom:2px solid #3F6357; padding-bottom:4px; margin:26px 0 10px;}
        .r-card{border:1px solid #C9BC9E; border-radius:5px; padding:12px 16px; margin-bottom:12px; page-break-inside:avoid;}
        .r-title{font-weight:bold; font-size:14px; margin-bottom:6px;}
        .r-sub{font-weight:normal; color:#666; font-size:11.5px;}
        .r-list{list-style:none; padding:0; margin:0;}
        .r-list li{font-size:13px; padding:3px 0; line-height:1.5;}
        .r-heading{font-weight:bold; color:#B8402F; text-transform:uppercase; font-size:11px; letter-spacing:.05em; margin-top:6px;}
        .r-done{color:#3F6357;}
        .r-pending{color:#24304A;}
        .r-notes{margin-top:8px; padding-top:8px; border-top:1px dashed #C9BC9E; font-size:12.5px; color:#4A5570;}
        @media print{ body{padding:14px;} }
      </style></head><body>
      <h1>Factoryfeed &middot; Daily Ops Report</h1>
      <div class="r-date">${dateStr} &middot; Prepared by ${preparedByList.join(", ") || "—"}</div>
      <h2>Daily Tasks</h2>
      ${sectionHTML(dailyTasks, dailyState)}
      <h2>Weekly Tasks (current week)</h2>
      ${sectionHTML(weeklyTasks, weeklyState)}
      </body></html>`);
    win.document.close();
    setTimeout(() => {
      win.focus();
      win.print();
    }, 400);
  }

  async function copyReport() {
    const text = buildPlainTextReport();
    try {
      await navigator.clipboard.writeText(text);
      showToast("Report copied — paste into WhatsApp/Email");
    } catch {
      showToast("Copy failed — select and copy manually");
    }
  }

  return (
    <div className="sheet">
      <header>
        <div className="eyebrow">Factoryfeed &middot; Content &amp; App Ops</div>
        <h1>Daily Ops Sheet</h1>
        <div className="docket-row">
          <div className="docket-field">
            Date
            <span>
              {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
            </span>
          </div>
          <div className="docket-field">
            Sheet No.
            <span>{sheetNumber()}</span>
          </div>
          <div className="docket-field">
            Prepared By
            <span title={preparedByList.join(", ")}>
              {preparedByList.length ? preparedByList.join(", ") : "—"}
            </span>
          </div>
          <div className="overall-wrap">
            <div className="docket-field">Today's Progress</div>
            <div className="overall-pct">{pct}%</div>
            <div className="overall-bar">
              <div className="overall-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
        <div className="action-row">
          <div
            className="action-btn"
            onClick={preparedByList.length ? downloadReport : undefined}
            style={!preparedByList.length ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
          >
            ⬇ Download Report (PDF)
          </div>
          <div
            className="action-btn secondary"
            onClick={preparedByList.length ? copyReport : undefined}
            style={!preparedByList.length ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
          >
            Copy as Text (WhatsApp/Email)
          </div>
          <span className="save-pill">{ready ? "Synced to server" : "Loading..."}</span>
        </div>
      </header>

      {ready && nameGateOpen && (
        <div className="login-box" style={{ marginTop: 40 }}>
          <h2>Who's checking in?</h2>
          <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>
            Enter your name to start a fresh checklist. Every visit gets its own sheet — you won't see anyone else's
            progress, and yours won't be affected by anyone else's.
          </p>
          <form onSubmit={submitName}>
            <input
              type="text"
              placeholder="Your name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              autoFocus
            />
            <button type="submit">Continue</button>
          </form>
        </div>
      )}

      {(!ready || !nameGateOpen) && (
        <>
      <div className="tabs">
        <div className={`tab ${tab === "daily" ? "active" : ""}`} onClick={() => setTab("daily")}>
          Daily Tasks
        </div>
        <div className={`tab ${tab === "weekly" ? "active" : ""}`} onClick={() => setTab("weekly")}>
          Weekly Tasks
        </div>
        <div className={`tab ${tab === "suggestions" ? "active" : ""}`} onClick={() => setTab("suggestions")}>
          Engagement Ideas
        </div>
      </div>

      {tab === "daily" && (
        <div>
          {dailyTasks.map((s, i) => (
            <Card key={s.id} section={s} state={dailyState} setState={setDailyState} cardId={s.id} number={i + 1} />
          ))}
        </div>
      )}

      {tab === "weekly" && (
        <div>
          {weeklyTasks.map((s, i) => (
            <Card key={s.id} section={s} state={weeklyState} setState={setWeeklyState} cardId={s.id} number={i + 1} />
          ))}
        </div>
      )}

      {tab === "suggestions" && (
        <div>
          <div className="suggestion">
            <b>Behind-the-scenes stories.</b> Post a "we're planning to shoot" or live update story — e.g. "Shooting today in
            Sudama Nagar, Chickpet" — to keep followers tuned in to what's coming.
          </div>
          <div className="suggestion">
            <b>Polls in stories.</b> Add polls to gather quick feedback from followers — which supplier videos they want next,
            which category to cover, etc.
          </div>
          <div className="suggestion">
            <b>Talk about the app, not just the reel.</b> Every so often, point viewers back to the app instead of just the
            content — e.g. "Want to check the full CMAI Fair videos? Watch on the Factoryfeed App."
          </div>
          <div className="suggestion">
            <b>Community touchpoints.</b> Use WhatsApp &amp; Instagram Communities to drop quick updates, respond to questions,
            and keep suppliers/buyers engaged between posts.
          </div>
        </div>
      )}

      <footer>
        Every check and note here saves to the shared server automatically — your whole team sees the same checklist.
        <br />
        <a href="/admin" className="reset-btn" style={{ textDecoration: "none", display: "inline-block" }}>
          Admin — Reports &amp; Edit Tasks
        </a>
      </footer>
        </>
      )}

      <div className={`toast ${toast ? "show" : ""}`}>{toast}</div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import {
  DEFAULT_DAILY_TASKS,
  DEFAULT_WEEKLY_TASKS,
  DM_PAGES,
  DM_SLOTS,
  PREPARED_BY_KEY,
  Section,
  Group,
  Item,
  genId
} from "@/lib/tasks";

type StateMap = Record<string, any>;

/* ---------------------------------------------------------------- */
/* Report viewer                                                     */
/* ---------------------------------------------------------------- */

function ReportView({
  dailyTasks,
  weeklyTasks,
  dailyState,
  weeklyState
}: {
  dailyTasks: Section[];
  weeklyTasks: Section[];
  dailyState: StateMap;
  weeklyState: StateMap;
}) {
  const preparedBy = dailyState[PREPARED_BY_KEY] || "Not recorded";
  function renderSections(sections: Section[], state: StateMap) {
    return sections.map((s) => {
      const rows: React.ReactElement[] = [];
      if (s.dm) {
        DM_PAGES.forEach((page, pi) => {
          const res = DM_SLOTS.map((slot, si) => `${slot}: ${state[`${s.id}_dm_${pi}_${si}`] ? "Done" : "Pending"}`).join(" | ");
          rows.push(
            <li key={page}>
              {page}
              <br />
              <span className="r-sub">{res}</span>
            </li>
          );
        });
      } else if (s.groups) {
        s.groups.forEach((g) => {
          rows.push(
            <li className="r-heading" key={g.id}>
              {g.label}
            </li>
          );
          g.items.forEach((it) => {
            const checked = !!state[`${s.id}_${g.id}_${it.id}`];
            rows.push(
              <li key={it.id} className={checked ? "r-done" : "r-pending"}>
                {checked ? "✔" : "☐"} {it.text}
              </li>
            );
          });
        });
      } else {
        (s.items || []).forEach((it) => {
          const checked = !!state[`${s.id}_${it.id}`];
          rows.push(
            <li key={it.id} className={checked ? "r-done" : "r-pending"}>
              {checked ? "✔" : "☐"} {it.text}
            </li>
          );
        });
      }
      const notes = state[`${s.id}_notes`];
      return (
        <div className="r-card" key={s.id}>
          <div className="r-title">
            {s.title} <span className="r-sub">— {s.sub}</span>
          </div>
          <ul className="r-list">{rows}</ul>
          {notes && (
            <div className="r-notes">
              <b>Notes:</b> {notes}
            </div>
          )}
        </div>
      );
    });
  }

  return (
    <div>
      <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".05em" }}>
        Prepared by: <b style={{ color: "var(--ink)" }}>{preparedBy}</b>
      </div>
      <h3 style={{ fontFamily: "Oswald,sans-serif" }}>Daily Tasks</h3>
      {renderSections(dailyTasks, dailyState)}
      <h3 style={{ fontFamily: "Oswald,sans-serif" }}>Weekly Tasks</h3>
      {renderSections(weeklyTasks, weeklyState)}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Task editor                                                       */
/* ---------------------------------------------------------------- */

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "7px 9px",
  border: "1px solid var(--line)",
  borderRadius: 5,
  fontFamily: "'IBM Plex Mono',monospace",
  fontSize: 13,
  background: "#fff",
  marginBottom: 6
};

const smallBtn: React.CSSProperties = {
  fontFamily: "'Oswald',sans-serif",
  fontWeight: 600,
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: ".04em",
  padding: "5px 9px",
  borderRadius: 4,
  border: "1.5px solid var(--thread)",
  color: "var(--thread)",
  background: "#fff",
  cursor: "pointer"
};

function EditorItemRow({
  item,
  onChange,
  onDelete
}: {
  item: Item;
  onChange: (text: string) => void;
  onDelete: () => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
      <input style={{ ...inputStyle, marginBottom: 0 }} value={item.text} onChange={(e) => onChange(e.target.value)} />
      <button style={smallBtn} onClick={onDelete} title="Delete item">
        ✕
      </button>
    </div>
  );
}

function EditorSectionCard({
  section,
  onChange,
  onDelete
}: {
  section: Section;
  onChange: (s: Section) => void;
  onDelete: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  function updateItem(items: Item[], id: string, text: string) {
    return items.map((it) => (it.id === id ? { ...it, text } : it));
  }

  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="card-head" onClick={() => setCollapsed((c) => !c)} style={{ cursor: "pointer" }}>
        <div className="card-title-wrap">
          <input
            style={{ ...inputStyle, fontFamily: "'Oswald',sans-serif", fontWeight: 600, marginBottom: 4 }}
            value={section.title}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onChange({ ...section, title: e.target.value })}
          />
          <input
            style={{ ...inputStyle, fontSize: 11, marginBottom: 0 }}
            value={section.sub}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onChange({ ...section, sub: e.target.value })}
          />
        </div>
        <button
          style={{ ...smallBtn, marginLeft: 10 }}
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Delete the "${section.title}" section?`)) onDelete();
          }}
        >
          Delete Section
        </button>
      </div>

      {!collapsed && (
        <div className="card-body">
          {section.dm && (
            <div style={{ fontSize: 12.5, color: "var(--ink-soft)", padding: "8px 0" }}>
              DM checklist structure (pages &amp; time slots) is fixed — only the title/subtitle above are editable.
            </div>
          )}

          {section.groups &&
            section.groups.map((g, gi) => (
              <div key={g.id} style={{ marginBottom: 14 }}>
                <input
                  style={{ ...inputStyle, fontWeight: 600, fontSize: 12, textTransform: "uppercase" }}
                  value={g.label}
                  onChange={(e) => {
                    const groups = [...(section.groups as Group[])];
                    groups[gi] = { ...g, label: e.target.value };
                    onChange({ ...section, groups });
                  }}
                />
                {g.items.map((it) => (
                  <EditorItemRow
                    key={it.id}
                    item={it}
                    onChange={(text) => {
                      const groups = [...(section.groups as Group[])];
                      groups[gi] = { ...g, items: updateItem(g.items, it.id, text) };
                      onChange({ ...section, groups });
                    }}
                    onDelete={() => {
                      const groups = [...(section.groups as Group[])];
                      groups[gi] = { ...g, items: g.items.filter((x) => x.id !== it.id) };
                      onChange({ ...section, groups });
                    }}
                  />
                ))}
                <button
                  style={smallBtn}
                  onClick={() => {
                    const groups = [...(section.groups as Group[])];
                    groups[gi] = { ...g, items: [...g.items, { id: genId(), text: "New task item" }] };
                    onChange({ ...section, groups });
                  }}
                >
                  + Add Item to {g.label}
                </button>
              </div>
            ))}

          {section.items && (
            <div>
              {section.items.map((it) => (
                <EditorItemRow
                  key={it.id}
                  item={it}
                  onChange={(text) => onChange({ ...section, items: updateItem(section.items as Item[], it.id, text) })}
                  onDelete={() => onChange({ ...section, items: (section.items as Item[]).filter((x) => x.id !== it.id) })}
                />
              ))}
              <button
                style={smallBtn}
                onClick={() =>
                  onChange({ ...section, items: [...(section.items as Item[]), { id: genId(), text: "New task item" }] })
                }
              >
                + Add Item
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TaskEditor() {
  const [daily, setDaily] = useState<Section[]>([]);
  const [weekly, setWeekly] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    fetch("/api/template")
      .then((r) => r.json())
      .then((data) => {
        setDaily(data.daily || []);
        setWeekly(data.weekly || []);
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setSavedMsg("");
    const res = await fetch("/api/admin/template", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ daily, weekly })
    });
    setSaving(false);
    setSavedMsg(res.ok ? "Saved — the checklist page now shows these changes." : "Save failed. Try again.");
    setTimeout(() => setSavedMsg(""), 4000);
  }

  async function restoreDefaults() {
    if (!confirm("Restore the original task list? Any renamed, added, or deleted tasks will be lost.")) return;
    setSaving(true);
    const res = await fetch("/api/admin/template", { method: "DELETE" });
    const data = await res.json();
    setDaily(data.daily || DEFAULT_DAILY_TASKS);
    setWeekly(data.weekly || DEFAULT_WEEKLY_TASKS);
    setSaving(false);
    setSavedMsg("Restored to the original task list.");
    setTimeout(() => setSavedMsg(""), 4000);
  }

  if (loading) return <div>Loading task list…</div>;

  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <div className="action-btn" style={{ background: "var(--teal)", borderColor: "var(--teal-dark)" }} onClick={save}>
          {saving ? "Saving…" : "Save Changes"}
        </div>
        <div
          className="action-btn secondary"
          style={{ borderColor: "var(--thread)", color: "var(--thread)" }}
          onClick={restoreDefaults}
        >
          Restore Original Task List
        </div>
        {savedMsg && <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{savedMsg}</span>}
      </div>

      <h3 style={{ fontFamily: "Oswald,sans-serif", fontSize: 14, textTransform: "uppercase", letterSpacing: ".05em" }}>
        Daily Tasks
      </h3>
      {daily.map((s, i) => (
        <EditorSectionCard
          key={s.id}
          section={s}
          onChange={(updated) => setDaily((arr) => arr.map((x, idx) => (idx === i ? updated : x)))}
          onDelete={() => setDaily((arr) => arr.filter((_, idx) => idx !== i))}
        />
      ))}
      <button
        style={{ ...smallBtn, width: "100%", padding: 12, marginBottom: 24 }}
        onClick={() =>
          setDaily((arr) => [
            ...arr,
            { id: genId(), title: "New Task", sub: "Edit this section", items: [{ id: genId(), text: "New task item" }] }
          ])
        }
      >
        + Add Daily Task Section
      </button>

      <h3 style={{ fontFamily: "Oswald,sans-serif", fontSize: 14, textTransform: "uppercase", letterSpacing: ".05em" }}>
        Weekly Tasks
      </h3>
      {weekly.map((s, i) => (
        <EditorSectionCard
          key={s.id}
          section={s}
          onChange={(updated) => setWeekly((arr) => arr.map((x, idx) => (idx === i ? updated : x)))}
          onDelete={() => setWeekly((arr) => arr.filter((_, idx) => idx !== i))}
        />
      ))}
      <button
        style={{ ...smallBtn, width: "100%", padding: 12 }}
        onClick={() =>
          setWeekly((arr) => [
            ...arr,
            { id: genId(), title: "New Task", sub: "Edit this section", items: [{ id: genId(), text: "New task item" }] }
          ])
        }
      >
        + Add Weekly Task Section
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Admin page shell: login gate, then Reports / Edit Tasks tabs      */
/* ---------------------------------------------------------------- */

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [section, setSection] = useState<"reports" | "edit">("reports");

  const [dates, setDates] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<{ dailyState: StateMap; weeklyState: StateMap } | null>(null);
  const [templates, setTemplates] = useState<{ daily: Section[]; weekly: Section[] }>({
    daily: DEFAULT_DAILY_TASKS,
    weekly: DEFAULT_WEEKLY_TASKS
  });

  async function loadDates() {
    const res = await fetch("/api/admin/reports");
    if (res.status === 401) {
      setAuthed(false);
      setChecking(false);
      return;
    }
    const data = await res.json();
    setAuthed(true);
    setChecking(false);
    setDates((data.dates || []).filter((d: string) => !d.startsWith("weekly-")));

    fetch("/api/template")
      .then((r) => r.json())
      .then((t) => setTemplates({ daily: t.daily || DEFAULT_DAILY_TASKS, weekly: t.weekly || DEFAULT_WEEKLY_TASKS }));
  }

  useEffect(() => {
    loadDates();
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    if (res.ok) {
      setPassword("");
      loadDates();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Login failed");
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setSelected(null);
    setSelectedReport(null);
  }

  async function openDate(date: string) {
    setSelected(date);
    setSelectedReport(null);
    const [dRes, wRes] = await Promise.all([
      fetch(`/api/admin/reports?date=${date}`).then((r) => r.json()),
      fetch(`/api/admin/reports?date=weekly-${weekKeyFor(date)}`).then((r) => r.json())
    ]);
    setSelectedReport({
      dailyState: dRes?.report?.dailyState || {},
      weeklyState: wRes?.report?.weeklyState || {}
    });
  }

  function weekKeyFor(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    const onejan = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${week}`;
  }

  if (checking) {
    return <div className="sheet">Loading…</div>;
  }

  if (!authed) {
    return (
      <div className="sheet">
        <div className="login-box">
          <h2>Admin Access</h2>
          <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Enter the admin password to view reports and edit tasks.</p>
          <form onSubmit={login}>
            <input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <button type="submit">Log In</button>
            {error && <div className="login-error">{error}</div>}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="sheet">
      <header>
        <div className="eyebrow">Factoryfeed &middot; Admin</div>
        <h1>Admin Panel</h1>
        <div className="action-row">
          <a href="/" className="action-btn secondary">
            ← Back to Checklist
          </a>
          <div className="action-btn" onClick={logout}>
            Log Out
          </div>
        </div>
      </header>

      <div className="tabs">
        <div className={`tab ${section === "reports" ? "active" : ""}`} onClick={() => setSection("reports")}>
          Report Archive
        </div>
        <div className={`tab ${section === "edit" ? "active" : ""}`} onClick={() => setSection("edit")}>
          Edit Tasks
        </div>
      </div>

      {section === "reports" && (
        <div style={{ display: "flex", gap: 20, marginTop: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 240px", minWidth: 220 }}>
            <h3 style={{ fontFamily: "Oswald,sans-serif", fontSize: 14, textTransform: "uppercase", letterSpacing: ".05em" }}>
              Saved Days ({dates.length})
            </h3>
            <ul className="report-list">
              {dates.length === 0 && <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>No reports saved yet.</div>}
              {dates.map((d) => (
                <li
                  key={d}
                  className="report-row"
                  onClick={() => openDate(d)}
                  style={{ borderColor: selected === d ? "var(--thread)" : undefined }}
                >
                  <span className="r-date">{d}</span>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ flex: "2 1 400px", minWidth: 280 }}>
            {!selected && <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>Select a date to view its report.</div>}
            {selected && !selectedReport && <div>Loading report…</div>}
            {selected && selectedReport && (
              <>
                <h3 style={{ fontFamily: "Oswald,sans-serif" }}>{selected}</h3>
                <ReportView
                  dailyTasks={templates.daily}
                  weeklyTasks={templates.weekly}
                  dailyState={selectedReport.dailyState}
                  weeklyState={selectedReport.weeklyState}
                />
              </>
            )}
          </div>
        </div>
      )}

      {section === "edit" && (
        <div style={{ marginTop: 20 }}>
          <TaskEditor />
        </div>
      )}
    </div>
  );
}

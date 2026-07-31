"use client";

import React, { useEffect, useState } from "react";
import { DAILY_TASKS, WEEKLY_TASKS, DM_PAGES, DM_SLOTS, Section } from "@/lib/tasks";

type StateMap = Record<string, any>;

function ReportView({ dailyState, weeklyState }: { dailyState: StateMap; weeklyState: StateMap }) {
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
      <h3 style={{ fontFamily: "Oswald,sans-serif" }}>Daily Tasks</h3>
      {renderSections(DAILY_TASKS, dailyState)}
      <h3 style={{ fontFamily: "Oswald,sans-serif" }}>Weekly Tasks</h3>
      {renderSections(WEEKLY_TASKS, weeklyState)}
    </div>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [dates, setDates] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<{ dailyState: StateMap; weeklyState: StateMap } | null>(null);

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
          <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Enter the admin password to view saved reports.</p>
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
        <h1>Report Archive</h1>
        <div className="action-row">
          <a href="/" className="action-btn secondary">
            ← Back to Checklist
          </a>
          <div className="action-btn" onClick={logout}>
            Log Out
          </div>
        </div>
      </header>

      <div style={{ display: "flex", gap: 20, marginTop: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 240px", minWidth: 220 }}>
          <h3 style={{ fontFamily: "Oswald,sans-serif", fontSize: 14, textTransform: "uppercase", letterSpacing: ".05em" }}>
            Saved Days ({dates.length})
          </h3>
          <ul className="report-list">
            {dates.length === 0 && <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>No reports saved yet.</div>}
            {dates.map((d) => (
              <li key={d} className="report-row" onClick={() => openDate(d)} style={{ borderColor: selected === d ? "var(--thread)" : undefined }}>
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
              <ReportView dailyState={selectedReport.dailyState} weeklyState={selectedReport.weeklyState} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

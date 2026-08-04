import React, { useEffect, useState } from "react";

const STORAGE_KEY = "uwu-stats-full-unlocked";

/**
 * Password box in front of /stats-full. Posts to /api/auth, which compares the
 * password to the one in the API's environment and answers OK or 401. Unlocking
 * is remembered for the tab so a refresh doesn't re-prompt.
 *
 * This hides the page, not the data — the /api/stats endpoints it reads are
 * public, so the numbers behind it are still fetchable directly.
 */
export default function StatsAuth({ children }) {
  const [unlocked, setUnlocked] = useState(
    () => window.sessionStorage.getItem(STORAGE_KEY) === "1"
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => document.head.removeChild(meta);
  }, []);

  async function submit(event) {
    event.preventDefault();
    setChecking(true);
    setError(null);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        window.sessionStorage.setItem(STORAGE_KEY, "1");
        setUnlocked(true);
      } else {
        setError("That password isn't right.");
      }
    } catch {
      setError("Couldn't reach the server.");
    }

    setChecking(false);
  }

  if (unlocked) return children;

  return (
    <div className="stats-auth">
      <h1>uwu bot stats</h1>
      <p>This page is private.</p>
      <form onSubmit={submit} className="stats-auth-form">
        <label htmlFor="stats-password">Password</label>
        <input
          id="stats-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button type="submit" disabled={checking || !password}>
          {checking ? "Checking…" : "Unlock"}
        </button>
      </form>
      {error ? <p className="stats-auth-error">{error}</p> : null}
    </div>
  );
}

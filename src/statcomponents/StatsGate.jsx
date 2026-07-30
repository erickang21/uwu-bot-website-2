import React, { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "uwu-stats-unlocked";

/**
 * Keeps /stats away from casual visitors: the route is unlinked, marked
 * noindex, and needs the key in REACT_APP_STATS_KEY.
 *
 * This is obscurity, not access control — the key ships in a public bundle, so
 * anyone determined can read it. The /api/stats endpoints are what actually need
 * to authenticate; this only stops the page turning up for people who wander in
 * or follow a search result.
 */
export default function StatsGate({ children }) {
  const expected = process.env.REACT_APP_STATS_KEY;
  const [unlocked, setUnlocked] = useState(false);
  const [entered, setEntered] = useState("");
  const [rejected, setRejected] = useState(false);

  const fromUrl = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("key");
  }, []);

  useEffect(() => {
    // Search engines should never index this route.
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => document.head.removeChild(meta);
  }, []);

  useEffect(() => {
    if (!expected) return;
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (stored === expected || fromUrl === expected) {
      window.sessionStorage.setItem(STORAGE_KEY, expected);
      setUnlocked(true);
    }
  }, [expected, fromUrl]);

  const submit = useCallback(
    (event) => {
      event.preventDefault();
      if (entered && entered === expected) {
        window.sessionStorage.setItem(STORAGE_KEY, entered);
        setUnlocked(true);
        setRejected(false);
      } else {
        setRejected(true);
      }
    },
    [entered, expected]
  );

  if (!expected) {
    return (
      <div className="stats-gate">
        <h1>Stats</h1>
        <p>
          This dashboard is locked. Set <code>REACT_APP_STATS_KEY</code> in the
          site&apos;s build environment to enable access.
        </p>
      </div>
    );
  }

  if (unlocked) return children;

  return (
    <div className="stats-gate">
      <h1>Stats</h1>
      <p>This dashboard is private.</p>
      <form onSubmit={submit} className="stats-gate-form">
        <label htmlFor="stats-key">Access key</label>
        <input
          id="stats-key"
          type="password"
          autoComplete="off"
          value={entered}
          onChange={(event) => setEntered(event.target.value)}
        />
        <button type="submit">Unlock</button>
      </form>
      {rejected ? <p className="stats-gate-error">That key isn&apos;t right.</p> : null}
    </div>
  );
}

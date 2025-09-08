// src/hooks/useAutoReloadOnVersion.ts
import { useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../components/firebase";

export function useAutoReloadOnVersion(currentVersion: number) {
  useEffect(() => {
    const ref = doc(db, "meta", "app"); // { version: number }
    const unsub = onSnapshot(ref, (snap) => {
      const remote = Number(snap.data()?.version);
      if (!Number.isFinite(remote)) return;

      // Already reloaded for this remote value this session? avoid loops
      const last = sessionStorage.getItem("lastReloadedForVersion");
      if (String(remote) === last) return;

      if (remote !== currentVersion) {
        const finish = () => {
          sessionStorage.setItem("lastReloadedForVersion", String(remote));
          const url = new URL(window.location.href);
          url.searchParams.set("v", String(remote)); // cache-bust
          window.location.replace(url.toString());
        };

        // Nudge service worker first (if any), then reload
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker
            .getRegistrations()
            .then((regs) => Promise.all(regs.map((r) => r.update())).catch(() => {}))
            .finally(finish);
        } else {
          finish();
        }
      }
    });

    return () => unsub();
  }, [currentVersion]);
}

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';

const HorrorThemeContext = createContext({ enabled: false, calm: false, setCalm: () => {} });

export const useHorrorTheme = () => useContext(HorrorThemeContext);

// The skin never applies to staff tooling: the admin panel and the scanner
// still carry hundreds of literal light-theme colours, and more importantly
// people run the door on a phone in a dark hall and need to read it.
const EXCLUDED_PREFIXES = ['/admin', '/scanner', '/team-scanner'];

const isExcludedPath = (pathname) =>
  EXCLUDED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

const readCalmPreference = () => {
  try {
    return localStorage.getItem('chalchitra-calm-mode') === '1';
  } catch (_err) {
    return false; // private mode / blocked storage
  }
};

export const HorrorThemeProvider = ({ children }) => {
  const [remoteEnabled, setRemoteEnabled] = useState(false);
  const [calm, setCalmState] = useState(readCalmPreference);
  // This provider sits inside the Router, so the router is the single source of
  // truth for the current path — no history patching, no listener to leak.
  const { pathname } = useLocation();

  // ?horror=1 / ?horror=0 previews the skin before it goes live for everyone.
  const override = useMemo(() => {
    const value = new URLSearchParams(window.location.search).get('horror');
    if (value === '1' || value === 'on') return true;
    if (value === '0' || value === 'off') return false;
    return null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.get('/api/admin/settings')
      .then((res) => {
        if (cancelled) return;
        // The skin is on for the Obsession run. Once the backend has armed it
        // (horror_theme_armed), the admin switch is the authority and is
        // obeyed exactly; until then default to on, so the run does not wait
        // on a backend restart to reach the site.
        const armed = Number(res.data?.horror_theme_armed) === 1;
        const switchedOn = Number(res.data?.horror_theme) === 1;
        setRemoteEnabled(armed ? switchedOn : true);
      })
      .catch(() => {
        if (!cancelled) setRemoteEnabled(false); // never break the site over a skin
      });
    return () => { cancelled = true; };
  }, []);

  const enabled = (override === null ? remoteEnabled : override)
    && !calm
    && !isExcludedPath(pathname);

  useEffect(() => {
    const root = document.documentElement;
    if (enabled) {
      root.setAttribute('data-horror', 'on');
    } else {
      root.removeAttribute('data-horror');
    }
    return () => root.removeAttribute('data-horror');
  }, [enabled]);

  const setCalm = useCallback((next) => {
    setCalmState(next);
    try {
      localStorage.setItem('chalchitra-calm-mode', next ? '1' : '0');
    } catch (_err) {
      /* preference simply will not persist */
    }
  }, []);

  const value = useMemo(
    () => ({ enabled, calm, setCalm, themeAvailable: override === null ? remoteEnabled : override }),
    [enabled, calm, setCalm, override, remoteEnabled]
  );

  return (
    <HorrorThemeContext.Provider value={value}>
      {children}
    </HorrorThemeContext.Provider>
  );
};

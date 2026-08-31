/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export const FOCUS_MODE_STORAGE_KEY = 'CS_CBT_FOCUS_MODE';
export const FOCUS_MODE_EVENT_NAME = 'cs-cbt-focus-mode-toggle';

export function getFocusMode(): boolean {
  try {
    return localStorage.getItem(FOCUS_MODE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setFocusMode(enabled: boolean, notify = true): void {
  try {
    localStorage.setItem(FOCUS_MODE_STORAGE_KEY, String(enabled));
    window.dispatchEvent(new CustomEvent(FOCUS_MODE_EVENT_NAME, { detail: { enabled } }));
    if (notify) {
      if (enabled) {
        toast.success("🎯 Focus Mode Activated: Sidebars & navigation headers are hidden.", {
          description: "Distractions minimized and accidental navigation prevented. Press Esc or click Exit anytime.",
          duration: 4000
        });
      } else {
        toast.info("Focus Mode Exited: Navigation headers and sidebars restored.", {
          duration: 2500
        });
      }
    }
  } catch (err) {
    console.error("Failed to update focus mode:", err);
  }
}

export function toggleFocusModeGlobal(): boolean {
  const current = getFocusMode();
  const next = !current;
  setFocusMode(next, true);
  return next;
}

export function useFocusMode() {
  const [isFocusMode, setIsFocusModeState] = useState<boolean>(() => getFocusMode());

  useEffect(() => {
    const handleEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ enabled?: boolean }>;
      const enabled = customEvent.detail?.enabled !== undefined ? Boolean(customEvent.detail.enabled) : getFocusMode();
      setIsFocusModeState(enabled);
    };

    window.addEventListener(FOCUS_MODE_EVENT_NAME, handleEvent);
    
    // Also sync across storage changes if any
    const handleStorage = (e: StorageEvent) => {
      if (e.key === FOCUS_MODE_STORAGE_KEY) {
        setIsFocusModeState(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(FOCUS_MODE_EVENT_NAME, handleEvent);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const toggleFocus = useCallback(() => {
    return toggleFocusModeGlobal();
  }, []);

  const enableFocus = useCallback(() => {
    setFocusMode(true, true);
  }, []);

  const disableFocus = useCallback(() => {
    setFocusMode(false, true);
  }, []);

  return {
    isFocusMode,
    toggleFocusMode: toggleFocus,
    enableFocusMode: enableFocus,
    disableFocusMode: disableFocus
  };
}

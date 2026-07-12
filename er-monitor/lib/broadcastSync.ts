"use client";

/**
 * Cross-tab/cross-window sync so the Admin dashboard (often opened in a
 * separate tab) and the Student Monitor share live state.
 *
 * Zustand state alone does NOT sync across browser tabs because each tab
 * has its own JS heap. This module bridges tabs using BroadcastChannel
 * (with a localStorage fallback for older browsers).
 */

type Listener = (payload: any) => void;

const CHANNEL_NAME = "icu-monitor-sync";

class SyncBus {
  private channel: BroadcastChannel | null = null;
  private listeners: Listener[] = [];

  constructor() {
    if (typeof window === "undefined") return;

    if ("BroadcastChannel" in window) {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (e) => this.listeners.forEach((l) => l(e.data));
    } else {
      window.addEventListener("storage", (e) => {
        if (e.key === CHANNEL_NAME && e.newValue) {
          try {
            this.listeners.forEach((l) => l(JSON.parse(e.newValue as string)));
          } catch {}
        }
      });
    }
  }

  publish(payload: any) {
    if (typeof window === "undefined") return;
    if (this.channel) {
      this.channel.postMessage(payload);
    } else {
      localStorage.setItem(CHANNEL_NAME, JSON.stringify({ ...payload, _t: Date.now() }));
    }
  }

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}

export const syncBus = new SyncBus();

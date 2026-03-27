"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const ECOSYSTEM_LINKS = [
  { label: "Arthur Labs", href: "https://arthurlabs.net", key: "arthurlabs" },
  { label: "Builder", href: "https://builder.arthurlabs.net", key: "builder" },
  { label: "Docs", href: "https://docs.arthurlabs.net", key: "docs" },
  {
    label: "Crypto Tax",
    href: "https://crypto.arthurlabs.net",
    key: "crypto",
  },
  {
    label: "Podcast",
    href: "https://podcast.arthurlabs.net",
    key: "podcast",
  },
  {
    label: "Whitepaper",
    href: "https://whitepaper.arthurlabs.net",
    key: "whitepaper",
  },
  { label: "HIIE", href: "https://hiie.arthurlabs.net", key: "hiie" },
  { label: "Links", href: "https://links.arthurlabs.net", key: "links" },
] as const;

/** Minimum upward scroll velocity (px per event) to trigger reveal */
const SCROLL_UP_THRESHOLD = 30;
/** How long (ms) after the user stops scrolling up before we hide */
const HIDE_DELAY = 2500;

/**
 * Detect the current site from the hostname to highlight the active link.
 * Returns the key of the matching ecosystem link, or null.
 */
function detectCurrentSite(): string | null {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname;
  for (const link of ECOSYSTEM_LINKS) {
    try {
      const linkHost = new URL(link.href).hostname;
      if (host === linkHost) return link.key;
    } catch {
      // skip
    }
  }
  return null;
}

export default function EcosystemBar() {
  const [visible, setVisible] = useState(false);
  const [currentSite, setCurrentSite] = useState<string | null>(null);

  const lastScrollY = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoad = useRef(true);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), HIDE_DELAY);
  }, []);

  const cancelHide = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  useEffect(() => {
    setCurrentSite(detectCurrentSite());

    // Ignore the very first scroll events so the bar never flashes on page load
    const initialTimeout = setTimeout(() => {
      isInitialLoad.current = false;
    }, 500);

    return () => clearTimeout(initialTimeout);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = lastScrollY.current - currentY; // positive = scrolling up

      if (isInitialLoad.current) {
        lastScrollY.current = currentY;
        return;
      }

      if (delta > SCROLL_UP_THRESHOLD) {
        // User is intentionally scrolling up
        setVisible(true);
        cancelHide();
        scheduleHide();
      } else if (delta < -5) {
        // User is scrolling down — hide immediately
        setVisible(false);
        cancelHide();
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [cancelHide, scheduleHide]);

  return (
    <div
      role="navigation"
      aria-label="Arthur Labs ecosystem"
      onMouseEnter={cancelHide}
      onMouseLeave={() => visible && scheduleHide()}
      className="ecosystem-bar"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        transform: visible ? "translateY(0)" : "translateY(-100%)",
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        willChange: "transform",
      }}
    >
      <div
        style={{
          height: 34,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--_eb-border)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          backgroundColor: "var(--_eb-bg)",
          opacity: 0.97,
        }}
      >
        {/* Scrollable container for small screens */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            overflowX: "auto",
            overflowY: "hidden",
            maxWidth: "100%",
            paddingLeft: 12,
            paddingRight: 12,
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          className="ecosystem-bar-scroll"
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--_eb-muted)",
              whiteSpace: "nowrap",
              marginRight: 6,
              letterSpacing: "0.03em",
              fontFamily: "system-ui, -apple-system, sans-serif",
              userSelect: "none",
              flexShrink: 0,
            }}
          >
            View our full ecosystem
          </span>

          <span
            style={{
              width: 1,
              height: 14,
              backgroundColor: "var(--_eb-border)",
              flexShrink: 0,
              marginLeft: 4,
              marginRight: 4,
            }}
            aria-hidden="true"
          />

          {ECOSYSTEM_LINKS.map((link) => {
            const isActive = link.key === currentSite;
            return (
              <a
                key={link.key}
                href={link.href}
                style={{
                  fontSize: 11,
                  lineHeight: "34px",
                  whiteSpace: "nowrap",
                  paddingLeft: 8,
                  paddingRight: 8,
                  borderRadius: 4,
                  color: isActive
                    ? "var(--_eb-fg)"
                    : "var(--_eb-muted)",
                  fontWeight: isActive ? 600 : 400,
                  textDecoration: "none",
                  transition: "color 0.15s, background-color 0.15s",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  flexShrink: 0,
                  backgroundColor: isActive
                    ? "var(--_eb-accent)"
                    : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "var(--_eb-fg)";
                    e.currentTarget.style.backgroundColor = "var(--_eb-accent)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "var(--_eb-muted)";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                {link.label}
              </a>
            );
          })}
        </div>

        <a
          href="https://builder.arthurlabs.net/contact"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 11,
            lineHeight: "34px",
            whiteSpace: "nowrap",
            paddingLeft: 12,
            paddingRight: 12,
            borderRadius: 4,
            color: "var(--_eb-muted)",
            fontWeight: 500,
            textDecoration: "none",
            transition: "color 0.15s, background-color 0.15s",
            fontFamily: "system-ui, -apple-system, sans-serif",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--_eb-fg)";
            e.currentTarget.style.backgroundColor = "var(--_eb-accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--_eb-muted)";
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          Contact Us
        </a>
      </div>

      <style>{`
        .ecosystem-bar {
          --_eb-bg: #ffffff;
          --_eb-fg: #0a0a0a;
          --_eb-muted: #6b7280;
          --_eb-border: #e5e7eb;
          --_eb-accent: #f3f4f6;
        }
        @media (prefers-color-scheme: dark) {
          .ecosystem-bar {
            --_eb-bg: #0a0a0a;
            --_eb-fg: #ededed;
            --_eb-muted: #9ca3af;
            --_eb-border: #27272a;
            --_eb-accent: #1f1f23;
          }
        }
        .dark .ecosystem-bar,
        html.dark .ecosystem-bar,
        [data-theme="dark"] .ecosystem-bar {
          --_eb-bg: #0a0a0a;
          --_eb-fg: #ededed;
          --_eb-muted: #9ca3af;
          --_eb-border: #27272a;
          --_eb-accent: #1f1f23;
        }
        .ecosystem-bar-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";

interface ReaderProps {
  text: string;
  initialWpm: number;
  onExit: () => void;
}

export default function Reader({ text, initialWpm, onExit }: ReaderProps) {
  const [index, setIndex] = useState(0);
  const [wpm, setWpm] = useState(initialWpm);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isFixedWpm, setIsFixedWpm] = useState(false);
  const [skipToValue, setSkipToValue] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const wpmRef = useRef(wpm);
  const isPausedRef = useRef(isPaused);
  const isFixedWpmRef = useRef(isFixedWpm);
  const indexRef = useRef(index);
  const lastSpeedIncreaseRef = useRef<number>(0);
  const maxWpm = 400;
  const longWordThreshold = 8;
  const longWordPauseMs = 300;

  // Check for mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Extract main content, removing nav/footer junk
  const extractMainContent = useCallback((text: string): string[] => {
    const lines = text.split("\n");

    const stockDomains = [
      "shutterstock",
      "gettyimages",
      "istockphoto",
      "adobestock",
      "dreamstime",
      "depositphotos",
      "alamy",
      "123rf",
      "stockphoto",
      "bigstock",
      "fotolia",
      "pixabay",
      "unsplash",
      "pexels",
      "flickr",
    ];
    const stockPattern = new RegExp(stockDomains.join("|"), "i");

    const skipLinePattern =
      /^(menu|nav|skip|toggle|search|login|sign.?in|sign.?up|register|subscribe|log.?out|cart|checkout|home|about|contact|services|products|pricing|blog|news|faq|help|support|copyright|©|all.rights.reserved|privacy|policy|terms|conditions|cookie|sitemap|facebook|twitter|instagram|linkedin|youtube|tiktok|pinterest|reddit|email|share|follow|previous|next|back|forward|submit|cancel|close|open|expand|collapse|show|hide|view|more|less|loading|please.wait|advertisement|sponsored|ad|promoted|related|popular|trending|recommended)$/i;

    const filteredLines: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.includes("©") || trimmed.toLowerCase().includes("copyright"))
        continue;
      if (stockPattern.test(trimmed)) continue;

      const wordsInLine = trimmed.split(/\s+/);
      if (wordsInLine.length <= 3) {
        if (skipLinePattern.test(trimmed.replace(/\s+/g, ""))) continue;
        if (trimmed.length < 20 && !/[.?!,;:]/.test(trimmed)) continue;
      }
      filteredLines.push(trimmed);
    }

    const allWords = filteredLines.join(" ").split(/\s+/);

    const skipWordPattern =
      /^(menu|nav|home|about|contact|login|logout|signin|signup|register|subscribe|search|skip|toggle|close|open|cart|checkout|facebook|twitter|instagram|linkedin|youtube|tiktok|pinterest|share|follow|like|comment|reply|copyright|privacy|terms|cookie|sitemap|previous|next|back|submit|cancel|loading|advertisement|sponsored|ad|promoted|related|trending|recommended|suggested|popular|click|tap|here|read.?more|learn.?more|see.?more|view.?all|show.?more|load.?more)$/i;

    const cleaned: string[] = [];
    let inContent = false;
    let junkStreak = 0;

    for (let i = 0; i < allWords.length; i++) {
      const word = allWords[i];
      if (stockPattern.test(word)) continue;
      if (word.includes("©")) continue;

      const cleanWord = word.replace(/[^\w]/g, "").toLowerCase();
      const isJunk =
        skipWordPattern.test(cleanWord) ||
        (cleanWord.length <= 1 && !["a", "i"].includes(cleanWord));

      if (isJunk) {
        junkStreak++;
        if (!inContent) continue;
        if (junkStreak > 10 && cleaned.length > 50) {
          const lookahead = allWords.slice(i, i + 20);
          const junkCount = lookahead.filter((w) =>
            skipWordPattern.test(w.replace(/[^\w]/g, "").toLowerCase()),
          ).length;
          if (junkCount > 10) break;
        }
      } else {
        junkStreak = 0;
        if (!inContent) {
          if (
            word.length > 3 ||
            [
              "the",
              "a",
              "an",
              "is",
              "are",
              "was",
              "were",
              "has",
              "have",
              "had",
              "this",
              "that",
              "these",
              "those",
            ].includes(word.toLowerCase())
          ) {
            inContent = true;
          }
        }
      }

      if (inContent) {
        cleaned.push(word);
      }
    }

    return cleaned.length > 20 ? cleaned : allWords;
  }, []);

  const getOrpIndex = (word: string): number => {
    const clean = word.replace(/[^\w]/g, "");
    const length = clean.length;
    if (length <= 1) return 0;
    if (length <= 3) return 1;
    if (length <= 5) return 1;
    if (length <= 9) return 2;
    if (length <= 13) return 3;
    return 4;
  };

  // Use useMemo instead of useEffect to derive words from text
  const words = useMemo(() => {
    return extractMainContent(text);
  }, [text, extractMainContent]);

  // Keep wordsRef in sync
  const wordsRef = useRef(words);
  useEffect(() => {
    wordsRef.current = words;
  }, [words]);

  // Derive status from state instead of using an effect
  const status = useMemo(() => {
    if (isFinished) return "COMPLETE";
    if (isPaused) return "PAUSED • Press SPACE to resume";
    return "";
  }, [isPaused, isFinished]);

  useEffect(() => {
    wpmRef.current = wpm;
  }, [wpm]);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);
  useEffect(() => {
    isFixedWpmRef.current = isFixedWpm;
  }, [isFixedWpm]);
  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  // Main reading loop
  useEffect(() => {
    if (words.length === 0 || isFinished) return;

    let timeoutId: NodeJS.Timeout;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;

      // If paused, just check again soon
      if (isPausedRef.current) {
        timeoutId = setTimeout(tick, 50);
        return;
      }

      // Get current index from ref
      const currentIndex = indexRef.current;
      const currentWords = wordsRef.current;

      // Check if finished
      if (currentIndex >= currentWords.length - 1) {
        setIsFinished(true);
        return;
      }

      // Advance to next word
      const nextIndex = currentIndex + 1;
      setIndex(nextIndex);
      indexRef.current = nextIndex;

      // Calculate delay for the word we just moved to
      const currentWord = currentWords[nextIndex];
      const cleanWord = currentWord?.replace(/[^\w]/g, "") || "";
      const baseDelay = 60000 / wpmRef.current;
      const extraPause =
        cleanWord.length > longWordThreshold ? longWordPauseMs : 0;
      const totalDelay = baseDelay + extraPause;

      // Auto speed increase (every 2 seconds, +3 WPM)
      if (!isFixedWpmRef.current && wpmRef.current < maxWpm) {
        const now = Date.now();
        if (now - lastSpeedIncreaseRef.current >= 2000) {
          const newWpm = Math.min(maxWpm, wpmRef.current + 3);
          setWpm(newWpm);
          wpmRef.current = newWpm;
          lastSpeedIncreaseRef.current = now;
        }
      }

      // Schedule next tick
      timeoutId = setTimeout(tick, totalDelay);
    };

    // Start with initial delay
    const initialDelay = 60000 / wpmRef.current;
    timeoutId = setTimeout(tick, initialDelay);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [words, isFinished]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          setIsPaused((prev) => !prev);
          break;
        case "ArrowRight":
          e.preventDefault();
          setIndex((prev) => Math.min(words.length - 1, prev + 1));
          break;
        case "ArrowLeft":
          e.preventDefault();
          setIndex((prev) => Math.max(0, prev - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setWpm((prev) => Math.min(1500, prev + 50));
          break;
        case "ArrowDown":
          e.preventDefault();
          setWpm((prev) => Math.max(50, prev - 50));
          break;
        case "Escape":
          e.preventDefault();
          onExit();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [words.length, onExit]);

  const handleRestart = () => {
    setIndex(0);
    indexRef.current = 0;
    setIsPaused(false);
    setIsFinished(false);
    lastSpeedIncreaseRef.current = Date.now();
  };

  const handleSkipTo = () => {
    const target = parseInt(skipToValue) - 1;
    if (target >= 0 && target < words.length) {
      setIndex(target);
      indexRef.current = target;
      setSkipToValue("");
    }
  };

  // Mobile warning screen
  if (isMobile) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-8">
        <p
          className="text-white text-xl text-center mb-12"
          style={{ fontFamily: "Times New Roman, serif" }}
        >
          Please use Desktop for the best experience
        </p>
        <Link href="https://arthurlabs.net/">
          <Image
            src="/logo.png"
            alt="Arthur Labs"
            width={48}
            height={48}
            className="opacity-70 hover:opacity-100 transition-opacity"
          />
        </Link>
      </main>
    );
  }

  // Get current word parts
  const currentWord = words[index] || "";
  const orpIndex = getOrpIndex(currentWord);
  const beforeOrp = currentWord.slice(0, orpIndex);
  const orpChar = currentWord[orpIndex] || "";
  const afterOrp = currentWord.slice(orpIndex + 1);

  // Context words
  const contextBefore = words.slice(Math.max(0, index - 3), index);
  const contextAfter = words.slice(index + 1, index + 4);

  while (contextBefore.length < 3) contextBefore.unshift("");
  while (contextAfter.length < 3) contextAfter.push("");

  const progress = words.length > 0 ? ((index + 1) / words.length) * 100 : 0;

  const truncateWord = (word: string, max: number = 12) => {
    return word.length > max ? word.slice(0, max) : word;
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Progress bar with logo */}
      <div className="px-10 pt-6 flex items-center gap-6">
        <div className="flex-1">
          <div className="h-1 bg-[#141414] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#ff3b3b] transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p
            className="text-[#4a4a4a] text-center mt-3"
            style={{ fontFamily: "Times New Roman, serif" }}
          >
            {index + 1} / {words.length} • {Math.round(progress)}%
          </p>
        </div>
        <Link href="https://arthurlabs.net/" className="flex-shrink-0">
          <Image
            src="/logo.png"
            alt="Arthur Labs"
            width={48}
            height={48}
            className="opacity-50 hover:opacity-100 transition-opacity"
          />
        </Link>
      </div>

      {/* Word display area - FULL WIDTH */}
      <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
        <div className="text-center w-full px-4">
          {/* Focal line top */}
          <div className="w-0.5 h-8 bg-[#2a2a2a] mx-auto mb-2" />

          {/* Words row - ALL SAME SIZE, full width */}
          <div className="flex items-center justify-center w-full">
            {/* Context before */}
            <div className="flex justify-end flex-1 gap-6 pr-6">
              {contextBefore.map((word, i) => (
                <span
                  key={`before-${i}`}
                  className="text-[#2a2a2a] min-w-[100px] text-right"
                  style={{
                    fontFamily: "Times New Roman, serif",
                    fontSize: "42px",
                  }}
                >
                  {truncateWord(word)}
                </span>
              ))}
            </div>

            {/* Main word - center anchor */}
            <div className="flex-shrink-0 min-w-[200px] text-center">
              <span
                style={{
                  fontFamily: "Times New Roman, serif",
                  fontSize: "42px",
                }}
              >
                <span className="text-white">{beforeOrp}</span>
                <span className="text-[#ff3b3b]">{orpChar}</span>
                <span className="text-white">{afterOrp}</span>
              </span>
            </div>

            {/* Context after */}
            <div className="flex justify-start flex-1 gap-6 pl-6">
              {contextAfter.map((word, i) => (
                <span
                  key={`after-${i}`}
                  className="text-[#2a2a2a] min-w-[100px] text-left"
                  style={{
                    fontFamily: "Times New Roman, serif",
                    fontSize: "42px",
                  }}
                >
                  {truncateWord(word)}
                </span>
              ))}
            </div>
          </div>

          {/* Focal line bottom */}
          <div className="w-0.5 h-8 bg-[#2a2a2a] mx-auto mt-2" />

          {/* Status */}
          <p
            className="text-[#ff3b3b] mt-6 h-6"
            style={{ fontFamily: "Times New Roman, serif", fontSize: "16px" }}
          >
            {status}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-[#141414] py-6 px-8">
        {/* Row 1: Playback */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <button
            onClick={handleRestart}
            className="px-5 py-2.5 bg-[#0a0a0a] text-[#4a4a4a] hover:text-white rounded transition-colors"
            style={{ fontFamily: "Times New Roman, serif" }}
          >
            RESTART
          </button>
          <button
            onClick={() => {
              const newIndex = Math.max(0, index - 1);
              setIndex(newIndex);
              indexRef.current = newIndex;
            }}
            className="px-5 py-2.5 bg-[#0a0a0a] text-[#4a4a4a] hover:text-white rounded transition-colors"
            style={{ fontFamily: "Times New Roman, serif" }}
          >
            ← BACK
          </button>
          <button
            onClick={() => setIsPaused((prev) => !prev)}
            className={`px-8 py-2.5 rounded font-bold transition-colors ${
              isPaused
                ? "bg-[#4a4a4a] text-white hover:bg-[#5a5a5a]"
                : "bg-[#ff3b3b] text-white hover:bg-[#ff6b4a]"
            }`}
            style={{ fontFamily: "Times New Roman, serif" }}
          >
            {isPaused ? "▶ PLAY" : "⏸ PAUSE"}
          </button>
          <button
            onClick={() => {
              const newIndex = Math.min(words.length - 1, index + 1);
              setIndex(newIndex);
              indexRef.current = newIndex;
            }}
            className="px-5 py-2.5 bg-[#0a0a0a] text-[#4a4a4a] hover:text-white rounded transition-colors"
            style={{ fontFamily: "Times New Roman, serif" }}
          >
            NEXT →
          </button>
          <button
            onClick={onExit}
            className="px-5 py-2.5 bg-[#0a0a0a] text-[#4a4a4a] hover:text-white rounded transition-colors"
            style={{ fontFamily: "Times New Roman, serif" }}
          >
            EXIT
          </button>
        </div>

        <div className="flex items-center justify-center gap-4">
          <label
            className="text-[#4a4a4a] text-sm"
            style={{ fontFamily: "Times New Roman, serif" }}
          >
            WPM
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWpm((prev) => Math.max(25, prev - 25))}
              className="w-11 h-11 bg-[#0a0a0a] text-[#4a4a4a] hover:text-white rounded text-xl transition-colors flex items-center justify-center"
              style={{ fontFamily: "Times New Roman, serif" }}
            >
              −
            </button>

            <div className="text-center">
              <input
                type="number"
                value={wpm}
                onChange={(e) => {
                  setWpm(
                    Math.max(
                      25,
                      Math.min(1500, parseInt(e.target.value) || 300),
                    ),
                  );
                  setIsFixedWpm(true);
                }}
                className="w-20 h-11 bg-[#0a0a0a] text-white text-center rounded border border-[#252525] focus:outline-none focus:border-[#ff3b3b]"
                style={{ fontFamily: "Times New Roman, serif" }}
              />
            </div>

            <button
              onClick={() => setWpm((prev) => Math.min(1500, prev + 25))}
              className="w-11 h-11 bg-[#0a0a0a] text-[#4a4a4a] hover:text-white rounded text-xl transition-colors flex items-center justify-center"
              style={{ fontFamily: "Times New Roman, serif" }}
            >
              +
            </button>

            <label className="flex items-center gap-2 text-[#4a4a4a] ml-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isFixedWpm}
                onChange={(e) => setIsFixedWpm(e.target.checked)}
                className="w-4 h-4 accent-[#ff3b3b]"
              />
              <span
                style={{
                  fontFamily: "Times New Roman, serif",
                  fontSize: "14px",
                }}
              >
                FIXED
              </span>
            </label>
          </div>

          {/* Skip to */}
          <div className="flex items-center gap-2">
            <label
              className="text-[#4a4a4a] text-sm mr-1"
              style={{ fontFamily: "Times New Roman, serif" }}
            >
              SKIP TO #
            </label>
            <input
              type="number"
              value={skipToValue}
              onChange={(e) => setSkipToValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSkipTo()}
              className="w-24 h-11 bg-[#0a0a0a] text-white text-center rounded border border-[#252525] focus:outline-none focus:border-[#ff3b3b]"
              style={{ fontFamily: "Times New Roman, serif" }}
            />
            <button
              onClick={handleSkipTo}
              className="h-11 px-5 bg-[#0a0a0a] text-[#4a4a4a] hover:text-white rounded transition-colors"
              style={{ fontFamily: "Times New Roman, serif" }}
            >
              GO
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

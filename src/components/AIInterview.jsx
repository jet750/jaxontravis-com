import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import styles from './AIInterview.module.css';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useVoiceMode } from '../hooks/useVoiceMode';
import VoiceModeUI from './VoiceModeUI';
import { trackEvent } from '../lib/analytics';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OPENER   = { role: 'user', content: 'Please begin.' };

// Dev-only gate bypass: type these letters in order (within 2s of each other)
// while the gate is showing to skip the form. Keyboard-only, no UI affordance.
const DEV_KEY_SEQUENCE = ['j', 't', 'd', 'e', 'v'];

// Starter prompt tiles. `label` is the chip text the recruiter sees; `message`
// is the question actually sent to the AI when the chip is clicked.
const STARTER_PROMPTS = [
  {
    label:   'How do you fit this role?',
    message: 'Walk me through how your background fits the job description.',
  },
  {
    label:   'What strengths would you bring?',
    message: 'What specific strengths would you bring to this role?',
  },
  {
    label:   'How have you translated founder vision into systems?',
    message: 'What experience do you have translating founder vision into actionable systems?',
  },
  {
    label:   'Tell me about your side projects.',
    message: "Tell me about the projects you're working on outside of your day job.",
  },
];

const PREVIEW_MESSAGES = [
  {
    role: 'assistant',
    content:
      "Hi, I'm the AI trained on Jaxon's full background. I see you're considering him for a RevOps role — let me walk you through the strongest alignments before you ask questions.",
  },
  {
    role: 'user',
    content: 'What CRM platforms has he actually built in, not just used?',
  },
  {
    role: 'assistant',
    content:
      "He's built from a blank instance three times: Salesforce at Springbig, Zoho at NACB, and Membrain at HŪMNZ — each from first principles including pipeline architecture, stage logic, and workflow automation.",
  },
];

function renderMarkdown(text) {
  if (!text) return '';

  // Escape raw HTML before applying markdown transforms
  // Prevents XSS via model-echoed recruiter input
  text = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return text
    // Inline code: `code` — runs first so backtick content is extracted
    // before any emphasis regex can touch it
    .replace(/`([^`]+)`/g,
      '<code style="background:rgba(255,255,255,0.08);' +
      'padding:2px 6px;border-radius:3px;font-family:' +
      'var(--font-mono);font-size:0.9em;">$1</code>')
    // Bold: **text** or __text__
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    // Italic: *text* or _text_ (single, not double). Underscore italic uses a
    // GitHub-style intraword rule — only matches when the underscores are bounded
    // by whitespace/start/end, so snake_case and URLs are left untouched.
    .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    .replace(/(^|\s)_([^_]+?)_(\s|$)/g, '$1<em>$2</em>$3')
    // Line breaks: double newline → paragraph break,
    // single newline → <br>
    .replace(/\n\n/g, '</p><p style="margin:0 0 8px;">')
    .replace(/\n/g, '<br>');
}

export default function AIInterview() {
  // ── Gate form ──────────────────────────────────────
  const [name,            setName]           = useState('');
  const [company,         setCompany]        = useState('');
  const [email,           setEmail]          = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // ── JD input ───────────────────────────────────────
  const [jobUrl,      setJobUrl]      = useState('');
  const [jobText,     setJobText]     = useState('');
  const [fetchStatus, setFetchStatus] = useState('idle'); // idle|fetching|done|error
  const [showPaste,   setShowPaste]   = useState(false);

  // ── JD pre-analysis (personalization layer) ────────
  const [jdAnalysis,     setJdAnalysis]     = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState('idle'); // idle|analyzing|done|error
  const lastAnalyzedRef  = useRef('');                           // dedupe: last JD text we analyzed

  // ── Chat ───────────────────────────────────────────
  const [chatOpen,       setChatOpen]       = useState(false);
  const [messages,       setMessages]       = useState([]);
  const [chatInput,      setChatInput]      = useState('');
  const [isStreaming,    setIsStreaming]     = useState(false);
  const [isScrolledUp,   setIsScrolledUp]    = useState(false); // mirrors userScrolledUpRef for the scroll-to-latest button
  const [transcriptSent, setTranscriptSent] = useState(false);
  const [emailStatus,    setEmailStatus]    = useState('idle'); // 'idle'|'sending'|'sent'|'error'
  const [ccEmail,        setCcEmail]        = useState('');     // optional extra recipient for manual send
  const [ccError,        setCcError]        = useState(false);

  // ── Voice mode (additive layer over the text chat) ─
  const [voiceModeActive,    setVoiceModeActive]    = useState(false);
  const [lastAIMessage,      setLastAIMessage]      = useState('');
  const [lastAIMessageShort, setLastAIMessageShort] = useState('');

  const scrollAnchorRef   = useRef(null);  // invisible end-of-list anchor we scroll into view
  const chatInputRef      = useRef(null);
  const messageListRef    = useRef(null);  // scrollable message container (smart auto-scroll)
  const userScrolledUpRef = useRef(false); // true when the user scrolled up mid-stream; pauses auto-scroll
  const scrollThrottleRef = useRef(null);  // throttles the scroll-position check to ~100ms
  const tokenBufferRef    = useRef('');    // rAF buffer: SSE tokens accumulated between paints
  const rafScheduledRef   = useRef(false); // rAF buffer: a flush is already queued for this frame
  const rafIdRef          = useRef(null);  // rAF buffer: id of the pending frame (for cancellation)
  const usedPromptsRef    = useRef(new Set()); // starter prompt labels already clicked
  const idleTimerRef      = useRef(null);
  const devKeyBufferRef   = useRef([]);    // dev gate bypass: rolling buffer of recent key presses
  const devKeyTimerRef    = useRef(null);  // dev gate bypass: clears the buffer after inactivity
  const tapCountRef       = useRef(0);     // dev gate bypass (mobile): eyebrow tap counter
  const tapTimerRef       = useRef(null);  // dev gate bypass (mobile): resets the tap counter
  const transcriptSentRef = useRef(false); // mirrors transcriptSent for non-reactive contexts
  const latestPayloadRef  = useRef(null);  // always holds the most recent sendable payload
  // Mirrors for the streaming completion path (streamChat reads these without
  // having to take voiceModeActive / speakText as reactive deps).
  const voiceModeActiveRef = useRef(false);
  const speakTextRef       = useRef(null);
  // Voice mode: guards the one-time first-sentence TTS trigger during streaming
  // so the post-stream auto-read doesn't double-speak the same reply.
  const firstSentenceSentRef = useRef(false);

  // Scroll-reveal — shared ref works across gate↔chat view transitions
  // because revealed stays true once set (re-render keeps the truthy state)
  const [containerRef, revealed] = useScrollReveal();

  // ── Voice mode hook ─────────────────────────────────
  // Voice input flows through the SAME sendMessage path as typed input, so it
  // appears in the transcript as a normal user message with no extra handling.
  const {
    isListening,
    isSpeaking,
    voiceSupported,
    transcript,
    startListening,
    stopListening,
    stopSpeaking,
    speakText,
    toggleVoiceMode: toggleVoiceHook,
  } = useVoiceMode({
    onTranscriptComplete: (text) => {
      if (text.trim()) sendMessage(text.trim());
    },
  });

  const handleToggleVoiceMode = () => {
    const enabling = !voiceModeActive;
    setVoiceModeActive(enabling);
    toggleVoiceHook(); // keep the hook's session state in sync for full teardown
    if (enabling) {
      trackEvent('voice_mode_activated', {});
    } else {
      stopSpeaking(); // leaving voice mode silences any in-progress TTS
    }
  };

  const handleHearFullResponse = () => {
    if (lastAIMessage) {
      stopSpeaking();
      speakText(lastAIMessage, lastAIMessage);
    }
  };

  // Keep refs current so streamChat's completion path sees the latest values
  // without re-creating the streaming callback.
  useEffect(() => { voiceModeActiveRef.current = voiceModeActive; }, [voiceModeActive]);
  useEffect(() => { speakTextRef.current = speakText; }, [speakText]);

  // OPENER is never pushed into the messages display array, so any role:'user'
  // entry here is a real recruiter question — safe to use as the gating condition.
  const hasRealUserMsg = messages.some(m => m.role === 'user');

  // ── Existing effects ────────────────────────────────

  // Detect when the user manually scrolls up during streaming — disable
  // auto-scroll until the next message send so they can read freely.
  // Depends on chatOpen so the listener (re)attaches when the chat view —
  // and therefore the scrollable messageList div — actually mounts.
  useEffect(() => {
    const el = messageListRef.current;
    if (!el) return;

    // Throttle the position check to ~100ms so it doesn't run on every scroll pixel.
    function handleScroll() {
      if (scrollThrottleRef.current) return;
      scrollThrottleRef.current = setTimeout(() => {
        scrollThrottleRef.current = null;
        // "Scrolled up" once the user is more than 50px from the bottom.
        const scrolledUp = el.scrollTop + el.clientHeight < el.scrollHeight - 50;
        userScrolledUpRef.current = scrolledUp;
        setIsScrolledUp(scrolledUp);
      }, 100);
    }

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollThrottleRef.current);
      scrollThrottleRef.current = null;
    };
  }, [chatOpen]);

  // NOTE: auto-scroll is no longer a [messages] effect. It now runs inside the
  // rAF token-buffer flush (streamChat) and on user send, so it stays synced to
  // the paint cycle and respects userScrolledUpRef.

  // Focus chat input when streaming ends
  useEffect(() => {
    if (chatOpen && !isStreaming) chatInputRef.current?.focus();
  }, [chatOpen, isStreaming]);

  // Dev gate bypass — listen for the "jtdev" key sequence while the gate is
  // showing. Sequential presses (cheat-code style), buffer self-clears after 2s.
  useEffect(() => {
    function handleDevKey(e) {
      // Only active while the gate is showing — never during an open chat.
      if (chatOpen) return;

      const key = e.key.toLowerCase();
      // Only track keys that belong to the sequence.
      if (!DEV_KEY_SEQUENCE.includes(key)) return;

      devKeyBufferRef.current.push(key);

      // Reset the buffer after 2s of inactivity.
      clearTimeout(devKeyTimerRef.current);
      devKeyTimerRef.current = setTimeout(() => {
        devKeyBufferRef.current = [];
      }, 2000);

      // Match against the tail of the buffer so leading noise doesn't block it.
      const buf = devKeyBufferRef.current;
      const seq = DEV_KEY_SEQUENCE;
      const matches =
        buf.length >= seq.length &&
        buf.slice(-seq.length).every((k, i) => k === seq[i]);

      if (matches) {
        devKeyBufferRef.current = [];
        clearTimeout(devKeyTimerRef.current);
        activateDevBypass();
      }
    }

    window.addEventListener('keydown', handleDevKey);
    return () => {
      window.removeEventListener('keydown', handleDevKey);
      clearTimeout(devKeyTimerRef.current);
    };
    // chatOpen is the only gate; activateDevBypass reads live state via setters,
    // so it needn't re-bind the listener.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatOpen]);

  // showPostCta is derived: no effect or state needed.
  const showPostCta = messages.filter(m => m.role === 'assistant' && m.content).length >= 3;

  // ── Starter prompt visibility ──────────────────────
  // Turn count = completed back-and-forth exchanges; each real user message
  // marks one turn. Turn 0: show all 4. Turns 1–3: only unused. Turn 4+: none.
  // Never during streaming. Hidden once all 4 have been used.
  const userTurnCount    = messages.filter(m => m.role === 'user').length;
  const availablePrompts = STARTER_PROMPTS.filter(p => !usedPromptsRef.current.has(p.label));
  const showStarterPrompts =
    chatOpen && !isStreaming && userTurnCount < 4 && availablePrompts.length > 0;

  // ── Transcript send function ───────────────────────
  // useCallback with [] is correct: all reads go through refs (latestPayloadRef,
  // transcriptSentRef) and all state setters are stable across renders.
  const doSend = useCallback(async function sendTranscript(isAutomatic = false) {
    const payload = latestPayloadRef.current;
    if (!payload) return;
    // Auto-trigger: skip silently if a transcript already went out
    if (isAutomatic && transcriptSentRef.current) return;

    trackEvent('transcript_sent', { trigger: isAutomatic ? 'auto' : 'manual' });

    setEmailStatus('sending');
    try {
      const res = await fetch('/api/send-transcript', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      transcriptSentRef.current = true;
      setTranscriptSent(true);
      setEmailStatus('sent');
      setTimeout(() => setEmailStatus('idle'), 2500);
    } catch (err) {
      console.error('[send-transcript]', err?.message ?? err);
      // Manual sends surface a visible retry state; auto-sends fail silently
      // (the idle timer will try again on the next message)
      if (isAutomatic) {
        setEmailStatus('idle');
      } else {
        setEmailStatus('error');
        setTimeout(() => setEmailStatus('idle'), 4000);
      }
    }
  }, []);

  // Keep payload ref current so the idle timer and beacon always have the latest messages
  useEffect(() => {
    if (!chatOpen || !hasRealUserMsg) return;
    const trimmedCc = ccEmail.trim();
    latestPayloadRef.current = {
      messages,
      recipientEmail: email,
      // Only forward a CC that's actually a valid address; otherwise omit it
      cc:             trimmedCc && EMAIL_RE.test(trimmedCc) ? trimmedCc : undefined,
      companyName:    company  || undefined,
      jobDescription: jobText  || undefined,
    };
  }, [chatOpen, hasRealUserMsg, messages, email, company, jobText, ccEmail]);

  // 10-minute idle timer — resets on every new message, cancels once transcript is sent
  useEffect(() => {
    if (!chatOpen || !hasRealUserMsg || transcriptSent) return;
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => doSend(true), 10 * 60 * 1000);
    return () => clearTimeout(idleTimerRef.current);
  }, [messages, chatOpen, transcriptSent, hasRealUserMsg, doSend]);

  // Beacon on page exit — reads refs only so no reactive deps needed
  useEffect(() => {
    function handleUnload() {
      if (transcriptSentRef.current) return;
      const payload = latestPayloadRef.current;
      if (!payload) return;
      navigator.sendBeacon(
        '/api/send-transcript',
        new Blob([JSON.stringify(payload)], { type: 'application/json' }),
      );
    }
    window.addEventListener('pagehide',     handleUnload);
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('pagehide',     handleUnload);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  // Cancel any pending rAF token flush if the component unmounts mid-stream.
  useEffect(() => () => {
    if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
  }, []);

  // ── Core SSE streaming ─────────────────────────────
  const streamChat = useCallback(async (apiMessages) => {
    setIsStreaming(true);
    // New message: re-arm the mid-stream first-sentence TTS trigger.
    firstSentenceSentRef.current = false;
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
    // Accumulate the full assistant reply for the voice-mode auto-read (below).
    let fullResponseText = '';

    // ── rAF token buffer ──────────────────────────────
    // Tokens arrive faster than the browser paints. Rather than a setState per
    // token (~60 re-renders + scrolls/sec), accumulate tokens in a ref and flush
    // them to state once per animation frame, in sync with the paint cycle.
    tokenBufferRef.current  = '';
    rafScheduledRef.current = false;

    const flushTokens = () => {
      rafScheduledRef.current = false;
      rafIdRef.current = null;
      const chunk = tokenBufferRef.current;
      if (!chunk) return;
      tokenBufferRef.current = '';
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (!last || last.role !== 'assistant') return prev;
        next[next.length - 1] = { ...last, content: last.content + chunk };
        return next;
      });
      // Smart auto-scroll: only follow the stream if the user hasn't scrolled up.
      if (!userScrolledUpRef.current) {
        scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    };

    const scheduleFlush = () => {
      if (rafScheduledRef.current) return;
      rafScheduledRef.current = true;
      rafIdRef.current = requestAnimationFrame(flushTokens);
    };

    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages:        apiMessages,
          companyName:     company  || null,
          companyContext:  null,
          jobDescription:  jobText  || null,
          // Additive: null when analysis hasn't finished (or failed) — the
          // backend prompt builder treats null as "no personalization".
          jdAnalysis:      jdAnalysis ?? null,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6);
          if (raw === '[DONE]') break outer;
          try {
            const { text, error } = JSON.parse(raw);
            if (error) throw new Error(error);
            if (text) {
              fullResponseText += text;

              // Voice mode: speak the first complete sentence the moment it's
              // available so audio starts while Claude is still generating the
              // rest. Detection runs on the ACCUMULATED text (not per-chunk), so
              // it's robust regardless of chunk granularity — the boundary is
              // found once the chunk after the sentence's punctuation lands.
              if (voiceModeActiveRef.current && !firstSentenceSentRef.current) {
                const sentenceEnd = fullResponseText.search(/[.!?]\s/);
                if (sentenceEnd !== -1) {
                  const firstSentence = fullResponseText.slice(0, sentenceEnd + 1).trim();
                  // Only speak a real sentence, not a short fragment (e.g. "Hi.").
                  if (firstSentence.length > 20) {
                    firstSentenceSentRef.current = true;
                    speakTextRef.current?.(firstSentence, firstSentence);
                  }
                }
              }

              // Buffer the token; the rAF flush applies it on the next paint.
              tokenBufferRef.current += text;
              scheduleFlush();
            }
          } catch { /* ignore malformed SSE lines */ }
        }
      }

      // Stream finished cleanly — flush any tokens buffered in the final frame.
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
      rafScheduledRef.current = false;
      flushTokens();
    } catch {
      // Drop any buffered tokens so a late flush can't append to the error notice.
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
      rafScheduledRef.current = false;
      tokenBufferRef.current = '';
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = {
          role:    'assistant',
          content: 'Something went wrong — please try again.',
        };
        return next;
      });
    }

    setIsStreaming(false);

    // ── Voice mode: auto-read a short version once the reply is complete ──
    // Reads refs so this stays out of the callback's dep array. fullResponseText
    // is empty on an early error, so the error message is never spoken.
    if (voiceModeActiveRef.current && fullResponseText) {
      const sentences = fullResponseText.match(/[^.!?]+[.!?]+/g) || [];
      const shortVersion =
        sentences.slice(0, 3).join(' ').trim() || fullResponseText.slice(0, 280);

      setLastAIMessage(fullResponseText);
      setLastAIMessageShort(shortVersion);

      // Only auto-speak the short version if the first sentence wasn't already
      // sent mid-stream — otherwise we'd double-speak the start of the reply.
      // The "hear full response" button still replays the full text on demand.
      if (!firstSentenceSentRef.current) {
        speakTextRef.current?.(fullResponseText, shortVersion);
      }
      // Always reset for the next message.
      firstSentenceSentRef.current = false;
    }
  }, [company, jobText, jdAnalysis]); // jdAnalysis added so the latest analysis (or null) is always sent

  // ── JD pre-analysis ────────────────────────────────
  // Fire-and-forget Haiku call that extracts structured role data so the
  // interview can be personalized. Captures `company` via useCallback dep.
  const analyzeJD = useCallback(async function analyzeJD(text) {
    setAnalysisStatus('analyzing');
    try {
      const res = await fetch('/api/analyze-jd', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ jobDescription: text, companyName: company }),
      });
      const data = await res.json();
      setJdAnalysis(data);
      setAnalysisStatus('done');
    } catch {
      // Fail silent — the interview still works without personalization.
      setAnalysisStatus('error');
    }
  }, [company]);

  // Trigger analysis once JD text has settled — from a successful URL fetch
  // ('done') or a manual paste. Debounced so typing/pasting settles before we
  // spend a Haiku call; deduped via lastAnalyzedRef so the same text isn't
  // re-analyzed if the effect re-runs.
  useEffect(() => {
    const text = jobText.trim();
    if (!text || fetchStatus === 'fetching') return;
    if (lastAnalyzedRef.current === text)      return;

    const delay = fetchStatus === 'done' ? 0 : 700;
    const timer = setTimeout(() => {
      lastAnalyzedRef.current = text;
      analyzeJD(text);
    }, delay);
    return () => clearTimeout(timer);
  }, [jobText, fetchStatus, analyzeJD]);

  // ── JD URL fetch ───────────────────────────────────
  async function handleFetchJD() {
    if (!jobUrl.trim()) return;
    setFetchStatus('fetching');
    try {
      const res  = await fetch('/api/fetch-jd', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ url: jobUrl }),
      });
      const data = await res.json();
      if (data.error || !data.text) {
        setFetchStatus('error');
        setShowPaste(true);
        trackEvent('jd_fetch_submitted', { outcome: 'error' });
      } else {
        setJobText(data.text);
        setFetchStatus('done');
        trackEvent('jd_fetch_submitted', { outcome: 'success' });
      }
    } catch {
      setFetchStatus('error');
      setShowPaste(true);
      trackEvent('jd_fetch_submitted', { outcome: 'error' });
    }
  }

  // ── Gate submit ────────────────────────────────────
  async function handleGateSubmit(e) {
    e.preventDefault();
    setSubmitAttempted(true);
    if (!name.trim() || !company.trim() || !EMAIL_RE.test(email)) return;

    trackEvent('interview_gate_completed', { hasJobDescription: Boolean(jobText.trim()) });

    // Fire-and-forget lead capture — non-blocking
    fetch('/api/log-lead', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:      name.trim(),
        company:   company.trim(),
        email:     email.trim(),
        jobUrl:    jobUrl.trim() || null,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});

    setChatOpen(true);
    // Mark interview engagement so the returning-visitor nudge stops firing in
    // future sessions. Wrapped per the storage guardrail (Safari private mode).
    try { localStorage.setItem('jt_interview_started', 'true'); } catch { /* no-op */ }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    await streamChat([OPENER]);
  }

  // ── Dev gate bypass (testing only) ─────────────────
  // Replicates a successful gate completion without the form UI: pre-fills the
  // gate fields with DEV TEST credentials and mirrors every state setter from
  // handleGateSubmit, so the chat, transcript email, and sheet log all behave
  // exactly as a real session. Entries are labeled "DEV TEST" for easy filtering.
  function activateDevBypass() {
    const bypassPayload = {
      name:      'Jaxon Travis',
      company:   'DEV TEST',
      email:     'jaxontravis7@gmail.com',
      jobUrl:    null,
      timestamp: new Date().toISOString(),
    };

    // Same fire-and-forget lead log the real gate fires — keeps the sheet
    // accurate but clearly marked as a dev session.
    fetch('/api/log-lead', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(bypassPayload),
    }).catch(() => {});

    // Mirror the state a real gate completion produces. name/company/email are
    // normally filled by the form inputs, so we set them here; the rest matches
    // handleGateSubmit's success path exactly.
    setName('Jaxon Travis');
    setCompany('DEV TEST');
    setEmail('jaxontravis7@gmail.com');
    setChatOpen(true);
    try { localStorage.setItem('jt_interview_started', 'true'); } catch { /* no-op */ }
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Browser-devtools-only indicator — never rendered to the page.
    console.log('[DEV] Gate bypassed — test session active');

    // Same chat kickoff as a real gate completion.
    streamChat([OPENER]);
  }

  // Mobile dev gate bypass — 7 taps on the eyebrow within 2s triggers the same
  // bypass. Fast enough to be intentional, slow enough that a recruiter
  // scrolling past won't trip it. Counter self-resets after 2s of inactivity.
  function handleEyebrowTap() {
    if (chatOpen) return;

    tapCountRef.current += 1;
    clearTimeout(tapTimerRef.current);

    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 2000);

    if (tapCountRef.current >= 7) {
      tapCountRef.current = 0;
      clearTimeout(tapTimerRef.current);
      activateDevBypass();
    }
  }

  // ── Chat submit ────────────────────────────────────
  // Single send path used by the input form and the starter chips alike.
  async function sendMessage(raw) {
    // New send: re-enable auto-scroll so the chat snaps to the user's own
    // message and the start of the incoming response.
    userScrolledUpRef.current = false;
    setIsScrolledUp(false);
    const text = raw.trim();
    if (!text || isStreaming) return;
    setChatInput('');

    const userMsg    = { role: 'user', content: text };
    const nextDisplay = [...messages, userMsg];
    setMessages(nextDisplay);
    // Snap the user's own message into view on the next paint; the rAF flush
    // takes over scrolling once the assistant's tokens start arriving.
    requestAnimationFrame(() => {
      scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });

    // Count only — message content is intentionally never sent to analytics
    trackEvent('chat_message_sent', {
      turn: nextDisplay.filter(m => m.role === 'user').length,
    });

    // Full API history: hidden opener + every completed message + new user turn
    const apiMessages = [
      OPENER,
      ...nextDisplay.filter(m => m.content.trim()),
    ];
    await streamChat(apiMessages);
  }

  async function handleChatSubmit(e) {
    e.preventDefault();
    await sendMessage(chatInput);
  }

  // Manual "Email this conversation" — validate the optional CC before sending.
  // A blank CC is fine; a non-empty-but-invalid one blocks the send so the user can fix it.
  function handleManualSend() {
    const trimmedCc = ccEmail.trim();
    if (trimmedCc && !EMAIL_RE.test(trimmedCc)) {
      setCcError(true);
      return;
    }
    setCcError(false);
    doSend(false);
  }

  // Starter chip: mark it used (so it won't reappear) and submit its message
  // through the shared send path.
  function handleChipClick(prompt) {
    usedPromptsRef.current.add(prompt.label);
    sendMessage(prompt.message);
  }

  // ── Validation flags ───────────────────────────────
  const nameErr    = submitAttempted && !name.trim();
  const companyErr = submitAttempted && !company.trim();
  const emailErr   = submitAttempted && !EMAIL_RE.test(email);

  // ═══════════════════════════════════════════════════
  // CHAT VIEW (gate complete)
  // ═══════════════════════════════════════════════════
  if (chatOpen) {
    return (
      <section id="ai-interview" className={styles.section} data-accent="gold">
        <div className={styles.container} ref={containerRef} data-reveal={revealed ? 'true' : 'false'}>
          <header className={styles.sectionTop} style={{ position: 'relative' }}>
            <span className={styles.eyebrow}>PROFESSIONAL</span>
            <h2 className={styles.heading}>Interview Me Before You Hire Me</h2>
            <p className={styles.chatMeta}>
              Session for <strong>{company}</strong>
              {jobText && <span className={styles.jdBadge}>· JD loaded</span>}
            </p>
          </header>

          <div className={styles.chatShell}>
            <div
              className={styles.messageList}
              ref={messageListRef}
              role="log"
              aria-live="polite"
              aria-label="Interview conversation"
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`${styles.bubble} ${
                    msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <span className={styles.bubbleLabel}>Jaxon AI</span>
                  )}
                  {msg.role === 'assistant' ? (
                    msg.content ? (
                      <p
                        className={styles.bubbleText}
                        dangerouslySetInnerHTML={{
                          __html: renderMarkdown(msg.content),
                        }}
                      />
                    ) : (
                      <p className={styles.bubbleText}>
                        {isStreaming && i === messages.length - 1 ? (
                          <span className={styles.thinking} aria-label="Thinking">
                            <span className={styles.thinkingDot} />
                            <span className={styles.thinkingDot} />
                            <span className={styles.thinkingDot} />
                          </span>
                        ) : null}
                      </p>
                    )
                  ) : (
                    <p className={styles.bubbleText}>{msg.content}</p>
                  )}
                </div>
              ))}

              {showStarterPrompts && (
                <div className={styles.idleState}>
                  {userTurnCount === 0 && (
                    <p className={styles.idleCopy}>
                      I've been trained on Jaxon's full background — ask me anything
                      you'd ask him in a screening call.
                    </p>
                  )}
                  <div className={styles.chipRow}>
                    {availablePrompts.map(prompt => (
                      <button
                        key={prompt.label}
                        type="button"
                        className={styles.chip}
                        onClick={() => handleChipClick(prompt)}
                        disabled={isStreaming}
                      >
                        {prompt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={scrollAnchorRef} />
            </div>

            {isScrolledUp && isStreaming && (
              <button
                type="button"
                className={styles.scrollToLatest}
                onClick={() => {
                  scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                  userScrolledUpRef.current = false;
                  setIsScrolledUp(false);
                }}
                aria-label="Scroll to latest message"
              >
                ↓ Latest
              </button>
            )}

            {voiceModeActive ? (
              <VoiceModeUI
                isListening={isListening}
                isSpeaking={isSpeaking}
                voiceSupported={voiceSupported}
                transcript={transcript}
                isStreaming={isStreaming}
                onStartListening={startListening}
                onStopListening={stopListening}
                onStopSpeaking={stopSpeaking}
                onHearFullResponse={handleHearFullResponse}
                onExitVoiceMode={handleToggleVoiceMode}
                hasLastResponse={Boolean(lastAIMessageShort)}
              />
            ) : (
            <form onSubmit={handleChatSubmit} className={styles.inputBar}>
              <input
                ref={chatInputRef}
                className={styles.chatInput}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleChatSubmit(e);
                  }
                }}
                placeholder="Ask about Jaxon's experience…"
                disabled={isStreaming}
                aria-label="Your message"
              />
              <motion.button
                type="submit"
                className={styles.sendBtn}
                disabled={isStreaming || !chatInput.trim()}
                aria-label="Send message"
                whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
                whileTap={{ scale: 0.98, transition: { duration: 0.15 } }}
              >
                {isStreaming ? '…' : 'Send →'}
              </motion.button>
              {voiceSupported !== false && (
                <button
                  type="button"
                  onClick={handleToggleVoiceMode}
                  style={{
                    background:    'transparent',
                    border:        `1px solid rgba(212,168,63,${voiceModeActive ? 0.9 : 0.4})`,
                    color:         'var(--accent-gold)',
                    borderRadius:  '20px',
                    padding:       '0 12px',
                    height:        '100%',
                    fontSize:      '11px',
                    letterSpacing: '0.08em',
                    cursor:        'pointer',
                    fontFamily:    'var(--font-sans)',
                    whiteSpace:    'nowrap',
                    flexShrink:    0,
                  }}
                >
                  {voiceModeActive ? '✕ Voice' : '🎙 Voice'}
                </button>
              )}
            </form>
            )}
          </div>

          {hasRealUserMsg && (
            <div className={styles.transcriptBar}>
              <div className={styles.ccField}>
                <label className={styles.ccLabel} htmlFor="int-cc">
                  CC another email <span className={styles.optional}>(optional)</span>
                </label>
                <input
                  id="int-cc"
                  type="email"
                  className={`${styles.input} ${ccError ? styles.inputErr : ''}`}
                  value={ccEmail}
                  onChange={e => { setCcEmail(e.target.value); if (ccError) setCcError(false); }}
                  placeholder="colleague@company.com"
                  autoComplete="email"
                  aria-describedby={ccError ? 'err-cc' : undefined}
                />
                {ccError && (
                  <p id="err-cc" className={styles.errMsg} role="alert">
                    Enter a valid email or leave it blank
                  </p>
                )}
              </div>
              <motion.button
                type="button"
                className={`${styles.emailBtn}${
                  emailStatus === 'sent'  ? ` ${styles.emailBtnSent}`  :
                  emailStatus === 'error' ? ` ${styles.emailBtnError}` : ''
                }`}
                onClick={handleManualSend}
                disabled={emailStatus === 'sending'}
                whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
                whileTap={{ scale: 0.98, transition: { duration: 0.15 } }}
              >
                {emailStatus === 'sending' ? 'Sending…'
                 : emailStatus === 'sent'  ? 'Sent ✓'
                 : emailStatus === 'error' ? 'Failed — try again'
                 : transcriptSent          ? 'Send updated copy'
                 :                           'Email this conversation'}
              </motion.button>
              <p className={styles.emailCaption}>
                A copy always goes to the email you entered. Add a CC above to send it to one
                more person too. This conversation also auto-sends a summary after 10 minutes of
                inactivity or when you leave; exporting again sends an updated copy.
              </p>
            </div>
          )}

          {showPostCta && (
            <div className={styles.postCta}>
              <p className={styles.postCtaHeadline}>Convinced? Let's talk directly.</p>
              <motion.a
                href="mailto:jaxontravis7@gmail.com"
                className={styles.postCtaLink}
                whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
                whileTap={{ scale: 0.98, transition: { duration: 0.15 } }}
              >
                Book a real call →
              </motion.a>
            </div>
          )}
        </div>
      </section>
    );
  }

  // ═══════════════════════════════════════════════════
  // GATE VIEW
  // ═══════════════════════════════════════════════════
  return (
    <section id="ai-interview" className={styles.section} data-accent="gold">
      <div className={styles.container} ref={containerRef} data-reveal={revealed ? 'true' : 'false'}>
        <header className={styles.sectionTop}>
          <span className={styles.eyebrow} onClick={handleEyebrowTap}>PROFESSIONAL</span>
          <h2 className={styles.heading}>Interview Me Before You Hire Me</h2>
          <p className={styles.subhead}>
            Talk to an AI trained on my full background. Takes 5 minutes.
            Saves you a screening call.
          </p>
        </header>

        <div className={styles.layout}>

          {/* ── Gate + JD form ── */}
          <div className={styles.formSide}>
            <form onSubmit={handleGateSubmit} noValidate>

              {/* Step 1 */}
              <fieldset className={styles.formStep}>
                <legend className={styles.stepLabel}>Step 1 — Your details</legend>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="int-name">Your Name</label>
                  <input
                    id="int-name"
                    type="text"
                    className={`${styles.input} ${nameErr ? styles.inputErr : ''}`}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Sarah Chen"
                    autoComplete="name"
                    aria-describedby={nameErr ? 'err-name' : undefined}
                  />
                  {nameErr && (
                    <p id="err-name" className={styles.errMsg} role="alert">Required</p>
                  )}
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="int-company">Company</label>
                  <input
                    id="int-company"
                    type="text"
                    className={`${styles.input} ${companyErr ? styles.inputErr : ''}`}
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="Acme Corp"
                    autoComplete="organization"
                    aria-describedby={companyErr ? 'err-company' : undefined}
                  />
                  {companyErr && (
                    <p id="err-company" className={styles.errMsg} role="alert">Required</p>
                  )}
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="int-email">Work Email</label>
                  <input
                    id="int-email"
                    type="email"
                    className={`${styles.input} ${emailErr ? styles.inputErr : ''}`}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="sarah@acmecorp.com"
                    autoComplete="email"
                    aria-describedby={emailErr ? 'err-email' : undefined}
                  />
                  {emailErr && (
                    <p id="err-email" className={styles.errMsg} role="alert">
                      Enter a valid work email
                    </p>
                  )}
                </div>
              </fieldset>

              {/* Step 2 */}
              <fieldset className={styles.formStep}>
                <legend className={styles.stepLabel}>
                  Step 2 — Job description
                  <span className={styles.optional}> (optional but recommended)</span>
                </legend>

                {!showPaste ? (
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="int-url">Job Posting URL</label>
                    <div className={styles.urlRow}>
                      <input
                        id="int-url"
                        type="url"
                        className={`${styles.input} ${
                          fetchStatus === 'error' ? styles.inputErr :
                          fetchStatus === 'done'  ? styles.inputOk  : ''
                        }`}
                        value={jobUrl}
                        onChange={e => { setJobUrl(e.target.value); setFetchStatus('idle'); }}
                        placeholder="https://jobs.example.com/…"
                        autoComplete="off"
                      />
                      <motion.button
                        type="button"
                        className={`${styles.fetchBtn} ${
                          fetchStatus === 'done' ? styles.fetchBtnOk : ''
                        }`}
                        onClick={handleFetchJD}
                        disabled={!jobUrl.trim() || fetchStatus === 'fetching'}
                        aria-label="Fetch job description from URL"
                        whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
                        whileTap={{ scale: 0.98, transition: { duration: 0.15 } }}
                      >
                        {fetchStatus === 'fetching' ? '…' :
                         fetchStatus === 'done'     ? '✓' : 'Fetch'}
                      </motion.button>
                    </div>
                    {fetchStatus === 'done'  && (
                      <p className={styles.okMsg}>Job description loaded.</p>
                    )}
                    {fetchStatus === 'error' && (
                      <p className={styles.errMsg} role="alert">
                        Couldn't load that URL — try pasting instead.
                      </p>
                    )}
                    <motion.button
                      type="button"
                      className={styles.toggleLink}
                      onClick={() => setShowPaste(true)}
                      whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
                      whileTap={{ scale: 0.98, transition: { duration: 0.15 } }}
                    >
                      Paste instead →
                    </motion.button>
                  </div>
                ) : (
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="int-paste">
                      Paste Job Description
                    </label>
                    <textarea
                      id="int-paste"
                      className={styles.textarea}
                      value={jobText}
                      onChange={e => setJobText(e.target.value)}
                      placeholder="Paste the full job description here…"
                      rows={7}
                    />
                    <motion.button
                      type="button"
                      className={styles.toggleLink}
                      onClick={() => {
                        setShowPaste(false);
                        setJobText('');
                        setFetchStatus('idle');
                      }}
                      whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
                      whileTap={{ scale: 0.98, transition: { duration: 0.15 } }}
                    >
                      ← Use URL instead
                    </motion.button>
                  </div>
                )}

                {/* JD pre-analysis status — inline, never blocks any control.
                    'error' renders nothing (fail silent). */}
                {analysisStatus === 'analyzing' && (
                  <p style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize:   '11px',
                    color:      'var(--accent-gold)',
                    opacity:    0.6,
                    marginTop:  'var(--space-xs)',
                  }}>
                    Analyzing role fit…
                  </p>
                )}
                {analysisStatus === 'done' && (
                  <p style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize:   '11px',
                    color:      'var(--accent-gold)',
                    opacity:    0.8,
                    marginTop:  'var(--space-xs)',
                  }}>
                    Role analyzed — interview personalized
                  </p>
                )}
              </fieldset>

              <motion.button
                type="submit"
                className={styles.ctaBtn}
                whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
                whileTap={{ scale: 0.98, transition: { duration: 0.15 } }}
              >
                Enter the Interview →
              </motion.button>
            </form>
          </div>

          {/* ── Locked chat preview ── */}
          <div className={styles.previewSide} aria-hidden="true">
            <div className={styles.previewShell}>
              <div className={styles.previewMessages}>
                {PREVIEW_MESSAGES.map((msg, i) => (
                  <div
                    key={i}
                    className={`${styles.bubble} ${
                      msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <span className={styles.bubbleLabel}>Jaxon AI</span>
                    )}
                    <p className={styles.bubbleText}>{msg.content}</p>
                  </div>
                ))}
              </div>

              <div className={styles.lockOverlay}>
                <svg
                  className={styles.lockIcon}
                  width="28" height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <p className={styles.lockText}>Complete the form to begin</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

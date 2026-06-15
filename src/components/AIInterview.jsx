import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import styles from './AIInterview.module.css';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { trackEvent } from '../lib/analytics';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OPENER   = { role: 'user', content: 'Please begin.' };

const STARTER_PROMPTS = [
  'What makes you the right hire for a zero-to-one role?',
  'Tell me about a system you built from scratch.',
  'How do you work across teams and up to the executive level?',
  'What are you building outside of work?',
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

  // ── Chat ───────────────────────────────────────────
  const [chatOpen,       setChatOpen]       = useState(false);
  const [messages,       setMessages]       = useState([]);
  const [chatInput,      setChatInput]      = useState('');
  const [isStreaming,    setIsStreaming]     = useState(false);
  const [transcriptSent, setTranscriptSent] = useState(false);
  const [emailStatus,    setEmailStatus]    = useState('idle'); // 'idle'|'sending'|'sent'|'error'
  const [ccEmail,        setCcEmail]        = useState('');     // optional extra recipient for manual send
  const [ccError,        setCcError]        = useState(false);

  const messagesEndRef    = useRef(null);
  const chatInputRef      = useRef(null);
  const idleTimerRef      = useRef(null);
  const transcriptSentRef = useRef(false); // mirrors transcriptSent for non-reactive contexts
  const latestPayloadRef  = useRef(null);  // always holds the most recent sendable payload

  // Scroll-reveal — shared ref works across gate↔chat view transitions
  // because revealed stays true once set (re-render keeps the truthy state)
  const [containerRef, revealed] = useScrollReveal();

  // OPENER is never pushed into the messages display array, so any role:'user'
  // entry here is a real recruiter question — safe to use as the gating condition.
  const hasRealUserMsg = messages.some(m => m.role === 'user');

  // ── Existing effects ────────────────────────────────

  // Auto-scroll on new message content
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [messages]);

  // Focus chat input when streaming ends
  useEffect(() => {
    if (chatOpen && !isStreaming) chatInputRef.current?.focus();
  }, [chatOpen, isStreaming]);

  // showPostCta is derived: no effect or state needed.
  const showPostCta = messages.filter(m => m.role === 'assistant' && m.content).length >= 3;

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

  // ── Core SSE streaming ─────────────────────────────
  const streamChat = useCallback(async (apiMessages) => {
    setIsStreaming(true);
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages:        apiMessages,
          companyName:     company  || null,
          companyContext:  null,
          jobDescription:  jobText  || null,
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
              setMessages(prev => {
                const next = [...prev];
                next[next.length - 1] = {
                  ...next[next.length - 1],
                  content: next[next.length - 1].content + text,
                };
                return next;
              });
            }
          } catch { /* ignore malformed SSE lines */ }
        }
      }
    } catch {
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
  }, [company, jobText]); // captured at gate-submit time; stable after that

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

  // ── Chat submit ────────────────────────────────────
  // Single send path used by the input form and the starter chips alike.
  async function sendMessage(raw) {
    const text = raw.trim();
    if (!text || isStreaming) return;
    setChatInput('');

    const userMsg    = { role: 'user', content: text };
    const nextDisplay = [...messages, userMsg];
    setMessages(nextDisplay);

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

  // Starter chip: submit straight through the shared send path
  function handleChipClick(prompt) {
    sendMessage(prompt);
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
          <header className={styles.sectionTop}>
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
                  <p className={styles.bubbleText}>
                    {msg.content ||
                      (isStreaming && i === messages.length - 1
                        ? <span className={styles.cursor} aria-label="Generating" />
                        : null)}
                  </p>
                </div>
              ))}

              {!hasRealUserMsg && (
                <div className={styles.idleState}>
                  <p className={styles.idleCopy}>
                    I've been trained on Jaxon's full background — ask me anything
                    you'd ask him in a screening call.
                  </p>
                  <div className={styles.chipRow}>
                    {STARTER_PROMPTS.map(prompt => (
                      <button
                        key={prompt}
                        type="button"
                        className={styles.chip}
                        onClick={() => handleChipClick(prompt)}
                        disabled={isStreaming}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

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
            </form>
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
          <span className={styles.eyebrow}>PROFESSIONAL</span>
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

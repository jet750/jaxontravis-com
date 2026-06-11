import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './AIInterview.module.css';
import { useScrollReveal } from '../hooks/useScrollReveal';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OPENER   = { role: 'user', content: 'Please begin.' };

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
  const [chatOpen,     setChatOpen]     = useState(false);
  const [messages,     setMessages]     = useState([]);
  const [chatInput,    setChatInput]    = useState('');
  const [isStreaming,  setIsStreaming]  = useState(false);
  const [showPostCta,  setShowPostCta]  = useState(false);

  const messagesEndRef = useRef(null);
  const chatInputRef   = useRef(null);

  // Scroll-reveal — shared ref works across gate↔chat view transitions
  // because revealed stays true once set (re-render keeps the truthy state)
  const [containerRef, revealed] = useScrollReveal();

  // Auto-scroll on new message content
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [messages]);

  // Focus chat input when streaming ends
  useEffect(() => {
    if (chatOpen && !isStreaming) chatInputRef.current?.focus();
  }, [chatOpen, isStreaming]);

  // Show post-CTA after 3 AI responses
  useEffect(() => {
    const aiCount = messages.filter(m => m.role === 'assistant' && m.content).length;
    if (aiCount >= 3) setShowPostCta(true);
  }, [messages]);

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
      } else {
        setJobText(data.text);
        setFetchStatus('done');
      }
    } catch {
      setFetchStatus('error');
      setShowPaste(true);
    }
  }

  // ── Gate submit ────────────────────────────────────
  async function handleGateSubmit(e) {
    e.preventDefault();
    setSubmitAttempted(true);
    if (!name.trim() || !company.trim() || !EMAIL_RE.test(email)) return;

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
    await streamChat([OPENER]);
  }

  // ── Chat submit ────────────────────────────────────
  async function handleChatSubmit(e) {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || isStreaming) return;
    setChatInput('');

    const userMsg    = { role: 'user', content: text };
    const nextDisplay = [...messages, userMsg];
    setMessages(nextDisplay);

    // Full API history: hidden opener + every completed message + new user turn
    const apiMessages = [
      OPENER,
      ...nextDisplay.filter(m => m.content.trim()),
    ];
    await streamChat(apiMessages);
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
              <button
                type="submit"
                className={styles.sendBtn}
                disabled={isStreaming || !chatInput.trim()}
              >
                {isStreaming ? '…' : 'Send →'}
              </button>
            </form>
          </div>

          {showPostCta && (
            <div className={styles.postCta}>
              <p className={styles.postCtaHeadline}>Convinced? Let's talk directly.</p>
              <a href="mailto:jaxontravis7@gmail.com" className={styles.postCtaLink}>
                Book a real call →
              </a>
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
                      <button
                        type="button"
                        className={`${styles.fetchBtn} ${
                          fetchStatus === 'done' ? styles.fetchBtnOk : ''
                        }`}
                        onClick={handleFetchJD}
                        disabled={!jobUrl.trim() || fetchStatus === 'fetching'}
                      >
                        {fetchStatus === 'fetching' ? '…' :
                         fetchStatus === 'done'     ? '✓' : 'Fetch'}
                      </button>
                    </div>
                    {fetchStatus === 'done'  && (
                      <p className={styles.okMsg}>Job description loaded.</p>
                    )}
                    {fetchStatus === 'error' && (
                      <p className={styles.errMsg} role="alert">
                        Couldn't load that URL — try pasting instead.
                      </p>
                    )}
                    <button
                      type="button"
                      className={styles.toggleLink}
                      onClick={() => setShowPaste(true)}
                    >
                      Paste instead →
                    </button>
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
                    <button
                      type="button"
                      className={styles.toggleLink}
                      onClick={() => {
                        setShowPaste(false);
                        setJobText('');
                        setFetchStatus('idle');
                      }}
                    >
                      ← Use URL instead
                    </button>
                  </div>
                )}
              </fieldset>

              <button type="submit" className={styles.ctaBtn}>
                Enter the Interview →
              </button>
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

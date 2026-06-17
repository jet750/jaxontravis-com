Read the following files before touching anything:
  src/components/AIInterview.jsx
  src/components/AIInterview.module.css
  api/chat.js

Also check whether any of the following exist and note their contents:
  src/lib/rubric.js
  api/rubric.js
  src/utils/rubric.js

Report which rubric file exists (if any) and its current shape before proceeding. Do not assume rubric.js exists — verify.

This prompt covers six bounded changes to the AI Interview feature. Make each change surgically. Do not refactor unrelated code, rename variables, or touch files outside this list:
  src/components/AIInterview.jsx
  src/components/AIInterview.module.css
  api/chat.js (only if rubric wiring is needed)

Commit after all six changes are complete with message: "feat: AI interview UX overhaul — smooth scroll, first-person persona, new starter prompts, conversational response style"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHANGE 1 — rAF token buffer (fix jumpy scroll)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Currently, each SSE token chunk calls setState immediately, causing up to 60 re-renders and scroll calls per second. Replace this with a requestAnimationFrame buffer pattern.

In the streaming section of AIInterview.jsx:
- Add a tokenBufferRef = useRef('') and rafScheduledRef = useRef(false)
- In the chunk handler, instead of calling setState on every token:
    tokenBufferRef.current += newToken
    if (!rafScheduledRef.current) {
      rafScheduledRef.current = true
      requestAnimationFrame(() => {
        setMessages(prev => /* append buffered tokens to last assistant message */)
        tokenBufferRef.current = ''
        rafScheduledRef.current = false
      })
    }
- On stream complete, do a final flush of any remaining buffer to state
- Clean up: cancel any pending rAF on component unmount

This batches all tokens that arrive within a single 16ms frame into one setState call, reducing render cycles from ~60/sec to ~60/sec maximum but typically far fewer, and syncing updates to the browser paint cycle.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHANGE 2 — smart scroll with IntersectionObserver anchor
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Replace any existing scrollIntoView or scrollTo logic with this pattern:

- Add an invisible div ref (scrollAnchorRef) as the last child of the message list container
- Add a userScrolledUpRef = useRef(false)
- Add a scroll event listener on the message container:
    - On scroll, check if scrollTop + clientHeight < scrollHeight - 50
    - If yes: userScrolledUpRef.current = true
    - If no (user is near bottom): userScrolledUpRef.current = false
    - Debounce this check to every 100ms to avoid firing on every pixel
- In the rAF flush callback from Change 1, after state update:
    if (!userScrolledUpRef.current) {
      scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
- Reset userScrolledUpRef.current = false whenever the user sends a new message, so their own message always scrolls into view
- Add a floating "scroll to latest" button that appears when userScrolledUpRef.current is true and a new assistant message is streaming. Style it as a small pill, gold accent color, fixed to the bottom-right of the chat container (not the page). On click: scroll anchor into view smoothly and reset userScrolledUpRef.current = false.

Do NOT use scroll-behavior: smooth on the container CSS — this conflicts with programmatic scroll calls and causes double-animation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHANGE 3 — thinking indicator
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Check if a loading/thinking indicator already exists for the period between the user sending a message and the first token arriving.

If it does NOT exist, add one:
- When isLoading is true and the last message is from the user (no assistant message started yet), render a message bubble in the assistant position containing three animated dots
- Use CSS animation: each dot scales up sequentially with a 0.2s stagger, infinite loop
- Match the existing assistant bubble style from AIInterview.module.css
- Remove the indicator as soon as the first token arrives (i.e. as soon as the assistant message content is non-empty)

If it already exists, leave it alone and note this in the build report.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHANGE 4 — first-person persona + restrained opening message
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

In api/chat.js, find the buildSystemPrompt function (or wherever the system prompt string is constructed).

Add the following instruction at the top of the system prompt, before any existing content:

"You are Jaxon Travis. Respond in the first person as Jaxon — say 'I', 'my', 'me', not 'Jaxon' or 'he'. You are representing yourself in a professional interview context. Do not narrate about yourself in third person at any point."

Also add this instruction:

"Your opening message must be no more than 2 sentences. If a job description has been parsed, acknowledge it briefly. Then ask how you can help. Do not output a role analysis, strengths summary, or any extended content unless the recruiter specifically requests it. Wait for them to lead."

And add this instruction governing all responses:

"Keep all responses conversational and concise — typically 2–4 short paragraphs or equivalent. After answering any question, end with a single short follow-up question (e.g. 'Want me to go deeper on that?' or 'Do you have another question?') to keep the conversation moving. Never dump a large block of content unprompted."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHANGE 5 — new starter prompts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Replace the existing starter prompt tiles with exactly these four, in this order:

1. "How do you fit this role?"
   → When clicked, sends: "Walk me through how your background fits the job description."
   → This should trigger the full role-fit analysis (the content that was previously in the opening message). The AI should respond with a detailed but still paragraph-based breakdown of fit, ending with its standard follow-up question.

2. "What strengths would you bring?"
   → Sends: "What specific strengths would you bring to this role?"
   → AI responds with 2–3 focused strengths directly tied to the JD if available, conversational paragraphs, follow-up question at end.

3. "How have you translated founder vision into systems?"
   → Sends: "What experience do you have translating founder vision into actionable systems?"
   → AI responds with a concise narrative answer drawing on relevant experience (HŪMNZ, McKinney Alternative Investments, etc.), conversational paragraphs, follow-up question at end.

4. "Tell me about your side projects."
   → Sends: "Tell me about the projects you're working on outside of your day job."
   → AI responds with a brief overview of Perennial, Bazaar Blends, and JET Photography — framed as evidence of systems thinking, entrepreneurial drive, and creative range.

Remove any existing "Score me for this role" prompt. Do not add a scoring prompt to the UI.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHANGE 6 — starter prompt visibility logic
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Update starter prompt display logic:

- Track which prompts have been used (store clicked prompt values in a usedPromptsRef = useRef(new Set()))
- Turn count = number of complete back-and-forth exchanges (1 user message + 1 assistant message = 1 turn)
- Display rules:
    - Turns 0 (opening): show all 4 prompts
    - Turns 1–3: show only unused prompts (used ones are removed, not greyed out — keep it clean)
    - Turn 4+: hide all prompts entirely
- Do NOT show prompts during active streaming (isLoading = true)
- If all 4 have been used before turn 4, hide them

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GUARDRAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Modified files: src/components/AIInterview.jsx, src/components/AIInterview.module.css, api/chat.js only
- Do not modify VoiceModeUI.jsx, useVoiceMode.js, analyze-jd.js, log-lead.js, or any other file
- Do not rename any existing state variables or props
- All existing functionality must remain intact: gate form, voice mode, transcript email, dev bypass shortcut (jtdev), GA4 events, JD parsing
- The rubric.js scoring flow (if it exists) should remain wired to the transcript email — do not remove it, just don't expose it in the chat UI
- If rubric.js does NOT exist: note this prominently in the build report but do not attempt to rebuild it — that is a separate task

After completing all changes, provide a build report with:
1. Whether rubric.js was found and where
2. Whether a thinking indicator already existed
3. List of every file modified
4. Any assumptions made
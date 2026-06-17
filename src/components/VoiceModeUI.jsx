import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * Self-contained voice-mode controls. Inline styles only — intentionally no CSS
 * module, so this layer is fully decoupled from AIInterview.module.css. Replaces
 * the text input + send row while voice mode is active.
 *
 * Props:
 *   isListening, isSpeaking, voiceSupported, transcript, isStreaming (booleans/string)
 *   onStartListening, onStopListening, onStopSpeaking, onHearFullResponse (functions)
 *   onExitVoiceMode (function, required) — leave voice mode, returning to text input
 *   hasLastResponse (boolean) — a prior AI answer exists to replay in full
 *
 * The mic button toggles: tap to start, tap again (onStopListening) to send.
 */

const GOLD = 'var(--accent-gold)';
const SANS = 'var(--font-sans)';

function MicIcon({ color }) {
  return (
    <svg
      width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke={color} strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <line x1="12" y1="18" x2="12" y2="21" />
      <line x1="8" y1="21" x2="16" y2="21" />
    </svg>
  );
}

// Shown while listening: a filled stop square signals "tap to stop & send",
// the inverse affordance of the mic. Reuses the gold accent so it stays on
// theme rather than introducing a clashing red.
function StopIcon({ color }) {
  return (
    <svg
      width="22" height="22" viewBox="0 0 24 24"
      fill={color} stroke="none" aria-hidden="true"
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

const outerStyle = {
  display:        'flex',
  flexDirection:  'column',
  alignItems:     'center',
  gap:            '12px',
  padding:        '16px 0',
  borderTop:      '1px solid var(--color-ember-edge)',
  background:     'var(--color-charcoal)',
};

const goldStatus = {
  fontFamily:  SANS,
  fontSize:    '12px',
  color:       GOLD,
  display:     'inline-flex',
  alignItems:  'center',
  gap:         '6px',
  margin:      0,
};

const mutedStatus = {
  fontFamily: SANS,
  fontSize:   '12px',
  color:      'rgba(255,255,255,0.4)',
  margin:     0,
};

export default function VoiceModeUI({
  isListening,
  isSpeaking,
  voiceSupported,
  transcript,
  isStreaming,
  onStartListening,
  onStopListening,
  onStopSpeaking,
  onHearFullResponse,
  onExitVoiceMode,
  hasLastResponse = false,
}) {
  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Only treat isSpeaking as blocking after the component has been mounted for
  // 500ms — avoids stale TTS state on mobile wedging the mic shut on first load.
  const [speakingSettled, setSpeakingSettled] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSpeakingSettled(true), 500);
    return () => clearTimeout(t);
  }, []);

  // Mic-permission denial after entering voice mode. VoiceModeUI only renders
  // inside an active voice session (which requires support at activation), so a
  // false here means access was revoked — never the initial-unsupported case.
  if (!voiceSupported) {
    return (
      <div style={outerStyle}>
        <p
          style={{
            fontFamily: SANS,
            fontSize:   '12px',
            color:      'rgba(196,113,74,0.9)', // ember / warning
            textAlign:  'center',
            lineHeight: 1.5,
            maxWidth:   '88%',
            margin:     0,
          }}
        >
          Microphone access denied — enable in browser settings to use voice mode
        </p>
        {/* Always give a way out — never strand the user in broken voice mode. */}
        <button
          type="button"
          onClick={onExitVoiceMode}
          style={{
            background:    'transparent',
            border:        '1px solid rgba(255,255,255,0.12)',
            borderRadius:  '20px',
            color:         'rgba(255,255,255,0.4)',
            fontFamily:    SANS,
            fontSize:      '11px',
            padding:       '6px 14px',
            cursor:        'pointer',
            marginTop:     '8px',
            minHeight:     '44px',
            WebkitTapHighlightColor: 'transparent',
            touchAction:   'manipulation',
          }}
        >
          ← Return to text mode
        </button>
      </div>
    );
  }

  const micDisabled = isStreaming || (speakingSettled && isSpeaking);

  const micBg = micDisabled
    ? 'rgba(255,255,255,0.04)'
    : isListening
      ? 'rgba(212,168,63,0.2)'
      : 'rgba(212,168,63,0.08)';

  const micBorder = micDisabled
    ? '1.5px solid rgba(255,255,255,0.1)'
    : isListening
      ? '1.5px solid rgba(212,168,63,0.9)'
      : '1.5px solid rgba(212,168,63,0.4)';

  const iconColor = micDisabled ? 'rgba(255,255,255,0.2)' : GOLD;

  return (
    <div style={outerStyle}>
      {/* Live interim transcript preview — a hint, not the final transcript. */}
      {isListening && transcript && (
        <div
          style={{
            background:       'rgba(212,168,63,0.06)',
            border:           '1px solid rgba(212,168,63,0.15)',
            borderRadius:     '8px',
            padding:          '8px 12px',
            maxWidth:         '80%',
            display:          '-webkit-box',
            WebkitLineClamp:  2,
            WebkitBoxOrient:  'vertical',
            overflow:         'hidden',
          }}
        >
          <span
            style={{
              fontFamily: SANS,
              fontSize:   '13px',
              color:      'rgba(255,255,255,0.7)',
              fontStyle:  'italic',
              lineHeight: 1.4,
            }}
          >
            {transcript}
          </span>
        </div>
      )}

      {/* Mic button with a listening pulse ring behind it. */}
      <div
        style={{
          position:       'relative',
          width:          '64px',
          height:         '64px',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          WebkitTapHighlightColor: 'transparent',
          touchAction:    'manipulation',
        }}
      >
        {isListening && (
          <motion.span
            aria-hidden="true"
            style={{
              position:      'absolute',
              inset:         0,
              borderRadius:  '50%',
              border:        '1.5px solid rgba(212,168,63,0.6)',
              pointerEvents: 'none',
            }}
            initial={{ scale: 1, opacity: 0.4 }}
            animate={{ scale: 1.4, opacity: 0 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
        <button
          type="button"
          onClick={isListening ? onStopListening : onStartListening}
          onTouchEnd={(e) => {
            e.preventDefault(); // prevent ghost click
            if (micDisabled) return;
            if (isListening) {
              onStopListening();
            } else {
              onStartListening();
            }
          }}
          disabled={micDisabled}
          aria-label={isListening ? 'Tap to stop and send' : 'Tap to speak'}
          style={{
            position:       'relative',
            width:          '64px',
            height:         '64px',
            borderRadius:   '50%',
            background:     micBg,
            border:         micBorder,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            padding:        0,
            cursor:         micDisabled ? 'not-allowed' : 'pointer',
            transition:     'background 0.2s ease, border-color 0.2s ease',
            WebkitTapHighlightColor: 'transparent',
            touchAction:    'manipulation',
            userSelect:     'none',
            WebkitUserSelect: 'none',
          }}
        >
          {isListening
            ? <StopIcon color={iconColor} />
            : <MicIcon color={iconColor} />}
        </button>
      </div>

      {/* Status line. */}
      {isListening ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <p style={goldStatus}>Listening…</p>
          {/* Tells the recruiter how to stop — tap-to-stop isn't auto-silence. */}
          <span style={{
            fontFamily: SANS,
            fontSize:   '10px',
            color:      'rgba(255,255,255,0.3)',
          }}>
            Tap to send
          </span>
        </div>
      ) : isSpeaking ? (
        <p style={goldStatus}>
          Speaking…
          <button
            type="button"
            onClick={onStopSpeaking}
            aria-label="Stop speaking"
            style={{
              background: 'none',
              border:     'none',
              color:      GOLD,
              cursor:     'pointer',
              fontSize:   '12px',
              lineHeight: 1,
              padding:    '0 2px',
            }}
          >
            ■
          </button>
        </p>
      ) : isStreaming ? (
        <p style={mutedStatus}>Jaxon&apos;s AI is responding…</p>
      ) : (
        <p style={mutedStatus}>Tap to speak</p>
      )}

      {/* Replay the complete answer after the auto-read short version finishes. */}
      {!isSpeaking && hasLastResponse && (
        <button
          type="button"
          onClick={onHearFullResponse}
          style={{
            background:  'transparent',
            border:      'none',
            color:       GOLD,
            opacity:     0.6,
            fontFamily:  SANS,
            fontSize:    '11px',
            cursor:      'pointer',
            padding:     '2px 4px',
            transition:  'opacity 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '0.6'; }}
        >
          ▶ Hear full response
        </button>
      )}

      {/* Always-visible exit. Silences TTS, then hands control back to text mode.
          We deliberately do NOT call onStopListening here: the hook's stopListening
          fires onTranscriptComplete (→ sendMessage), and exit must abandon the
          in-progress transcript, not send it. Recognition teardown is handled by
          the hook's voiceModeActive→false effect (stopRecognition, no send). */}
      <button
        type="button"
        onClick={() => {
          if (onStopSpeaking) onStopSpeaking();
          onExitVoiceMode();
        }}
        style={{
          background:    'transparent',
          border:        '1px solid rgba(255,255,255,0.12)',
          borderRadius:  '20px',
          color:         'rgba(255,255,255,0.4)',
          fontFamily:    SANS,
          fontSize:      '11px',
          letterSpacing: '0.06em',
          padding:       '6px 14px',
          cursor:        'pointer',
          marginTop:     '4px',
          transition:    'color 0.2s ease, border-color 0.2s ease',
          WebkitTapHighlightColor: 'transparent',
          touchAction:   'manipulation',
          minHeight:     '44px', // mobile touch target
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
        }}
        aria-label="Return to text mode"
      >
        ← Return to text mode
      </button>
    </div>
  );
}

import { motion } from 'framer-motion';

/**
 * Self-contained voice-mode controls. Inline styles only — intentionally no CSS
 * module, so this layer is fully decoupled from AIInterview.module.css. Replaces
 * the text input + send row while voice mode is active.
 *
 * Props:
 *   isListening, isSpeaking, voiceSupported, transcript, isStreaming (booleans/string)
 *   onStartListening, onStopSpeaking, onHearFullResponse (functions)
 *   hasLastResponse (boolean) — a prior AI answer exists to replay in full
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
  onStopSpeaking,
  onHearFullResponse,
  hasLastResponse = false,
}) {
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
      </div>
    );
  }

  const micDisabled = isStreaming || isSpeaking;

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
          onClick={onStartListening}
          disabled={micDisabled}
          aria-label="Tap to speak"
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
          }}
        >
          <MicIcon color={iconColor} />
        </button>
      </div>

      {/* Status line. */}
      {isListening ? (
        <p style={goldStatus}>Listening…</p>
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
    </div>
  );
}

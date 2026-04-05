import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './AIChatbot.css';

const QUICK_PROMPTS = [
  { icon: '📚', text: 'Recommend me a good book' },
  { icon: '🔍', text: 'How do I search for books?' },
  { icon: '🛒', text: 'How do I place an order?' },
  { icon: '📍', text: 'Library location & hours' },
  { icon: '💳', text: 'What payment methods are available?' },
  { icon: '📄', text: 'How do I get my order bill?' },
];

const WELCOME = `👋 **Hello! I'm your Lexi Library Assistant.**

I can help you with:
• 📚 Book recommendations by genre or mood
• 🛒 Placing orders and checkout
• 📍 Library location, hours & contact
• 💳 Payment methods and order tracking

What would you like to know?`;

export default function AIChatbot() {
  const location = useLocation();
  const [open, setOpen]       = useState(false);
  
  if (location.pathname.startsWith('/invoice')) return null;
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: WELCOME, time: new Date() },
  ]);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const textareaRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    }
  }, [messages, open]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 96) + 'px';
    }
  }, [input]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput('');

    const updated = [...messages, { role: 'user', content: userText, time: new Date() }];
    setMessages(updated);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated.slice(-12).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();

      if (data.success && data.reply) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.reply,
          time: new Date(),
        }]);
      } else {
        throw new Error(data.message || 'No reply received');
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ I'm having trouble connecting right now.\n\nPlease reach us directly:\n📞 **+91 96246 07410**\n📍 Kapodara, Surat — Mon to Sat, 9AM–8PM`,
        time: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => setMessages([
    { role: 'assistant', content: `🔄 Chat cleared! How can I help you?`, time: new Date() },
  ]);

  const fmt = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  // Render markdown-lite: **bold**, bullet lines, newlines
  const renderContent = (text) =>
    text.split('\n').map((line, i) => {
      const html = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      if (line.startsWith('• '))
        return <div key={i} className="ai-bullet" dangerouslySetInnerHTML={{ __html: html }} />;
      if (line === '') return <br key={i} />;
      return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
    });

  return (
    <>
      {/* Floating toggle button */}
      <button
        className={`ai-chat-btn${open ? ' open' : ''}`}
        onClick={() => setOpen(o => !o)}
        title={open ? 'Close Assistant' : 'Chat with AI Assistant'}
        aria-label="AI Assistant"
      >
        <span className="ai-chat-btn__icon">{open ? '✕' : '💬'}</span>
        {!open && <span className="ai-chat-btn__pulse" />}
        {!open && <span className="ai-chat-btn__label">Ask AI</span>}
      </button>

      {/* Chat window */}
      <div className={`ai-chat-window${open ? ' open' : ''}`} role="dialog" aria-label="AI Chat Assistant">

        {/* Header */}
        <div className="ai-chat-header">
          <div className="ai-chat-header__left">
            <div className="ai-chat-header__avatar">✦</div>
            <div>
              <div className="ai-chat-header__name">I am Lexi , How can I help you?</div>
              <div className="ai-chat-header__status">
                <span className="ai-chat-header__dot" />
                {loading ? 'Typing...' : 'Online • Luxe Library Powered By' }
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={clearChat} className="ai-chat-header__btn" title="Clear chat">🗑️</button>
            <button onClick={() => setOpen(false)} className="ai-chat-header__btn" title="Close">✕</button>
          </div>
        </div>

        {/* Messages */}
        <div className="ai-chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`ai-msg${msg.role === 'user' ? ' user' : ''}`}>
              {msg.role === 'assistant' && <div className="ai-msg__avatar">✦</div>}
              <div className="ai-msg__bubble-wrap">
                <div className="ai-msg__bubble">{renderContent(msg.content)}</div>
                <div className="ai-msg__time">{fmt(msg.time)}</div>
              </div>
              {msg.role === 'user' && <div className="ai-msg__user-avatar">U</div>}
            </div>
          ))}

          {/* Typing dots */}
          {loading && (
            <div className="ai-msg">
              <div className="ai-msg__avatar">✦</div>
              <div className="ai-msg__bubble-wrap">
                <div className="ai-msg__bubble ai-msg__typing">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts — only shown at the start */}
        {messages.length <= 2 && !loading && (
          <div className="ai-chat-quick">
            <div className="ai-chat-quick__label">Quick questions:</div>
            {QUICK_PROMPTS.map((p, i) => (
              <button key={i} className="ai-chat-quick__btn" onClick={() => sendMessage(p.text)}>
                {p.icon} {p.text}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="ai-chat-input">
          <textarea
            ref={(el) => { inputRef.current = el; textareaRef.current = el; }}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
            }}
            placeholder="Type a message... (Enter to send)"
            disabled={loading}
            className="ai-chat-input__field"
            rows={1}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="ai-chat-input__send"
            title="Send"
          >
            {loading ? <span className="ai-spin" /> : '➤'}
          </button>
        </div>

        <div className="ai-chat-footer">Powered by Luxe Library • Luxe Library, Surat</div>
      </div>
    </>
  );
}
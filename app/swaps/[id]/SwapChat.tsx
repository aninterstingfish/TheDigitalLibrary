"use client";

import { useState, useEffect, useRef } from "react";

type Message = {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; username: string; name: string };
};

export default function SwapChat({ swapId, currentUserId }: { swapId: string; currentUserId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/swaps/${swapId}/messages`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setMessages(data); });
  }, [swapId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setSending(true);
    setErr("");
    const res = await fetch(`/api/swaps/${swapId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || "Failed to send."); setSending(false); return; }
    setMessages((prev) => [...prev, data]);
    setText("");
    setSending(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-5 pt-4 pb-3 border-b border-gray-50">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Swap chat</p>
      </div>

      <div className="h-64 overflow-y-auto px-5 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-gray-300 text-sm text-center py-6">No messages yet. Say something!</p>
        )}
        {messages.map((m) => {
          const isMine = m.sender.id === currentUserId;
          return (
            <div key={m.id} className={`flex flex-col gap-0.5 ${isMine ? "items-end" : "items-start"}`}>
              <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                isMine ? "bg-black text-white rounded-br-sm" : "bg-gray-100 text-black rounded-bl-sm"
              }`}>
                {m.content}
              </div>
              <p className="text-xs text-gray-300 px-1">
                {isMine ? "You" : `@${m.sender.username}`} · {new Date(m.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex items-center gap-2 px-4 py-3 border-t border-gray-50">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          maxLength={2000}
          className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="px-4 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {sending ? "…" : "Send"}
        </button>
      </form>
      {err && <p className="text-red-500 text-xs px-5 pb-3">{err}</p>}
    </div>
  );
}

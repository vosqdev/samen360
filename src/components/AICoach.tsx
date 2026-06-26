import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Sparkles, AlertCircle, HelpCircle, User, CheckCircle } from "lucide-react";
import { UserRole } from "../types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isTaskLogged?: boolean;
}

interface AICoachProps {
  onTaskLogged: (taskTitle: string) => void;
  selectedRole: UserRole;
}

export default function AICoach({ onTaskLogged, selectedRole }: AICoachProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Dag! Ik ben uw AI Participatiecoach voor het plan Spoorzone Havenkwartier. Waar wilt u over meepraten of wat wilt u weten over de plannen? \n\nU kunt mij bijvoorbeeld vragen stellen over parkeren, bomen, geluidshinder of sociale huurbouw.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const SUGGESTED_PROMPTS = [
    { text: "Ik maak me zorgen om verkeer & parkeren.", label: "Verkeer & Parkeren" },
    { text: "Waarom komen hier appartementen?", label: "Woningbehoefte" },
    { text: "Kan er meer groen en natuur speelruimte komen?", label: "Groen & Spelen" },
    { text: "Welk merk lantaarnpaal wordt er gebruikt?", label: "Onbekende Vraag Toets" }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Build history payload from current log excluding welcome
      const historyPayload = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const coachMsg: ChatMessage = {
          id: `c-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isTaskLogged: data.createTask,
        };

        setMessages((prev) => [...prev, coachMsg]);

        // If the server decided a task needs to be logged, trigger callback
        if (data.createTask && data.suggestedTask) {
          onTaskLogged(data.suggestedTask);
        }
      } else {
        throw new Error(data.error || "Fout bij ophalen antwoord.");
      }
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `Mijn excuses, er ging iets mis in de verbinding met het participatieregister: ${err.message || "Onbekende fout"}. In fallback-modus kan ik u vertellen dat Spoorzone Havenkwartier volledig autoluw wordt en gasvrije WKO-verwarming krijgt!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-stone-900 to-stone-950 text-stone-100 rounded-3xl p-5 border border-stone-800 shadow-xl flex flex-col h-[650px] lg:h-[720px] transition-all relative overflow-hidden" id="ai-coach-panel">
      {/* Visual Ambient Background glows */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-900/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-44 h-44 bg-amber-900/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-850 pb-3 mb-4 z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-emerald-600/80 rounded-xl flex items-center justify-center border border-emerald-500/30 text-emerald-300 shadow-inner">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-sm md:text-base leading-none text-white flex items-center gap-1.5">
              AI Participatiecoach
              <span className="inline-block text-[9px] font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                B1 Niveau
              </span>
            </h3>
            <span className="text-[10px] text-stone-400">Geeft antwoord conform Utrechtse Omgevingswet</span>
          </div>
        </div>

        <div className="text-[10px] bg-stone-800/80 px-2.5 py-1 rounded-full border border-stone-750 font-medium text-stone-300">
          Rol: <span className="font-bold text-emerald-400">{selectedRole}</span>
        </div>
      </div>

      {/* Scrollable messages log */}
      <div className="flex-grow overflow-y-auto pr-2 flex flex-col gap-4 no-scrollbar min-h-0 z-10">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[85%] ${isUser ? "self-end items-end" : "self-start items-start"}`}
            >
              {/* Message bubble */}
              <div
                className={`p-3.5 rounded-2xl text-xs md:text-sm leading-relaxed transition-all ${
                  isUser
                    ? "bg-emerald-600 text-white rounded-br-none shadow-md shadow-emerald-950/20"
                    : "bg-stone-850 text-stone-100 rounded-bl-none border border-stone-800 shadow-sm"
                }`}
              >
                {/* Formatting newline characters */}
                {msg.content.split("\n").map((line, i) => (
                  <p key={i} className={i > 0 ? "mt-1.5" : ""}>
                    {line}
                  </p>
                ))}

                {/* Task logged system banner */}
                {msg.isTaskLogged && (
                  <div className="mt-3.5 p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2 text-xs text-amber-200">
                    <CheckCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[11px] uppercase tracking-wider text-amber-300">
                        Taak Geregistreerd in Planning
                      </p>
                      <p className="text-[10px] text-stone-300 mt-0.5">
                        Aangezien dit een onbekend of nog niet vastgesteld detail is, is er automatisch een actiepunt aangemaakt voor onze wegbeheerders en projectteams.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Timestamp / Role info */}
              <span className="text-[9px] text-stone-500 mt-1 uppercase font-semibold tracking-wider">
                {isUser ? `U (${selectedRole})` : "Samen360 Coach"} • {msg.timestamp}
              </span>
            </div>
          );
        })}

        {/* Loading bubble */}
        {isLoading && (
          <div className="self-start max-w-[85%] flex items-center gap-1.5 p-3 rounded-2xl bg-stone-850 border border-stone-800 text-stone-400 text-xs shadow-sm">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            <span className="ml-1 text-[11px] font-mono select-none">AI raadpleegt Utrechtse beleidsdocumenten...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompting clips */}
      <div className="py-2 z-10 shrink-0">
        <span className="text-[10px] text-stone-400 block mb-1.5 font-bold uppercase tracking-wider">
          💡 Veelbestelde vragen (Klik om te stellen):
        </span>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt.text}
              disabled={isLoading}
              onClick={() => handleSendMessage(prompt.text)}
              className="text-[10px] bg-stone-850 hover:bg-stone-800 text-stone-300 px-2.5 py-1 rounded-lg border border-stone-800 transition-colors disabled:opacity-50 text-left cursor-pointer font-medium hover:border-emerald-800"
            >
              {prompt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input keyboard row */}
      <div className="border-t border-stone-850 pt-3 z-10 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputValue);
          }}
          className="flex items-center gap-2 bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 focus-within:border-emerald-700 transition"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            placeholder="Type uw participatie-vraag..."
            className="flex-grow bg-transparent text-xs md:text-sm focus:outline-none placeholder-stone-500 text-stone-100"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-505 active:scale-95 disabled:bg-stone-805 disabled:text-stone-605 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

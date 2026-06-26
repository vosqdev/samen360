import React, { useState, useEffect } from "react";
import { NewsArticle } from "../types";
import { INITIAL_NEWS } from "../data";
import { Newspaper, Bell, FileDown, CheckCircle2, History, ArrowRight, Eye, User, Share2, Trash2, Plus, X, UploadCloud, BookOpen, AlertCircle } from "lucide-react";

interface NieuwsCentrumProps {
  news: NewsArticle[];
  selectedRole?: string;
  onCreateNewsArticle?: (article: Omit<NewsArticle, "id">) => Promise<void>;
  onDeleteNewsArticle?: (id: string) => Promise<void>;
}

export default function NieuwsCentrum({ news, selectedRole, onCreateNewsArticle, onDeleteNewsArticle }: NieuwsCentrumProps) {
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(news[0] || INITIAL_NEWS[0]);
  const [emailSub, setEmailSub] = useState("");
  const [subbed, setSubbed] = useState(false);

  // Form toggles and states for admin news management
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Nieuws");
  const [docName, setDocName] = useState("");
  const [image, setImage] = useState("https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600&auto=format&fit=crop");
  const [readTime, setReadTime] = useState("3 min leestijd");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const imagePresets = [
    { name: "Bouwwerk", url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600&auto=format&fit=crop" },
    { name: "Spoorzone", url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=600&auto=format&fit=crop" },
    { name: "Overleg", url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=600&auto=format&fit=crop" },
    { name: "Utrecht West", url: "https://images.unsplash.com/photo-1575908553237-064e0094153a?q=80&w=600&auto=format&fit=crop" }
  ];

  // Sync selected article when the news updates
  useEffect(() => {
    if (selectedArticle && !news.some((n) => n.id === selectedArticle.id)) {
      setSelectedArticle(news[0] || null);
    } else if (!selectedArticle && news.length > 0) {
      setSelectedArticle(news[0]);
    }
  }, [news, selectedArticle]);

  // Automatic platform change logs (audit log)
  const [auditLogs, setAuditLogs] = useState([
    { id: "log1", event: "Nieuwe burger-marker 'Fruitbomen in Havenpark' geplaatst", date: "Juni 11, 2026", user: "Sabine van Elst", type: "Marker" },
    { id: "log2", event: "AI coach registreerde een opvolg-taak over 'laadpalencapaciteit'", date: "Juni 11, 2026", user: "AI Systeem", type: "AI-Taak" },
    { id: "log3", event: "Besluitvogelgeluidswal geüpdatet naar Versie 0.9 (Ter Inzage)", date: "Juni 10, 2026", user: "Gemeente Utrecht", type: "Besluit" },
    { id: "log4", event: "PDF 'Participatiegids_Omgevingswet2026.pdf' geüpload door moderator", date: "Juni 01, 2026", user: "Moderator", type: "Publicatie" }
  ]);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSub.trim()) return;
    setSubbed(true);
    setTimeout(() => {
      setEmailSub("");
    }, 2500);
  };

  const handleCreateArticleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!title.trim() || !content.trim()) {
      setErrorMsg("Vul a.u.b ten minste een titel en inhoud in.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedDate = new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
      const documentsList = docName.trim() ? [docName.trim()] : [];
      
      if (onCreateNewsArticle) {
        await onCreateNewsArticle({
          title: title.trim(),
          summary: summary.trim() || title.trim(),
          content: content.trim(),
          category,
          date: formattedDate,
          image,
          readTime,
          documents: documentsList,
          views: 0
        });

        // Add to audit logs
        const newLog = {
          id: `log-${Date.now()}`,
          event: `${category === "Nieuws" ? "Nieuwsbericht" : "Publicatie"} '${title.trim()}' gepubliceerd`,
          date: "Vandaag",
          user: "Admin",
          type: category === "Nieuws" ? "Nieuws" : "Publicatie"
        };
        setAuditLogs([newLog, ...auditLogs]);
      }

      // Reset form
      setTitle("");
      setSummary("");
      setContent("");
      setCategory("Nieuws");
      setDocName("");
      setImage("https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600&auto=format&fit=crop");
      setReadTime("3 min leestijd");
      setIsFormOpen(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Fout bij het opslaan: " + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="nieuwscentrum-grid">
      
      {/* Left Column: News release list & subscription */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        {/* Main News portal wrapper */}
        <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm flex flex-col gap-5">
          <div className="flex justify-between items-center border-b border-stone-100 pb-3">
            <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-emerald-800" />
              <span>Nieuwscentrum & Publicaties</span>
            </h3>
            
            <div className="flex items-center gap-3">
              {selectedRole === "Admin" && (
                <button
                  type="button"
                  onClick={() => setIsFormOpen(!isFormOpen)}
                  className="bg-emerald-800 hover:bg-emerald-950 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer pointer-events-auto"
                >
                  {isFormOpen ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{isFormOpen ? "Sluiten" : "Nieuw Bericht / Publicatie"}</span>
                </button>
              )}
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-1 rounded shrink-0">Utrecht Pers</span>
            </div>
          </div>

          {isFormOpen && (
            <form onSubmit={handleCreateArticleSubmit} className="bg-stone-50 rounded-2xl border border-stone-200 p-5 mt-1 space-y-4 animate-in slide-in-from-top-4 duration-300 text-left">
              <h4 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-800" />
                <span>Nieuwsbericht of Publicatie opstellen</span>
              </h4>

              {errorMsg && (
                <div className="bg-red-50 border border-red-250 rounded-xl p-3 text-xs text-red-800 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase">Titel</label>
                  <input
                    type="text"
                    required
                    maxLength={150}
                    placeholder="bijv. Inspraakronde Havenkwartier succesvol afgerond"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs text-stone-850 focus:outline-emerald-800 font-semibold mt-1"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase">Categorie</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs text-stone-850 focus:outline-emerald-800 font-semibold mt-1"
                  >
                    <option value="Nieuws">Nieuwsbericht</option>
                    <option value="Publicatie">Formele Publicatie</option>
                    <option value="Beleid">Beleidsdocument</option>
                    <option value="Rapport">Participatierapport</option>
                    <option value="Omgevingsplan">Omgevingsplan / Visie</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase">Korte inleiding / samenvatting</label>
                <input
                  type="text"
                  maxLength={300}
                  placeholder="bijv. Een overzicht van de belangrijkste resultaten en burger-markers van afgelopen maand."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs text-stone-850 focus:outline-emerald-800 font-semibold mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase">Volledige Inhoud (Markdown / Platte tekst)</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Schrijf hier de volledige inhoud van het nieuwsbericht of de publicatie..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs text-stone-850 focus:outline-emerald-800 font-semibold mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase">Gekoppeld bestand / Document (Optioneel)</label>
                  <div className="relative mt-1 border border-stone-205 rounded-xl bg-white overflow-hidden flex items-center">
                    <FileDown className="w-4 h-4 text-stone-400 absolute left-3" />
                    <input
                      type="text"
                      placeholder="bijv. Participatie_Rapport_Spoorzone_2026.pdf"
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      className="w-full bg-white p-2.5 pl-9 text-xs text-stone-850 focus:outline-none font-semibold"
                    />
                  </div>
                  <span className="text-[9px] text-stone-400 mt-1 block">Laat burgers direct dit bestand downloaden bij de publicatie.</span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase">Leestijd-indicatie / Label</label>
                  <input
                    type="text"
                    placeholder="bijv. 4 min leestijd of PDF download"
                    value={readTime}
                    onChange={(e) => setReadTime(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs text-stone-850 focus:outline-emerald-800 font-semibold mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">Kies een sfeervolle omslagafbeelding</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {imagePresets.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setImage(preset.url)}
                      className={`relative rounded-xl overflow-hidden h-14 border text-left transition duration-200 pointer-events-auto cursor-pointer ${
                        image === preset.url ? "border-emerald-700 ring-2 ring-emerald-700" : "border-stone-200 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1.5 bg-black/60 text-[8px] font-bold text-white px-1 py-0.5 rounded uppercase">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Of voer een eigen afbeelding URL in..."
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-xl p-2 px-3 text-[11px] text-stone-850 focus:outline-emerald-800"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 border border-stone-200 text-stone-555 hover:bg-stone-100 font-bold text-xs py-2.5 rounded-xl transition cursor-pointer"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-emerald-850 hover:bg-emerald-950 text-white font-extrabold text-xs py-2.5 rounded-xl transition shadow-sm cursor-pointer disabled:bg-stone-300"
                >
                  {isSubmitting ? "Bezig met publiceren..." : "Bericht / Publicatie Publiceren 🚀"}
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {news.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedArticle(item)}
                className={`text-left rounded-2xl border overflow-hidden group flex flex-col justify-between transition h-64 pointer-events-auto cursor-pointer ${
                  selectedArticle?.id === item.id
                    ? "border-emerald-700 ring-1 ring-emerald-700 bg-emerald-50/10"
                    : "border-stone-200 bg-white hover:bg-stone-50"
                }`}
                id={`news-btn-${item.id}`}
              >
                <div className="w-full h-24 overflow-hidden relative">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-350"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute top-2 right-2 bg-black/70 text-[9px] font-bold text-stone-100 px-2 py-0.5 rounded uppercase">
                    {item.category}
                  </span>
                </div>

                <div className="p-3.5 flex-grow flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] text-stone-400 font-bold block">{item.date} • {item.readTime}</span>
                    <h4 className="font-extrabold text-stone-900 text-xs md:text-sm mt-1 leading-snug group-hover:text-emerald-850 line-clamp-2">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-stone-555 leading-relaxed mt-1 line-clamp-2">
                      {item.summary}
                    </p>
                  </div>

                  <span className="text-[10px] font-bold text-emerald-800 group-hover:underline flex items-center gap-0.5 mt-2">
                    Lees Meer <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Quick Subscribe banner */}
          <div className="bg-emerald-800 text-white rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg shadow-emerald-950/10 mt-2">
            <div className="flex gap-3 items-center">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm leading-tight text-white">Geen wijziging missen?</h4>
                <p className="text-[11px] text-emerald-200 mt-0.5">Laat uw e-mail achter voor automatische notificaties.</p>
              </div>
            </div>

            <form onSubmit={handleSubscribe} className="flex gap-2 w-full md:w-auto shrink-0">
              {subbed ? (
                <div className="bg-emerald-900/80 text-emerald-200 font-bold text-xs px-4 py-2.5 rounded-xl border border-emerald-700/60 flex items-center gap-1.5 animation-fade-in pl-5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Geabonneerd op Spoorzone West!</span>
                </div>
              ) : (
                <>
                  <input
                    type="email"
                    required
                    placeholder="uwname@domein.nl"
                    value={emailSub}
                    onChange={(e) => setEmailSub(e.target.value)}
                    className="bg-emerald-950/30 text-xs text-white border border-emerald-700 rounded-xl px-3 py-2.5 placeholder-emerald-400 focus:outline-none focus:ring-1 focus:ring-white w-full md:w-48 font-semibold"
                  />
                  <button
                    type="submit"
                    className="bg-white hover:bg-stone-100 text-emerald-900 font-extrabold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer active:scale-95 shrink-0"
                  >
                    Activeer Alerts
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Right Column: Selected News Deep Read & Automatic Platform Log */}
      <div className="flex flex-col gap-6">
        
        {/* News Article detail preview block */}
        {selectedArticle && (
          <div className="bg-stone-50 rounded-3xl border border-stone-200 p-5 shadow-xs flex flex-col gap-3.5" id="news-details-spot">
            <h5 className="text-[10px] uppercase font-black tracking-widest text-emerald-800">
              {selectedArticle.category || "Utrecht Bulletin"}
            </h5>
            <h4 className="font-extrabold text-stone-900 text-sm md:text-base leading-tight">
              {selectedArticle.title}
            </h4>
            <span className="text-[10px] text-stone-400">Gemaakt door: Planbureau • {selectedArticle.date}</span>

            <p className="text-stone-750 text-xs leading-relaxed font-semibold">
              {selectedArticle.content}
            </p>

            {/* Simulated file download */}
            {selectedArticle.documents.length > 0 && (
              <div className="border-t border-stone-200 pt-3">
                <span className="text-[9px] uppercase font-bold text-stone-400 block mb-1.5">Gekoppelde PDF / Publicatie:</span>
                {selectedArticle.documents.map((doc, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      // Trigger a dynamic file download simulation
                      const element = document.createElement("a");
                      const file = new Blob([`Inhoud van het bestand: ${doc}\n\nDit is een gedownload publicatiedocument voor het project Spoorzone Havenkwartier.`], { type: "text/plain;charset=utf-8" });
                      element.href = URL.createObjectURL(file);
                      element.download = doc;
                      document.body.appendChild(element);
                      element.click();
                      document.body.removeChild(element);
                    }}
                    className="w-full flex items-center justify-between text-left text-xs bg-white border border-stone-200 p-2.5 rounded-xl text-emerald-900 hover:bg-emerald-50/10 transition mb-1.5 cursor-pointer pointer-events-auto"
                  >
                    <span className="truncate font-semibold">{doc}</span>
                    <FileDown className="w-4 h-4 shrink-0 text-emerald-850" />
                  </button>
                ))}
              </div>
            )}

            {selectedRole === "Admin" && (
              <div className="border-t border-stone-250 pt-3 mt-1.5">
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm(`Weet u zeker dat u '${selectedArticle.title}' wilt verwijderen uit het Nieuwscentrum?`)) {
                      if (onDeleteNewsArticle) {
                        try {
                          await onDeleteNewsArticle(selectedArticle.id);
                          const delLog = {
                            id: `log-${Date.now()}`,
                            event: `Bericht '${selectedArticle.title}' verwijderd`,
                            date: "Vandaag",
                            user: "Admin",
                            type: "Systeem"
                          };
                          setAuditLogs([delLog, ...auditLogs]);
                        } catch (err) {
                          console.error(err);
                        }
                      }
                    }
                  }}
                  className="w-full text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 p-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer pointer-events-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Artikel Verwijderen</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Platform Change Logs (audit logs) */}
        {selectedRole === "Admin" && (
          <div className="bg-white rounded-3xl border border-stone-200/80 p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-1.5">
              <History className="w-4.5 h-4.5 text-stone-600" />
              <h4 className="font-extrabold text-stone-850 text-sm">Transparantie Logboek</h4>
            </div>

            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div key={log.id} className="border-b border-stone-100 pb-2.5 flex justify-between gap-2.5 text-[11px] leading-relaxed">
                  <div>
                    <span className="text-[8px] font-bold text-stone-400 bg-stone-100 rounded px-1 uppercase inline-block mr-1">{log.type}</span>
                    <p className="text-stone-700 font-semibold mt-0.5">{log.event}</p>
                    <span className="text-[9px] text-stone-400 font-medium">Door: {log.user}</span>
                  </div>
                  <span className="text-[9px] text-stone-400 whitespace-nowrap shrink-0">{log.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

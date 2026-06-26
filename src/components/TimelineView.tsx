import React, { useState } from "react";
import { ProjectPhase, Decision, Publication } from "../types";
import { INITIAL_PHASES } from "../data";
import { 
  Calendar, 
  CheckCircle2, 
  ChevronRight, 
  FileDown, 
  Play, 
  MessageSquare, 
  AlertCircle, 
  Bookmark, 
  Plus, 
  Edit3, 
  Trash2, 
  Upload, 
  X, 
  Check, 
  FileText,
  AlertTriangle,
  Sparkles,
  Lock,
  ExternalLink
} from "lucide-react";

interface TimelineViewProps {
  phases: ProjectPhase[];
  decisions: Decision[];
  activePhaseId: string;
  onPhaseSelect: (id: string) => void;
  role?: string;
  projectId?: string;
  publications?: Publication[];
  onAddPublication?: (pub: { projectId: string; phaseId: string; title: string; fileName: string; fileSize?: string; downloadUrl?: string; uploadedBy?: string }) => void;
  onDeletePublication?: (id: string) => void;
  onAddDecision?: (decision: Omit<Decision, "id">) => void;
  onUpdateDecision?: (id: string, updatedFields: Partial<Omit<Decision, "id">>) => void;
  onDeleteDecision?: (id: string) => void;
}

export default function TimelineView({
  phases,
  decisions,
  activePhaseId,
  onPhaseSelect,
  role = "User",
  projectId = "hierdenbuiten",
  publications = [],
  onAddPublication,
  onDeletePublication,
  onAddDecision,
  onUpdateDecision,
  onDeleteDecision,
}: TimelineViewProps) {
  const activePhase = phases.find((p) => p.id === activePhaseId) || phases[2];
  const [isPlaying, setIsPlaying] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Form states for adding / editing decisions
  const [isAddingDecision, setIsAddingDecision] = useState(false);
  const [editingDecisionId, setEditingDecisionId] = useState<string | null>(null);

  const [decTitle, setDecTitle] = useState("");
  const [decText, setDecText] = useState("");
  const [decMotivation, setDecMotivation] = useState("");
  const [decUnderpinning, setDecUnderpinning] = useState("");
  const [decVersion, setDecVersion] = useState("v1.0");
  const [decStatus, setDecStatus] = useState<"Definitief" | "Concept" | "Ontwerp">("Definitief");
  const [decRelated, setDecRelated] = useState("");
  const [decDocs, setDecDocs] = useState("");

  // Form states for uploading publications
  const [isAddingPub, setIsAddingPub] = useState(false);
  const [pubTitle, setPubTitle] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedFileSize, setUploadedFileSize] = useState("");

  React.useEffect(() => {
    setIsPlaying(false);
    setIsAddingDecision(false);
    setEditingDecisionId(null);
    setIsAddingPub(false);
  }, [activePhaseId]);

  // Filtering decisions belonging to this selected phase
  const matchedDecisions = decisions.filter((d) => {
    if (d.phaseId) {
      return d.phaseId === activePhaseId;
    }
    return (
      d.category.toLowerCase() === activePhase.name.toLowerCase() || 
      (activePhase.name === "participatie" && d.category === "Wonen") ||
      (activePhase.name === "verkenning" && d.category === "Parkeren")
    );
  });

  // Filter publications matching project & phase
  const dynamicPubs = publications.filter(
    (p) => p.projectId === projectId && p.phaseId === activePhaseId
  );

  const staticPubs = activePhaseId === "3" ? [
    { id: "s1", title: "Gebiedsvisie Utrecht West v2.pdf", fileName: "Gebiedsvisie_Utrecht_West_v2.pdf", size: "3.4 MB" },
    { id: "s2", title: "Participatierapport Spoorzone.pdf", fileName: "Participatierapport_Spoorzone.pdf", size: "1.8 MB" }
  ] : [];

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleDownload = (fileName: string) => {
    triggerToast(`📥 Document download gestart: ${fileName}`);
  };

  const startEditDecision = (dec: Decision) => {
    setEditingDecisionId(dec.id);
    setIsAddingDecision(false);
    setDecTitle(dec.title);
    setDecText(dec.decisionText);
    setDecMotivation(dec.motivation || "");
    setDecUnderpinning(dec.underpinning || "");
    setDecVersion(dec.version || "v1.0");
    setDecStatus((dec.status as any) || "Definitief");
    setDecRelated(dec.relatedParticipation || "");
    setDecDocs(dec.documents ? dec.documents.join(", ") : "");
  };

  const startAddDecision = () => {
    setEditingDecisionId(null);
    setIsAddingDecision(true);
    setDecTitle("");
    setDecText("");
    setDecMotivation("");
    setDecUnderpinning("");
    setDecVersion("v1.0");
    setDecStatus("Definitief");
    setDecRelated("");
    setDecDocs("");
  };

  const handleDecisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!decTitle.trim() || !decText.trim()) {
      triggerToast("⚠️ Vul a.b.b. een titel en besluittekst in.");
      return;
    }

    const docList = decDocs ? decDocs.split(",").map(d => d.trim()).filter(Boolean) : [];
    const fields = {
      projectId,
      phaseId: activePhaseId,
      title: decTitle,
      category: activePhase.label,
      decisionText: decText,
      motivation: decMotivation,
      underpinning: decUnderpinning,
      date: new Date().toISOString().split('T')[0],
      status: decStatus,
      version: decVersion,
      relatedParticipation: decRelated,
      documents: docList
    };

    if (editingDecisionId) {
      if (onUpdateDecision) {
        onUpdateDecision(editingDecisionId, fields);
        triggerToast("✅ Besluit succesvol aangepast!");
      }
    } else {
      if (onAddDecision) {
        onAddDecision(fields);
        triggerToast("🎉 Nieuw besluit toegevoegd!");
      }
    }
    setIsAddingDecision(false);
    setEditingDecisionId(null);
  };

  const handleDeleteDecisionClick = (id: string, name: string) => {
    if (confirm(`Weet u zeker dat u het besluit "${name}" wilt verwijderen?`)) {
      if (onDeleteDecision) {
        onDeleteDecision(id);
        triggerToast("🗑️ Besluit succesvol verwijderd!");
      }
    }
  };

  const handlePubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubTitle.trim() || !uploadedFileName.trim()) {
      triggerToast("⚠️ Vul een titel in en sleep of selecteer een bestand.");
      return;
    }

    if (onAddPublication) {
      onAddPublication({
        projectId,
        phaseId: activePhaseId,
        title: pubTitle,
        fileName: uploadedFileName,
        fileSize: uploadedFileSize || "1.2 MB",
        downloadUrl: "#",
        uploadedBy: "Beheerder"
      });
      triggerToast("📎 Publicatiedocument succesvol geüpload!");
    }

    setIsAddingPub(false);
    setPubTitle("");
    setUploadedFileName("");
    setUploadedFileSize("");
  };

  const handleDeletePublicationClick = (id: string, title: string) => {
    if (confirm(`Weet u zeker dat u de publicatie "${title}" wilt verwijderen?`)) {
      if (onDeletePublication) {
        onDeletePublication(id);
        triggerToast("🗑️ Document succesvol verwijderd!");
      }
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm flex flex-col gap-6" id="project-timeline">
      
      {/* Horizontal Milestone Tracks (responsive scroll block) */}
      <div className="overflow-x-auto pb-4 shrink-0 no-scrollbar select-none">
        <div className="flex items-center min-w-[800px] justify-between relative px-4">
          
          {/* Connector bar behind timeline */}
          <div className="absolute top-1/2 left-8 right-8 h-1 bg-stone-100 z-0 -translate-y-1/2"></div>
          
          {phases.map((phase) => {
            const isSelected = phase.id === activePhaseId;
            const isCompleted = phase.completed;
            const isActive = phase.active;

            return (
              <button
                key={phase.id}
                onClick={() => onPhaseSelect(phase.id)}
                className="flex flex-col items-center gap-2 text-center group relative z-10 focus:outline-none pointer-events-auto cursor-pointer"
                id={`timeline-step-${phase.name}`}
              >
                {/* Node Dot icon */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isSelected
                      ? "bg-emerald-800 border-emerald-850 text-white scale-110 shadow-md shadow-emerald-950/10"
                      : isCompleted
                      ? "bg-emerald-50 border-emerald-600 text-emerald-800 hover:bg-emerald-100"
                      : isActive
                      ? "bg-amber-50 border-amber-500 text-amber-700 animate-pulse"
                      : "bg-white border-stone-300 text-stone-400 group-hover:border-stone-500"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <span className="text-xs font-black">{phase.id}</span>
                  )}
                </div>

                {/* Text labels under node */}
                <span
                  className={`text-xs whitespace-nowrap transition-all ${
                    isSelected
                      ? "font-extrabold text-stone-900"
                      : "font-semibold text-stone-500 group-hover:text-stone-800"
                  }`}
                >
                  {phase.label}
                </span>

                {isActive && (
                  <span className="absolute -top-4 text-[8px] bg-red-100 text-red-800 font-bold px-1 py-0.5 rounded uppercase">
                    Nu
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Phase Detail Deck */}
      <div className="bg-stone-50 rounded-2xl border border-stone-200 p-5 flex flex-col md:flex-row gap-6 animate-in fade-in" id="timeline-detail-deck">
        
        {/* Left column details */}
        <div className="flex-1 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 mb-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>Planning: {activePhase.date}</span>
            </div>
            
            <h4 className="font-extrabold text-stone-900 text-lg md:text-xl flex items-center gap-2">
              <span>Fase {activePhase.id}: {activePhase.label}</span>
              {role === "Admin" && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black uppercase flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> Admin beheer
                </span>
              )}
            </h4>
            
            <p className="text-stone-700 text-xs md:text-sm leading-relaxed mt-2">
              {activePhase.description}
            </p>
          </div>

          {/* Documents subcard */}
          <div className="bg-white border border-stone-200/80 p-3.5 rounded-xl shadow-sm">
            <h5 className="text-[10px] uppercase font-extrabold tracking-wider text-stone-400 mb-2 flex items-center justify-between">
              <span>Documenten & Publicaties</span>
              <span className="text-[9px] text-stone-400 font-normal">Totaal: {staticPubs.length + dynamicPubs.length}</span>
            </h5>
            
            <div className="space-y-1.5">
              {/* Static fallbacks */}
              {staticPubs.map((pub) => (
                <div key={pub.id} className="flex items-center justify-between text-xs hover:bg-stone-50 p-1.5 rounded transition">
                  <span className="text-stone-700 font-medium truncate max-w-[210px]" title={pub.title}>
                    📜 {pub.title}
                  </span>
                  <button 
                    onClick={() => handleDownload(pub.fileName)}
                    className="text-emerald-800 hover:text-emerald-900 font-bold flex items-center gap-0.5 text-[10px] uppercase cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5" /> download
                  </button>
                </div>
              ))}

              {/* Dynamic Publications */}
              {dynamicPubs.map((pub) => (
                <div key={pub.id} className="flex items-center justify-between text-xs hover:bg-stone-50 p-1.5 rounded transition bg-emerald-50/20 border border-emerald-100/50">
                  <span className="text-stone-700 font-medium truncate max-w-[170px]" title={pub.title}>
                    📎 {pub.title} <span className="text-[9px] text-stone-400 font-normal">({pub.fileSize})</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleDownload(pub.fileName)}
                      className="text-emerald-800 hover:text-emerald-900 font-bold flex items-center gap-0.5 text-[10px] uppercase cursor-pointer"
                    >
                      <FileDown className="w-3.5 h-3.5" /> download
                    </button>
                    {role === "Admin" && (
                      <button
                        onClick={() => handleDeletePublicationClick(pub.id, pub.title)}
                        className="text-red-600 hover:text-red-800 p-0.5 transition cursor-pointer"
                        title="Verwijder publicatie"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {staticPubs.length === 0 && dynamicPubs.length === 0 && (
                <div className="text-[11px] text-stone-400 italic text-center py-2">
                  Geen rapporten of publicaties geüpload voor deze projectfase.
                </div>
              )}
            </div>

            {/* Admin Upload block */}
            {role === "Admin" && (
              <div className="mt-3 pt-2 border-t border-stone-100">
                {!isAddingPub ? (
                  <button
                    onClick={() => setIsAddingPub(true)}
                    className="w-full py-1.5 px-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg text-[10px] font-extrabold uppercase transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" /> Publicatiedocument uploaden
                  </button>
                ) : (
                  <form onSubmit={handlePubSubmit} className="space-y-2 mt-2 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-stone-700 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-800" />
                        <span>Publicatie toevoegen</span>
                      </span>
                      <button type="button" onClick={() => setIsAddingPub(false)} className="text-stone-400 hover:text-stone-600 p-0.5">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <label className="text-[9px] block font-bold text-stone-500 mb-0.5">Document title</label>
                      <input
                        type="text"
                        required
                        placeholder="bijv: Concept-Gebiedsvisie Deel IV"
                        value={pubTitle}
                        onChange={(e) => setPubTitle(e.target.value)}
                        className="w-full text-xs p-1.5 bg-white border border-stone-300 rounded focus:ring-1 focus:ring-emerald-800 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] block font-bold text-stone-500 mb-0.5">Bestand simuleren</label>
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setUploadedFileName(file.name);
                            setUploadedFileSize((file.size / (1024 * 1024)).toFixed(2) + " MB");
                          }
                        }}
                        className="w-full text-[10px] p-1 bg-white border border-stone-300 rounded focus:ring-1 focus:ring-emerald-800"
                      />
                      {uploadedFileName && (
                        <div className="text-[9px] text-emerald-800 font-semibold mt-1">
                          Geselecteerd: {uploadedFileName} ({uploadedFileSize})
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full py-1.5 px-2 bg-emerald-800 text-white rounded text-[10px] font-bold hover:bg-emerald-950 transition uppercase cursor-pointer"
                    >
                      Opslaan & Publiceren
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right column: associated media & decisions */}
        <div className="flex-1 flex flex-col gap-4">
          
          {/* Toelichtend filmpje Omgevingswet */}
          <div className="bg-stone-900 rounded-xl overflow-hidden aspect-video relative group border border-stone-800 shadow-sm" id="omgevingswet-video-container">
            {isPlaying ? (
              <iframe
                src="https://www.youtube.com/embed/-yfLzLLbXXw?autoplay=1"
                title="Uitleg Omgevingswet"
                className="w-full h-full border-0 absolute inset-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            ) : (
              <>
                <img
                  src="https://img.youtube.com/vi/-yfLzLLbXXw/hqdefault.jpg"
                  alt="Uitleg Omgevingswet Video Thumbnail"
                  className="w-full h-full object-cover opacity-75 group-hover:scale-103 transition duration-500"
                  referrerPolicy="no-referrer"
                />
                {/* Visual play button overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/25 group-hover:bg-black/35 transition-colors p-4">
                  <button 
                    onClick={() => setIsPlaying(true)}
                    className="w-12 h-12 rounded-full bg-white text-emerald-800 flex items-center justify-center hover:scale-110 active:scale-95 transition shadow-lg shrink-0 mb-2 hover:bg-emerald-50 pointer-events-auto cursor-pointer"
                    title="Uitleg Omgevingswet afspelen"
                  >
                    <Play className="w-5 h-5 fill-emerald-800 ml-0.5 text-emerald-800" />
                  </button>
                  <span className="text-white text-xs font-black tracking-wide text-center drop-shadow-md select-none px-2 rounded">
                    Video-toelichting: Uitleg Omgevingswet
                  </span>
                  <span className="text-[10px] text-emerald-300 font-extrabold bg-emerald-950/80 px-2.5 py-0.5 rounded-full mt-1.5 shadow-xs border border-emerald-800/30">
                    Klik om direct af te spelen
                  </span>
                </div>
                <div className="absolute bottom-2 left-2 bg-emerald-950/90 text-[10px] text-emerald-300 font-extrabold px-2 py-0.5 rounded shadow-sm">
                  Inspraak & Participatie
                </div>
              </>
            )}
          </div>

          {/* Decision list snippet */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-[10px] uppercase font-extrabold tracking-wider text-stone-400">
                Besluitvorming in deze fase:
              </h5>
              {role === "Admin" && !isAddingDecision && !editingDecisionId && (
                <button
                  onClick={startAddDecision}
                  className="bg-emerald-50 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded hover:bg-emerald-100 transition uppercase flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-2.5 h-2.5" /> Inspraakbesluit toevoegen
                </button>
              )}
            </div>

            {/* Inline Add / Edit Form */}
            {(isAddingDecision || editingDecisionId) && (
              <form onSubmit={handleDecisionSubmit} className="mb-4 bg-white border border-stone-200/80 p-3.5 rounded-xl space-y-2.5 text-xs shadow-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-extrabold text-stone-850 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-800" />
                    <span>{editingDecisionId ? "Besluit bewerken" : "Nieuw Besluit toevoegen"}</span>
                  </span>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsAddingDecision(false);
                      setEditingDecisionId(null);
                    }} 
                    className="text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div>
                    <label className="text-[9px] block font-bold text-stone-500 mb-0.5">Titel van het besluit</label>
                    <input
                      type="text"
                      required
                      placeholder="bijv: Hoogte geluidswal verhoogd met 1 meter"
                      value={decTitle}
                      onChange={(e) => setDecTitle(e.target.value)}
                      className="w-full text-xs p-1.5 bg-white border border-stone-300 rounded focus:ring-1 focus:ring-emerald-800 focus:outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] block font-bold text-stone-500 mb-0.5">Besluitomschrijving / Kerntekst</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Wat is het definitieve of voorgestelde besluit?"
                      value={decText}
                      onChange={(e) => setDecText(e.target.value)}
                      className="w-full text-xs p-1.5 bg-white border border-stone-300 rounded focus:ring-1 focus:ring-emerald-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] block font-bold text-stone-500 mb-0.5">Motivering (Belanghebbenden & Omgevingswet)</label>
                    <textarea
                      rows={2}
                      placeholder="Waarom is dit besluit genomen? Welk belang weegt het zwaarst?"
                      value={decMotivation}
                      onChange={(e) => setDecMotivation(e.target.value)}
                      className="w-full text-xs p-1.5 bg-white border border-stone-300 rounded focus:ring-1 focus:ring-emerald-800 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] block font-bold text-stone-500 mb-0.5">Status</label>
                      <select
                        value={decStatus}
                        onChange={(e) => setDecStatus(e.target.value as any)}
                        className="w-full text-xs p-1 bg-white border border-stone-300 rounded focus:ring-1 focus:ring-emerald-800 focus:outline-none"
                      >
                        <option value="Definitief">Definitief</option>
                        <option value="Concept">Concept</option>
                        <option value="Ontwerp">Ontwerp</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] block font-bold text-stone-500 mb-0.5">Versienummer</label>
                      <input
                        type="text"
                        placeholder="v1.0"
                        value={decVersion}
                        onChange={(e) => setDecVersion(e.target.value)}
                        className="w-full text-xs p-1 bg-white border border-stone-300 rounded focus:ring-1 focus:ring-emerald-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] block font-bold text-stone-500 mb-0.5">Relevante participatierapporten / Inbreng bewoners</label>
                    <input
                      type="text"
                      placeholder="65% stemde voor meeneembare antwoorden op de gebiedsvragen..."
                      value={decRelated}
                      onChange={(e) => setDecRelated(e.target.value)}
                      className="w-full text-xs p-1.5 bg-white border border-stone-300 rounded focus:ring-1 focus:ring-emerald-800 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] block font-bold text-stone-500 mb-0.5">Betrokken documenten (Komma gescheiden PDF namen)</label>
                    <input
                      type="text"
                      placeholder="Geluidsrapport_v3.pdf, Peutz_Advies.pdf"
                      value={decDocs}
                      onChange={(e) => setDecDocs(e.target.value)}
                      className="w-full text-xs p-1.5 bg-white border border-stone-300 rounded focus:ring-1 focus:ring-emerald-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingDecision(false);
                      setEditingDecisionId(null);
                    }}
                    className="px-2.5 py-1 text-[10px] font-bold text-stone-600 hover:text-stone-800 uppercase"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1 bg-emerald-800 text-white rounded text-[10px] font-bold hover:bg-emerald-950 transition uppercase cursor-pointer"
                  >
                    {editingDecisionId ? "Wijzigen opslaan" : "Besluit toevoegen"}
                  </button>
                </div>
              </form>
            )}

            {matchedDecisions.length > 0 ? (
              <div className="space-y-2">
                {matchedDecisions.map((dec) => (
                  <div key={dec.id} className="bg-white border border-stone-200/85 p-3 rounded-xl flex items-start gap-2.5 group relative hover:border-emerald-250 transition-all shadow-sm">
                    <Bookmark className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0 pr-10">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h6 className="font-extrabold text-[11px] text-stone-850 leading-tight truncate max-w-[200px]" title={dec.title}>
                          {dec.title}
                        </h6>
                        <span className={`text-[8px] font-black uppercase px-1 rounded-sm ${
                          dec.status === "Definitief" ? "bg-green-100 text-green-800" :
                          dec.status === "Concept" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                        }`}>
                          {dec.status} {dec.version}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-500 mt-1 leading-normal group-hover:text-stone-700 transition">
                        {dec.decisionText}
                      </p>
                      
                      {dec.motivation && (
                        <p className="text-[9px] text-emerald-900 bg-emerald-50/50 p-1 rounded mt-1.5 border border-emerald-100/30">
                          <strong>Motivering:</strong> {dec.motivation}
                        </p>
                      )}
                    </div>

                    {/* Admin Actions overlay / menu */}
                    {role === "Admin" && (
                      <div className="absolute top-2.5 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditDecision(dec)}
                          className="p-1 text-stone-400 hover:text-emerald-800 bg-stone-100 hover:bg-emerald-50 rounded transition cursor-pointer"
                          title="Besluit bewerken"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteDecisionClick(dec.id, dec.title)}
                          className="p-1 text-stone-400 hover:text-red-700 bg-stone-100 hover:bg-red-50 rounded transition cursor-pointer"
                          title="Besluit verwijderen"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-stone-450 italic p-3 bg-white/75 border border-dashed border-stone-200 rounded-xl text-center">
                Er zijn geen formele besluiten geregistreerd in de lopende stand van deze fase.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Interactive custom notification toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 bg-emerald-900 border border-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

    </div>
  );
}

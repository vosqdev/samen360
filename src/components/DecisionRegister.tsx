import React, { useState } from "react";
import { Decision } from "../types";
import { INITIAL_DECISIONS } from "../data";
import { Landmark, ArrowRight, FileText, CheckCircle2, Search, Calendar, Folder, Tag } from "lucide-react";

interface DecisionRegisterProps {
  decisions: Decision[];
}

export default function DecisionRegister({ decisions }: DecisionRegisterProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeDecisionId, setActiveDecisionId] = useState<string>(decisions[0]?.id || "d1");

  const filteredDecisions = decisions.filter(
    (d) =>
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.decisionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedDecision = decisions.find((d) => d.id === activeDecisionId) || decisions[0];

  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm flex flex-col gap-6" id="besluitenregister">
      
      {/* Header with Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-stone-100 pb-4">
        <div>
          <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
            <Landmark className="w-5 h-5 text-emerald-800" />
            <span>Besluitenregister & Versiebeheer</span>
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Volledige transparantie conform de Omgevingswet. Bekijk de motivatie, audits en onderbouwing per besluit.
          </p>
        </div>

        {/* Search bar */}
        <div className="relative w-full md:w-72 shrink-0">
          <span className="absolute left-3 top-2.5 text-stone-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Doorzoek besluiten..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-emerald-800"
          />
        </div>
      </div>

      {/* Main split view */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Side: Decision list list */}
        <div className="w-full lg:w-[320px] flex flex-col gap-2.5 shrink-0">
          {filteredDecisions.length > 0 ? (
            filteredDecisions.map((dec) => {
              const isSelected = dec.id === activeDecisionId;
              return (
                <button
                  key={dec.id}
                  onClick={() => setActiveDecisionId(dec.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all pointer-events-auto cursor-pointer ${
                    isSelected
                      ? "bg-emerald-50 border-emerald-300 shadow-xs"
                      : "bg-white border-stone-200 hover:bg-stone-50"
                  }`}
                  id={`decision-btn-${dec.id}`}
                >
                  <div className="flex items-center justify-between text-[10px] text-stone-400 font-bold uppercase mb-1">
                    <span className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">{dec.category}</span>
                    <span>{dec.date}</span>
                  </div>
                  
                  <h4 className={`font-extrabold text-xs md:text-sm tracking-tight leading-snug ${
                    isSelected ? "text-emerald-950" : "text-stone-850"
                  }`}>
                    {dec.title}
                  </h4>

                  <div className="flex items-center justify-between mt-2.5 text-[10px] font-bold text-stone-500">
                    <span>Versie: <strong className="text-stone-750">{dec.version}</strong></span>
                    <span className="text-emerald-700 flex items-center gap-0.5">
                      {dec.status} <CheckCircle2 className="w-3 h-3" />
                    </span>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="text-center text-xs text-stone-400 py-12 italic border border-dashed border-stone-200 rounded-2xl">
              Geen besluiten gevonden voor "{searchTerm}"
            </div>
          )}
        </div>

        {/* Right Side: Deep audit trail / motivated details */}
        {selectedDecision ? (
          <div className="flex-grow bg-stone-50/50 rounded-2xl border border-stone-200 p-5 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4" id="decision-details-container">
            <div>
              <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-stone-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>Geformaliseerd op: {selectedDecision.date}</span>
                <span className="border-l border-stone-300 h-3"></span>
                <span>Audit-versie: {selectedDecision.version}</span>
              </div>
              
              <h3 className="font-extrabold text-stone-900 text-base md:text-lg">
                {selectedDecision.title}
              </h3>
            </div>

            {/* The actual Decision decree */}
            <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-xs">
              <span className="text-[10px] text-emerald-850 font-black uppercase tracking-wider block mb-1">
                ⚖️ Dictum / Wetgevend Besluit:
              </span>
              <p className="text-stone-800 text-xs md:text-sm leading-relaxed font-semibold">
                "{selectedDecision.decisionText}"
              </p>
            </div>

            {/* Motivation */}
            <div>
              <span className="text-[10px] text-stone-450 font-bold uppercase tracking-wider block mb-1">
                1. Maatschappelijke & Bestuurlijke Motivatie:
              </span>
              <p className="text-stone-700 text-xs leading-relaxed">
                {selectedDecision.motivation}
              </p>
            </div>

            {/* Technical underpinning */}
            <div>
              <span className="text-[10px] text-stone-450 font-bold uppercase tracking-wider block mb-1">
                2. Technische Onderbouwing & Toetsing:
              </span>
              <p className="text-stone-700 text-xs leading-relaxed bg-white/60 p-3 rounded-lg border border-stone-150 italic font-medium">
                "{selectedDecision.underpinning}"
              </p>
            </div>

            {/* Relation to citizen participation */}
            <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl text-xs text-emerald-950 font-medium leading-relaxed">
              <span className="text-[10px] text-emerald-900 font-extrabold uppercase tracking-wider block mb-1">
                💬 Relatie met Burgersparticipatie:
              </span>
              {selectedDecision.relatedParticipation}
            </div>

            {/* Downloadable legal attachments */}
            <div className="border-t border-stone-200 pt-3 flex flex-wrap items-center gap-2.5 justify-between">
              <span className="text-[10px] text-stone-400 font-bold uppercase">Gekoppelde Bewijsstukken:</span>
              <div className="flex gap-2">
                {selectedDecision.documents.map((doc, idx) => (
                  <button
                    key={idx}
                    className="flex items-center gap-1 text-[10px] font-bold bg-white border border-stone-250 hover:bg-stone-50 px-2.5 py-1.5 rounded-lg text-emerald-850 transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-stone-500" />
                    <span>{doc}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        ) : null}

      </div>

    </div>
  );
}

import React, { useState } from "react";
import { Idea, UserRole, getRoleLabel } from "../types";
import { INITIAL_IDEAS } from "../data";
import { Lightbulb, Heart, ThumbsUp, ThumbsDown, Plus, Sparkles, Filter, Grid, Tag } from "lucide-react";

interface IdeaBoardProps {
  ideas: Idea[];
  onAddIdea: (newIdea: Omit<Idea, "id" | "date" | "upvotes" | "downvotes" | "loves" | "lightbulbs">) => void;
  onVoteIdea: (id: string, voteType: "up" | "down" | "love" | "light") => void;
  onDeleteIdea?: (id: string) => void;
  selectedRole: UserRole;
  userName: string;
}

export default function IdeaBoard({
  ideas,
  onAddIdea,
  onVoteIdea,
  onDeleteIdea,
  selectedRole,
  userName,
}: IdeaBoardProps) {
  const [filterCategory, setFilterCategory] = useState<string>("Alle");
  const [aiClustering, setAiClustering] = useState<boolean>(false);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // New Idea form state
  const [title, setTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [text, setText] = useState("");
  const [category, setCategory] = useState("Groen");

  const categories = ["Alle", "Verkeer", "Groen", "Water", "Speelruimte", "Werken", "Energie"];

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !text.trim()) return;

    onAddIdea({
      author: authorName.trim() || "Anonieme Burger",
      role: selectedRole,
      title,
      text,
      category,
    });

    setTitle("");
    setAuthorName("");
    setText("");
    setShowAddForm(false);
  };

  const filteredIdeas = ideas.filter((idea) => {
    if (filterCategory === "Alle") return true;
    return idea.category === filterCategory;
  });

  // Sort standard view: count sum of positive engagement (upvotes + loves + lightbulbs) descending
  const sortedIdeas = [...filteredIdeas].sort(
    (a, b) => b.upvotes + b.loves + b.lightbulbs - (a.upvotes + a.loves + a.lightbulbs)
  );

  // AI Clustering grouping: Reducer grouping items by clusteredTitle
  const clusteredGroups = sortedIdeas.reduce((groups, item) => {
    const key = item.clusteredTitle || "Nog te categoriseren ideeën";
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<string, Idea[]>);

  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm flex flex-col gap-6" id="ideeenboard">
      
      {/* Top filter row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-stone-100 pb-4">
        <div>
          <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-emerald-800 animate-pulse" />
            <span>Co-Creatie Buurt-Ideeën</span>
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Dien zelf ideeën in. Stem op geplaatste doelen. AI koppelt en clustert soortgelijke voorstellen.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
          
          {/* AI Cluster Toggle */}
          <button
            onClick={() => setAiClustering(!aiClustering)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition border ${
              aiClustering
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
            }`}
            id="ai-cluster-toggle-btn"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {aiClustering ? "AI Groepering Actief" : "AI Snel Clusteren"}
          </button>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 shadow-sm shadow-emerald-950/10 pointer-events-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nieuw Idee</span>
          </button>
        </div>
      </div>

      {/* Slide down creation form */}
      {showAddForm && (
        <form
          onSubmit={handleFormSubmit}
          className="bg-stone-50/80 border border-stone-200 rounded-2xl p-5 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4"
          id="ideeen-creatie-form"
        >
          <h4 className="font-bold text-stone-850 text-sm">Uw Idee toevoegen aan de Spoorzone</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-stone-700 mb-1">Inspirerende Titel:</label>
              <input
                type="text"
                placeholder="Bijv: Buurtschuur voor leengereedschap..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-white border border-stone-250 rounded-xl p-2.5 text-xs text-stone-850 focus:ring-1 focus:ring-emerald-800 focus:outline-none font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-stone-700 mb-1">Uw Naam (Optioneel):</label>
              <input
                type="text"
                placeholder="Buurtbewoner / Anoniem..."
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full bg-white border border-stone-250 rounded-xl p-2.5 text-xs text-stone-850 focus:ring-1 focus:ring-emerald-800 focus:outline-none font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-stone-700 mb-1">Toepasselijk Thema:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white border border-stone-250 rounded-xl p-2.5 text-xs text-stone-850 focus:ring-1 focus:ring-emerald-800 focus:outline-none font-semibold"
              >
                {categories.slice(1).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-stone-700 mb-1">Gedetailleerde beschrijving van uw idee:</label>
            <textarea
              placeholder="Leg uit hoe dit bijdraagt aan de wijk en hoe dit beheerd kan worden..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
              rows={3}
              className="w-full bg-white border border-stone-250 rounded-xl p-2.5 text-xs text-stone-850 focus:ring-1 focus:ring-emerald-800 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-stone-500 font-semibold text-xs px-3 py-2 rounded-xl hover:bg-stone-150 transition"
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm pointer-events-auto cursor-pointer"
            >
              Indienen Buurtvoorstel
            </button>
          </div>
        </form>
      )}

      {/* Filter Chips */}
      {!aiClustering && (
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mr-1">Thema Filter:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition border ${
                filterCategory === cat
                  ? "bg-emerald-800 text-white border-emerald-850"
                  : "bg-stone-50 text-stone-600 border-stone-200/80 hover:bg-stone-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Ideal Layout listing */}
      {aiClustering ? (
        // AI Clustered Group Frame
        <div className="space-y-6" id="ai-clustered-ideas-view">
          {Object.entries(clusteredGroups).map(([groupTitle, list]) => (
            <div key={groupTitle} className="border border-stone-200/80 rounded-2xl p-4 bg-stone-50/40">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1 px-2.5 bg-emerald-100 rounded-lg text-emerald-800 text-[10px] font-extrabold uppercase flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-700 font-bold animate-pulse" />
                  <span>AI Cluster</span>
                </div>
                <h4 className="font-extrabold text-stone-900 text-sm">{groupTitle}</h4>
                <span className="text-xs text-stone-400">({list.length} voorstellen)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {list.map((idea) => (
                  <div key={idea.id} className="bg-white p-4.5 rounded-xl border border-stone-200 flex flex-col justify-between gap-3 shadow-xs">
                    <div>
                      <div className="flex justify-between items-center text-[10px] text-stone-400 font-bold uppercase mb-1">
                        <span className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">{idea.category}</span>
                        <span>Door: {idea.author} ({getRoleLabel(idea.role)})</span>
                      </div>
                      <h5 className="font-extrabold text-stone-850 text-xs md:text-sm">{idea.title}</h5>
                      <p className="text-stone-600 text-xs mt-1.5 leading-relaxed">{idea.text}</p>
                    </div>

                      <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-2 shrink-0">
                      {selectedRole === "Admin" && onDeleteIdea && (
                        <button
                          onClick={() => onDeleteIdea(idea.id)}
                          className="p-1.5 rounded-xl flex items-center gap-1 text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 cursor-pointer transition shrink-0"
                        >
                          🗑️ Wis
                        </button>
                      )}
                      
                      <button
                        onClick={() => onVoteIdea(idea.id, "up")}
                        className={`rounded-full px-4 py-1.5 text-[11px] font-semibold flex items-center gap-1.5 transition border cursor-pointer pointer-events-auto ${
                          idea.userVoted === "up"
                            ? "bg-emerald-50 text-emerald-900 border-emerald-400 ring-1 ring-emerald-400/10 shadow-xs"
                            : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50 hover:border-stone-300"
                        }`}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 transition ${idea.userVoted === "up" ? "text-emerald-700 font-bold" : "text-stone-500"}`} />
                        <span>Nuttig ({idea.upvotes})</span>
                      </button>

                      <button
                        onClick={() => onVoteIdea(idea.id, "love")}
                        className={`rounded-full px-4 py-1.5 text-[11px] font-semibold flex items-center gap-1.5 transition border cursor-pointer pointer-events-auto ${
                          idea.userVoted === "love"
                            ? "bg-red-50 text-red-900 border-red-400 ring-1 ring-red-400/10 shadow-xs"
                            : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50 hover:border-stone-300"
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 fill-red-500/10 transition ${idea.userVoted === "love" ? "text-red-500 fill-red-500 font-bold" : "text-red-500"}`} />
                        <span>Geweldig ({idea.loves})</span>
                      </button>

                      <button
                        onClick={() => onVoteIdea(idea.id, "light")}
                        className={`rounded-full px-4 py-1.5 text-[11px] font-semibold flex items-center gap-1.5 transition border cursor-pointer pointer-events-auto ${
                          idea.userVoted === "light"
                            ? "bg-amber-50 text-amber-900 border-amber-400 ring-1 ring-amber-400/10 shadow-xs"
                            : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50 hover:border-stone-300"
                        }`}
                      >
                        <Lightbulb className={`w-3.5 h-3.5 fill-amber-500/10 transition ${idea.userVoted === "light" ? "text-amber-600 fill-amber-550 font-bold" : "text-amber-500"}`} />
                        <span>Slim idee ({idea.lightbulbs})</span>
                      </button>

                      <button
                        onClick={() => onVoteIdea(idea.id, "down")}
                        className={`p-1.5 rounded-full transition cursor-pointer pointer-events-auto ${
                          idea.userVoted === "down"
                            ? "text-red-650 bg-red-50 border border-red-200 scale-105 shadow-xs"
                            : "text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                        }`}
                        title="Niet nuttig"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Standard Grid View sorted by Votes
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="standard-ideas-grid">
          {sortedIdeas.map((idea) => (
            <div
              key={idea.id}
              className="bg-stone-50/50 hover:bg-white rounded-2xl border border-stone-200/80 p-5 flex flex-col justify-between gap-4 shadow-xs hover:shadow-md transition duration-200"
              id={`idea-card-${idea.id}`}
            >
              <div>
                <div className="flex justify-between items-center text-[10px] text-stone-400 font-bold uppercase">
                  <span className="bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded mr-2 font-black">
                    {idea.category}
                  </span>
                  <span>
                    door <strong className="text-stone-700">{idea.author}</strong> ({getRoleLabel(idea.role)})
                  </span>
                </div>

                <h4 className="font-extrabold text-stone-900 text-sm md:text-base mt-2">
                  {idea.title}
                </h4>

                <p className="text-stone-650 text-xs mt-1 leading-relaxed">
                  {idea.text}
                </p>
              </div>

              {/* Action Reactions and voting controls */}
              <div className="flex flex-wrap items-center gap-2 border-t border-stone-150 pt-3">
                <button
                  onClick={() => onVoteIdea(idea.id, "up")}
                  className={`rounded-full px-4 py-2 text-[11px] font-semibold flex items-center gap-2 transition border cursor-pointer pointer-events-auto ${
                    idea.userVoted === "up"
                      ? "bg-emerald-50 text-emerald-900 border-emerald-400 ring-1 ring-emerald-400/10 shadow-xs"
                      : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50 hover:border-stone-300"
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 transition ${idea.userVoted === "up" ? "text-emerald-700 font-bold" : "text-stone-500"}`} />
                  <span>Nuttig ({idea.upvotes})</span>
                </button>

                <button
                  onClick={() => onVoteIdea(idea.id, "love")}
                  className={`rounded-full px-4 py-2 text-[11px] font-semibold flex items-center gap-2 transition border cursor-pointer pointer-events-auto ${
                    idea.userVoted === "love"
                      ? "bg-red-50 text-red-900 border-red-400 ring-1 ring-red-400/10 shadow-xs"
                      : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50 hover:border-stone-300"
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 fill-red-500/10 transition ${idea.userVoted === "love" ? "text-red-500 fill-red-550 font-bold" : "text-red-500"}`} />
                  <span>Geweldig ({idea.loves})</span>
                </button>

                <button
                  onClick={() => onVoteIdea(idea.id, "light")}
                  className={`rounded-full px-4 py-2 text-[11px] font-semibold flex items-center gap-2 transition border cursor-pointer pointer-events-auto ${
                    idea.userVoted === "light"
                      ? "bg-amber-50 text-amber-900 border-amber-400 ring-1 ring-amber-400/10 shadow-xs"
                      : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50 hover:border-stone-300"
                  }`}
                >
                  <Lightbulb className={`w-3.5 h-3.5 fill-amber-500/10 transition ${idea.userVoted === "light" ? "text-amber-600 fill-amber-550 font-bold" : "text-amber-500"}`} />
                  <span>Slim idee ({idea.lightbulbs})</span>
                </button>

                <button
                  onClick={() => onVoteIdea(idea.id, "down")}
                  className={`p-2 rounded-full transition cursor-pointer pointer-events-auto ${
                    idea.userVoted === "down"
                      ? "text-red-650 bg-red-50 border border-red-200 scale-105 shadow-xs"
                      : "text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                  }`}
                  title="Niet nuttig"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

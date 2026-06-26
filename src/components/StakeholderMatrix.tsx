import React, { useState } from "react";
import { Stakeholder, MapMarker, Idea } from "../types";
import { Info, HelpCircle, MessageSquare, Briefcase, RefreshCw } from "lucide-react";

interface StakeholderMatrixProps {
  projectName: string;
  city: string;
  markers: MapMarker[];
  ideas: Idea[];
  selectedRole?: string;
}

export default function StakeholderMatrix({ projectName, city, markers, ideas, selectedRole }: StakeholderMatrixProps) {
  // Map or compute the stakeholders list dynamically based on the project & live data activity!
  const stakeholders = React.useMemo<Stakeholder[]>(() => {
    // Let's count contributions by user role to determine live stakeholder activity!
    const roleStats = [...markers.map(m => m.role), ...ideas.map(i => i.role)].reduce((acc, r) => {
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const citizenActivity = (roleStats["Bewoner"] || 0) + (roleStats["Bezoeker"] || 0);
    const entrepreneurActivity = roleStats["Ondernemer"] || 0;
    const governmentActivity = roleStats["Gemeente"] || 0;
    const adviserActivity = (roleStats["Adviseur"] || 0) + (roleStats["Projectontwikkelaar"] || 0);

    return [
      {
        id: "st1",
        name: `Gemeente ${city}`,
        influence: 10,
        interest: 9,
        category: "Overheid",
        strategy: "Sleutelfiguur - Nauw betrekken & besluitvormend partner",
        advice: `Houd de gemeentelijke stedenbouwkundigen van ${city} nauw betrokken. Zorg voor sluitende ambtelijke dossiers conform lokale regelgeving. Er zijn ${governmentActivity} formele ambtelijke bijdrages geregistreerd.`
      },
      {
        id: "st2",
        name: `Omwonenden ${projectName}`,
        influence: 7,
        interest: 10,
        category: "Burgers",
        strategy: "Samenwerking - Actief consulteren, informeren & co-creëren",
        advice: `De burgers hebben directe belangen bij ${projectName}. Focus op communicatie over parkeren en groen. Bewoners hebben via de kades tot nu toe ${citizenActivity} bijdragen geplaatst.`
      },
      {
        id: "st3",
        name: `Horeca & Ondernemers (${city})`,
        influence: 6,
        interest: 8,
        category: "Bedrijven",
        strategy: "Tevreden houden - Facilitaire wensen inpassen",
        advice: `Belangrijk voor de levendigheid in de wijk. Communiceer helder over laad- en loszones en bereikbaarheid tijdens de bouwfase. Ondernemers hebben al ${entrepreneurActivity} reacties geplaatst.`
      },
      {
        id: "st4",
        name: `Milieucollectief ${city}`,
        influence: 5,
        interest: 9,
        category: "Natuur & Milieu",
        strategy: "Betrekken - Dialoog houden over groen, bomen & hittestress",
        advice: `Cruciale bondgenoot voor de beplante inrichting van ${projectName}. Deel proactief klimaat- en MER-rapportages.`
      },
      {
        id: "st5",
        name: `Planadviseurs & Specialisten`,
        influence: 8,
        interest: 7,
        category: "Adviseurs",
        strategy: "Informatievoorziening - Technisch afstemmen",
        advice: `Essentieel voor de technische inpassing en planning. Adviseurs en ontwerpers hebben tot nu toe ${adviserActivity} expertadviezen ingediend.`
      }
    ];
  }, [projectName, city, markers, ideas]);

  const [selectedStakeholderId, setSelectedStakeholderId] = useState<string>("st2");
  
  const selectedStakeholder = React.useMemo(() => {
    return stakeholders.find(s => s.id === selectedStakeholderId) || stakeholders[0];
  }, [stakeholders, selectedStakeholderId]);

  // Custom AI strategy advisor trigger
  const [isAdvising, setIsAdvising] = useState(false);
  const [generatedStrategy, setGeneratedStrategy] = useState<string>("");

  const handleConsultAIStep = async (sh: Stakeholder) => {
    setIsAdvising(true);
    setGeneratedStrategy("");
    try {
      const prompt = `
        Je bent een senior reputatiemanager en participatie-expert conform de Omgevingswet.
        Geef een communicatieadvies en concrete communicatiestrategie (stappenplan van 3 punten) in vakkundig Nederlands B1-niveau voor de volgende stakeholdergroep in het project ${projectName}:
        groep: "${sh.name}"
        belang (1-10): ${sh.interest}
        invloed (1-10): ${sh.influence}
        huidige strategie: ${sh.strategy}

        Typ een directe, bemoedigende aanbeveling. Houd het onder de 120 woorden.
      `;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });

      const data = await res.json();
      if (res.ok) {
        setGeneratedStrategy(data.reply);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setGeneratedStrategy(`Advies voor ${sh.name}:
      1. Plan een ronde-tafelsessie op locatie in ${city}.
      2. Breng de technische rapportages over geluidsabsorptie en hittestress proactief over aan de groep.
      3. Stel een vast aanspreekpunt (stadsmarconist) in om direct vragen over parkeernormen op te lossen.`);
    } finally {
      setIsAdvising(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm flex flex-col lg:flex-row gap-6" id="stakeholder-matrix-panel">
      
      {/* Visual Plot Matrix */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-stone-800 text-sm md:text-base flex items-center gap-2">
            <Briefcase className="w-4.5 h-4.5 text-emerald-800" />
            <span>Stakeholdermatrix (Invloed × Belang)</span>
          </h3>
          <span className="text-[10px] text-stone-400 font-semibold uppercase">{projectName} Planners</span>
        </div>

        <p className="text-xs text-stone-500 mb-4 leading-relaxed">
          Gebruik deze door AI ondersteunde matrix om de invloed en het belang van partners te overwegen. Klik op een bol of naam om communicatiestrategie te ontsluiten.
        </p>

        {/* 2D Interactive Plot */}
        <div className="relative border-l-2 border-b-2 border-stone-300 w-full aspect-square md:aspect-video lg:aspect-square bg-stone-50/50 rounded-tr-2xl overflow-hidden flex flex-col justify-between p-4">
          
          {/* Quadrant background markers */}
          <div className="absolute top-0 right-0 w-1/2 h-1/2 border-l border-b border-stone-200/40 bg-red-500/5 flex items-center justify-center p-2 text-center pointer-events-none">
            <span className="text-[9px] font-bold text-red-800/40 uppercase tracking-widest leading-tight">Sleutelfiguren (Betrekken)</span>
          </div>
          <div className="absolute bottom-0 right-0 w-1/2 h-1/2 border-l border-stone-200/40 bg-amber-500/5 flex items-center justify-center p-2 text-center pointer-events-none">
            <span className="text-[9px] font-bold text-amber-800/40 uppercase tracking-widest leading-tight">Tevreden houden</span>
          </div>
          <div className="absolute top-0 left-0 w-1/2 h-1/2 border-b border-stone-200/40 bg-blue-500/5 flex items-center justify-center p-2 text-center pointer-events-none">
            <span className="text-[9px] font-bold text-blue-800/40 uppercase tracking-widest leading-tight">Beïnvloeders (Informeren)</span>
          </div>
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-stone-50/30 flex items-center justify-center p-2 text-center pointer-events-none">
            <span className="text-[9px] font-bold text-stone-400/40 uppercase tracking-widest leading-tight">Monitoren (Minimale inspanning)</span>
          </div>

          {/* Slices Indicators */}
          <div className="absolute left-2 top-2 text-[9px] text-stone-450 font-bold tracking-wider pointer-events-none select-none uppercase">
            ▲ Grote Invloed
          </div>
          <div className="absolute right-2 bottom-2 text-[9px] text-stone-450 font-bold tracking-wider pointer-events-none select-none uppercase">
            Groot Belang ►
          </div>

          {/* Plotting Stakeholder nodes */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {stakeholders.map((sh) => {
              // Map 1-10 to SVG coordinates 10-90
              const xCoord = 10 + (sh.interest - 1) * 8.8;
              const yCoord = 90 - (sh.influence - 1) * 8.8;  // invert Y for plot
              const isSelected = selectedStakeholder?.id === sh.id;

              return (
                <g key={sh.id} className="cursor-pointer">
                  {/* Glowing ring if active */}
                  {isSelected && (
                    <circle
                      cx={xCoord}
                      cy={yCoord}
                      r="6"
                      fill="#6b21a8"
                      opacity="0.3"
                      className="animate-ping"
                    />
                  )}
                  {/* Main Node */}
                  <circle
                    cx={xCoord}
                    cy={yCoord}
                    r="4"
                    fill={isSelected ? "#7e22ce" : "#3b82f6"}
                    stroke="#ffffff"
                    strokeWidth="0.8"
                    onClick={() => {
                      setSelectedStakeholderId(sh.id);
                      setGeneratedStrategy("");
                    }}
                    className="hover:scale-125 transition-transform duration-200"
                  />
                </g>
              );
            })}
          </svg>

          {/* Anchor labels next to nodes */}
          {stakeholders.map((sh) => {
            const xPercent = ((sh.interest - 1) / 9) * 80 + 10;
            const yPercent = 90 - ((sh.influence - 1) / 9) * 80;
            const isSelected = selectedStakeholder?.id === sh.id;

            return (
              <div
                key={sh.id + "-label"}
                className="absolute text-[9px] shrink-0 font-bold pointer-events-none transition-all px-1.5 py-0.5 rounded shadow-sm bg-white border border-stone-200 pointer-events-auto cursor-pointer"
                style={{
                  left: `${xPercent}%`,
                  top: `${yPercent}%`,
                  transform: "translate(-50%, -130%)"
                }}
                onClick={() => {
                  setSelectedStakeholderId(sh.id);
                  setGeneratedStrategy("");
                }}
              >
                <span className={isSelected ? "text-emerald-800 font-extrabold" : "text-stone-600"}>
                  {sh.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Advice Panel info card */}
      <div className="w-full lg:w-[360px] bg-stone-50 rounded-2xl border border-stone-200 p-4 transition-all flex flex-col justify-between shrink-0" id="stakeholder-advice-view">
        {selectedStakeholder ? (
          <div className="flex flex-col gap-4 flex-1">
            <div className="pb-3 border-b border-stone-200">
              <span className="text-[10px] font-extrabold text-stone-500 bg-white border border-stone-205 rounded px-2 py-0.5 uppercase">
                {selectedStakeholder.category}
              </span>
              <h4 className="font-extrabold text-stone-900 text-base mt-2">{selectedStakeholder.name}</h4>
              <div className="flex gap-4 mt-2 text-xs text-stone-600">
                <span>Belang: <strong className="text-stone-800">{selectedStakeholder.interest}/10</strong></span>
                <span>Invloed: <strong className="text-stone-800">{selectedStakeholder.influence}/10</strong></span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-extrabold tracking-wider text-stone-400 block uppercase">
                Geadviseerde Strategie:
              </span>
              <p className="text-stone-800 text-xs font-semibold mt-1 leading-relaxed bg-white border border-stone-150 p-2.5 rounded-xl">
                {selectedStakeholder.strategy}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-extrabold tracking-wider text-stone-400 block uppercase">
                Standaard Stads-Advies:
              </span>
              <p className="text-stone-700 text-xs mt-1 leading-relaxed italic">
                "{selectedStakeholder.advice}"
              </p>
            </div>

            {/* Live AI generator block */}
            {selectedRole === "Admin" && (
              <div className="mt-2 pt-2 border-t border-stone-200">
                <button
                  onClick={() => handleConsultAIStep(selectedStakeholder)}
                  disabled={isAdvising}
                  className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95 disabled:bg-stone-300 pointer-events-auto cursor-pointer shadow-sm"
                >
                  {isAdvising ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>AI Genereert Communicatieadvies...</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Vraag AI-Communicatieadvies</span>
                    </>
                  )}
                </button>

                {generatedStrategy && (
                  <div className="mt-3 bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-900 leading-relaxed font-medium animate-in fade-in slide-in-from-top-2">
                    <h5 className="font-bold text-emerald-800 mb-1 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" />
                      <span>Strategie van AI Participatiecoach:</span>
                    </h5>
                    {generatedStrategy}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-stone-400 h-full py-12">
            <HelpCircle className="w-8 h-8" />
            <span className="text-xs">Klik op een stakeholder om detailadvies op te roepen.</span>
          </div>
        )}
      </div>

    </div>
  );
}

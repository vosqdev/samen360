export type UserRole =
  | "Admin"
  | "Bewoner"
  | "Ondernemer"
  | "Bezoeker"
  | "Gemeente"
  | "Adviseur"
  | "Projectontwikkelaar";

export const getRoleLabel = (r: UserRole): string => {
  switch (r) {
    case "Admin": return "beheerder / admin";
    case "Bewoner": return "burger / bewoner";
    case "Ondernemer": return "ondernemer";
    case "Bezoeker": return "bezoeker / geïnteresseerde";
    case "Gemeente": return "stakeholder / overheid";
    case "Adviseur": return "adviseur derden";
    case "Projectontwikkelaar": return "projectontwikkelaar";
    default: return r;
  }
};

export interface ProjectPhase {
  id: string;
  name: string;
  label: string;
  active: boolean;
  completed: boolean;
  description: string;
  date: string;
  decisionsCount: number;
}

export interface MapMarker {
  id: string;
  projectId?: string;
  author: string;
  role: UserRole;
  text: string;
  date: string;
  category: string;
  sentiment: "positive" | "neutral" | "negative";
  x: number; // percentage coordinate on card map (0-100)
  y: number; // percentage coordinate on card map (0-100)
  photoUrl?: string;
  likes: number;
}

export interface Idea {
  id: string;
  projectId?: string;
  author: string;
  role: UserRole;
  title: string;
  text: string;
  date: string;
  category: string;
  upvotes: number;
  downvotes: number;
  loves: number;
  lightbulbs: number;
  userVoted?: "up" | "down" | "love" | "light" | null;
  clusteredId?: string; // AI groups ideas together
  clusteredTitle?: string;
}

export interface Decision {
  id: string;
  title: string;
  category: string;
  decisionText: string;
  motivation: string;
  underpinning: string; // Onderbouwing
  date: string;
  status: "Definitief" | "Concept" | "Ontwerp";
  version: string;
  relatedParticipation: string;
  documents: string[];
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  date: string;
  category: string;
  image: string;
  readTime: string;
  documents: string[];
  views: number;
}

export interface Task {
  id: string;
  title: string;
  status: "Open" | "In Behandeling" | "Voltooid";
  source: string; // "AI Coach", "Moderator", "Wegwerk"
  date: string;
  assignedTo: string;
  reporter: string;
}

export interface Stakeholder {
  id: string;
  name: string;
  influence: number; // 1-10
  interest: number;  // 1-10
  category: string;
  strategy: string;
  advice: string;
}

export interface ProjectStats {
  participants: number;
  uniqueViews: number;
  supportIndex: number; // 0-100
  responseRate: number; // 0-100
}

export interface Publication {
  id: string;
  projectId: string;
  phaseId: string;
  title: string;
  fileName: string;
  fileSize?: string;
  downloadUrl?: string;
  uploadedBy?: string;
  createdAt: any;
}

export interface SurveyResponse {
  id: string;
  projectId: string;
  answers: ("Ja" | "Nee" | "Geen mening")[];
  createdAt: any;
}

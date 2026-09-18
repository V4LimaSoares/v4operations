// Shared between the (client) form dialog and the (server) data/aggregate layer — kept in a
// plain module with no "use client"/"server-only" directive so both sides can import the same
// list of checklist items without crossing the RSC client/server module boundary.
export const CHECKLIST_ITEMS: { key: string; label: string }[] = [
  { key: "roiAbove1", label: "ROI acima de 1?" },
  { key: "projectPaysItself", label: "O projeto se paga?" },
  { key: "clientAdimplente", label: "Cliente está adimplente?" },
  { key: "csatAbove4", label: "CSAT igual ou superior a 4?" },
  { key: "npsAbove7", label: "NPS igual ou superior a 7?" },
  { key: "dailyDemandGeneration", label: "Geração de demanda diária?" },
  { key: "stakeholderAware", label: "Stakeholder pagador consciente dos avanços?" },
  { key: "adsAccountActive", label: "Conta de anúncios ativa? Saldo OK?" },
  { key: "crmInUse", label: "CRM em uso corretamente?" },
  { key: "checkinsAbove90", label: "Cliente participou de >90% checkins?" },
  { key: "socialMediaUpToDate", label: "Social media em dia?" },
  { key: "playbookUpToDate", label: "Playbook em dia?" },
  { key: "okrsOnTrack", label: "OKR's batendo?" },
];

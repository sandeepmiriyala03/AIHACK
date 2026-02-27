export type ModeOption = {
  value: "automatic" | "manual";
  label: string;
};

export type LangOption = {
  value: string;
  label: string;
  group?: "latin" | "indic" | "cjk" | "other" | "detection";
};

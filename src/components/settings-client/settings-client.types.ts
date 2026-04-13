export type SettingsUser = {
  name: string;
  email: string;
  country: string | null;
  currency: string | null;
};

export type SettingsClientProps = {
  user: SettingsUser;
};

export type SettingsMessage = {
  type: "success" | "error";
  text: string;
};

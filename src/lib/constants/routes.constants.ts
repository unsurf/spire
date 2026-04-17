export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  DASHBOARD_ACCOUNT: (id: string) => `/dashboard?${QUERY_PARAMS.ACCOUNT}=${id}`,
  ACCOUNT_DETAIL: (id: string) => `/accounts/${id}`,
  INCOME: "/income",
  BILLS: "/bills",
  BILLS_CALENDAR: "/bills/calendar",
  SETTINGS: "/settings",
  SIGN_IN: "/signin",
  REGISTER: "/register",
  ONBOARDING: "/onboarding",
} as const;

export const QUERY_PARAMS = {
  ACCOUNT: "account",
} as const;

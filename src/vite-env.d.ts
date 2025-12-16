/// <reference types="vite/client" />

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            element: HTMLElement | null,
            options: {
              theme?: "outline" | "filled_black" | "filled_blue";
              size?: "large" | "medium" | "small";
              width?: number;
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              logo_alignment?: "left" | "center";
            },
          ) => void;
        };
      };
    };
  }
}

interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

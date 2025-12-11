import { useContext } from "react";
import { ChatBotContext } from "../contexts/ChatBotContext";
import type { ChatBotContextType } from "../types/chatBot";

export const useChatBot = (): ChatBotContextType => {
  const context = useContext(ChatBotContext);
  if (!context) {
    throw new Error("useChatBot must be used within a ChatBotProvider");
  }
  return context;
};

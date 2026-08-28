import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { store } from "../store";
import "@fontsource/inter/500.css";
import "@fontsource/inter/800.css";
import "@xyflow/react/dist/style.css";

const StoreBoundary = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>{children}</Provider>
);

export default StoreBoundary;

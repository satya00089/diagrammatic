import React from "react";

interface RollingNavLabelProps {
  children: string;
}

/** A compact, Motion-style rolling label for links and navigation buttons. */
const RollingNavLabel: React.FC<RollingNavLabelProps> = ({ children }) => (
  <span className="rolling-nav-label" aria-hidden="true">
    <span className="rolling-nav-label__copy">{children}</span>
    <span className="rolling-nav-label__copy rolling-nav-label__copy--incoming">
      {children}
    </span>
  </span>
);

export default RollingNavLabel;

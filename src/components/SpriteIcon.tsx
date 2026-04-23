import React from "react";
import type { ResolvedSprite } from "../types/sprites";

interface Props {
  sprite: ResolvedSprite;
  /** Rendered display size in pixels (both width and height). */
  displaySize: number;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Renders a single icon from a CSS spritesheet using background-image clipping.
 * No <img> request — the sheet is shared across all icons in a group.
 */
const SpriteIcon: React.FC<Props> = ({
  sprite,
  displaySize,
  alt = "",
  className = "",
  style,
}) => {
  const { sheetUrl, x, y, w, sheetWidth, sheetHeight } = sprite;
  // Scale factor: map spritesheet icon_size (w, always 64) to displaySize
  const scale = displaySize / w;

  return (
    <div
      role="img"
      aria-label={alt}
      className={className}
      style={{
        width: displaySize,
        height: displaySize,
        backgroundImage: `url(${sheetUrl})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: `-${x * scale}px -${y * scale}px`,
        backgroundSize: `${sheetWidth * scale}px ${sheetHeight * scale}px`,
        flexShrink: 0,
        ...style,
      }}
    />
  );
};

export default SpriteIcon;

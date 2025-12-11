/**
 * Component Mapper
 * Maps database components to canvas components
 */

import type { CanvasComponent } from "../types/canvas";
import type { ComponentDB } from "../types/componentProvider";
import type { IconType } from "react-icons";
import * as SiIcons from "react-icons/si";
import * as FaIcons from "react-icons/fa";
import * as MdIcons from "react-icons/md";
import * as AiIcons from "react-icons/ai";
import * as BiIcons from "react-icons/bi";

const iconLibraries = {
  ...SiIcons,
  ...FaIcons,
  ...MdIcons,
  ...AiIcons,
  ...BiIcons,
};

/**
 * Get icon component from icon name or emoji
 */
function getIconComponent(
  component: ComponentDB,
): IconType | string | undefined {
  // Try React icon first
  if (component.icon) {
    const IconComponent =
      iconLibraries[component.icon as keyof typeof iconLibraries];
    if (IconComponent) {
      return IconComponent;
    }
  }

  // Fallback to emoji
  if (component.iconEmoji) {
    return component.iconEmoji;
  }

  // Fallback to icon URL (will be handled separately)
  return undefined;
}

/**
 * Map database component to canvas component
 */
export function mapComponentToCanvas(
  dbComponent: ComponentDB,
): CanvasComponent {
  const iconComponent = getIconComponent(dbComponent);

  return {
    id: dbComponent.id,
    label: dbComponent.label,
    description: dbComponent.description,
    icon: typeof iconComponent === "function" ? iconComponent : undefined,
    group: dbComponent.group,
    tags: dbComponent.tags || [],
    nodeType: dbComponent.metadata?.nodeType,
    properties: convertPropertiesToCanvasFormat(dbComponent.properties || []),
    data: {
      provider: dbComponent.provider,
      category: dbComponent.category,
      iconUrl: dbComponent.iconUrl,
      iconEmoji:
        typeof iconComponent === "string"
          ? iconComponent
          : dbComponent.iconEmoji,
      ...dbComponent.metadata,
    },
  };
}

/**
 * Convert database property definitions to canvas property format
 */
function convertPropertiesToCanvasFormat(
  dbProperties: import("../types/componentProvider").ComponentProperty[],
): Array<{
  key: string;
  label: string;
  type: "text" | "number" | "boolean" | "select" | "textarea";
  default?: string | number | boolean;
  placeholder?: string;
  options?: string[];
}> {
  // Properties are already in array format from API, just map to ensure correct type
  return dbProperties.map((prop) => ({
    key: prop.key,
    label: prop.label,
    type: prop.type as "text" | "number" | "boolean" | "select" | "textarea",
    default: prop.default as string | number | boolean | undefined,
    placeholder: prop.placeholder,
    options: prop.options,
  }));
}

/**
 * Map multiple database components to canvas components
 */
export function mapComponentsToCanvas(
  dbComponents: ComponentDB[],
): CanvasComponent[] {
  return dbComponents
    .filter((comp) => comp.isActive) // Only include active components
    .map(mapComponentToCanvas);
}

/**
 * Group components by provider
 */
export function groupByProvider(
  components: ComponentDB[],
): Map<string, ComponentDB[]> {
  const grouped = new Map<string, ComponentDB[]>();

  for (const component of components) {
    const provider = component.provider || "generic";
    if (!grouped.has(provider)) {
      grouped.set(provider, []);
    }
    grouped.get(provider)!.push(component);
  }

  return grouped;
}

/**
 * Group components by category
 */
export function groupByCategory(
  components: ComponentDB[],
): Map<string, ComponentDB[]> {
  const grouped = new Map<string, ComponentDB[]>();

  for (const component of components) {
    const category = component.category || "other";
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(component);
  }

  return grouped;
}

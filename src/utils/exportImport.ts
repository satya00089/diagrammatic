import type { Node, Edge } from "@xyflow/react";

export interface DiagramData {
  version: string;
  metadata: {
    title?: string;
    description?: string;
    createdAt: string;
    exportedAt: string;
  };
  nodes: Node[];
  edges: Edge[];
}

/**
 * Export diagram data as JSON
 */
export const exportAsJSON = (
  nodes: Node[],
  edges: Edge[],
  title?: string,
  description?: string,
): string => {
  const data: DiagramData = {
    version: "1.0",
    metadata: {
      title,
      description,
      createdAt: new Date().toISOString(),
      exportedAt: new Date().toISOString(),
    },
    nodes,
    edges,
  };

  return JSON.stringify(data, null, 2);
};

/**
 * Export diagram data as XML (draw.io compatible format)
 */
export const exportAsXML = (
  nodes: Node[],
  edges: Edge[],
  title?: string,
  description?: string,
): string => {
  const escapeXml = (unsafe: string): string => {
    return unsafe
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&apos;");
  };

  // Map component types to draw.io shapes and styles
  const getComponentStyle = (): string => {
    // Default rounded rectangle
    return "rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;";
  };

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml +=
    '<mxfile host="Diagrammatic" modified="' +
    new Date().toISOString() +
    '" agent="Diagrammatic" version="1.0" type="device">\n';
  xml +=
    '  <diagram id="diagram1" name="' +
    escapeXml(title || "System Design") +
    '">\n';
  xml +=
    '    <mxGraphModel dx="1434" dy="844" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">\n';
  xml += "      <root>\n";

  // Add metadata as custom properties
  xml += '        <mxCell id="0"/>\n';
  xml += '        <mxCell id="1" parent="0"/>\n';

  if (description) {
    xml += "        <!-- Description: " + escapeXml(description) + " -->\n";
  }

  // Add nodes (use for-of to satisfy lint rules)
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    const cellId = `node-${index + 2}`;
    const label = node.data?.label || node.id;
    const x = node.position?.x || 0;
    const y = node.position?.y || 0;
    const width =
      (node.style?.width as number) || (node.width as number) || 200;
    const height =
      (node.style?.height as number) || (node.height as number) || 80;

    const style = getComponentStyle();

    xml += `        <mxCell id="${cellId}" value="${escapeXml(String(label))}" `;
    xml += `style="${style}" `;
    xml += `vertex="1" parent="1">\n`;
    xml += `          <mxGeometry x="${x}" y="${y}" width="${width}" height="${height}" as="geometry"/>\n`;
    xml += "        </mxCell>\n";
  }

  // Add edges (use for-of)
  for (let index = 0; index < edges.length; index++) {
    const edge = edges[index];
    const edgeId = `edge-${index}`;
    const sourceIdx = nodes.findIndex((n) => n.id === edge.source);
    const targetIdx = nodes.findIndex((n) => n.id === edge.target);
    const label = edge.label || edge.data?.label || "";

    if (sourceIdx !== -1 && targetIdx !== -1) {
      xml += `        <mxCell id="${edgeId}" value="${escapeXml(String(label))}" `;
      xml += `style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" `;
      xml += `edge="1" parent="1" source="node-${sourceIdx + 2}" target="node-${targetIdx + 2}">\n`;
      xml += '          <mxGeometry relative="1" as="geometry"/>\n';
      xml += "        </mxCell>\n";
    }
  }

  xml += "      </root>\n";
  xml += "    </mxGraphModel>\n";
  xml += "  </diagram>\n";
  xml += "</mxfile>\n";

  return xml;
};

/**
 * Import diagram from JSON
 */
export const importFromJSON = (
  jsonString: string,
): { nodes: Node[]; edges: Edge[] } => {
  try {
    const data = JSON.parse(jsonString) as DiagramData;

    // Validate the structure
    if (!data.nodes || !Array.isArray(data.nodes)) {
      throw new Error("Invalid JSON format: missing or invalid nodes array");
    }

    if (!data.edges || !Array.isArray(data.edges)) {
      throw new Error("Invalid JSON format: missing or invalid edges array");
    }

    return {
      nodes: data.nodes,
      edges: data.edges,
    };
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Failed to import JSON: ${error.message}`
        : "Failed to import JSON: Invalid format",
    );
  }
};

/**
 * Import diagram from XML (basic draw.io format parsing)
 */
export const importFromXML = (
  xmlString: string,
): { nodes: Node[]; edges: Edge[] } => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");

    // Check for parsing errors
    const parseError = xmlDoc.querySelector("parsererror");
    if (parseError) {
      throw new Error("Invalid XML format");
    }

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const nodeIdMap = new Map<string, string>(); // Map XML IDs to our IDs

    // Parse nodes (mxCell elements with vertex="1")
    const cells = xmlDoc.querySelectorAll('mxCell[vertex="1"]');
    let nodeIndex = 0;
    for (const cell of cells) {
      const xmlId = cell.getAttribute("id") || `cell-${nodeIndex}`;
      const label = cell.getAttribute("value") || `Node ${nodeIndex + 1}`;
      const geometry = cell.querySelector("mxGeometry");

      const x = Number.parseFloat(geometry?.getAttribute("x") || "0");
      const y = Number.parseFloat(geometry?.getAttribute("y") || "0");
      const width = Number.parseFloat(geometry?.getAttribute("width") || "200");
      const height = Number.parseFloat(
        geometry?.getAttribute("height") || "80",
      );

      const nodeId = `imported-node-${Date.now()}-${nodeIndex}`;
      nodeIdMap.set(xmlId, nodeId);

      // Parse custom data if present
      const data: Record<string, unknown> = { label };
      const mxData = cell.querySelector("mxData");
      if (mxData) {
        const properties = mxData.querySelectorAll("property");
        for (const prop of properties) {
          const name = prop.getAttribute("name");
          const value = prop.getAttribute("value");
          if (name && value) {
            try {
              data[name] = JSON.parse(value);
            } catch {
              data[name] = value;
            }
          }
        }
      }

      nodes.push({
        id: nodeId,
        type: "custom",
        position: { x, y },
        data,
        ...(width && height ? { style: { width, height } } : {}),
      });
      nodeIndex++;
    }

    // Parse edges (mxCell elements with edge="1")
    const edgeCells = xmlDoc.querySelectorAll('mxCell[edge="1"]');
    let edgeIndex = 0;
    for (const cell of edgeCells) {
      const sourceXmlId = cell.getAttribute("source");
      const targetXmlId = cell.getAttribute("target");
      const label = cell.getAttribute("value") || "";

      if (sourceXmlId && targetXmlId) {
        const sourceId = nodeIdMap.get(sourceXmlId);
        const targetId = nodeIdMap.get(targetXmlId);

        if (sourceId && targetId) {
          const edgeData: Record<string, unknown> = {};
          if (label) {
            edgeData.label = label;
            edgeData.hasLabel = true;
          }

          // Parse custom edge data
          const mxData = cell.querySelector("mxData");
          if (mxData) {
            const properties = mxData.querySelectorAll("property");
            for (const prop of properties) {
              const name = prop.getAttribute("name");
              const value = prop.getAttribute("value");
              if (name && value) {
                try {
                  edgeData[name] = JSON.parse(value);
                } catch {
                  edgeData[name] = value;
                }
              }
            }
          }

          edges.push({
            id: `imported-edge-${Date.now()}-${edgeIndex}`,
            source: sourceId,
            target: targetId,
            type: "customEdge",
            data: edgeData,
            ...(label ? { label } : {}),
          });
        }
      }
      edgeIndex++;
    }

    if (nodes.length === 0) {
      throw new Error("No valid nodes found in XML file");
    }

    return { nodes, edges };
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Failed to import XML: ${error.message}`
        : "Failed to import XML: Invalid format",
    );
  }
};

/**
 * Download a file with the given content
 */
export const downloadFile = (
  content: string,
  filename: string,
  mimeType: string,
) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

/**
 * Read file content as text
 */
export const readFileAsText = async (file: File): Promise<string> => {
  return file.text();
};

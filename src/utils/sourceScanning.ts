const sqlQuoteClosers = new Map([
  ["'", "'"],
  ['"', '"'],
  ["`", "`"],
  ["[", "]"],
]);

const skipSqlQuote = (source: string, start: number, closer: string) => {
  let index = start + 1;
  while (index < source.length) {
    if (source[index] !== closer) {
      index += 1;
      continue;
    }
    if (source[index + 1] !== closer) return index;
    index += 2;
  }
  return source.length - 1;
};

/** Split column definitions without splitting types, expressions, or strings. */
export const splitSqlDefinitions = (body: string): string[] => {
  const definitions: string[] = [];
  let depth = 0;
  let start = 0;
  let index = 0;
  while (index < body.length) {
    const char = body[index];
    const closer = sqlQuoteClosers.get(char);
    if (closer) {
      index = skipSqlQuote(body, index, closer) + 1;
      continue;
    }
    if (char === "(") depth += 1;
    if (char === ")") depth = Math.max(0, depth - 1);
    if (char === "," && depth === 0) {
      definitions.push(body.slice(start, index));
      start = index + 1;
    }
    index += 1;
  }
  definitions.push(body.slice(start));
  return definitions;
};

type MermaidDeclaration = { key: string; label: string };

/** Consume each declaration once, including its label, before finding edges. */
export const scanMermaidLine = (line: string) => {
  const declarations: MermaidDeclaration[] = [];
  const keyPattern = /[A-Za-z0-9_:-]+/g;
  const closers = new Map([
    ["[", "]"],
    ["{", "}"],
    ["(", ")"],
  ]);
  let edgeSource = "";
  let copiedUntil = 0;
  for (const key of line.matchAll(keyPattern)) {
    // matchAll uses its own cursor; ignore identifiers inside consumed labels.
    if (key.index < copiedUntil) continue;
    let opening = key.index + key[0].length;
    while (line[opening] === " " || line[opening] === "\t") opening += 1;
    const closer = closers.get(line[opening]);
    if (!closer) continue;
    const isCircle = line.startsWith("((", opening);
    const labelStart = opening + (isCircle ? 2 : 1);
    const closingToken = isCircle ? "))" : closer;
    const end = line.indexOf(closingToken, labelStart);
    if (end === -1) break;
    declarations.push({ key: key[0], label: line.slice(labelStart, end) });
    edgeSource += line.slice(copiedUntil, opening);
    copiedUntil = end + closingToken.length;
  }
  edgeSource += line.slice(copiedUntil);
  return { declarations, edgeSource };
};

export const parseMermaidEdge = (line: string) => {
  const arrow = /-->|-\.->|==>|---|--\s+/.exec(line);
  if (!arrow) return null;
  const source = /^([A-Za-z0-9_:-]+)/.exec(line.slice(0, arrow.index));
  let remainder = line.slice(arrow.index + arrow[0].length).trim();
  let label: string | undefined;
  if (remainder.startsWith("|")) {
    const end = remainder.indexOf("|", 1);
    if (end === -1) return null;
    label = remainder.slice(1, end);
    remainder = remainder.slice(end + 1).trim();
  }
  const target = /^([A-Za-z0-9_:-]+)/.exec(remainder);
  if (!source || !target) return null;
  const trailingLabel = /^\s*\|([^|]+)\|/.exec(
    remainder.slice(target[0].length),
  );
  return {
    source: source[1],
    target: target[1],
    label: label ?? trailingLabel?.[1],
  };
};

/**
 * Minimal RFC-4180 CSV parser.
 *
 * Handles the messy realities of the Cali Ayuda coordination sheet:
 *  - quoted fields containing commas
 *  - quoted fields containing newlines (multi-line cells)
 *  - escaped quotes ("")
 *
 * Zero dependencies (AGENTS.md §25). Returns rows of string cells.
 */
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;

  // Normalize CRLF -> LF so newline handling is uniform.
  const text = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  // Flush trailing field/row (file may not end with newline).
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

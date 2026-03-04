/**
 * Serialize a value for a CSV cell. Objects and arrays are JSON-stringified
 * so they don't render as "[object Object]".
 */
export function csvCellValue(value: unknown): string {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
}

/**
 * Escape a cell for CSV (wrap in quotes if it contains comma, newline, or quote).
 */
export function csvEscape(cell: string): string {
    if (!/[\n",]/.test(cell)) return cell;
    return `"${cell.replace(/"/g, '""')}"`;
}

/**
 * Build a CSV row from an array of cell values (objects are serialized).
 */
export function csvRow(cells: unknown[]): string {
    return cells.map((c) => csvEscape(csvCellValue(c))).join(",");
}

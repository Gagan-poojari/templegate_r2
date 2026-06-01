export function downloadCsv(filename, rows, columns) {
  if (!rows?.length) return;

  const header = columns.map((c) => c.label).join(",");
  const lines = rows.map((row) =>
    columns
      .map((col) => {
        const val = col.get(row);
        const str = val == null ? "" : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  const csv = [header, ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

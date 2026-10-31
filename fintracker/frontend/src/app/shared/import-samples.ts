/** Sample SQL files served from /import-samples/ (public folder). */
export const IMPORT_SAMPLES = [
  {
    file: 'fintrack-sample-import.sql',
    label: 'Sample data (12 transactions)',
    description: 'Ready-to-import income and expense examples for testing dashboards and charts.',
  },
  {
    file: 'fintrack-import-template.sql',
    label: 'Empty template',
    description: 'Starter file with one row — copy the INSERT line and add your own transactions.',
  },
] as const;

export function downloadImportSample(filename: string): void {
  const link = document.createElement('a');
  link.href = `/import-samples/${filename}`;
  link.download = filename;
  link.click();
}

// Prints a Playwright JSON report as GitHub Actions annotations.
// Usage: node .github/scripts/report-playwright.cjs <results.json> <title>
const fs = require('fs');
const [file, title = 'Playwright'] = process.argv.slice(2);
if (!fs.existsSync(file)) {
  console.log(`::warning title=${title}::No results file.`);
  process.exit(0);
}
const r = JSON.parse(fs.readFileSync(file, 'utf8'));
const rows = [];
const walk = (suite) => {
  for (const spec of suite.specs || []) for (const t of spec.tests) {
    const status = t.results.map((x) => x.status).pop() ?? 'skipped';
    rows.push(`${t.projectName}: ${spec.title} = ${status}`);
  }
  for (const child of suite.suites || []) walk(child);
};
for (const s of r.suites) walk(s);
const st = r.stats;
console.log(`::notice title=${title}::${st.expected} passed, ${st.unexpected} failed, ${st.flaky} flaky, ${st.skipped} skipped`);
const failed = rows.filter((x) => !x.endsWith('= passed') && !x.endsWith('= skipped'));
console.log(`::notice title=${title} tests::` + rows.map((x) => x.replace(/ = passed$/, ' ✓')).join(' | ').slice(0, 3800));
if (failed.length) console.log(`::error title=${title} failures::` + failed.join(' | '));

import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { buildEnvironment, headersFile, robotsFile, robotsMeta, type ReleaseConfig } from './scripts/release.mjs';

/**
 * Writes the Cloudflare Pages hosting files (_headers, robots.txt) for the
 * release channel and adds the robots meta tag to index.html. There is no
 * _redirects file and no 404.html: without a top-level 404.html, Pages serves
 * index.html for app routes (single-page application mode).
 */
function releaseFiles(config: ReleaseConfig): Plugin {
  return {
    name: 'release-files',
    apply: 'build',
    transformIndexHtml(html) {
      const meta = robotsMeta(config);
      return meta ? html.replace('</title>', `</title>\n    <meta name="robots" content="${meta}" />`) : html;
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: '_headers', source: headersFile(config) });
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsFile(config) });
    },
  };
}

// Static SPA build. No server, no environment secrets, no paid services.
export default defineConfig(({ mode }) => {
  const release = buildEnvironment(loadEnv(mode, '.', 'VITE_'));
  if (release.errors.length > 0) throw new Error(`Invalid release configuration:\n- ${release.errors.join('\n- ')}`);
  return {
    plugins: [react(), tailwindcss(), releaseFiles(release)],
    base: '/',
    // No source maps in the deployed site: smaller uploads, nothing extra exposed.
    build: { target: 'es2022', sourcemap: false },
  };
});

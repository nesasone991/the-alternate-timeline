export type ReleaseChannel = 'beta' | 'production';
export type ReleaseConfig = {
  readonly channel: ReleaseChannel;
  readonly analyticsEndpoint: string;
  readonly feedbackUrl: string;
  readonly errors: readonly string[];
};
export const CHANNELS: readonly ReleaseChannel[];
export const ANALYTICS_ENDPOINT_PATTERN: RegExp;
export function resolveReleaseConfig(env: Record<string, string | undefined>): ReleaseConfig;
export function contentSecurityPolicy(config: ReleaseConfig): string;
export function headersFile(config: ReleaseConfig): string;
export function robotsFile(config: ReleaseConfig): string;
export function robotsMeta(config: ReleaseConfig): string | null;
export function buildEnvironment(loadedEnv?: Record<string, string>): ReleaseConfig;

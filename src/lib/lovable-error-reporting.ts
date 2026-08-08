/**
 * No-op error reporting stub.
 * Previously reported runtime errors to Lovable's editor telemetry.
 * Now just logs to console — Lovable editor hooks are not available locally.
 */
export function reportLovableError(
  error: unknown,
  context: Record<string, unknown> = {},
) {
  console.error('[ErrorBoundary]', error, context);
}

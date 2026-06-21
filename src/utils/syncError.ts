export function formatSyncError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  if (typeof error === 'string' && error.trim()) return error;
  return 'Sync failed — check Supabase tables and API key';
}

export function isMissingTableError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const record = error as { code?: string; message?: string };
  const code = record.code ?? '';
  const message = record.message ?? '';
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    /player_profile/i.test(message) ||
    /could not find the table/i.test(message) ||
    /relation .* does not exist/i.test(message)
  );
}

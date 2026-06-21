const PREFIX = '[GolfLog Sync]';

export function syncLog(message: string, detail?: unknown): void {
  if (detail !== undefined) {
    console.log(PREFIX, message, detail);
    return;
  }
  console.log(PREFIX, message);
}

export function syncWarn(message: string, detail?: unknown): void {
  if (detail !== undefined) {
    console.warn(PREFIX, message, detail);
    return;
  }
  console.warn(PREFIX, message);
}

export function syncError(message: string, detail?: unknown): void {
  if (detail !== undefined) {
    console.error(PREFIX, message, detail);
    return;
  }
  console.error(PREFIX, message);
}

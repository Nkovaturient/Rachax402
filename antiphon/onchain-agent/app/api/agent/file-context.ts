/**
 * Conversation-scoped file context for tool access (stageCsv, paidStore, parse_uploaded_file).
 */

export interface PendingFile {
  base64: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

const _pendingByConversation = new Map<string, PendingFile>();

export function setPendingFile(conversationId: string, f: PendingFile) {
  _pendingByConversation.set(conversationId, f);
}

export function getPendingFile(conversationId?: string): PendingFile | null {
  if (conversationId) {
    return _pendingByConversation.get(conversationId) ?? null;
  }
  const entries = [..._pendingByConversation.values()];
  return entries.length > 0 ? entries[entries.length - 1]! : null;
}

export function clearPendingFile(conversationId?: string) {
  if (conversationId) {
    _pendingByConversation.delete(conversationId);
    return;
  }
  _pendingByConversation.clear();
}

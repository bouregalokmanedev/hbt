/** Invite link a learner copies into WhatsApp/email — /register reads ?ref=. */
export function inviteUrlFor(code: string): string {
  return `${window.location.origin}/register?ref=${code}`;
}

export function getTeamsChatUrl(userPrincipalName?: string): string | undefined {
  if (!userPrincipalName || !/^[^\s@,;<>|]+@[^\s@,;<>|/?#]+\.[^\s@,;<>|/?#]+$/.test(userPrincipalName)) return undefined;
  // Teams users accepts UPNs. An arbitrary mail attribute is not proof of a UPN.
  return `https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(userPrincipalName)}`;
}

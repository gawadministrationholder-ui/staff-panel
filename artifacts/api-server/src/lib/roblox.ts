export interface RobloxUserInfo {
  id: number;
  name: string;
  displayName: string;
}

export async function getRobloxUserInfo(userId: string): Promise<RobloxUserInfo | null> {
  try {
    const response = await fetch(`https://users.roblox.com/v1/users/${userId}`);
    if (!response.ok) return null;
    return await response.json() as RobloxUserInfo;
  } catch {
    return null;
  }
}

export async function getRobloxAvatar(userId: string): Promise<string> {
  try {
    const response = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`,
    );
    if (response.ok) {
      const data = await response.json() as { data: { imageUrl: string }[] };
      if (data.data && data.data.length > 0) {
        return data.data[0].imageUrl;
      }
    }
  } catch {}
  return `https://tr.rbxcdn.com/30DAY-AvatarHeadshot-${userId}-Png/150/150/AvatarHeadshot/Png/noFilter`;
}

export interface RobloxGroupRoleInfo {
  rank: number;
  name: string;
}

export async function getRobloxGroupRole(userId: string, groupId: string): Promise<RobloxGroupRoleInfo> {
  try {
    const response = await fetch(`https://groups.roblox.com/v2/users/${userId}/groups/roles`);
    if (response.ok) {
      const data = await response.json() as { data: { group: { id: number }; role: { rank: number; name: string } }[] };
      const target = data.data.find((g) => g.group.id.toString() === groupId);
      if (target) {
        return { rank: target.role.rank, name: target.role.name };
      }
    }
  } catch {}
  return { rank: 0, name: "" };
}

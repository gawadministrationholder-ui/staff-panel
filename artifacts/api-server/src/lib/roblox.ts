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

export interface RobloxGroupRoleListing {
  id: number;
  name: string;
  rank: number;
  memberCount: number;
}

/** Lists every role configured on a Roblox group (id, name, rank, member count). */
export async function getRobloxGroupRoles(groupId: string): Promise<RobloxGroupRoleListing[]> {
  try {
    const response = await fetch(`https://groups.roblox.com/v1/groups/${groupId}/roles`);
    if (!response.ok) return [];
    const data = (await response.json()) as { roles: RobloxGroupRoleListing[] };
    return data.roles ?? [];
  } catch {
    return [];
  }
}

export interface RobloxGroupMember {
  userId: number;
  username: string;
  displayName: string;
}

/** Lists every member holding a specific role in a Roblox group (paginated internally). */
export async function getRobloxGroupRoleMembers(groupId: string, roleId: number): Promise<RobloxGroupMember[]> {
  const members: RobloxGroupMember[] = [];
  let cursor = "";
  try {
    do {
      const url = `https://groups.roblox.com/v1/groups/${groupId}/roles/${roleId}/users?limit=100${cursor ? `&cursor=${cursor}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) break;
      const data = (await response.json()) as {
        data: { userId: number; username: string; displayName: string }[];
        nextPageCursor: string | null;
      };
      members.push(...data.data);
      cursor = data.nextPageCursor ?? "";
    } while (cursor);
  } catch {}
  return members;
}

/** Fetches avatar headshot URLs for many users in one request. */
export async function getRobloxAvatarsBatch(userIds: number[]): Promise<Record<number, string>> {
  const result: Record<number, string> = {};
  if (userIds.length === 0) return result;
  try {
    const response = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userIds.join(",")}&size=150x150&format=Png&isCircular=false`,
    );
    if (response.ok) {
      const data = (await response.json()) as { data: { targetId: number; imageUrl: string }[] };
      for (const item of data.data) result[item.targetId] = item.imageUrl;
    }
  } catch {}
  return result;
}

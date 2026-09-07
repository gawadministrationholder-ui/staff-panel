// Minimal Roblox Web API helpers (self-contained so the bot doesn't import
// across artifact packages — shared logic lives in lib/* by convention).

export interface RobloxUserInfo {
  id: number;
  name: string;
  displayName: string;
}

export async function getRobloxUserInfo(userId: string): Promise<RobloxUserInfo | null> {
  try {
    const res = await fetch(`https://users.roblox.com/v1/users/${userId}`);
    if (!res.ok) return null;
    return (await res.json()) as RobloxUserInfo;
  } catch {
    return null;
  }
}

export async function getRobloxAvatar(userId: string): Promise<string> {
  try {
    const res = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`,
    );
    if (res.ok) {
      const data = (await res.json()) as { data: { imageUrl: string }[] };
      if (data.data && data.data.length > 0) return data.data[0].imageUrl;
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
    const res = await fetch(`https://groups.roblox.com/v2/users/${userId}/groups/roles`);
    if (res.ok) {
      const data = (await res.json()) as {
        data: { group: { id: number }; role: { rank: number; name: string } }[];
      };
      const target = data.data.find((g) => g.group.id.toString() === groupId);
      if (target) return { rank: target.role.rank, name: target.role.name };
    }
  } catch {}
  return { rank: 0, name: "" };
}

// Resolve a username -> id (best effort) for /lookup convenience.
export async function getRobloxIdByUsername(username: string): Promise<string | null> {
  try {
    const res = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
    });
    if (res.ok) {
      const data = (await res.json()) as { data: { id: number }[] };
      if (data.data && data.data.length > 0) return String(data.data[0].id);
    }
  } catch {}
  return null;
}

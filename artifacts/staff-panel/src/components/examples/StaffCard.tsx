import StaffCard from '../StaffCard';

export default function StaffCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      <StaffCard 
        robloxUsername="CommanderJohn"
        robloxAvatar="https://tr.rbxcdn.com/30DAY-AvatarHeadshot-A1C0300E25E48FA858DA6DD9D86CAAC1-Png/150/150/AvatarHeadshot/Png/noFilter"
        discordUsername="commander#1234"
        rank={255}
      />
      <StaffCard 
        robloxUsername="OfficerSarah"
        robloxAvatar="https://tr.rbxcdn.com/30DAY-AvatarHeadshot-B2D1411F36F59GB969EB8EE0E97DBBD2-Png/150/150/AvatarHeadshot/Png/noFilter"
        discordUsername="sarah.mod#5678"
        rank={200}
      />
      <StaffCard 
        robloxUsername="ModMike"
        robloxAvatar="https://tr.rbxcdn.com/30DAY-AvatarHeadshot-C3E2522G47G60HC070FC9FF1F08ECCE3-Png/150/150/AvatarHeadshot/Png/noFilter"
        discordUsername="mike_m#9012"
        rank={160}
      />
    </div>
  );
}

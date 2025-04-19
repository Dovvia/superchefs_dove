

export const timeAgo = (timestamp: Date | number | string |undefined): string => {
    // console.log("Timestamp received:", timestamp);
  if (!timestamp) return "Invalid time";

  const now = new Date();
  const productionTime = new Date(timestamp);
  const diffInSeconds = Math.floor(
    (now.getTime() - productionTime.getTime()) / 1000
  );

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} days ago`;
};

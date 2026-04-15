export const cx = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ");

export const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit"
  }).format(new Date(value));

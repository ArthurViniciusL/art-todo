const pad = (value: number): string => String(value).padStart(2, '0')

/** Name for a list created without one: `dd/mm/yy - hh:mm:ss`, local time. */
export function defaultListName(date: Date): string {
  const day = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${pad(date.getFullYear() % 100)}`
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  return `${day} - ${time}`
}

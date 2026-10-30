const timeFormatter = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" })

export const formatTime = (isoDate: string): string => timeFormatter.format(new Date(isoDate))

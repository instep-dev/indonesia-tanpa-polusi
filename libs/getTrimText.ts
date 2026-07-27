export const trimText = ({
  value,
  maxLength = 50,
} : {
  value: string | null,
  maxLength?: number
}) => {
  const text = (value ?? "").trim()
  if (!text) return "-"
  if (text.length <= maxLength) return text
  if (maxLength <= 3) return text.slice(0, maxLength)
  return (
    `${text.slice(0, maxLength - 3).trimEnd()}...`
  )
}


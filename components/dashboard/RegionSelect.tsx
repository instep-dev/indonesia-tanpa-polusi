'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRegions } from '@/services/region/region.queries'

type RegionSelectProps = {
  value: string | null
  onChange: (regionId: string | null) => void
  disabled?: boolean
}

const NO_REGION = 'none'

const RegionSelect = ({ value, onChange, disabled }: RegionSelectProps) => {
  const { data: regions, isLoading } = useRegions()

  return (
    <Select
      value={value ?? NO_REGION}
      onValueChange={(next) => onChange(next === NO_REGION ? null : next)}
      disabled={disabled || isLoading}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a region">
          {(v: string | null) =>
            v === NO_REGION || v == null
              ? 'General News (no region)'
              : (regions?.find((region) => region.id === v)?.nameEn ?? v)
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NO_REGION}>General News (no region)</SelectItem>
        {regions?.map((region) => (
          <SelectItem key={region.id} value={region.id}>
            {region.nameEn}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default RegionSelect

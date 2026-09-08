import { describe, expect, it } from 'vitest'
import { formatAmountMinor, majorAmountToMinor, minorAmountToMajorInput } from '@/shared/lib/money'

describe('integer-safe money helpers', () => {
  it('formats zero, whole, fractional, and large amounts without float math', () => {
    expect(formatAmountMinor(0, 'NGN')).toBe('0.00 NGN')
    expect(formatAmountMinor(100, 'NGN')).toBe('1.00 NGN')
    expect(formatAmountMinor(1500000, 'NGN')).toBe('15000.00 NGN')
    expect(formatAmountMinor(12345, 'NGN')).toBe('123.45 NGN')
    expect(formatAmountMinor(999_999_999, 'NGN')).toBe('9999999.99 NGN')
    expect(formatAmountMinor(null)).toBe('—')
  })

  it('converts major strings to minor units and back', () => {
    expect(majorAmountToMinor('0')).toBe(0)
    expect(majorAmountToMinor('15000')).toBe(1_500_000)
    expect(majorAmountToMinor('15000.50')).toBe(1_500_050)
    expect(majorAmountToMinor('12.3')).toBe(1230)
    expect(majorAmountToMinor('12.345')).toBeNull()
    expect(majorAmountToMinor('abc')).toBeNull()
    expect(minorAmountToMajorInput(0)).toBe('0.00')
    expect(minorAmountToMajorInput(12345)).toBe('123.45')
  })
})

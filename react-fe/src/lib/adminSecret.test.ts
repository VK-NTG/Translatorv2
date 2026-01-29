import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getAdminSecret, setAdminSecret } from './adminSecret'

describe('adminSecret', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  describe('getAdminSecret', () => {
    it('should return null when no secret is stored', () => {
      const result = getAdminSecret()
      expect(result).toBeNull()
    })

    it('should return the stored secret', () => {
      localStorage.setItem('adminSecret', 'my-secret')
      const result = getAdminSecret()
      expect(result).toBe('my-secret')
    })
  })

  describe('setAdminSecret', () => {
    it('should store a valid secret', () => {
      setAdminSecret('test-secret')
      expect(localStorage.getItem('adminSecret')).toBe('test-secret')
    })

    it('should trim whitespace from secret', () => {
      setAdminSecret('  trimmed-secret  ')
      expect(localStorage.getItem('adminSecret')).toBe('trimmed-secret')
    })

    it('should remove secret when null is passed', () => {
      localStorage.setItem('adminSecret', 'existing-secret')
      setAdminSecret(null)
      expect(localStorage.getItem('adminSecret')).toBeNull()
    })

    it('should remove secret when empty string is passed', () => {
      localStorage.setItem('adminSecret', 'existing-secret')
      setAdminSecret('')
      expect(localStorage.getItem('adminSecret')).toBeNull()
    })

    it('should remove secret when whitespace-only string is passed', () => {
      localStorage.setItem('adminSecret', 'existing-secret')
      setAdminSecret('   ')
      expect(localStorage.getItem('adminSecret')).toBeNull()
    })

    it('should overwrite existing secret', () => {
      setAdminSecret('first-secret')
      setAdminSecret('second-secret')
      expect(localStorage.getItem('adminSecret')).toBe('second-secret')
    })
  })
})

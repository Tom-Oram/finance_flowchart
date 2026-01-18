import { FinancialState, FinancialStateSchema } from './types'

const STORAGE_KEY = 'ukpf_financial_state'

export function saveFinancialState(state: FinancialState): void {
  if (typeof window === 'undefined') return

  try {
    const serialized = JSON.stringify(state)
    localStorage.setItem(STORAGE_KEY, serialized)
  } catch (error) {
    console.error('Failed to save financial state:', error)
  }
}

export function loadFinancialState(): FinancialState | null {
  if (typeof window === 'undefined') return null

  try {
    const serialized = localStorage.getItem(STORAGE_KEY)
    if (!serialized) return null

    const parsed = JSON.parse(serialized)
    // Validate with Zod schema
    const validated = FinancialStateSchema.parse(parsed)
    return validated
  } catch (error) {
    console.error('Failed to load financial state:', error)
    return null
  }
}

export function clearFinancialState(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear financial state:', error)
  }
}

export function exportFinancialState(state: FinancialState): void {
  const dataStr = JSON.stringify(state, null, 2)
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)

  const exportFileDefaultName = `ukpf-plan-${new Date().toISOString().split('T')[0]}.json`

  const linkElement = document.createElement('a')
  linkElement.setAttribute('href', dataUri)
  linkElement.setAttribute('download', exportFileDefaultName)
  linkElement.click()
}

export function importFinancialState(file: File): Promise<FinancialState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const parsed = JSON.parse(content)
        const validated = FinancialStateSchema.parse(parsed)
        resolve(validated)
      } catch (error) {
        reject(new Error('Invalid file format'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsText(file)
  })
}

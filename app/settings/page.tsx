'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useFinancial } from '@/contexts/FinancialContext'
import { exportFinancialState, importFinancialState, clearFinancialState } from '@/lib/storage'
import { Currency, HouseholdType } from '@/lib/types'
import { Download, Upload, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function SettingsPage() {
  const { state, updateSettings, resetState, importState } = useFinancial()
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleExport = () => {
    exportFinancialState(state)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const imported = await importFinancialState(file)
      importState(imported)
      setImportMessage({ type: 'success', text: 'Plan imported successfully!' })
      setTimeout(() => setImportMessage(null), 3000)
    } catch (error) {
      setImportMessage({ type: 'error', text: 'Failed to import plan. Please check the file format.' })
      setTimeout(() => setImportMessage(null), 5000)
    }

    e.target.value = ''
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      clearFinancialState()
      resetState()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your preferences and manage your data
        </p>
      </div>

      {importMessage && (
        <Alert variant={importMessage.type === 'error' ? 'destructive' : 'default'}>
          {importMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{importMessage.text}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Currency & Display</CardTitle>
          <CardDescription>Choose your preferred currency</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={state.currency}
              onValueChange={(value: Currency) => updateSettings({ currency: value })}
            >
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="CUSTOM">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {state.currency === 'CUSTOM' && (
            <div className="space-y-2">
              <Label htmlFor="customFxRate">
                Custom FX Rate (multiplier from GBP)
              </Label>
              <Input
                id="customFxRate"
                type="number"
                min="0.01"
                step="0.01"
                value={state.customFxRate}
                onChange={(e) =>
                  updateSettings({ customFxRate: parseFloat(e.target.value) || 1 })
                }
              />
              <p className="text-xs text-muted-foreground">
                All calculations are done in GBP. This rate converts display values to your custom
                currency. For example, if your currency is worth 1.2 GBP, enter 1.2.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="householdType">Household Type</Label>
            <Select
              value={state.householdType}
              onValueChange={(value: HouseholdType) =>
                updateSettings({ householdType: value })
              }
            >
              <SelectTrigger id="householdType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="couple">Couple</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This is used for labeling only. No tax calculations are performed.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Export, import, or reset your financial plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Export Plan</Label>
            <Button onClick={handleExport} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download as JSON
            </Button>
            <p className="text-xs text-muted-foreground">
              Save your plan to a file for backup or to transfer to another device
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="import">Import Plan</Label>
            <div>
              <input
                id="import"
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <Button
                onClick={() => document.getElementById('import')?.click()}
                variant="outline"
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload JSON file
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Load a previously saved plan. This will replace your current data.
            </p>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <Label>Reset All Data</Label>
            <Button onClick={handleReset} variant="destructive" className="w-full">
              <Trash2 className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>
            <p className="text-xs text-muted-foreground">
              Clear all data and start fresh. This cannot be undone.
            </p>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          All data is stored locally in your browser. Clear your browser data will delete your
          financial plan. Export regularly to keep a backup.
        </AlertDescription>
      </Alert>
    </div>
  )
}

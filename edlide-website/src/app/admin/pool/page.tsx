'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Loader2, Plus, Trash2, Power, PowerOff, RefreshCw, Activity } from 'lucide-react'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface PoolAccount {
  id: string
  accountName: string
  accessKey: string
  expiresAt: string | null
  dailyLimit: number
  rpmLimit: number
  usedToday: number
  requestsPerMinute: number
  lastRequestAt: string | null
  isActive: boolean
  createdAt: string | null
}

interface PoolStats {
  totalAccounts: number
  activeAccounts: number
  totalUsedToday: number
  avgUsagePercent: number
}

interface AddAccountForm {
  accountName: string
  accessKey: string
  accessToken: string
  refreshToken: string
  expiresIn: string
}

export default function AdminPoolPage() {
  const [accounts, setAccounts] = useState<PoolAccount[]>([])
  const [stats, setStats] = useState<PoolStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState<AddAccountForm>({
    accountName: '',
    accessKey: '',
    accessToken: '',
    refreshToken: '',
    expiresIn: '3600',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [accountsRes, statsRes] = await Promise.all([
        fetch('/api/admin/pool/accounts'),
        fetch('/api/admin/pool/stats'),
      ])

      const accountsData = await accountsRes.json()
      const statsData = await statsRes.json()

      if (accountsData.accounts) {
        setAccounts(accountsData.accounts)
      }

      if (statsData.stats) {
        setStats(statsData.stats)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load pool data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAdding(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/admin/pool/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountName: addForm.accountName,
          accessKey: addForm.accessKey,
          accessToken: addForm.accessToken,
          refreshToken: addForm.refreshToken || undefined,
          expiresIn: parseInt(addForm.expiresIn) || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to add account')
        return
      }

      setSuccess('Account added successfully')
      setShowAddForm(false)
      setAddForm({
        accountName: '',
        accessKey: '',
        accessToken: '',
        refreshToken: '',
        expiresIn: '3600',
      })
      fetchData()
    } catch (err) {
      console.error('Error adding account:', err)
      setError('Failed to add account')
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveAccount = async (id: string) => {
    if (!confirm('Are you sure you want to remove this account?')) return

    try {
      const response = await fetch(`/api/admin/pool/accounts/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to remove account')
        return
      }

      setSuccess('Account removed successfully')
      fetchData()
    } catch (err) {
      console.error('Error removing account:', err)
      setError('Failed to remove account')
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/pool/accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update account')
        return
      }

      setSuccess(`Account ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
      fetchData()
    } catch (err) {
      console.error('Error toggling account:', err)
      setError('Failed to update account')
    }
  }

  const getUsagePercent = (used: number, limit: number) => {
    if (limit === 0) return 0
    return Math.round((used / limit) * 100)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString()
  }

  const formatRelativeTime = (dateStr: string | null) => {
    if (!dateStr) return '-'
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <span className="ml-3 text-gray-400">Loading pool data...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Chutes Pool Management</h1>
            <p className="text-gray-400 mt-1">Manage your Chutes API account pool</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Account
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-800 rounded-lg text-green-400">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <Activity className="w-5 h-5 text-purple-500" />
              </div>
              <span className="text-gray-400 text-sm">Total Accounts</span>
            </div>
            <div className="text-3xl font-bold">{stats?.totalAccounts || 0}</div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-600/20 rounded-lg">
                <Power className="w-5 h-5 text-green-500" />
              </div>
              <span className="text-gray-400 text-sm">Active Accounts</span>
            </div>
            <div className="text-3xl font-bold">{stats?.activeAccounts || 0}</div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-gray-400 text-sm">Total Used Today</span>
            </div>
            <div className="text-3xl font-bold">{stats?.totalUsedToday?.toLocaleString() || 0}</div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-600/20 rounded-lg">
                <Activity className="w-5 h-5 text-yellow-500" />
              </div>
              <span className="text-gray-400 text-sm">Avg Usage</span>
            </div>
            <div className="text-3xl font-bold">{stats?.avgUsagePercent || 0}%</div>
          </div>
        </div>

        {showAddForm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-lg p-6">
              <h2 className="text-xl font-bold mb-4">Add Chutes Account</h2>

              <form onSubmit={handleAddAccount} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Account Name</label>
                  <input
                    type="text"
                    value={addForm.accountName}
                    onChange={(e) => setAddForm({ ...addForm, accountName: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                    placeholder="e.g., Account 1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Access Key</label>
                  <input
                    type="text"
                    value={addForm.accessKey}
                    onChange={(e) => setAddForm({ ...addForm, accessKey: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                    placeholder="Public access key"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Access Token</label>
                  <input
                    type="text"
                    value={addForm.accessToken}
                    onChange={(e) => setAddForm({ ...addForm, accessToken: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                    placeholder="Encrypted access token"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Refresh Token (optional)</label>
                  <input
                    type="text"
                    value={addForm.refreshToken}
                    onChange={(e) => setAddForm({ ...addForm, refreshToken: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                    placeholder="Encrypted refresh token"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Expires In (seconds, optional)</label>
                  <input
                    type="number"
                    value={addForm.expiresIn}
                    onChange={(e) => setAddForm({ ...addForm, expiresIn: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                    placeholder="3600"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Adding...
                      </>
                    ) : (
                      'Add Account'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left p-4 text-gray-400 font-medium">Account</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Access Key</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Daily Usage</th>
                  <th className="text-left p-4 text-gray-400 font-medium">RPM</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Last Request</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                  <th className="text-right p-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      No accounts in pool. Add your first Chutes account.
                    </td>
                  </tr>
                ) : (
                  accounts.map((account) => (
                    <tr key={account.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4">
                        <div className="font-medium">{account.accountName}</div>
                        <div className="text-sm text-gray-500">{account.id.slice(0, 8)}...</div>
                      </td>
                      <td className="p-4">
                        <code className="text-sm text-purple-400 bg-purple-900/20 px-2 py-1 rounded">
                          {account.accessKey.slice(0, 12)}...
                        </code>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                getUsagePercent(account.usedToday, account.dailyLimit) > 80
                                  ? 'bg-red-500'
                                  : getUsagePercent(account.usedToday, account.dailyLimit) > 50
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              }`}
                              style={{ width: `${getUsagePercent(account.usedToday, account.dailyLimit)}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-400 w-20">
                            {account.usedToday.toLocaleString()} / {account.dailyLimit.toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={account.requestsPerMinute >= account.rpmLimit ? 'text-red-400' : 'text-gray-300'}>
                          {account.requestsPerMinute} / {account.rpmLimit}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400 text-sm">
                        {formatRelativeTime(account.lastRequestAt)}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          account.isActive
                            ? 'bg-green-900/30 text-green-400 border border-green-800'
                            : 'bg-gray-800 text-gray-500 border border-gray-700'
                        }`}>
                          {account.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleActive(account.id, account.isActive)}
                            className={`p-2 rounded-lg transition-colors ${
                              account.isActive
                                ? 'bg-yellow-900/20 hover:bg-yellow-900/40 text-yellow-500'
                                : 'bg-green-900/20 hover:bg-green-900/40 text-green-500'
                            }`}
                            title={account.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {account.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleRemoveAccount(account.id)}
                            className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-500 rounded-lg transition-colors"
                            title="Remove account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          Each account provides 5000 requests/day and 180 RPM. Daily reset at 00:00 UTC.
        </div>
      </div>
    </div>
  )
}
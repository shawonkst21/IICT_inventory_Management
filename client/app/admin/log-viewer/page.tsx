'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Clock4, ListChecks, RefreshCcw } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { fetchAdminLogs, type AuditLogEntry } from '@/lib/api'

const formatDateTime = (value: string) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

const truncate = (value: string | null | undefined, length = 90) => {
  if (!value) return '-'
  return value.length <= length ? value : `${value.slice(0, length)}...`
}

export default function LogViewerPage() {
  const { token, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [tableFilter, setTableFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const actions = useMemo(() => Array.from(new Set(logs.map((log) => log.action).filter(Boolean))), [logs])
  const tables = useMemo(
    () => Array.from(new Set(logs.map((log) => log.table_name).filter((name): name is string => Boolean(name)))),
    [logs],
  )

  const buildQuery = () => ({
    search,
    action: actionFilter,
    tableName: tableFilter,
    fromDate,
    toDate,
  })

  const loadLogs = async () => {
    if (!token) return
    setLoading(true)
    setError('')

    try {
      const rawLogs = await fetchAdminLogs(buildQuery())
      setLogs(rawLogs)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Unable to load audit logs')
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && token) {
      void loadLogs()
    }
  }, [authLoading, token])

  useEffect(() => {
    const debounce = window.setTimeout(() => {
      if (!authLoading && token) {
        void loadLogs()
      }
    }, 250)

    return () => window.clearTimeout(debounce)
  }, [search, actionFilter, tableFilter, fromDate, toDate, authLoading, token])

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">Audit logs</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Log Viewer</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            View recent system activity and user audit events for the admin console.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadLogs()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Search</span>
          <div className="relative rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full border-0 bg-transparent pl-9 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              placeholder="Search actions, details, user"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Action</span>
          <select
            className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
          >
            <option value="">All actions</option>
            {actions.map((action) => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Entity</span>
          <select
            className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            value={tableFilter}
            onChange={(event) => setTableFilter(event.target.value)}
          >
            <option value="">All entities</option>
            {tables.map((tableName) => (
              <option key={tableName} value={tableName}>{tableName}</option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </label>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between gap-4 px-6 py-4 bg-white">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <ListChecks className="h-4 w-4" />
            {logs.length} log{logs.length === 1 ? '' : 's'} loaded
          </div>
          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Action</th>
                <th className="px-6 py-4 font-semibold">Entity</th>
                <th className="px-6 py-4 font-semibold">Record</th>
                <th className="px-6 py-4 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-500">
                    <div className="inline-flex items-center gap-2">
                      <Clock4 className="h-5 w-5 animate-spin" />
                      Loading logs...
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                    No audit logs found for the selected filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-600">{formatDateTime(log.created_at)}</td>
                    <td className="px-6 py-4 text-slate-900">
                      {log.user_name || log.user_email || 'System'}
                    </td>
                    <td className="px-6 py-4 text-slate-900 font-medium">{log.action}</td>
                    <td className="px-6 py-4 text-slate-900">{log.table_name || '-'}</td>
                    <td className="px-6 py-4 text-slate-900">{log.record_id ?? '-'}</td>
                    <td className="px-6 py-4">
                      <details className="group rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-slate-300">
                        <summary className="cursor-pointer list-none text-sm font-medium text-slate-900 marker:hidden">
                          {truncate(log.details || 'No details available', 100)}
                        </summary>
                        <div className="mt-2 text-sm leading-6 text-slate-700">
                          {log.details || 'No details available'}
                        </div>
                      </details>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

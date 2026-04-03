import { useMemo, useState } from 'react'
import CredibilityGauge from './components/CredibilityGauge'
import DistributionPie from './components/DistributionPie'
import ExplainabilityBar from './components/ExplainabilityBar'
import { analyzeCsv } from './lib/api'

const PAGE_SIZE = 8

function statusBadge(status) {
  return status === 'Genuine'
    ? 'bg-emerald-500/20 text-emerald-300'
    : 'bg-rose-500/20 text-rose-300'
}

function toCsv(data) {
  if (!data.length) return ''
  const headers = Object.keys(data[0])
  const rows = data.map((row) =>
    headers
      .map((h) => {
        const value = row[h]
        const cell = value === null || value === undefined ? '' : String(value)
        return `"${cell.replace(/"/g, '""')}"`
      })
      .join(','),
  )
  return [headers.join(','), ...rows].join('\n')
}

export default function App() {
  const [file, setFile] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return results
    return results.filter(
      (row) =>
        row.influencer_name.toLowerCase().includes(q) ||
        row.category.toLowerCase().includes(q) ||
        row.insta_id.toLowerCase().includes(q),
    )
  }, [results, search])

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  const onAnalyze = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const data = await analyzeCsv(file)
      setResults(data)
      setSelected(data[0] ?? null)
      setPage(1)
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Failed to analyze CSV')
    } finally {
      setLoading(false)
    }
  }

  const onDownload = () => {
    const csv = toCsv(filtered)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'influencer_audit_report.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 md:px-12">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h1 className="text-2xl font-bold">Influencer Credibility Audit Dashboard</h1>
          <p className="mt-2 text-slate-300">
            Upload follower CSVs, detect fake followers, and audit influencer credibility.
          </p>
        </header>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-sm"
            />
            <button
              onClick={onAnalyze}
              disabled={!file || loading}
              className="rounded-lg bg-cyan-500 px-4 py-2 font-medium text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-600"
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
            <button
              onClick={onDownload}
              disabled={!filtered.length}
              className="rounded-lg bg-emerald-500 px-4 py-2 font-medium text-slate-900 disabled:bg-slate-600"
            >
              Download Report
            </button>
          </div>
          {error ? <p className="mt-3 text-rose-300">{error}</p> : null}
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold">Influencer Audit Table</h2>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search by name/category/ID"
              className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-sm"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="text-slate-300">
                <tr>
                  <th className="p-2">Influencer</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">Insta ID</th>
                  <th className="p-2">Total Followers</th>
                  <th className="p-2">Genuine</th>
                  <th className="p-2">Suspicious</th>
                  <th className="p-2">Bot</th>
                  <th className="p-2">Credibility</th>
                  <th className="p-2">Final Status</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((row) => (
                  <tr
                    key={row.insta_id}
                    className="cursor-pointer border-t border-slate-800 hover:bg-slate-800/60"
                    onClick={() => setSelected(row)}
                  >
                    <td className="p-2">{row.influencer_name}</td>
                    <td className="p-2">{row.category}</td>
                    <td className="p-2">{row.insta_id}</td>
                    <td className="p-2">{row.total_followers}</td>
                    <td className="p-2 text-emerald-300">{row.genuine_count}</td>
                    <td className="p-2 text-amber-300">{row.suspicious_count}</td>
                    <td className="p-2 text-rose-300">{row.bot_count}</td>
                    <td className="p-2">{(row.credibility_score * 100).toFixed(2)}%</td>
                    <td className="p-2">
                      <span className={`rounded-full px-2 py-1 text-xs ${statusBadge(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
            <span>
              Showing {paginated.length} of {filtered.length} influencer(s)
            </span>
            <div className="flex items-center gap-2">
              <button
                className="rounded bg-slate-800 px-3 py-1 disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <span>
                {page}/{totalPages}
              </span>
              <button
                className="rounded bg-slate-800 px-3 py-1 disabled:opacity-40"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </section>

        {selected ? (
          <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Explainability: {selected.influencer_name}</h2>
              <p className="text-sm text-slate-300">Reason: {selected.reason}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <CredibilityGauge score={selected.credibility_score} />
              <DistributionPie influencer={selected} />
              <ExplainabilityBar influencer={selected} />
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}

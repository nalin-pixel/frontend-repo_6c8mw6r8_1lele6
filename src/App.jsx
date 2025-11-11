import { useState, useMemo } from 'react'

function App() {
  const [market, setMarket] = useState('US')
  const [topN, setTopN] = useState(20)
  const [wishlist, setWishlist] = useState('AAPL, MSFT, NVDA')
  const [discountRate, setDiscountRate] = useState(0.10)
  const [growthRate, setGrowthRate] = useState(0.05)
  const [riskFreeRate, setRiskFreeRate] = useState(0.045)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const backendUrl = useMemo(() => {
    return import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
  }, [])

  const handleAnalyze = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const body = {
        market: market.trim().toUpperCase(),
        top_n: Number(topN) || 10,
        wishlist: wishlist
          .split(/[,\n]/)
          .map(t => t.trim())
          .filter(Boolean),
        discount_rate: Number(discountRate),
        growth_rate: Number(growthRate),
        risk_free_rate: Number(riskFreeRate),
      }

      const res = await fetch(`${backendUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`Request failed (${res.status}): ${txt}`)
      }

      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const downloadJson = () => {
    if (!result) return
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const ts = new Date().toISOString().replace(/[:.]/g, '-')
    a.href = url
    a.download = `equity-analysis-${ts}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <header className="px-6 py-4 border-b bg-white/70 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Daily Equity Analyzer</h1>
          <a href="/test" className="text-sm text-indigo-600 hover:text-indigo-700 underline">Check backend</a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1 bg-white rounded-xl shadow-sm border p-5">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Run analysis</h2>
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Market</label>
              <select value={market} onChange={(e) => setMarket(e.target.value)} className="w-full rounded-md border-slate-300 focus:border-indigo-500 focus:ring-indigo-500">
                <option value="US">US</option>
                <option value="IN">IN (NSE)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Top N most-traded</label>
              <input type="number" min="1" max="200" value={topN} onChange={(e) => setTopN(e.target.value)} className="w-full rounded-md border-slate-300 focus:border-indigo-500 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Wishlist tickers (comma or newline separated)</label>
              <textarea rows={3} value={wishlist} onChange={(e) => setWishlist(e.target.value)} className="w-full rounded-md border-slate-300 focus:border-indigo-500 focus:ring-indigo-500" />
              <p className="text-xs text-slate-500 mt-1">Examples: AAPL, MSFT, BRK-B • For India, use .NS suffix (e.g., RELIANCE.NS)</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Discount rate</label>
                <input type="number" step="0.005" value={discountRate} onChange={(e) => setDiscountRate(e.target.value)} className="w-full rounded-md border-slate-300 focus:border-indigo-500 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Growth rate</label>
                <input type="number" step="0.005" value={growthRate} onChange={(e) => setGrowthRate(e.target.value)} className="w-full rounded-md border-slate-300 focus:border-indigo-500 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Risk-free rate</label>
                <input type="number" step="0.005" value={riskFreeRate} onChange={(e) => setRiskFreeRate(e.target.value)} className="w-full rounded-md border-slate-300 focus:border-indigo-500 focus:ring-indigo-500" />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-md transition-colors">
              {loading ? 'Analyzing…' : 'Run Analysis'}
            </button>

            <p className="text-xs text-slate-500 text-center">Backend: <span className="font-mono">{backendUrl}</span></p>
          </form>
        </section>

        <section className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-800">Results</h2>
            <div className="flex gap-2">
              <button onClick={downloadJson} disabled={!result} className="px-3 py-2 rounded-md border bg-slate-50 hover:bg-slate-100 disabled:opacity-50">Download JSON</button>
            </div>
          </div>

          {!result && !loading && (
            <p className="text-slate-500">Run an analysis to see results here.</p>
          )}

          {loading && (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              <div className="h-4 bg-slate-200 rounded w-2/3"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {result.metadata && (
                <div className="text-sm text-slate-600">
                  <p><span className="font-semibold">Market:</span> {result.metadata.market}</p>
                  <p><span className="font-semibold">Timestamp:</span> {result.metadata.timestamp}</p>
                  {result.metadata.fallbacks && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-slate-700">Data fallbacks</summary>
                      <pre className="text-xs bg-slate-50 p-2 rounded overflow-auto">{JSON.stringify(result.metadata.fallbacks, null, 2)}</pre>
                    </details>
                  )}
                </div>
              )}

              {result.alerts && result.alerts.length > 0 && (
                <div className="border rounded-md p-3 bg-amber-50 border-amber-200">
                  <h3 className="font-semibold text-amber-800 mb-1">Alerts</h3>
                  <ul className="list-disc pl-5 text-sm text-amber-900">
                    {result.alerts.map((a, idx) => (
                      <li key={idx}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.stocks && result.stocks.length > 0 && (
                <div className="overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-700 border-b">
                        <th className="py-2 pr-3">Ticker</th>
                        <th className="py-2 pr-3">Price</th>
                        <th className="py-2 pr-3">Score</th>
                        <th className="py-2 pr-3">MOS</th>
                        <th className="py-2 pr-3">EPV/Price</th>
                        <th className="py-2 pr-3">52w Low</th>
                        <th className="py-2 pr-3">Signals</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.stocks.map((s, i) => (
                        <tr key={s.ticker || i} className="border-b last:border-0">
                          <td className="py-2 pr-3 font-medium text-slate-800">{s.ticker}</td>
                          <td className="py-2 pr-3">{s.price ?? '-'}</td>
                          <td className="py-2 pr-3">{s.composite_score?.toFixed?.(3) ?? '-'}</td>
                          <td className="py-2 pr-3">{s.margin_of_safety?.toFixed?.(2) ?? '-'}</td>
                          <td className="py-2 pr-3">{s.epv_to_price?.toFixed?.(2) ?? '-'}</td>
                          <td className="py-2 pr-3">{s.new_52w_low ? 'Yes' : 'No'}</td>
                          <td className="py-2 pr-3 text-xs">
                            <div className="flex flex-wrap gap-1">
                              {s.buy_signal && <span className="px-2 py-0.5 rounded bg-green-100 text-green-700">Buy</span>}
                              {s.news_catalyst && <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">News</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {result.disclaimer && (
                <p className="text-xs text-slate-500 border-t pt-3">{result.disclaimer}</p>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App

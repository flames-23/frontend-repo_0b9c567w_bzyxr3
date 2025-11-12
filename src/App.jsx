import { useEffect, useMemo, useState } from 'react'

const API = import.meta.env.VITE_BACKEND_URL || ''

function StatCard({ label, value }) {
  return (
    <div className="p-4 rounded-xl bg-white shadow-sm border">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  )
}

function BookForm({ onSaved }) {
  const [form, setForm] = useState({ title: '', author: '', isbn: '', category: '', total_copies: 1, copies_available: 1 })
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/books`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error('Failed to create')
      setForm({ title: '', author: '', isbn: '', category: '', total_copies: 1, copies_available: 1 })
      onSaved && onSaved()
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3">
      <input className="input" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
      <input className="input" placeholder="Author" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} required />
      <input className="input" placeholder="ISBN" value={form.isbn} onChange={e => setForm({ ...form, isbn: e.target.value })} required />
      <input className="input" placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
      <input type="number" min="0" className="input" placeholder="Total copies" value={form.total_copies} onChange={e => setForm({ ...form, total_copies: Number(e.target.value) })} />
      <input type="number" min="0" className="input" placeholder="Available" value={form.copies_available} onChange={e => setForm({ ...form, copies_available: Number(e.target.value) })} />
      <button disabled={loading} className="col-span-2 btn-primary">{loading ? 'Saving...' : 'Add Book'}</button>
    </form>
  )
}

function MemberForm({ onSaved }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/members`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error('Failed')
      setForm({ name: '', email: '', phone: '' })
      onSaved && onSaved()
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }
  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-3">
      <input className="input" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
      <input className="input" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
      <input className="col-span-2 input" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
      <button disabled={loading} className="col-span-2 btn-primary">{loading ? 'Saving...' : 'Add Member'}</button>
    </form>
  )
}

function useFetch(url, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(url).then(r => r.json()).then(d => { if (!cancelled) setData(d) }).catch(e => setError(e)).finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, deps)
  return { data, loading, error, refetch: () => setLoading(v => !v) }
}

function BooksList({ refreshKey, onBorrow }) {
  const { data: books, loading } = useFetch(`${API}/api/books${refreshKey ? '?_=' + refreshKey : ''}`, [refreshKey])
  if (loading) return <div>Loading books...</div>
  return (
    <div className="space-y-2">
      {(books || []).map(b => (
        <div key={b.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
          <div>
            <div className="font-medium">{b.title}</div>
            <div className="text-sm text-gray-500">{b.author} • {b.isbn} • {b.category || '—'}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 rounded text-sm ${b.copies_available > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{b.copies_available} available</span>
            <button disabled={b.copies_available <= 0} onClick={() => onBorrow(b)} className="btn-secondary disabled:opacity-50">Borrow</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function MembersList({ refreshKey }) {
  const { data: members, loading } = useFetch(`${API}/api/members${refreshKey ? '?_=' + refreshKey : ''}`, [refreshKey])
  if (loading) return <div>Loading members...</div>
  return (
    <div className="space-y-2">
      {(members || []).map(m => (
        <div key={m.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
          <div>
            <div className="font-medium">{m.name}</div>
            <div className="text-sm text-gray-500">{m.email} {m.phone ? '• ' + m.phone : ''}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function LoansList({ refreshKey, onReturn }) {
  const { data: loans, loading } = useFetch(`${API}/api/loans${refreshKey ? '?_=' + refreshKey : ''}`, [refreshKey])
  if (loading) return <div>Loading loans...</div>
  return (
    <div className="space-y-2">
      {(loans || []).map(l => (
        <div key={l.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
          <div>
            <div className="font-medium">{l.book_title} → {l.member_name}</div>
            <div className="text-sm text-gray-500">Due {new Date(l.due_at).toLocaleDateString()} • {l.status}</div>
          </div>
          {l.status !== 'returned' && (
            <button onClick={() => onReturn(l)} className="btn-secondary">Mark Returned</button>
          )}
        </div>
      ))}
    </div>
  )
}

function BorrowDialog({ open, onClose, book, onBorrowed, membersRefreshKey }) {
  const { data: members } = useFetch(`${API}/api/members`, [open])
  const [memberId, setMemberId] = useState('')
  const [days, setDays] = useState(14)
  const borrow = async () => {
    const res = await fetch(`${API}/api/loans/borrow`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ member_id: memberId, book_id: book.id, days }) })
    if (res.ok) { onBorrowed(); onClose() }
  }
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-4 w-full max-w-md space-y-3">
        <div className="text-lg font-semibold">Borrow "{book?.title}"</div>
        <select className="input w-full" value={memberId} onChange={e => setMemberId(e.target.value)}>
          <option value="">Select member</option>
          {(members || []).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <input type="number" min="1" max="60" className="input" value={days} onChange={e => setDays(Number(e.target.value))} />
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button disabled={!memberId} className="btn-primary" onClick={borrow}>Confirm</button>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [tab, setTab] = useState('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)
  const [borrowOpen, setBorrowOpen] = useState(false)
  const [borrowBook, setBorrowBook] = useState(null)
  const { data: stats, loading: statsLoading } = useFetch(`${API}/api/stats?_=${refreshKey}`, [refreshKey])

  const refresh = () => setRefreshKey(x => x + 1)

  const onBorrow = (book) => { setBorrowBook(book); setBorrowOpen(true) }
  const onReturn = async (loan) => {
    await fetch(`${API}/api/loans/${loan.id}/return`, { method: 'POST' })
    refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <header className="sticky top-0 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="text-xl font-semibold">Library Management</div>
          <nav className="ml-auto flex gap-2">
            {['dashboard','books','members','loans'].map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-md text-sm ${tab===t? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'}`}>{t[0].toUpperCase()+t.slice(1)}</button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {tab === 'dashboard' && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard label="Books" value={statsLoading? '—' : stats?.books ?? 0} />
            <StatCard label="Copies" value={statsLoading? '—' : stats?.copies ?? 0} />
            <StatCard label="Available" value={statsLoading? '—' : stats?.available ?? 0} />
            <StatCard label="Members" value={statsLoading? '—' : stats?.members ?? 0} />
            <StatCard label="Active Loans" value={statsLoading? '—' : stats?.active_loans ?? 0} />
          </div>
        )}

        {tab === 'books' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1 p-4 bg-white rounded-xl border space-y-3">
              <div className="font-semibold">Add Book</div>
              <BookForm onSaved={refresh} />
            </div>
            <div className="md:col-span-2">
              <BooksList refreshKey={refreshKey} onBorrow={(b)=>{onBorrow(b)}} />
            </div>
          </div>
        )}

        {tab === 'members' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1 p-4 bg-white rounded-xl border space-y-3">
              <div className="font-semibold">Add Member</div>
              <MemberForm onSaved={refresh} />
            </div>
            <div className="md:col-span-2">
              <MembersList refreshKey={refreshKey} />
            </div>
          </div>
        )}

        {tab === 'loans' && (
          <div className="space-y-3">
            <LoansList refreshKey={refreshKey} onReturn={onReturn} />
          </div>
        )}
      </main>

      <BorrowDialog open={borrowOpen} onClose={() => setBorrowOpen(false)} book={borrowBook} onBorrowed={refresh} />
    </div>
  )
}

export default App

// Tailwind utility classes helpers
// Using global styles defined in index.css

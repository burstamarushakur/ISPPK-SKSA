import { Link, Outlet } from 'react-router-dom'

export default function Layout() {
  return <div className="app-shell">
    <header className="topbar">
      <Link to="/" className="brand">
        <div className="brand-mark">KBAT</div>
        <div>ISPPK SKSA<small>SK Sungai Abong · JBA5095 · Multi-tahun</small></div>
      </Link>
      <nav className="nav-actions">
        <Link to="/borang" className="btn btn-secondary">Isi Instrumen</Link>
        <Link to="/pic" className="btn btn-ghost">PIC</Link>
      </nav>
    </header>
    <Outlet />
  </div>
}

import { Link, Outlet } from 'react-router-dom'

const SCHOOL_LOGO_URL = 'https://i.postimg.cc/3RF9M05N/Logo-SKSA.png'

export default function Layout() {
  return <div className="app-shell">
    <header className="topbar">
      <Link to="/" className="brand">
        <div className="brand-mark brand-mark-image">
          <img src={SCHOOL_LOGO_URL} alt="Logo SKSA" />
        </div>
        <div>ISPPK SKSA<small>SK Sungai Abong · JBA5095</small></div>
      </Link>
      <nav className="nav-actions">
        <Link to="/borang" className="btn btn-secondary">Isi Instrumen</Link>
        <Link to="/pic" className="btn btn-ghost">PIC</Link>
      </nav>
    </header>
    <Outlet />
  </div>
}

import { Outlet } from 'react-router-dom'
import ColumnMapper from '../upload/ColumnMapper'
import Header from './Header'
import Sidebar from './Sidebar'
import Toast from '../ui/Toast'

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-app)', transition: 'background 0.25s ease' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="no-print"><Header /></div>
        <main className="flex-1 overflow-auto scrollbar-light">
          <Outlet />
        </main>
      </div>
      <Toast />
      <ColumnMapper />
    </div>
  )
}

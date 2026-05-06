function Layout({ children, role, logout }) {
  return (
    <div className="flex min-h-screen bg-zinc-100">

      <div className="w-64 bg-gradient-to-b from-slate-800 via-slate-700 to-slate-800 text-white p-6 flex flex-col justify-between border-r border-slate-300/20 shadow-lg shadow-slate-900/20">

        <div>
          <h1 className="text-xl font-semibold tracking-tight mb-1 text-zinc-100">
            St Joseph&apos;s College
          </h1>
          <p className="text-xs uppercase tracking-wider text-blue-200/90 mb-8">Procurement</p>

          <p className="mb-6 text-sm text-slate-200/80">
            {role}
          </p>

          <div className="space-y-1">
            <button type="button" className="w-full text-left text-slate-200/80 hover:bg-slate-600/60 hover:text-white p-2.5 rounded-lg text-sm font-medium transition">
              Dashboard
            </button>
            <button type="button" className="w-full text-left text-slate-200/80 hover:bg-slate-600/60 hover:text-white p-2.5 rounded-lg text-sm font-medium transition">
              Requests
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="bg-red-600/95 hover:bg-red-600 text-white text-sm font-medium p-2.5 rounded-lg mt-10 ring-1 ring-red-500/30 transition"
        >
          Logout
        </button>

      </div>

      <div className="flex-1 p-8 bg-zinc-50/90">
        {children}
      </div>

    </div>
  );
}

export default Layout;

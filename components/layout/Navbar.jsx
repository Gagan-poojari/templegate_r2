"use client";

import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6">
      <p className="text-sm text-slate-600">Accounts Payable</p>
      <div className="flex items-center gap-4">
        {user && (
          <span className="text-sm text-slate-700">
            {user.name}{" "}
            <span className="text-slate-400">({user.role})</span>
          </span>
        )}
        <button
          type="button"
          onClick={logout}
          className="text-sm font-medium text-slate-700 hover:text-slate-900"
        >
          Log out
        </button>
      </div>
    </header>
  );
}

import { HardHat } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white border-b border-slate-200 py-4 px-6">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-semibold text-primary flex items-center">
          <HardHat className="mr-2" />
          Benefits Portal
        </h1>
        <div className="flex items-center space-x-4">
          <span className="hidden md:inline-block text-sm">HR Admin</span>
          <button className="bg-slate-100 p-2 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-slate-600"
            >
              <path d="M18 20a6 6 0 0 0-12 0" />
              <circle cx="12" cy="10" r="4" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

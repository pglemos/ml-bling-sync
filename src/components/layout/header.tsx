import { Button } from "@/components/ui/button";
import { Bell, Search } from "lucide-react";

export function Header() {
  return (
    <header className="glass-effect border-b border-gray-100 sticky top-0 z-40">
      <div className="px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1 font-medium">Visão geral do seu negócio em tempo real</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative p-3 text-gray-400 hover:text-gray-600 transition-colors bg-white rounded-xl shadow-sm hover:shadow-md">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <Button className="px-6 py-3 rounded-xl font-semibold flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0 0h6m-6 0h-6" />
              </svg>
              <span>Sincronizar Agora</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

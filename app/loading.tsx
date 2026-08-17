import { Loader2 } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-green-500 to-emerald-600 rounded-2xl shadow-xl animate-pulse">
          <span className="text-3xl font-bold text-white">JS</span>
          <div className="absolute inset-0 border-4 border-white/20 rounded-2xl animate-spin-slow" style={{ animationDuration: '3s' }}></div>
        </div>
        <div className="flex items-center text-green-700 font-medium">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading JanSamvedan...
        </div>
      </div>
    </div>
  );
}

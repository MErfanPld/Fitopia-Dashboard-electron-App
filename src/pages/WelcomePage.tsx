import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, LogIn, Clock, ShieldAlert, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState<number>(12);
  const [targetPath, setTargetPath] = useState<string | null>(null);

  useEffect(() => {
    // Read stored redirect target if available
    const savedTarget = localStorage.getItem('fitopia_redirect_target');
    if (savedTarget) {
      setTargetPath(savedTarget);
    }

    // Auto redirect timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <div
      className="min-h-screen bg-[#0D0D0D] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-['Vazirmatn',sans-serif] selection:bg-[#FF7A1A]/30 selection:text-[#FF7A1A]"
      dir="rtl"
    >
      {/* Background Glow Accents */}
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-[#FF7A1A]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#141414] border border-[#262626] rounded-3xl p-8 shadow-2xl relative z-10 backdrop-blur-xl text-center space-y-6">
        {/* Logo and Icon */}
        <div className="relative mx-auto w-20 h-20">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#FF7A1A] to-[#FF9D4D] flex items-center justify-center text-slate-950 shadow-xl shadow-[#FF7A1A]/25">
            <Zap className="w-10 h-10 fill-slate-950 stroke-slate-950" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#1F1F1F] border-2 border-[#141414] flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>

        {/* Title and Badge */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FF7A1A]/10 text-[#FF7A1A] border border-[#FF7A1A]/20">
            <Clock className="w-3.5 h-3.5" />
            <span>پایان نشست کاری</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            نشست شما به پایان رسید
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            به‌منظور حفظ امنیت حساب مدیریت فیتوپیا، نشست شما منقضی شده است. لطفاً جهت ادامه کار دوباره وارد حساب خود شوید.
          </p>
        </div>

        {/* Info card about saved location */}
        {targetPath && (
          <div className="p-3 bg-[#1C1C1C] border border-[#2A2A2A] rounded-2xl text-xs text-slate-300 text-right flex items-center justify-between">
            <span className="text-slate-400 font-medium">بازگشت خودکار پس از ورود به:</span>
            <span className="font-bold text-[#FF7A1A] bg-[#FF7A1A]/10 px-2.5 py-1 rounded-xl dir-ltr font-mono text-[11px]">
              {targetPath}
            </span>
          </div>
        )}

        {/* Countdown notice */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 bg-[#181818] py-2.5 px-4 rounded-xl border border-[#262626]">
          <Clock className="w-4 h-4 text-[#FF7A1A] animate-pulse" />
          <span>هدایت خودکار به صفحه ورود در</span>
          <span className="font-mono font-bold text-[#FF7A1A] text-sm dir-ltr">
            {countdown}
          </span>
          <span>ثانیه</span>
        </div>

        {/* Actions */}
        <div className="pt-2">
          <button
            onClick={handleGoToLogin}
            className="w-full bg-gradient-to-r from-[#FF7A1A] to-[#FF8C00] hover:from-[#FF8C00] hover:to-[#FF7A1A] text-slate-950 font-black py-3.5 px-5 rounded-2xl text-xs md:text-sm shadow-lg shadow-[#FF7A1A]/25 hover:shadow-[#FF7A1A]/40 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>ورود به حساب کاربری</span>
            <ArrowLeft className="w-4 h-4 mr-1" />
          </button>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-[#222] text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>سیستم امنیتی مدیریت باشگاه‌های فیتوپیا</span>
        </div>
      </div>
    </div>
  );
};

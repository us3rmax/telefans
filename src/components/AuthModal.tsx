import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail } from "lucide-react";
import { useAuth } from '@/lib/auth-context';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      await login();
      onClose();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] bg-[#1c1d1f] border-none text-white rounded-[28px] p-8 shadow-2xl overflow-hidden">
        {/* Top Indicator Line */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/20 rounded-full" />
        
        <DialogHeader className="relative">
          <button 
            onClick={onClose}
            className="absolute right-0 top-0 text-white/40 hover:text-white transition-colors"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
          <DialogTitle className="text-[28px] font-bold text-left mb-6 tracking-tight">Log in or sign up</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4">
          {/* Telegram Button */}
          <Button 
            className="w-full h-[58px] bg-[#24A1DE] hover:bg-[#24A1DE]/90 text-white text-lg font-bold rounded-[32px] flex items-center justify-center gap-3 transition-transform active:scale-[0.98]"
            onClick={handleLogin}
          >
            <TelegramIcon className="w-6 h-6" />
            Continue with Telegram
          </Button>

          {/* Google Button */}
          <Button 
            variant="outline"
            className="w-full h-[58px] bg-white text-black hover:bg-white/90 text-lg font-bold rounded-[32px] border-none flex items-center justify-center gap-3 transition-transform active:scale-[0.98]"
            onClick={handleLogin}
          >
            <GoogleIcon className="w-6 h-6" />
            Continue with Google
          </Button>

          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/5" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-[#1c1d1f] px-4 text-white/40 font-medium">or use email address</span>
            </div>
          </div>

          {/* Email Input */}
          <div className="space-y-4">
            <Input 
              type="email" 
              placeholder="Enter your email address" 
              className="h-[54px] bg-[#2a2b2d] border-none rounded-[16px] px-5 text-lg focus-visible:ring-1 focus-visible:ring-white/20 placeholder:text-white/30"
            />
            
            {/* Cloudflare Turnstile Mock */}
            <div className="bg-[#2a2b2d] p-4 rounded-[16px] border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-[#22c55e] rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-lg font-medium">Sucesso!</span>
              </div>
              <div className="flex flex-col items-end opacity-60">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-black uppercase tracking-tighter leading-none">CLOUDFLARE</span>
                  <CloudflareLogo className="w-4 h-4 text-[#f6821f]" />
                </div>
                <span className="text-[9px] font-medium leading-none mt-1">Privacidade • Ajuda</span>
              </div>
            </div>

            <Button 
              variant="outline"
              className="w-full h-[58px] bg-white text-black hover:bg-white/90 text-lg font-bold rounded-[32px] border-none flex items-center justify-center gap-3 transition-transform active:scale-[0.98]"
              onClick={handleLogin}
            >
              <Mail className="w-6 h-6" />
              Continue with email
            </Button>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-4 mt-4 px-1">
            <Checkbox id="terms" className="mt-1 w-5 h-5 border-white/20 rounded-md data-[state=checked]:bg-white data-[state=checked]:text-black" />
            <label htmlFor="terms" className="text-[13px] text-white/50 leading-snug font-medium">
              I confirm that I am at least 18 years old and I agree to the 
              <span className="text-white/80 underline ml-1 cursor-pointer">Terms & Conditions</span> and 
              <span className="text-white/80 underline ml-1 cursor-pointer">Privacy Policy</span>.
            </label>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}

function CloudflareLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M23.63 13.04A6.11 6.11 0 0017.52 7c-.12 0-.24 0-.35.01A7.63 7.63 0 009.55 3a7.63 7.63 0 00-7.32 5.51A4.58 4.58 0 002.58 17.5h18.17a3.25 3.25 0 002.88-4.46z"/>
    </svg>
  );
}

function TelegramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-.962 4.084-1.362 5.441-.168.575-.514.768-.718.787-.45.041-.789-.297-1.223-.581-.683-.444-1.068-.722-1.732-1.159-.766-.504-.269-.781.167-1.233.114-.118 2.091-1.918 2.129-2.08.005-.02.01-.093-.034-.132-.044-.039-.108-.026-.156-.015-.067.015-1.139.723-3.212 2.122-.304.208-.58.31-.827.305-.271-.006-.793-.153-1.18-.28-.475-.156-.851-.239-.818-.505.017-.138.207-.28.571-.425 2.233-.97 3.721-1.611 4.463-1.921 2.117-.883 2.556-1.037 2.843-1.042.063-.001.205.015.297.09.077.064.1.15.105.215.006.066.002.132-.005.198z"/>
    </svg>
  );
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

import React, { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppAuth } from "@/lib/authContext";

export default function AuthModal() {
  const { authModalOpen, closeAuthModal, authModalMode, openAuthModal, login, register, googleLogin } = useAppAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = authModalMode === "login";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter both email and password.");
      return;
    }
    if (!isLogin && !name.trim()) {
      toast.error("Please enter your name.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const user = await login(email.trim(), password);
        toast.success(`Welcome back, ${user.name}!`);
      } else {
        const user = await register(email.trim(), password, name.trim());
        toast.success(`Account created! Welcome to Good Luck Palace, ${user.name}.`);
      }
      setEmail("");
      setPassword("");
      setName("");
    } catch (err: any) {
      toast.error(err?.detail || (isLogin ? "Login failed. Check your credentials." : "Registration failed. Try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const demoEmail = email || "customer@example.com";
      const demoName = name || "Good Luck Customer";
      const user = await googleLogin(demoEmail, demoName);
      toast.success(`Signed in with Google as ${user.name}!`);
    } catch (err: any) {
      toast.error("Google sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={authModalOpen} onOpenChange={(open) => !open && closeAuthModal()}>
      <DialogContent className="sm:max-w-[420px] bg-[#FAF7F2] border-[#E7E2DA]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-[#991B1B] font-heading text-xs font-bold text-white">GLP</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#B45309]">Good Luck Palace · Est. 1983</span>
          </div>
          <DialogTitle className="font-heading text-2xl text-[#1C1917]">
            {isLogin ? "Sign In to Your Account" : "Create Customer Account"}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#57534E]">
            {isLogin
              ? "Access your saved addresses, order history, and track doorstep deliveries."
              : "Register to save your address, download invoices, and enjoy seamless repeat ordering."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {!isLogin && (
            <div className="space-y-1.5">
              <Label htmlFor="auth-name" className="text-xs font-medium text-[#1C1917]">Full Name</Label>
              <Input
                id="auth-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ramesh Kumar"
                className="bg-white border-[#E7E2DA]"
                required={!isLogin}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="auth-email" className="text-xs font-medium text-[#1C1917]">Email Address</Label>
            <Input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="bg-white border-[#E7E2DA]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="auth-pass" className="text-xs font-medium text-[#1C1917]">Password</Label>
            </div>
            <Input
              id="auth-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-white border-[#E7E2DA]"
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-[#991B1B] text-white hover:bg-[#7F1D1D] mt-2">
            {loading ? "Processing…" : isLogin ? "Sign In" : "Create Account"}
          </Button>

          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E7E2DA]" /></div>
            <div className="relative flex justify-center text-[11px] uppercase"><span className="bg-[#FAF7F2] px-2 text-[#78716C]">or continue with</span></div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full border-[#E7E2DA] bg-white hover:bg-[#FFFBEB] text-xs font-medium"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            Sign in with Google
          </Button>

          <div className="text-center pt-2 text-xs text-[#57534E]">
            {isLogin ? (
              <p>
                Don't have an account?{" "}
                <button type="button" onClick={() => openAuthModal("register")} className="font-semibold text-[#991B1B] hover:underline">
                  Sign up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button type="button" onClick={() => openAuthModal("login")} className="font-semibold text-[#991B1B] hover:underline">
                  Sign in
                </button>
              </p>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

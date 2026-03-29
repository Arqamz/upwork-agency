'use client';

import { useState, type FormEvent } from 'react';
import { useAuthContext } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Briefcase, ArrowRight, ShieldCheck, Zap, Globe2 } from 'lucide-react';

export default function LoginPage() {
  const { login, isLoading: authLoading } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message || 'Invalid credentials. Please try again.');
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const loading = isSubmitting || authLoading;

  return (
    <div className="flex min-h-screen w-full bg-background overflow-hidden">
      {/* ── Left Panel (Branding / Tagline) ───────────────────────────────── */}
      <div className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-slate-900 p-12 lg:flex">
        {/* Ambient background effects */}
        <div className="absolute -left-1/4 -top-1/4 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute -right-1/4 -bottom-1/4 h-[400px] w-[400px] rounded-full bg-amber/20 blur-[100px]" />

        <div className="relative z-10 flex items-center gap-2 text-2xl font-bold text-white">
          <Briefcase className="h-8 w-8 text-amber shadow-glow-amber rounded-sm" />
          <span>AOP Platform</span>
        </div>

        <div className="relative z-10 space-y-6 max-w-md">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl"
          >
            Orchestrate Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber to-amber/70">
              Freelance Agency
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg text-slate-300"
          >
            The command center for high-performing agencies. Manage bids, track reviews, and close
            deals effortlessly.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 gap-4 pt-8 border-t border-slate-700/50"
          >
            <div className="flex items-center gap-3 text-slate-300">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-white">Lightning Fast Bidding</p>
                <p className="text-sm">Omni-directional pipeline management</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber/20 text-amber">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-white">Secure Access</p>
                <p className="text-sm">Role-based permission controls</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                <Globe2 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-white">Centralized Workspace</p>
                <p className="text-sm">Everything your team needs in one place</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 text-sm text-slate-500">
          &copy; {new Date().getFullYear()} Agency Operations Platform. All rights reserved.
        </div>
      </div>

      {/* ── Right Panel (Login Form) ──────────────────────────────────────── */}
      <div className="relative flex flex-1 items-center justify-center p-8 bg-mesh">
        {/* Subtle mesh background on the right side handled by .bg-mesh in globals.css */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <div className="glass rounded-2xl p-8 border border-border/60 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            {/* Subtle glow behind the form inside the glass */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-amber/5 pointer-events-none" />

            <div className="relative z-10">
              <div className="mb-8 text-center lg:text-left">
                <div className="lg:hidden flex justify-center mb-6">
                  <Briefcase className="h-12 w-12 text-amber shadow-glow-amber" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your credentials to access the platform
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg bg-destructive/10 border border-destructive/20 p-3"
                  >
                    <p className="text-sm text-destructive font-medium">{error}</p>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@agency.com"
                    autoComplete="email"
                    className="h-11 bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all shadow-sm focus:shadow-glow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      Password
                    </Label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="h-11 bg-background/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all shadow-sm focus:shadow-glow-sm"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 mt-2 text-base font-semibold group relative overflow-hidden bg-primary text-primary-foreground shadow-glow-sm hover:shadow-glow-md transition-all duration-300"
                  disabled={loading}
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                </Button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, ShieldCheck, Zap, UploadCloud } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 font-sans selection:bg-brand-500/30 selection:text-brand-900">
      <nav className="border-b border-gray-100 dark:border-gray-800/60 sticky top-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-accent-600 flex items-center justify-center shadow-md">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">FollowTrack</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-300">
            <a href="#features" className="hover:text-brand-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-brand-600 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-brand-600 transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/dashboard/upload">
              <Button variant="gradient" size="sm" className="rounded-full shadow-brand-500/25 shadow-lg">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 overflow-hidden px-4">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-500/10 dark:bg-brand-500/5 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 text-sm font-semibold mb-6 border border-brand-100 dark:border-brand-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
              </span>
              v2.0 is now live
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 text-gray-950 dark:text-white leading-[1.1]">
              Know Who <span className="gradient-text">Followed</span> and <span className="gradient-text">Unfollowed</span> You.
            </h1>
            <p className="text-xl text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Upload your Instagram data and unlock powerful analytics. Track unfollowers, discover mutuals, and grow your audience with data-driven insights. No login or password required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/dashboard/upload">
                <Button variant="gradient" size="lg" className="w-full sm:w-auto rounded-full shadow-brand-500/25 shadow-xl group">
                  Upload Instagram Data
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-full">
                  View Demo Dashboard
                </Button>
              </Link>
            </div>
          </div>

          {/* Fake App Preview */}
          <div className="max-w-5xl mx-auto mt-20 relative">
            <div className="rounded-2xl border border-gray-200/50 dark:border-gray-800/50 bg-white/50 dark:bg-gray-950/50 backdrop-blur-xl shadow-2xl p-2">
              <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 overflow-hidden aspect-video relative flex items-center justify-center">
                 <div className="text-gray-400 font-medium flex flex-col items-center gap-4">
                   <BarChart3 className="w-12 h-12" />
                   Dashboard Preview Image
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features setup... (abbreviated for speed) */}
        <section id="features" className="py-24 bg-gray-50 dark:bg-gray-900/50 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Everything you need to analyze your audience</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">Safe, secure, and fast data processing directly in your browser.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: ShieldCheck, title: '100% Secure & Private', desc: 'We never ask for your Instagram password. Just upload your data export.' },
                { icon: Zap, title: 'Incredible Speed', desc: 'Process thousands of followers instantly in your own browser locally.' },
                { icon: UploadCloud, title: 'Easy Upload', desc: 'Built-in support for official Instagram data JSON format out of the box.' },
              ].map((f, i) => (
                <Card key={i} className="border-none shadow-sm dark:bg-gray-900">
                  <CardContent className="p-8">
                    <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 flex items-center justify-center mb-6">
                      <f.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      
      <footer className="py-12 border-t border-gray-100 dark:border-gray-800 text-center px-4">
        <p className="text-gray-500 dark:text-gray-400 font-medium">© 2026 FollowTrack. All rights reserved.</p>
      </footer>
    </div>
  );
}

import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="text-center mb-8 absolute top-12 left-1/2 -translate-x-1/2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-brand mx-auto flex items-center justify-center mb-3 shadow-glow-brand">
          <span className="text-white font-bold text-lg">S</span>
        </div>
        <h1 className="text-2xl font-bold text-white">SARVYA</h1>
        <p className="text-slate-400 text-sm">Inclusive AI Learning Ecosystem</p>
      </div>
      <SignIn appearance={{
        variables: {
          colorBackground: '#16162a',
          colorText: '#ffffff',
          colorPrimary: '#6366f1',
          colorInputBackground: '#1e1e35',
          colorInputText: '#ffffff',
          borderRadius: '12px',
        },
      }} />
    </div>
  );
}

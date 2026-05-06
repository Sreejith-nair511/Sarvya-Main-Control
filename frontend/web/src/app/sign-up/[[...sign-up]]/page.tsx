import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <SignUp appearance={{
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

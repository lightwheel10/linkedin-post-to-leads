import { AuthForm } from '@/components/auth/auth-form';

export default function SignupPage() {
  return (
    <div className="container mx-auto py-20">
      <AuthForm mode="signup" />
    </div>
  );
}


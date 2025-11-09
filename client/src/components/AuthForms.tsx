import { useState } from "react";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";

export function AuthForms() {
  const [isLogin, setIsLogin] = useState(true);

  const switchToSignup = () => setIsLogin(false);
  const switchToLogin = () => setIsLogin(true);

  return (
    <div className="w-full max-w-md">
      {isLogin ? (
        <LoginForm onSwitchToSignup={switchToSignup} />
      ) : (
        <SignupForm onSwitchToLogin={switchToLogin} />
      )}
    </div>
  );
}

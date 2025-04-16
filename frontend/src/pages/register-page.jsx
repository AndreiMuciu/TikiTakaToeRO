import FormInput from "../components/form-input";
import FormButton from "../components/form-button";
import AuthWrapper from "../components/auth-wrapper";
import AuthSwitchMessage from "../components/auth-switch-message";

function RegisterPage() {
  return (
    <AuthWrapper title="Register">
      <form>
        <FormInput
          label="Username"
          name="name"
          placeholder="Enter your username"
        />
        <FormInput
          label="Password"
          type="password"
          name="password"
          placeholder="••••••••"
        />
        <FormInput
          label="Password Confirmation"
          type="password"
          name="passwordConfirm"
          placeholder="••••••••"
        />
        <FormInput
          label="Email"
          type="email"
          name="email"
          placeholder="Enter your email"
        />
        <AuthSwitchMessage
          question="Already have an account?"
          linkText="Login here"
          linkTo="/login"
        />
        <FormButton text="Register" />
      </form>
    </AuthWrapper>
  );
}

export default RegisterPage;

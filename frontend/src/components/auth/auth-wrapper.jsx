import "../../styles/components/auth-wrapper.css";

function AuthWrapper({ title, children }) {
  return (
    <div className="auth-wrapper">
      <div className="auth-wrapper-inner">
        <h1>{title}</h1>
        {children}
      </div>
    </div>
  );
}

export default AuthWrapper;

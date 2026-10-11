import { Navigate, useNavigate } from "react-router-dom";

import { logout } from "../../api/auth";
import { getSession, homePath } from "../../auth/session";
import ChangePasswordForm from "../../components/ChangePasswordForm";
import { Button, Notice } from "../../components/ui";
import styles from "./LoginPage.module.css";

// Shown after signing in with a temporary password (a new account, or after an admin
// reset it). The server refuses everything else until the password is changed.
export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const session = getSession();
  if (!session) return <Navigate to="/login" replace />;
  if (!session.mustChangePassword) return <Navigate to={homePath(session) || "/login"} replace />;

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <i className="bi bi-shield-lock-fill" />
          </div>
          <div>
            <h1 className={styles.title}>Choose your own password</h1>
            <div className={styles.sub}>Welcome, {session.displayName}</div>
          </div>
        </div>

        <div className={styles.form}>
          <Notice tone="blue">
            You signed in with a temporary password. Choose a new one that only you know before you continue.
          </Notice>
          <ChangePasswordForm
            currentLabel="Temporary password"
            submitLabel="Save and continue"
            onDone={() => navigate(homePath(getSession()) || "/login", { replace: true })}
          />
          <Button
            variant="ghost"
            icon="bi-box-arrow-left"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
          >
            Sign out
          </Button>
        </div>

        <div className={styles.footer}>© {new Date().getFullYear()} National School Management System</div>
      </div>
    </div>
  );
}

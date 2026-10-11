import { useState } from "react";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import { login, logout } from "../../api/auth";
import { getSession, homePath } from "../../auth/session";
import { Button, Field, Input, Notice } from "../../components/ui";
import styles from "./LoginPage.module.css";

const validationSchema = Yup.object({
  email: Yup.string().email("Invalid email format").required("Email is required"),
  password: Yup.string().min(6, "Minimum 6 characters").required("Password is required"),
});

export default function LoginPage() {
  const [alert, setAlert] = useState(null);
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true);
      setAlert(null);

      try {
        await login(values.email, values.password);
        const home = homePath(getSession());
        if (!home) {
          logout();
          setAlert({
            tone: "red",
            message: "This account is not linked to a region or school. Contact the administrator.",
          });
          return;
        }

        // A temporary password must be replaced before anything else
        if (getSession().mustChangePassword) {
          navigate("/change-password");
          return;
        }

        setAlert({ tone: "green", message: "Login successful! Redirecting..." });

        // Redirect to the role's home page
        setTimeout(() => navigate(home), 1000);
      } catch (error) {
        setAlert({ tone: "red", message: error.message || "Login failed. Please try again." });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const errorFor = (name) => (formik.touched[name] && formik.errors[name]) || undefined;

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <i className="bi bi-mortarboard-fill" />
          </div>
          <div>
            <h1 className={styles.title}>National School Management System</h1>
            <div className={styles.sub}>Sign in to continue</div>
          </div>
        </div>

        <form className={styles.form} onSubmit={formik.handleSubmit} noValidate>
          <Field label="Email address" error={errorFor("email")}>
            <Input
              type="email"
              name="email"
              autoComplete="username"
              placeholder="you@example.com"
              className={errorFor("email") ? "ui-invalid" : ""}
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
          </Field>

          <Field label="Password" error={errorFor("password")}>
            <Input
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Your password"
              className={errorFor("password") ? "ui-invalid" : ""}
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
          </Field>

          {alert && <Notice tone={alert.tone}>{alert.message}</Notice>}

          <Button type="submit" icon="bi-box-arrow-in-right" className={styles.submit} disabled={formik.isSubmitting}>
            {formik.isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className={styles.footer}>© {new Date().getFullYear()} National School Management System</div>
      </div>
    </div>
  );
}

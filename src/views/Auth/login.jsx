import React, { useState } from "react";
import * as Yup from "yup";
import { useFormik } from "formik";
import AuthService from "../Admin/services/auth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [alert, setAlert] = useState(null);
  const navigate = useNavigate();

  const validateSchema = Yup.object({
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
    password: Yup.string()
      .min(6, "Minimum 6 characters")
      .required("Password is required"),
  });

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: validateSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true);
      setAlert(null);

      try {
        await AuthService.login(values.email, values.password);
        setAlert({
          type: "success",
          message: "Login successful! Redirecting...",
        });
        setTimeout(() => {
          navigate("/admin/dashboard");
        }, 1000);
      } catch (error) {
        setAlert({
          type: "danger",
          message: error.message || "Login failed. Please try again.",
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div
      className="d-flex align-items-center justify-content-center vh-100 bg-light"
      style={{ minHeight: "100vh" }}
    >
      <div
        className="card shadow-lg p-4 border-0"
        style={{
          width: "100%",
          maxWidth: "400px",
          borderRadius: "12px",
        }}
      >
        <div className="text-center mb-3">
          <div
            className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center"
            style={{ width: "70px", height: "70px" }}
          >
            <i className="bi bi-person-fill fs-1"></i>
          </div>
        </div>

        <h3 className="text-center mb-4 text-primary fw-bold">Login</h3>
        <p className="text-center text-muted">
          Open Day Secondary School Management
        </p>

        {alert && (
          <div
            className={`alert alert-${alert.type} text-center py-2`}
            role="alert"
          >
            {alert.message}
          </div>
        )}

        <form onSubmit={formik.handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label fw-semibold">
              Email Address
            </label>
            <input
              className={`form-control ${
                formik.touched.email && formik.errors.email ? "is-invalid" : ""
              }`}
              id="email"
              type="email"
              name="email"
              placeholder="example@email.com"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.email && formik.errors.email ? (
              <div className="invalid-feedback">{formik.errors.email}</div>
            ) : null}
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label fw-semibold">
              Password
            </label>
            <input
              className={`form-control ${
                formik.touched.password && formik.errors.password
                  ? "is-invalid"
                  : ""
              }`}
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.password && formik.errors.password ? (
              <div className="invalid-feedback">{formik.errors.password}</div>
            ) : null}
          </div>

          <button
            id="loginButton"
            type="submit"
            className="btn btn-primary w-100 mt-3 fw-semibold"
            disabled={formik.isSubmitting}
          >
            {formik.isSubmitting ? "Logging in..." : "Log In"}
          </button>
        </form>
      </div>
    </div>
  );
}

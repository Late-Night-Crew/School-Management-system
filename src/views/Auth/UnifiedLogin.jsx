import React, { useState } from "react";
import * as Yup from "yup";
import { useFormik } from "formik";
import AuthService from "../Admin/services/auth";
import { useNavigate } from "react-router-dom";
import { USER_ROLE_KEY } from "../constants/storageKeys";
import "../../App.css";

export default function UnifiedLogin() {
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
    initialValues: { email: "", password: "" },
    validationSchema: validateSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true);
      setAlert(null);

      try {
        const response = await AuthService.login(values.email, values.password);
        const role = response.role?.toLowerCase();

        setAlert({
          type: "success",
          message: "Login successful! Redirecting...",
        });

        // Redirect based on role
        setTimeout(() => {
          if (role === "super_admin" || role === "superadmin") {
            navigate("/dashboard");
          } else if (role === "region_admin" || role === "regional_admin") {
            navigate("/dashboard");
          } else if (role === "school_manager" || role === "school_admin") {
            navigate("/dashboard");
          } else {
            navigate("/dashboard");
          }
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
    <div className="harbor-container">
      <div className="harbor-login-card">
        <h2 className="harbor-title">National School Management System</h2>

        <form onSubmit={formik.handleSubmit}>
          <div className="mb-3">
            <input
              type="text"
              name="email"
              placeholder="Email Address"
              className={`form-control harbor-input ${
                formik.touched.email && formik.errors.email ? "is-invalid" : ""
              }`}
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.email && formik.errors.email && (
              <div className="invalid-feedback d-block">{formik.errors.email}</div>
            )}
          </div>

          <div className="mb-3 position-relative">
            <input
              type="password"
              name="password"
              placeholder="Password"
              className={`form-control harbor-input ${
                formik.touched.password && formik.errors.password
                  ? "is-invalid"
                  : ""
              }`}
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.password && formik.errors.password && (
              <div className="invalid-feedback d-block">{formik.errors.password}</div>
            )}
          </div>

          {alert && (
            <div
              className={`alert alert-${alert.type} text-center py-2`}
              role="alert"
            >
              {alert.message}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-100 harbor-btn"
            disabled={formik.isSubmitting}
          >
            {formik.isSubmitting ? "Logging in..." : "LOG IN"}
          </button>
        </form>

        <p className="harbor-footer mt-3">© 2025 National School Management System</p>
      </div>
    </div>
  );
}

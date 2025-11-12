import React, { useState } from "react";
import * as Yup from "yup";
import { useFormik } from "formik";
import AuthService from "../Admin/services/auth";
import { useNavigate } from "react-router-dom";
import '../../App.css'

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
    initialValues: { email: "", password: "" },
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
        setTimeout(() => navigate("/dashboard"), 1000);
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
        <h2 className="harbor-title">National School Manegement System</h2>

        <form onSubmit={formik.handleSubmit}>
          <div className="mb-3">
            <input
              type="text"
              name="email"
              placeholder="Username"
              className={`form-control harbor-input ${
                formik.touched.email && formik.errors.email ? "is-invalid" : ""
              }`}
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
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
          </div>

          {/* <div className="form-check mb-3">
            <input type="checkbox" id="remember" className="form-check-input" />
            <label htmlFor="remember" className="form-check-label text-light">
              Remember me
            </label>
          </div> */}

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

        <p className="harbor-footer mt-3">More info...</p>
      </div>
    </div>
  );
}

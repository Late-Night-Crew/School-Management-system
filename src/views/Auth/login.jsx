import React, { useState } from "react";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

export default function Login() {
  const [userAlert, setUserAlert] = useState(null);
  const [adminAlert, setAdminAlert] = useState(null);
  const [clickCount, setClickCount] = useState(0);
  const [showSuperAdmin, setShowSuperAdmin] = useState(false);
  const navigate = useNavigate();

  const validateSchema = Yup.object({
    email: Yup.string().email("Invalid email format").required("Email is required"),
    password: Yup.string().min(6, "Minimum 6 characters").required("Password is required"),
  });

  const superAdminSchema = Yup.object({
    password: Yup.string().required("Password is required"),
  });

  // Normal User Login
  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: validateSchema,
    onSubmit: (values, { setSubmitting }) => {
      setSubmitting(true);
      setTimeout(() => {
        const { email } = values;
        let route = null;
        let message = null;

        // Role checking
        if (email.includes("division")) {
          route = "/admin/dashboard";
          message = "Welcome Division Admin!";
        } else if (email.includes("headteacher")) {
          route = "/admin/dashboard";
          message = "Welcome Headteacher!";
        } else {
          setUserAlert({ type: "danger", message: "Invalid credentials or role." });
          setSubmitting(false);
          return;
        }

        setUserAlert({ type: "success", message });
        setTimeout(() => {
          navigate(route); // redirect to correct role dashboard
        }, 1000);
      }, 800);
    },
  });

  //  Super Admin Login
  const superFormik = useFormik({
    initialValues: { password: "" },
    validationSchema: superAdminSchema,
    onSubmit: (values, { setSubmitting }) => {
      setSubmitting(true);
      setTimeout(() => {
        if (values.password === "admin123") {
          setAdminAlert({ type: "success", message: "Super Admin logged in successfully!" });
          setTimeout(() => {
            setShowSuperAdmin(false);
            navigate("admin/dashboard");
          }, 1000);
        } else {
          setAdminAlert({ type: "danger", message: "Invalid Super Admin password." });
        }
        setSubmitting(false);
      }, 800);
    },
  });

  // 🔹 Unlock Super Admin modal
  const handleIconClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount === 7) {
      setShowSuperAdmin(true);
      setClickCount(0);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center vh-100 bg-light"
      style={{ minHeight: "100vh" }}
    >
      <div className="card shadow-lg p-4 border-0" style={{ width: "100%", maxWidth: "400px", borderRadius: "12px" }}>
        <div className="text-center mb-3">
          <div
            onClick={handleIconClick}
            className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center"
            style={{ width: "70px", height: "70px", cursor: "pointer" }}
          >
            <i className="bi bi-person-fill fs-1"></i>
          </div>
        </div>

        <h3 className="text-center mb-2 text-primary fw-bold">Login</h3>
        <p className="text-center text-muted mb-3">Open Day Secondary School Management</p>

        {/* Normal login alerts */}
        {userAlert && (
          <div className={`alert alert-${userAlert.type} text-center py-2`} role="alert">
            {userAlert.message}
          </div>
        )}

        {/* Normal Login Form */}
        <form onSubmit={formik.handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label fw-semibold">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="example@email.com"
              className={`form-control ${formik.touched.email && formik.errors.email ? "is-invalid" : ""}`}
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.email && formik.errors.email && (
              <div className="invalid-feedback">{formik.errors.email}</div>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label fw-semibold">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              className={`form-control ${formik.touched.password && formik.errors.password ? "is-invalid" : ""}`}
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.password && formik.errors.password && (
              <div className="invalid-feedback">{formik.errors.password}</div>
            )}
          </div>

          <button type="submit" className="btn btn-primary w-100 mt-3 fw-semibold" disabled={formik.isSubmitting}>
            {formik.isSubmitting ? "Logging in..." : "Log In"}
          </button>
        </form>
      </div>

      {/* 🔹 Super Admin Modal */}
      {showSuperAdmin && (
        <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 rounded-4 overflow-hidden">
              <div className="row g-0">
                {/* Left side */}
                <div
                  className="col-md-6 d-flex align-items-center justify-content-center text-white"
                  style={{
                    background: "linear-gradient(135deg, #0d6efd, #007bff)",
                    minHeight: "100%",
                    padding: "50px",
                  }}
                >
                  <div className="text-center">
                    <i className="bi bi-shield-lock-fill display-1 mb-3"></i>
                    <h4 className="fw-bold">Super Admin Access</h4>
                    <p className="small">Restricted login area</p>
                  </div>
                </div>

                {/* Right side */}
                <div className="col-md-6 bg-white p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold text-primary mb-0">Admin Login</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => {
                        setShowSuperAdmin(false);
                        setAdminAlert(null);
                      }}
                    ></button>
                  </div>

                  {/* Super Admin alerts */}
                  {adminAlert && (
                    <div className={`alert alert-${adminAlert.type} text-center py-2`} role="alert">
                      {adminAlert.message}
                    </div>
                  )}

                  <form onSubmit={superFormik.handleSubmit}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Password</label>
                      <input
                        type="password"
                        name="password"
                        className={`form-control ${
                          superFormik.touched.password && superFormik.errors.password
                            ? "is-invalid"
                            : ""
                        }`}
                        value={superFormik.values.password}
                        onChange={superFormik.handleChange}
                        onBlur={superFormik.handleBlur}
                        placeholder="Enter admin password"
                      />
                      {superFormik.touched.password && superFormik.errors.password && (
                        <div className="invalid-feedback">{superFormik.errors.password}</div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary w-100 fw-semibold mt-3"
                      disabled={superFormik.isSubmitting}
                    >
                      {superFormik.isSubmitting ? "Verifying..." : "Login as Super Admin"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

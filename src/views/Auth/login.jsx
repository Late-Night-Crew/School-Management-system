import React from "react";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";


export default function Login() {

    const validateSchema = Yup.object({
        email: Yup.string().email("Invalid email format").required("Required"),
        password: Yup.string().min(6, "Minimum 6 characters").required("Required")
    })
    const navigate = useNavigate();

    const formik = useFormik({
        initialValues: {
            email: "chima@gmail.com",
            password: "chima123"
        },
        validationSchema: validateSchema,
        onSubmit: async (values, { setSubmitting }) => {
            setSubmitting(true);
            navigate("/dashboard");
        }
    })

    return (
        <div className="container mt-5 col-lg-4 col-md-6 col-sm-8">
            <div className="card">
                <form onSubmit={formik.handleSubmit} className="">
                    <div className="form-group">
                        <input
                            className={`form-control sign-in ${formik.touched.email && formik.errors.email
                                    ? "is-invalid"
                                    : ""
                                }`}
                            id="email"
                            type="email"
                            name="email"
                            placeholder="Enter email address"
                            value={formik.values.email}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                        />
                        {formik.touched.email && formik.errors.email ? (
                            <div className="invalid-feedback-login mb-2 text-danger">
                                {formik.errors.email}
                            </div>
                        ) : null}
                    </div>
                    <div className="form-group mt-4">
                        <input
                            className={`form-control sign-in ${formik.touched.password && formik.errors.password
                                    ? "is-invalid"
                                    : ""
                                }`}
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Password"
                            value={formik.values.password}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                        />
                        {formik.touched.password && formik.errors.password ? (
                            <div className="invalid-feedback-login text-danger">
                                {formik.errors.password}
                            </div>
                        ) : null}
                    </div>

                    <div className="col-lg-8 col-md-5 mt-3 mx-auto border-1">
                        <button
                            id="loginButton"
                            type="submit"
                            className="btn btn-primary "
                            disabled={formik.isSubmitting}
                        >
                            Log In
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}   
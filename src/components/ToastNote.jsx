import React from "react";
import { Toast, ToastContainer } from "react-bootstrap";

export default function ToastNote({ show, onClose, message, variant = "success" }) {
    return (
        <ToastContainer position="bottom-center" className="p-3" style={{ zIndex: 9999 }}>
            <Toast 
                bg={variant} 
                show={show} 
                onClose={onClose} 
                delay={2500} 
                autohide
                className="rounded-3" 
            >
                <Toast.Body className="text-white">{message}</Toast.Body>
            </Toast>
        </ToastContainer>
    );
}
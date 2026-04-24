import React from "react";
import { Modal, Button } from "react-bootstrap";

export default function ConfirmModal({ show, onHide, onConfirm, title, body }) {
    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>{title || "Confirm Action"}</Modal.Title>
            </Modal.Header>
            <Modal.Body>{body || "Are you sure?"}</Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Cancel
                </Button>
                <Button variant="danger" onClick={onConfirm}>
                    Confirm
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

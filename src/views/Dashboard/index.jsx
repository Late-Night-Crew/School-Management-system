import React, { useState, useEffect } from "react";
import {
  Navbar,
  Nav,
  Container,
  Row,
  Col,
  Card,
  Button,
} from "react-bootstrap";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    setUser(savedUser);
  }, []);

  return (
    <div className="dashboard-wrapper">
      <Container fluid className="p-4">
        <Row>
          <Col md={4}>
            <Card className="stat-card">
              <Card.Body>
                <h6 className="text-muted">Users</h6>
                <h3>128</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="stat-card">
              <Card.Body>
                <h6 className="text-muted">Projects</h6>
                <h3>45</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="stat-card">
              <Card.Body>
                <h6 className="text-muted">Errors Logged</h6>
                <h3>3</h3>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mt-4">
          <Col md={8}>
            <Card className="content-card">
              <Card.Header>Activity Overview</Card.Header>
              <Card.Body>
                <div
                  className="chart-placeholder text-muted text-center py-5"
                  style={{ border: "1px dashed #444", borderRadius: "8px" }}
                >
                  [Chart Placeholder]
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="content-card">
              <Card.Header>Recent Actions</Card.Header>
              <Card.Body>
                <ul className="list-unstyled mb-0">
                  <li>✅ User “jmoyenda” logged in</li>
                  <li>📤 Image pushed to registry</li>
                  <li>⚙️ System updated</li>
                  <li>🚀 Deployment successful</li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

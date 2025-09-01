import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Row, Col, Spinner } from 'react-bootstrap';

const AcunetixBulkTargetModal = ({ show, handleClose, activeTarget }) => {
  const [targets, setTargets] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const targetList = targets
      .split('\n')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    if (targetList.length === 0) {
      setError('Please enter at least one target');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_SERVER_PROTOCOL}://${process.env.REACT_APP_SERVER_IP}:${process.env.REACT_APP_SERVER_PORT}/acunetix/bulk-target-scan`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            targets: targetList,
            description: description || `Bulk scan from BugBounty Dashboard - ${activeTarget?.scope_target || 'Unknown'}`,
            activeTarget: activeTarget
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create targets and start scans');
      }

      const data = await response.json();
      setResult(data);
      setTargets(''); // Clear form on success
      setDescription('');
    } catch (error) {
      console.error('Error creating bulk targets:', error);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setTargets('');
    setDescription('');
    setResult(null);
    setError('');
    setIsSubmitting(false);
    handleClose();
  };

  const targetCount = targets.split('\n').filter(t => t.trim().length > 0).length;

  return (
    <Modal show={show} onHide={handleCloseModal} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-rocket text-danger me-2"></i>
          Bulk Target Creation & Scan
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}

        {result && (
          <Alert variant="success">
            <h6 className="mb-2">
              <i className="fas fa-check-circle me-2"></i>
              Bulk Operation Completed
            </h6>
            <Row>
              <Col md={6}>
                <small>
                  <strong>Targets Created:</strong> {result.createdCount}<br/>
                  <strong>Scans Started:</strong> {result.scansStarted}<br/>
                  <strong>Failed:</strong> {result.failedCount}
                </small>
              </Col>
              <Col md={6}>
                <small>
                  <strong>Total Processing Time:</strong> {result.processingTime}<br/>
                  <strong>Success Rate:</strong> {result.successRate}%
                </small>
              </Col>
            </Row>
            {result.errors && result.errors.length > 0 && (
              <details className="mt-2">
                <summary className="text-warning">
                  <i className="fas fa-exclamation-triangle me-1"></i>
                  View Errors ({result.errors.length})
                </summary>
                <div className="mt-2 p-2 bg-light rounded" style={{fontSize: '0.8em'}}>
                  {result.errors.map((error, index) => (
                    <div key={index} className="text-danger">• {error}</div>
                  ))}
                </div>
              </details>
            )}
          </Alert>
        )}

        <Form>
          <Form.Group className="mb-3">
            <Form.Label>
              <i className="fas fa-list me-2"></i>
              Target Domains
              {targetCount > 0 && (
                <span className="badge bg-primary ms-2">{targetCount} targets</span>
              )}
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={10}
              value={targets}
              onChange={(e) => setTargets(e.target.value)}
              placeholder={`Enter one domain per line:

test.domain.com
test2.domain2.com
api.example.com
portal.company.com

Note: Each line will create a target in Acunetix and immediately start a scan.`}
              disabled={isSubmitting}
              style={{
                fontFamily: 'monospace',
                fontSize: '0.9em'
              }}
            />
            <Form.Text className="text-muted">
              <i className="fas fa-info-circle me-1"></i>
              One domain per line. Protocols (http/https) will be automatically removed.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              <i className="fas fa-comment me-2"></i>
              Description (Optional)
            </Form.Label>
            <Form.Control
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Custom description for all targets"
              disabled={isSubmitting}
            />
          </Form.Group>

          <div className="bg-light p-3 rounded">
            <h6 className="text-warning mb-2">
              <i className="fas fa-cog me-2"></i>
              What will happen:
            </h6>
            <ul className="mb-0" style={{fontSize: '0.9em'}}>
              <li>Each domain will be created as a target in Acunetix</li>
              <li>A Full Scan will be automatically started for each target</li>
              <li>Scans will enter the Acunetix queue immediately</li>
              <li>You can monitor progress in the Acunetix Dashboard</li>
            </ul>
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleCloseModal} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          variant="danger" 
          onClick={handleSubmit} 
          disabled={isSubmitting || targetCount === 0}
        >
          {isSubmitting ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Creating {targetCount} targets...
            </>
          ) : (
            <>
              <i className="fas fa-rocket me-2"></i>
              Create {targetCount} Targets & Start Scans
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AcunetixBulkTargetModal;


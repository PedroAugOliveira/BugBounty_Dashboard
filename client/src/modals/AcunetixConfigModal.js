import { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Row, Col, Card, Badge, InputGroup } from 'react-bootstrap';

const AcunetixConfigModal = ({ show, handleClose, onSaveConfig }) => {
  const [config, setConfig] = useState({
    apiUrl: 'https://127.0.0.1:3443/api/v1',
    apiKey: '',
    profileId: '11111111-1111-1111-1111-111111111111', // Default full scan profile
    enableGrouping: true,
    maxConcurrentScans: 3,
    retryAttempts: 3,
    requestTimeout: 30,
    maxScanDuration: 24, // hours
    enableWebhook: false,
    webhookUrl: '',
    scanPriority: 'normal'
  });
  
  const [testStatus, setTestStatus] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (show) {
      console.log('[ACUNETIX MODAL] Modal opened, loading saved config...');
      loadSavedConfig();
    } else {
      console.log('[ACUNETIX MODAL] Modal closed, resetting state...');
      // Reset state when modal is closed
      setTestStatus('');
      setValidationErrors({});
      setShowAdvanced(false);
    }
  }, [show]);

  const loadSavedConfig = async () => {
    console.log('[ACUNETIX MODAL] Loading saved config...');
    try {
      const response = await fetch(
        `${process.env.REACT_APP_SERVER_PROTOCOL}://${process.env.REACT_APP_SERVER_IP}:${process.env.REACT_APP_SERVER_PORT}/acunetix/config`
      );
      
      console.log('[ACUNETIX MODAL] Response status:', response.status);
      
      if (response.ok) {
        const savedConfig = await response.json();
        console.log('[ACUNETIX MODAL] Loaded config:', savedConfig);
        
        // Update config state with saved values
        setConfig(prev => ({
          ...prev,
          apiUrl: savedConfig.apiUrl || prev.apiUrl,
          apiKey: savedConfig.apiKey || prev.apiKey,
          profileId: savedConfig.profileId || prev.profileId,
          enableGrouping: savedConfig.enableGrouping !== undefined ? savedConfig.enableGrouping : prev.enableGrouping,
          maxConcurrentScans: savedConfig.maxConcurrentScans || prev.maxConcurrentScans,
          retryAttempts: savedConfig.retryAttempts || prev.retryAttempts,
          requestTimeout: savedConfig.requestTimeout || prev.requestTimeout,
          maxScanDuration: savedConfig.maxScanDuration || prev.maxScanDuration,
          enableWebhook: savedConfig.enableWebhook !== undefined ? savedConfig.enableWebhook : prev.enableWebhook,
          webhookUrl: savedConfig.webhookUrl || prev.webhookUrl,
          scanPriority: savedConfig.scanPriority || prev.scanPriority
        }));
        
        console.log('[ACUNETIX MODAL] Config state updated successfully');
      } else {
        const errorText = await response.text();
        console.error('[ACUNETIX MODAL] Failed to load config, status:', response.status, 'Error:', errorText);
      }
    } catch (error) {
      console.error('[ACUNETIX MODAL] Error loading Acunetix config:', error);
    }
  };

  const validateConfig = () => {
    const errors = {};
    
    if (!config.apiUrl) {
      errors.apiUrl = 'API URL is required';
    } else if (!isValidUrl(config.apiUrl)) {
      errors.apiUrl = 'Invalid URL format';
    }
    
    if (!config.apiKey) {
      errors.apiKey = 'API Key is required';
    } else if (config.apiKey.length < 10) {
      errors.apiKey = 'API Key seems too short';
    }
    
    if (!config.profileId) {
      errors.profileId = 'Profile ID is required';
    }
    
    if (config.maxConcurrentScans < 1 || config.maxConcurrentScans > 10) {
      errors.maxConcurrentScans = 'Must be between 1 and 10';
    }
    
    if (config.enableWebhook && !config.webhookUrl) {
      errors.webhookUrl = 'Webhook URL is required when webhooks are enabled';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const testConnection = async () => {
    if (!validateConfig()) {
      setTestStatus('error');
      return;
    }

    setIsTestingConnection(true);
    setTestStatus('testing');
    
    try {
      const response = await fetch(
        `${process.env.REACT_APP_SERVER_PROTOCOL}://${process.env.REACT_APP_SERVER_IP}:${process.env.REACT_APP_SERVER_PORT}/acunetix/test-connection`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            apiUrl: config.apiUrl,
            apiKey: config.apiKey
          })
        }
      );
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setTestStatus('success');
      } else {
        setTestStatus('error');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setTestStatus('error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSave = async () => {
    if (!validateConfig()) {
      return;
    }

    console.log('[ACUNETIX MODAL] Saving config:', config);
    
    try {
      const response = await fetch(
        `${process.env.REACT_APP_SERVER_PROTOCOL}://${process.env.REACT_APP_SERVER_IP}:${process.env.REACT_APP_SERVER_PORT}/acunetix/config`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(config)
        }
      );
      
      console.log('[ACUNETIX MODAL] Save response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('[ACUNETIX MODAL] Save successful:', result);
        onSaveConfig && onSaveConfig(config);
        handleClose();
      } else {
        const errorResult = await response.json();
        console.error('[ACUNETIX MODAL] Save failed:', errorResult);
        setTestStatus('error');
      }
    } catch (error) {
      console.error('[ACUNETIX MODAL] Error saving config:', error);
      setTestStatus('error');
    }
  };

  const getTestStatusBadge = () => {
    switch (testStatus) {
      case 'testing':
        return <Badge bg="warning">Testing...</Badge>;
      case 'success':
        return <Badge bg="success">Connected</Badge>;
      case 'error':
        return <Badge bg="danger">Connection Failed</Badge>;
      default:
        return <Badge bg="secondary">Not Tested</Badge>;
    }
  };

  return (
    <Modal data-bs-theme="dark" show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="text-danger">
          <i className="bi bi-shield-check me-2"></i>
          Acunetix API Configuration
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="info" className="mb-4">
          <Alert.Heading>Acunetix Integration</Alert.Heading>
          Configure your Acunetix instance to automatically import discovered live web servers as scan targets. 
          This enables comprehensive DAST scanning of your wildcard attack surface.
        </Alert>

        <Form>
          {/* Basic Configuration */}
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0 text-danger">Basic Configuration</h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>API URL</Form.Label>
                    <Form.Control
                      type="url"
                      value={config.apiUrl}
                      onChange={(e) => setConfig({...config, apiUrl: e.target.value})}
                      placeholder="https://127.0.0.1:3443/api/v1"
                      isInvalid={!!validationErrors.apiUrl}
                    />
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.apiUrl}
                    </Form.Control.Feedback>
                    <Form.Text className="text-muted">
                      Your Acunetix API base URL (change IP if running remotely)
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Connection Status</Form.Label>
                    <div className="d-flex align-items-center">
                      {getTestStatusBadge()}
                    </div>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>API Key</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="password"
                    value={config.apiKey}
                    onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                    placeholder="Enter your Acunetix API key"
                    isInvalid={!!validationErrors.apiKey}
                  />
                  <Button 
                    variant="outline-danger" 
                    onClick={testConnection}
                    disabled={isTestingConnection || !config.apiUrl || !config.apiKey}
                  >
                    {isTestingConnection ? 'Testing...' : 'Test Connection'}
                  </Button>
                </InputGroup>
                <Form.Control.Feedback type="invalid">
                  {validationErrors.apiKey}
                </Form.Control.Feedback>
                <Form.Text className="text-muted">
                  Generate API key in Acunetix → Settings → API
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Scan Profile ID</Form.Label>
                <Form.Select
                  value={config.profileId}
                  onChange={(e) => setConfig({...config, profileId: e.target.value})}
                  isInvalid={!!validationErrors.profileId}
                >
                  <option value="11111111-1111-1111-1111-111111111111">Full Scan</option>
                  <option value="11111111-1111-1111-1111-111111111112">High Risk Vulnerabilities</option>
                  <option value="11111111-1111-1111-1111-111111111116">Cross-site Scripting Vulnerabilities</option>
                  <option value="11111111-1111-1111-1111-111111111113">SQL Injection Vulnerabilities</option>
                  <option value="11111111-1111-1111-1111-111111111115">Weak Passwords</option>
                  <option value="11111111-1111-1111-1111-111111111117">Crawl Only</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {validationErrors.profileId}
                </Form.Control.Feedback>
                <Form.Text className="text-muted">
                  Default scan profile for imported targets
                </Form.Text>
              </Form.Group>
            </Card.Body>
          </Card>

          {/* Advanced Configuration */}
          <Card className="mb-4">
            <Card.Header 
              className="d-flex justify-content-between align-items-center"
              style={{ cursor: 'pointer' }}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <h6 className="mb-0 text-danger">Advanced Configuration</h6>
              <i className={`bi bi-chevron-${showAdvanced ? 'up' : 'down'}`}></i>
            </Card.Header>
            {showAdvanced && (
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Max Concurrent Scans</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        max="10"
                        value={config.maxConcurrentScans}
                        onChange={(e) => setConfig({...config, maxConcurrentScans: parseInt(e.target.value)})}
                        isInvalid={!!validationErrors.maxConcurrentScans}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.maxConcurrentScans}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Retry Attempts</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        max="5"
                        value={config.retryAttempts}
                        onChange={(e) => setConfig({...config, retryAttempts: parseInt(e.target.value)})}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Request Timeout (seconds)</Form.Label>
                      <Form.Control
                        type="number"
                        min="10"
                        max="120"
                        value={config.requestTimeout}
                        onChange={(e) => setConfig({...config, requestTimeout: parseInt(e.target.value)})}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Max Scan Duration (hours)</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        max="48"
                        value={config.maxScanDuration}
                        onChange={(e) => setConfig({...config, maxScanDuration: parseInt(e.target.value)})}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Scan Priority</Form.Label>
                  <Form.Select
                    value={config.scanPriority}
                    onChange={(e) => setConfig({...config, scanPriority: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </Form.Select>
                </Form.Group>

                <Form.Check
                  type="checkbox"
                  label="Enable Target Grouping"
                  checked={config.enableGrouping}
                  onChange={(e) => setConfig({...config, enableGrouping: e.target.checked})}
                  className="mb-3"
                />

                <Form.Check
                  type="checkbox"
                  label="Enable Webhook Notifications"
                  checked={config.enableWebhook}
                  onChange={(e) => setConfig({...config, enableWebhook: e.target.checked})}
                  className="mb-3"
                />

                {config.enableWebhook && (
                  <Form.Group className="mb-3">
                    <Form.Label>Webhook URL</Form.Label>
                    <Form.Control
                      type="url"
                      value={config.webhookUrl}
                      onChange={(e) => setConfig({...config, webhookUrl: e.target.value})}
                      placeholder="https://your-webhook-url.com/notifications"
                      isInvalid={!!validationErrors.webhookUrl}
                    />
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.webhookUrl}
                    </Form.Control.Feedback>
                  </Form.Group>
                )}
              </Card.Body>
            )}
          </Card>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button 
          variant="danger" 
          onClick={handleSave}
          disabled={isTestingConnection || testStatus !== 'success'}
        >
          Save Configuration
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AcunetixConfigModal;

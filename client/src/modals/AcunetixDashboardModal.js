import { useState, useEffect } from 'react';
import { Modal, Table, Button, Alert, Row, Col, Card, Badge, Spinner, ProgressBar, Nav } from 'react-bootstrap';

const AcunetixDashboardModal = ({ show, handleClose, activeTarget }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    overview: {},
    targets: [],
    scans: [],
    vulnerabilities: [],
    reports: []
  });

  useEffect(() => {
    if (show) {
      loadDashboardData();
    }
  }, [show]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_SERVER_PROTOCOL}://${process.env.REACT_APP_SERVER_IP}:${process.env.REACT_APP_SERVER_PORT}/acunetix/dashboard`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ activeTarget: activeTarget })
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        // Ensure all arrays exist with fallbacks
        setDashboardData({
          overview: data.overview || {},
          targets: data.targets || [],
          scans: data.scans || [],
          vulnerabilities: data.vulnerabilities || [],
          reports: data.reports || []
        });
      } else {
        // Reset to default state on error
        setDashboardData({
          overview: {},
          targets: [],
          scans: [],
          vulnerabilities: [],
          reports: []
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Reset to default state on error
      setDashboardData({
        overview: {},
        targets: [],
        scans: [],
        vulnerabilities: [],
        reports: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getScanStatusBadge = (status) => {
    const statusMap = {
      'queued': { bg: 'secondary', icon: 'hourglass' },
      'starting': { bg: 'info', icon: 'play-circle' },
      'processing': { bg: 'primary', icon: 'gear' },
      'completed': { bg: 'success', icon: 'check-circle' },
      'failed': { bg: 'danger', icon: 'x-circle' },
      'stopped': { bg: 'warning', icon: 'stop-circle' },
      'aborted': { bg: 'dark', icon: 'x-octagon' }
    };
    
    const statusInfo = statusMap[status?.toLowerCase()] || statusMap['queued'];
    
    return (
      <Badge bg={statusInfo.bg} className="d-flex align-items-center gap-1">
        <i className={`bi bi-${statusInfo.icon}`}></i>
        {status}
      </Badge>
    );
  };

  const getVulnerabilitySeverityBadge = (severity) => {
    const severityMap = {
      'critical': { bg: 'danger', text: 'Critical' },
      'high': { bg: 'warning', text: 'High' },
      'medium': { bg: 'info', text: 'Medium' },
      'low': { bg: 'secondary', text: 'Low' },
      'info': { bg: 'light', text: 'Info' }
    };
    
    const severityInfo = severityMap[severity?.toLowerCase()] || severityMap['info'];
    
    return <Badge bg={severityInfo.bg}>{severityInfo.text}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const renderOverview = () => (
    <Row>
      <Col md={3}>
        <Card className="text-center mb-3">
          <Card.Body>
            <h2 className="text-danger">{dashboardData.overview.totalTargets || 0}</h2>
            <p className="mb-0">Total Targets</p>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="text-center mb-3">
          <Card.Body>
            <h2 className="text-primary">{dashboardData.overview.activeScans || 0}</h2>
            <p className="mb-0">Active Scans</p>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="text-center mb-3">
          <Card.Body>
            <h2 className="text-warning">{dashboardData.overview.totalVulnerabilities || 0}</h2>
            <p className="mb-0">Vulnerabilities</p>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="text-center mb-3">
          <Card.Body>
            <h2 className="text-success">{dashboardData.overview.completedScans || 0}</h2>
            <p className="mb-0">Completed Scans</p>
          </Card.Body>
        </Card>
      </Col>
      
      {/* Severity Breakdown */}
      <Col md={12}>
        <Card className="mb-3">
          <Card.Header>
            <h6 className="mb-0 text-danger">Vulnerability Severity Breakdown</h6>
          </Card.Header>
          <Card.Body>
            <Row className="text-center">
              <Col>
                <h4 className="text-danger">{dashboardData.overview.criticalVulns || 0}</h4>
                <small>Critical</small>
              </Col>
              <Col>
                <h4 className="text-warning">{dashboardData.overview.highVulns || 0}</h4>
                <small>High</small>
              </Col>
              <Col>
                <h4 className="text-info">{dashboardData.overview.mediumVulns || 0}</h4>
                <small>Medium</small>
              </Col>
              <Col>
                <h4 className="text-secondary">{dashboardData.overview.lowVulns || 0}</h4>
                <small>Low</small>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );

  const renderTargets = () => (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>Target</th>
          <th>Description</th>
          <th>Last Scan</th>
          <th>Vulnerabilities</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {dashboardData.targets?.map(target => (
          <tr key={target.target_id}>
            <td>
              <div className="d-flex align-items-center">
                <i className="bi bi-globe me-2"></i>
                <span>{target.address}</span>
              </div>
            </td>
            <td>{target.description || 'No description'}</td>
            <td>{formatDate(target.last_scan_date)}</td>
            <td>
              <div className="d-flex gap-1">
                <Badge bg="danger">{target.critical || 0}</Badge>
                <Badge bg="warning">{target.high || 0}</Badge>
                <Badge bg="info">{target.medium || 0}</Badge>
                <Badge bg="secondary">{target.low || 0}</Badge>
              </div>
            </td>
            <td>
              <Button size="sm" variant="outline-primary" className="me-1">
                View
              </Button>
              <Button size="sm" variant="outline-danger">
                Scan
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );

  const renderScans = () => (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>Target</th>
          <th>Status</th>
          <th>Progress</th>
          <th>Start Time</th>
          <th>Duration</th>
          <th>Vulnerabilities</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {dashboardData.scans?.map(scan => (
          <tr key={scan.scan_id}>
            <td>{scan.target_address}</td>
            <td>{getScanStatusBadge(scan.current_status)}</td>
            <td>
              {scan.current_status === 'processing' ? (
                <ProgressBar now={scan.progress || 0} label={`${scan.progress || 0}%`} />
              ) : (
                <span>{scan.progress || 0}%</span>
              )}
            </td>
            <td>{formatDate(scan.start_date)}</td>
            <td>{scan.duration || 'N/A'}</td>
            <td>
              <Badge bg="warning">{scan.vulnerability_count || 0}</Badge>
            </td>
            <td>
              <Button size="sm" variant="outline-primary" className="me-1">
                View
              </Button>
              {scan.current_status === 'processing' && (
                <Button size="sm" variant="outline-danger">
                  Stop
                </Button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );

  const renderVulnerabilities = () => (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>Vulnerability</th>
          <th>Target</th>
          <th>Severity</th>
          <th>Status</th>
          <th>Found Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {dashboardData.vulnerabilities?.map(vuln => (
          <tr key={vuln.vuln_id}>
            <td>
              <div>
                <strong>{vuln.vuln_name}</strong>
                <br />
                <small className="text-muted">{vuln.affects}</small>
              </div>
            </td>
            <td>{vuln.target_address}</td>
            <td>{getVulnerabilitySeverityBadge(vuln.severity)}</td>
            <td>
              <Badge bg={vuln.status === 'Open' ? 'danger' : 'success'}>
                {vuln.status}
              </Badge>
            </td>
            <td>{formatDate(vuln.last_seen)}</td>
            <td>
              <Button size="sm" variant="outline-primary">
                Details
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );

  const renderReports = () => (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>Report Name</th>
          <th>Template</th>
          <th>Generated</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {dashboardData.reports?.map(report => (
          <tr key={report.report_id}>
            <td>{report.template_name}</td>
            <td>{report.template_type}</td>
            <td>{formatDate(report.generation_date)}</td>
            <td>
              <Badge bg={report.status === 'Completed' ? 'success' : 'warning'}>
                {report.status}
              </Badge>
            </td>
            <td>
              <Button size="sm" variant="outline-primary" className="me-1">
                Download
              </Button>
              <Button size="sm" variant="outline-secondary">
                View
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );

  return (
    <Modal data-bs-theme="dark" show={show} onHide={handleClose} size="xl" className="modal-90w">
      <Modal.Header closeButton>
        <Modal.Title className="text-danger">
          <i className="bi bi-speedometer2 me-2"></i>
          Acunetix Dashboard
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        <Alert variant="info" className="mb-4">
          <Alert.Heading>Acunetix Management Dashboard</Alert.Heading>
          Monitor and manage your Acunetix scans, targets, and vulnerabilities from this centralized dashboard. 
          Track progress and view results of all imported wildcard targets.
        </Alert>

        {/* Navigation Tabs */}
        <Nav variant="pills" className="mb-4">
          <Nav.Item>
            <Nav.Link 
              active={activeTab === 'overview'} 
              onClick={() => setActiveTab('overview')}
              className={activeTab === 'overview' ? 'bg-danger' : ''}
            >
              <i className="bi bi-speedometer2 me-2"></i>
              Overview
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              active={activeTab === 'targets'} 
              onClick={() => setActiveTab('targets')}
              className={activeTab === 'targets' ? 'bg-danger' : ''}
            >
              <i className="bi bi-bullseye me-2"></i>
              Targets ({dashboardData.targets?.length || 0})
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              active={activeTab === 'scans'} 
              onClick={() => setActiveTab('scans')}
              className={activeTab === 'scans' ? 'bg-danger' : ''}
            >
              <i className="bi bi-search me-2"></i>
              Scans ({dashboardData.scans?.length || 0})
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              active={activeTab === 'vulnerabilities'} 
              onClick={() => setActiveTab('vulnerabilities')}
              className={activeTab === 'vulnerabilities' ? 'bg-danger' : ''}
            >
              <i className="bi bi-shield-exclamation me-2"></i>
              Vulnerabilities ({dashboardData.vulnerabilities?.length || 0})
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              active={activeTab === 'reports'} 
              onClick={() => setActiveTab('reports')}
              className={activeTab === 'reports' ? 'bg-danger' : ''}
            >
              <i className="bi bi-file-earmark-text me-2"></i>
              Reports ({dashboardData.reports?.length || 0})
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-5">
            <Spinner animation="border" variant="danger" />
            <p className="mt-3">Loading dashboard data...</p>
          </div>
        )}

        {/* Tab Content */}
        {!isLoading && (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'targets' && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Scan Targets</h5>
                  <Button variant="outline-danger" size="sm" onClick={loadDashboardData}>
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Refresh
                  </Button>
                </div>
                {dashboardData.targets?.length > 0 ? renderTargets() : (
                  <Alert variant="info" className="text-center">
                    <i className="bi bi-info-circle me-2"></i>
                    No targets found. Import targets from your wildcard scans.
                  </Alert>
                )}
              </div>
            )}
            {activeTab === 'scans' && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Recent Scans</h5>
                  <Button variant="outline-danger" size="sm" onClick={loadDashboardData}>
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Refresh
                  </Button>
                </div>
                {dashboardData.scans?.length > 0 ? renderScans() : (
                  <Alert variant="info" className="text-center">
                    <i className="bi bi-info-circle me-2"></i>
                    No scans found. Start scanning your imported targets.
                  </Alert>
                )}
              </div>
            )}
            {activeTab === 'vulnerabilities' && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Discovered Vulnerabilities</h5>
                  <Button variant="outline-danger" size="sm" onClick={loadDashboardData}>
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Refresh
                  </Button>
                </div>
                {dashboardData.vulnerabilities?.length > 0 ? renderVulnerabilities() : (
                  <Alert variant="success" className="text-center">
                    <i className="bi bi-shield-check me-2"></i>
                    No vulnerabilities found. Keep up the good security!
                  </Alert>
                )}
              </div>
            )}
            {activeTab === 'reports' && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Generated Reports</h5>
                  <div>
                    <Button variant="outline-success" size="sm" className="me-2">
                      <i className="bi bi-plus me-1"></i>
                      Generate Report
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={loadDashboardData}>
                      <i className="bi bi-arrow-clockwise me-1"></i>
                      Refresh
                    </Button>
                  </div>
                </div>
                {dashboardData.reports?.length > 0 ? renderReports() : (
                  <Alert variant="info" className="text-center">
                    <i className="bi bi-info-circle me-2"></i>
                    No reports generated yet. Create reports from your scan results.
                  </Alert>
                )}
              </div>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
        <Button variant="outline-danger" onClick={loadDashboardData} disabled={isLoading}>
          <i className="bi bi-arrow-clockwise me-1"></i>
          Refresh All
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AcunetixDashboardModal;

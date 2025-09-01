import { useState, useEffect } from 'react';
import { Modal, Table, Button, Form, Alert, Row, Col, Badge, InputGroup, Spinner, ProgressBar } from 'react-bootstrap';

const AcunetixTargetSelectorModal = ({ show, handleClose, activeTarget, httpxResults, onImportTargets }) => {
  const [targets, setTargets] = useState([]);
  const [selectedTargets, setSelectedTargets] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('url');
  const [sortOrder, setSortOrder] = useState('asc');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState('');

  useEffect(() => {
    if (show) {
      parseHttpxResults();
    }
  }, [show, httpxResults, activeTarget]);

  const parseHttpxResults = async () => {
    if (!activeTarget?.id) {
      setTargets([]);
      return;
    }
    
    try {
      // First try to parse from the result field for backward compatibility
      if (httpxResults?.result) {
        const lines = httpxResults.result.split('\n').filter(line => line.trim());
        const parsedTargets = lines.map((line, index) => {
          try {
            const data = JSON.parse(line);
            return {
              id: index,
              url: data.url || '',
              host: data.host || '',
              port: data.port || 80,
              status_code: data.status_code || 0,
              content_length: data.content_length || 0,
              title: data.title || '',
              tech: data.tech || [],
              server: data.server || '',
              scheme: data.scheme || 'http',
              webserver: data.webserver || '',
              cdn: data.cdn || false,
              selected: false
            };
          } catch (e) {
            console.error('Error parsing line:', line, e);
            return null;
          }
        }).filter(target => target !== null);

        if (parsedTargets.length > 0) {
          setTargets(parsedTargets);
          return;
        }
      }

      // If no result field or empty, try to fetch from attack surface
      console.log('[ACUNETIX TARGET SELECTOR] Fetching live web servers from attack surface for target:', activeTarget.id);
      const response = await fetch(
        `${process.env.REACT_APP_SERVER_PROTOCOL}://${process.env.REACT_APP_SERVER_IP}:${process.env.REACT_APP_SERVER_PORT}/attack-surface-assets/${activeTarget.id}`
      );

      console.log('[ACUNETIX TARGET SELECTOR] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[ACUNETIX TARGET SELECTOR] Attack surface data:', data);
        
        const liveWebServers = (data.assets || []).filter(asset => asset.asset_type === 'live_web_server');
        console.log('[ACUNETIX TARGET SELECTOR] Live web servers found:', liveWebServers.length);
        
        const targets = liveWebServers.map((asset, index) => ({
          id: asset.id || index,
          url: asset.url || asset.asset_identifier,
          host: asset.domain || new URL(asset.url || asset.asset_identifier).hostname,
          port: asset.port || 80,
          status_code: asset.status_code || 200,
          content_length: asset.content_length || 0,
          title: asset.title || '',
          tech: asset.technologies || [],
          server: asset.web_server || '',
          scheme: asset.protocol || 'https',
          webserver: asset.web_server || '',
          cdn: false,
          selected: false
        }));

        console.log('[ACUNETIX TARGET SELECTOR] Processed targets:', targets.length);
        setTargets(targets);
      } else {
        console.warn('[ACUNETIX TARGET SELECTOR] Failed to fetch attack surface assets, using empty list');
        setTargets([]);
      }
    } catch (error) {
      console.error('Error loading targets:', error);
      setTargets([]);
    }
  };

  const filteredTargets = targets.filter(target => {
    const matchesFilter = !filter || 
      target.url.toLowerCase().includes(filter.toLowerCase()) ||
      target.title.toLowerCase().includes(filter.toLowerCase()) ||
      target.server.toLowerCase().includes(filter.toLowerCase());

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'success' && target.status_code >= 200 && target.status_code < 400) ||
      (statusFilter === 'redirect' && target.status_code >= 300 && target.status_code < 400) ||
      (statusFilter === 'error' && target.status_code >= 400);

    return matchesFilter && matchesStatus;
  }).sort((a, b) => {
    const aVal = a[sortBy] || '';
    const bVal = b[sortBy] || '';
    
    if (sortOrder === 'asc') {
      return aVal.toString().localeCompare(bVal.toString());
    } else {
      return bVal.toString().localeCompare(aVal.toString());
    }
  });

  const handleSelectTarget = (targetId) => {
    const newSelected = new Set(selectedTargets);
    if (newSelected.has(targetId)) {
      newSelected.delete(targetId);
    } else {
      newSelected.add(targetId);
    }
    setSelectedTargets(newSelected);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedTargets(new Set());
    } else {
      setSelectedTargets(new Set(filteredTargets.map(t => t.id)));
    }
    setSelectAll(!selectAll);
  };

  const handleQuickSelect = (type) => {
    let newSelected = new Set();
    
    switch (type) {
      case 'success':
        newSelected = new Set(filteredTargets.filter(t => t.status_code >= 200 && t.status_code < 300).map(t => t.id));
        break;
      case 'https':
        newSelected = new Set(filteredTargets.filter(t => t.scheme === 'https').map(t => t.id));
        break;
      case 'admin':
        newSelected = new Set(filteredTargets.filter(t => 
          t.url.toLowerCase().includes('admin') || 
          t.title.toLowerCase().includes('admin') ||
          t.url.toLowerCase().includes('panel')
        ).map(t => t.id));
        break;
      case 'api':
        newSelected = new Set(filteredTargets.filter(t => 
          t.url.toLowerCase().includes('api') || 
          t.url.toLowerCase().includes('v1') ||
          t.url.toLowerCase().includes('v2')
        ).map(t => t.id));
        break;
      default:
        break;
    }
    
    setSelectedTargets(newSelected);
  };

  const getStatusBadge = (statusCode) => {
    if (statusCode >= 200 && statusCode < 300) {
      return <Badge bg="success">{statusCode}</Badge>;
    } else if (statusCode >= 300 && statusCode < 400) {
      return <Badge bg="warning">{statusCode}</Badge>;
    } else if (statusCode >= 400) {
      return <Badge bg="danger">{statusCode}</Badge>;
    } else {
      return <Badge bg="secondary">{statusCode}</Badge>;
    }
  };

  const handleImport = async () => {
    if (selectedTargets.size === 0) {
      alert('Please select at least one target to import.');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    setImportStatus('Preparing import...');

    try {
      const selectedTargetData = targets.filter(t => selectedTargets.has(t.id));
      
      const response = await fetch(
        `${process.env.REACT_APP_SERVER_PROTOCOL}://${process.env.REACT_APP_SERVER_IP}:${process.env.REACT_APP_SERVER_PORT}/acunetix/import-targets`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            targets: selectedTargetData,
            activeTarget: activeTarget
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        
        // Simulate progress for better UX
        for (let i = 0; i <= 100; i += 10) {
          setImportProgress(i);
          setImportStatus(`Importing targets... ${i}%`);
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        onImportTargets && onImportTargets(result);
        setImportStatus('Import completed successfully!');
        
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setImportStatus('Import failed. Please check your Acunetix configuration.');
      }
    } catch (error) {
      console.error('Error importing targets:', error);
      setImportStatus('Import failed due to network error.');
    } finally {
      setTimeout(() => {
        setIsImporting(false);
        setImportProgress(0);
        setImportStatus('');
      }, 2000);
    }
  };

  return (
    <Modal data-bs-theme="dark" show={show} onHide={handleClose} size="xl" className="modal-90w">
      <Modal.Header closeButton>
        <Modal.Title className="text-danger">
          <i className="bi bi-bullseye me-2"></i>
          Select Targets for Acunetix Import
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <Alert variant="info" className="mb-4">
          <Alert.Heading>Target Selection</Alert.Heading>
          Select live web servers discovered by HTTPX to import as scan targets in Acunetix. 
          Choose targets strategically based on technology stack, response codes, and potential attack surface.
        </Alert>

        {/* Filters and Controls */}
        <Row className="mb-4">
          <Col md={4}>
            <InputGroup>
              <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Filter by URL, title, or server..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </InputGroup>
          </Col>
          <Col md={2}>
            <Form.Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="success">2xx Success</option>
              <option value="redirect">3xx Redirect</option>
              <option value="error">4xx+ Error</option>
            </Form.Select>
          </Col>
          <Col md={6}>
            <div className="d-flex gap-2">
              <Button size="sm" variant="outline-info" onClick={() => handleQuickSelect('success')}>
                Select 2xx
              </Button>
              <Button size="sm" variant="outline-success" onClick={() => handleQuickSelect('https')}>
                HTTPS Only
              </Button>
              <Button size="sm" variant="outline-warning" onClick={() => handleQuickSelect('admin')}>
                Admin Panels
              </Button>
              <Button size="sm" variant="outline-primary" onClick={() => handleQuickSelect('api')}>
                API Endpoints
              </Button>
            </div>
          </Col>
        </Row>

        {/* Selection Summary */}
        <Row className="mb-3">
          <Col>
            <Alert variant="secondary" className="mb-0 py-2">
              <div className="d-flex justify-content-between align-items-center">
                <span>
                  <strong>{selectedTargets.size}</strong> of <strong>{filteredTargets.length}</strong> targets selected
                  {filteredTargets.length !== targets.length && ` (${targets.length} total)`}
                </span>
                <div>
                  <Button size="sm" variant="outline-danger" onClick={handleSelectAll}>
                    {selectAll ? 'Deselect All' : 'Select All Visible'}
                  </Button>
                </div>
              </div>
            </Alert>
          </Col>
        </Row>

        {/* Import Progress */}
        {isImporting && (
          <Alert variant="info" className="mb-4">
            <div className="d-flex align-items-center mb-2">
              <Spinner animation="border" size="sm" className="me-2" />
              <span>{importStatus}</span>
            </div>
            <ProgressBar now={importProgress} label={`${importProgress}%`} />
          </Alert>
        )}

        {/* Target Table */}
        <Table striped bordered hover responsive className="mb-0">
          <thead>
            <tr>
              <th width="50">
                <Form.Check
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
              </th>
              <th 
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setSortBy('url');
                  setSortOrder(sortBy === 'url' && sortOrder === 'asc' ? 'desc' : 'asc');
                }}
              >
                URL {sortBy === 'url' && <i className={`bi bi-chevron-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>}
              </th>
              <th 
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setSortBy('status_code');
                  setSortOrder(sortBy === 'status_code' && sortOrder === 'asc' ? 'desc' : 'asc');
                }}
              >
                Status {sortBy === 'status_code' && <i className={`bi bi-chevron-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>}
              </th>
              <th>Title</th>
              <th>Server</th>
              <th>Tech</th>
              <th>Size</th>
            </tr>
          </thead>
          <tbody>
            {filteredTargets.map(target => (
              <tr 
                key={target.id}
                className={selectedTargets.has(target.id) ? 'table-active' : ''}
                style={{ cursor: 'pointer' }}
                onClick={() => handleSelectTarget(target.id)}
              >
                <td>
                  <Form.Check
                    type="checkbox"
                    checked={selectedTargets.has(target.id)}
                    onChange={() => handleSelectTarget(target.id)}
                  />
                </td>
                <td>
                  <div className="d-flex align-items-center">
                    {target.scheme === 'https' && <i className="bi bi-shield-check text-success me-1"></i>}
                    <span className="text-truncate" style={{ maxWidth: '300px' }} title={target.url}>
                      {target.url}
                    </span>
                  </div>
                </td>
                <td>{getStatusBadge(target.status_code)}</td>
                <td>
                  <span className="text-truncate d-block" style={{ maxWidth: '200px' }} title={target.title}>
                    {target.title || 'No title'}
                  </span>
                </td>
                <td>
                  <span className="text-truncate d-block" style={{ maxWidth: '150px' }} title={target.server}>
                    {target.server || 'Unknown'}
                  </span>
                </td>
                <td>
                  {target.tech && target.tech.length > 0 ? (
                    <div className="d-flex flex-wrap gap-1">
                      {target.tech.slice(0, 2).map((tech, index) => (
                        <Badge key={index} bg="secondary" className="small">
                          {tech}
                        </Badge>
                      ))}
                      {target.tech.length > 2 && (
                        <Badge bg="info" className="small">
                          +{target.tech.length - 2}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted">None</span>
                  )}
                </td>
                <td>
                  {target.content_length ? `${Math.round(target.content_length / 1024)}KB` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        {filteredTargets.length === 0 && (
          <Alert variant="warning" className="text-center mt-4">
            <i className="bi bi-exclamation-triangle me-2"></i>
            No targets found matching your criteria.
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        <div className="d-flex justify-content-between w-100">
          <div className="text-muted">
            {selectedTargets.size > 0 && `${selectedTargets.size} targets will be imported to Acunetix`}
          </div>
          <div>
            <Button variant="secondary" onClick={handleClose} disabled={isImporting}>
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleImport}
              disabled={selectedTargets.size === 0 || isImporting}
              className="ms-2"
            >
              {isImporting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Importing...
                </>
              ) : (
                `Import ${selectedTargets.size} Target${selectedTargets.size !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default AcunetixTargetSelectorModal;

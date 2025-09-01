const fetchHttpxScans = async (activeTarget, setHttpxScans, setMostRecentHttpxScan, setMostRecentHttpxScanStatus) => {
  console.log('[HTTPX UTILS] Fetching scans for target:', activeTarget.id);
  
  try {
    const response = await fetch(
      `${process.env.REACT_APP_SERVER_PROTOCOL}://${process.env.REACT_APP_SERVER_IP}:${process.env.REACT_APP_SERVER_PORT}/scopetarget/${activeTarget.id}/scans/httpx`
    );
    
    console.log('[HTTPX UTILS] Response status:', response.status);
    
    if (!response.ok) throw new Error('Failed to fetch httpx scans');

    const data = await response.json();
    console.log('[HTTPX UTILS] HTTPX scans API response:', data);
    const scans = data.scans || [];
    console.log('[HTTPX UTILS] Found scans:', scans.length);
    setHttpxScans(scans);
    if (scans.length === 0) {
      return null;
    }

    const mostRecentScan = scans.reduce((latest, scan) => {
      const scanDate = new Date(scan.created_at);
      return scanDate > new Date(latest.created_at) ? scan : latest;
    }, scans[0]);

    const scanDetailsResponse = await fetch(
      `${process.env.REACT_APP_SERVER_PROTOCOL}://${process.env.REACT_APP_SERVER_IP}:${process.env.REACT_APP_SERVER_PORT}/httpx/${mostRecentScan.scan_id}`
    );
    if (!scanDetailsResponse.ok) throw new Error('Failed to fetch httpx scan details');

    const scanDetails = await scanDetailsResponse.json();
    console.log('[HTTPX UTILS] Scan details:', scanDetails);
    setMostRecentHttpxScan(scanDetails);
    setMostRecentHttpxScanStatus(scanDetails.status);

    return scanDetails;
  } catch (error) {
    console.error('[HTTPX UTILS] Error fetching httpx scan details:', error);
  }
}

export default fetchHttpxScans; 
import fetchHttpxScans from './fetchHttpxScans';

const monitorHttpxScanStatus = async (
  activeTarget,
  setHttpxScans,
  setMostRecentHttpxScan,
  setIsHttpxScanning,
  setMostRecentHttpxScanStatus
) => {
  if (!activeTarget) {
    console.log('[HTTPX MONITOR] No active target');
    setHttpxScans([]);
    setMostRecentHttpxScan(null);
    setIsHttpxScanning(false);
    setMostRecentHttpxScanStatus(null);
    return;
  }

  console.log('[HTTPX MONITOR] Monitoring scan status for target:', activeTarget.id);

  try {
    const scanDetails = await fetchHttpxScans(activeTarget, setHttpxScans, setMostRecentHttpxScan, setMostRecentHttpxScanStatus);
    
    console.log('[HTTPX MONITOR] Scan details:', scanDetails);
    
    if (scanDetails && scanDetails.status === 'pending') {
      console.log('[HTTPX MONITOR] Scan is pending, continuing to monitor');
      setIsHttpxScanning(true);
      setTimeout(() => {
        monitorHttpxScanStatus(
          activeTarget,
          setHttpxScans,
          setMostRecentHttpxScan,
          setIsHttpxScanning,
          setMostRecentHttpxScanStatus
        );
      }, 5000);
    } else {
      console.log('[HTTPX MONITOR] Scan is not pending, stopping monitoring');
      setIsHttpxScanning(false);
    }
  } catch (error) {
    console.error('[HTTPX MONITOR] Error monitoring httpx scan status:', error);
    setHttpxScans([]);
    setMostRecentHttpxScan(null);
    setIsHttpxScanning(false);
    setMostRecentHttpxScanStatus(null);
  }
};

export default monitorHttpxScanStatus; 
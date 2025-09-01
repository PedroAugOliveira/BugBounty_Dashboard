const fetchConsolidatedSubdomains = async (activeTarget, setConsolidatedSubdomains, setConsolidatedCount) => {
    if (!activeTarget || !activeTarget.id) {
        console.log('[CONSOLIDATED SUBDOMAINS UTILS] No active target available for fetching consolidated subdomains');
        setConsolidatedSubdomains([]);
        setConsolidatedCount(0);
        return;
    }

    console.log('[CONSOLIDATED SUBDOMAINS UTILS] Fetching subdomains for target:', activeTarget.id);

    try {
        const response = await fetch(
            `${process.env.REACT_APP_SERVER_PROTOCOL}://${process.env.REACT_APP_SERVER_IP}:${process.env.REACT_APP_SERVER_PORT}/consolidated-subdomains/${activeTarget.id}`
        );

        console.log('[CONSOLIDATED SUBDOMAINS UTILS] Response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('[CONSOLIDATED SUBDOMAINS UTILS] Response data:', data);
        setConsolidatedSubdomains(data.subdomains || []);
        setConsolidatedCount(data.count || 0);
    } catch (error) {
        console.error('[CONSOLIDATED SUBDOMAINS UTILS] Error fetching consolidated subdomains:', error);
        setConsolidatedSubdomains([]);
        setConsolidatedCount(0);
    }
};

export default fetchConsolidatedSubdomains; 
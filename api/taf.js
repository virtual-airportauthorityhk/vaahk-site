async function fetchMETAR(icaoCode = 'VHHH') {
    const url = `https://aviationweather.gov/api/data/metar?ids=${icaoCode}&format=json`;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
            return {
                success: true,
                data: data[0], // 返回第一条记录
                timestamp: new Date().toISOString()
            };
        } else {
            throw new Error('No METAR data available');
        }
        
    } catch (error) {
        console.error('Error fetching METAR data:', error);
        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * 格式化METAR时间
 * @param {number} timestamp - Unix时间戳
 * @returns {string} - 格式化后的时间字符串 YYYY-MM-DD UH:MM UTC
 */
function formatMETARTime(timestamp) {
    const date = new Date(timestamp * 1000);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} U${hours}:${minutes} UTC`;
}

/**
 * 解析METAR数据为可读格式
 * @param {Object} metarData - METAR原始数据
 * @returns {Object} - 解析后的METAR数据
 */
function parseMETARData(metarData) {
    if (!metarData) return null;
    
    return {
        icaoId: metarData.icaoId || '',
        reportTime: metarData.reportTime ? formatMETARTime(new Date(metarData.reportTime).getTime() / 1000) : '',
        obsTime: metarData.obsTime ? formatMETARTime(metarData.obsTime) : '',
        rawOb: metarData.rawOb || '',
        temp: metarData.temp || null,
        dewp: metarData.dewp || null,
        wdir: metarData.wdir || null,
        wspd: metarData.wspd || null,
        wgst: metarData.wgst || null,
        visib: metarData.visib || null,
        altim: metarData.altim || null,
        wxString: metarData.wxString || '',
        clouds: metarData.clouds || [],
        fltCat: metarData.fltCat || '',
        name: metarData.name || '',
        lat: metarData.lat || null,
        lon: metarData.lon || null,
        elev: metarData.elev || null
    };
}

// METAR API 模块
async function fetchMETAR(icaoCode = 'VHHH') {
    const url = `https://aviationweather.gov/api/data/metar?ids=${icaoCode}&format=json`;
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
            return {
                success: true,
                data: data[0],
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

// 格式化METAR时间
function formatMETARTime(timestamp) {
    if (!timestamp) return '未知时间';
    
    let date;
    if (typeof timestamp === 'number') {
        date = new Date(timestamp * 1000);
    } else {
        date = new Date(timestamp);
    }
    
    if (isNaN(date.getTime())) {
        return '无效时间';
    }
    
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} U${hours}:${minutes} UTC`;
}

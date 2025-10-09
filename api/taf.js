// TAF API 模块
async function fetchTAF(icaoCode = 'VHHH') {
    const url = `https://aviationweather.gov/api/data/taf?ids=${icaoCode}&format=json`;
    
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
            throw new Error('No TAF data available');
        }
        
    } catch (error) {
        console.error('Error fetching TAF data:', error);
        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

// 格式化TAF时间
function formatTAFTime(timestamp) {
    // 使用与METAR相同的格式化函数
    return formatMETARTime(timestamp);
}

// TAF API 调用模块

// 获取TAF数据
async function fetchTAF(icaoCode = 'VHHH') {
    const url = `https://aviationweather.gov/api/data/taf?ids=${icaoCode}&format=json`;
    
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
// timestamp - Unix时间戳
// 返回格式化后的时间字符串 YYYY-MM-DD UH:MM UTC
function formatTAFTime(timestamp) {
    const date = new Date(timestamp * 1000);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} U${hours}:${minutes} UTC`;
}

// 解析TAF数据为可读格式
// tafData - TAF原始数据
// 返回解析后的TAF数据
function parseTAFData(tafData) {
    if (!tafData) return null;
    
    return {
        icaoId: tafData.icaoId || '',
        issueTime: tafData.issueTime ? formatTAFTime(new Date(tafData.issueTime).getTime() / 1000) : '',
        bulletinTime: tafData.bulletinTime ? formatTAFTime(new Date(tafData.bulletinTime).getTime() / 1000) : '',
        validTimeFrom: tafData.validTimeFrom ? formatTAFTime(tafData.validTimeFrom) : '',
        validTimeTo: tafData.validTimeTo ? formatTAFTime(tafData.validTimeTo) : '',
        rawTAF: tafData.rawTAF || '',
        remarks: tafData.remarks || '',
        name: tafData.name || '',
        lat: tafData.lat || null,
        lon: tafData.lon || null,
        elev: tafData.elev || null,
        fcsts: tafData.fcsts || []
    };
}

// 解析TAF预报数据
// forecasts - TAF预报数组
// 返回解析后的预报数据
function parseTAFForecasts(forecasts) {
    if (!forecasts || !Array.isArray(forecasts)) return [];
    
    return forecasts.map(fcst => ({
        timeFrom: fcst.timeFrom ? formatTAFTime(fcst.timeFrom) : '',
        timeTo: fcst.timeTo ? formatTAFTime(fcst.timeTo) : '',
        timeBec: fcst.timeBec ? formatTAFTime(fcst.timeBec) : '',
        fcstChange: fcst.fcstChange || null,
        probability: fcst.probability || null,
        wdir: fcst.wdir || null,
        wspd: fcst.wspd || null,
        wgst: fcst.wgst || null,
        visib: fcst.visib || null,
        altim: fcst.altim || null,
        wxString: fcst.wxString || '',
        clouds: fcst.clouds || [],
        temp: fcst.temp || []
    }));
}

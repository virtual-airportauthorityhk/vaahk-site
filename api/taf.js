export default async function handler(req, res) {
    // 设置CORS和缓存头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    try {
        console.log('开始获取TAF数据...');
        
        const response = await fetch('https://aviationweather.gov/api/data/taf?ids=VHHH&format=json');
        
        if (!response.ok) {
            throw new Error(`AWC API响应错误: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('AWC API返回原始数据:', data);
        
        if (!data || data.length === 0) {
            throw new Error('TAF数据为空');
        }
        
        // 翻译和处理数据
        const translatedData = data.map(item => translateTaf(item));
        
        // 返回数据
        res.status(200).json({ 
            success: true, 
            data: translatedData,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('TAF API错误:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

// TAF翻译函数
function translateTaf(data) {
    if (!data || typeof data !== 'object') {
        return data;
    }
    
    const translated = { ...data };
    
    // 格式化发布时间
    if (data.issueTime) {
        translated.issue_time_formatted = formatTimeForDisplay(data.issueTime);
    }
    
    // 格式化有效时间
    if (data.validTime) {
        translated.valid_time_formatted = formatTimeForDisplay(data.validTime);
    }
    
    // 翻译预报段落
    if (data.fcsts && Array.isArray(data.fcsts)) {
        translated.forecasts_translated = data.fcsts.map(forecast => translateForecast(forecast));
    }
    
    return translated;
}

// 翻译预报段落
function translateForecast(forecast) {
    if (!forecast || typeof forecast !== 'object') {
        return forecast;
    }
    
    const translated = { ...forecast };
    
    // 翻译天气现象
    if (forecast.wxString) {
        translated.weather_translated = translateWeatherPhenomena(forecast.wxString);
    }
    
    // 翻译云况
    if (forecast.clds && Array.isArray(forecast.clds)) {
        translated.clouds_translated = forecast.clds.map(cloud => {
            let coverage = '';
            switch(cloud.cover) {
                case 'CLR': coverage = '晴朗'; break;
                case 'FEW': coverage = '少云'; break;
                case 'SCT': coverage = '疏云'; break;
                case 'BKN': coverage = '多云'; break;
                case 'OVC': coverage = '阴天'; break;
                case 'SKC': coverage = '晴空'; break;
                case 'NSC': coverage = '无明显云'; break;
                default: coverage = cloud.cover || '未知';
            }
            const altitude = cloud.base ? ` ${cloud.base}英尺` : '';
            return {
                original: cloud,
                translated: coverage + altitude,
                coverage: coverage,
                altitude: cloud.base
            };
        });
    }
    
    // 翻译风向
    if (forecast.wdir) {
        translated.wind_direction_translated = translateWindDirection(forecast.wdir);
    }
    
    // 转换能见度到公里
    if (forecast.visib) {
        translated.visibility_km = (forecast.visib * 1.60934).toFixed(1);
    }
    
    // 格式化时间范围
    if (forecast.timeFrom && forecast.timeTo) {
        translated.time_range_formatted = formatTimeRange(forecast.timeFrom, forecast.timeTo);
    }
    
    // 翻译变化类型
    if (forecast.change) {
        translated.change_translated = translateChangeType(forecast.change);
    }
    
    return translated;
}

// 翻译天气现象（与METAR相同）
function translateWeatherPhenomena(wxString) {
    if (!wxString) return '无特殊天气';
    
    const translations = {
        // 降水
        'RA': '雨',
        'DZ': '毛毛雨',
        'SN': '雪',
        'SG': '雪粒',
        'IC': '冰晶',
        'PL': '冰丸',
        'GR': '冰雹',
        'GS': '小冰雹',
        'UP': '未知降水',
        
        // 遮蔽现象
        'FG': '雾',
        'VA': '火山灰',
        'BR': '薄雾',
        'HZ': '霾',
        'DU': '尘',
        'FU': '烟',
        'SA': '沙',
        'PY': '浪花',
        
        // 其他现象
        'PO': '尘/沙旋风',
        'SQ': '飑',
        'FC': '漏斗云/龙卷风',
        'SS': '沙暴',
        'DS': '尘暴',
        
        // 强度
        '-': '轻',
        '+': '强',
        'VC': '附近',
        
        // 描述词
        'MI': '浅',
        'PR': '部分',
        'BC': '片状',
        'DR': '低吹',
        'BL': '高吹',
        'SH': '阵性',
        'TS': '雷暴',
        'FZ': '冻'
    };
    
    let translated = wxString;
    
    // 替换所有匹配的代码
    Object.entries(translations).forEach(([code, translation]) => {
        const regex = new RegExp(code, 'g');
        translated = translated.replace(regex, translation);
    });
    
    return translated;
}

// 翻译风向（与METAR相同）
function translateWindDirection(direction) {
    if (!direction || direction === 'VRB') {
        return '风向多变';
    }
    
    const deg = parseInt(direction);
    if (isNaN(deg)) return direction;
    
    const directions = [
        { min: 0, max: 11, name: '北' },
        { min: 12, max: 33, name: '北北东' },
        { min: 34, max: 56, name: '东北' },
        { min: 57, max: 78, name: '东北东' },
        { min: 79, max: 101, name: '东' },
        { min: 102, max: 123, name: '东南东' },
        { min: 124, max: 146, name: '东南' },
        { min: 147, max: 168, name: '南南东' },
        { min: 169, max: 191, name: '南' },
        { min: 192, max: 213, name: '南南西' },
        { min: 214, max: 236, name: '西南' },
        { min: 237, max: 258, name: '西南西' },
        { min: 259, max: 281, name: '西' },
        { min: 282, max: 303, name: '西北西' },
        { min: 304, max: 326, name: '西北' },
        { min: 327, max: 348, name: '北北西' },
        { min: 349, max: 360, name: '北' }
    ];
    
    const direction_name = directions.find(d => deg >= d.min && deg <= d.max);
    return direction_name ? `${direction_name.name} (${deg}°)` : `${deg}°`;
}

// 翻译变化类型
function translateChangeType(changeType) {
    const translations = {
        'FM': '从...开始',
        'BECMG': '逐渐变为',
        'TEMPO': '临时',
        'PROB': '可能性',
        'PROB30': '30%可能性',
        'PROB40': '40%可能性'
    };
    
    return translations[changeType] || changeType;
}

// 格式化时间显示
function formatTimeForDisplay(timeString) {
    if (!timeString) return '未知';
    
    try {
        const date = new Date(timeString);
        if (isNaN(date.getTime())) return timeString;
        
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day} UTC${hours}${minutes}`;
    } catch (error) {
        return timeString;
    }
}

// 格式化时间范围
function formatTimeRange(fromTime, toTime) {
    try {
        const fromDate = new Date(fromTime);
        const toDate = new Date(toTime);
        
        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            return `${fromTime} - ${toTime}`;
        }
        
        const fromFormatted = `${String(fromDate.getUTCDate()).padStart(2, '0')}${String(fromDate.getUTCHours()).padStart(2, '0')}${String(fromDate.getUTCMinutes()).padStart(2, '0')}`;
        const toFormatted = `${String(toDate.getUTCDate()).padStart(2, '0')}${String(toDate.getUTCHours()).padStart(2, '0')}${String(toDate.getUTCMinutes()).padStart(2, '0')}`;
        
        return `${fromFormatted}-${toFormatted}Z`;
    } catch (error) {
        return `${fromTime} - ${toTime}`;
    }
}

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
        console.log('开始获取METAR数据...');
        
        const response = await fetch('https://aviationweather.gov/api/data/metar?ids=VHHH&format=json');
        
        if (!response.ok) {
            throw new Error(`AWC API响应错误: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('AWC API返回原始数据:', data);
        
        if (!data || data.length === 0) {
            throw new Error('METAR数据为空');
        }
        
        // 翻译和处理数据
        const translatedData = data.map(item => translateMetar(item));
        
        // 返回数据
        res.status(200).json({ 
            success: true, 
            data: translatedData,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('METAR API错误:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

// METAR翻译函数
function translateMetar(data) {
    if (!data || typeof data !== 'object') {
        return data;
    }
    
    const translated = { ...data };
    
    // 翻译云况
    if (data.clds && Array.isArray(data.clds)) {
        translated.clouds_translated = data.clds.map(cloud => {
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
    
    // 翻译天气现象
    if (data.wxString) {
        translated.weather_translated = translateWeatherPhenomena(data.wxString);
    }
    
    // 翻译飞行等级
    if (data.fltcat) {
        translated.flight_category_translated = translateFlightCategory(data.fltcat);
    }
    
    // 翻译风向
    if (data.wdir) {
        translated.wind_direction_translated = translateWindDirection(data.wdir);
    }
    
    // 转换能见度到公里
    if (data.visib) {
        translated.visibility_km = (data.visib * 1.60934).toFixed(1);
    }
    
    // 格式化时间
    if (data.obsTime) {
        translated.observation_time_formatted = formatTimeForDisplay(data.obsTime);
    }
    
    return translated;
}

// 翻译天气现象
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

// 翻译飞行等级
function translateFlightCategory(category) {
    switch(category) {
        case 'VFR': 
            return {
                code: 'VFR',
                name: '目视飞行规则',
                description: '天气条件良好，适合目视飞行',
                color: 'green'
            };
        case 'MVFR': 
            return {
                code: 'MVFR',
                name: '边际目视飞行规则',
                description: '天气条件一般，需要谨慎飞行',
                color: 'blue'
            };
        case 'IFR': 
            return {
                code: 'IFR',
                name: '仪表飞行规则',
                description: '天气条件较差，需要仪表飞行',
                color: 'red'
            };
        case 'LIFR': 
            return {
                code: 'LIFR',
                name: '低仪表飞行规则',
                description: '天气条件恶劣，飞行条件困难',
                color: 'purple'
            };
        default:
            return {
                code: category,
                name: '未知',
                description: '飞行等级未知',
                color: 'gray'
            };
    }
}

// 翻译风向
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

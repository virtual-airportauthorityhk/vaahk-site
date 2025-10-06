// METAR API - 获取香港国际机场 METAR 数据
export default async function handler(req, res) {
    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // 调用 AWC METAR API
        const awcUrl = 'https://aviationweather.gov/api/data/metar?ids=VHHH&format=json&taf=true';
        const response = await fetch(awcUrl);
        
        if (!response.ok) {
            throw new Error(`AWC API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data || data.length === 0) {
            throw new Error('No METAR data available');
        }

        // 获取最新的 METAR 数据
        const latest = data[0];
        
        // 翻译成中文的数据
        const translatedData = {
            // 基本信息
            机场代码: latest.icaoId || '未知',
            机场名称: latest.name || '未知',
            坐标: latest.lat && latest.lon ? `${latest.lat}°N, ${latest.lon}°E` : '未知',
            海拔: latest.elev !== undefined ? `${latest.elev}米` : '未知',
            报文类型: translateMetarType(latest.metarType),
            
            // 时间信息
            观测时间: latest.reportTime ? new Date(latest.reportTime).toLocaleString('zh-CN') : '未知',
            接收时间: latest.receiptTime ? new Date(latest.receiptTime).toLocaleString('zh-CN') : '未知',
            
            // 气象要素
            温度: latest.temp !== null && latest.temp !== undefined ? `${latest.temp}°C` : '未知',
            露点: latest.dewp !== null && latest.dewp !== undefined ? `${latest.dewp}°C` : '未知',
            风向: latest.wdir !== null && latest.wdir !== undefined ? `${latest.wdir}°` : '未知',
            风速: latest.wspd !== null && latest.wspd !== undefined ? `${latest.wspd}节` : '未知',
            阵风: latest.wgst !== null && latest.wgst !== undefined ? `${latest.wgst}节` : '无',
            能见度: translateVisibility(latest.visib),
            垂直能见度: latest.vertVis ? `${latest.vertVis}英尺` : '无',
            气压: latest.altim !== null && latest.altim !== undefined ? `${latest.altim} hPa` : '未知',
            
            // 云况和天气
            主要云况: translateCloudCover(latest.cover),
            云层详情: translateClouds(latest.clouds),
            天气现象: translateWeather(latest.wxString),
            飞行类别: translateFlightCategory(latest.fltCat),
            
            // 原始数据
            原始报文: latest.rawOb || '未知',
            原始数据: latest
        };

        // 设置缓存 (5分钟)
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
        
        res.status(200).json({
            success: true,
            data: translatedData,
            lastUpdate: new Date().toISOString()
        });

    } catch (error) {
        console.error('METAR API Error:', error);
        res.status(500).json({
            success: false,
            error: '获取 METAR 数据失败',
            message: error.message
        });
    }
}

// 翻译能见度
function translateVisibility(visib) {
    if (!visib) return '未知';
    if (visib === "6+") return '≥6公里';
    if (visib === "10+") return '≥10公里';
    if (typeof visib === 'number') return `${visib}公里`;
    return visib;
}

// 翻译云况
function translateCloudCover(cover) {
    if (!cover) return '未知';
    const translations = {
        'CLR': '晴空',
        'SKC': '晴空',
        'FEW': '少云',
        'SCT': '疏云', 
        'BKN': '多云',
        'OVC': '阴天',
        'VV': '垂直能见度限制'
    };
    return translations[cover] || cover;
}

// 翻译云层详情
function translateClouds(clouds) {
    if (!clouds || clouds.length === 0) return '无云层信息';
    
    return clouds.map(cloud => {
        const cover = translateCloudCover(cloud.cover);
        const base = cloud.base ? `${cloud.base}英尺` : '高度未知';
        const type = cloud.type ? ` (${translateCloudType(cloud.type)})` : '';
        return `${cover} ${base}${type}`;
    }).join(', ');
}

// 翻译云类型
function translateCloudType(type) {
    const translations = {
        'CU': '积云',
        'CB': '积雨云',
        'TCU': '塔状积云',
        'CI': '卷云',
        'CC': '卷积云',
        'CS': '卷层云',
        'AC': '高积云',
        'AS': '高层云',
        'NS': '雨层云',
        'SC': '层积云',
        'ST': '层云'
    };
    return translations[type] || type;
}

// 翻译天气现象
function translateWeather(wxString) {
    if (!wxString) return '无';
    
    // 常见天气现象翻译
    const translations = {
        'RA': '雨',
        'SN': '雪',
        'FG': '雾',
        'BR': '薄雾',
        'HZ': '霾',
        'DZ': '毛毛雨',
        'SH': '阵雨',
        'TS': '雷暴',
        'FZ': '冻',
        'BL': '高吹',
        'DR': '低吹',
        'MI': '浅',
        'BC': '斑状',
        'PR': '部分',
        'RE': '最近',
        '-': '轻微',
        '+': '强烈',
        'VC': '附近'
    };
    
    let translated = wxString;
    for (const [code, meaning] of Object.entries(translations)) {
        translated = translated.replace(new RegExp(code, 'g'), meaning);
    }
    
    return translated;
}

// 翻译飞行类别
function translateFlightCategory(category) {
    if (!category) return '未知';
    const translations = {
        'VFR': '目视飞行规则 (VFR)',
        'MVFR': '边际目视飞行规则 (MVFR)',
        'IFR': '仪表飞行规则 (IFR)', 
        'LIFR': '低仪表飞行规则 (LIFR)'
    };
    return translations[category] || category;
}

// 翻译报文类型
function translateMetarType(type) {
    if (!type) return '未知';
    const translations = {
        'METAR': '例行天气报告',
        'SPECI': '特殊天气报告'
    };
    return translations[type] || type;
}

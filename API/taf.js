// TAF API - 获取香港国际机场 TAF 预报数据
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
        // 调用 AWC TAF API
        const awcUrl = 'https://aviationweather.gov/api/data/taf?ids=VHHH&format=json&hours=12';
        const response = await fetch(awcUrl);
        
        if (!response.ok) {
            throw new Error(`AWC API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data || data.length === 0) {
            throw new Error('No TAF data available');
        }

        // 获取最新的 TAF 数据
        const latest = data[0];
        
        // 翻译预报时段
        const translatedForecasts = latest.fcsts ? latest.fcsts.map(forecast => ({
            时段开始: new Date(forecast.timeFrom * 1000).toLocaleString('zh-CN'),
            时段结束: new Date(forecast.timeTo * 1000).toLocaleString('zh-CN'),
            变化开始时间: forecast.timeBec ? new Date(forecast.timeBec * 1000).toLocaleString('zh-CN') : '无',
            变化类型: translateChangeType(forecast.fcstChange),
            概率: forecast.probability ? `${forecast.probability}%` : '无',
            
            // 风力信息
            风向: forecast.wdir !== null && forecast.wdir !== undefined ? `${forecast.wdir}°` : '未知',
            风速: forecast.wspd !== null && forecast.wspd !== undefined ? `${forecast.wspd}节` : '未知',
            阵风: forecast.wgst !== null && forecast.wgst !== undefined ? `${forecast.wgst}节` : '无',
            
            // 风切变
            风切变高度: forecast.wshearHgt ? `${forecast.wshearHgt}英尺` : '无',
            风切变风向: forecast.wshearDir ? `${forecast.wshearDir}°` : '无',
            风切变风速: forecast.wshearSpd ? `${forecast.wshearSpd}节` : '无',
            
            // 能见度和天气
            能见度: translateVisibility(forecast.visib),
            垂直能见度: forecast.vertVis ? `${forecast.vertVis}英尺` : '无',
            天气现象: translateWeather(forecast.wxString),
            
            // 云况
            云层: translateClouds(forecast.clouds),
            
            // 温度信息
            温度预报: forecast.temp ? forecast.temp.map(temp => 
                `${temp.maxOrMin === 'MAX' ? '最高' : '最低'}温度: ${temp.surfaceTemp}°C (${new Date(temp.validTime * 1000).toLocaleString('zh-CN')})`
            ).join('; ') : '无',
            
            // 结冰和湍流
            结冰湍流信息: forecast.icgTurb && forecast.icgTurb.length > 0 ? 
                forecast.icgTurb.map(turb => `${turb.intensity} ${turb.minAlt}-${turb.maxAlt}英尺`).join('; ') : '无',
            
            // 未解码内容
            未解码内容: forecast.notDecoded || '无',
            
            原始数据: forecast
        })) : [];

        // 翻译成中文的数据
        const translatedData = {
            // 基本信息
            机场代码: latest.icaoId || '未知',
            机场名称: latest.name || '未知',
            坐标: latest.lat && latest.lon ? `${latest.lat}°N, ${latest.lon}°E` : '未知',
            海拔: latest.elev !== undefined ? `${latest.elev}米` : '未知',
            
            // 时间信息
            数据库更新时间: latest.dbPopTime ? new Date(latest.dbPopTime).toLocaleString('zh-CN') : '未知',
            公告时间: latest.bulletinTime ? new Date(latest.bulletinTime).toLocaleString('zh-CN') : '未知',
            发布时间: latest.issueTime ? new Date(latest.issueTime).toLocaleString('zh-CN') : '未知',
            有效期开始: latest.validTimeFrom ? new Date(latest.validTimeFrom * 1000).toLocaleString('zh-CN') : '未知',
            有效期结束: latest.validTimeTo ? new Date(latest.validTimeTo * 1000).toLocaleString('zh-CN') : '未知',
            
            // 状态信息
            是否最新版本: latest.mostRecent === 1 ? '是' : '否',
            是否为修正版: latest.prior > 0 ? `是 (第${latest.prior}次修正)` : '否',
            
            // 内容信息
            原始报文: latest.rawTAF || '未知',
            备注: latest.remarks || '无',
            预报时段数量: translatedForecasts.length,
            预报时段详情: translatedForecasts,
            
            // 原始数据
            原始数据: latest
        };

        // 设置缓存 (10分钟)
        res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
        
        res.status(200).json({
            success: true,
            data: translatedData,
            lastUpdate: new Date().toISOString()
        });

    } catch (error) {
        console.error('TAF API Error:', error);
        res.status(500).json({
            success: false,
            error: '获取 TAF 数据失败',
            message: error.message
        });
    }
}

// 翻译变化类型
function translateChangeType(changeType) {
    if (!changeType) return '无变化';
    const translations = {
        'BECMG': '逐渐变化',
        'TEMPO': '临时变化',
        'PROB': '概率变化',
        'PROB30': '30%概率',
        'PROB40': '40%概率',
        'FM': '从...开始',
        'INTER': '间歇性变化'
    };
    return translations[changeType] || changeType;
}

// 复用 METAR 的翻译函数
function translateVisibility(visib) {
    if (!visib) return '未知';
    if (visib === "6+") return '≥6公里';
    if (visib === "10+") return '≥10公里';
    if (typeof visib === 'number') return `${visib}公里`;
    return visib;
}

function translateClouds(clouds) {
    if (!clouds || clouds.length === 0) return '无云层信息';
    
    return clouds.map(cloud => {
        const cover = translateCloudCover(cloud.cover);
        const base = cloud.base ? `${cloud.base}英尺` : '高度未知';
        const type = cloud.type ? ` (${translateCloudType(cloud.type)})` : '';
        return `${cover} ${base}${type}`;
    }).join(', ');
}

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

function translateWeather(wxString) {
    if (!wxString) return '无';
    
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

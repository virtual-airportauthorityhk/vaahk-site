// METAR API - AWC 实时天气数据获取
// VAAHK - 虚拟香港机场管理局

/**
 * 获取香港国际机场(VHHH)的实时METAR数据
 * @returns {Promise<Object>} METAR数据对象
 */
async function fetchMetarData() {
    const METAR_API_URL = 'https://aviationweather.gov/api/data/metar?ids=VHHH&format=json';
    
    try {
        const response = await fetch(METAR_API_URL, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'VAAHK-Weather-Service/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
        }

        const data = await response.json();
        
        if (data && data.length > 0) {
            return {
                success: true,
                data: data[0], // 返回最新的METAR数据
                timestamp: new Date().toISOString()
            };
        } else {
            throw new Error('未获取到METAR数据');
        }
    } catch (error) {
        console.error('METAR数据获取失败:', error);
        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * 解析METAR数据中的时间信息
 * @param {number|string} obsTime - 观测时间 (Unix时间戳或ISO字符串)
 * @returns {string} 格式化的时间字符串
 */
function parseMetarTime(obsTime) {
    try {
        let date;
        if (typeof obsTime === 'number') {
            // Unix时间戳 (秒)
            date = new Date(obsTime * 1000);
        } else if (typeof obsTime === 'string') {
            // ISO时间字符串
            date = new Date(obsTime);
        } else {
            throw new Error('不支持的时间格式');
        }
        
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
    } catch (error) {
        console.error('时间解析错误:', error);
        return '时间解析失败';
    }
}

/**
 * 翻译METAR天气现象 - 完整版本
 * @param {string} wxString - 天气现象字符串
 * @returns {string} 中文翻译
 */
function translateWeatherPhenomena(wxString) {
    if (!wxString || wxString.trim() === '') return '';
    
    // 天气现象代码映射表 - 根据ICAO标准完整收录
    const weatherCodes = {
        // 降水类型 (Precipitation)
        'RA': '雨',
        'DZ': '毛毛雨',
        'SN': '雪',
        'SG': '雪粒',
        'IC': '冰晶',
        'PL': '冰粒',
        'GR': '冰雹',
        'GS': '小冰雹/雪丸',
        'UP': '未知降水',
        
        // 遮蔽现象 (Obscuration)
        'FG': '雾',
        'BR': '轻雾',
        'HZ': '霾',
        'DU': '浮尘',
        'SA': '扬沙',
        'VA': '火山灰',
        'PY': '喷雾',
        'FU': '烟',
        
        // 其他现象 (Other)
        'SQ': '飑',
        'FC': '漏斗云/龙卷',
        'DS': '尘暴',
        'SS': '沙暴',
        'PO': '尘卷/沙卷',
        'TS': '雷暴',
        
        // 描述词 (Descriptors)
        'SH': '阵性',
        'FZ': '冻结',
        'BL': '高吹',
        'DR': '低吹',
        'MI': '浅薄',
        'BC': '斑状',
        'PR': '部分',
        'VC': '附近',
        'RE': '最近',
        
        // 强度指示符
        '-': '轻',
        '+': '强',
        'TS': '雷暴'
    };
    
    // 特殊组合翻译
    const specialCombinations = {
        'TSRA': '雷阵雨',
        'TSSN': '雷暴雪',
        'SHRA': '阵雨',
        'SHSN': '阵雪',
        'SHGR': '阵性冰雹',
        'SHGS': '阵性小冰雹',
        'FZRA': '冻雨',
        'FZDZ': '冻毛毛雨',
        'FZFG': '冻雾',
        'BLSN': '高吹雪',
        'BLDU': '高吹尘',
        'BLSA': '高吹沙',
        'DRSN': '低吹雪',
        'DRDU': '低吹尘',
        'DRSA': '低吹沙',
        'VCSH': '附近阵性降水',
        'VCPO': '附近尘卷',
        'VCFC': '附近漏斗云',
        'VCFG': '附近雾',
        'VCDS': '附近尘暴',
        'VCSS': '附近沙暴',
        'MIFG': '浅雾',
        'BCFG': '斑状雾',
        'PRFG': '部分雾',
        'RERA': '最近有雨',
        'RESN': '最近有雪',
        'RETS': '最近有雷暴',
        'REFZ': '最近有冻结现象',
        'RESH': '最近有阵性降水'
    };
    
    // 先检查特殊组合
    const upperWx = wxString.toUpperCase().trim();
    if (specialCombinations[upperWx]) {
        return specialCombinations[upperWx];
    }
    
    let result = '';
    let workStr = upperWx;
    
    // 处理强度指示符
    if (workStr.startsWith('-')) {
        result += '轻';
        workStr = workStr.substring(1);
    } else if (workStr.startsWith('+')) {
        result += '强';
        workStr = workStr.substring(1);
    }
    
    // 逐个处理2字符代码
    while (workStr.length >= 2) {
        const code = workStr.substring(0, 2);
        if (weatherCodes[code]) {
            result += weatherCodes[code];
        } else {
            // 未知代码保持原样
            result += code;
        }
        workStr = workStr.substring(2);
    }
    
    // 如果还有单字符剩余
    if (workStr.length === 1 && weatherCodes[workStr]) {
        result += weatherCodes[workStr];
    }
    
    return result || wxString; // 如果翻译失败，返回原代码
}

/**
 * 翻译云层信息 - 完整版本
 * @param {string|Object} cloud - 云层代码或云层对象
 * @returns {string} 中文翻译
 */
function translateCloudInfo(cloud) {
    const cloudCodes = {
        'SKC': '碧空无云',
        'CLR': '晴朗无云', 
        'NSC': '无显著云',
        'NCD': '无云被探测到',
        'FEW': '少云',
        'SCT': '散云',
        'BKN': '裂云',
        'OVC': '满天云',
        'VV': '垂直能见度',
        'CAVOK': '云和能见度良好'
    };
    
    const cloudTypes = {
        'CU': '积云',
        'CB': '积雨云',
        'TCU': '浓积云',
        'AC': '高积云',
        'AS': '高层云',
        'CC': '卷积云',
        'CI': '卷云',
        'CS': '卷层云',
        'NS': '雨层云',
        'SC': '层积云',
        'ST': '层云'
    };
    
    // 如果是对象格式（API返回的格式）
    if (typeof cloud === 'object' && cloud !== null) {
        let result = '';
        if (cloud.cover && cloudCodes[cloud.cover]) {
            result += cloudCodes[cloud.cover];
        }
        if (cloud.base) {
            result += ` ${cloud.base}英尺`;
        }
        if (cloud.type && cloudTypes[cloud.type]) {
            result += ` (${cloudTypes[cloud.type]})`;
        }
        return result;
    }
    
    // 如果是字符串格式（传统格式）
    if (typeof cloud === 'string') {
        // 匹配云层类型、高度和云种
        const match = cloud.match(/^(SKC|CLR|NSC|NCD|FEW|SCT|BKN|OVC|VV)(\d{3})?(CU|CB|TCU|AC|AS|CC|CI|CS|NS|SC|ST)?/);
        
        if (match) {
            let result = cloudCodes[match[1]] || match[1];
            
            // 添加高度信息
            if (match[2]) {
                const height = parseInt(match[2]) * 100;
                result += ` ${height}英尺`;
            }
            
            // 添加云种信息
            if (match[3] && cloudTypes[match[3]]) {
                result += ` (${cloudTypes[match[3]]})`;
            }
            
            return result;
        }
        
        // 特殊情况处理
        if (cloudCodes[cloud]) {
            return cloudCodes[cloud];
        }
    }
    
    return String(cloud) || '';
}

// 导出函数供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fetchMetarData,
        parseMetarTime,
        translateWeatherPhenomena,
        translateCloudInfo
    };
}

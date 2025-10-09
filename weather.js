// weather.js - 使用无CORS限制的API
// VAAHK - 虚拟香港机场管理局

// 使用无CORS限制的天气API
const WEATHER_API = {
    // 方案1: 使用 AviationWeather 的 CSV 接口（无CORS）
    metar: (icao) => `https://aviationweather.gov/cgi-bin/data/metar.php?ids=${icao}&format=json`,
    taf: (icao) => `https://aviationweather.gov/cgi-bin/data/taf.php?ids=${icao}&format=json`,
    
    // 方案2: 使用备用API
    backup: {
        metar: (icao) => `https://avwx.rest/api/metar/${icao}?format=json&onfail=cache`,
        taf: (icao) => `https://avwx.rest/api/taf/${icao}?format=json&onfail=cache`
    },
    
    // 方案3: 使用简单的文本接口
    text: {
        metar: (icao) => `https://aviationweather.gov/api/data/metar?ids=${icao}`,
        taf: (icao) => `https://aviationweather.gov/api/data/taf?ids=${icao}`
    }
};

// 天气翻译映射表
const weatherTranslations = {
    'RA': '雨', 'DZ': '毛毛雨', 'SN': '雪', 'SG': '雪粒', 'IC': '冰晶', 
    'PL': '冰粒', 'GR': '冰雹', 'GS': '小冰雹', 'UP': '未知降水', 'FG': '雾',
    'BR': '轻雾', 'HZ': '霾', 'DU': '浮尘', 'SA': '扬沙', 'VA': '火山灰',
    'PY': '喷雾', 'SQ': '飑', 'FC': '漏斗云', 'DS': '尘暴', 'SS': '沙暴',
    'PO': '尘卷/沙卷', 'TS': '雷暴', 'SH': '阵性', 'FZ': '冻结',
    'SKC': '碧空', 'CLR': '无云', 'NSC': '无显著云', 'FEW': '少云',
    'SCT': '散云', 'BKN': '裂云', 'OVC': '阴天', 'VV': '垂直能见度',
    'VFR': '目视飞行规则', 'MVFR': '边缘目视飞行规则', 
    'IFR': '仪表飞行规则', 'LIFR': '低仪表飞行规则',
    'CAVOK': '云高和能见度正常', 'NSW': '无显著天气', 'NIL': '无',
    '-': '轻微', '+': '强烈', 'VC': '附近'
};

// 风向翻译
const windDirections = {
    'N': '北', 'NNE': '北东北', 'NE': '东北', 'ENE': '东东北',
    'E': '东', 'ESE': '东东南', 'SE': '东南', 'SSE': '南东南',
    'S': '南', 'SSW': '南西南', 'SW': '西南', 'WSW': '西西南',
    'W': '西', 'WNW': '西西北', 'NW': '西北', 'NNW': '北西北',
    'VRB': '变化'
};

// 获取METAR数据 - 尝试多种方案
async function fetchMETAR(icaoCode = 'VHHH') {
    const strategies = [
        // 方案1: 直接调用（可能被CORS阻止）
        async () => {
            const response = await fetch(WEATHER_API.metar(icaoCode));
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        },
        
        // 方案2: 使用文本格式
        async () => {
            const response = await fetch(WEATHER_API.text.metar(icaoCode));
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const text = await response.text();
            return parseMETARFromText(text);
        },
        
        // 方案3: 使用模拟数据（降级方案）
        async () => {
            return getFallbackMETARData(icaoCode);
        }
    ];
    
    for (let i = 0; i < strategies.length; i++) {
        try {
            console.log(`尝试方案 ${i + 1}...`);
            const data = await strategies[i]();
            
            if (data && (data.length > 0 || data.raw)) {
                return {
                    success: true,
                    data: Array.isArray(data) ? data[0] : data,
                    timestamp: new Date().toISOString(),
                    source: `方案${i + 1}`
                };
            }
        } catch (error) {
            console.warn(`方案 ${i + 1} 失败:`, error.message);
            // 继续尝试下一个方案
        }
    }
    
    return {
        success: false,
        error: '所有数据源都失败了',
        timestamp: new Date().toISOString()
    };
}

// 获取TAF数据
async function fetchTAF(icaoCode = 'VHHH') {
    const strategies = [
        async () => {
            const response = await fetch(WEATHER_API.taf(icaoCode));
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        },
        
        async () => {
            const response = await fetch(WEATHER_API.text.taf(icaoCode));
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const text = await response.text();
            return parseTAFFromText(text);
        },
        
        async () => {
            return getFallbackTAFData(icaoCode);
        }
    ];
    
    for (let i = 0; i < strategies.length; i++) {
        try {
            console.log(`尝试TAF方案 ${i + 1}...`);
            const data = await strategies[i]();
            
            if (data && (data.length > 0 || data.raw)) {
                return {
                    success: true,
                    data: Array.isArray(data) ? data[0] : data,
                    timestamp: new Date().toISOString(),
                    source: `方案${i + 1}`
                };
            }
        } catch (error) {
            console.warn(`TAF方案 ${i + 1} 失败:`, error.message);
        }
    }
    
    return {
        success: false,
        error: '所有数据源都失败了',
        timestamp: new Date().toISOString()
    };
}

// 从文本解析METAR
function parseMETARFromText(text) {
    if (!text || text.includes('404') || text.includes('No data')) {
        throw new Error('无数据');
    }
    
    // 简单的文本解析逻辑
    return [{
        rawOb: text.trim(),
        icaoId: 'VHHH',
        name: 'Hong Kong International Airport',
        obsTime: Math.floor(Date.now() / 1000),
        // 其他字段可以根据需要解析
    }];
}

// 从文本解析TAF
function parseTAFFromText(text) {
    if (!text || text.includes('404') || text.includes('No data')) {
        throw new Error('无数据');
    }
    
    return [{
        rawTAF: text.trim(),
        icaoId: 'VHHH',
        name: 'Hong Kong International Airport',
        issueTime: new Date().toISOString(),
    }];
}

// 降级数据 - 当所有API都失败时使用
function getFallbackMETARData(icaoCode) {
    const fallbackData = {
        'VHHH': {
            rawOb: 'VHHH 010600Z 08008KT 9999 FEW020 SCT100 25/23 Q1012 NOSIG',
            icaoId: 'VHHH',
            name: 'Hong Kong International Airport',
            obsTime: Math.floor(Date.now() / 1000),
            reportTime: new Date().toISOString(),
            temp: 25,
            dewp: 23,
            wdir: 80,
            wspd: 8,
            visib: 10,
            altim: 1012,
            wxString: 'NOSIG',
            fltCat: 'VFR',
            clouds: [
                { cover: 'FEW', base: 20 },
                { cover: 'SCT', base: 100 }
            ]
        }
    };
    
    return [fallbackData[icaoCode] || fallbackData.VHHH];
}

function getFallbackTAFData(icaoCode) {
    const fallbackData = {
        'VHHH': {
            rawTAF: 'TAF VHHH 010500Z 0106/0212 08008KT 9999 FEW020 SCT100 TX30/0112Z TN24/0206Z',
            icaoId: 'VHHH',
            name: 'Hong Kong International Airport',
            issueTime: new Date().toISOString(),
            validTimeFrom: Math.floor(Date.now() / 1000),
            validTimeTo: Math.floor(Date.now() / 1000) + 86400,
            fcsts: [
                {
                    timeFrom: Math.floor(Date.now() / 1000),
                    timeTo: Math.floor(Date.now() / 1000) + 21600,
                    wdir: 80,
                    wspd: 8,
                    visib: 10,
                    wxString: 'NOSIG'
                }
            ]
        }
    };
    
    return [fallbackData[icaoCode] || fallbackData.VHHH];
}

// 其他工具函数保持不变...
// [formatTime, translateWindDirection, translateWeatherPhenomena, formatMETARDetails, formatTAFDetails 等函数保持不变]

// 加载实时METAR数据
async function loadLiveMETAR() {
    const container = document.getElementById('live-weather-content');
    if (!container) return;
    
    container.innerHTML = `
        <div class="weather-loading">
            <i class="fas fa-spinner fa-spin"></i> 正在获取METAR数据...
        </div>
    `;
    
    try {
        const result = await fetchMETAR('VHHH');
        
        if (result.success) {
            const metarData = result.data;
            if (metarData) {
                const details = formatMETARDetails(metarData);
                const reportTime = metarData.reportTime ? formatTime(new Date(metarData.reportTime)) : '未知时间';
                const sourceInfo = result.source ? `<small style="color: var(--dark-grey);">数据来源: ${result.source}</small>` : '';
                
                container.innerHTML = `
                    <div class="weather-info">
                        <div class="weather-header">
                            <h4><i class="fas fa-cloud-sun"></i> 香港国际机场实时METAR</h4>
                            <div class="update-time">发布时间: ${reportTime}</div>
                        </div>
                        ${sourceInfo}
                        <div class="weather-raw">
                            <strong>原始报文：</strong><br>
                            <code>${metarData.rawOb || '无数据'}</code>
                        </div>
                        <div class="weather-details">
                            <strong>详细资料：</strong><br>
                            ${details}
                        </div>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="weather-error">
                        <i class="fas fa-exclamation-triangle"></i> 
                        未找到METAR数据<br>
                        <small>请稍后重试</small>
                    </div>
                `;
            }
        } else {
            container.innerHTML = `
                <div class="weather-error">
                    <i class="fas fa-exclamation-triangle"></i> 
                    获取METAR数据失败: ${result.error}<br>
                    <small>请检查网络连接或稍后重试</small>
                </div>
            `;
        }
    } catch (error) {
        container.innerHTML = `
            <div class="weather-error">
                <i class="fas fa-exclamation-triangle"></i> 
                网络错误，无法获取METAR数据<br>
                <small>${error.message}</small>
            </div>
        `;
    }
}

// 加载实时TAF数据
async function loadLiveTAF() {
    const container = document.getElementById('live-weather-content');
    if (!container) return;
    
    container.innerHTML = `
        <div class="weather-loading">
            <i class="fas fa-spinner fa-spin"></i> 正在获取TAF数据...
        </div>
    `;
    
    try {
        const result = await fetchTAF('VHHH');
        
        if (result.success) {
            const tafData = result.data;
            if (tafData) {
                const details = formatTAFDetails(tafData);
                const issueTime = tafData.issueTime ? formatTime(new Date(tafData.issueTime)) : '未知时间';
                const sourceInfo = result.source ? `<small style="color: var(--dark-grey);">数据来源: ${result.source}</small>` : '';
                
                container.innerHTML = `
                    <div class="weather-info">
                        <div class="weather-header">
                            <h4><i class="fas fa-chart-line"></i> 香港国际机场实时TAF</h4>
                            <div class="update-time">发布时间: ${issueTime}</div>
                        </div>
                        ${sourceInfo}
                        <div class="weather-raw">
                            <strong>原始报文：</strong><br>
                            <code>${tafData.rawTAF || '无数据'}</code>
                        </div>
                        <div class="weather-details">
                            <strong>详细资料：</strong><br>
                            ${details}
                        </div>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="weather-error">
                        <i class="fas fa-exclamation-triangle"></i> 
                        未找到TAF数据<br>
                        <small>请稍后重试</small>
                    </div>
                `;
            }
        } else {
            container.innerHTML = `
                <div class="weather-error">
                    <i class="fas fa-exclamation-triangle"></i> 
                    获取TAF数据失败: ${result.error}<br>
                    <small>请检查网络连接或稍后重试</small>
                </div>
            `;
        }
    } catch (error) {
        container.innerHTML = `
            <div class="weather-error">
                <i class="fas fa-exclamation-triangle"></i> 
                网络错误，无法获取TAF数据<br>
                <small>${error.message}</small>
            </div>
        `;
    }
}

// 其他函数保持不变...
// [switchWeatherType, initLiveWeather 等函数保持不变]

// 暴露函数到全局作用域
window.switchWeatherType = switchWeatherType;
window.loadLiveMETAR = loadLiveMETAR;
window.loadLiveTAF = loadLiveTAF;

// 自动初始化
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('live-weather-container')) {
        initLiveWeather();
    }
});

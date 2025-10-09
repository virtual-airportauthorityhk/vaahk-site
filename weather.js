// 香港国际机场实时天气信息模块 - 完整版
// VAAHK - 虚拟香港机场管理局

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

// 获取METAR数据
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

// 获取TAF数据
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

// 格式化时间
function formatTime(timestamp) {
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

// 翻译风向
function translateWindDirection(degrees) {
    if (!degrees || degrees === 'VRB') return windDirections['VRB'];
    
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return windDirections[directions[index]] || `${degrees}°`;
}

// 翻译天气现象
function translateWeatherPhenomena(wxString) {
    if (!wxString) return '';
    
    let translation = '';
    let remaining = wxString;
    
    // 处理强度前缀
    if (remaining.startsWith('-') || remaining.startsWith('+')) {
        translation += weatherTranslations[remaining[0]] + ' ';
        remaining = remaining.substring(1);
    }
    
    // 处理VC前缀
    if (remaining.startsWith('VC')) {
        translation += weatherTranslations['VC'] + ' ';
        remaining = remaining.substring(2);
    }
    
    // 尝试匹配已知的天气代码
    const codes = Object.keys(weatherTranslations).sort((a, b) => b.length - a.length);
    for (const code of codes) {
        if (remaining.startsWith(code)) {
            translation += weatherTranslations[code];
            remaining = remaining.substring(code.length);
            break;
        }
    }
    
    return translation || wxString;
}

// 格式化METAR详细信息
function formatMETARDetails(metarData) {
    if (!metarData) return '';
    
    let details = [];
    
    if (metarData.name) {
        details.push(`<strong>机场：</strong>${metarData.name} (${metarData.icaoId || 'VHHH'})`);
    }
    
    if (metarData.obsTime) {
        const obsTime = formatTime(metarData.obsTime);
        details.push(`<strong>观测时间：</strong>${obsTime}`);
    }
    
    if (metarData.temp !== null && metarData.temp !== undefined) {
        details.push(`<strong>温度：</strong>${metarData.temp}°C`);
    }
    
    if (metarData.dewp !== null && metarData.dewp !== undefined) {
        details.push(`<strong>露点：</strong>${metarData.dewp}°C`);
    }
    
    if (metarData.wdir !== null && metarData.wspd !== null) {
        const windDir = translateWindDirection(metarData.wdir);
        let windInfo = `<strong>风：</strong>${windDir} ${metarData.wspd}节`;
        if (metarData.wgst) {
            windInfo += ` 阵风${metarData.wgst}节`;
        }
        details.push(windInfo);
    }
    
    if (metarData.visib !== null && metarData.visib !== undefined) {
        details.push(`<strong>能见度：</strong>${metarData.visib}英里`);
    }
    
    if (metarData.altim !== null && metarData.altim !== undefined) {
        const pressureHpa = Math.round(metarData.altim * 33.864);
        details.push(`<strong>气压：</strong>${metarData.altim} inHg (${pressureHpa} hPa)`);
    }
    
    if (metarData.wxString) {
        const translated = translateWeatherPhenomena(metarData.wxString);
        details.push(`<strong>天气现象：</strong>${metarData.wxString} (${translated})`);
    }
    
    if (metarData.fltCat) {
        const fltCatTranslated = weatherTranslations[metarData.fltCat] || metarData.fltCat;
        details.push(`<strong>飞行类别：</strong>${metarData.fltCat} (${fltCatTranslated})`);
    }
    
    return details.join('<br>');
}

// 格式化TAF详细信息
function formatTAFDetails(tafData) {
    if (!tafData) return '';
    
    let details = [];
    
    if (tafData.name) {
        details.push(`<strong>机场：</strong>${tafData.name} (${tafData.icaoId || 'VHHH'})`);
    }
    
    if (tafData.issueTime) {
        const issueTime = formatTime(tafData.issueTime);
        details.push(`<strong>发布时间：</strong>${issueTime}`);
    }
    
    if (tafData.validTimeFrom && tafData.validTimeTo) {
        const validFrom = formatTime(tafData.validTimeFrom);
        const validTo = formatTime(tafData.validTimeTo);
        details.push(`<strong>有效期：</strong>${validFrom} 至 ${validTo}`);
    }
    
    if (tafData.fcsts && tafData.fcsts.length > 0) {
        details.push('<strong>预报详情：</strong>');
        tafData.fcsts.forEach((fcst, index) => {
            let fcstDetails = [];
            
            if (fcst.timeFrom && fcst.timeTo) {
                const timeFrom = formatTime(fcst.timeFrom);
                const timeTo = formatTime(fcst.timeTo);
                fcstDetails.push(`时间段: ${timeFrom} 至 ${timeTo}`);
            }
            
            if (fcst.wdir && fcst.wspd) {
                const windDir = translateWindDirection(fcst.wdir);
                let windInfo = `风: ${windDir} ${fcst.wspd}节`;
                if (fcst.wgst) {
                    windInfo += ` 阵风${fcst.wgst}节`;
                }
                fcstDetails.push(windInfo);
            }
            
            if (fcst.visib) {
                fcstDetails.push(`能见度: ${fcst.visib}英里`);
            }
            
            if (fcst.wxString) {
                const translated = translateWeatherPhenomena(fcst.wxString);
                fcstDetails.push(`天气现象: ${fcst.wxString} (${translated})`);
            }
            
            if (fcstDetails.length > 0) {
                details.push(`&nbsp;&nbsp;预报 ${index + 1}: ${fcstDetails.join(', ')}`);
            }
        });
    }
    
    return details.join('<br>');
}

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
            const details = formatMETARDetails(metarData);
            const reportTime = metarData.reportTime ? formatTime(new Date(metarData.reportTime)) : '未知时间';
            
            container.innerHTML = `
                <div class="weather-info">
                    <div class="weather-header">
                        <h4><i class="fas fa-cloud-sun"></i> 香港国际机场实时METAR</h4>
                        <div class="update-time">发布时间: ${reportTime}</div>
                    </div>
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
            const details = formatTAFDetails(tafData);
            const issueTime = tafData.issueTime ? formatTime(new Date(tafData.issueTime)) : '未知时间';
            
            container.innerHTML = `
                <div class="weather-info">
                    <div class="weather-header">
                        <h4><i class="fas fa-chart-line"></i> 香港国际机场实时TAF</h4>
                        <div class="update-time">发布时间: ${issueTime}</div>
                    </div>
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

// 切换天气数据类型
function switchWeatherType(type) {
    const metarBtn = document.getElementById('metar-btn');
    const tafBtn = document.getElementById('taf-btn');
    
    if (type === 'metar') {
        metarBtn.classList.add('active');
        tafBtn.classList.remove('active');
        loadLiveMETAR();
    } else if (type === 'taf') {
        tafBtn.classList.add('active');
        metarBtn.classList.remove('active');
        loadLiveTAF();
    }
}

// 初始化实时天气模块
function initLiveWeather() {
    // 默认加载METAR数据
    switchWeatherType('metar');
    
    // 设置自动刷新（每5分钟）
    setInterval(() => {
        const metarBtn = document.getElementById('metar-btn');
        if (metarBtn && metarBtn.classList.contains('active')) {
            loadLiveMETAR();
        } else {
            loadLiveTAF();
        }
    }, 5 * 60 * 1000);
}

// 当文档加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('live-weather-container')) {
        initLiveWeather();
    }
});

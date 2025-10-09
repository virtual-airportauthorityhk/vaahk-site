// TAF API - AWC 机场天气预报数据获取
// VAAHK - 虚拟香港机场管理局

/**
 * 获取香港国际机场(VHHH)的实时TAF数据
 * @returns {Promise<Object>} TAF数据对象
 */
async function fetchTafData() {
    const TAF_API_URL = 'https://aviationweather.gov/api/data/taf?ids=VHHH&format=json';
    
    try {
        const response = await fetch(TAF_API_URL, {
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
                data: data[0], // 返回最新的TAF数据
                timestamp: new Date().toISOString()
            };
        } else {
            throw new Error('未获取到TAF数据');
        }
    } catch (error) {
        console.error('TAF数据获取失败:', error);
        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * 解析TAF数据中的时间信息
 * @param {string|number} issueTime - 发布时间 (ISO字符串或Unix时间戳)
 * @param {number} validTimeFrom - 有效开始时间 (Unix时间戳)
 * @param {number} validTimeTo - 有效结束时间 (Unix时间戳)
 * @returns {Object} 包含发布时间和有效时间的对象
 */
function parseTafTime(issueTime, validTimeFrom, validTimeTo) {
    try {
        // 解析发布时间
        let issueDate;
        if (typeof issueTime === 'number') {
            issueDate = new Date(issueTime * 1000);
        } else if (typeof issueTime === 'string') {
            issueDate = new Date(issueTime);
        } else {
            throw new Error('不支持的发布时间格式');
        }
        
        const issueFormatted = formatDateTime(issueDate);
        
        // 解析有效时间
        let validFormatted = '';
        if (validTimeFrom && validTimeTo) {
            const startDate = new Date(validTimeFrom * 1000);
            const endDate = new Date(validTimeTo * 1000);
            validFormatted = `${formatDateTime(startDate)} 至 ${formatDateTime(endDate)}`;
        }
        
        return {
            issue: issueFormatted,
            valid: validFormatted
        };
    } catch (error) {
        console.error('TAF时间解析错误:', error);
        return {
            issue: '时间解析失败',
            valid: '时间解析失败'
        };
    }
}

/**
 * 解析有效时间字符串
 * @param {string} timeStr - 时间字符串 (格式: DDHHMM)
 * @returns {Date} 解析后的日期对象
 */
function parseValidTimeString(timeStr) {
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth();
    
    const day = parseInt(timeStr.substring(0, 2));
    const hour = parseInt(timeStr.substring(2, 4));
    const minute = parseInt(timeStr.substring(4, 6));
    
    const date = new Date(Date.UTC(currentYear, currentMonth, day, hour, minute));
    
    // 如果日期在过去，假设是下个月
    if (date < now) {
        date.setUTCMonth(currentMonth + 1);
    }
    
    return date;
}

/**
 * 格式化日期时间
 * @param {Date} date - 日期对象
 * @returns {string} 格式化的时间字符串
 */
function formatDateTime(date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
}

/**
 * 解析TAF中的预报组信息
 * @param {Array} fcsts - 预报组数组
 * @returns {Array} 翻译后的预报组信息
 */
function parseTafForecasts(fcsts) {
    if (!fcsts || !Array.isArray(fcsts)) {
        return [];
    }
    
    return fcsts.map(fcst => {
        let forecastInfo = {
            timeFrom: '',
            timeTo: '',
            changeType: '',
            probability: '',
            wind: '',
            visibility: '',
            weather: '',
            clouds: '',
            temperature: '',
            icingTurbulence: '',
            windShear: ''
        };
        
        // 解析时间
        if (fcst.timeFrom) {
            const fromDate = new Date(fcst.timeFrom * 1000);
            forecastInfo.timeFrom = formatDateTime(fromDate);
        }
        
        if (fcst.timeTo) {
            const toDate = new Date(fcst.timeTo * 1000);
            forecastInfo.timeTo = formatDateTime(toDate);
        }
        
        // 变化类型和概率
        if (fcst.fcstChange) {
            forecastInfo.changeType = translateChangeType(fcst.fcstChange);
        }
        
        if (fcst.probability) {
            forecastInfo.probability = `${fcst.probability}%概率`;
        }
        
        // 风向风速
        if (fcst.wdir !== null || fcst.wspd !== null) {
            let windInfo = '';
            if (fcst.wdir === 'VRB') {
                windInfo += '风向多变';
            } else if (fcst.wdir) {
                windInfo += `风向 ${fcst.wdir}°`;
            }
            
            if (fcst.wspd) {
                windInfo += ` 风速 ${fcst.wspd}节`;
            }
            
            if (fcst.wgst) {
                windInfo += ` 阵风 ${fcst.wgst}节`;
            }
            
            forecastInfo.wind = windInfo;
        }
        
        // 风切变
        if (fcst.wshearHgt && fcst.wshearDir && fcst.wshearSpd) {
            forecastInfo.windShear = `${fcst.wshearHgt}英尺高度风切变：风向${fcst.wshearDir}° 风速${fcst.wshearSpd}节`;
        }
        
        // 能见度
        if (fcst.visib) {
            forecastInfo.visibility = translateVisibility(fcst.visib);
        }
        
        // 天气现象
        if (fcst.wxString) {
            forecastInfo.weather = translateWeatherPhenomena(fcst.wxString);
        }
        
        // 云层信息
        if (fcst.clouds && fcst.clouds.length > 0) {
            forecastInfo.clouds = fcst.clouds.map(cloud => translateCloudInfo(cloud)).join(', ');
        }
        
        // 温度信息
        if (fcst.temp && fcst.temp.length > 0) {
            const tempInfo = fcst.temp.map(t => {
                const time = new Date(t.validTime * 1000);
                const timeStr = formatDateTime(time);
                const type = t.maxOrMin === 'MAX' ? '最高' : '最低';
                return `${type}温度 ${t.sfcTemp}°C (${timeStr})`;
            });
            forecastInfo.temperature = tempInfo.join(', ');
        }
        
        // 积冰和颠簸
        if (fcst.icgTurb && fcst.icgTurb.length > 0) {
            const icgTurbInfo = fcst.icgTurb.map(it => {
                const type = it.var === 'ICG' ? '积冰' : '颠簸';
                const intensity = translateIntensity(it.intensity);
                return `${it.minAlt}-${it.maxAlt}英尺 ${intensity}${type}`;
            });
            forecastInfo.icingTurbulence = icgTurbInfo.join(', ');
        }
        
        return forecastInfo;
    });
}

/**
 * 翻译变化类型
 * @param {string} type - 变化类型代码
 * @returns {string} 中文翻译
 */
function translateChangeType(type) {
    const changeTypes = {
        'BECMG': '逐渐变为',
        'TEMPO': '临时变化',
        'PROB30': '30%概率',
        'PROB40': '40%概率',
        'FM': '从时间开始'
    };
    
    return changeTypes[type] || type;
}

/**
 * 翻译风向风速信息
 * @param {Object} wind - 风信息对象
 * @returns {string} 中文翻译
 */
function translateWindInfo(wind) {
    if (!wind) return '';
    
    let windStr = '';
    
    if (wind.direction === 'VRB') {
        windStr += '风向多变';
    } else if (wind.direction) {
        windStr += `风向 ${wind.direction}°`;
    }
    
    if (wind.speed) {
        windStr += ` 风速 ${wind.speed}节`;
    }
    
    if (wind.gust) {
        windStr += ` 阵风 ${wind.gust}节`;
    }
    
    return windStr;
}

/**
 * 翻译强度等级
 * @param {number} intensity - 强度等级
 * @returns {string} 中文翻译
 */
function translateIntensity(intensity) {
    const intensityLevels = {
        0: '无',
        1: '轻微',
        2: '轻度',
        3: '中度',
        4: '强度',
        5: '严重',
        6: '极强'
    };
    
    return intensityLevels[intensity] || `等级${intensity}`;
}

/**
 * 翻译能见度信息 - 增强版
 * @param {number|string} visibility - 能见度值
 * @returns {string} 中文翻译
 */
function translateVisibility(visibility) {
    if (!visibility && visibility !== 0) return '';
    
    // 处理特殊情况
    if (visibility === 'CAVOK') {
        return '云和能见度良好 (>10公里)';
    }
    
    if (visibility === 'P6SM') {
        return '能见度大于6海里 (>11公里)';
    }
    
    // 处理数字能见度
    const numVisibility = parseFloat(visibility);
    if (!isNaN(numVisibility)) {
        if (numVisibility >= 9999) {
            return '能见度10公里以上';
        } else if (numVisibility >= 1000) {
            return `能见度 ${(numVisibility/1000).toFixed(1)}公里`;
        } else {
            return `能见度 ${numVisibility}米`;
        }
    }
    
    return String(visibility);
}

/**
 * 使用METAR模块的翻译函数
 * 这些函数在METAR模块中已经定义
 */
function translateWeatherPhenomena(wx) {
    // 引用METAR模块的翻译函数
    if (typeof window !== 'undefined' && window.translateWeatherPhenomena) {
        return window.translateWeatherPhenomena(wx);
    }
    
    // 简化版本作为备用
    const weatherCodes = {
        'RA': '降雨', 'DZ': '毛毛雨', 'SN': '降雪', 'FG': '雾', 'BR': '轻雾',
        'HZ': '霾', 'TS': '雷暴', 'SH': '阵性', 'FZ': '冻结'
    };
    
    let translated = '';
    let intensity = '';
    
    if (wx.startsWith('-')) {
        intensity = '轻';
        wx = wx.substring(1);
    } else if (wx.startsWith('+')) {
        intensity = '强';
        wx = wx.substring(1);
    }
    
    for (let i = 0; i < wx.length; i += 2) {
        const code = wx.substring(i, i + 2);
        if (weatherCodes[code]) {
            translated += weatherCodes[code];
        }
    }
    
    return intensity + translated;
}

/**
 * 翻译云层信息
 */
function translateCloudInfo(cloud) {
    // 引用METAR模块的翻译函数
    if (typeof window !== 'undefined' && window.translateCloudInfo) {
        return window.translateCloudInfo(cloud);
    }
    
    // 简化版本作为备用
    const cloudCodes = {
        'SKC': '碧空无云', 'CLR': '晴朗无云', 'FEW': '少云',
        'SCT': '散云', 'BKN': '裂云', 'OVC': '阴天'
    };
    
    const match = cloud.match(/^(SKC|CLR|NSC|FEW|SCT|BKN|OVC|VV)(\d{3})?/);
    if (match) {
        const type = cloudCodes[match[1]] || match[1];
        const height = match[2] ? ` ${parseInt(match[2]) * 100}英尺` : '';
        return type + height;
    }
    
    return cloud;
}

// 导出函数供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fetchTafData,
        parseTafTime,
        parseTafChanges,
        translateChangeType,
        translateWindInfo,
        translateVisibility
    };
}

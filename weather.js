// 香港国际机场实时天气信息系统
// VAAHK - 虚拟香港机场管理局

// 全局变量
let currentWeatherType = 'metar'; // 'metar' 或 'taf'
let weatherData = {
    metar: null,
    taf: null
};

// 确保全局翻译函数可用
window.translateWeatherPhenomena = translateWeatherPhenomena;
window.translateCloudInfo = translateCloudInfo;

/**
 * 初始化天气组件
 */
function initWeatherSystem() {
    console.log('正在初始化中...');
    
    // 绑定切换按钮事件
    bindWeatherTypeButtons();
    
    // 首次加载METAR数据
    loadWeatherData();
    
    // 设置自动刷新 (每5分钟)
    setInterval(loadWeatherData, 5 * 60 * 1000);
    
    console.log('初始化完成');
}

/**
 * 绑定天气类型切换按钮事件
 */
function bindWeatherTypeButtons() {
    const metarBtn = document.getElementById('weather-metar-btn');
    const tafBtn = document.getElementById('weather-taf-btn');
    
    if (metarBtn) {
        metarBtn.addEventListener('click', () => switchWeatherType('metar'));
    }
    
    if (tafBtn) {
        tafBtn.addEventListener('click', () => switchWeatherType('taf'));
    }
}

/**
 * 切换天气类型显示
 * @param {string} type - 'metar' 或 'taf'
 */
function switchWeatherType(type) {
    currentWeatherType = type;
    
    // 更新按钮状态
    updateButtonStates();
    
    // 更新显示内容
    updateWeatherDisplay();
    
    // 如果该类型数据尚未加载，则立即加载
    if (!weatherData[type]) {
        loadWeatherData();
    }
}

/**
 * 更新按钮状态
 */
function updateButtonStates() {
    const metarBtn = document.getElementById('weather-metar-btn');
    const tafBtn = document.getElementById('weather-taf-btn');
    
    if (metarBtn && tafBtn) {
        metarBtn.classList.toggle('active', currentWeatherType === 'metar');
        tafBtn.classList.toggle('active', currentWeatherType === 'taf');
    }
}

/**
 * 加载天气数据
 */
async function loadWeatherData() {
    console.log('正在加载天气数据中...');
    
    // 显示加载状态
    showWeatherLoading();
    
    try {
        // 并行加载METAR和TAF数据
        const [metarResult, tafResult] = await Promise.all([
            fetchMetarData(),
            fetchTafData()
        ]);
        
        // 更新数据缓存
        if (metarResult.success) {
            weatherData.metar = metarResult.data;
            console.log('METAR数据加载成功');
        } else {
            console.error('METAR数据加载失败:', metarResult.error);
        }
        
        if (tafResult.success) {
            weatherData.taf = tafResult.data;
            console.log('TAF数据加载成功');
        } else {
            console.error('TAF数据加载失败:', tafResult.error);
        }
        
        // 更新显示
        updateWeatherDisplay();
        
        // 更新最后更新时间
        updateLastUpdateTime();
        
    } catch (error) {
        console.error('天气数据加载异常:', error);
        showWeatherError('数据加载失败，请稍后重试');
    }
}

/**
 * 显示加载状态
 */
function showWeatherLoading() {
    const displayArea = document.getElementById('weather-display');
    if (displayArea) {
        displayArea.innerHTML = `
            <div class="weather-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>正在加载${currentWeatherType.toUpperCase()}数据...</p>
            </div>
        `;
    }
}

/**
 * 显示错误信息
 * @param {string} message - 错误信息
 */
function showWeatherError(message) {
    const displayArea = document.getElementById('weather-display');
    if (displayArea) {
        displayArea.innerHTML = `
            <div class="weather-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
                <button class="btn" onclick="loadWeatherData()">重新加载</button>
            </div>
        `;
    }
}

/**
 * 更新天气显示
 */
function updateWeatherDisplay() {
    const data = weatherData[currentWeatherType];
    
    if (!data) {
        showWeatherError(`暂无${currentWeatherType.toUpperCase()}数据`);
        return;
    }
    
    if (currentWeatherType === 'metar') {
        displayMetarData(data);
    } else {
        displayTafData(data);
    }
}

/**
 * 显示METAR数据
 * @param {Object} data - METAR数据对象
 */
function displayMetarData(data) {
    const displayArea = document.getElementById('weather-display');
    if (!displayArea) return;
    
    // 解析观测时间
    const obsTime = parseMetarTime(data.obsTime || data.reportTime);
    const receiptTime = data.receiptTime ? parseMetarTime(data.receiptTime) : null;
    
    // 构建显示HTML
    let html = `
        <div class="weather-content">
            <div class="weather-header">
                <h4><i class="fas fa-cloud-sun"></i> 香港国际机场 (VHHH) - METAR</h4>
                <div class="weather-time">
                    <strong>观测时间：</strong>${obsTime}
                    ${receiptTime ? `<br><strong>接收时间：</strong>${receiptTime}` : ''}
                </div>
            </div>
            
            <div class="weather-section">
                <h5><i class="fas fa-file-alt"></i> 原始报文</h5>
                <div class="weather-raw">${data.rawOb || '数据不可用'}</div>
            </div>
            
            <div class="weather-section">
                <h5><i class="fas fa-info-circle"></i> 详细信息</h5>
                <div class="weather-details">
    `;
    
    // 添加基本信息
    html += `<div class="detail-item"><strong>机场：</strong>${data.name || '香港国际机场'} (${data.icaoId || 'VHHH'})</div>`;
    
    // 报告类型
    if (data.metarType) {
        const typeDesc = data.metarType === 'METAR' ? '定时天气报告' : '特殊天气报告';
        html += `<div class="detail-item"><strong>报告类型：</strong>${typeDesc}</div>`;
    }
    
    // 飞行类别
    if (data.fltCat) {
        const fltCatDesc = {
            'VFR': '目视飞行规则(VFR)',
            'MVFR': '边缘目视飞行规则(MVFR)', 
            'IFR': '仪表飞行规则(IFR)',
            'LIFR': '低仪表飞行规则(LIFR)'
        };
        html += `<div class="detail-item"><strong>飞行类别：</strong>${fltCatDesc[data.fltCat] || data.fltCat}</div>`;
    }
    
    // 风向风速
    if (data.wdir !== null && data.wspd !== null) {
        let windInfo = '';
        if (data.wdir === 'VRB' || data.wdir === 0) {
            windInfo = '风向多变';
        } else {
            windInfo = `风向 ${data.wdir}°`;
        }
        windInfo += `，风速 ${data.wspd}节`;
        if (data.wgst) {
            windInfo += `，阵风 ${data.wgst}节`;
        }
        html += `<div class="detail-item"><strong>地面风：</strong>${windInfo}</div>`;
    }
    
    // 能见度
    if (data.visib !== null && data.visib !== undefined) {
        let visibility = data.visib >= 9999 ? '10公里以上' : 
                        data.visib >= 1000 ? `${(data.visib/1000).toFixed(1)}公里` : `${data.visib}米`;
        html += `<div class="detail-item"><strong>能见度：</strong>${visibility}</div>`;
    }
    
    // 垂直能见度
    if (data.vertVis) {
        html += `<div class="detail-item"><strong>垂直能见度：</strong>${data.vertVis}英尺</div>`;
    }
    
    // 天气现象
    if (data.wxString) {
        const weatherDesc = typeof translateWeatherPhenomena === 'function' 
            ? translateWeatherPhenomena(data.wxString) 
            : data.wxString;
        html += `<div class="detail-item"><strong>天气现象：</strong>${weatherDesc}</div>`;
    }
    
    // 云层信息
    if (data.clouds && data.clouds.length > 0) {
        const cloudDesc = data.clouds.map(cloud => {
            return typeof translateCloudInfo === 'function' 
                ? translateCloudInfo(cloud) 
                : (cloud.cover + (cloud.base ? ` ${cloud.base}英尺` : ''));
        }).join(', ');
        html += `<div class="detail-item"><strong>云层：</strong>${cloudDesc}</div>`;
    }
    
    // 温度露点
    if (data.temp !== null && data.temp !== undefined) {
        let tempInfo = `温度 ${data.temp}°C`;
        if (data.dewp !== null && data.dewp !== undefined) {
            tempInfo += `，露点 ${data.dewp}°C`;
        }
        html += `<div class="detail-item"><strong>温度：</strong>${tempInfo}</div>`;
    }
    
    // 24小时最高最低温度
    if (data.maxT24 !== null || data.minT24 !== null) {
        let temp24Info = '';
        if (data.maxT24 !== null) temp24Info += `24小时最高 ${data.maxT24}°C`;
        if (data.minT24 !== null) {
            if (temp24Info) temp24Info += '，';
            temp24Info += `24小时最低 ${data.minT24}°C`;
        }
        html += `<div class="detail-item"><strong>24小时温度：</strong>${temp24Info}</div>`;
    }
    
    // 气压
    if (data.altim) {
        html += `<div class="detail-item"><strong>修正海平面气压：</strong>${data.altim} inHg`;
        if (data.slp) {
            html += ` (${data.slp} hPa)`;
        }
        html += `</div>`;
    }
    
    // 降水信息
    if (data.precip || data.pcp3hr || data.pcp6hr || data.pcp24hr) {
        let precipInfo = '';
        if (data.precip) precipInfo += `当前降水 ${data.precip}英寸`;
        if (data.pcp3hr) {
            if (precipInfo) precipInfo += '，';
            precipInfo += `3小时降水 ${data.pcp3hr}英寸`;
        }
        if (data.pcp6hr) {
            if (precipInfo) precipInfo += '，';
            precipInfo += `6小时降水 ${data.pcp6hr}英寸`;
        }
        if (data.pcp24hr) {
            if (precipInfo) precipInfo += '，';
            precipInfo += `24小时降水 ${data.pcp24hr}英寸`;
        }
        html += `<div class="detail-item"><strong>降水量：</strong>${precipInfo}</div>`;
    }
    
    // 积雪
    if (data.snow) {
        html += `<div class="detail-item"><strong>积雪深度：</strong>${data.snow}英寸</div>`;
    }
    
    // 气压趋势
    if (data.presTend) {
        html += `<div class="detail-item"><strong>气压趋势：</strong>${data.presTend} hPa</div>`;
    }
    
    html += `
                </div>
            </div>
        </div>
    `;
    
    displayArea.innerHTML = html;
}

/**
 * 显示TAF数据
 * @param {Object} data - TAF数据对象
 */
function displayTafData(data) {
    const displayArea = document.getElementById('weather-display');
    if (!displayArea) return;
    
    // 解析发布时间和有效时间
    const timeInfo = parseTafTime(data.issueTime, data.validTimeFrom, data.validTimeTo);
    
    // 构建显示HTML
    let html = `
        <div class="weather-content">
            <div class="weather-header">
                <h4><i class="fas fa-chart-line"></i> 香港国际机场 (VHHH) - TAF</h4>
                <div class="weather-time">
                    <strong>发布时间：</strong>${timeInfo.issue}<br>
                    <strong>有效时间：</strong>${timeInfo.valid}
                </div>
            </div>
            
            <div class="weather-section">
                <h5><i class="fas fa-file-alt"></i> 原始报文</h5>
                <div class="weather-raw">${data.rawTAF || '数据不可用'}</div>
            </div>
            
            <div class="weather-section">
                <h5><i class="fas fa-info-circle"></i> 基础预报信息</h5>
                <div class="weather-details">
    `;
    
    // 基础预报信息
    html += `<div class="detail-item"><strong>机场：</strong>${data.name || '香港国际机场'} (${data.icaoId || 'VHHH'})</div>`;
    
    // 是否为最新预报
    if (data.mostRecent === 1) {
        html += `<div class="detail-item"><strong>状态：</strong>最新预报</div>`;
    }
    
    // 备注信息
    if (data.remarks) {
        html += `<div class="detail-item"><strong>备注：</strong>${data.remarks}</div>`;
    }
    
    html += `
                </div>
            </div>
    `;
    
    // 处理预报组
    if (data.fcsts && data.fcsts.length > 0) {
        html += `
            <div class="weather-section">
                <h5><i class="fas fa-clock"></i> 分时段预报</h5>
                <div class="forecast-periods">
        `;
        
        data.fcsts.forEach((fcst, index) => {
            html += `
                <div class="forecast-period">
                    <h6>预报时段 ${index + 1}</h6>
                    <div class="weather-details">
            `;
            
            // 时间范围
            if (fcst.timeFrom && fcst.timeTo) {
                const fromTime = new Date(fcst.timeFrom * 1000);
                const toTime = new Date(fcst.timeTo * 1000);
                html += `<div class="detail-item"><strong>时间范围：</strong>${formatDateTime(fromTime)} 至 ${formatDateTime(toTime)}</div>`;
            }
            
            // 变化类型和概率
            if (fcst.fcstChange) {
                html += `<div class="detail-item"><strong>变化类型：</strong>${translateChangeType(fcst.fcstChange)}</div>`;
            }
            
            if (fcst.probability) {
                html += `<div class="detail-item"><strong>概率：</strong>${fcst.probability}%</div>`;
            }
            
            // 风向风速
            if (fcst.wdir !== null || fcst.wspd !== null) {
                let windInfo = '';
                if (fcst.wdir === 'VRB') {
                    windInfo = '风向多变';
                } else if (fcst.wdir) {
                    windInfo = `风向 ${fcst.wdir}°`;
                }
                
                if (fcst.wspd) {
                    if (windInfo) windInfo += '，';
                    windInfo += `风速 ${fcst.wspd}节`;
                }
                
                if (fcst.wgst) {
                    windInfo += `，阵风 ${fcst.wgst}节`;
                }
                
                if (windInfo) {
                    html += `<div class="detail-item"><strong>预报风力：</strong>${windInfo}</div>`;
                }
            }
            
            // 风切变
            if (fcst.wshearHgt && fcst.wshearDir && fcst.wshearSpd) {
                html += `<div class="detail-item"><strong>风切变：</strong>${fcst.wshearHgt}英尺高度，风向${fcst.wshearDir}°，风速${fcst.wshearSpd}节</div>`;
            }
            
            // 能见度
            if (fcst.visib) {
                const visibility = translateVisibility(fcst.visib);
                html += `<div class="detail-item"><strong>预报能见度：</strong>${visibility}</div>`;
            }
            
            // 垂直能见度
            if (fcst.vertVis) {
                html += `<div class="detail-item"><strong>垂直能见度：</strong>${fcst.vertVis}英尺</div>`;
            }
            
            // 天气现象
            if (fcst.wxString) {
                const weatherDesc = typeof translateWeatherPhenomena === 'function' 
                    ? translateWeatherPhenomena(fcst.wxString) 
                    : fcst.wxString;
                html += `<div class="detail-item"><strong>预报天气：</strong>${weatherDesc}</div>`;
            }
            
            // 云层信息
            if (fcst.clouds && fcst.clouds.length > 0) {
                const cloudDesc = fcst.clouds.map(cloud => {
                    return typeof translateCloudInfo === 'function' 
                        ? translateCloudInfo(cloud) 
                        : (cloud.cover + (cloud.base ? ` ${cloud.base}英尺` : ''));
                }).join(', ');
                html += `<div class="detail-item"><strong>预报云层：</strong>${cloudDesc}</div>`;
            }
            
            // 温度信息
            if (fcst.temp && fcst.temp.length > 0) {
                fcst.temp.forEach(t => {
                    const time = new Date(t.validTime * 1000);
                    const timeStr = formatDateTime(time);
                    const type = t.maxOrMin === 'MAX' ? '最高' : '最低';
                    html += `<div class="detail-item"><strong>${type}温度：</strong>${t.sfcTemp}°C (${timeStr})</div>`;
                });
            }
            
            // 积冰和颠簸
            if (fcst.icgTurb && fcst.icgTurb.length > 0) {
                fcst.icgTurb.forEach(it => {
                    const type = it.var === 'ICG' ? '积冰' : 
                               it.var === 'TURB' ? '颠簸' : it.var;
                    const intensity = translateIntensity(it.intensity);
                    html += `<div class="detail-item"><strong>${type}：</strong>${it.minAlt}-${it.maxAlt}英尺 ${intensity}</div>`;
                });
            }
            
            // 未解码信息
            if (fcst.notDecoded) {
                html += `<div class="detail-item"><strong>其他信息：</strong>${fcst.notDecoded}</div>`;
            }
            
            html += `
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    html += `
        </div>
    `;
    
    displayArea.innerHTML = html;
}

/**
 * 更新最后更新时间
 */
function updateLastUpdateTime() {
    const timeElement = document.getElementById('weather-last-update');
    if (timeElement) {
        const now = new Date();
        const year = now.getUTCFullYear();
        const month = String(now.getUTCMonth() + 1).padStart(2, '0');
        const day = String(now.getUTCDate()).padStart(2, '0');
        const hours = String(now.getUTCHours()).padStart(2, '0');
        const minutes = String(now.getUTCMinutes()).padStart(2, '0');
        
        const timeStr = `${year}-${month}-${day} ${hours}:${minutes} UTC`;
        timeElement.textContent = `最后更新：${timeStr}`;
    }
}

/**
 * 手动刷新数据
 */
function refreshWeatherData() {
    console.log('手动刷新天气数据');
    loadWeatherData();
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 延迟初始化，确保相关元素已加载
    setTimeout(initWeatherSystem, 500);
});

// 导出函数供全局使用
window.initWeatherSystem = initWeatherSystem;
window.switchWeatherType = switchWeatherType;
window.refreshWeatherData = refreshWeatherData;

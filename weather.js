// 香港国际机场实时METAR和TAF显示功能
// 使用 Aviation Weather Center API

const WEATHER_CONFIG = {
    metarUrl: 'https://aviationweather.gov/api/data/metar?ids=VHHH&format=raw',
    tafUrl: 'https://aviationweather.gov/api/data/taf?ids=VHHH&format=raw',
    updateInterval: 300000, // 5分钟更新一次
    airport: 'VHHH'
};

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeWeatherWidget();
});

function initializeWeatherWidget() {
    // 绑定选项卡切换事件
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            switchWeatherTab(this.dataset.tab);
        });
    });

    // 初始加载数据
    loadWeatherData();
    
    // 定期更新数据
    setInterval(loadWeatherData, WEATHER_CONFIG.updateInterval);
}

function switchWeatherTab(tabName) {
    // 更新选项卡按钮状态
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // 更新内容显示
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-content`).classList.add('active');
}

async function loadWeatherData() {
    try {
        // 显示加载状态
        showLoadingState();
        
        // 并行获取METAR和TAF数据
        const [metarData, tafData] = await Promise.allSettled([
            fetchWeatherData(WEATHER_CONFIG.metarUrl),
            fetchWeatherData(WEATHER_CONFIG.tafUrl)
        ]);

        // 处理METAR数据
        if (metarData.status === 'fulfilled' && metarData.value) {
            displayMETAR(metarData.value);
        } else {
            displayError('metar', '无法获取METAR数据，请稍后再试');
        }

        // 处理TAF数据
        if (tafData.status === 'fulfilled' && tafData.value) {
            displayTAF(tafData.value);
        } else {
            displayError('taf', '无法获取TAF数据，请稍后再试');
        }

    } catch (error) {
        console.error('Weather data loading error:', error);
        displayError('both', '获取天气数据时发生错误');
    }
}

async function fetchWeatherData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
}

function showLoadingState() {
    const metarContent = document.getElementById('metar-content');
    const tafContent = document.getElementById('taf-content');
    
    if (metarContent) {
        metarContent.innerHTML = '<div class="weather-loading">正在加载METAR数据...</div>';
    }
    if (tafContent) {
        tafContent.innerHTML = '<div class="weather-loading">正在加载TAF数据...</div>';
    }
}

function displayMETAR(data) {
    const container = document.getElementById('metar-content');
    if (!container || !data || data.length === 0) {
        displayError('metar', '暂无METAR数据');
        return;
    }

    const metar = data[0]; // VHHH机场应该只有一条记录
    const formattedTime = formatTime(metar.obsTime);
    
    container.innerHTML = `
        <div class="weather-data-container">
            <div class="weather-header-info">
                <h4><i class="fas fa-plane"></i> ${metar.name || '香港国际机场'} (VHHH)</h4>
                <p class="weather-time">报告时间: ${formattedTime} UTC</p>
            </div>
            
            <div class="weather-grid">
                <div class="weather-item">
                    <span class="weather-label">天气状况:</span>
                    <span class="weather-value">${metar.rawOb || 'N/A'}</span>
                </div>
                
                <div class="weather-item">
                    <span class="weather-label">温度:</span>
                    <span class="weather-value">${metar.temp !== null ? metar.temp + '°C' : 'N/A'}</span>
                </div>
                
                <div class="weather-item">
                    <span class="weather-label">露点:</span>
                    <span class="weather-value">${metar.dewp !== null ? metar.dewp + '°C' : 'N/A'}</span>
                </div>
                
                <div class="weather-item">
                    <span class="weather-label">风向风速:</span>
                    <span class="weather-value">${metar.wdir !== null ? metar.wdir + '°' : 'VRB'} ${metar.wspd !== null ? metar.wspd + 'KT' : 'N/A'}${metar.wgst ? ' G' + metar.wgst + 'KT' : ''}</span>
                </div>
                
                <div class="weather-item">
                    <span class="weather-label">能见度:</span>
                    <span class="weather-value">${metar.visib !== null ? metar.visib + 'SM' : 'N/A'}</span>
                </div>
                
                <div class="weather-item">
                    <span class="weather-label">气压:</span>
                    <span class="weather-value">${metar.altim !== null ? metar.altim + 'hPa' : 'N/A'}</span>
                </div>
                
                <div class="weather-item">
                    <span class="weather-label">天气现象:</span>
                    <span class="weather-value">${metar.wxString || 'N/A'}</span>
                </div>
                
                <div class="weather-item">
                    <span class="weather-label">飞行分类:</span>
                    <span class="weather-value flight-category">${metar.fltCat || 'N/A'}</span>
                </div>
            </div>
            
            <div class="weather-updated">
                <small>数据更新时间: ${formatTime(Date.now() / 1000)} UTC | 来源: Aviation Weather Center</small>
            </div>
        </div>
    `;
}

function displayTAF(data) {
    const container = document.getElementById('taf-content');
    if (!container || !data || data.length === 0) {
        displayError('taf', '暂无TAF数据');
        return;
    }

    const taf = data[0]; // VHHH机场应该只有一条记录
    const validFrom = formatTime(taf.validTimeFrom);
    const validTo = formatTime(taf.validTimeTo);
    const issueTime = formatTime(Date.parse(taf.issueTime) / 1000);
    
    let forecastHTML = '';
    if (taf.fcsts && taf.fcsts.length > 0) {
        forecastHTML = taf.fcsts.map(forecast => `
            <div class="forecast-item">
                <div class="forecast-header">
                    <h5>预报时段: ${formatTime(forecast.timeFrom)} - ${formatTime(forecast.timeTo)}</h5>
                    ${forecast.probability ? `<span class="probability">${forecast.probability}%</span>` : ''}
                </div>
                <div class="forecast-details">
                    <div class="weather-item">
                        <span class="weather-label">风向风速:</span>
                        <span class="weather-value">${forecast.wdir || 'VRB'} ${forecast.wspd || 'N/A'}${forecast.wgst ? ' G' + forecast.wgst + 'KT' : ''}</span>
                    </div>
                    <div class="weather-item">
                        <span class="weather-label">能见度:</span>
                        <span class="weather-value">${forecast.visib ? forecast.visib + 'SM' : 'N/A'}</span>
                    </div>
                    <div class="weather-item">
                        <span class="weather-label">天气现象:</span>
                        <span class="weather-value">${forecast.wxString || 'N/A'}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    container.innerHTML = `
        <div class="weather-data-container">
            <div class="weather-header-info">
                <h4><i class="fas fa-chart-line"></i> ${taf.name || '香港国际机场'} (VHHH)</h4>
                <p class="weather-time">发布时间: ${issueTime} UTC</p>
                <p class="weather-time">有效时间: ${validFrom} - ${validTo} UTC</p>
            </div>
            
            <div class="weather-grid">
                <div class="weather-item full-width">
                    <span class="weather-label">TAF原文:</span>
                    <div class="taf-raw">${taf.rawTAF || 'N/A'}</div>
                </div>
                
                <div class="weather-item full-width">
                    <span class="weather-label">预报详情:</span>
                    <div class="forecast-container">
                        ${forecastHTML || '暂无详细预报信息'}
                    </div>
                </div>
            </div>
            
            <div class="weather-updated">
                <small>数据更新时间: ${formatTime(Date.now() / 1000)} UTC | 来源: Aviation Weather Center</small>
            </div>
        </div>
    `;
}

function displayError(type, message) {
    if (type === 'metar') {
        const container = document.getElementById('metar-content');
        if (container) {
            container.innerHTML = `<div class="weather-error"><i class="fas fa-exclamation-triangle"></i> ${message}</div>`;
        }
    } else if (type === 'taf') {
        const container = document.getElementById('taf-content');
        if (container) {
            container.innerHTML = `<div class="weather-error"><i class="fas fa-exclamation-triangle"></i> ${message}</div>`;
        }
    } else {
        // both
        document.getElementById('metar-content').innerHTML = `<div class="weather-error"><i class="fas fa-exclamation-triangle"></i> ${message}</div>`;
        document.getElementById('taf-content').innerHTML = `<div class="weather-error"><i class="fas fa-exclamation-triangle"></i> ${message}</div>`;
    }
}

function formatTime(timestamp) {
    if (!timestamp) return 'N/A';
    
    const date = new Date(timestamp * 1000);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 错误处理和重试机制
function handleApiError(error, retryCount = 0) {
    const maxRetries = 3;
    
    if (retryCount < maxRetries) {
        console.log(`Retrying weather data fetch (attempt ${retryCount + 1}/${maxRetries})...`);
        setTimeout(() => {
            loadWeatherData();
        }, 5000 * (retryCount + 1)); // 递增延迟
    } else {
        console.error('Failed to fetch weather data after maximum retries:', error);
        displayError('both', '无法获取天气数据，请检查网络连接或稍后重试');
    }
}
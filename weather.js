// 当前活动标签
let currentTab = 'metar';

// API端点
const METAR_API_URL = '/api/metar';
const TAF_API_URL = '/api/taf';

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    loadWeatherData();
    startAutoRefresh();
});

// 时间格式化函数
function formatToAviatimeTime(dateString) {
    if (!dateString) return '未知';
    
    try {
        const date = new Date(dateString);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day} UTC${hours}${minutes}`;
    } catch (e) {
        return dateString;
    }
}

// 能见度转换函数（英里转公里）
function convertVisibilityToKm(visibilityInfo) {
    if (!visibilityInfo || visibilityInfo === '未知') return '未知';
    
    if (visibilityInfo.includes('大于6英里')) {
        return '大于10公里';
    } else if (visibilityInfo.includes('大于10英里')) {
        return '大于16公里';
    } else if (visibilityInfo.includes('英里')) {
        const match = visibilityInfo.match(/(\d+(?:\.\d+)?)\s*英里/);
        if (match) {
            const miles = parseFloat(match[1]);
            const km = (miles * 1.60934).toFixed(1);
            return `${km}公里`;
        }
    }
    
    return visibilityInfo;
}

// 加载天气数据
async function loadWeatherData() {
    const loading = document.getElementById('weather-loading');
    const error = document.getElementById('weather-error');
    
    // 显示加载状态
    loading.style.display = 'block';
    error.style.display = 'none';
    document.getElementById('metar-content').style.display = 'none';
    document.getElementById('taf-content').style.display = 'none';

    try {
        console.log('开始获取天气数据...');

        const [metarResponse, tafResponse] = await Promise.all([
            fetch(METAR_API_URL),
            fetch(TAF_API_URL)
        ]);

        if (!metarResponse.ok) {
            throw new Error(`METAR API错误: ${metarResponse.status} ${metarResponse.statusText}`);
        }
        if (!tafResponse.ok) {
            throw new Error(`TAF API错误: ${tafResponse.status} ${tafResponse.statusText}`);
        }

        const metarData = await metarResponse.json();
        const tafData = await tafResponse.json();

        // 更新显示数据
        updateMetarDisplay(metarData.data);
        updateTafDisplay(tafData.data);
        
        // 隐藏加载状态，显示当前标签
        loading.style.display = 'none';
        showTab(currentTab);

    } catch (err) {
        console.error('天气数据加载失败:', err);
        loading.style.display = 'none';
        error.style.display = 'block';
        error.innerHTML = `
            <div class="error-message">
                <h4>数据加载失败</h4>
                <p><strong>错误详情:</strong> ${err.message}</p>
                <button onclick="loadWeatherData()" class="retry-btn">重试</button>
            </div>
        `;
    }
}

// 更新METAR显示
function updateMetarDisplay(data) {
    if (!data) {
        document.getElementById('metar-observation-time').textContent = '无数据';
        return;
    }

    // 更新各个字段
    document.getElementById('metar-observation-time').textContent = formatToAviatimeTime(data.basicInfo?.observationTime);
    document.getElementById('metar-airport-info').textContent = '香港国际机场 (VHHH)';
    document.getElementById('metar-wind').textContent = data.wind?.info || '无风向数据';
    document.getElementById('metar-visibility').textContent = convertVisibilityToKm(data.visibility?.info);
    document.getElementById('metar-clouds').textContent = data.clouds?.info || '无云况数据';
    document.getElementById('metar-temperature').textContent = data.temperature?.current || '未知';
    document.getElementById('metar-dewpoint').textContent = data.temperature?.dewPoint || '未知';
    document.getElementById('metar-pressure').textContent = data.pressure?.info || '未知';
    document.getElementById('metar-raw-text').textContent = data.rawText || '无原始数据';
    document.getElementById('metar-update-time').textContent = data.lastUpdate ? new Date(data.lastUpdate).toLocaleString('zh-CN') : '未知';

    // 天气现象（可选显示）
    const weatherRow = document.getElementById('metar-weather-row');
    const weatherElement = document.getElementById('metar-weather');
    if (data.weather?.phenomena) {
        weatherElement.textContent = data.weather.phenomena;
        weatherRow.style.display = 'grid';
    } else {
        weatherRow.style.display = 'none';
    }

    // 飞行条件（带颜色和说明）
    const flightCategoryElement = document.getElementById('metar-flight-category');
    const category = data.flightCategory?.category || '未知';
    const rawCategory = data.flightCategory?.rawCategory?.toLowerCase() || 'unknown';
    
    // 添加详细说明
    let categoryWithDescription = category;
    switch(rawCategory) {
        case 'vfr':
            categoryWithDescription = '目视飞行规则 (VFR) - 天气良好';
            break;
        case 'mvfr':
            categoryWithDescription = '边际目视飞行 (MVFR) - 天气一般';
            break;
        case 'ifr':
            categoryWithDescription = '仪表飞行规则 (IFR) - 天气较差';
            break;
        case 'lifr':
            categoryWithDescription = '低仪表飞行 (LIFR) - 天气很差';
            break;
    }
    
    flightCategoryElement.textContent = categoryWithDescription;
    flightCategoryElement.className = `value flight-cat-${rawCategory}`;
}

// 更新TAF显示
function updateTafDisplay(data) {
    if (!data) {
        document.getElementById('taf-issue-time').textContent = '无数据';
        return;
    }

    // 更新基本信息
    document.getElementById('taf-issue-time').textContent = formatToAviatimeTime(data.basicInfo?.issueTime);
    document.getElementById('taf-valid-range').textContent = data.basicInfo?.validRange || '未知';
    document.getElementById('taf-airport-info').textContent = '香港国际机场 (VHHH)';
    document.getElementById('taf-summary').textContent = data.summary?.text || '无预报摘要';
    document.getElementById('taf-raw-text').textContent = data.rawText || '无原始数据';
    document.getElementById('taf-update-time').textContent = data.lastUpdate ? new Date(data.lastUpdate).toLocaleString('zh-CN') : '未知';

    // 更新预报段
    const forecastContainer = document.getElementById('taf-forecast-periods');
    if (data.forecastPeriods && data.forecastPeriods.length > 0) {
        forecastContainer.innerHTML = data.forecastPeriods.map(period => `
            <div class="forecast-period">
                <h5>预报段 ${period.periodIndex} ${period.changeType ? `(${period.changeType})` : ''}</h5>
                <div class="period-info">
                    <div class="info-row">
                        <span class="label">时间范围:</span>
                        <span class="value">${period.timeRange}</span>
                    </div>
                    ${period.becomeTime ? `
                    <div class="info-row">
                        <span class="label">变化时间:</span>
                        <span class="value">${period.becomeTime}</span>
                    </div>
                    ` : ''}
                    ${period.probability ? `
                    <div class="info-row">
                        <span class="label">概率:</span>
                        <span class="value">${period.probability}</span>
                    </div>
                    ` : ''}
                    <div class="info-row">
                        <span class="label">风向风速:</span>
                        <span class="value">${period.wind.info}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">能见度:</span>
                        <span class="value">${convertVisibilityToKm(period.visibility.info)}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">云况:</span>
                        <span class="value">${period.clouds.info}</span>
                    </div>
                    ${period.temperature.info.length > 0 ? `
                    <div class="info-row">
                        <span class="label">温度预报:</span>
                        <span class="value">${period.temperature.info.join('; ')}</span>
                    </div>
                    ` : ''}
                    ${period.wind.shear ? `
                    <div class="info-row">
                        <span class="label">风切变:</span>
                        <span class="value">${period.wind.shear}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    } else {
        forecastContainer.innerHTML = '<p>无预报时段数据</p>';
    }
}

// 切换标签
function switchTab(tab) {
    currentTab = tab;
    showTab(tab);
}

// 显示指定标签
function showTab(tab) {
    // 更新标签样式
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('active');
    
    // 显示对应内容
    document.getElementById('metar-content').style.display = tab === 'metar' ? 'block' : 'none';
    document.getElementById('taf-content').style.display = tab === 'taf' ? 'block' : 'none';
}

// 自动刷新
function startAutoRefresh() {
    setInterval(() => {
        loadWeatherData();
    }, 5 * 60 * 1000); // 5分钟刷新一次
}        `;
    }
}

// 更新METAR显示
function updateMetarDisplay(data) {
    if (!data) {
        document.getElementById('metar-observation-time').textContent = '无数据';
        return;
    }

    // 更新各个字段
    document.getElementById('metar-observation-time').textContent = data.basicInfo?.observationTime || '未知';
    document.getElementById('metar-airport-info').textContent = data.basicInfo?.stationName || '香港国际机场 (VHHH)';
    document.getElementById('metar-report-type').textContent = data.basicInfo?.metarType || '未知';
    document.getElementById('metar-wind').textContent = data.wind?.info || '无风向数据';
    document.getElementById('metar-visibility').textContent = data.visibility?.info || '未知';
    document.getElementById('metar-clouds').textContent = data.clouds?.info || '无云况数据';
    document.getElementById('metar-temperature').textContent = data.temperature?.current || '未知';
    document.getElementById('metar-dewpoint').textContent = data.temperature?.dewPoint || '未知';
    document.getElementById('metar-pressure').textContent = data.pressure?.info || '未知';
    document.getElementById('metar-elevation').textContent = data.basicInfo?.coordinates?.elevation || '9米';
    document.getElementById('metar-raw-text').textContent = data.rawText || '无原始数据';
    document.getElementById('metar-update-time').textContent = data.lastUpdate ? new Date(data.lastUpdate).toLocaleString('zh-CN') : '未知';

    // 天气现象（可选显示）
    const weatherRow = document.getElementById('metar-weather-row');
    const weatherElement = document.getElementById('metar-weather');
    if (data.weather?.phenomena) {
        weatherElement.textContent = data.weather.phenomena;
        weatherRow.style.display = 'grid';
    } else {
        weatherRow.style.display = 'none';
    }

    // 飞行条件（带颜色和说明）
    const flightCategoryElement = document.getElementById('metar-flight-category');
    const category = data.flightCategory?.category || '未知';
    const rawCategory = data.flightCategory?.rawCategory?.toLowerCase() || 'unknown';
    
    // 添加详细说明
    let categoryWithDescription = category;
    switch(rawCategory) {
        case 'vfr':
            categoryWithDescription = '目视飞行规则 (VFR) - 天气良好';
            break;
        case 'mvfr':
            categoryWithDescription = '边际目视飞行 (MVFR) - 天气一般';
            break;
        case 'ifr':
            categoryWithDescription = '仪表飞行规则 (IFR) - 天气较差';
            break;
        case 'lifr':
            categoryWithDescription = '低仪表飞行 (LIFR) - 天气很差';
            break;
    }
    
    flightCategoryElement.textContent = categoryWithDescription;
    flightCategoryElement.className = `value flight-cat-${rawCategory}`;
}

// 更新TAF显示
function updateTafDisplay(data) {
    if (!data) {
        document.getElementById('taf-issue-time').textContent = '无数据';
        return;
    }

    // 更新基本信息
    document.getElementById('taf-issue-time').textContent = data.basicInfo?.issueTime || '未知';
    document.getElementById('taf-valid-range').textContent = data.basicInfo?.validRange || '未知';
    document.getElementById('taf-airport-info').textContent = data.basicInfo?.stationName || '香港国际机场 (VHHH)';
    document.getElementById('taf-summary').textContent = data.summary?.text || '无预报摘要';
    document.getElementById('taf-periods-count').textContent = `${data.summary?.periodsCount || 0} 个时段`;
    document.getElementById('taf-raw-text').textContent = data.rawText || '无原始数据';
    document.getElementById('taf-update-time').textContent = data.lastUpdate ? new Date(data.lastUpdate).toLocaleString('zh-CN') : '未知';

    // 更新预报段
    const forecastContainer = document.getElementById('taf-forecast-periods');
    if (data.forecastPeriods && data.forecastPeriods.length > 0) {
        forecastContainer.innerHTML = data.forecastPeriods.map(period => `
            <div class="forecast-period">
                <h5>预报段 ${period.periodIndex} ${period.changeType ? `(${period.changeType})` : ''}</h5>
                <div class="period-info">
                    <div class="info-row">
                        <span class="label">时间范围:</span>
                        <span class="value">${period.timeRange}</span>
                    </div>
                    ${period.becomeTime ? `
                    <div class="info-row">
                        <span class="label">变化时间:</span>
                        <span class="value">${period.becomeTime}</span>
                    </div>
                    ` : ''}
                    ${period.probability ? `
                    <div class="info-row">
                        <span class="label">概率:</span>
                        <span class="value">${period.probability}</span>
                    </div>
                    ` : ''}
                    <div class="info-row">
                        <span class="label">风向风速:</span>
                        <span class="value">${period.wind.info}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">能见度:</span>
                        <span class="value">${period.visibility.info}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">云况:</span>
                        <span class="value">${period.clouds.info}</span>
                    </div>
                    ${period.temperature.info.length > 0 ? `
                    <div class="info-row">
                        <span class="label">温度预报:</span>
                        <span class="value">${period.temperature.info.join('; ')}</span>
                    </div>
                    ` : ''}
                    ${period.wind.shear ? `
                    <div class="info-row">
                        <span class="label">风切变:</span>
                        <span class="value">${period.wind.shear}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    } else {
        forecastContainer.innerHTML = '<p>无预报时段数据</p>';
    }
}

// 切换标签
function switchTab(tab) {
    currentTab = tab;
    showTab(tab);
}

// 显示指定标签
function showTab(tab) {
    // 更新标签样式
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('active');
    
    // 显示对应内容
    document.getElementById('metar-content').style.display = tab === 'metar' ? 'block' : 'none';
    document.getElementById('taf-content').style.display = tab === 'taf' ? 'block' : 'none';
}

// 自动刷新
function startAutoRefresh() {
    setInterval(() => {
        loadWeatherData();
    }, 5 * 60 * 1000); // 5分钟刷新一次
}

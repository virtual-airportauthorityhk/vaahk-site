// 全局变量
let currentTab = 'metar';
let isLoading = false;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成，开始初始化天气组件');
    initWeatherWidget();
});

// 初始化天气组件
function initWeatherWidget() {
    console.log('初始化天气组件');
    
    // 确保DOM元素存在
    const loading = document.getElementById('weather-loading');
    const error = document.getElementById('weather-error');
    
    if (!loading || !error) {
        console.error('关键DOM元素不存在');
        return;
    }
    
    // 立即允许标签切换
    showTab('metar');
    
    // 1秒后开始加载数据
    setTimeout(() => {
        loadWeatherData();
    }, 1000);
    
    // 启动自动刷新
    setInterval(() => {
        if (!isLoading) {
            loadWeatherData();
        }
    }, 5 * 60 * 1000);
}

// 切换标签 - 独立函数，不依赖数据加载
function switchTab(tab) {
    console.log('切换到标签:', tab);
    currentTab = tab;
    showTab(tab);
}

// 显示指定标签
function showTab(tab) {
    console.log('显示标签:', tab);
    
    // 更新标签样式
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 激活当前标签
    const activeButton = document.querySelector(`[onclick*="${tab}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // 显示对应内容
    const metarContent = document.getElementById('metar-content');
    const tafContent = document.getElementById('taf-content');
    
    if (metarContent && tafContent) {
        metarContent.style.display = tab === 'metar' ? 'block' : 'none';
        tafContent.style.display = tab === 'taf' ? 'block' : 'none';
    }
}

// 加载天气数据
async function loadWeatherData() {
    if (isLoading) {
        console.log('正在加载中，跳过重复请求');
        return;
    }
    
    isLoading = true;
    console.log('开始加载天气数据');
    
    const loading = document.getElementById('weather-loading');
    const error = document.getElementById('weather-error');
    
    // 显示加载状态
    if (loading) loading.style.display = 'block';
    if (error) error.style.display = 'none';
    
    try {
        console.log('正在请求METAR数据...');
        const metarResponse = await fetch('/api/metar');
        console.log('METAR响应状态:', metarResponse.status);
        
        console.log('正在请求TAF数据...');
        const tafResponse = await fetch('/api/taf');
        console.log('TAF响应状态:', tafResponse.status);
        
        if (!metarResponse.ok) {
            throw new Error(`METAR API错误: ${metarResponse.status}`);
        }
        if (!tafResponse.ok) {
            throw new Error(`TAF API错误: ${tafResponse.status}`);
        }
        
        const metarData = await metarResponse.json();
        const tafData = await tafResponse.json();
        
        console.log('METAR数据:', metarData);
        console.log('TAF数据:', tafData);
        
        // 更新显示
        updateMetarDisplay(metarData.data);
        updateTafDisplay(tafData.data);
        
        // 隐藏加载状态
        if (loading) loading.style.display = 'none';
        
        // 显示当前标签
        showTab(currentTab);
        
    } catch (err) {
        console.error('加载天气数据失败:', err);
        
        if (loading) loading.style.display = 'none';
        if (error) {
            error.style.display = 'block';
            error.innerHTML = `
                <div class="error-message">
                    <h4>❌ 数据加载失败</h4>
                    <p><strong>错误详情:</strong> ${err.message}</p>
                    <button onclick="loadWeatherData()" class="retry-btn">重试</button>
                </div>
            `;
        }
    }
    
    isLoading = false;
}

// 更新METAR显示
function updateMetarDisplay(data) {
    console.log('更新METAR显示:', data);
    
    if (!data) {
        console.warn('METAR数据为空');
        return;
    }
    
    // 更新基本信息
    safeUpdateElement('metar-observation-time', data.basicInfo?.observationTime || '未知');
    safeUpdateElement('metar-airport-info', '香港国际机场 (VHHH)');
    safeUpdateElement('metar-wind', data.wind?.info || '无风向数据');
    safeUpdateElement('metar-visibility', data.visibility?.info || '未知');
    safeUpdateElement('metar-clouds', data.clouds?.info || '无云况数据');
    safeUpdateElement('metar-temperature', data.temperature?.current || '未知');
    safeUpdateElement('metar-dewpoint', data.temperature?.dewPoint || '未知');
    safeUpdateElement('metar-pressure', data.pressure?.info || '未知');
    safeUpdateElement('metar-raw-text', data.rawText || '无原始数据');
    safeUpdateElement('metar-update-time', new Date().toLocaleString('zh-CN'));
    
    // 处理天气现象
    const weatherRow = document.getElementById('metar-weather-row');
    const weatherElement = document.getElementById('metar-weather');
    if (data.weather?.phenomena && weatherElement && weatherRow) {
        weatherElement.textContent = data.weather.phenomena;
        weatherRow.style.display = 'grid';
    } else if (weatherRow) {
        weatherRow.style.display = 'none';
    }
    
    // 处理飞行条件
    const flightElement = document.getElementById('metar-flight-category');
    if (flightElement && data.flightCategory) {
        let categoryText = data.flightCategory.category || '未知';
        const rawCategory = data.flightCategory.rawCategory?.toLowerCase() || 'unknown';
        
        // 添加详细说明
        switch(rawCategory) {
            case 'vfr':
                categoryText = '目视飞行规则 (VFR) - 天气良好';
                break;
            case 'mvfr':
                categoryText = '边际目视飞行 (MVFR) - 天气一般';
                break;
            case 'ifr':
                categoryText = '仪表飞行规则 (IFR) - 天气较差';
                break;
            case 'lifr':
                categoryText = '低仪表飞行 (LIFR) - 天气很差';
                break;
        }
        
        flightElement.textContent = categoryText;
        flightElement.className = `value flight-cat-${rawCategory}`;
    }
}

// 更新TAF显示
function updateTafDisplay(data) {
    console.log('更新TAF显示:', data);
    
    if (!data) {
        console.warn('TAF数据为空');
        return;
    }
    
    // 更新基本信息
    safeUpdateElement('taf-issue-time', data.basicInfo?.issueTime || '未知');
    safeUpdateElement('taf-valid-range', data.basicInfo?.validRange || '未知');
    safeUpdateElement('taf-airport-info', '香港国际机场 (VHHH)');
    safeUpdateElement('taf-summary', data.summary?.text || '无预报摘要');
    safeUpdateElement('taf-raw-text', data.rawText || '无原始数据');
    safeUpdateElement('taf-update-time', new Date().toLocaleString('zh-CN'));
    
    // 更新预报段
    const forecastContainer = document.getElementById('taf-forecast-periods');
    if (forecastContainer) {
        if (data.forecastPeriods && data.forecastPeriods.length > 0) {
            forecastContainer.innerHTML = data.forecastPeriods.map(period => `
                <div class="forecast-period">
                    <h5>预报段 ${period.periodIndex} ${period.changeType ? `(${period.changeType})` : ''}</h5>
                    <div class="period-info">
                        <div class="info-row">
                            <span class="label">风向风速:</span>
                            <span class="value">${period.wind?.info || '无数据'}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">能见度:</span>
                            <span class="value">${period.visibility?.info || '无数据'}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">云况:</span>
                            <span class="value">${period.clouds?.info || '无数据'}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            forecastContainer.innerHTML = '<p>无预报时段数据</p>';
        }
    }
}

// 安全更新DOM元素
function safeUpdateElement(id, content) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = content;
    } else {
        console.warn(`元素 ${id} 不存在`);
    }
}    }
    
    isLoading = true;
    console.log('开始加载天气数据');
    
    const loading = document.getElementById('weather-loading');
    const error = document.getElementById('weather-error');
    const metarContent = document.getElementById('metar-content');
    const tafContent = document.getElementById('taf-content');
    
    // 显示加载状态
    if (loading) loading.style.display = 'block';
    if (error) error.style.display = 'none';
    
    try {
        console.log('正在请求API数据...');
        
        // 分别加载METAR和TAF，避免同时失败
        const metarPromise = fetch('/api/metar').then(r => r.json()).catch(e => {
            console.error('METAR加载失败:', e);
            return { success: false, error: e.message };
        });
        
        const tafPromise = fetch('/api/taf').then(r => r.json()).catch(e => {
            console.error('TAF加载失败:', e);
            return { success: false, error: e.message };
        });
        
        const [metarResult, tafResult] = await Promise.all([metarPromise, tafPromise]);
        
        console.log('METAR结果:', metarResult);
        console.log('TAF结果:', tafResult);
        
        // 更新METAR显示
        if (metarResult.success) {
            updateMetarDisplay(metarResult.data);
        } else {
            console.error('METAR数据加载失败:', metarResult.error);
            updateMetarError(metarResult.error);
        }
        
        // 更新TAF显示
        if (tafResult.success) {
            updateTafDisplay(tafResult.data);
        } else {
            console.error('TAF数据加载失败:', tafResult.error);
            updateTafError(tafResult.error);
        }
        
        // 隐藏加载状态
        if (loading) loading.style.display = 'none';
        
        // 显示当前标签
        showTab(currentTab);
        
    } catch (err) {
        console.error('加载天气数据失败:', err);
        
        if (loading) loading.style.display = 'none';
        if (error) {
            error.style.display = 'block';
            error.innerHTML = `
                <div class="error-message">
                    <h4>❌ 数据加载失败</h4>
                    <p><strong>错误详情:</strong> ${err.message}</p>
                    <button onclick="loadWeatherData()" class="retry-btn">重试</button>
                </div>
            `;
        }
    } finally {
        isLoading = false;
    }
}

// 更新METAR显示
function updateMetarDisplay(data) {
    console.log('更新METAR显示:', data);
    
    if (!data) {
        updateMetarError('无METAR数据');
        return;
    }
    
    // 安全地更新每个字段
    safeUpdateElement('metar-observation-time', data.basicInfo?.observationTime || '未知');
    safeUpdateElement('metar-airport-info', '香港国际机场 (VHHH)');
    safeUpdateElement('metar-wind', data.wind?.info || '无风向数据');
    safeUpdateElement('metar-visibility', data.visibility?.info || '未知');
    safeUpdateElement('metar-clouds', data.clouds?.info || '无云况数据');
    safeUpdateElement('metar-temperature', data.temperature?.current || '未知');
    safeUpdateElement('metar-dewpoint', data.temperature?.dewPoint || '未知');
    safeUpdateElement('metar-pressure', data.pressure?.info || '未知');
    safeUpdateElement('metar-raw-text', data.rawText || '无原始数据');
    safeUpdateElement('metar-update-time', new Date().toLocaleString('zh-CN'));
    
    // 处理天气现象
    const weatherRow = document.getElementById('metar-weather-row');
    const weatherElement = document.getElementById('metar-weather');
    if (data.weather?.phenomena && weatherElement && weatherRow) {
        weatherElement.textContent = data.weather.phenomena;
        weatherRow.style.display = 'grid';
    } else if (weatherRow) {
        weatherRow.style.display = 'none';
    }
    
    // 处理飞行条件
    const flightElement = document.getElementById('metar-flight-category');
    if (flightElement && data.flightCategory) {
        const category = data.flightCategory.category || '未知';
        const rawCategory = data.flightCategory.rawCategory?.toLowerCase() || 'unknown';
        
        flightElement.textContent = category;
        flightElement.className = `value flight-cat-${rawCategory}`;
    }
}

// 更新TAF显示
function updateTafDisplay(data) {
    console.log('更新TAF显示:', data);
    
    if (!data) {
        updateTafError('无TAF数据');
        return;
    }
    
    // 安全地更新每个字段
    safeUpdateElement('taf-issue-time', data.basicInfo?.issueTime || '未知');
    safeUpdateElement('taf-valid-range', data.basicInfo?.validRange || '未知');
    safeUpdateElement('taf-airport-info', '香港国际机场 (VHHH)');
    safeUpdateElement('taf-summary', data.summary?.text || '无预报摘要');
    safeUpdateElement('taf-raw-text', data.rawText || '无原始数据');
    safeUpdateElement('taf-update-time', new Date().toLocaleString('zh-CN'));
    
    // 更新预报段
    const forecastContainer = document.getElementById('taf-forecast-periods');
    if (forecastContainer) {
        if (data.forecastPeriods && data.forecastPeriods.length > 0) {
            forecastContainer.innerHTML = data.forecastPeriods.map(period => `
                <div class="forecast-period">
                    <h5>预报段 ${period.periodIndex} ${period.changeType ? `(${period.changeType})` : ''}</h5>
                    <div class="period-info">
                        <div class="info-row">
                            <span class="label">风向风速:</span>
                            <span class="value">${period.wind?.info || '无数据'}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">能见度:</span>
                            <span class="value">${period.visibility?.info || '无数据'}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">云况:</span>
                            <span class="value">${period.clouds?.info || '无数据'}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            forecastContainer.innerHTML = '<p>无预报时段数据</p>';
        }
    }
}

// 安全更新DOM元素
function safeUpdateElement(id, content) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = content;
    } else {
        console.warn(`元素 ${id} 不存在`);
    }
}

// 更新METAR错误信息
function updateMetarError(errorMsg) {
    const metarContent = document.getElementById('metar-content');
    if (metarContent) {
        metarContent.innerHTML = `<div class="error-message">METAR数据错误: ${errorMsg}</div>`;
    }
}

// 更新TAF错误信息
function updateTafError(errorMsg) {
    const tafContent = document.getElementById('taf-content');
    if (tafContent) {
        tafContent.innerHTML = `<div class="error-message">TAF数据错误: ${errorMsg}</div>`;
    }
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
            categoryWithDescription = '目视飞行规则 (VFR) ';
            break;
        case 'mvfr':
            categoryWithDescription = '边际目视飞行 (MVFR) ';
            break;
        case 'ifr':
            categoryWithDescription = '仪表飞行规则 (IFR) ';
            break;
        case 'lifr':
            categoryWithDescription = '低仪表飞行 (LIFR) ';
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

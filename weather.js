// 全局变量
let currentTab = 'metar';
let isLoading = false;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM内容已加载，初始化天气组件...');
    initWeatherWidget();
});

// 初始化天气组件
function initWeatherWidget() {
    console.log('正在初始化天气组件...');
    loadWeatherData();
}

// 切换标签
function switchTab(tab) {
    console.log('切换到标签:', tab);
    if (isLoading) {
        console.log('正在加载中，暂时不能切换标签');
        return;
    }
    
    currentTab = tab;
    
    // 更新按钮状态
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    const activeBtn = document.querySelector(`.tab-btn[onclick="switchTab('${tab}')"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // 显示对应内容
    const metarContent = document.getElementById('metar-content');
    const tafContent = document.getElementById('taf-content');
    
    if (metarContent && tafContent) {
        if (tab === 'metar') {
            metarContent.style.display = 'block';
            tafContent.style.display = 'none';
        } else {
            metarContent.style.display = 'none';
            tafContent.style.display = 'block';
        }
    }
}

// 加载天气数据
async function loadWeatherData() {
    if (isLoading) {
        console.log('已经在加载中，跳过重复请求');
        return;
    }
    
    isLoading = true;
    console.log('开始加载天气数据...');
    
    // 显示加载状态
    const loadingElement = document.getElementById('weather-loading');
    const errorElement = document.getElementById('weather-error');
    
    if (loadingElement) loadingElement.style.display = 'block';
    if (errorElement) errorElement.style.display = 'none';
    
    try {
        // 并发获取 METAR 和 TAF 数据
        const [metarResponse, tafResponse] = await Promise.all([
            fetch('/api/metar'),
            fetch('/api/taf')
        ]);
        
        console.log('METAR响应状态:', metarResponse.status);
        console.log('TAF响应状态:', tafResponse.status);
        
        if (!metarResponse.ok || !tafResponse.ok) {
            throw new Error(`API请求失败: METAR ${metarResponse.status}, TAF ${tafResponse.status}`);
        }
        
        const metarData = await metarResponse.json();
        const tafData = await tafResponse.json();
        
        console.log('METAR数据:', metarData);
        console.log('TAF数据:', tafData);
        
        if (!metarData.success || !tafData.success) {
            throw new Error('API返回错误');
        }
        
        // 隐藏加载状态
        if (loadingElement) loadingElement.style.display = 'none';
        
        // 更新显示内容
        updateMetarDisplay(metarData.data);
        updateTafDisplay(tafData.data);
        
        // 显示当前标签内容
        switchTab(currentTab);
        
        console.log('天气数据加载成功');
        
    } catch (error) {
        console.error('加载天气数据失败:', error);
        isLoading = false;
        
        if (loadingElement) loadingElement.style.display = 'none';
        if (errorElement) {
            errorElement.style.display = 'block';
            errorElement.textContent = `加载失败: ${error.message}`;
        }
    } finally {
        isLoading = false;
    }
}

// 更新 METAR 显示
function updateMetarDisplay(data) {
    console.log('更新METAR显示:', data);
    
    if (!data || data.length === 0) {
        console.error('METAR数据为空');
        return;
    }
    
    const latest = data[0];
    
    // 格式化发布时间 (YYYY-MM-DD UTCHHMM)
    const observationTime = latest.obsTime || latest.observation_time;
    let formattedTime = '未知';
    if (observationTime) {
        try {
            const date = new Date(observationTime);
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date.getUTCDate()).padStart(2, '0');
            const hours = String(date.getUTCHours()).padStart(2, '0');
            const minutes = String(date.getUTCMinutes()).padStart(2, '0');
            formattedTime = `${year}-${month}-${day} UTC${hours}${minutes}`;
        } catch (e) {
            console.error('时间格式化错误:', e);
            formattedTime = observationTime;
        }
    }
    
    // 更新各个元素
    safeUpdateElement('metar-observation-time', formattedTime);
    safeUpdateElement('metar-airport', '香港国际机场 (VHHH)');
    safeUpdateElement('metar-temp', latest.temp ? `${latest.temp}°C` : '未知');
    safeUpdateElement('metar-dewpoint', latest.dewp ? `${latest.dewp}°C` : '未知');
    safeUpdateElement('metar-pressure', latest.altim ? `${latest.altim} inHg` : '未知');
    
    // 风向风速
    let windInfo = '未知';
    if (latest.wdir && latest.wspd) {
        windInfo = `${latest.wdir}° / ${latest.wspd}节`;
        if (latest.wgst) {
            windInfo += ` (阵风 ${latest.wgst}节)`;
        }
    }
    safeUpdateElement('metar-wind', windInfo);
    
    // 能见度 (转换为公里)
    let visibilityInfo = '未知';
    if (latest.visib) {
        const visibilityKm = (latest.visib * 1.60934).toFixed(1);
        visibilityInfo = `${visibilityKm} 公里`;
    }
    safeUpdateElement('metar-visibility', visibilityInfo);
    
    // 天气现象
    safeUpdateElement('metar-weather', latest.wxString || '无');
    
    // 云况
    let cloudInfo = '未知';
    if (latest.clds && latest.clds.length > 0) {
        cloudInfo = latest.clds.map(cloud => {
            let coverage = '';
            switch(cloud.cover) {
                case 'CLR': coverage = '晴朗'; break;
                case 'FEW': coverage = '少云'; break;
                case 'SCT': coverage = '疏云'; break;
                case 'BKN': coverage = '多云'; break;
                case 'OVC': coverage = '阴天'; break;
                default: coverage = cloud.cover || '';
            }
            const altitude = cloud.base ? ` ${cloud.base}英尺` : '';
            return coverage + altitude;
        }).join(', ');
    }
    safeUpdateElement('metar-clouds', cloudInfo);
    
    // 飞行等级
    let flightCategory = '未知';
    const category = latest.fltcat || latest.flight_category;
    switch(category) {
        case 'VFR': 
            flightCategory = 'VFR (目视飞行规则) - 天气条件良好'; 
            break;
        case 'MVFR': 
            flightCategory = 'MVFR (边际目视飞行规则) - 天气条件一般'; 
            break;
        case 'IFR': 
            flightCategory = 'IFR (仪表飞行规则) - 天气条件较差'; 
            break;
        case 'LIFR': 
            flightCategory = 'LIFR (低仪表飞行规则) - 天气条件恶劣'; 
            break;
    }
    safeUpdateElement('metar-flight-category', flightCategory);
    
    // 原始报文
    safeUpdateElement('metar-raw', latest.rawOb || latest.raw_text || '无原始数据');
}

// 更新 TAF 显示
function updateTafDisplay(data) {
    console.log('更新TAF显示:', data);
    
    if (!data || data.length === 0) {
        console.error('TAF数据为空');
        return;
    }
    
    const latest = data[0];
    
    // 格式化发布时间
    const issueTime = latest.issueTime || latest.issue_time;
    let formattedIssueTime = '未知';
    if (issueTime) {
        try {
            const date = new Date(issueTime);
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date.getUTCDate()).padStart(2, '0');
            const hours = String(date.getUTCHours()).padStart(2, '0');
            const minutes = String(date.getUTCMinutes()).padStart(2, '0');
            formattedIssueTime = `${year}-${month}-${day} UTC${hours}${minutes}`;
        } catch (e) {
            console.error('时间格式化错误:', e);
            formattedIssueTime = issueTime;
        }
    }
    
    // 格式化有效时间
    const validTime = latest.validTime || latest.valid_time;
    let formattedValidTime = '未知';
    if (validTime) {
        try {
            const date = new Date(validTime);
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date.getUTCDate()).padStart(2, '0');
            const hours = String(date.getUTCHours()).padStart(2, '0');
            const minutes = String(date.getUTCMinutes()).padStart(2, '0');
            formattedValidTime = `${year}-${month}-${day} UTC${hours}${minutes}`;
        } catch (e) {
            console.error('时间格式化错误:', e);
            formattedValidTime = validTime;
        }
    }
    
    // 更新各个元素
    safeUpdateElement('taf-issue-time', formattedIssueTime);
    safeUpdateElement('taf-valid-time', formattedValidTime);
    safeUpdateElement('taf-airport', '香港国际机场 (VHHH)');
    
    // 原始报文
    safeUpdateElement('taf-raw', latest.rawTAF || latest.raw_text || '无原始数据');
    
    // 预报段落
    if (latest.fcsts && latest.fcsts.length > 0) {
        let forecastHtml = '<div class="forecast-periods">';
        latest.fcsts.forEach((forecast, index) => {
            const timeFrom = forecast.timeFrom || forecast.fcst_time_from;
            const timeTo = forecast.timeTo || forecast.fcst_time_to;
            
            let timeRange = '时间未知';
            if (timeFrom && timeTo) {
                try {
                    const fromDate = new Date(timeFrom);
                    const toDate = new Date(timeTo);
                    const fromFormatted = `${String(fromDate.getUTCDate()).padStart(2, '0')}${String(fromDate.getUTCHours()).padStart(2, '0')}${String(fromDate.getUTCMinutes()).padStart(2, '0')}`;
                    const toFormatted = `${String(toDate.getUTCDate()).padStart(2, '0')}${String(toDate.getUTCHours()).padStart(2, '0')}${String(toDate.getUTCMinutes()).padStart(2, '0')}`;
                    timeRange = `${fromFormatted}-${toFormatted}Z`;
                } catch (e) {
                    timeRange = `${timeFrom} - ${timeTo}`;
                }
            }
            
            let windInfo = '风况未知';
            if (forecast.wdir && forecast.wspd) {
                windInfo = `${forecast.wdir}° / ${forecast.wspd}节`;
                if (forecast.wgst) {
                    windInfo += ` (阵风 ${forecast.wgst}节)`;
                }
            }
            
            let visibilityInfo = '能见度未知';
            if (forecast.visib) {
                const visibilityKm = (forecast.visib * 1.60934).toFixed(1);
                visibilityInfo = `${visibilityKm} 公里`;
            }
            
            forecastHtml += `
                <div class="forecast-period">
                    <strong>时间段 ${index + 1}: ${timeRange}</strong><br>
                    风向风速: ${windInfo}<br>
                    能见度: ${visibilityInfo}<br>
                    天气: ${forecast.wxString || '无特殊天气'}<br>
                </div>
            `;
        });
        forecastHtml += '</div>';
        safeUpdateElement('taf-forecasts', forecastHtml, true);
    } else {
        safeUpdateElement('taf-forecasts', '无预报数据');
    }
}

// 安全更新元素内容
function safeUpdateElement(id, content, isHtml = false) {
    const element = document.getElementById(id);
    if (element) {
        if (isHtml) {
            element.innerHTML = content;
        } else {
            element.textContent = content;
        }
    } else {
        console.warn(`元素未找到: ${id}`);
    }
}

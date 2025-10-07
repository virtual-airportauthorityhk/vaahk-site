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
            throw new Error(`API返回错误: METAR ${metarData.error}, TAF ${tafData.error}`);
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
    console.log('更新METAR显示，收到数据:', data);
    
    // 检查数据是否有效
    if (!data || !Array.isArray(data) || data.length === 0) {
        console.error('METAR数据无效或为空:', data);
        safeUpdateElement('metar-observation-time', '数据无效');
        safeUpdateElement('metar-airport', '香港国际机场 (VHHH)');
        safeUpdateElement('metar-temp', '数据获取失败');
        return;
    }
    
    const latest = data[0];
    console.log('处理METAR数据:', latest);
    
    // 检查latest对象是否存在
    if (!latest || typeof latest !== 'object') {
        console.error('METAR最新数据无效:', latest);
        safeUpdateElement('metar-observation-time', '数据格式错误');
        return;
    }
    
    // 使用翻译后的时间格式
    const formattedTime = latest.observation_time_formatted || 
                         latest.obsTime || 
                         latest.observation_time || 
                         '未知';
    
    // 更新各个元素
    safeUpdateElement('metar-observation-time', formattedTime);
    safeUpdateElement('metar-airport', '香港国际机场 (VHHH)');
    safeUpdateElement('metar-temp', latest.temp ? `${latest.temp}°C` : '未知');
    safeUpdateElement('metar-dewpoint', latest.dewp || latest.dewpoint ? `${latest.dewp || latest.dewpoint}°C` : '未知');
    safeUpdateElement('metar-pressure', latest.altim || latest.slp ? `${latest.altim || latest.slp} inHg` : '未知');
    
    // 风向风速 - 使用翻译
    let windInfo = '未知';
    if (latest.wdir && latest.wspd) {
        const windDirection = latest.wind_direction_translated || `${latest.wdir}°`;
        windInfo = `${windDirection} / ${latest.wspd}节`;
        if (latest.wgst) {
            windInfo += ` (阵风 ${latest.wgst}节)`;
        }
    }
    safeUpdateElement('metar-wind', windInfo);
    
    // 能见度 - 使用翻译后的公里数
    let visibilityInfo = '未知';
    if (latest.visibility_km) {
        visibilityInfo = `${latest.visibility_km} 公里`;
    } else if (latest.visib) {
        const visibilityKm = (latest.visib * 1.60934).toFixed(1);
        visibilityInfo = `${visibilityKm} 公里`;
    }
    safeUpdateElement('metar-visibility', visibilityInfo);
    
    // 天气现象 - 使用翻译
    const weatherInfo = latest.weather_translated || latest.wxString || '无';
    safeUpdateElement('metar-weather', weatherInfo);
    
    // 云况 - 使用翻译
    let cloudInfo = '未知';
    if (latest.clouds_translated && latest.clouds_translated.length > 0) {
        cloudInfo = latest.clouds_translated.map(cloud => cloud.translated).join(', ');
    } else if (latest.clds && latest.clds.length > 0) {
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
    
    // 飞行等级 - 使用翻译
    let flightCategory = '未知';
    if (latest.flight_category_translated) {
        const cat = latest.flight_category_translated;
        flightCategory = `${cat.code} (${cat.name}) - ${cat.description}`;
    } else {
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
    }
    safeUpdateElement('metar-flight-category', flightCategory);
    
    // 原始报文
    safeUpdateElement('metar-raw', latest.rawOb || latest.raw_text || latest.rawText || '无原始数据');
}

// 更新 TAF 显示
function updateTafDisplay(data) {
    console.log('更新TAF显示，收到数据:', data);
    
    // 检查数据是否有效
    if (!data || !Array.isArray(data) || data.length === 0) {
        console.error('TAF数据无效或为空:', data);
        safeUpdateElement('taf-issue-time', '数据无效');
        safeUpdateElement('taf-valid-time', '数据无效');
        safeUpdateElement('taf-airport', '香港国际机场 (VHHH)');
        return;
    }
    
    const latest = data[0];
    console.log('处理TAF数据:', latest);
    
    // 检查latest对象是否存在
    if (!latest || typeof latest !== 'object') {
        console.error('TAF最新数据无效:', latest);
        safeUpdateElement('taf-issue-time', '数据格式错误');
        return;
    }
    
    // 使用翻译后的时间格式
    const issueTime = latest.issue_time_formatted || 
                      latest.issueTime || 
                      latest.issue_time || 
                      '未知';
    
    const validTime = latest.valid_time_formatted || 
                      latest.validTime || 
                      latest.valid_time || 
                      '未知';
    
    // 更新各个元素
    safeUpdateElement('taf-issue-time', issueTime);
    safeUpdateElement('taf-valid-time', validTime);
    safeUpdateElement('taf-airport', '香港国际机场 (VHHH)');
    
    // 原始报文
    safeUpdateElement('taf-raw', latest.rawTAF || latest.raw_text || latest.rawText || '无原始数据');
    
    // 预报段落 - 使用翻译
    const forecasts = latest.forecasts_translated || latest.fcsts;
    if (forecasts && forecasts.length > 0) {
        let forecastHtml = '<div class="forecast-periods">';
        forecasts.forEach((forecast, index) => {
            // 使用翻译后的时间范围
            const timeRange = forecast.time_range_formatted || 
                             (forecast.timeFrom && forecast.timeTo ? `${forecast.timeFrom} - ${forecast.timeTo}` : '时间未知');
            
            // 使用翻译后的风向
            let windInfo = '风况未知';
            if (forecast.wdir && forecast.wspd) {
                const windDirection = forecast.wind_direction_translated || `${forecast.wdir}°`;
                windInfo = `${windDirection} / ${forecast.wspd}节`;
                if (forecast.wgst) {
                    windInfo += ` (阵风 ${forecast.wgst}节)`;
                }
            }
            
            // 使用翻译后的能见度
            let visibilityInfo = '能见度未知';
            if (forecast.visibility_km) {
                visibilityInfo = `${forecast.visibility_km} 公里`;
            } else if (forecast.visib) {
                const visibilityKm = (forecast.visib * 1.60934).toFixed(1);
                visibilityInfo = `${visibilityKm} 公里`;
            }
            
            // 使用翻译后的天气现象
            const weatherInfo = forecast.weather_translated || forecast.wxString || '无特殊天气';
            
            // 使用翻译后的云况
            let cloudInfo = '';
            if (forecast.clouds_translated && forecast.clouds_translated.length > 0) {
                cloudInfo = `<br>云况: ${forecast.clouds_translated.map(cloud => cloud.translated).join(', ')}`;
            }
            
            // 变化类型
            let changeInfo = '';
            if (forecast.change_translated) {
                changeInfo = `<br>变化类型: ${forecast.change_translated}`;
            } else if (forecast.change) {
                changeInfo = `<br>变化类型: ${forecast.change}`;
            }
            
            forecastHtml += `
                <div class="forecast-period">
                    <strong>时间段 ${index + 1}: ${timeRange}</strong><br>
                    风向风速: ${windInfo}<br>
                    能见度: ${visibilityInfo}<br>
                    天气: ${weatherInfo}${cloudInfo}${changeInfo}
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

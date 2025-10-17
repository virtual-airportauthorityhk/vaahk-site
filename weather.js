// weather.js - 香港国际机场实时气象数据
class WeatherAPI {
    constructor() {
        this.metarUrl = 'https://aviationweather.gov/api/data/metar?ids=VHHH&format=json';
        this.tafUrl = 'https://aviationweather.gov/api/data/taf?ids=VHHH&format=json';
        this.translations = {
            // 天气现象翻译
            'RA': '雨', 'SHRA': '阵雨', 'TSRA': '雷雨', 'SN': '雪', 'FZRA': '冻雨',
            'BR': '轻雾', 'FG': '雾', 'HZ': '薄雾', 'DU': '浮尘', 'SA': '沙',
            'SS': '沙暴', 'DS': '尘暴', 'PO': '尘卷风', 'SQ': '飑线', 'FC': '漏斗云',
            'VA': '火山灰', 'DZ': '毛毛雨', 'SG': '米雪', 'IC': '冰晶', 'PL': '冰粒',
            'GR': '冰雹', 'GS': '小冰雹', 'UP': '未知降水', 'FU': '烟', 'PY': '喷雾',
            
            // 云量翻译
            'FEW': '少云', 'SCT': '散云', 'BKN': '裂云', 'OVC': '阴天', 'CLR': '无云',
            'SKC': '碧空', 'NSC': '无显著云', 'VV': '垂直能见度',
            
            // 飞行类别
            'VFR': '目视飞行规则', 'MVFR': '边际目视飞行规则', 
            'IFR': '仪表飞行规则', 'LIFR': '低空仪表飞行规则',
            
            // 其他
            'VRB': '风向不定', 'CALM': '静风', 'CAVOK': '能见度良好，无云',
            'NOSIG': '无显著变化', 'TEMPO': '暂时', 'BECMG': '变为', 'FM': '从'
        };
    }

    // 格式化时间
    formatTime(timestamp) {
        if (!timestamp) return '未知时间';
        const date = new Date(timestamp * 1000);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
    }

    // 翻译天气现象
    translateWeather(text) {
        if (!text) return '无显著天气';
        
        let translated = text;
        Object.keys(this.translations).forEach(key => {
            const regex = new RegExp(key, 'g');
            translated = translated.replace(regex, this.translations[key]);
        });
        
        // 处理强度符号
        translated = translated.replace('+', '强');
        translated = translated.replace('-', '轻');
        translated = translated.replace('VC', '附近');
        
        return translated;
    }

    // 获取METAR数据
    async fetchMETAR() {
        try {
            const response = await fetch(this.metarUrl);
            if (!response.ok) throw new Error(`HTTP错误! 状态: ${response.status}`);
            
            const data = await response.json();
            if (!data || data.length === 0) throw new Error('未收到METAR数据');
            
            return this.processMETAR(data[0]);
        } catch (error) {
            console.error('获取METAR数据错误:', error);
            return {
                error: true,
                message: '获取METAR数据失败: ' + error.message
            };
        }
    }

    // 处理METAR数据
    processMETAR(metar) {
        return {
            icaoId: metar.icaoId,
            stationName: '香港国际机场',
            observationTime: this.formatTime(metar.obsTime),
            temperature: `${metar.temp}°C`,
            dewpoint: `${metar.dewp}°C`,
            wind: this.formatWind(metar.wdir, metar.wspd, metar.wgst),
            visibility: `${metar.visib} 英里`,
            altimeter: `${metar.altim} hPa`,
            weather: this.translateWeather(metar.wxString),
            clouds: this.formatClouds(metar.clouds),
            flightCategory: this.translations[metar.fltCat] || metar.fltCat,
            raw: metar.rawOb
        };
    }

    // 格式化风信息
    formatWind(direction, speed, gust) {
        if (direction === 'VRB') {
            return gust ? `风向不定 ${speed}节 阵风${gust}节` : `风向不定 ${speed}节`;
        }
        return gust ? `${direction}度 ${speed}节 阵风${gust}节` : `${direction}度 ${speed}节`;
    }

    // 格式化云信息
    formatClouds(clouds) {
        if (!clouds || clouds.length === 0) return '无云';
        
        return clouds.map(cloud => {
            const cover = this.translations[cloud.cover] || cloud.cover;
            return `${cover} ${cloud.base}英尺`;
        }).join(', ');
    }

    // 获取TAF数据
    async fetchTAF() {
        try {
            const response = await fetch(this.tafUrl);
            if (!response.ok) throw new Error(`HTTP错误! 状态: ${response.status}`);
            
            const data = await response.json();
            if (!data || data.length === 0) throw new Error('未收到TAF数据');
            
            return this.processTAF(data[0]);
        } catch (error) {
            console.error('获取TAF数据错误:', error);
            return {
                error: true,
                message: '获取TAF数据失败: ' + error.message
            };
        }
    }

    // 处理TAF数据
    processTAF(taf) {
        return {
            icaoId: taf.icaoId,
            stationName: '香港国际机场',
            issueTime: this.formatTime(new Date(taf.issueTime).getTime() / 1000),
            validFrom: this.formatTime(taf.validTimeFrom),
            validTo: this.formatTime(taf.validTimeTo),
            raw: taf.rawTAF,
            forecasts: this.processForecasts(taf.fcsts || [])
        };
    }

    // 处理预报数据
    processForecasts(forecasts) {
        return forecasts.map(fcst => ({
            period: `${this.formatTime(fcst.timeFrom)} - ${this.formatTime(fcst.timeTo)}`,
            wind: this.formatWind(fcst.wdir, fcst.wspd, fcst.wgst),
            visibility: fcst.visib ? `${fcst.visib} 英里` : '未知',
            weather: this.translateWeather(fcst.wxString),
            clouds: this.formatClouds(fcst.clouds)
        }));
    }
}

// 初始化天气API
const weatherAPI = new WeatherAPI();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeWeatherWidget();
});

// 初始化天气组件
async function initializeWeatherWidget() {
    const metarContainer = document.getElementById('metar-content');
    const tafContainer = document.getElementById('taf-content');
    
    if (!metarContainer || !tafContainer) return;

    // 显示加载状态
    metarContainer.innerHTML = '<div style="text-align: center; padding: 20px;">正在获取METAR数据...</div>';
    tafContainer.innerHTML = '<div style="text-align: center; padding: 20px;">正在获取TAF数据...</div>';

    try {
        const [metarData, tafData] = await Promise.all([
            weatherAPI.fetchMETAR(),
            weatherAPI.fetchTAF()
        ]);

        // 显示METAR数据
        if (metarData.error) {
            metarContainer.innerHTML = `<div style="color: red; text-align: center; padding: 20px;">${metarData.message}</div>`;
        } else {
            metarContainer.innerHTML = renderMETAR(metarData);
        }

        // 显示TAF数据
        if (tafData.error) {
            tafContainer.innerHTML = `<div style="color: red; text-align: center; padding: 20px;">${tafData.message}</div>`;
        } else {
            tafContainer.innerHTML = renderTAF(tafData);
        }
    } catch (error) {
        metarContainer.innerHTML = '<div style="color: red; text-align: center; padding: 20px;">初始化气象数据失败</div>';
        tafContainer.innerHTML = '<div style="color: red; text-align: center; padding: 20px;">初始化气象数据失败</div>';
    }
}

// 渲染METAR数据
function renderMETAR(data) {
    return `
        <div style="padding: 10px;">
            <div><strong>观测时间:</strong> ${data.observationTime}</div>
            <div><strong>温度/露点:</strong> ${data.temperature} / ${data.dewpoint}</div>
            <div><strong>风:</strong> ${data.wind}</div>
            <div><strong>能见度:</strong> ${data.visibility}</div>
            <div><strong>天气:</strong> ${data.weather}</div>
            <div><strong>云:</strong> ${data.clouds}</div>
            <div><strong>气压:</strong> ${data.altimeter}</div>
            <div><strong>飞行类别:</strong> ${data.flightCategory}</div>
            <div style="margin-top: 10px;"><strong>原始报文:</strong></div>
            <div style="background: #f5f5f5; padding: 8px; border-radius: 4px; font-family: monospace;">${data.raw}</div>
        </div>
    `;
}

// 渲染TAF数据
function renderTAF(data) {
    const forecastsHtml = data.forecasts.map(fcst => `
        <div style="border-bottom: 1px solid #eee; padding: 8px 0;">
            <div><strong>${fcst.period}</strong></div>
            <div>风: ${fcst.wind}</div>
            <div>能见度: ${fcst.visibility}</div>
            <div>天气: ${fcst.weather}</div>
            <div>云: ${fcst.clouds}</div>
        </div>
    `).join('');

    return `
        <div style="padding: 10px;">
            <div><strong>发布时间:</strong> ${data.issueTime}</div>
            <div><strong>有效时间:</strong> ${data.validFrom} 至 ${data.validTo}</div>
            <div style="margin-top: 10px;"><strong>原始报文:</strong></div>
            <div style="background: #f5f5f5; padding: 8px; border-radius: 4px; font-family: monospace; margin-bottom: 15px;">${data.raw}</div>
            <div><strong>详细预报:</strong></div>
            <div style="max-height: 300px; overflow-y: auto;">
                ${forecastsHtml}
            </div>
        </div>
    `;
}

// 标签切换功能
function switchWeatherTab(tabName) {
    // 更新按钮状态
    document.querySelectorAll('.weather-tab').forEach(button => {
        button.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // 更新内容显示
    document.querySelectorAll('.weather-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName + '-content').classList.add('active');
}

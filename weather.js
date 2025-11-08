// weather.js - 香港国际机场实时METAR及TAF API
// VAAHK - 虚拟香港机场管理局

class WeatherAPI {
    constructor() {
        this.metarUrl = 'https://aviationweather.gov/api/data/metar?ids=VHHH&format=json';
        this.tafUrl = 'https://aviationweather.gov/api/data/taf?ids=VHHH&format=json';
        this.currentTab = 'metar';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadWeatherData();
        // 每5分钟自动刷新数据
        setInterval(() => this.loadWeatherData(), 300000);
    }

    setupEventListeners() {
        // 选项卡切换
        const tabButtons = document.querySelectorAll('.weather-tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // 手动刷新按钮
        const refreshBtn = document.getElementById('weather-refresh');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadWeatherData());
        }
    }

    switchTab(tab) {
        this.currentTab = tab;
        
        // 更新活跃选项卡
        document.querySelectorAll('.weather-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // 显示对应内容
        document.querySelectorAll('.weather-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tab}-content`).classList.add('active');

        // 如果切换到未加载的选项卡，加载数据
        if (tab === 'taf' && !document.getElementById('taf-content').dataset.loaded) {
            this.loadTafData();
        }
    }

    async loadWeatherData() {
        this.showLoading();
        
        try {
            if (this.currentTab === 'metar') {
                await this.loadMetarData();
            } else {
                await this.loadTafData();
            }
            this.updateLastUpdated();
        } catch (error) {
            this.showError('获取天气数据失败: ' + error.message);
        }
    }

    async loadMetarData() {
        try {
            const response = await fetch(this.metarUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.displayMetarData(data);
            document.getElementById('metar-content').dataset.loaded = true;
        } catch (error) {
            throw new Error('METAR数据获取失败');
        }
    }

    async loadTafData() {
        try {
            const response = await fetch(this.tafUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.displayTafData(data);
            document.getElementById('taf-content').dataset.loaded = true;
        } catch (error) {
            throw new Error('TAF数据获取失败');
        }
    }

    displayMetarData(data) {
        const container = document.getElementById('metar-content');
        
        if (!data || data.length === 0) {
            container.innerHTML = this.getErrorHTML('未找到METAR数据');
            return;
        }

        const metar = data[0];
        const observationTime = this.formatTimestamp(metar.obsTime);
        const reportTime = this.formatTimestamp(metar.reportTime);
        
        container.innerHTML = `
            <div class="weather-data">
                <div class="weather-header">
                    <h4><i class="fas fa-cloud-sun"></i> 香港国际机场实时天气</h4>
                </div>
                
                <div class="weather-raw">
                    <h5>原始METAR数据:</h5>
                    <div class="weather-raw-text">${metar.rawOb || 'N/A'}</div>
                </div>
                
                <div class="weather-details">
                    <div class="weather-grid">
                        <div class="weather-item">
                            <span class="weather-label">观测时间</span>
                            <span class="weather-value">${observationTime}</span>
                        </div>
                        <div class="weather-item">
                            <span class="weather-label">温度/露点</span>
                            <span class="weather-value">${metar.temp}°C / ${metar.dewp}°C</span>
                        </div>
                        <div class="weather-item">
                            <span class="weather-label">风向/风速</span>
                            <span class="weather-value">${metar.wdir}° / ${metar.wspd}节${metar.wgst ? ` 阵风 ${metar.wgst}节` : ''}</span>
                        </div>
                        <div class="weather-item">
                            <span class="weather-label">能见度</span>
                            <span class="weather-value">${metar.visib || 'N/A'} 公里</span>
                        </div>
                        <div class="weather-item">
                            <span class="weather-label">气压</span>
                            <span class="weather-value">${metar.altim || 'N/A'} hPa</span>
                        </div>
                        <div class="weather-item">
                            <span class="weather-label">天气现象</span>
                            <span class="weather-value">${metar.wxString || '无显著天气'}</span>
                        </div>
                        <div class="weather-item">
                            <span class="weather-label">飞行类别</span>
                            <span class="weather-value weather-${metar.fltCat?.toLowerCase() || 'unknown'}">
                                ${this.getFlightCategory(metar.fltCat)}
                            </span>
                        </div>
                        <div class="weather-item">
                            <span class="weather-label">云层信息</span>
                            <span class="weather-value">${this.formatClouds(metar.clouds)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="weather-footer">
                    <p class="weather-last-updated">数据更新时间: ${reportTime}</p>
                    <p class="weather-auto-refresh">数据每5分钟自动更新</p>
                </div>
            </div>
        `;
    }

    displayTafData(data) {
        const container = document.getElementById('taf-content');
        
        if (!data || data.length === 0) {
            container.innerHTML = this.getErrorHTML('未找到TAF数据');
            return;
        }

        const taf = data[0];
        const issueTime = this.formatTimestamp(taf.issueTime);
        const validFrom = this.formatTimestamp(taf.validTimeFrom);
        const validTo = this.formatTimestamp(taf.validTimeTo);
        
        let forecastsHTML = '';
        if (taf.fcsts && taf.fcsts.length > 0) {
            forecastsHTML = `
                <div class="weather-details">
                    <h5>预报详情:</h5>
                    ${taf.fcsts.map((fcst, index) => this.formatForecast(fcst, index)).join('')}
                </div>
            `;
        }

        container.innerHTML = `
            <div class="weather-data">
                <div class="weather-header">
                    <h4><i class="fas fa-chart-line"></i> 香港国际机场天气预报</h4>
                </div>
                
                <div class="weather-raw">
                    <h5>原始TAF数据:</h5>
                    <div class="weather-raw-text">${taf.rawTAF || 'N/A'}</div>
                </div>
                
                <div class="weather-info">
                    <div class="weather-grid">
                        <div class="weather-item">
                            <span class="weather-label">发布时间</span>
                            <span class="weather-value">${issueTime}</span>
                        </div>
                        <div class="weather-item">
                            <span class="weather-label">有效期</span>
                            <span class="weather-value">${validFrom} 至 ${validTo}</span>
                        </div>
                        <div class="weather-item">
                            <span class="weather-label">预报周期</span>
                            <span class="weather-value">${this.getForecastPeriod(taf.validTimeFrom, taf.validTimeTo)}</span>
                        </div>
                    </div>
                </div>
                
                ${forecastsHTML}
                
                <div class="weather-footer">
                    <p class="weather-last-updated">数据更新时间: ${this.formatTimestamp(taf.bulletinTime)}</p>
                    <p class="weather-auto-refresh">数据每5分钟自动更新</p>
                </div>
            </div>
        `;
    }

    formatTimestamp(timestamp) {
        if (!timestamp) return 'N/A';
        
        let date;
        if (typeof timestamp === 'number') {
            date = new Date(timestamp * 1000);
        } else {
            date = new Date(timestamp);
        }
        
        return date.toISOString().replace('T', ' ').substring(0, 16) + ' UTC';
    }

    formatClouds(clouds) {
        if (!clouds || clouds.length === 0) return '无云或云底高于5000英尺';
        
        return clouds.map(cloud => {
            const type = this.getCloudType(cloud.cover);
            const height = cloud.base ? `${cloud.base * 100}英尺` : '未知高度';
            return `${type} ${height}`;
        }).join(', ');
    }

    getCloudType(cover) {
        const types = {
            'FEW': '少云',
            'SCT': '散云', 
            'BKN': '裂云',
            'OVC': '阴天',
            'VV': '垂直能见度'
        };
        return types[cover] || cover;
    }

    getFlightCategory(category) {
        const categories = {
            'VFR': '目视飞行规则',
            'MVFR': '边际目视飞行规则', 
            'IFR': '仪表飞行规则',
            'LIFR': '低空仪表飞行规则'
        };
        return categories[category] || category || '未知';
    }

    formatForecast(fcst, index) {
        const timeFrom = this.formatTimestamp(fcst.timeFrom);
        const timeTo = this.formatTimestamp(fcst.timeTo);
        
        return `
            <div class="forecast-section">
                <div class="forecast-header">
                    预报时段 ${index + 1}: ${timeFrom} - ${timeTo}
                    ${fcst.probability ? ` (概率: ${fcst.probability}%)` : ''}
                </div>
                <div class="forecast-conditions">
                    风向: ${fcst.wdir || '不定'}° | 风速: ${fcst.wspd || 0}节${fcst.wgst ? ` 阵风 ${fcst.wgst}节` : ''} | 
                    能见度: ${fcst.visib || 'N/A'} | 天气: ${fcst.wxString || '无显著天气'}
                </div>
            </div>
        `;
    }

    getForecastPeriod(from, to) {
        const fromDate = new Date(from * 1000);
        const toDate = new Date(to * 1000);
        const hours = Math.round((toDate - fromDate) / (1000 * 60 * 60));
        return `${hours} 小时`;
    }

    showLoading() {
        const activeContent = document.querySelector('.weather-tab-content.active');
        activeContent.innerHTML = `
            <div class="weather-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>正在获取天气数据...</p>
            </div>
        `;
    }

    showError(message) {
        const activeContent = document.querySelector('.weather-tab-content.active');
        activeContent.innerHTML = `
            <div class="weather-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
                <button class="btn" onclick="weatherAPI.loadWeatherData()">重试</button>
            </div>
        `;
    }

    getErrorHTML(message) {
        return `
            <div class="weather-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
    }

    updateLastUpdated() {
        const now = new Date();
        const lastUpdated = document.getElementById('weather-last-updated');
        if (lastUpdated) {
            lastUpdated.textContent = `最后更新: ${now.toLocaleString('zh-CN')}`;
        }
    }
}

// 初始化天气API
let weatherAPI;

document.addEventListener('DOMContentLoaded', function() {
    weatherAPI = new WeatherAPI();
});

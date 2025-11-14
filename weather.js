class WeatherAPI {
    constructor() {
        this.baseURL = 'https://aviationweather.gov/api/data';
        this.currentTab = 'metar';
        this.isLoading = false;
    }

    // 获取METAR数据
    async fetchMETAR(icao = 'VHHH') {
        try {
            this.setLoading(true);
            const response = await fetch(`${this.baseURL}/metar?ids=${icao}&format=json`);
            
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态: ${response.status}`);
            }
            
            const data = await response.json();
            return this.processMETARData(data);
        } catch (error) {
            console.error('获取METAR数据失败:', error);
            throw error;
        } finally {
            this.setLoading(false);
        }
    }

    // 获取TAF数据
    async fetchTAF(icao = 'VHHH') {
        try {
            this.setLoading(true);
            const response = await fetch(`${this.baseURL}/taf?ids=${icao}&format=json`);
            
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态: ${response.status}`);
            }
            
            const data = await response.json();
            return this.processTAFData(data);
        } catch (error) {
            console.error('获取TAF数据失败:', error);
            throw error;
        } finally {
            this.setLoading(false);
        }
    }

    // 处理METAR数据
    processMETARData(data) {
        if (!data || data.length === 0) {
            throw new Error('未找到METAR数据');
        }

        const metar = data[0];
        return {
            raw: metar.rawOb || '',
            station: metar.icaoId || '',
            time: this.formatTime(metar.receiptTime || metar.reportTime),
            temperature: metar.temp !== undefined ? `${Math.round(metar.temp)}°C` : 'N/A',
            dewpoint: metar.dewp !== undefined ? `${Math.round(metar.dewp)}°C` : 'N/A',
            wind: this.formatWind(metar.wdir, metar.wspd, metar.wgst),
            visibility: metar.visib !== undefined ? `${metar.visib} km` : 'N/A',
            altimeter: metar.altim !== undefined ? `${metar.altim.toFixed(2)} hPa` : 'N/A',
            weather: metar.wxString || 'N/A',
            clouds: this.formatClouds(metar.clouds),
            flightCategory: metar.fltCat || 'N/A',
            remarks: metar.remarks || ''
        };
    }

    // 处理TAF数据
    processTAFData(data) {
        if (!data || data.length === 0) {
            throw new Error('未找到TAF数据');
        }

        const taf = data[0];
        return {
            raw: taf.rawTAF || '',
            station: taf.icaoId || '',
            issueTime: this.formatTime(taf.issueTime),
            validFrom: this.formatTime(taf.validTimeFrom),
            validTo: this.formatTime(taf.validTimeTo),
            forecasts: this.formatForecasts(taf.fcsts),
            remarks: taf.remarks || ''
        };
    }

    // 格式化时间
    formatTime(timestamp) {
        if (!timestamp) return 'N/A';
        
        try {
            let date;
            if (typeof timestamp === 'number') {
                date = new Date(timestamp * 1000);
            } else {
                date = new Date(timestamp);
            }
            
            return date.toISOString().replace('T', ' ').substring(0, 16) + ' UTC';
        } catch (error) {
            return '时间格式错误';
        }
    }

    // 格式化风信息
    formatWind(direction, speed, gust) {
        if (direction === undefined || speed === undefined) {
            return 'N/A';
        }

        let windStr = `${direction}°/${speed}kt`;
        if (gust && gust > speed) {
            windStr += ` G${gust}kt`;
        }

        return windStr;
    }

    // 格式化云层信息
    formatClouds(clouds) {
        if (!clouds || clouds.length === 0) {
            return 'N/A';
        }

        return clouds.map(cloud => {
            const coverage = cloud.cover || '';
            const base = cloud.base || '';
            const type = cloud.type || '';
            return `${coverage}${base}${type}`;
        }).join(', ');
    }

    // 格式化预报
    formatForecasts(fcsts) {
        if (!fcsts || fcsts.length === 0) {
            return [];
        }

        return fcsts.map(fcst => ({
            period: `${this.formatTime(fcst.timeFrom)} - ${this.formatTime(fcst.timeTo)}`,
            wind: this.formatWind(fcst.wdir, fcst.wspd, fcst.wgst),
            visibility: fcst.visib !== undefined ? `${fcst.visib} km` : 'N/A',
            weather: fcst.wxString || 'N/A',
            clouds: this.formatClouds(fcst.clouds)
        }));
    }

    // 设置加载状态
    setLoading(loading) {
        this.isLoading = loading;
        const button = document.querySelector('.refresh-btn');
        if (button) {
            if (loading) {
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 刷新中';
                button.disabled = true;
            } else {
                button.innerHTML = '<i class="fas fa-sync-alt"></i> 刷新';
                button.disabled = false;
            }
        }
    }

    // 切换标签页
    switchTab(tabName) {
        this.currentTab = tabName;
        
        // 更新标签按钮状态
        document.querySelectorAll('.weather-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.weather-tab-btn[data-tab="${tabName}"]`).classList.add('active');
        
        // 更新内容显示
        document.querySelectorAll('.weather-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-content`).classList.add('active');
        
        // 如果切换到当前标签，刷新数据
        this.refreshWeather();
    }

    // 刷新天气数据
    async refreshWeather() {
        try {
            const icao = 'VHHH'; // 香港国际机场
            let weatherData;
            
            if (this.currentTab === 'metar') {
                weatherData = await this.fetchMETAR(icao);
                this.displayMETAR(weatherData);
            } else {
                weatherData = await this.fetchTAF(icao);
                this.displayTAF(weatherData);
            }
            
            this.updateLastUpdated();
        } catch (error) {
            this.displayError(error.message);
        }
    }

    // 显示METAR数据
    displayMETAR(data) {
        const content = document.getElementById('metar-content');
        if (!content) return;

        content.innerHTML = `
            <div class="weather-data">
                <div class="weather-header">
                    <h4><i class="fas fa-cloud-sun"></i> ${data.station} - 实时天气报告</h4>
                </div>
                
                <div class="weather-raw">
                    <h5>原始数据:</h5>
                    <div class="weather-raw-text">${data.raw}</div>
                </div>
                
                <div class="weather-details">
                    <div class="weather-grid">
                        <div class="weather-item">
                            <span class="weather-label">观测时间:</span>
                            <span class="weather-value">${data.time}</span>
                        </div>
                        <div class="weather-item">
                            <span class="weather-label">温度/露点:</span>
                            <span class="weather-value">${data.temperature} / ${data.dewpoint}</span>
                        </div>
                        <div class="weather-item">
                            <span class="weather-label">风向风速:</span>
                            <span class="weather-value">${data.wind}</span>
                        </div>
                        <div class="weather-item">
                            <span class="weather-label">能见度:</span>
                            <span class="weather-value">${data.visibility}</span>
                        </div>
                        <div class="weather-item">
                            <span class="weather-label">气压:</span>
                            <span class="weather-value">${data.altimeter}</span>
                        </div>
                        <div class="weather-item">
                            <span class="weather-label">天气现象:</span>
                            <span class="weather-value">${data.weather}</span>
                        </div>
                        <div class="weather-item">
                            <span class="weather-label">云量:</span>
                            <span class="weather-value">${data.clouds}</span>
                        </div>
                        <div class="weather-item">
                            <span class="weather-label">飞行类别:</span>
                            <span class="weather-value weather-${data.flightCategory.toLowerCase()}">${data.flightCategory}</span>
                        </div>
                    </div>
                </div>
                
                ${data.remarks ? `
                <div class="weather-footer">
                    <p><strong>备注:</strong> ${data.remarks}</p>
                </div>
                ` : ''}
            </div>
        `;
    }

    // 显示TAF数据
    displayTAF(data) {
        const content = document.getElementById('taf-content');
        if (!content) return;

        let forecastsHTML = '';
        if (data.forecasts && data.forecasts.length > 0) {
            forecastsHTML = `
                <div class="forecast-section">
                    <h5>预报详情:</h5>
                    ${data.forecasts.map(forecast => `
                        <div class="forecast-item">
                            <div class="forecast-period"><strong>时段:</strong> ${forecast.period}</div>
                            <div class="forecast-details">
                                <span><strong>风:</strong> ${forecast.wind}</span>
                                <span><strong>能见度:</strong> ${forecast.visibility}</span>
                                <span><strong>天气:</strong> ${forecast.weather}</span>
                                <span><strong>云:</strong> ${forecast.clouds}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        content.innerHTML = `
            <div class="weather-data">
                <div class="weather-header">
                    <h4><i class="fas fa-chart-line"></i> ${data.station} - 终端机场预报</h4>
                </div>
                
                <div class="weather-raw">
                    <h5>原始数据:</h5>
                    <div class="weather-raw-text">${data.raw}</div>
                </div>
                
                <div class="weather-details">
                    <div class="weather-grid">
                        <div class="weather-item">
                            <span class="weather-label">发布时间:</span>
                            <span class="weather-value">${data.issueTime}</span>
                        </div>
                        <div class="weather-item">
                            <span class="weather-label">有效时间:</span>
                            <span class="weather-value">${data.validFrom} 至 ${data.validTo}</span>
                        </div>
                    </div>
                </div>
                
                ${forecastsHTML}
                
                ${data.remarks ? `
                <div class="weather-footer">
                    <p><strong>备注:</strong> ${data.remarks}</p>
                </div>
                ` : ''}
            </div>
        `;
    }

    // 显示错误信息
    displayError(message) {
        const content = document.querySelector('.weather-tab-content.active');
        if (!content) return;

        content.innerHTML = `
            <div class="weather-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>获取天气数据失败</p>
                <p class="error-message">${message}</p>
                <button class="btn" onclick="weatherAPI.refreshWeather()">
                    <i class="fas fa-redo"></i> 重试
                </button>
            </div>
        `;
    }

    // 更新最后刷新时间
    updateLastUpdated() {
        const now = new Date();
        const timeString = now.toLocaleString('zh-CN');
        const lastUpdated = document.querySelector('.weather-last-updated');
        if (lastUpdated) {
            lastUpdated.textContent = `最后更新: ${timeString}`;
        }
    }

    // 初始化
    init() {
        // 添加事件监听器
        document.querySelectorAll('.weather-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });

        document.querySelector('.refresh-btn').addEventListener('click', () => {
            this.refreshWeather();
        });

        // 初始加载
        this.refreshWeather();
        
        // 每5分钟自动刷新
        setInterval(() => {
            this.refreshWeather();
        }, 5 * 60 * 1000);
    }
}

// 创建全局实例
const weatherAPI = new WeatherAPI();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 等待DOM完全加载
    setTimeout(() => {
        if (document.querySelector('.weather-widget')) {
            weatherAPI.init();
        }
    }, 100);
});

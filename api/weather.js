        // DOM元素
        const metarBtn = document.getElementById('realtime-metar-btn');
        const tafBtn = document.getElementById('realtime-taf-btn');
        const refreshBtn = document.getElementById('realtime-refresh-btn');
        const weatherStatus = document.getElementById('realtime-weather-status');
        const weatherDisplay = document.getElementById('realtime-weather-display');
        const lastUpdated = document.getElementById('last-updated');
        
        // 当前显示的数据类型
        let currentDataType = 'METAR';
        
        // 存储的数据
        let metarData = '';
        let tafData = '';
        
        // 初始化
        document.addEventListener('DOMContentLoaded', function() {
            // 添加按钮事件监听器
            metarBtn.addEventListener('click', function() {
                switchDataType('METAR');
            });
            
            tafBtn.addEventListener('click', function() {
                switchDataType('TAF');
            });
            
            refreshBtn.addEventListener('click', fetchAllWeatherData);
            
            // 初始加载数据
            fetchAllWeatherData();
        });
        
        // 切换数据类型
        function switchDataType(type) {
            currentDataType = type;
            
            // 更新按钮状态
            metarBtn.classList.toggle('active', type === 'METAR');
            tafBtn.classList.toggle('active', type === 'TAF');
            
            // 显示对应数据
            displayCurrentData();
        }
        
        // 显示当前选择的数据
        function displayCurrentData() {
            if (currentDataType === 'METAR') {
                if (metarData) {
                    weatherDisplay.textContent = metarData;
                    weatherStatus.innerHTML = '<span class="success-text">METAR数据已加载</span>';
                } else {
                    weatherDisplay.textContent = 'METAR数据尚未加载，请点击刷新按钮';
                }
            } else {
                if (tafData) {
                    weatherDisplay.textContent = tafData;
                    weatherStatus.innerHTML = '<span class="success-text">TAF数据已加载</span>';
                } else {
                    weatherDisplay.textContent = 'TAF数据尚未加载，请点击刷新按钮';
                }
            }
        }
        
        // 尝试使用CORS代理获取数据
        async function fetchWithCorsProxy(url) {
            // 尝试几个公共CORS代理
            const proxies = [
                `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
                `https://cors-anywhere.herokuapp.com/${url}`,
                `https://corsproxy.io/?${encodeURIComponent(url)}`
            ];
            
            for (let proxy of proxies) {
                try {
                    const response = await fetch(proxy, {
                        method: 'GET',
                        headers: {
                            'Accept': 'text/plain',
                        },
                        mode: 'cors'
                    });
                    
                    if (response.ok) {
                        return await response.text();
                    }
                } catch (error) {
                    console.log(`代理 ${proxy} 失败:`, error);
                    continue;
                }
            }
            
            throw new Error('所有CORS代理都失败了');
        }
        
        // 获取所有天气数据
        async function fetchAllWeatherData() {
            try {
                weatherStatus.innerHTML = '<span class="loading-text">正在获取天气数据...</span>';
                
                // 尝试使用CORS代理获取真实数据
                try {
                    const [metarResponse, tafResponse] = await Promise.all([
                        fetchWithCorsProxy('https://aviationweather.gov/api/data/metar?ids=VHHH&format=raw'),
                        fetchWithCorsProxy('https://aviationweather.gov/api/data/taf?ids=VHHH&format=raw')
                    ]);
                    
                    metarData = metarResponse;
                    tafData = tafResponse;
                    
                    weatherStatus.innerHTML = '<span class="success-text">✓ 实时数据已成功更新</span>';
                } catch (proxyError) {
                    console.log('CORS代理失败，使用模拟数据:', proxyError);
                    // 如果代理失败，使用模拟数据
                    metarData = mockMetarData;
                    tafData = mockTafData;
                    
                    weatherStatus.innerHTML = '<span class="warning-text">⚠ 使用模拟数据 (API限制)</span>';
                }
                
                // 显示当前数据
                displayCurrentData();
                
                // 更新最后刷新时间
                const now = new Date();
                lastUpdated.textContent = `最后更新: ${now.toLocaleString()}`;
                
            } catch (error) {
                console.error('获取天气数据时出错:', error);
                weatherStatus.innerHTML = `<span class="error-text">错误: ${error.message}</span>`;
                weatherDisplay.textContent = '无法获取天气数据，请检查网络连接或稍后重试';
            }
        }

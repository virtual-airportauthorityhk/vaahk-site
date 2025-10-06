export default async function handler(req, res) {
    try {
        // 添加CORS头
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        
        // 获取TAF数据
        const response = await fetch('https://aviationweather.gov/api/data/taf?ids=VHHH&format=json');
        
        if (!response.ok) {
            throw new Error(`AWC API错误: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data || data.length === 0) {
            throw new Error('未获取到TAF数据');
        }
        
        const latest = data[0];

        
        // ===== 完整翻译函数 =====
        
        function translateChangeType(type) {
            const translations = {
                'FM': '从指定时间开始',
                'BECMG': '逐渐变化',
                'TEMPO': '临时变化',
                'PROB30': '30%概率',
                'PROB40': '40%概率'
            };
            return translations[type] || type;
        }
        
        function translateCloudCover(cover) {
            const translations = {
                'CLR': '晴空',
                'SKC': '晴空',
                'FEW': '少云',
                'SCT': '散云',
                'BKN': '多云',
                'OVC': '阴天',
                'VV': '垂直能见度'
            };
            return translations[cover] || cover;
        }
        
        function formatTime(unixTime) {
            if (!unixTime) return '未知';
            const date = new Date(unixTime * 1000);
            return date.toISOString().replace('T', ' ').substring(0, 16) + ' UTC';
        }
        
        function formatTimeRange(from, to) {
            if (!from || !to) return '未知时间范围';
            const fromDate = new Date(from * 1000);
            const toDate = new Date(to * 1000);
            
            const fromStr = fromDate.toISOString().substring(8, 13).replace('T', ' ');
            const toStr = toDate.toISOString().substring(8, 13).replace('T', ' ');
            
            return `${fromStr} - ${toStr}`;
        }
        
        // ===== 数据处理 =====
        
        // 基本信息
        const basicInfo = {
            icaoId: latest.icaoId || '未知',
            stationName: latest.name || '未知',
            bulletinTime: latest.bulletinTime || '未知',
            issueTime: latest.issueTime || '未知',
            validTimeFrom: formatTime(latest.validTimeFrom),
            validTimeTo: formatTime(latest.validTimeTo),
            validRange: formatTimeRange(latest.validTimeFrom, latest.validTimeTo),
            coordinates: {
                latitude: latest.lat || null,
                longitude: latest.lon || null,
                elevation: latest.elev ? `${latest.elev}米` : '未知'
            },
            mostRecent: latest.mostRecent === 1 ? '最新版本' : '历史版本'
        };
        
        // 处理预报段
        let forecastPeriods = [];
        if (latest.fcsts && latest.fcsts.length > 0) {
            forecastPeriods = latest.fcsts.map((fcst, index) => {
                // 风向风速
                let windInfo = '无风向数据';
                if (fcst.wdir && fcst.wspd !== null) {
                    windInfo = `${fcst.wdir}° ${fcst.wspd}节`;
                    if (fcst.wgst) {
                        windInfo += ` (阵风${fcst.wgst}节)`;
                    }
                }
                
                // 风切变
                let windShear = null;
                if (fcst.wshearHgt && fcst.wshearDir && fcst.wshearSpd) {
                    windShear = `${fcst.wshearHgt}英尺: ${fcst.wshearDir}°/${fcst.wshearSpd}节`;
                }
                
                // 能见度
                let visibility = '未知';
                if (fcst.visib) {
                    if (fcst.visib === '6+') {
                        visibility = '大于6英里 (>10公里)';
                    } else {
                        visibility = `${fcst.visib}英里`;
                    }
                }
                
                // 云况
                let cloudInfo = '无云况数据';
                if (fcst.clouds && fcst.clouds.length > 0) {
                    const cloudDetails = fcst.clouds.map(cloud => {
                        let result = translateCloudCover(cloud.cover);
                        if (cloud.base) {
                            result += ` ${cloud.base}英尺`;
                        }
                        if (cloud.type) {
                            result += ` (${cloud.type})`;
                        }
                        return result;
                    });
                    cloudInfo = cloudDetails.join(', ');
                }
                
                // 垂直能见度
                let verticalVisibility = null;
                if (fcst.vertVis) {
                    verticalVisibility = `${fcst.vertVis}英尺`;
                }
                
                // 气压
                let pressure = null;
                if (fcst.altim) {
                    const hPa = Math.round(fcst.altim * 33.8639);
                    pressure = `${fcst.altim} inHg (${hPa} hPa)`;
                }
                
                // 温度信息
                let temperatureInfo = [];
                if (fcst.temp && fcst.temp.length > 0) {
                    fcst.temp.forEach(tempData => {
                        const tempTime = formatTime(tempData.validTime);
                        const tempType = tempData.maxOrMin === 'MAX' ? '最高温度' : '最低温度';
                        temperatureInfo.push(`${tempType}: ${tempData.surfaceTemp}°C (${tempTime})`);
                    });
                }
                
                return {
                    periodIndex: index + 1,
                    timeFrom: formatTime(fcst.timeFrom),
                    timeTo: formatTime(fcst.timeTo),
                    timeRange: formatTimeRange(fcst.timeFrom, fcst.timeTo),
                    changeType: fcst.fcstChange ? translateChangeType(fcst.fcstChange) : null,
                    becomeTime: fcst.timeBec ? formatTime(fcst.timeBec) : null,
                    probability: fcst.probability ? `${fcst.probability}%概率` : null,
                    
                    wind: {
                        info: windInfo,
                        direction: fcst.wdir,
                        speed: fcst.wspd,
                        gust: fcst.wgst,
                        shear: windShear
                    },
                    
                    visibility: {
                        info: visibility,
                        raw: fcst.visib,
                        vertical: verticalVisibility
                    },
                    
                    clouds: {
                        info: cloudInfo,
                        details: fcst.clouds || []
                    },
                    
                    pressure: {
                        info: pressure,
                        altimeter: fcst.altim
                    },
                    
                    weather: {
                        phenomena: fcst.wxString || null
                    },
                    
                    temperature: {
                        info: temperatureInfo,
                        count: temperatureInfo.length
                    },
                    
                    turbulenceIcing: fcst.icgTurb || []
                };
            });
        }
        
        // 生成预报摘要
        let summary = '预报可用';
        if (forecastPeriods.length > 0) {
            const mainForecast = forecastPeriods[0];
            let summaryParts = [];
            
            if (mainForecast.wind.info !== '无风向数据') {
                summaryParts.push(mainForecast.wind.info);
            }
            
            if (mainForecast.visibility.info !== '未知') {
                summaryParts.push(`能见度${mainForecast.visibility.info}`);
            }
            
            if (mainForecast.clouds.info !== '无云况数据') {
                summaryParts.push(mainForecast.clouds.info);
            }
            
            if (summaryParts.length > 0) {
                summary = summaryParts.join(', ');
            }
        }
        
        // 组合完整数据
        const translatedData = {
            // 基本信息
            basicInfo,
            
            // 预报摘要
            summary: {
                text: summary,
                periodsCount: forecastPeriods.length
            },
            
            // 详细预报段
            forecastPeriods,
            
            // 备注
            remarks: latest.remarks || null,
            
            // 原始数据
            rawText: latest.rawTAF || '无原始数据',
            
            // 时间戳
            lastUpdate: new Date().toISOString()
        };
        
        // 设置缓存
        res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
        res.status(200).json({ 
            success: true, 
            data: translatedData,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('TAF API错误:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

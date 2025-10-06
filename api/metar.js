export default async function handler(req, res) {
    try {
        // 添加CORS头
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        
        // 获取METAR数据
        const response = await fetch('https://aviationweather.gov/api/data/metar?ids=VHHH&format=json');
        
        if (!response.ok) {
            throw new Error(`AWC API错误: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data || data.length === 0) {
            throw new Error('未获取到METAR数据');
        }
        
        const latest = data[0];
        
        // ===== 完整翻译函数 =====
        
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
        
        function translateFlightCategory(category) {
            const translations = {
                'VFR': '目视飞行规则 (VFR)',
                'MVFR': '边际目视飞行规则 (MVFR)', 
                'IFR': '仪表飞行规则 (IFR)',
                'LIFR': '低仪表飞行规则 (LIFR)'
            };
            return translations[category] || category;
        }
        
        function translateMetarType(type) {
            const translations = {
                'METAR': '定时气象报告',
                'SPECI': '特殊气象报告'
            };
            return translations[type] || type;
        }
        
        function translateWeatherPhenomena(wxString) {
            if (!wxString) return null;
            
            const translations = {
                // 强度
                '-': '轻',
                '+': '重',
                'VC': '附近',
                
                // 降水
                'RA': '雨',
                'SN': '雪', 
                'DZ': '毛毛雨',
                'SG': '雪粒',
                'IC': '冰晶',
                'PL': '冰丸',
                'GR': '冰雹',
                'GS': '小冰雹',
                'UP': '未知降水',
                
                // 遮蔽现象
                'FG': '雾',
                'BR': '薄雾',
                'HZ': '霾',
                'DU': '浮尘',
                'SA': '沙',
                'VA': '火山灰',
                'PY': '喷雾',
                'FU': '烟',
                
                // 其他现象
                'SQ': '飑线',
                'FC': '漏斗云',
                'SS': '沙暴',
                'DS': '尘暴',
                'TS': '雷暴',
                'FZFG': '冻雾',
                'FZDZ': '冻毛毛雨',
                'FZRA': '冻雨',
                'SHGR': '阵雹',
                'SHGS': '阵性小冰雹',
                'SHRA': '阵雨',
                'SHSN': '阵雪',
                'TSGR': '雷暴伴冰雹',
                'TSRA': '雷暴伴雨',
                'TSSN': '雷暴伴雪'
            };
            
            let translated = wxString;
            Object.keys(translations).forEach(key => {
                translated = translated.replace(new RegExp(key, 'g'), translations[key]);
            });
            
            return translated;
        }
        
        // ===== 数据处理 =====
        
        // 基本信息
        const basicInfo = {
            icaoId: latest.icaoId || '未知',
            stationName: latest.name || '未知',
            metarType: translateMetarType(latest.metarType),
            receiptTime: latest.receiptTime || '未知',
            observationTime: latest.reportTime || '未知',
            obsTimeUnix: latest.obsTime || null,
            coordinates: {
                latitude: latest.lat || null,
                longitude: latest.lon || null,
                elevation: latest.elev ? `${latest.elev}米` : '未知'
            }
        };
        
        // 风向风速
        let windInfo = '无风向数据';
        if (latest.wdir && latest.wspd !== null) {
            if (latest.wdir === 'VRB') {
                windInfo = `变风 ${latest.wspd}节`;
            } else {
                windInfo = `${latest.wdir}° ${latest.wspd}节`;
            }
            
            if (latest.wgst) {
                windInfo += ` (阵风${latest.wgst}节)`;
            }
        } else if (latest.wspd === 0) {
            windInfo = '无风';
        }
        
        // 能见度
        let visibility = '未知';
        if (latest.visib) {
            if (latest.visib === '6+') {
                visibility = '大于6英里 (>10公里)';
            } else if (latest.visib === '10+') {
                visibility = '大于10英里 (>16公里)';
            } else {
                visibility = `${latest.visib}英里`;
            }
        }
        
        // 云况详细信息
        let cloudInfo = '无云况数据';
        let skyCondition = latest.cover ? translateCloudCover(latest.cover) : '未知';
        
        if (latest.clouds && latest.clouds.length > 0) {
            const cloudDetails = latest.clouds.map(cloud => {
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
        
        // 温度和露点
        let temperature = '未知';
        let dewPoint = '未知';
        if (latest.temp !== null && latest.dewp !== null) {
            temperature = `${latest.temp}°C`;
            dewPoint = `${latest.dewp}°C`;
        }
        
        // 气压
        let pressure = '未知';
        if (latest.altim) {
            // 转换为百帕
            const hPa = Math.round(latest.altim * 33.8639);
            pressure = `${latest.altim} inHg (${hPa} hPa)`;
        }
        
        // 天气现象
        let weatherPhenomena = null;
        if (latest.wxString) {
            weatherPhenomena = translateWeatherPhenomena(latest.wxString);
        }
        
        // 飞行类别
        const flightCategory = {
            category: translateFlightCategory(latest.fltCat),
            rawCategory: latest.fltCat || '未知'
        };
        
        // QC字段（质量控制）
        let qualityControl = null;
        if (latest.qcField) {
            qualityControl = `QC标志: ${latest.qcField}`;
        }
        
        // 组合完整数据
        const translatedData = {
            // 基本信息
            basicInfo,
            
            // 观测数据
            wind: {
                info: windInfo,
                direction: latest.wdir,
                speed: latest.wspd,
                gust: latest.wgst || null
            },
            
            visibility: {
                info: visibility,
                raw: latest.visib
            },
            
            clouds: {
                info: cloudInfo,
                skyCondition: skyCondition,
                details: latest.clouds || []
            },
            
            temperature: {
                current: temperature,
                dewPoint: dewPoint,
                raw: {
                    temp: latest.temp,
                    dewp: latest.dewp
                }
            },
            
            pressure: {
                info: pressure,
                altimeter: latest.altim
            },
            
            weather: {
                phenomena: weatherPhenomena,
                rawString: latest.wxString || null
            },
            
            flightCategory,
            
            // 技术信息
            qualityControl,
            rawText: latest.rawOb || '无原始数据',
            
            // 时间戳
            lastUpdate: new Date().toISOString()
        };
        
        // 设置缓存
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
        res.status(200).json({ 
            success: true, 
            data: translatedData,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('METAR API错误:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

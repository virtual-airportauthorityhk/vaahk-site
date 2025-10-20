// api
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { type } = req.query;
  const station = 'VHHH'; 

  try {
    let apiUrl;
    
    if (type === 'metar') {
      apiUrl = `https://aviationweather.gov/api/data/metar?ids=${station}&format=raw`;
    } else if (type === 'taf') {
      apiUrl = `https://aviationweather.gov/api/data/taf?ids=${station}&format=raw`;
    } else {
      return res.status(400).json({ error: 'Invalid type parameter. Use "metar" or "taf".' });
    }

    console.log(`Fetching ${type.toUpperCase()} for ${station} from:`, apiUrl);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.text();
    
    console.log(`Received ${type.toUpperCase()} data for ${station}:`, data.substring(0, 100) + '...');
    
    // 检查是否返回了有效数据
    if (!data || data.trim() === '') {
      throw new Error(`No data returned for station ${station}`);
    }
    
    if (!data.includes(station)) {
      throw new Error(`Invalid data returned. Expected station ${station}`);
    }
    
    // 返回原始文本数据
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send(data);
    
  } catch (error) {
    console.error('Weather API error for station VHHH:', error);
    res.status(500).json({ 
      error: 'Failed to fetch weather data for Hong Kong International Airport (VHHH)',
      message: error.message,
      station: 'VHHH'
    });
  }
};

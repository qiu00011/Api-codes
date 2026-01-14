export default {
  async fetch(request, env) {
    // CORS 头，允许你的网站跨域访问
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    // 处理 OPTIONS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      let allObjects = [];
      let cursor = undefined;
      let truncated = true;

      // 循环获取所有对象，直到没有更多（truncated 为 false）
      while (truncated) {
        const result = await env.MY_BUCKET.list({
          limit: 1000, // 每次请求最大数量
          cursor: cursor // 下一页的游标
        });

        allObjects.push(...result.objects);
        
        truncated = result.truncated;
        cursor = result.cursor;
      }
      
      // 筛选出 .jpg 和 .png 文件
      const images = allObjects
        .filter(obj => obj.key.match(/\.(jpg|jpeg|png)$/i))
        .map(obj => `https://hyeriphotos.hyeri.us.kg/${obj.key}`);

      return new Response(
        JSON.stringify({ 
          success: true,
          count: images.length,
          images: images 
        }), 
        { 
          headers: corsHeaders,
          status: 200
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: error.message 
        }), 
        {
          status: 500,
          headers: corsHeaders
        }
      );
    }
  }
};

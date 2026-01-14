export default {
  async fetch(request, env) {
    // 1. 设置跨域头 (CORS)，允许你的网页访问
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    // 2. 处理 OPTIONS 预检请求 (浏览器自动发送的)
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 3. 解析 URL 参数
      const url = new URL(request.url);
      const cursor = url.searchParams.get('cursor'); // 分页游标
      
      // 获取前端传来的文件夹前缀，如果没有传，默认为空（即列出根目录所有）
      const prefix = url.searchParams.get('prefix') || ''; 

      // 4. 向 R2 请求数据 (核心筛选逻辑)
      const listed = await env.MY_BUCKET.list({
        prefix: prefix, // <--- 关键：只列出符合此前缀(文件夹)的文件
        limit: 50,      // 每次最多取 50 张，不够再去取
        cursor: cursor ? cursor : undefined
      });
      
      // 5. 处理结果：过滤出图片格式，并拼接完整 URL
      const images = listed.objects
        .filter(obj => obj.key.match(/\.(jpg|jpeg|png|webp|gif)$/i))
        .map(obj => `https://hyeriphotos.hyeri.us.kg/${obj.key}`);

      // 6. 返回给前端
      return new Response(
        JSON.stringify({ 
          success: true,
          images: images,
          // 告诉前端下一页在哪 (如果没有下一页，这里是 null)
          next_cursor: listed.truncated ? listed.cursor : null 
        }), 
        { 
          headers: corsHeaders,
          status: 200
        }
      );

    } catch (error) {
      // 出错处理
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

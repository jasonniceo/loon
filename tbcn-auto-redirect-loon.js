/*
Loon 淘宝短链自动跳转
使用方式：配置为HTTP请求脚本
*/

const targetDomains = ["m.tb.cn"];
const redirectPrefix = "https://f.m.taobao.com/wow/pone/pcraft/common/common-redirect?wh_pid=";

// 主处理函数
if (typeof $request !== 'undefined') {
    handleRequest($request);
}

function handleRequest(request) {
    const url = request.url;
    
    // 检查是否是目标域名
    const isTarget = targetDomains.some(domain => url.includes(domain));
    
    if (!isTarget) {
        $done({});
        return;
    }
    
    try {
        // 编码URL
        const encodedUrl = encodeURIComponent(url);
        const finalUrl = redirectPrefix + encodedUrl;
        
        console.log(`淘宝短链跳转：
        原始链接: ${url}
        目标链接: ${finalUrl}`);
        
        // 返回302重定向
        $done({
            response: {
                status: 302,
                headers: {
                    "Location": finalUrl,
                    "Cache-Control": "no-cache, no-store, must-revalidate"
                }
            }
        });
    } catch (error) {
        console.error(`跳转失败: ${error}`);
        $done({});
    }
}

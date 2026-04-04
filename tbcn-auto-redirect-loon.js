/*
Loon 淘宝短链双重跳转脚本
功能：1. 先跳转到原始商品链接 2. 再跳转到指定中转地址
使用方式：配置为HTTP请求脚本
*/

// 配置
const targetDomains = ["m.tb.cn"];
const redirectPrefix = "https://f.m.taobao.com/wow/pone/pcraft/common/common-redirect?wh_pid=";
const userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

// 主处理函数
if (typeof $request !== 'undefined') {
    handleRequest($request);
}

async function handleRequest(request) {
    const url = request.url;
    
    // 检查是否是目标域名
    const isTarget = targetDomains.some(domain => url.includes(domain));
    
    if (!isTarget) {
        $done({});
        return;
    }
    
    console.log(`[淘宝短链处理] 捕获链接: ${url}`);
    
    try {
        // 步骤1: 获取原始商品链接
        const originalUrl = await getOriginalUrl(url);
        
        if (!originalUrl) {
            console.log(`[步骤1失败] 无法获取原始链接，直接放行`);
            $done({});
            return;
        }
        
        console.log(`[步骤1完成] 原始商品链接: ${originalUrl}`);
        
        // 步骤2: 对原始链接编码并拼接前缀
        const encodedUrl = encodeURIComponent(originalUrl);
        const finalUrl = redirectPrefix + encodedUrl;
        
        console.log(`[步骤2完成] 最终目标链接: ${finalUrl}`);
        
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
        console.error(`[处理失败] 错误: ${error.message}`);
        $done({});
    }
}

// 获取原始链接的函数
async function getOriginalUrl(shortUrl) {
    return new Promise((resolve) => {
        // 创建一个HEAD请求，只获取响应头
        const req = {
            method: "HEAD",
            url: shortUrl,
            headers: {
                "User-Agent": userAgent,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "zh-CN,zh-Hans;q=0.9",
                "Accept-Encoding": "gzip, deflate, br"
            }
        };
        
        // 发送请求
        $httpClient.head(req, function(error, response, data) {
            if (error) {
                console.log(`[HEAD请求失败] ${error}`);
                resolve(null);
                return;
            }
            
            // 检查响应状态码
            if (response.status >= 300 && response.status < 400) {
                // 获取Location头
                const location = response.headers["Location"] || response.headers["location"];
                if (location) {
                    console.log(`[获取成功] 原始链接: ${location}`);
                    resolve(location);
                } else {
                    console.log(`[无跳转链接] 状态码: ${response.status}`);
                    resolve(null);
                }
            } else {
                // 如果不是重定向，则使用原链接
                console.log(`[非重定向] 状态码: ${response.status}`);
                resolve(shortUrl);
            }
        });
    });
}

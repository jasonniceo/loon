/*
Loon 远程脚本：m.tb.cn短链接自动跳转指定中转地址
功能：拦截淘宝短链，自动跳转到指定中转地址
更新时间：2026-04
*/

const redirectPrefix = "https://f.m.taobao.com/wow/pone/pcraft/common/common-redirect?wh_pid=";

if (typeof $request !== 'undefined') {
    // 这是作为HTTP请求拦截器使用
    const originalUrl = $request.url;
    
    // 匹配m.tb.cn域名
    if (originalUrl.includes('m.tb.cn')) {
        const encodedUrl = encodeURIComponent(originalUrl);
        const finalUrl = redirectPrefix + encodedUrl;
        
        console.log(`[淘宝短链转换] 原始: ${originalUrl}`);
        console.log(`[淘宝短链转换] 目标: ${finalUrl}`);
        
        $done({
            response: {
                status: 302,
                headers: {
                    "Location": finalUrl
                }
            }
        });
    } else {
        $done({});
    }
} else {
    // 这是作为主页小部件或快捷指令使用
    console.log("脚本已加载，等待HTTP请求触发...");
    $done({});
}

/*
Loon 远程脚本：m.tb.cn短链接自动跳转
功能：自动将m.tb.cn短链接转换为中转链接
更新时间：2026-04
*/

const targetPrefix = "https://f.m.taobao.com/wow/pone/pcraft/common/common-redirect?wh_pid=";

if (typeof $request !== 'undefined') {
    // 脚本模式
    const url = $request.url;
    
    // 只处理m.tb.cn域名
    if (url.includes("m.tb.cn")) {
        try {
            // URL编码处理
            const encodedUrl = encodeURIComponent(url);
            const finalUrl = targetPrefix + encodedUrl;
            
            console.log(`原始链接: ${url}`);
            console.log(`跳转链接: ${finalUrl}`);
            
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
            console.log(`处理失败: ${error}`);
            $done({});
        }
    } else {
        $done({});
    }
} else {
    // 重写规则模式
    $done({
        "name": "淘宝短链接跳转",
        "desc": "自动跳转m.tb.cn链接",
        "rules": [
            {
                "match": `^https?://m\\.tb\\.cn/`,
                "script": `
                    const url = $request.url;
                    const encoded = encodeURIComponent(url);
                    const redirectUrl = "${targetPrefix}" + encoded;
                    
                    $done({
                        response: {
                            status: 302,
                            headers: {
                                "Location": redirectUrl
                            }
                        }
                    });
                `
            }
        ]
    });
}

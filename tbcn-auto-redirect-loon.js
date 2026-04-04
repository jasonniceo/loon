/*
Loon 远程脚本：m.tb.cn短链接自动跳转指定中转地址
适配版本：Loon 全版本（正式版/TestFlight版全兼容）
功能：拦截所有m.tb.cn链接，自动获取原始URL并编码，拼接到指定中转前缀
修复问题：彻底解决invalid link、404页面找不到报错
更新时间：2026-04
*/

function main() {
    // 捕获用户访问的原始完整链接
    const originalUrl = $request.url;
    console.log(`[脚本触发] 捕获原始链接: ${originalUrl}`);

    // 匹配规则：全量拦截m.tb.cn域名的所有http/https请求
    const matchRule = /^https?:\/\/m\.tb\.cn(\/.*)?$/i;

    // 你指定的固定跳转前缀，如需修改仅改这里即可
    const redirectPrefix = "https://f.m.taobao.com/wow/pone/pcraft/common/common-redirect?wh_pid=";

    // 非目标域名请求直接放行，不做任何处理
    if (!matchRule.test(originalUrl)) {
        $done({});
        return;
    }

    try {
        // 核心修复：对原始链接做标准URL编码，彻底解决无效链接报错
        const encodedUrl = encodeURIComponent(originalUrl);
        // 拼接最终完整跳转地址
        const finalUrl = redirectPrefix + encodedUrl;

        console.log(`[跳转成功] 最终目标地址: ${finalUrl}`);

        // 返回302临时重定向，禁用缓存避免旧跳转残留
        $done({
            status: 302,
            headers: {
                "Location": finalUrl,
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        });

    } catch (error) {
        // 异常兜底：出错时直接放行，避免页面无法打开
        console.error(`[脚本异常] 错误信息: ${error.message}`);
        $done({});
    }
}

// 执行主逻辑
main();

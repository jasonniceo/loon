/*
Loon 专用脚本：m.tb.cn短链接自动跳转指定中转地址
适配版本：Loon 全版本（含App Store正式版/TestFlight内测版）
需求匹配：拦截m.tb.cn链接，自动获取原始URL，拼接到指定前缀作为wh_pid参数
解决问题：彻底修复invalid link无效链接、跳转404问题
更新时间：2026-04
*/

function main() {
    // 获取用户访问的原始完整URL
    const originalUrl = $request.url;
    console.log(`[脚本触发] 捕获到原始链接: ${originalUrl}`);

    // 匹配规则：拦截所有 m.tb.cn 域名的http/https请求（全路径兼容）
    const matchReg = /^https?:\/\/m\.tb\.cn(\/.*)?$/i;

    // 你指定的跳转前缀（如需调整前缀仅修改这里即可）
    const redirectPrefix = "https://f.m.taobao.com/wow/pone/pcraft/common/common-redirect?wh_pid=";

    // 非目标域名的请求直接放行
    if (!matchReg.test(originalUrl)) {
        console.log("[脚本放行] 非m.tb.cn域名，不触发跳转");
        $done({});
        return;
    }

    try {
        // 核心修复：对原始URL做标准URL编码，彻底解决invalid link报错
        const encodedOriginalUrl = encodeURIComponent(originalUrl);
        // 拼接最终的完整跳转URL
        const finalRedirectUrl = redirectPrefix + encodedOriginalUrl;

        console.log(`[跳转成功] 最终跳转地址: ${finalRedirectUrl}`);

        // 返回302临时重定向，禁用缓存避免旧跳转残留
        $done({
            status: 302,
            headers: {
                "Location": finalRedirectUrl,
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

// ==UserScript==
// @name         瑟瑟视频侦测播放
// @namespace    https://t.me/+2T-oJk2FFts4NDZl
// @version      1.7.0
// @description  自动检测.m3u8并自动打开播放页面，视频播放完毕后自动关闭页面
// @author       Mr.Eric
// @match        *://*/*
// @exclude      *://www.diancigaoshou.com/*
// @require      https://cdn.jsdelivr.net/npm/m3u8-parser@4.7.1/dist/m3u8-parser.min.js
// @connect      *
// @grant        unsafeWindow
// @grant        GM_openInTab
// @grant        GM.openInTab
// @grant        GM_getValue
// @grant        GM.getValue
// @grant        GM_setValue
// @grant        GM.setValue
// @grant        GM_deleteValue
// @grant        GM.deleteValue
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @grant        GM_download
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // ---------- 基础工具 ----------
    const mgmapi = {
        async getValue(name, defaultVal) {
            return await ((typeof GM_getValue === "function") ? GM_getValue : GM.getValue)(name, defaultVal);
        },
        async setValue(name, value) {
            return await ((typeof GM_setValue === "function") ? GM_setValue : GM.setValue)(name, value);
        },
        async deleteValue(name) {
            return await ((typeof GM_deleteValue === "function") ? GM_deleteValue : GM.deleteValue)(name);
        },
        openInTab(url, open_in_background = false) {
            console.log('[mgmapi] 尝试打开:', url);
            return ((typeof GM_openInTab === "function") ? GM_openInTab : GM.openInTab)(url, { active: !open_in_background });
        },
        message(text) {
            console.log('[消息]', text);
        }
    };

    // ---------- 自动打开与替换核心 ----------
    async function autoOpenReplacedUrl(originalUrl) {
        console.log('[autoOpen] 收到URL:', originalUrl);

        if (!/play/.test(originalUrl)) {
            console.log('[autoOpen] 不含play，忽略');
            return false;
        }

        const newUrl = originalUrl.replace(/\w*play/g, 'long');
        console.log('[autoOpen] 替换后:', newUrl);

        if (newUrl === originalUrl) {
            console.log('[autoOpen] 替换无变化，忽略');
            return false;
        }

        const openedKey = 'autoOpenedUrls';
        let opened = await mgmapi.getValue(openedKey, []);
        if (opened.includes(newUrl)) {
            console.log('[autoOpen] 已打开过，跳过');
            return false;
        }

        // 标记该URL为自动打开的视频页面（用于关闭检测）
        await mgmapi.setValue('autoCloseTarget', newUrl);

        opened.push(newUrl);
        await mgmapi.setValue(openedKey, opened);

        try {
            mgmapi.openInTab(newUrl, false);
            console.log('[autoOpen] ✅ 已打开替换后的链接');
            return true;
        } catch (e) {
            console.error('[autoOpen] 打开失败:', e);
            // 打开失败则清除标记
            await mgmapi.deleteValue('autoCloseTarget');
            return false;
        }
    }

    // ---------- 拦截 .m3u8 请求 ----------
    async function doM3U({ url, content }) {
        url = new URL(url);
        console.log('[doM3U] 捕获到m3u8:', url.href);
        await autoOpenReplacedUrl(url.href);
        console.log('[doM3U] 已处理');
    }

    // ---------- 拦截 <video> 标签 ----------
    let shownUrls = [];
    async function doVideos() {
        for (let v of Array.from(document.querySelectorAll("video"))) {
            const src = v.src;
            if (src && src.startsWith("http") && !shownUrls.includes(src)) {
                console.log('[doVideos] 捕获到video.src:', src);
                shownUrls.push(src);
                await autoOpenReplacedUrl(src);
            }
        }
    }

    // ---------- 页面启动后：检测当前页面是否由我们打开，并监测视频播放结束 ----------
    (async function checkAndAutoClose() {
        // 只处理非顶层（可能被嵌套）但我们也接受
        const target = await mgmapi.getValue('autoCloseTarget', '');
        if (!target) return;
        if (window.location.href !== target) {
            // 可能因为重定向等原因，只要包含目标路径即可（可根据需求放宽）
            // 这里使用精确匹配，如果重定向了则不关闭
            return;
        }

        console.log('[自动关闭] 检测到自动打开的视频页面，等待视频播放完毕...');

        // 清除标记，防止其他页面误触发
        await mgmapi.deleteValue('autoCloseTarget');

        // 寻找视频并监听 ended 事件
        const checkVideo = () => {
            const video = document.querySelector('video');
            if (video) {
                // 如果视频已结束，直接关闭
                if (video.ended) {
                    console.log('[自动关闭] 视频已结束，立即关闭');
                    setTimeout(() => window.close(), 1000);
                    return true;
                }
                // 否则监听 ended
                video.addEventListener('ended', () => {
                    console.log('[自动关闭] 视频播放完毕，关闭页面');
                    setTimeout(() => window.close(), 1000);
                });
                return true;
            }
            return false;
        };

        // 如果当前已有 video，直接处理
        if (checkVideo()) return;

        // 否则使用 MutationObserver 等待 video 出现
        const observer = new MutationObserver(() => {
            if (checkVideo()) {
                observer.disconnect();
            }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });

        // 超时保护：60秒后如果仍未检测到 video，关闭页面（可选）
        setTimeout(() => {
            observer.disconnect();
            console.log('[自动关闭] 超时未检测到视频，关闭页面');
            window.close();
        }, 60000);
    })();

    // ---------- 初始化劫持 ----------
    (async function init() {
        // 清空已打开记录（方便调试）
        await mgmapi.setValue('autoOpenedUrls', []);
        console.log('[初始化] 已清空 autoOpenedUrls');
    })();

    // 劫持 XMLHttpRequest
    const _open = unsafeWindow.XMLHttpRequest.prototype.open;
    unsafeWindow.XMLHttpRequest.prototype.open = function (...args) {
        this.addEventListener("load", () => {
            try {
                let content = this.responseText;
                if (content && content.trim().startsWith("#EXTM3U")) {
                    doM3U({ url: args[1], content });
                }
            } catch { }
        });
        return _open.apply(this, args);
    };

    // 劫持 fetch
    const _fetch = unsafeWindow.fetch;
    unsafeWindow.fetch = function (input, init) {
        return _fetch.call(this, input, init).then(response => {
            const cloned = response.clone();
            cloned.text().then(text => {
                if (text && text.trim().startsWith("#EXTM3U")) {
                    doM3U({ url: response.url, content: text });
                }
            }).catch(() => {});
            return response;
        });
    };

    // 劫持 video.src 的 setter
    const videoProto = HTMLVideoElement.prototype;
    const origSrcDesc = Object.getOwnPropertyDescriptor(videoProto, 'src');
    if (origSrcDesc) {
        Object.defineProperty(videoProto, 'src', {
            get: origSrcDesc.get,
            set: function(value) {
                if (typeof value === 'string' && value.startsWith('http')) {
                    console.log('[video.src setter] 设置src:', value);
                    if (!shownUrls.includes(value)) {
                        shownUrls.push(value);
                        autoOpenReplacedUrl(value);
                    }
                }
                origSrcDesc.set.call(this, value);
            }
        });
    }

    // 定时扫描 video（兜底）
    setInterval(doVideos, 1500);

    // 页面加载完成后扫描一次
    window.addEventListener('load', doVideos);

    console.log('[脚本] 已启动，所有包含play的.m3u8或video.src将被替换并打开，视频结束后自动关闭。');
})();

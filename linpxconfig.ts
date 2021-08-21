/**
 * 本地代理url
 * 大多数中国开发者本地调试时无法访问pixiv后端，并且node访问所以本地可能需要使用代理服务器
 * 我使用的v2ray的默认代理端口是10809，需要根据实际情况调整
 */
export const LOCAL_PROXY = 'http://localhost:10809';

/**
 * pixiv的用户id
 */
 export const PIXIV_ID = '你的pixiv id';

/**
 * pixiv账号cookie中的phpsession字段，用于访问pixiv账号数据
 * 可以通过访问pixiv官网，chrome f12调试查看network中发送的请求中的cookie字段
 * 格式为"PHPSESSID=【你的PIXIV_ID】_XXXXXXXXXXXXXXXXX;"
 */
export const PIXIV_SESSION = '请通过查看你的pixiv账号的游览器请求cookie获取此字段';

/**
 * mongodb数据库url
 * 格式为：'mongodb://账号:密码@IP:端口/
 * 详见mongodb的教程和文档
 */
export const DATABASE_URL = 'mongodb://请输入你的mongodb地址/';

/**
 * 部署的端口
 */
export const PORT = '3001';
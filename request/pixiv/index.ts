import request from 'request';
import { LOCAL_PROXY, PIXIV_SESSION } from '../../linpxconfig';

// 开发环境下使用代理
export const isDev = (process.env.ENV === 'DEV');
console.log('isDev:', isDev);
export const proxy = isDev ? LOCAL_PROXY : false;

export const host = 'https://www.pixiv.net';
export const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36',
  'Cookie': PIXIV_SESSION,
  'referer': 'https://www.pixiv.net',
};

export const pixivRequest = (path:string) => {
  const url = host + path;
  return new Promise((resolve, reject)=>{
    request({
      url,
      proxy,
      headers,
    }, (err, res, body)=>{
      if(err){
        reject(err);
      } else {
        resolve(JSON.parse(body));
      }
    });
  });
};
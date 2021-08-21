import { pixivRequest, host, proxy, headers } from './index';
import { IMap, IFavUser } from '../../model/types';
import request from 'request';
import qs from 'qs';
import { PIXIV_ID } from '../../linpxconfig';

export const getUserProfile = (userId:string) => {
  return pixivRequest(`/ajax/user/${userId}/profile/all?lang=zh`);
}

export const getUserInfo = (userId:string) => {
  return pixivRequest(`/ajax/user/${userId}?full=1`);
}

export const followUser = (id:string)=>{
  return new Promise((resolve, reject)=>{
    request({
      url: host + '/bookmark_add.php',
      method: 'post',
      proxy,
      body: qs.stringify({
        mode: 'add',
        type: 'user',
        user_id: id,
        restrict: 0,
        format: 'json',
      }),
      headers: Object.assign({
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-csrf-token': '1603dfde885b1630e64d88616592013f',
      }, headers)
    }, (err, res, body)=>{
      if(err) reject(err);
      else resolve(body);
    });
  });
}

export const unfollowUser = (id: string) => {
  return new Promise((resolve, reject)=>{
    request({
      url: host + '/rpc_group_setting.php',
      method: 'post',
      proxy,
      body: qs.stringify({
        mode: 'del',
        type: 'bookuser',
        id,
      }),
      headers: Object.assign({
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-csrf-token': '1603dfde885b1630e64d88616592013f',
      }, headers)
    }, (err, res, body)=>{
      if(err) reject(err);
      else resolve(body);
    });
  });
};

// 获取所有关注作者
export const allFollows = async ()=>{
  // 先请求一次，获取总数
  const res:any = await pixivRequest(`/ajax/user/${PIXIV_ID}/following?offset=0&limit=100&rest=show`);
  const total = res.body.total;
  const users: IFavUser[] = [];
  const res2Users = (res:any) => {
    res.body.users.forEach(({ userName, userId }:any) => {
      users.push({
        id: userId,
        name: userName,
      });
    });
  };
  res2Users(res);
  // 根据总数决定是否继续请求
  for(let now = 100; now < total; now += 100) {
    const res:any = await pixivRequest(`/ajax/user/${PIXIV_ID}/following?offset=${now}&limit=100&rest=show`);
    res2Users(res);
  }
  return users;
}
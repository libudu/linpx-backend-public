import { pixivRequest } from './index';

// 搜索用户名
export const searchUser = (userName:string, page:number=1) => {
  return pixivRequest(`/touch/ajax/search/users?nick=${userName}&p=${page}&lang=zh`)
};

// 搜索小说名
export const searchNovel = (novelName:string, page:number=1) => {
  return pixivRequest(`/ajax/search/novels/${novelName}?p=${page}&s_mode=s_tag&lang=zh`)
};
import { pixivRequest } from './index';

// 获取一系列小说的介绍
export const getNovelProfiles = (idList:string[]) => {
  let path = '/ajax/user/114514/novels?';
  for(let id of idList) {
    path += `ids[]=${id}&`;
  }
  return pixivRequest(path);
};

// 获取小说详情
export const getNovelDetail = (id:string) => {
  return pixivRequest(`/ajax/novel/${id}`);
}

// 获取最近阅读的小说
export const getRecentNovels = (page:string='1')=>{
  return pixivRequest(`/touch/ajax/follow/latest?type=novels&p=${page}`);
}
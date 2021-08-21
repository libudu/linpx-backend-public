import { pixivRequest } from './index';

// 获取作者所有小说的tag统计
export const getUserAllTags = (userId:string) => {
  return pixivRequest(`/ajax/user/${userId}/novels/tags?lang=zh`)
}

// 获取用户某个tag的小说
export const getUserTagNovels = (userId:string, tagName:string) => {
  tagName = encodeURIComponent(tagName);
  const path = `/ajax/user/${userId}/novels/tag?tag=${tagName}&offset=0&limit=200&lang=zh`;
  return pixivRequest(path);
}
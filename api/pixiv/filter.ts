import { proxyImg } from '../../utils/util';
import { INovelProfile } from '../../model/types';


// 用于大量小说简介和用户标签小说简介接口
export const novelProfileFilter = (novel:any): INovelProfile => {
  const { id, title, url:coverUrl, tags, userId, userName,
    description: desc, textCount: length, createDate, bookmarkCount } = novel;
  return {
    id,
    title,
    coverUrl: proxyImg(coverUrl),
    tags,
    userId,
    userName,
    desc,
    length,
    createDate,
    pixivLikeCount: bookmarkCount,
  }
};

// 用于最近小说接口
export const touchNovelProfileFilter = (novel:any): INovelProfile => {
  const { id, title, user_id:userId, user_name: userName, tags, url, comment:desc,
    text_length: length, upload_timestamp, bookmark_count } = novel;
  const createDate = (new Date(upload_timestamp * 1000)).toISOString();
  return {
    id,
    title,
    userId,
    userName,
    tags,
    coverUrl:proxyImg(url),
    desc,
    length,
    createDate,
    pixivLikeCount: bookmark_count,
  };
};
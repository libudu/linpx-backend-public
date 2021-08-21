import { novelProfileFilter } from '../api/pixiv/filter';
import { getNovelDetail, getNovelProfiles } from '../request/pixiv/novel';
import { allFollows, getUserInfo, getUserProfile } from '../request/pixiv/user';

import { LinpxData } from '../model';
import {
  IFavUser,
  IUserInfo,
  Array2Map,
  INovelInfo,
  IMap,
  INovelImage,
  INovelProfile,
} from '../model/types';
import { getUserAllTags } from '../request/pixiv/tag';
import { proxyImg, tagFilter } from '../utils/util';

export const getCacheNovel = async (id: string) =>{
  // const novel = await LinpxData.novel.findById(id);
  // if(novel) return novel;
  
  const response:any = await getNovelDetail(id);
  if(response.error) return null;
  else {
    const { id, title, userId, userName, content, coverUrl, 
      tags:ptags, description:desc, createDate,
      seriesNavData, userNovels, textEmbeddedImages,
      bookmarkCount, viewCount,
    } = response.body;
    // 获取一个没有缓存的新小说，检查一下作者有没有这本小说，没有的话说明作者信息需要更新了
    const user = await LinpxData.user.findById(userId);
    if(user) {
      const novelExist = user.novels.includes(id);
      if(novelExist) {
        const result = await fetchUser(id);
        if(result) LinpxData.user.insert(result);
      }
    }
    // 处理tag
    const tags = ptags?.tags.map((ele:any)=>ele.tag);
    // 处理系列
    let series:any = null;
    if(seriesNavData) {
      const { next, prev, order, title } = seriesNavData;
      series = { next: null, prev: null, order, title };
      if(next) {
        const { id, order, title } = next;
        series.next = { id, order, title };
      }
      if(prev) {
        const { id, order, title } = prev;
        series.prev = { id, order, title };
      }
    }
    // 处理前后
    const novels = Object.keys(userNovels).sort((a, b) => Number(b) - Number(a));
    const index = novels.indexOf(id);
    let prev = novels[index-1] && userNovels[novels[index-1]];
    if(prev) prev = novelProfileFilter(prev);
    let next = novels[index+1] && userNovels[novels[index+1]];
    if(next) next = novelProfileFilter(next);
    // 处理插入图片
    let images: IMap<INovelImage> | undefined = undefined;
    if(textEmbeddedImages) {
      images = {};
      Object.values<any>(textEmbeddedImages).forEach(({ novelImageId, urls }) => {
        // @ts-ignore
        images[novelImageId] = {
          preview: urls['480mw'] || urls['128x128'],
          origin: urls['1200x1200'] || urls['original'],
        }
      });
    }
    // 生成结果
    const result: INovelInfo = {
      id, title, userId, userName, content, coverUrl: proxyImg(coverUrl) as string,
      tags, desc, createDate, series, prev, next, images,
      pixivLikeCount: bookmarkCount, pixivReadCount: viewCount,
    };
    LinpxData.novel.insert(result);
    return result;
  }
}

// 关注作者是个整体，一次缓存、刷新
export const getCacheFavUsers = async (cache = true): Promise<IFavUser[]> => {
  if(cache) {
    const favUserList = await LinpxData.favUser.findAll();
    // 缓存中有，且使用缓存，才缓存
    if(favUserList.length > 0) return favUserList;
  }
  const favUsers = await allFollows();
  await LinpxData.favUser.getCollection().drop();
  await LinpxData.favUser.insertMany(favUsers);
  return favUsers;
}

// 从pixiv获取
export const getManyNovelProfiles = async (ids: string[]) => {
  const result: IMap<INovelProfile> = {};
  // 处理id过多的情况，100个一组
  const allRequest:string[][] = [];
  for(let i = 0; i < ids.length; i += 100) {
    allRequest.push(ids.slice(i, i + 100));
  }
  // 发送请求，处理结果
  await Promise.all(
    allRequest.map(request => {
      return getNovelProfiles(request).then(((response:any) => {
        Object.values(response.body).forEach(data => {
          // @ts-ignore
          if(data.error) return;
          const novelProfile = novelProfileFilter(data);
          result[novelProfile.id] = novelProfile;
        })
      }));
    }
  ));
  return result;
};

// export const getCacheNovelProfiles = async (ids:string[]) => {
//   const profileMap = await getManyNovelProfiles(ids);
//   return ids.map(id => profileMap[id]).filter(data => data);
//   if(ids.length === 0) return [];
//   // 优先从数据库获取
//   const { result, left } = await LinpxData.novelProfile.findByIdList(ids);
//   // 数据库中没有或过期的
//   if(left) {
//     const leftResult = await getManyNovelProfiles(left);
//     // 插入到数据库
//     LinpxData.novelProfile.insertMany(Object.values(leftResult));
//     // 合并到总数据
//     left.forEach(id => result[id] = leftResult[id]);
//   }
//   // 按顺序返回，过滤无效值
//   return ids.map(id => result[id]).filter(data => data);
// }

// 发送网络请求获取用户数据
const fetchUser = async (id: string): Promise<IUserInfo | null> => {
  let error = false;
  let result:any = {};
  await Promise.all([
    getUserProfile(id).then((res:any)=>{
      if(res.error) return error = true;
      result.novels = Object.keys(res.body.novels);
    }),
    getUserInfo(id).then((res:any)=>{
      if(res.error) return error = true;
      const { userId:id, name, imageBig:imageUrl, background , comment} = res.body;
      Object.assign(result, {
        id,
        name,
        imageUrl: proxyImg(imageUrl),
        comment,
        backgroundUrl: proxyImg(background?.url),
      })
    }),
    getUserAllTags(id).then((res:any)=>{
      const tags: { tag: string, time: number }[] = [];
      const tagInfo: { tag: string, cnt: number }[] = res.body.sort((x:any, y:any) => y.cnt - x.cnt);
      tagInfo.forEach(({tag, cnt: time}) => {
        tag = tagFilter(tag) as string;
        if(tag) tags.push({ tag, time });
      });
      result.tags = tags;
    })
  ]);
  if(error) return null;
  return result;
}

// 先尝试缓存，缓存没有再请求
export const getCacheUser = async (id: string) => {
  const user = await LinpxData.user.findById(id);
  if(user) return user;
  const result = await fetchUser(id);
  if(result) LinpxData.user.insert(result);
  return result;
}

// 批量操作
export const getCacheUserList = async (idList: string[]) => {
  if(idList.length === 0) return [];
  // 优先从数据库批量获取
  const { result, left } = await LinpxData.user.findByIdList(idList);
  // 处理数据库没有的
  if(left) {
    // 每批20个
    const patch = 20;
    for(let i=0; i < left.length; i+= patch) {
      await Promise.all(
        left.slice(i, i + patch).map(id => fetchUser(id).then(user => {
          if(!user) return;
          LinpxData.user.insert(user);
          result[user.id] = user;
        }))
      )
    }
  }
  return idList.map(id => result[id]).filter(data => data);
}
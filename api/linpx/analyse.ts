import app from '../../app';
import { tagFilter } from '../../utils/util';
import { getCacheFavUsers, getCacheUserList } from '../../data/index';
import { IAnalyseTag, INovelProfile } from '../../model/types';
import { LinpxData } from '../../model';

const { t2s } = require('chinese-s2t');

app.get('/analyse/t2s', async (req, res) => {
  const { text } = req.query;
  res.send(t2s(text));
});

app.get('/analyse/tags', async (req, res) => {
  const cache = await LinpxData.analyse.findById('tags') as IAnalyseTag | null;
  return res.send(cache);
})

export const getAllFavUserNovelIds = async () => {
  // 所有用户的id
  const favUserList = await getCacheFavUsers();
  // 所有用户的小说
  const novelIds:string[] = [];
  const userList = await getCacheUserList(favUserList.map(({ id }) => id));
  userList.forEach(user => {
    novelIds.push(...user.novels);
  })
  return novelIds;
}

// 从小说简介中分析出tag
export const analyseTagFromNovelProfiles = (novelProfiles: INovelProfile[], startTime: Date) => {
  // 原始tag数据集
  let tags: {
    [tagName:string]: {
      novels: Set<string>;
    }
  } = {};
  // 统计各个tag次数和作者次数
  novelProfiles.forEach(novelProfile => {
    const { id } = novelProfile;
    const tagNameList:string[] = novelProfile.tags;
    tagNameList.forEach((tagName: any) => {
      tagName = tagFilter(tagName, {
        same: true,
        lowercase: true,
      });
      if(!tagName) return;
      const tag = tags[tagName];
      if(!tag) tags[tagName] = { novels: new Set([id]) };
      else tag.novels.add(id);
    });
  });
  // 对统计结果筛除
  Object.keys(tags).forEach(tagName => {
    // 去除只出现1、2次的tag
    if(tags[tagName].novels.size <= 2) return delete tags[tagName];
    // 去除日文结果
    //if(containJapanese(tagName)) return delete tags[tagName];
  })
  // 将统计的对象处理成列表排序
  const tagsList = Object.entries(tags).map(([tagName, { novels }]) => ({
    tagName,
    time: novels.size,
    novels: [...novels.keys()].sort((x, y) => Number(y) - Number(x)),
  }));
  tagsList.sort((x, y) => y.time - x.time);
  // 加上时间戳
  const date = new Date();
  const result:IAnalyseTag = {
    id: 'tags',
    time: date.toISOString(),
    data: tagsList,
    take: date.getTime() - startTime.getTime(),
  };
  return result;
};

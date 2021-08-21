import mongodb from 'mongodb';
import { DATABASE_URL } from '../linpxconfig';
import LinpxCollection from './LinpxCollection';

import {
  IUserInfo,
  INovelProfile,
  INovelInfo,
  IFavUser,
  INovelComment,
  INovelAnalyse,
  IAnalyse,
  INovelCommentList,
  IUserAddition,
} from './types';

interface ILinpxData {
  user: LinpxCollection<IUserInfo>;
  userAddition: LinpxCollection<IUserAddition>;
  favUser: LinpxCollection<IFavUser>;
  novel: LinpxCollection<INovelInfo>;
  novelProfile: LinpxCollection<INovelProfile>;
  novelComment: LinpxCollection<INovelComment>;
  novelCommentList: LinpxCollection<INovelCommentList>;
  novelAnalyse: LinpxCollection<INovelAnalyse>;
  analyse: LinpxCollection<IAnalyse>;
}

// @ts-ignore
export const LinpxData: ILinpxData = {};

export const initDatabase = async () => {
  const db = await mongodb.connect(DATABASE_URL);
  if(db.isConnected()) {
    const dbase = db.db("linpx");

    const colList: {
      name: keyof ILinpxData,
      cacheHour: number | null,
    }[] = [
      // 作者信息，一般变化影响不大
      {
        name: 'user',
        cacheHour: 1,
      },
      // 作者附加信息，手动更新
      {
        name: 'userAddition',
        cacheHour: null,
      },
      // 喜欢作者，新关注触发更新
      {
        name: 'favUser',
        cacheHour: null,
      },
      // 小说，一般变化影响不大
      {
        name: 'novel',
        cacheHour: 24,
      },
      // 小说简介，除了缓存过期，每天0点会自动更新关注作者的所有小说
      {
        name: 'novelProfile',
        cacheHour: 24,
      },
      // 分析数据，目前是tag统计
      {
        name: 'analyse',
        cacheHour: 24,
      },
      // 小说评论
      {
        name: 'novelComment',
        cacheHour: null,
      },
      // 某篇小说包含的评论
      {
        name: 'novelCommentList',
        cacheHour: null,
      },
      // 某篇小说的分析数据
      {
        name: 'novelAnalyse',
        cacheHour: null,
      },
    ];

    colList.forEach(({ name, cacheHour }) => {
      const dbCol = dbase.collection(name);
      const linpxCol = new LinpxCollection<any>(dbCol, cacheHour ? cacheHour * 60 * 60 : null);
      LinpxData[name] = linpxCol;
    });

    return LinpxData;
  } else {
    console.log('数据库连接失败');
  }
};
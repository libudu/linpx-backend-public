export const Array2Map = <T extends { id: string }>(dataList: T[]) => {
  const dataMap:IMap<T> = {};
  dataList.forEach(data => dataMap[data.id] = data);
  return dataMap;
}

export interface IMap<T> {
  [index: string]: T;
}

export interface ITagSet {
  [tagName: string]: number;
}

export interface IFavUser {
  id: string;
  name: string;
}

export interface IUserAddition {
  id: string;
  afdian?: string;
  qqgroup?: string;
}

export interface IUserInfo {
  id: string;
  novels: string[];
  name: string;
  imageUrl: string;
  comment: string;
  tags: ITagSet;
  backgroundUrl?: string;
}

export interface INovelProfile {
  id: string;
  title: string;
  userId: string;
  userName: string;
  coverUrl: string | undefined;
  tags: string[];
  desc: string;
  length: number;
  createDate: string;
  pixivLikeCount: number,
}

export interface INovelImage {
  preview: string;
  origin: string;
}

export interface INovelInfo {
  id: string;
  title: string;
  userId: string;
  userName: string;
  coverUrl: string;
  tags: string[];
  desc: string;
  content: string;
  createDate: string;
  // 系列小说
  series: {
    title: string;
    order: string;
    next: {
      id: string;
      title: string;
      order: string;
    } | null,
    prev:{
      id: string;
      title: string;
      order: string;
    } | null,
  } | null;
  // 相邻小说
  next: INovelProfile | null;
  prev: INovelProfile | null;
  // 插入图片
  images?: {
    [id: string]: INovelImage;
  },
  // 统计数据
  pixivLikeCount: number,
  pixivReadCount: number,
}

// tab分析
export interface IAnalyseTag {
  id: 'tags';
  time: string;
  data: {
    tagName: string;
    time: number;
    novels: string[];
  }[];
  take: number;
}

// 榜单分析
export interface IAnalyseBoard {
  id: 'board';
  novelBoard: string[];
}

export interface IAnalyseSchedule {
  id: 'schedule';
  startTime: string;
  endTime: string;
}

export type IAnalyse = IAnalyseTag | IAnalyseBoard | IAnalyseSchedule;

// 小说的评论
export interface INovelComment {
  id: string; // 插入时的唯一识别码
  title: string; // 小说标题
  novelId: string; // 小说id
  content: string;
  reply: string;
  postTime: number;
  ip: string;
}

// 小说的评论集合
export interface INovelCommentList {
  id: string; // 小说id
  title: string; // 小说标题
  userId: string; // 作者id
  userName: string; // 作者名字
  commentIds: string[]; // 评论id列表
}

// 小说的点击数、赞数
export interface INovelAnalyse {
  id: string;
  // 所有点击数
  readCount: number;
  // 今日每个ip的点击数
  todayReadMap: Record<string, number>;
  // 除今日点赞数
  likeCount: number;
  // 今日点赞ip
  todayLikeMap: Record<string, true>;
  // 今天时间
  todayDate: number;
  // pixiv收藏数
  pixivLikeCount: number;
  history: {
    date: string;
    readCount: number;
    likeCount: number;
    pixivLikeCount: number;
  }[];
}
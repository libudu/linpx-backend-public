import schedule from 'node-schedule';
import { analyseTagFromNovelProfiles, getAllFavUserNovelIds } from '../api/linpx/analyse';
import { getManyNovelAnalyse } from '../api/pixiv/novel';
import { getManyNovelProfiles } from '../data';
import { LinpxData } from '../model';

export const dailyTask = async () => {
  const startTime = new Date();

  // 获取所有推荐作者全部小说的小说简介
  const novelIds = await getAllFavUserNovelIds();
  const allNovelProfileMap = await getManyNovelProfiles(novelIds);
  const allNovelProfiles = Object.values(allNovelProfileMap);
  LinpxData.novelProfile.insertMany(allNovelProfiles);

  // 更新tag缓存
  const result = analyseTagFromNovelProfiles(allNovelProfiles, startTime);
  LinpxData.analyse.insert(result);

  // 刷新所有小说分析的数据
  const allNovelAnalyse = await LinpxData.novelAnalyse.findAll();
  allNovelAnalyse.forEach(analyse => {
    const id = analyse.id;
    // 当天阅读点赞数据置空
    analyse.todayLikeMap = {};
    analyse.todayReadMap = {};
    // 更新pixiv收藏，注意作品可能删除或无法拉取
    // 这个pixivLike数据仅供推荐作者小说统计榜单，实际根本没用，前端展示的数据是novelProfile自带的pixivLike
    analyse.pixivLikeCount = allNovelProfileMap[id]?.pixivLikeCount || analyse.pixivLikeCount;
    // 保存最近7天的历史记录
    const history = analyse.history;
    history.push({
      date: startTime.toLocaleDateString(),
      readCount: analyse.readCount,
      likeCount: analyse.likeCount,
      // 使用刚拉取的小说概览的数据
      pixivLikeCount: analyse.pixivLikeCount,
    });
    // 超过7天的数据丢弃
    history.splice(0, history.length - 7);
  });
  await LinpxData.novelAnalyse.insertMany(allNovelAnalyse);

  // 新添加的作者的历史小说可能没有添加到小说分析中
  // 查找不到的需要新建
  await getManyNovelAnalyse(novelIds);

  // 更新榜单数据

  // 统计耗时
  LinpxData.analyse.insert({
    id: 'schedule',
    startTime: startTime.toISOString(),
    endTime: (new Date()).toISOString(),
  })

  console.log('end');
};

// 每日0时0分0秒刷新tag和榜单
schedule.scheduleJob('0 0 0 * * *', dailyTask);
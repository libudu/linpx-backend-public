import { Collection } from 'mongodb';
import { Array2Map, IMap } from './types';

type Addition<T> = T & { _time: number, _id: string };

export default class LinpxCollection<T extends { id: string }> {
  collection: Collection;
  maxCacheTime: number | null;

  constructor(collection: Collection, maxCacheTime: number | null = 30 * 60) {
    this.collection = collection;
    this.maxCacheTime = maxCacheTime;
  }

  getCollection() {
    return this.collection as Collection<T>;
  }

  private getTime() {
    return Math.floor((new Date()).getTime() / 1000);
  }

  // 检查数据项的时间
  private checkTime(data: Addition<T>):boolean {
    // 没有设置缓存时间
    if(!this.maxCacheTime) return true;
    // 数据为空或没有时间
    if(!data || !data._time) return false;
    const valid = this.getTime() - data._time < this.maxCacheTime;
    return valid;
  }

  // 插入时附加_id和时间戳_time
  insert = (data: T) => {
    const newData: Addition<T> = { ...data, _time: this.getTime(), _id: data.id };
    return this.collection.replaceOne({ _id: data.id }, newData, { upsert: true });
  }

  insertMany = async (dataList: T[]) => {
    if(dataList.length === 0) return;
    const t = this.getTime();
    // 再全部插入更新
    return this.collection.bulkWrite(dataList.map(data => ({
      replaceOne: {
        filter: { id: data.id },
        replacement: {
          ...data,
          _id: data.id,
          _time: t,
        },
        upsert: true,
      }
    })));
  }

  // 查询时需要判断是否过期，过期则返回空
  findById = (id: string):Promise<T | null> => {
    return this.collection.findOne({ _id: id }).then(data => this.checkTime(data) ? data : null);
  }

  findByIdList = async (idList: string[]):Promise<{
    result: IMap<T>,
    left: string[] | null,
  }> => {
    let dataList:Addition<T>[] = await this.collection.find({_id: { $in: idList }}).toArray();
    dataList = dataList.filter(data => this.checkTime(data));
    const result:IMap<T> = Array2Map(dataList);
    // 所有id都找到了
    if(dataList.length === idList.length) return {
      result,
      left: null,
    }
    // 有id没找到
    return {
      result,
      left: idList.filter((id) => !result[id]),
    };
  }

  findAll = (): Promise<T[]> => {
    return (this.collection.find({})
      .toArray()
      .then(dataList => dataList.filter(data => this.checkTime(data)))
    );
  }

  // 更新字段时时间也要更新
  update = (id: string, field: Object) => {
    return this.collection.updateOne({ _id: id }, { $set: { ...field, _time: this.getTime() } })
  }

  deleteById = (id: string) => {
    return this.collection.deleteOne({ _id: id });
  }

  deleteByIdList = (idList: string) => {
    return this.collection.deleteMany({ _id: { $in: idList }});
  }
}
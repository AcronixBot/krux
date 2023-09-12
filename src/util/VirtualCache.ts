interface ITMap<T = unknown> {
  data: T;
  name: string | number;
}

type name = `${string}_cache`

export default class VirtualCache<T> {
  private container: Map<string | number, T> = new Map();
  private name: string | number;

  constructor(name: name) {
    this.name = name;
  }

  checkEntry(name: string | number): boolean {
    let isInCache: boolean = false;
    this.getAllData().forEach((e) => {
      if (e.name === name) isInCache = true;
    });
    return isInCache;
  }

  getData(name?: string | number): T | ITMap<T>[] {
    if (name) {
      try {
        let data = this.container.get(name);
        if (data) return data;
        else return null;
      } catch (e) {
        return null;
      }
    } else {
      let data: ITMap<T>[] = [];
      for (const e of this.container) {
        data.push({
          data: e[1],
          name: e[0],
        });
      }
      return data;
    }
  }

  getAllData(): ITMap<T>[] {
    return this.getData() as ITMap<T>[];
  }

  //creates a new Cache and returns the data
  setData(data: T) {
    if (this.name) {
      this.container.set(this.name, data);
    } else {
      this.container.set(Date.now(), data);
    }

    return this;
  }
}

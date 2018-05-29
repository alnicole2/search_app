class Storage {
  constructor(namespace, isSessionStorage = false) {
    this.namespace = namespace;
    if(isSessionStorage){
      this.storage = sessionStorage;
    }
    else{
      this.storage = localStorage;
    }
  }

  get(key) {
    return JSON.parse(this.storage.getItem(`${this.namespace}:${key}`));
  }

  set(keyOrObject, value) {
    if (typeof keyOrObject === 'string') {
      let key = `${this.namespace}:${keyOrObject}`;
      this.storage.setItem(key, JSON.stringify(value));
    } else if (typeof keyOrObject === 'object') {
      Object.keys(keyOrObject).forEach(key => {
        this.storage.setItem(`${this.namespace}:${key}`, JSON.stringify(keyOrObject[key]));
      });
    }
  }
}

export default Storage;
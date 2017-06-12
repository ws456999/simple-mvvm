/**
 * @class 发布类 Observer that are attached to each observed
 * @param {[type]} value [vm参数]
 */
function observe(value, asRootData) {
  if (!value || typeof value !== 'object') {
    return
  }
  return new Observer(value)
}

class Observer {
  constructor (value) {
    this.value = value
    this.walk(value)
  }

  walk (obj) {
    let self = this

    Object.keys(obj).forEach(key => {
      self.observeProperty(obj, key, obj[key])
    })
  }

  observeProperty (obj, key, val) {
    let dep = new Dep()
    // 如果obj还是一个对象的话，那么就递归下去
    let childObj = observe(val)
    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: true,
      get () {
        // Dep.target
        if (Dep.target) {
          // dep 的 subs 加入 watcher
          dep.depend()
        }
        if (childObj) {
          childObj.dep.depend()
        }
        return val
      },
      set (newVal) {
        if (val === newVal) {
          return
        }
        val = newVal
        // 监听子属性变化
        childObj = observe(newVal)
        // 通知数据变更
        dep.notify()
      }
    })
  }

}


let uid = 0
class Dep {
  constructor () {
    this.id = uid++
    // arr 存储Watcher
    this.subs = []
  }
  // 添加watcher
  addSub (sub) {
    this.subs.push(sub)
  }
  // 移除watcher
  removeSub (sub) {
    let index = this.subs.indexOf(sub)
    if(index !== -1) {
      this.subs.splice(index, 1)
    }
  }
  // 通知数据变更
  notify () {
    this.subs.forEach(sub => {
      sub.update()
    })
  }
  // 添加watcher
  depend () {
    // 我记得应该哪一步的时候会给Dep.target = dep对象，然后给这个dep添加watcher
    Dep.target.addDep(this)
  }
}

Dep.target = null

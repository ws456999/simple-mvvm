// 作为一个和Observer和Compile都有关系的“蓝银”，他做的事情有以下几点

// a、通过Dep接收数据变动的通知，实例化的时候将自己添加到dep中
// b、属性变更时，接收dep的notify，调用自身update方法，触发Compile中绑定的更新函数，进而更新视图

/**
 * @class 观察类
 * @param {[type]}   vm      [vm对象]
 * @param {[type]}   expOrFn [属性表达式]
 * @param {Function} cb      [回调函数(一半用来做view动态更新)]
 */
class Watcher {
  constructor (vm, expOrFn, cb) {
    this.vm = vm
    expOrFn = expOrFn.trim()
    this.expOrFn = expOrFn
    this.cb = cb
    this.depIds = {}

    if (typeof expOrFn === 'funciton') {
      this.getter = expOrFn
    } else {
      this.getter = this.parseGetter(expOrFn)
    }
    this.value = this.get()
  }

  update () {
    this.run()
  }
  run () {
    let newVal = this.get()
    let oldVal = this.value
    if (newVal === oldVal) {
      return
    }
    // 将值存下来，下一次比较的时候，这个就是旧值
    this.value = newVal
    // 将newVal, oldVal 挂在到实例上
    this.cb.call(this.vm, newVal, oldVal)
  }
  get () {
    // 将当前Dep.target指向自己
    Dep.target = this
    // 这个时候我会调用一下obj的getter事件，顺便把这个watcher加到依赖里面去
    let value = this.getter.call(this.vm, this.vm)
    // 设置完之后清空
    Dep.target = null
    return value
  }
  addDep (dep) {
    if (!this.depIds.hasOwnProperty(dep.id)) {
      dep.addSub(this)
      this.depIds[dep.id] = dep
    }
  }
  parseGetter (exp) {
    if (/[^\w.$]/.test(exp)) return
    let exps = exp.split('.')
    // 简单的处理循环依赖
    return function (obj) {
      exps.forEach((exp, index) => {
        if (!obj) return
        obj = obj[exp[index]]
      })
      return obj
    }
  }
}

/**
 * @class 双向绑定类 MVVM
 * @param {[type]} options [description]
 */
class MVVM {
  constructor (options) {
    this.$options = options || {}
    let data = this._data = this.$options.data
    let self = this

    Object.keys(data).forEach(key => {
      self._proxyData(key)
    })
    observe(data, this)
    new Compile(options.el || document.body, this)
  }
  /**
   * [属性代理]
   * @param  {[type]} key    [数据key]
   * @param  {[type]} setter [属性set]
   * @param  {[type]} getter [属性get]
   */
  _proxyData (key, setter, getter) {
    let self = this
    setter = setter ||
    Object.defineProperty(self, key, {
      enumerable: true,
      coonfigurable: false,
      get: function ProxyGetter () {
        return self._data[key]
      },
      set: function ProxySetter (newVal) {
        self._data[key] = newVal
      }
    })
  }
}

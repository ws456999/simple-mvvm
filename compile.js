// <script type="text/javascript" src="./watcher.js"></script>

// 实现compile
// Compile需要做的事情也很简单
// a、解析指令，将指令模板中的变量替换成数据，对视图进行初始化操作
// b、订阅数据的变化，绑定好更新函数
// c、接收到数据变化，通知视图进行view update

class Compile {
  constructor (el, vm) {
    this.$vm = vm
    this.$el = this.isElementNode(el) ? el : document.querySelector(el)
    if(this.$el) {
      this.$fragment = this.nodeFragment(this.$el)
      this.compileElement(this.$fragment)
      // 将fragment 放到真是dom中
      this.$el.appendChild(this.$fragment)
    }
  }

  compileElement (el) {
    let self = this
    let childNodes = el.childNodes
    Array.prototype.slice.call(childNodes).forEach(node => {
      let text = node.textContent
      let reg = /\{\{((?:.|\n)+?)\}\}/g;
      // 如果是element节点的话 解析指令
      if (self.isElementNode(node)) {
        self.compile(node)
      }
      // 如果是文本节点的话
      if (self.isTextNode(node) && reg.test(text)) {
        // 匹配第一个选项
        self.compileText(node, RegExp.$1.trim())
      }
      // 递归解析子节点包含的指令
      if (node.childNodes && node.childNodes.length) {
        self.compileElement(node)
      }
    })
  }
  // 文档碎片，遍历过程中会有多次的dom操作，为提高性能我们会将el节点转化为fragment文档碎片进行解析操作
  // 解析操作完成，将其添加回真实dom节点中
  nodeFragment (el) {
    let fragment = document.createDocumentFragment()
    let child
    while(child = el.firstChild) {
      fragment.appendChild(child)
    }
    return fragment
  }
  // 解析指令
  compile (node) {
    let nodeAttrs = node.attributes
    let self = this

    Array.prototype.slice.call(nodeAttrs).forEach(attr => {
      var attrName = attr.name
      // 判断这个名字是不是指令的名字
      if (self.isDirective(attrName)) {
        var exp = attr.value
        var dir = attrName.substring(2)
        // 事件指令
        if (self.isEventDirective(dir)) {
          compileUtil.eventHandler(node, self.$vm, exp, dir)
        }
        // 普通指令
        else {
          compileUtil[dir] && compileUtil[dir](node, self.$vm, exp)
        }
        // node.innerHTML = typeof this.$val[exp] === 'undefined' ? '' : this.$val[exp]
        node.removeAttribute(attrName)
      }
    })
  }
  // {{ test }} 匹配变量 test
  compileText (node, exp) {
    compileUtil.text(node, this.$vm, exp)
  }
    // element节点
  isElementNode (node) {
    return node.nodeType === 1
  }
  // text纯文本
  isTextNode (node) {
    return node.nodeType === 3
  }
  // x-XXX指令判定
  isDirective (attr) {
    return attr.indexOf('x-') === 0;
  }
  isEventDirective (dir) {
    return dir.indexOf('on') === 0
  }

}

// 定义$elm, 缓存当前执行input事件的input dom对象
let $elm
let timer = null

// 指令处理整合
class compileUtil {
  static html (node, vm, exp) {
    this.bind(node, vm, exp, 'html')
  }
  static text (node, vm, exp) {
    this.bind(node, vm, exp, 'text')
  }
  static class (node, vm, exp) {
    this.bind(node, vm, exp, 'class')
  }
  static model (node, vm, exp) {
    this.bind(node, vm, exp, 'model')

    let self = this
    let val = this._getVmVal(vm, exp)
    // 监听input事件
    node.addEventListener('input', function (e) {
      let newVal = e.target.value
      $elm = e.target
      if (val === newVal) {
        return
      }
      // 设置定时器， 完成ui js的异步渲染
      clearTimeout(timer)
      timer = setTimeout(() => {
        self._setVmVal(vm, exp, newVal)
        val = newVal
      })
    })
  }
  static bind (node, vm, exp, dir) {
    let updaterFn = updater[dir + 'Updater']
    updaterFn && updaterFn(node, this._getVmVal(vm, exp))
    new Watcher(vm, exp, function (val, oldVal) {
      updaterFn && updaterFn(node, val, oldVal)
    })
  }
  // 事件处理
  static eventHandler (node, vm, exp, dir) {
    let eventType = dir.split(':')[1]
    let fn = vm.$options.methods && vm.$options.methods[exp]

    if (eventType && fn) {
      console.log(eventType, fn)
      node.addEventListener(eventType, fn.bind(vm))
    }
  }
  /**
   * [获取挂载在vm实例上的value]
   * @param  {[type]} vm  [mvvm实例]
   * @param  {[type]} exp [expression]
   */
  static _getVmVal (vm, exp) {
    let val = vm
    exp = exp.split('.')
    exp.forEach(key => {
      key = key.trim()
      val = val[key]
    })
    return val
  }
  /**
   * [设置挂载在vm实例上的value值]
   * @param  {[type]} vm    [mvvm实例]
   * @param  {[type]} exp   [expression]
   * @param  {[type]} value [新值]
   */
  static _setVmVal (vm, exp, value) {
    let val = vm
    let exps = exp.split('.')
    exps.forEach((key, index) => {
      key = key.trim()
      if (index < exps.length - 1) {
        val = val[key]
      } else {
        val[key] = value
      }
    })
  }
}

const updater = {
  htmlUpdater: function (node, value) {
    node.innerHTML = typeof value === 'undefined' ? '' : value
  },
  textUpdater: function (node, value) {
    node.textContent = typeof value === 'undefined' ? '' : value
  },
  classUpdater: function () {},
  modelUpdater: function (node, value, oldValue) {
    if ($elm === node) {
      return false
    }
    $elm = undefined
    node.value = typeof value === 'undefined' ? '' :value
  }
}


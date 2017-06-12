# simple-mvvm

A project to explain how vue mvvm works Edit
Add topics

简单实现了vue的双向数据绑定 && 模板解析

``` html
  <div id="app">
    <h2>{{a}}</h2>
  </div>
```

```javascript
var vm = new MVVM({
  el: '#app',
  data: {
    a: 'test model'
  }
})
```
---
title: "Parent-Child Component Nesting Patterns"
description: "A look at different ways to structure nested components — from basic prop passing to slot composition and render delegation."
date: 2026-05-11 00:00:00 +0800
categories: [Vue]
tags: [vue, component, slot]
---

今天刚从凤凰山的[凤岩古寺](https://baike.baidu.com/item/%E5%87%A4%E5%B2%A9%E5%8F%A4%E5%BA%99/12773903)祈福回来，相信我会越来越好的。

回来之后偶然打开了组件库的网站，看到 Element Plus 表格的写法：

```vue
<template>
  <el-table :data="tableData" style="width: 100%">
    <el-table-column prop="date" label="Date" width="180" />
    <el-table-column prop="name" label="Name" width="180" />
    <el-table-column prop="address" label="Address" />
  </el-table>
</template>
```

就想起了 2024 年 5 月的一段糗事。

## 一个「简单」的需求

当时有个弹窗，要展示用户会员信息，样式干净简约，不想套 Element Plus 的表格，准备自己写一个。看着 el-table 的结构，我以为自己看懂了——**父组件传数据，子组件拿数据渲染列**，用插槽串起来，不就行了？

于是准备了两个组件：

```vue
// myTable.vue
<script setup>
defineProps({
  data: { type: Array, default: () => [] }
})
</script>

<template>
  <div class="my-table">
    <div class="my-table-row" v-for="(row, i) in data" :key="i">
      <slot :row="row" />
    </div>
  </div>
</template>

// myTableColumn.vue
<script setup>
defineProps({
  prop: String,
  item: Object
})
</script>

<template>
  <div class="my-table-cell">
    <span class="cell-label">{{ item[prop] || '-' }}</span>
  </div>
</template>
```

然后这么用：

```vue
<template>
  <MyTable :data="tableData">
    <template #default="{ row }">
      <MyTableColumn prop="name" :item="row" />
      <MyTableColumn prop="age" :item="row" />
    </template>
  </MyTable>
</template>
```

跑起来确实能渲染，但问题来了——**列的 header 怎么渲染？** `MyTableColumn` 的 `label` 信息在子组件里，父组件根本拿不到，没法画表头。绕来绕去，发现这条路走不通。

> 这结构明显就不对了，需要显性的写 template，暴露出 `row` 数据，再传递给子组件。当前我卡就卡在子组件怎么能拿到 `row` 数据。
{: .prompt-danger}

我当时的认知里有一个根深蒂固的假设：**子组件一定要渲染 UI**。带着这个假设，不管怎么折腾，插槽怎么传，数据就是对不上。

## 等等，子组件可以不渲染任何东西

不知道是看了哪个帖子，还是在 React 代码里待久了——React 的组件本质是函数，`return null` 完全合法，一个组件可以什么都不渲染，只是跑一段逻辑。

这个念头一出来，思路就通了。

**el-table-column 根本不渲染 UI，它只是把自己的配置（prop、label）注册给父组件，由父组件统一来画表格。** 父组件知道所有列的配置，自然就能画表头，也能按配置渲染每一行。

子组件是一个 Schema 的载体，不是一个 UI 的载体。

## 用 provide / inject 实现列注册

父组件通过 `provide` 暴露一个 `registerColumn` 方法，用 `<slot />` 触发子组件挂载，子组件挂载时调用这个方法把自己的配置传上去：

{% raw %}
```vue
<script setup>
import { ref, provide } from 'vue'

defineProps({
  data: { type: Array, default: () => [] }
})

const columns = ref([])
provide('tableContext', {
  registerColumn(col) {
    columns.value.push(col)
  }
})
</script>

<template>
  <slot />
  <div class="my-table">
    <div class="my-table-row header">
      <div class="my-table-cell" v-for="col in columns" :key="col.prop">
        {{ col.label }}
      </div>
    </div>
    <div class="my-table-row" v-for="(row, i) in data" :key="i">
      <div class="my-table-cell" v-for="col in columns" :key="col.prop">
        {{ row[col.prop] }}
      </div>
    </div>
  </div>
</template>
```
{% endraw %}

注意 `<slot />` 放在表格最前面——它的作用只是让子组件执行 `onBeforeMount`，把配置注册进来，不是真的要渲染插槽内容。

子组件 `MyTableColumn` 用 `inject` 拿到 `registerColumn`，在 `onBeforeMount` 里调用，然后 `return () => null`——什么都不渲染：

```tsx
import { defineComponent, inject, onBeforeMount } from 'vue'

export default defineComponent({
  name: 'MyTableColumn',
  props: {
    prop: String,
    label: String,
  },
  setup(props, { slots }) {
    const table = inject<{ registerColumn: (col: any) => void }>('tableContext')
    onBeforeMount(() => {
      table?.registerColumn({
        prop: props.prop,
        label: props.label,
      })
    })
    return () => null
  },
})
```

> 用 `onBeforeMount` 而不是 `onMounted`，是为了保证注册在父组件渲染列之前完成。
{: .prompt-info}

## 把插槽也传进去

默认渲染单元格数据值够用，但有时候要自定义内容——比如放个 Tag、加个按钮。[插槽的本质是函数](https://my-long.github.io/posts/vue-slot/)，可以把它一起打包进注册数据里传给父组件：

```tsx
setup(props, { slots }) {
  const table = inject<{ registerColumn: (col: any) => void }>('tableContext')
  onBeforeMount(() => {
    table?.registerColumn({
      prop: props.prop,
      label: props.label,
      renderCell: (row: any) =>
        slots.default ? slots.default({ row }) : row[props.prop!],
    })
  })
  return () => null
},
```

父组件拿到 `renderCell` 之后，用一个小的函数式组件调用它——在 Vue 里，把一个返回 VNode 的函数当组件用，这样写最干净：

```vue
const RenderCell = ({ render, row }) => render(row)

<div class="my-table-row" v-for="(row, i) in data" :key="i">
  <div class="my-table-cell" v-for="col in columns" :key="col.prop">
    <RenderCell :render="col.renderCell" :row="row" />
  </div>
</div>
```

---

绕了一大圈，根子上就是一个认知的转变：子组件不一定要「做点什么看得见的事」。它可以只是一个声明，把意图告诉父组件，剩下的让父组件来决定怎么呈现。Element Plus 的表格就是这么做的，读懂之后有点豁然开朗的感觉。

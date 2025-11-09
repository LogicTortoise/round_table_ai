import { createApp } from 'vue'
import App from './App.vue'
import store from './store'
import vuetify from './plugins/vuetify'

// 初始化数据库
import './store/database'

const app = createApp(App)

app.use(store)
app.use(vuetify)

app.mount('#app')

const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      builderOptions: {
        appId: 'com.roundtable.ai',
        productName: 'RoundTable AI',
        mac: {
          target: ['dmg', 'zip'],
          icon: 'public/icon.png',
          category: 'public.app-category.productivity'
        }
      }
    },
    vuetify: {
      // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vuetify-loader
    }
  }
})

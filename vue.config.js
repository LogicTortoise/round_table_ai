const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      // 包含 preload 脚本
      preload: 'src/preload/kimi-login.js',
      builderOptions: {
        appId: 'com.roundtable.ai',
        productName: 'RoundTable AI',
        mac: {
          target: ['dmg', 'zip'],
          icon: 'public/icon.png',
          category: 'public.app-category.productivity'
        },
        // 确保 preload 文件被包含在构建中
        files: [
          '**/*',
          '!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}',
          '!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}',
          '!**/node_modules/*.d.ts',
          '!**/node_modules/.bin',
          '!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}',
          '!.editorconfig',
          '!**/._*',
          '!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}',
          '!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}',
          '!**/{appveyor.yml,.travis.yml,circle.yml}',
          '!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}'
        ]
      }
    },
    vuetify: {
      // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vuetify-loader
    }
  }
})

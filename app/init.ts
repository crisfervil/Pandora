/// <reference path="typings/systemjs.d.ts" />

System.config({
  baseURL: '<%= APP_BASE %>'/*,
  paths: {'*': '*.js?v=<%= VERSION %>'},
  map: {
    angular2: '<%= APP_BASE %>lib'
  }*/
});

System.import('app')
  .catch(e => console.error('Error Initializing app component-> %s',e));

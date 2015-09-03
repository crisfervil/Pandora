import {Component, View, bootstrap, bind} from 'angular2/angular2';
import {routerInjectables, LocationStrategy, HashLocationStrategy} from 'angular2/router';
import {RouterLink, RouteConfig, Router, RouterOutlet, Location, RouteParams} from 'angular2/router';


import {Xrm} from './services/Xrm';

import {Home} from './components/home/home';
import {About} from './components/about/about';
import {NavBar} from './components/navBar/navBar';
import {Menu} from './components/menu/menu';
import {AccountDefaultView} from './components/entities/account/accountDefaultView';

@Component({
  selector: 'app',
  bindings: [/*Router,*/ Location/*, Xrm*/]
})
@RouteConfig([
  { path: '/', component: Home, as: 'home' },
  { path: '/about', component: About, as: 'about' },
  { path: '/menu', component: Menu, as: 'menu' }, 
{ path: '/accounts', component: AccountDefaultView, as: 'accounts' }  
])
@View({
  templateUrl: './app.html',
  directives: [RouterOutlet, RouterLink, NavBar]
})
class App {
    constructor(/*public router: Router, */public location: Location) {
    }
    getLinkStyle(path) {
        return this.location.path === path;
    }
}

bootstrap(App, [routerInjectables, bind(LocationStrategy).toClass(HashLocationStrategy)/*, Router*/, Location]);

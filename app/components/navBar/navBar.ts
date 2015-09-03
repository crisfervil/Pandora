import {Component, View} from 'angular2/angular2';
import {RouterLink} from 'angular2/router';

@Component({
  selector: 'navBar'
})
@View({
  templateUrl: './components/navBar/navBar.html',
  directives: [RouterLink]
})
export class NavBar {
  
}

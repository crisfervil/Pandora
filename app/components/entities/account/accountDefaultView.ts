import {Component, View, NgFor} from 'angular2/angular2';
import {RouterLink} from 'angular2/router';

import {Xrm} from '../../../services/Xrm';


@Component({
    selector: 'accountDefaultView'
})
@View({
    templateUrl: './components/entities/account/accountDefaultView.html',
    directives: [RouterLink,NgFor]
})
export class AccountDefaultView {
 
 
    public fetchXml = "";
 
    public Items = new Array();
 
    xrm:Xrm;
    constructor(xrm:Xrm) {
        this.xrm=xrm;
        
        // get items
        this.Items = xrm.retrieve("","");        
          
    }
}

import {Component, View} from 'angular2/angular2';
import {RouterLink} from 'angular2/router';


@Component({
    selector: 'menu'
})
@View({
    templateUrl: './components/menu/menu.html',
    directives: [RouterLink]
})
export class Menu {

   constructor(){
        $(".tile").height($("#tile1").width());
        $(".carousel").height($("#tile1").width());
        $(".item").height($("#tile1").width());
        
        $(window).resize(function() {
        if(this.resizeTO) clearTimeout(this.resizeTO);
        this.resizeTO = setTimeout(function() {
            $(this).trigger('resizeEnd');
        }, 10);
        });
        
        $(window).bind('resizeEnd', function() {
            $(".tile").height($("#tile1").width());
            $(".carousel").height($("#tile1").width());
            $(".item").height($("#tile1").width());
        });
        
        $('.carousel').carousel();
   } 
}

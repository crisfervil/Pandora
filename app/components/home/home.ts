import {Component, View} from 'angular2/angular2';
import {RouterLink} from 'angular2/router';
//import {Chart} from "chart";

@Component({
    selector: 'home'
})
@View({
    templateUrl: './components/home/home.html',
    directives: [RouterLink]
})
export class Home {

    constructor() {

        var canvas = <HTMLCanvasElement>document.getElementById('closedCases');
        var ctx = canvas.getContext('2d');

        var data = [
            {
                value: 300,
                color: "#F7464A",
                highlight: "#FF5A5E",
                label: "Red"
            },
            {
                value: 50,
                color: "#46BFBD",
                highlight: "#5AD3D1",
                label: "Green"
            },
            {
                value: 100,
                color: "#FDB45C",
                highlight: "#FFC870",
                label: "Yellow"
            }
        ]

        new Chart(ctx).Pie(data, {
            animateScale: true,
            scaleShowLabels: true
        });
    }
}

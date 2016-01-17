import {HTTP_PROVIDERS} from 'angular2/http';
import {Component, View, provide} from 'angular2/core';
import {ROUTER_DIRECTIVES, RouteConfig, Location,ROUTER_PROVIDERS, LocationStrategy, HashLocationStrategy, Route, AsyncRoute, Router} from 'angular2/router';

import { About } from './components/about/about';
import { Versioning } from './components/versioning/versioning';
import { Grid } from './components/grid/grid';
import { Column } from './components/grid/column';
import { Dynamicworksheets } from './components/dynamicworksheets/dynamicworksheets';
import { Eventscheduler } from './components/eventscheduler/eventscheduler';
import { Progressions } from './components/progressions/progressions';




@RouteConfig([
   new Route({path: '/', component: About, name: 'About'}),
   new Route({path: '/dynamicworksheets', component: Dynamicworksheets, name: 'Dynamicworksheets'}),
   new Route({path: '/eventscheduler', component: Eventscheduler, name: 'Eventscheduler'}),
   new Route({path: '/progressions', component: Progressions, name: 'Progressions'}),
 
])

@Component({
  selector: 'dataminer-app',
  providers: [Versioning],
  templateUrl: 'app/dataminer.html',
  styleUrls: ['app/dataminer.css'],

  directives: [ROUTER_DIRECTIVES, About],
  pipes: []
})
export class DataminerApp {
  router: Router;
  location: Location;
    versioning: Versioning;
  
   constructor(router: Router, location: Location,  versioning: Versioning) {
        this.router = router;
        this.location = location;  
        this.versioning = versioning; 
        this.versioning.verify(null);
    }

    getLinkStyle(path) {

        if(path === this.location.path()){
            return true;
        }
        else if(path.length > 0){
            return this.location.path().indexOf(path) > -1;
        }
    }
}

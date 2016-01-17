import {Component} from 'angular2/core';
import {Http, Headers} from 'angular2/http'


import 'rxjs/add/operator/retry';
import 'rxjs/add/operator/timeout';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/map';

@Component({
  selector: 'versioning',
  templateUrl: 'app/components/versioning/versioning.html',
  styleUrls: ['app/components/versioning/versioning.css'],
  providers: [],
  directives: [],
  pipes: []
})
export class Versioning {

  http: Http;
  version = '0.0.1';
  liveVersion = '';
  hasLatest:number = 0;
  private verifiedCallback:Function = null;
  private packageJSONURL: string = 'http://cors.io/?u='+'http://ec2-54-67-81-203.us-west-1.compute.amazonaws.com/dataminer/package.json'; //use proxy http://cors.io/
  
    constructor( http: Http) {
      this.http = http; 
    }
    
    verify( verifiedCallback: Function) {
        this.verifiedCallback = verifiedCallback;
        this.http
        .get(this.packageJSONURL)
        .timeout(1500, new Error('versioning request response timedout'))
        .map(res => res.json())
        .subscribe(
            res => this.verifyLatestVersion(res),
            err => this.verifyError(err),
            () => console.log('fetch live version complete')
        );      
    }
    
   verifyError(err) {
        // in case of http error assume latest version is loaded.
        console.log(err );
        console.log('unable to verify that dataminer version is up to date');
        this.hasLatest = 1;
    }
    
    verifyLatestVersion(latestVersion) {
      
      this.liveVersion = latestVersion['version'];
      
      let liveVersionIdArray = latestVersion['version'].split('.');
      let liveVersionMinorIndex:number = parseInt(liveVersionIdArray[2], 10);
   
      let loadedVersionIdArray = this.version.split('.');
      let loadedVersionMinorIndex:number = parseInt(loadedVersionIdArray[2], 10);
   
      this.hasLatest = (loadedVersionMinorIndex >= liveVersionMinorIndex) ? 1 : 0;
      //console.log( liveVersionIdArray[2] + ',' + loadedVersionIdArray[2]);
      
      if (this.verifiedCallback) {
        this.verifiedCallback(this.hasLatest);
      }
    }
}

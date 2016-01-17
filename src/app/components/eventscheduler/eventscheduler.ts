import {Component} from 'angular2/core';
import {Http, Headers} from 'angular2/http'
import {RouteParams} from 'angular2/router';
import {ROUTER_DIRECTIVES} from 'angular2/router';
import {Location} from 'angular2/router';
import {Dynamodbio} from '../dynamodbio/dynamodbio';
import {Versioning} from '../versioning/versioning';

declare var gapi;

@Component({
  selector: 'eventscheduler',
  templateUrl: 'app/components/eventscheduler/eventscheduler.html',
  styleUrls: ['app/components/eventscheduler/eventscheduler.css'],
  providers: [Dynamodbio, Versioning],
  directives: [ROUTER_DIRECTIVES],
  pipes: []
})
export class Eventscheduler {

    private result: Object = { 'json':{}, 'text':'loading...'};
    private http: Http;
    private dynamodbio : Dynamodbio;
    private versioning: Versioning;
    
    private clientID = '520844228177-3utgp17ioq1vk8p1m7uktl1kce62ll7l.apps.googleusercontent.com'; //choose web app client Id, redirect URI and Javascript origin set to http://localhost
    private apiKey = ''; //choose public apiKey, any IP allowed (leave blank the allowed IP boxes in Google Dev Console)
    private userEmail = "e1f592e343osdhequi9a0og69s@group.calendar.google.com"; //your calendar Id
    private userTimeZone = "London"; //example "Romeo" "Los_Angeles" ecc...
    private scope = "https://www.googleapis.com/auth/calendar.readonly";

       
    // 
    constructor(params: RouteParams, http: Http, dynamodbio : Dynamodbio, versioning: Versioning){
        this.http = http;
        this.dynamodbio  = dynamodbio;
        this.versioning = versioning;  
        this.checkAuth();
    }

    checkAuth() {
       gapi.auth.authorize({client_id: this.clientID, scope: this.scope, immediate: false}, this.handleAuthResult.bind(this));
	   return false;
	}

    handleAuthResult(authResult) {
        console.log("Authentication result:");
        console.log(authResult);
        
        if (authResult  && !authResult.error) {

            gapi.client.load('calendar', 'v3', function () {
                //console.log('completed  gapi.client.load');
                var today = new Date();
                var request = gapi.client.calendar.events.list({
                    'calendarId' : this.userEmail,
                    'timeZone' : this.userTimeZone, 
                    'singleEvents': true, 
                    'timeMin': today.toISOString(), //gathers only events not happened yet
                    'maxResults': 10, 
                    'orderBy': 'startTime'});
                request.execute(function (resp) {
                    //console.log('request.execute called:');
                    this.result = {'json':{'data':{}}, 'text':''};
                    if(resp.error) {
                        console.log('request.execute error:'  );
                        console.log(resp.error);
                    }
                    for (var i = 0; i < resp.items.length; i++) {
                        //console.log("Event: " + i + ' '+ JSON.stringify( resp.items[i]));
                        this.result.json.data[ resp.items[i].id] = resp.items[i];
                    }
                    this.result.text = JSON.stringify(this.result.json, null, 2);
                }.bind(this));
            }.bind(this));
        } else  {
            console.log ("NOT  authenticated  " + authResult.error );
            console.log (authResult );
        }
    }

    handleImportFromGoogleDocs() {  
        gapi.auth.authorize({client_id: this.clientID, scope: this.scope, immediate: false}, this.handleAuthResult.bind(this));
    }
    
    handleExportToDynamoDB( evironmentFlag = 'live') {
        var tables = (evironmentFlag === 'live') ? ['dataminerruleslive', 'dataminerrulestest01'] : ['dataminerrulestest01'];
        this.versioning.verify( function( verified: number) {
                if (verified===1) {
                    this.result = this.dynamodbio.export('events', this.result, 'eventscheduler', tables);
                } else {
                    window.alert('FAILED: you do not have the latest dataminer app version loaded:' + this.versioning.liveVersion);
                }
            }.bind(this)
        );
    }
    
  

    
    

}
import {Component,Attribute, ElementRef, Inject, OnInit} from 'angular2/core';
import {Http, Headers} from 'angular2/http'
import {RouteParams} from 'angular2/router';
import {ROUTER_DIRECTIVES} from 'angular2/router';
import {Location} from 'angular2/router';
import {Dynamodbio} from '../dynamodbio/dynamodbio';
import {Versioning } from '../versioning/versioning';

declare var d3;
declare var jQuery:any;


@Component({
  selector: 'progressions',
  templateUrl: 'app/components/progressions/progressions.html',
  styleUrls: ['app/components/progressions/progressions.css'],
  providers: [Dynamodbio, Versioning],
  directives: [ROUTER_DIRECTIVES],
  pipes: []
})
export class Progressions {

    private result: Object = { 'json':{}, 'text':'loading...'};
    private http: Http;
    private googleDocJsonFeedUrl: string ='https://spreadsheets.google.com/feeds/worksheets/1xP0aCx9S4wG_3XN9au5VezJ6xVTnZWNlOLX8l6B69n4/public/basic?alt=json';
    private dynamodbio : Dynamodbio;
    private versioning: Versioning;
    
    private progressionWorksheetNames = [];
    private progressionWorksheets = [];
    
    private elementRef: ElementRef;
   

    // 
    constructor(params: RouteParams, 
            http: Http, 
            dynamodbio: Dynamodbio, 
            versioning: Versioning,
            @Inject(ElementRef) elementRef: ElementRef,
            @Attribute('width') width: string,
            @Attribute('height') height: string
        ){
        this.http = http;
        this.dynamodbio  = dynamodbio;
        this.versioning = versioning;
        this.progressionWorksheetNames = [];
        this.progressionWorksheets = [];
        this.elementRef = elementRef;
    }

    ngOnInit() {
        
        var points = [
            [0, 0],
            [200, 100],
            [300, 400],
            [400, 460],
            [500, 500]
        ];
        
        var el:HTMLElement = this.elementRef.nativeElement;

        var root:any = d3.select( jQuery(el).find('div')[0] );
    
        var svg = root.append("svg")
            .attr("width", 500)
            .attr("height", 500);
            
        var path = svg.append("path")
            .data([points])
            .attr("d", d3.svg.line()
            .tension(0) // Catmull–Rom
            .interpolate("basis"));
            
        svg.selectAll(".point")
            .data(points)
            .enter().append("circle")
            .attr("r", 4)
            .attr("transform", function(d) { return "translate(" + d + ")"; })
    }
    
    findYatXbyBisection(x, path, error){
            var length_end = path.getTotalLength()
                , length_start = 0
                , point = path.getPointAtLength((length_end + length_start) / 2) // get the middle point
                , bisection_iterations_max = 50
                , bisection_iterations = 0

            error = error || 0.01

            while (x < point.x - error || x > point.x + error) {
                // get the middle point
                point = path.getPointAtLength((length_end + length_start) / 2)

                if (x < point.x) {
                    length_end = (length_start + length_end)/2
                } else {
                    length_start = (length_start + length_end)/2
                }

                // Increase iteration
                if(bisection_iterations_max < ++ bisection_iterations)
                break;
            }
            return point.y
        }
        
    findYatX(x, line) {
        function getXY(len) {
            var point = line.getPointAtLength(len);
            return [point.x, point.y];
        }
        var curlen = 0;
        while (getXY(curlen)[0] < x) { curlen += 0.01; }
        return getXY(curlen);
    }
            
    handleImportProgressionsWorksheets() {
          console.log('handleImportProgressionsWorksheets');
            
          this.http
            .get(this.googleDocJsonFeedUrl)
            .map(res => res.json())
            .subscribe(
              res => this.populateProgressionsWorksheetsList(res)
            ); 
    }
    
    handleImportFromGoogleDocs( worksheetName) {  
      console.log('importFromGoogleDocs' + worksheetName);
        
        var worksheetKey = '';
        this.progressionWorksheets.forEach( function( worksheet ) {
          if ( worksheet['title']['$t'] === worksheetName) {
            worksheetKey = worksheet['key'];     
          }
        });
        
      this.progressionWorksheetNames = [worksheetName];
        
      var url = 'https://spreadsheets.google.com/feeds/list/1xP0aCx9S4wG_3XN9au5VezJ6xVTnZWNlOLX8l6B69n4/'+ worksheetKey + '/public/values?alt=json';

      console.log(url);
      this.http
        .get(url)
        .map(res => res.json())
        .subscribe(
          res => this.result = this.parseGoogleDocJSON(res, worksheetKey)
         );
    }
    
    
   populateProgressionsWorksheetsList( googleWorksheetJSON) {

      this.progressionWorksheetNames = [];
      this.progressionWorksheets = [];
   
      for (var rowIndex = 0; rowIndex < googleWorksheetJSON.feed.entry.length; rowIndex++) { 

        //console.log( googleWorksheetJSON.feed.entry[rowIndex]['title']['$t']);
        var progression = {};
        if (googleWorksheetJSON.feed.entry[rowIndex]['title']['$t'].match(/^Prog(.*)/)) {
          progression['title'] = googleWorksheetJSON.feed.entry[rowIndex]['title'];
          progression['content'] = googleWorksheetJSON.feed.entry[rowIndex]['content'];
          
          var re = new RegExp( "https://spreadsheets.google.com/feeds/list/1xP0aCx9S4wG_3XN9au5VezJ6xVTnZWNlOLX8l6B69n4/(.*)/public/basic");
          var match =  re.exec(googleWorksheetJSON.feed.entry[rowIndex]['link'][0]['href']);
          if (match) {
              console.log('match');
              progression['key'] = match[1];
          }
          
          this.progressionWorksheetNames.push( googleWorksheetJSON.feed.entry[rowIndex]['title']['$t']);
          
          this.progressionWorksheets.push(progression);
        }
  
        
        /*
        var value = res.feed.entry[rowIndex]['gsx$value'].$t;
        if (!isNaN(value)) {
            value = parseInt( value, 10);
        }
        simvalues['data']['globals'][key] = value;*/
      }
      
      //window.alert('Import complete. Now export to persist this change.');
       
      return; // { 'json':this.dynamicWorksheets, 'text':JSON.stringify(this.dynamicWorksheets, null, 2)};
    }
    

    
    
    handleExportToDynamoDB( evironmentFlag = 'live') {
      
      var tables = (evironmentFlag === 'live') ? ['dataminerruleslive', 'dataminerrulestest01'] : ['dataminerrulestest01'];
 
        console.log(this.result['worksheetKey'] + ', ' + this.result['title']);
    
         this.versioning.verify( function( verified: number) {
            if (verified===1) {
              this.result = this.dynamodbio.export(this.result['worksheetKey'], this.result, this.result['title'], tables);
            } else {
              window.alert('FAILED: you do not have the latest dataminer app version loaded:' + this.versioning.liveVersion);
            }
          }.bind(this)
        );
    }
    
    parseGoogleDocJSON(res, worksheetKey) {
      
      
      if ( !this.result.hasOwnProperty('comment')) {
          this.result['comment'] = 'no comment';
      }
      
      var simvalues = this.result['json'];
      simvalues['data'] = {};
      simvalues['data']['rows'] = [];
      simvalues['data']['keys'] = {};

      var rowIndex = 0;
      for (var row  in res.feed.entry) { 
         
         var key = res.feed.entry[row]['title']['$t'];
         simvalues['data']['keys'][key] = {};
         
         var thisRow = {};
         thisRow[key] = {};
               
         for ( var col in res.feed.entry[0] ) {
      
            var value = res.feed.entry[row]['title']['$t'];
            if (!isNaN(value)) {
                value = parseInt( value, 10);
            }
            console.log(value);
            
            Object.keys(value).forEach( function( subvalue) {
              if (col.match(/^gsx/)) {
                
                if (!isNaN(res.feed.entry[rowIndex][col]['$t'])) {
                    thisRow[key][col.substring(4)] = parseInt( res.feed.entry[rowIndex][col]['$t'], 10);
                } else {              
                    thisRow[key][col.substring(4)] = res.feed.entry[rowIndex][col]['$t'];  
                }
              }
            });         
         }
         
         simvalues['data']['rows'].push( thisRow);
         rowIndex ++;
      }
      
      window.alert('Import complete. Now export to persist this change.');
       
      return { 'json':simvalues, 'text':JSON.stringify(simvalues, null, 2), 'title': res.feed['title']['$t'], 'worksheetKey': worksheetKey, 'comment' : this.result['comment']};
    }

}
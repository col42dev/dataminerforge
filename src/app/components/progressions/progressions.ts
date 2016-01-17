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
    private googleSheetGUI: string = '17zTu83ztPNE-7EYePx1YFHiqI5mD-nHsju8GPKnSlQM';
    private googleDocJsonFeedUrl: string ='https://spreadsheets.google.com/feeds/worksheets/'+this.googleSheetGUI+'/public/basic?alt=json';
    private dynamodbio : Dynamodbio;
    private versioning: Versioning;
    
    private progressionWorksheetNames = [];
    private progressionWorksheets = [];
    
    private points = [];
    private path;
    private maxY = 0;
    
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
        console.log('importFromGoogleDocs:' + worksheetName);        
        var worksheetKey = '';
        this.progressionWorksheets.forEach( function( worksheet ) {
            if ( worksheet['title']['$t'] === worksheetName) {
            worksheetKey = worksheet['key'];     
            }
        });
        
        this.progressionWorksheetNames = [worksheetName];

        var url = 'https://spreadsheets.google.com/feeds/list/' + this.googleSheetGUI +'/'+ worksheetKey + '/public/values?alt=json';

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

        var progression = {};
        if (googleWorksheetJSON.feed.entry[rowIndex]['title']['$t'].match(/^Prog(.*)/)) {
          progression['title'] = googleWorksheetJSON.feed.entry[rowIndex]['title'];
          progression['content'] = googleWorksheetJSON.feed.entry[rowIndex]['content'];
          
          var re = new RegExp( "https://spreadsheets.google.com/feeds/list/" + this.googleSheetGUI +"/(.*)/public/basic");
          var match =  re.exec(googleWorksheetJSON.feed.entry[rowIndex]['link'][0]['href']);
          if (match) {
              console.log('match');
              progression['key'] = match[1];
          }
          
          this.progressionWorksheetNames.push( googleWorksheetJSON.feed.entry[rowIndex]['title']['$t']);
          
          this.progressionWorksheets.push(progression);
        }
      }
      
       
      return; 
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
      
      this.points = [];
              
      if ( !this.result.hasOwnProperty('comment')) {
          this.result['comment'] = 'no comment';
      }
      
      var simvalues = this.result['json'];
      simvalues['data'] = {};

      var rowIndex = 0;
      for (var row  in res.feed.entry) { 
          
         let tuplet = [];
         
         var progression =  parseInt( res.feed.entry[row]['gsx$progression']['$t'], 10);
         var controlpoint = parseInt( res.feed.entry[row]['gsx$controlpoint']['$t'], 10);
         
         tuplet.push(progression * 10);
         tuplet.push(controlpoint * 10);
         this.points.push(tuplet);
                  
         rowIndex ++;
      }
      
      // transform tuplets from top-left to bottom-left origin 
      this.maxY = 0;
      for (var tuple in this.points) {
          if (this.points[tuple][1] > this.maxY) {
              this.maxY = this.points[tuple][1];
          }
      }

      for (var tuple in this.points) {
          this.points[tuple][1] = this.maxY - this.points[tuple][1];
      }
      
        var el:HTMLElement = this.elementRef.nativeElement;

        // remove any pre-existing svg markup before appending updated html in to DOM.
        jQuery(el).find('div')[0].innerHTML = ''; 

        var root:any = d3.select( jQuery(el).find('div')[0] );
   
        var svg = root.append("svg")
            .attr("width", this.points[this.points.length-1][0])
            .attr("height", this.maxY);
            
        this.path = svg.append("path")
            .data([this.points])
            .attr("d", d3.svg.line()
            .tension(0) // Catmull–Rom
            .interpolate("basis"));
            
        svg.selectAll(".point")
            .data(this.points)
            .enter().append("circle")
            .attr("r", 4)
            .attr("transform", function(d) { return "translate(" + d + ")"; });

            
// axis labels            
        /*
        svg.append("text")
            .attr("class", "x label")
            .attr("text-anchor", "end")
            .attr("x", 500)
            .attr("y", 500 - 6)
            .text("income per capita, inflation-adjusted (dollars)");     


        svg.append("text")
            .attr("class", "y label")
            .attr("text-anchor", "end")
            .attr("y", 6)
            .attr("dy", ".75em")
            .attr("transform", "rotate(-90)")
            .text("life expectancy (years)");*/
    
//x axis annoations     
/*   
        var xScale = d3.scale.ordinal();

        // x axis annoations - create an array with the position of each label
        var range = [];
        var xoffset = 0;
        for (var k =0;k<this.points.length; k++){
            range.push((k*500)/(this.points.length -1 ) + xoffset)
        }

        //x axis annoations - domain is the desired labels in an array, range is the position of each label in an array
        var rangeDomain = [];
        for (var k =0;k<this.points.length; k++){
            rangeDomain.push(  this.points[k][0] / 10 );
        }
        xScale.domain(rangeDomain).range(range);                
        var xaxis = d3.svg.axis().scale(xScale);
        var g = svg.append("g")
        .attr("transform", "translate(" + xoffset + "," + (0) + ")")
        .call(xaxis);        
                        */

      // interpolate
      simvalues['data']['progression'] = [];

      for (var kx =this.points[0][0];kx<=this.points[this.points.length-1][0]; kx+=10){
          let value = (this.maxY - this.findYatXbyBisection(kx,this.path.node(), null)) / 10;
          value = Math.round(value);
          simvalues['data']['progression'].push(value);
      }            
            
      
      window.alert('Import complete. Now export to persist this change.');
       
      return { 'json':simvalues, 'text':JSON.stringify(simvalues, null, 2), 'title': res.feed['title']['$t'], 'worksheetKey': worksheetKey, 'comment' : this.result['comment']};
    }

}
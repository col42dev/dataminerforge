[Dataminer](https://github.com/col42dev/dataminer) handles data conversions from google spreadsheets/calendars to dynamodb.

Dataminer is built using a Angular2 and written in TypeScript which gets transpiled to JavaScript. 

## setup

Update [NodeJS to version 4+](https://nodejs.org/en/download/) Windows: node-v4.2.4-x86.msi


Recommended editor environement (Mac/PC): https://code.visualstudio.com/


Install Angular 2 cli
> $npm install -g angular-cli
angular-cli@0.0.20 ...\npm\node_modules\angular-cli

Install Typescript
>npm install -g typescript
...
typescript@1.7.5 ...\npm\node_modules\typescript


Install node_modules listed in packages.json
>cd dataminer
>npm install 

## launch


Serve on local host - Windows: Run in cmd as adminstrator
> cd dataminer 
> ng serve
Goto localhost:4200

Add component
> ng generate component componentname


## testing

> ng test

## build and deploy

to generate dist folder
> ng build

to deploy:
> sh publishToEC2.sh

## references:

https://medium.com/@daviddentoom/how-to-build-an-angular-2-application-with-routing-and-services-67ead73db96e#.kf7ihgmyi

https://github.com/thelgevold/angular-2-samples/blob/master/index.html

https://auth0.com/blog/2015/10/15/angular-2-series-part-3-using-http/

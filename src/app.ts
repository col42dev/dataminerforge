
import {HTTP_PROVIDERS} from 'angular2/http';
import {Component, View, provide} from 'angular2/core';
import {bootstrap} from 'angular2/platform/browser';
import {DataminerApp} from './app/dataminer';



import {About} from './app/components/about/about';

import {ROUTER_DIRECTIVES, RouteConfig, Location,ROUTER_PROVIDERS, LocationStrategy, HashLocationStrategy, Route, AsyncRoute, Router} from 'angular2/router';


bootstrap(DataminerApp, [ROUTER_PROVIDERS, HTTP_PROVIDERS,
          provide(LocationStrategy, {useClass: HashLocationStrategy})]);

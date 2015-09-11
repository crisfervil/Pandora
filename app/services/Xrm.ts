import {Http} from 'angular2/angular2';

export class Xrm {

    private _http:Http;

    constructor(http:Http, private _devURL?: string){
        this._http = new Http;
    };

    Accounts = [{ Name: "Account 1", Description: "Description for Account" },
        { Name: "Account 2", Description: "Description for Account" }];


    private ODATA_ENDPOINT = "/XRMServices/2011/OrganizationData.svc";
    private version = '2.6.0';


    private getServerUrl() {
        var url = "";
        var localServerUrl = window.location.protocol + "//" + window.location.host;
        var url = this._devURL||localServerUrl;
        return url;
    }

    private getODataPath() {
        return this.getServerUrl() + this.ODATA_ENDPOINT;
    }
    
    retrieve(id, odataSetName) {
        return this.Accounts;
    }

    retrieveMultiple(entityName:string, columns:Array<string>, filter:string) {

        // in case filter is empty 
        filter = (filter) ? "&$filter=" + encodeURIComponent(filter) : '';

        // create defered object
        var setName = entityName + 'Set',
            query = this.getODataPath() + "/" + setName + "?$select=" + columns.join(',') + filter;
            
        return this._http.get(query);
    }
}

export class Xrm {
  
  Accounts = [{Name:"Account 1", Description:"Description for Account"},
              {Name:"Account 2", Description:"Description for Account"}];
  
  retrieve(id, odataSetName){
    return this.Accounts;
  }
  
  retrieveMultiple (odataSetName, oDataQuery) {
    
  }  
}

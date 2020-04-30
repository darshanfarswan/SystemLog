import { LightningElement, track, wire } from 'lwc';
import { subscribe, unsubscribe, onError, setDebugFlag, isEmpEnabled } from 'lightning/empApi';
import getRecords from '@salesforce/apex/SystemLogUtils.getRecords';

export default class SystemLogTracker extends LightningElement {
    @track channelName = '/data/System_Log__ChangeEvent';
    @track allSystemLogs;
    @track filteredSystemLogs;
    @track isSubscribed = false;
    @track showSuccess = true;
    @track showInfo = true;
    @track showWarning = true;
    @track showError = true;
    @track lastRefreshDateTime;
    
    connectedCallback() {
        const messageCallback = (response) => {
            console.log('New Log Added.')
            console.log(JSON.stringify(response));
            var cdcData = JSON.parse(JSON.stringify(response));
            console.log(cdcData);
            if (cdcData && cdcData.data && cdcData.data.payload && cdcData.data.payload.ChangeEventHeader && cdcData.data.payload.ChangeEventHeader.changeType && cdcData.data.payload.ChangeEventHeader.changeType == 'CREATE') { 
                var iconName = "action:approval";
                var cardClass = "slds-notify slds-notify_alert slds-theme_alert-texture slds-theme_info";
                switch (cdcData.data.payload.Log_Level__c) {
                    case "Success":
                        iconName = "action:approval";
                        cardClass = "slds-notify slds-notify_alert slds-theme_alert-texture slds-theme_info";
                        break;
                    case "Info":
                        iconName = "action:info";
                        cardClass = "slds-notify slds-notify_alert slds-theme_alert-texture slds-theme_info";
                        break;
                    case "Warning":
                        iconName = "action:preview";
                        cardClass = "slds-notify slds-notify_alert slds-theme_alert-texture slds-theme_warning";
                        break;
                    case "Error":
                        iconName = "action:remove";
                        cardClass = "slds-notify slds-notify_alert slds-theme_alert-texture slds-theme_error";
                        break; 
                }
                this.addToSystemLogs({
                    "Id" : cdcData.data.payload.Id,
                    "Name" : cdcData.data.payload.Name,
                    "Log_Level__c" : cdcData.data.payload.Log_Level__c,
                    "Message__c" : cdcData.data.payload.Message__c,
                    "Record_Id__c" : cdcData.data.payload.Record_Id__c,
                    "Record__c" : cdcData.data.payload.Record__c,
                    "Source__c" : cdcData.data.payload.Source__c,
                    "Application__c" : cdcData.data.payload.Application__c,
                    "Module__c" : cdcData.data.payload.Module__c,
                    "Stack_Trace__c" : cdcData.data.payload.Stack_Trace__c,
                    "IconName" : iconName,
                    "CardClass" : cardClass
                });
                this.filterLogs();
                this.lastRefreshDateTime = new Date();
            }
        }

        if (this.isSubscribed == false) {
            subscribe(this.channelName, -1, messageCallback).then(response => {
                console.log('Successfully subscribed to : ', JSON.stringify(response.channel));
                this.isSubscribed = true
            });
        }
    }

    @wire (getRecords, {})
    wiredRecords ({error, data}) {
        console.log('wiredRecords');
        console.log(error);
        console.log(data);

        if (data) {
            var allSystemLogs = [];
            for (var index in data) {
                var record = data[index];
                var iconName = "action:approval";
                var cardClass = "slds-notify slds-notify_alert slds-theme_alert-texture slds-theme_info";
                switch (record.Log_Level__c) {
                    case "Success":
                        iconName = "action:approval";
                        cardClass = "slds-notify slds-notify_alert slds-theme_alert-texture slds-theme_info";
                        break;
                    case "Info":
                        iconName = "action:info";
                        cardClass = "slds-notify slds-notify_alert slds-theme_alert-texture slds-theme_info";
                        break;
                    case "Warning":
                        iconName = "action:preview";
                        cardClass = "slds-notify slds-notify_alert slds-theme_alert-texture slds-theme_warning";
                        break;
                    case "Error":
                        iconName = "action:remove";
                        cardClass = "slds-notify slds-notify_alert slds-theme_alert-texture slds-theme_error";
                        break; 
                }
                allSystemLogs.push({
                    "Id" : record.Id,
                    "Name" : record.Name,
                    "Log_Level__c" : record.Log_Level__c,
                    "Message__c" : record.Message__c,
                    "Record_Id__c" : record.Record_Id__c,
                    "Record__c" : record.Record__c,
                    "Source__c" : record.Source__c,
                    "Application__c" : record.Application__c,
                    "Module__c" : record.Module__c,
                    "Stack_Trace__c" : record.Stack_Trace__c,
                    "IconName" : iconName,
                    "CardClass" : cardClass
                });
            }
            this.lastRefreshDateTime = new Date();
            this.allSystemLogs = allSystemLogs;
            this.filteredSystemLogs = allSystemLogs;
            console.log(this.filteredSystemLogs);
        } else if (error) {
            console.log(error);
        }
    }

    toggleLevel(event) {
        console.log(event);
        console.log(event.target.label);
        console.log(event.target.variant);
        var logLevel = event.target.label;
        event.target.variant = event.target.variant == 'neutral' ? 'success' : 'neutral';
        if (logLevel == 'Success') {
            this.showSuccess = this.showSuccess == true ? false : true;
        } else if (logLevel == 'Info') {
            this.showInfo = this.showInfo == true ? false : true;
        } else if (logLevel == 'Warning') {
            this.showWarning = this.showWarning == true ? false : true;
        } else if (logLevel == 'Error') {
            this.showError = this.showError == true ? false : true;
        }

        this.filterLogs();
    }

    filterLogs() {
        var filteredSystemLogs = [];
        for (var index in this.allSystemLogs) {
            var systemLog = this.allSystemLogs[index];
            if(systemLog.Log_Level__c == 'Success' && this.showSuccess) {
                console.log('Adding Success');
                filteredSystemLogs.push(systemLog);
            } else if(systemLog.Log_Level__c == 'Info' && this.showInfo) {
                console.log('Adding Info');
                filteredSystemLogs.push(systemLog);
            } else if(systemLog.Log_Level__c == 'Warning' && this.showWarning) {
                console.log('Adding Warning');
                filteredSystemLogs.push(systemLog);
            } else if(systemLog.Log_Level__c == 'Error' && this.showError) {
                console.log('Adding Error');
                filteredSystemLogs.push(systemLog);
            }
        }
        this.filteredSystemLogs = filteredSystemLogs;
    }

    openSystemLog(event) {
        console.log(event);
        console.log(event.target.value);
        var systemLogUrl = "/" + event.target.value;
        window.open(systemLogUrl);
    }

    addToSystemLogs(systemLog) {
        var allSystemLogs = this.allSystemLogs;
        console.log(this.allSystemLogs);
        allSystemLogs.unshift(systemLog);
        this.allSystemLogs = allSystemLogs;
    }
    
}
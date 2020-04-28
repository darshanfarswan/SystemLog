import { LightningElement, track, wire } from 'lwc';
import { subscribe, unsubscribe, onError, setDebugFlag, isEmpEnabled } from 'lightning/empApi';
import getRecords from '@salesforce/apex/SystemLogUtils.getRecords';

export default class SystemLogTracker extends LightningElement {
    @track channelName = '/data/System_Log__ChangeEvent';
    @track systemLogs;
    @track numberOfRecords = 20;

    subscribeEvents() {
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
                    "Stack_Trace__c" : cdcData.data.payload.Stack_Trace__c,
                    "IconName" : iconName,
                    "CardClass" : cardClass
                });
            }
        }

        subscribe(this.channelName, -1, messageCallback).then(response => {
            // Response contains the subscription information on successful subscribe call
            console.log('Successfully subscribed to : ', JSON.stringify(response.channel));
            //this.subscription = response;
            //this.toggleSubscribeButton(true);
        });
    }

    @wire (getRecords, {numberOfRecords : '$numberOfRecords'})
    wiredRecords ({error, data}) {
        console.log('wiredRecords');
        console.log(error);
        console.log(data);

        if (data) {
            var systemLogs = [];
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
                systemLogs.push({
                    "Id" : record.Id,
                    "Name" : record.Name,
                    "Log_Level__c" : record.Log_Level__c,
                    "Message__c" : record.Message__c,
                    "Record_Id__c" : record.Record_Id__c,
                    "Record__c" : record.Record__c,
                    "Source__c" : record.Source__c,
                    "Stack_Trace__c" : record.Stack_Trace__c,
                    "IconName" : iconName,
                    "CardClass" : cardClass
                });
            }
            this.systemLogs = systemLogs;
        } else if (error) {
            console.log(error);
        }
    }

    openSystemLog(event) {
        console.log(event);
        console.log(event.target.value);
        var systemLogUrl = "/" + event.target.value;
        window.open(systemLogUrl);
    }

    addToSystemLogs(systemLog) {
        var systemLogs = this.systemLogs;
        console.log(this.systemLogs);
        systemLogs.unshift(systemLog);
        this.systemLogs = systemLogs;
    }
    
}
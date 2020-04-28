/**
* SystemLogUtils to to provide support for access System_Lod__c object
*
* @version   1.0
* @since     2020-04-25
*/
public class SystemLogUtils {

    public enum LogLevel {
        Success, 
        Info, 
        Warning, 
        Error
    }

    @AuraEnabled(cacheable=true)
    public static List<System_Log__c> getRecords(Integer numberOfRecords){
        List<System_Log__c> systemLogs = [SELECT Id, 
                                                    Name, 
                                                    Log_Level__c, 
                                                    Message__c, 
                                                    Record_Id__c,
                                                    Record__c,
                                                    Source__c,
                                                    Stack_Trace__c
                                            FROM System_Log__c
                                            ORDER BY CreatedDate DESC
                                            LIMIT :numberOfRecords];

        return systemLogs;
    }

    public static System_Log__c prepareLog(Exception e, String recordId) {
        return prepareLog(LogLevel.Error, e.getMessage(), recordId, 'APEX', e.getStackTraceString());
    }

    public static System_Log__c prepareLog(LogLevel logLevel, String message, String recordId, String source, String stackTrace) {
        System_Log__c systemLog = new System_Log__c();
        systemLog.Log_Level__c = logLevel.name();
        systemLog.Message__c = message;
        systemLog.Record_Id__c = recordId;
        systemLog.Source__c = source;
        systemLog.Stack_Trace__c = stackTrace;

        return systemLog;
    }

    public static Database.SaveResult insertSystemLogs(Exception e, String recordId) {
        System_Log__c systemLog = prepareLog(e, recordId);
        return insertSystemLogs(systemLog);
    }

    public static Database.SaveResult insertSystemLogs(LogLevel logLevel, String message, String recordId, String source, String stackTrace) {
        System_Log__c systemLog = prepareLog(logLevel, message, recordId, source, stackTrace);
        return insertSystemLogs(systemLog);
    }

    public static Database.SaveResult insertSystemLogs(System_Log__c systemLog) {
        List<System_Log__c> systemLogs = new List<System_Log__c>();
        systemLogs.add(systemLog);
        return insertSystemLogss(systemLogs).get(0);
    }

    public static List<Database.SaveResult> insertSystemLogss(List<System_Log__c> systemLogs) {
        List<Database.SaveResult> saveResult = Database.insert(systemLogs, false);
        return saveResult;
    }
}
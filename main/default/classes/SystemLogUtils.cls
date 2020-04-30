/**
* SystemLogUtils to to provide support for access System_Lod__c object
*
* @version   1.0
* @since     2020-04-25
*/
public class SystemLogUtils {

    /**
    * LogLevel ENUM to define the set of Log Levels available in System    
    */
    public enum LogLevel {
        Success, 
        Info, 
        Warning, 
        Error
    }

    /**
    * loggingLevel APEX property to get the Logging_Level__c record from Hierarchy Custom Setting
    */
    private static Logging_Level__c loggingLevel {
        get {
            if (loggingLevel == null) {
                loggingLevel = Logging_Level__c.getInstance();
            }
            return loggingLevel;
        }
        set;
    }

    /**
    * getRecords method gets the System Logs created since Yesteday. This method
    * is invoked when the LWC is rendered initially
    * @return List of System_Log__c records
    */
    @AuraEnabled(cacheable=true)
    public static List<System_Log__c> getRecords(){
        List<System_Log__c> systemLogs = [SELECT Id, 
                                                    Name,
                                                    Application__c,
                                                    Module__c, 
                                                    Log_Level__c, 
                                                    Message__c, 
                                                    Record_Id__c,
                                                    Record__c,
                                                    Source__c,
                                                    Stack_Trace__c
                                            FROM System_Log__c
                                            WHERE CreatedDate = TODAY
                                                OR CreatedDate = YESTERDAY
                                            ORDER BY CreatedDate DESC];

        return systemLogs;
    }

    /**
    * prepareLog A polymorphic method that creates the System_Log__c record
    * @param Salesforce generated exception
    * @param Salesforce object record Id
    * @param Specific Application Name that generated the System Log
    * @param Specific Module withing an Application that generated the System Log
    * @return Instance of System_Log__c record
    */
    public static System_Log__c prepareLog(Exception e, String recordId, String applicationName, String moduleName) {
        return prepareLog(LogLevel.Error, e.getMessage(), recordId, 'APEX', e.getStackTraceString(), applicationName, moduleName);
    }

    /**
    * prepareLog A polymorphic method that creates the System_Log__c record
    * @param LogLevel for the System Log. Expected values from the defined ENUM
    * @param System Log Message
    * @param Salesforce object record Id
    * @param Source (APEX, API, LWC) for the System Log. 
    * @param Manually generated stack track for the System Log
    * @param Specific Application Name that generated the System Log
    * @param Specific Module withing an Application that generated the System Log
    * @return Instance of System_Log__c record
    */
    public static System_Log__c prepareLog(LogLevel logLevel, String message, String recordId, String source, String stackTrace, String applicationName, String moduleName) {
        System_Log__c systemLog = new System_Log__c();
        systemLog.Log_Level__c = logLevel.name();
        systemLog.Message__c = message;
        systemLog.Record_Id__c = recordId;
        systemLog.Source__c = source;
        systemLog.Stack_Trace__c = stackTrace;
        systemLog.Application__c = applicationName;
        systemLog.Module__c = moduleName;

        return systemLog;
    }

    /**
    * insertSystemLogs A polymorphic method that inserts the System_Log__c record(s)
    * @param Salesforce generated exception
    * @param Salesforce object record Id
    * @param Specific Application Name that generated the System Log
    * @param Specific Module withing an Application that generated the System Log
    * @return Database.SaveResult after the commit
    */
    public static Database.SaveResult insertSystemLogs(Exception e, String recordId, String applicationName, String moduleName) {
        System_Log__c systemLog = prepareLog(e, recordId, applicationName, moduleName);
        return insertSystemLogs(systemLog);
    }

    /**
    * insertSystemLogs A polymorphic method that inserts the System_Log__c record(s)
    * @param LogLevel for the System Log. Expected values from the defined ENUM
    * @param System Log Message
    * @param Salesforce object record Id
    * @param Source (APEX, API, LWC) for the System Log. 
    * @param Manually generated stack track for the System Log
    * @param Specific Application Name that generated the System Log
    * @param Specific Module withing an Application that generated the System Log
    * @return Database.SaveResult after the commit
    */
    public static Database.SaveResult insertSystemLogs(LogLevel logLevel, String message, String recordId, String source, String stackTrace, String applicationName, String moduleName) {
        System_Log__c systemLog = prepareLog(logLevel, message, recordId, source, stackTrace, applicationName, moduleName);
        return insertSystemLogs(systemLog);
    }

    /**
    * insertSystemLogs A polymorphic method that inserts the System_Log__c record(s)
    * @param Single records instance of System_log__c
    * @return Instance of System_Log__c record
    */
    public static Database.SaveResult insertSystemLogs(System_Log__c systemLog) {
        List<System_Log__c> systemLogs = new List<System_Log__c>();
        systemLogs.add(systemLog);

        List<Database.SaveResult> saveResults = insertSystemLogs(systemLogs);
        if (saveResults != null && !saveResults.isEmpty()) {
            return saveResults.get(0);
        }
        return null;
    }

    /**
    * insertSystemLogs A polymorphic method that inserts the System_Log__c record(s)
    * @param Single records instance of System_log__c
    * @return Instance of System_Log__c record
    */
    public static List<Database.SaveResult> insertSystemLogs(List<System_Log__c> systemLogs) {
        List<System_Log__c> filteredLogs = new List<System_Log__c>();
        //Filter the System Logs as per the Logging Levels
        for (System_Log__c systemLog : systemLogs) {
            if (String.isNotBlank(systemLog.Log_Level__c) && loggingLevelDefined(systemLog.Log_Level__c)) {
                filteredLogs.add(systemLog);
            }
        }
        
        List<Database.SaveResult> saveResult = Database.insert(filteredLogs, false);
        return saveResult;
    }

    /**
    * loggingLevelDefined Verifies if the logged in user has aaccess to the specific Log Level. 
    * This is defined in Custom Setting
    * @param Log Level like Success, Info, Warning, Error etc
    * @return Boolean result to show if the user has access to create the Type of System Log
    */
    public static Boolean loggingLevelDefined(String level) {
        //Change the Level value to Custom Setting field name
        String levelField = level + '__c';
        try {
            if (loggingLevel != null && loggingLevel.get(levelField) != null && loggingLevel.get(levelField) == true) {
                return true;
            }
        } catch(Exception e) {
            String message = 'No Log Level defined for ' + level + '.';
            insertSystemLogs(LogLevel.Error, message, null, 'APEX', e.getStackTraceString(), 'Logging Framework', 'Create Error Log');
            return false;
        }
        return false;
    }
}
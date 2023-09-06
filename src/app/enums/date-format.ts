export enum DateFormat {
  day = 'd',
  full = 'EEEE,   dd MMMM yyyy   HH:mm',
  fullDate = 'dd MMMM yyyy HH:mm',
  longDate = 'longDate',
  mediumDate = 'mediumDate',
  dayAndMonthAndYear = 'dd MMMM yyyy',
  hoursAndMinutes = 'HH:mm',
  monthAndYear = 'MMMM yyyy',
  shortDate = 'dd.MM.yy',
  shortDate2 = 'dd.MM.yyyy',
  shortDateTime = 'dd.MM.yy   HH:mm',
  shortDateTime2 = 'DD.MM.yyyy   HH:mm',
  YYYYMMDD = 'YYYY-MM-DD',
  weekday = 'EEEE',
  // TODO remove this when backend return publish_date in the correct format
  ISO8601WithOffset = 'yyyy-MM-DDThh:mm:ssZ'
}

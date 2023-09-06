import { Component, Input, OnChanges, SimpleChanges } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import moment from 'moment'

@Component({
  selector: 'app-date-separator',
  templateUrl: './date-separator.component.html',
  styleUrls: ['./date-separator.component.scss']
})
export class DateSeparatorComponent implements OnChanges {
  @Input() date: Date
  @Input() shouldParse: boolean

  parsedDate: string = ''

  constructor(private translate: TranslateService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes) {
      this.setParsedDate()
    }
  }

  setParsedDate(): void {
    switch (new Date(this.date).toISOString().substr(0, 10)) {
      case new Date().toISOString().substr(0, 10):
        this.parsedDate = this.translate.instant('chat.divider_today')
      case moment().subtract(1, 'days').format('YYYY-MM-DD'):
        this.parsedDate = this.translate.instant('chat.divider_yesterday')
      default:
        this.parsedDate = moment(this.date).format('LL')
    }

    if (!this.date || this.date === undefined || this.date.toDateString().length === 0 || !this.shouldParse) {
      return
    } else {
      switch (new Date(this.date).toISOString().substr(0, 10)) {
        case new Date().toISOString().substr(0, 10):
          this.parsedDate = this.translate.instant('chat.divider_today')
          break
        case moment().subtract(1, 'days').format('YYYY-MM-DD'):
          this.parsedDate = this.translate.instant('chat.divider_yesterday')
          break
        default:
          this.parsedDate = moment(this.date).format('LL')
      }
    }
  }
}

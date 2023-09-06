import { Component, Input } from '@angular/core'
import { CustomTemplatesService, LoadingIndicatorContext } from 'stream-chat-angular'

/**
 * The `LoadingInficatorPlaceholder` component displays the [default loading indicator](./LoadingIndicatorComponent.mdx) unless a [custom template](../services/CustomTemplatesService.mdx) is provided. This component is used by the SDK internally, you likely won't need to use it.
 */
@Component({
  selector: 'app-loading-indicator-placeholder',
  templateUrl: './loading-indicator-placeholder.component.html',
  styles: []
})
export class LoadingIndicatorPlaceholderComponent {
  /**
   * The size of the indicator (in pixels)
   */
  @Input() size: number = 15
  /**
   * The color of the indicator
   */
  @Input()
  color: string = `var(--str-chat__loading-indicator-color, var(--str-chat__primary-color, '#006CFF'))`

  constructor(public customTemplatesService: CustomTemplatesService) {}

  getLoadingIndicatorContext(): LoadingIndicatorContext {
    return {
      size: this.size,
      color: this.color
    }
  }
}

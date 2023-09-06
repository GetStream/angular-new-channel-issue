import { Component, Input } from '@angular/core'
import { CustomTemplatesService } from 'stream-chat-angular'

import { Icon } from '../icon/icon.component'
import { IconContext } from '../models/Icon-context'

/**
 * The `IconPlaceholder` component displays the [default icons](./IconComponent.mdx) unless a [custom template](../services/CustomTemplatesService.mdx) is provided. This component is used by the SDK internally, you likely won't need to use it.
 */
@Component({
  selector: 'app-icon-placeholder',
  templateUrl: './icon-placeholder.component.html',
  styles: []
})
export class IconPlaceholderComponent {
  /**
   * The icon to display, the list of [supported icons](https://github.com/GetStream/stream-chat-angular/tree/master/projects/stream-chat-angular/src/lib/icon/icon.component.ts) can be found on GitHub.
   */
  @Input() icon: Icon | undefined
  /**
   * The size of the icon (in pixels)
   */
  @Input() size: number | undefined
  constructor(public customTemplatesService: CustomTemplatesService) {}

  getIconContext(): IconContext {
    return {
      icon: this.icon,
      size: this.size
    }
  }
}

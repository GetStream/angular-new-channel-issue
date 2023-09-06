import { AfterViewInit, Component, ElementRef, OnDestroy, TemplateRef, ViewChild } from '@angular/core'
import { Observable, of, Subscription } from 'rxjs'
import { catchError, map, startWith } from 'rxjs/operators'
import { Channel } from 'stream-chat'
import {
  ChannelPreviewContext,
  ChannelService,
  CustomTemplatesService,
  DefaultStreamChatGenerics,
  ThemeService
} from 'stream-chat-angular'
import { ChannelListToggleService } from '../services/channel-list-toggle.service'

/**
 * The `ChannelList` component renders the list of channels.
 */
@Component({
  selector: 'app-channel-list',
  templateUrl: './channel-list.component.html',
  styleUrls: []
})
export class ChannelListComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container') private container!: ElementRef<HTMLElement>

  channels$: Observable<Channel<DefaultStreamChatGenerics>[] | undefined>
  isError$: Observable<boolean>
  isInitializing$: Observable<boolean>
  isLoadingMoreChannels: boolean = false
  isOpen$: Observable<boolean>
  hasMoreChannels$: Observable<boolean>
  customChannelPreviewTemplate: TemplateRef<ChannelPreviewContext> | undefined
  theme$: Observable<string>
  subscriptions: Subscription[] = []

  constructor(
    private channelService: ChannelService,
    private channelListToggleService: ChannelListToggleService,
    private customTemplatesService: CustomTemplatesService,
    private themeService: ThemeService
  ) {
    this.theme$ = this.themeService.theme$
    this.isOpen$ = this.channelListToggleService.isOpen$
    this.channels$ = this.channelService.channels$
    this.hasMoreChannels$ = this.channelService.hasMoreChannels$
    this.isError$ = this.channels$.pipe(
      map(() => false),
      catchError(() => of(true)),
      startWith(false)
    )
    this.isInitializing$ = this.channels$.pipe(
      map((channels) => !channels),
      catchError(() => of(false))
    )
    this.subscriptions.push(
      this.customTemplatesService.channelPreviewTemplate$.subscribe(
        (template) => (this.customChannelPreviewTemplate = template)
      )
    )
  }
  ngAfterViewInit(): void {
    this.channelListToggleService.setMenuElement(this.container.nativeElement)
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe())
  }

  async loadMoreChannels(): Promise<void> {
    this.isLoadingMoreChannels = true
    await this.channelService.loadMoreChannels()
    this.isLoadingMoreChannels = false
  }

  trackByChannelId(index: number, item: Channel<DefaultStreamChatGenerics>): string {
    return item.cid
  }

  channelSelected(): void {
    this.channelListToggleService.channelSelected()
  }

  getChannelPreviewContext(
    channel: Channel<DefaultStreamChatGenerics>
  ): ChannelPreviewContext<DefaultStreamChatGenerics> {
    return {
      channel
    }
  }
}

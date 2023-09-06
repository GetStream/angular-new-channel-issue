import { NgModule } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http'
import { BrowserModule } from '@angular/platform-browser';
import { TranslateLoader, TranslateModule, TranslateModuleConfig } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader'
import {
  StreamChatModule,
  StreamAutocompleteTextareaModule,
} from 'stream-chat-angular';

import { AppComponent } from './app.component';
import { ChatModule } from './chat/chat.module';
import { RequestService } from './services/request.service';


import en from '../assets/i18n/en.json'
import { AuthService } from './services/auth.service';

export function HttpLoaderFactory(httpClient: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(
    httpClient,
    './assets/i18n/',
    '.json?v=' + hashCode(`${JSON.stringify(en)}}`)
  )
}

const hashCode = (string: string) => {
  let hash = 0
  let i
  let chr

  for (i = 0; i < string.length; i++) {
    chr = string.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0 // Convert to 32bit integer
  }

  return hash
}

const TRANSLATE_MODULE_CONFIG: TranslateModuleConfig = {
  loader: {
    provide: TranslateLoader,
    useFactory: HttpLoaderFactory,
    deps: [HttpClient]
  }
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    TranslateModule.forRoot(TRANSLATE_MODULE_CONFIG),
    StreamAutocompleteTextareaModule,
    StreamChatModule,
    ChatModule
  ],
  providers: [RequestService, AuthService],
  bootstrap: [AppComponent],
})
export class AppModule {}

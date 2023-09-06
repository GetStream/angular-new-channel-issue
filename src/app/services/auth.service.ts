import { Injectable } from '@angular/core'
import { map } from 'rxjs/operators'
import { Observable } from 'rxjs'

import { RequestService } from './request.service'

@Injectable()
export class AuthService {
  constructor(private requestService: RequestService) {}

  getStreamToken(): Observable<string> {
    const url = `https://api.staging.hoopit.io/web/users/stream-token/`
    return this.requestService.request('GET', url).pipe(map((tokenResponse) => tokenResponse.stream_token))
  }
}

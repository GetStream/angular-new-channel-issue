import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Observable, of } from 'rxjs'


@Injectable()
export class RequestService {
  private headers: HttpHeaders = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept-Language': 'nb'
  })
  private paginationPaths = {}

  constructor(private http: HttpClient) {
  }

  request(
    method: string,
    url: string,
    key?: string | null,
    data?: any,
    version: string = '1',
    json_header: boolean = true,
    require_auth: boolean = true
  ): Observable<any> {
    if (json_header) {
      const apiVersion = Number(version) || 1
      this.headers = this.headers.set(
        'Accept',
        `application/problem+json; version=${apiVersion}, application/json; version=${apiVersion}`
      )
    }

    let body

    switch (method) {
      case 'POST':
        if (!json_header) {
          body = data
          return this.http.post(url, body)
        } else {
          body = JSON.stringify(data)
          return this.http.post(url, body, { headers: this.headers, withCredentials: require_auth })
        }

      case 'PUT':
        body = JSON.stringify(data)
        return this.http.put(url, body, { headers: this.headers, withCredentials: require_auth })

      case 'PATCH':
        body = JSON.stringify(data)
        return this.http.patch(url, body, { headers: this.headers, withCredentials: require_auth })

      case 'DELETE':
        return this.http.delete(url, { headers: this.headers, withCredentials: require_auth })

      case 'OPTIONS':
        return this.http.options(url, { headers: this.headers, withCredentials: require_auth })

      case 'GET':
        return this.http.get(url, { headers: this.headers })

      default:
        return of()
    }
  }
}

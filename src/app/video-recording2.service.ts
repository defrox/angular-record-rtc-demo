import { Injectable, NgZone } from '@angular/core';
import * as RecordRTC from 'recordrtc';
import moment from "moment";
import { Observable, Subject } from 'rxjs';
import { isNullOrUndefined } from 'util';

interface RecordedVideoOutput {
  blob: Blob;
  title: string;
}

@Injectable()
export class VideoRecordingService {


  private stream;
  private recorder;
  private interval;
  private startTime;
  private _recorded = new Subject<RecordedVideoOutput>();
  private _recordingTime = new Subject<string>();
  private _recordingFailed = new Subject<string>();


  getRecordedBlob(): Observable<RecordedVideoOutput> {
    return this._recorded.asObservable();
  }

  getRecordedTime(): Observable<string> {
    return this._recordingTime.asObservable();
  }

  recordingFailed(): Observable<string> {
    return this._recordingFailed.asObservable();
  }


  startRecording() {

    if (this.recorder) {
      // It means recording is already started or it is already recording something
      return;
    }

    this._recordingTime.next('00:00');
    /*navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(async function(stream) {
      this.stream = stream;
      this.record(this.stream);
    }).catch(error => {
      this._recordingFailed.next();
    });*/

    navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(s => {
      this.stream = s;
      this.record();
    }).catch(error => {
      this._recordingFailed.next();
    });
  }

  abortRecording() {
    this.stopMedia();
  }

  private record(stream: any = this.stream) {

    this.recorder = new RecordRTC.VideoRecordingService(stream, {
      type: 'video',
      mimeType: 'video/mp4'
    });

    this.recorder.record();
    this.startTime = moment();
    this.interval = setInterval(
      () => {
        const currentTime = moment();
        const diffTime = moment.duration(currentTime.diff(this.startTime));
        const time = this.toString(diffTime.minutes()) + ':' + this.toString(diffTime.seconds());
        this._recordingTime.next(time);
      },
      1000
    );
  }

  private toString(value) {
    let val = value;
    if (!value) {
      val = '00';
    }
    if (value < 10) {
      val = '0' + value;
    }
    return val;
  }

  stopRecording() {

    if (this.recorder) {
      this.recorder.stopRecording(function() {
        let blob = this.recorder.getBlob();
        //this.recorder.stop((blob) => {
          if (this.startTime) {
            const mp3Name = encodeURIComponent('video_' + new Date().getTime() + '.avi');
            this.stopMedia();
            this._recorded.next({ blob: blob, title: mp3Name });
          }
        /*}, () => {
          this.stopMedia();
          this._recordingFailed.next();
        });*/
      });
    }
  }

  private stopMedia() {
    if (this.recorder) {
      this.recorder = null;
      clearInterval(this.interval);
      this.startTime = null;
      if (this.stream) {
        this.stream.getAudioTracks().forEach(track => track.stop());
        this.stream = null;
      }
    }
  }

}

import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

declare const faceapi: any;

export interface FaceCaptureResult {
  profilePicture: string;
  faceEmbedding: number[];
}

@Component({
  selector: 'app-face-capture',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="face-card" [class.compact]="compact">
      <div class="face-head">
        <div>
          <strong>{{title}}</strong>
          <span>{{status}}</span>
        </div>
        <div class="face-state" [class.ready]="ready" [class.error]="!!error">
          <i [class]="error ? 'fas fa-triangle-exclamation' : ready ? 'fas fa-face-smile' : 'fas fa-circle-notch fa-spin'"></i>
        </div>
      </div>

      <div class="camera-shell">
        <video #video autoplay muted playsinline></video>
        <canvas #overlay></canvas>
        <div class="camera-overlay" *ngIf="!ready || error">
          <i [class]="error ? 'fas fa-video-slash' : 'fas fa-camera'"></i>
          <p>{{error || 'Opening secure camera...'}}</p>
        </div>
      </div>

      <div class="face-actions">
        <button type="button" class="btn-face secondary" (click)="restartCamera()" [disabled]="busy">
          <i class="fas fa-rotate"></i> Restart
        </button>
        <button type="button" class="btn-face primary" (click)="captureFace()" [disabled]="busy || !ready">
          <i class="fas fa-camera-retro"></i> {{captureLabel}}
        </button>
      </div>

      <div class="face-hint" *ngIf="hint">
        <i class="fas fa-shield-halved"></i> {{hint}}
      </div>
    </div>
  `,
  styles: [`
    .face-card {
      background: linear-gradient(145deg, rgba(255,255,255,0.92), rgba(239,246,255,0.76));
      border: 1px solid rgba(148,163,184,0.26);
      border-radius: 16px;
      padding: 14px;
      box-shadow: 0 18px 40px rgba(15,23,42,0.08);
      backdrop-filter: blur(12px);
      margin-bottom: 18px;
    }
    .face-card.compact { padding: 12px; }
    .face-head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:12px; }
    .face-head strong { display:block; color:#0f172a; font-size:0.92rem; font-weight:800; }
    .face-head span { display:block; color:#64748b; font-size:0.74rem; margin-top:2px; }
    .face-state {
      width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center;
      background:#eef2ff; color:#1d4ed8; box-shadow:inset 0 0 0 1px rgba(29,78,216,0.08);
    }
    .face-state.ready { background:#ecfdf5; color:#059669; }
    .face-state.error { background:#fef2f2; color:#dc2626; }
    .camera-shell {
      position:relative; aspect-ratio: 4 / 3; width:100%; overflow:hidden; border-radius:14px;
      background:#020617; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
    }
    video, canvas { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; transform:scaleX(-1); }
    canvas { pointer-events:none; }
    .camera-overlay {
      position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;
      gap:10px; text-align:center; color:#cbd5e1; background:linear-gradient(135deg, rgba(15,23,42,0.78), rgba(30,64,175,0.45));
      padding:18px;
    }
    .camera-overlay i { font-size:1.6rem; color:#38bdf8; }
    .camera-overlay p { margin:0; font-size:0.8rem; line-height:1.45; }
    .face-actions { display:flex; gap:10px; margin-top:12px; }
    .btn-face {
      border:none; border-radius:10px; padding:10px 12px; font-size:0.8rem; font-weight:800; cursor:pointer;
      display:inline-flex; align-items:center; justify-content:center; gap:8px; transition:all 0.18s ease; flex:1;
    }
    .btn-face.primary { color:#fff; background:linear-gradient(135deg, #0ea5e9, #2563eb); box-shadow:0 10px 22px rgba(37,99,235,0.22); }
    .btn-face.secondary { color:#1e293b; background:#fff; border:1px solid #dbe4f0; }
    .btn-face:hover:not(:disabled) { transform:translateY(-1px); }
    .btn-face:disabled { opacity:0.55; cursor:not-allowed; transform:none; }
    .face-hint {
      display:flex; align-items:center; gap:8px; margin-top:10px; color:#64748b; font-size:0.74rem;
      background:rgba(14,165,233,0.08); border:1px solid rgba(14,165,233,0.14); border-radius:10px; padding:9px 10px;
    }
    @media(max-width: 520px) { .face-actions { flex-direction:column; } }
  `]
})
export class FaceCaptureComponent implements AfterViewInit, OnDestroy {
  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('overlay') overlayRef!: ElementRef<HTMLCanvasElement>;
  @Input() title = 'Secure Face Capture';
  @Input() captureLabel = 'Capture Face';
  @Input() hint = 'Your face descriptor is stored securely and used only for sign-in verification.';
  @Input() compact = false;
  @Output() captured = new EventEmitter<FaceCaptureResult>();

  status = 'Initializing face detection';
  error = '';
  ready = false;
  busy = false;
  private stream?: MediaStream;
  private rafId?: number;
  private modelsLoaded = false;
  private lastDetection: any = null;

  async ngAfterViewInit() {
    await this.startCamera();
  }

  ngOnDestroy() {
    this.stopCamera();
  }

  async restartCamera() {
    this.stopCamera();
    await this.startCamera();
  }

  async startCamera() {
    this.error = '';
    this.ready = false;
    this.busy = true;
    try {
      await this.loadFaceApi();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser or requires a secure connection (HTTPS or localhost).');
      }

      // Try with ideal constraints first (avoids OverconstrainedError on non-standard webcams)
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        });
      } catch (constraintErr) {
        console.warn('Ideal constraints failed, falling back to basic video stream:', constraintErr);
        // Fallback to basic video stream (highest compatibility)
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      const video = this.videoRef.nativeElement;
      video.srcObject = this.stream;
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => resolve();
      });
      await video.play();
      this.ready = true;
      this.status = 'Look at the camera and keep your face inside the frame';
      this.detectLoop();
    } catch (err: any) {
      console.error('Camera initialization failed:', err);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        this.error = 'Camera permission denied. Please allow camera access in your browser settings.';
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        this.error = 'No camera device found. Please connect a webcam.';
      } else {
        this.error = err?.message || 'Camera permission denied or face detection could not start.';
      }
      this.status = 'Camera unavailable';
    } finally {
      this.busy = false;
    }
  }

  async captureFace() {
    if (!this.ready) return;
    this.busy = true;
    this.error = '';
    try {
      // Reuse the last active frame detection to avoid concurrent WebGL/TF.js execution conflicts
      let detection = this.lastDetection;
      
      if (!detection) {
        // Fallback to active single detection if loop hasn't run or is delayed
        detection = await this.getDetection();
      }

      if (!detection) {
        throw new Error('No clear face detected. Center your face, ensure good lighting, and try again.');
      }
      
      const image = this.snapshot();
      this.captured.emit({
        profilePicture: image,
        faceEmbedding: Array.from(detection.descriptor).map((n: any) => Number(Number(n).toFixed(6)))
      });
      this.status = 'Face captured successfully';
    } catch (err: any) {
      this.error = err?.message || 'Unable to capture face.';
    } finally {
      this.busy = false;
    }
  }

  private async loadFaceApi() {
    if (this.modelsLoaded) return;
    if (!(window as any).faceapi) {
      await new Promise<void>((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>('script[data-face-api]');
        if (existing) {
          existing.addEventListener('load', () => resolve());
          existing.addEventListener('error', () => reject(new Error('Unable to load Face-api.js.')));
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
        script.async = true;
        script.dataset['faceApi'] = 'true';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Unable to load Face-api.js. Check your network connection.'));
        document.head.appendChild(script);
      });
    }
    // Attempt local paths first (offline/instant loading) then fallback to GitHub Pages CDN
    await this.loadModelsFrom('/models').catch(() =>
      this.loadModelsFrom('/models/').catch(() =>
        this.loadModelsFrom('https://justadudewhohacks.github.io/face-api.js/models')
      )
    );
    this.modelsLoaded = true;
  }

  private loadModelsFrom(modelUrl: string) {
    return Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(modelUrl),
      faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
      faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
      faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl)
    ]);
  }

  private async detectLoop() {
    if (!this.ready) return;
    try {
      const detection = await this.getDetection();
      this.lastDetection = detection;
      this.drawDetection(detection);
    } catch (err) {
      console.warn('Face detection loop error:', err);
    }
    if (this.ready) {
      this.rafId = requestAnimationFrame(() => this.detectLoop());
    }
  }

  private async getDetection() {
    if (!this.videoRef || !this.videoRef.nativeElement) return null;
    const videoEl = this.videoRef.nativeElement;
    
    // Check if the video is ready and playing
    if (videoEl.paused || videoEl.ended || videoEl.readyState < 2) {
      return null;
    }

    // Try SSD MobileNet V1 first for high-accuracy detection
    try {
      const ssdOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.38 });
      const detection = await faceapi
        .detectSingleFace(videoEl, ssdOptions)
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (detection) return detection;
    } catch (err) {
      console.warn('SSD MobileNet V1 detection error, falling back to Tiny:', err);
    }

    // Fallback to TinyFaceDetector
    try {
      const tinyOptions = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.3 });
      return await faceapi
        .detectSingleFace(videoEl, tinyOptions)
        .withFaceLandmarks()
        .withFaceDescriptor();
    } catch (err) {
      console.warn('TinyFaceDetector error:', err);
      return null;
    }
  }

  private drawDetection(detection: any) {
    const video = this.videoRef.nativeElement;
    const canvas = this.overlayRef.nativeElement;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!detection) {
      this.status = 'Searching for one clear face';
      return;
    }
    this.status = 'Face detected. Ready to capture';
    const box = detection.detection.box;
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 4;
    ctx.shadowColor = 'rgba(34,211,238,0.65)';
    ctx.shadowBlur = 14;
    ctx.strokeRect(box.x, box.y, box.width, box.height);
  }

  private snapshot() {
    const video = this.videoRef.nativeElement;
    const canvas = document.createElement('canvas');
    canvas.width = 360;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Unable to create profile image.');
    const side = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - side) / 2;
    const sy = (video.videoHeight - side) / 2;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, side, side, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.86);
  }

  private stopCamera() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = undefined;
    this.ready = false;
  }
}

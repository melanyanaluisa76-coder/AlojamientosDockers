import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CloudinaryResult {
  secure_url: string;
  public_id: string;
}

@Injectable({ providedIn: 'root' })
export class CloudinaryService {
  private readonly uploadUrl =
    `https://api.cloudinary.com/v1_1/${environment.cloudinary.cloudName}/image/upload`;

  // Usa fetch nativo para evitar los interceptores HTTP de Angular.
  // El API secret nunca va aquí — solo cloudName y uploadPreset (unsigned).
  uploadImage(file: File): Observable<CloudinaryResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', environment.cloudinary.uploadPreset);

    const upload = fetch(this.uploadUrl, { method: 'POST', body: formData })
      .then(res => {
        if (!res.ok) throw new Error(`Cloudinary error: ${res.status}`);
        return res.json() as Promise<CloudinaryResult>;
      });

    return from(upload);
  }
}

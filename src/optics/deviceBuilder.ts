import type { Device, ZoomModule } from './types';

class DeviceBuilder {
  private device: Partial<Device> = { zooms: [] };
  
  camera(id: string, label: string, sensorW: number, sensorH: number) {
    this.device = { 
      id, label, type: 'camera', 
      sensorW, sensorH, 
      aspect: sensorW / sensorH, 
      zooms: [] 
    };
    return this;
  }
  
  phone(id: string, label: string, aspect: number) {
    this.device = { id, label, type: 'phone', aspect, zooms: [] };
    return this;
  }
  
  zoom(id: string, label: string, focalMm: number, projection: 'rectilinear' | 'fisheye' = 'rectilinear') {
    this.device.zooms!.push({ id, label, kind: 'zoom', focalMm, projection });
    return this;
  }
  
  prime(id: string, label: string, focalMm: number, projection: 'rectilinear' | 'fisheye' = 'rectilinear') {
    this.device.zooms!.push({ id, label, kind: 'prime', focalMm, projection });
    return this;
  }
  
  module(id: string, label: string, f35: number) {
    this.device.zooms!.push({ id, label, kind: 'module', f35 });
    return this;
  }
  
  build(): Device {
    return this.device as Device;
  }
}

export function device() {
  return new DeviceBuilder();
}

// Example usage helper
export function createPhoneDevice(id: string, label: string, aspect: number, modules: Array<{id: string; label: string; f35: number}>) {
  const builder = device().phone(id, label, aspect);
  modules.forEach(m => builder.module(m.id, m.label, m.f35));
  return builder.build();
}

export function createCameraDevice(
  id: string, 
  label: string, 
  sensorW: number, 
  sensorH: number,
  lenses: Array<{id: string; label: string; focalMm: number; kind?: 'zoom' | 'prime'; projection?: 'rectilinear' | 'fisheye'}>
) {
  const builder = device().camera(id, label, sensorW, sensorH);
  lenses.forEach(l => {
    if (l.kind === 'prime') {
      builder.prime(l.id, l.label, l.focalMm, l.projection);
    } else {
      builder.zoom(l.id, l.label, l.focalMm, l.projection);
    }
  });
  return builder.build();
}

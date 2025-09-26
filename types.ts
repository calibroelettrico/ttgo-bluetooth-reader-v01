
export enum ConnectionStatus {
  DISCONNECTED,
  CONNECTING,
  CONNECTED,
  ERROR,
}

// FIX: Add minimal Web Bluetooth API type definitions to fix compilation errors.
// These are normally provided by including "webbluetooth" in tsconfig.json's "lib" array.
type BluetoothServiceUUID = string;
type BluetoothCharacteristicUUID = string;

interface BluetoothRequestDeviceOptions {
  filters?: { services?: BluetoothServiceUUID[] }[];
  optionalServices?: BluetoothServiceUUID[];
}

interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  readonly value?: DataView;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTService {
  getCharacteristic(characteristic: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTServer {
  connect(): Promise<BluetoothRemoteGATTServer>;
  getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
  disconnect(): void;
  readonly connected: boolean;
}

interface BluetoothDevice extends EventTarget {
  readonly gatt?: BluetoothRemoteGATTServer;
  readonly name?: string;
}

interface Bluetooth {
  requestDevice(options?: BluetoothRequestDeviceOptions): Promise<BluetoothDevice>;
}

declare global {
  // This extends the Navigator interface to include the bluetooth property
  interface Navigator {
    bluetooth: Bluetooth;
  }
}

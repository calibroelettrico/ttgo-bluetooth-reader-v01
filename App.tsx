
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ConnectionStatus } from './types';
import { TTGO_SERVICE_UUID, MEASUREMENT_CHARACTERISTIC_UUID } from './constants';
import MeasurementDisplay from './components/MeasurementDisplay';
import { BluetoothIcon, LinkIcon, UnlinkIcon } from './components/icons';

const App: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [measurement, setMeasurement] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const deviceRef = useRef<BluetoothDevice | null>(null);
  const characteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);

  const handleDisconnectEvent = useCallback(() => {
    setStatus(ConnectionStatus.DISCONNECTED);
    setMeasurement(null);
    deviceRef.current = null;
    characteristicRef.current = null;
  }, []);

  useEffect(() => {
    // Cleanup on component unmount
    return () => {
      if (deviceRef.current?.gatt?.connected) {
        deviceRef.current.gatt.disconnect();
      }
    };
  }, []);

  const handleConnect = useCallback(async () => {
    if (!navigator.bluetooth) {
      setError("Web Bluetooth API is not available on this browser. Try Chrome on Android or desktop.");
      setStatus(ConnectionStatus.ERROR);
      return;
    }

    setStatus(ConnectionStatus.CONNECTING);
    setError(null);

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [TTGO_SERVICE_UUID] }],
        optionalServices: [TTGO_SERVICE_UUID],
      });

      deviceRef.current = device;
      device.addEventListener('gattserverdisconnected', handleDisconnectEvent);
      
      const server = await device.gatt?.connect();
      if (!server) throw new Error("Could not connect to GATT server");

      const service = await server.getPrimaryService(TTGO_SERVICE_UUID);
      const characteristic = await service.getCharacteristic(MEASUREMENT_CHARACTERISTIC_UUID);
      characteristicRef.current = characteristic;

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const target = event.target as BluetoothRemoteGATTCharacteristic;
        const value = target.value;
        if (value) {
          // Assuming the data is a 16-bit unsigned integer, little-endian.
          // This must match the data format sent from the TTGO firmware.
          const cmValue = value.getUint16(0, true); 
          setMeasurement(cmValue);
        }
      });
      
      setStatus(ConnectionStatus.CONNECTED);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to connect to the device.");
      setStatus(ConnectionStatus.ERROR);
    }
  }, [handleDisconnectEvent]);

  const handleDisconnect = useCallback(() => {
    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect();
    } else {
      handleDisconnectEvent();
    }
  }, [handleDisconnectEvent]);

  const renderContent = () => {
    switch (status) {
      case ConnectionStatus.CONNECTING:
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-500 mx-auto"></div>
            <p className="text-slate-400 mt-4">Connecting... check for a prompt.</p>
          </div>
        );

      case ConnectionStatus.CONNECTED:
        return (
          <>
            <MeasurementDisplay measurement={measurement} />
            <p className="text-green-400 font-medium my-4 flex items-center">
                <LinkIcon className="w-5 h-5 mr-2" />
                Connected to {deviceRef.current?.name || 'TTGO Device'}
            </p>
            <button
              onClick={handleDisconnect}
              className="mt-4 px-6 py-3 bg-red-600 text-white font-bold rounded-lg shadow-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <UnlinkIcon className="w-5 h-5 mr-2"/>
              Disconnect
            </button>
          </>
        );

      case ConnectionStatus.ERROR:
        return (
          <div className="text-center p-4 bg-red-900/50 rounded-lg border border-red-700">
            <p className="text-red-400 font-bold">Connection Error</p>
            <p className="text-slate-300 mt-2">{error}</p>
            <button
              onClick={() => setStatus(ConnectionStatus.DISCONNECTED)}
              className="mt-6 px-6 py-2 bg-slate-600 text-white font-bold rounded-lg hover:bg-slate-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        );
      
      case ConnectionStatus.DISCONNECTED:
      default:
        return (
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white">TTGO Bluetooth Reader</h2>
            <p className="text-slate-400 mt-2 mb-8">Ready to receive measurements.</p>
            <button
              onClick={handleConnect}
              className="px-8 py-4 bg-cyan-600 text-white text-xl font-bold rounded-full shadow-lg hover:bg-cyan-700 hover:scale-105 transform transition-all duration-300 flex items-center mx-auto"
            >
              <BluetoothIcon className="w-6 h-6 mr-3" />
              Connect to Device
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md flex flex-col items-center justify-center">
            {renderContent()}
        </div>
        <footer className="absolute bottom-4 text-center text-slate-600 text-sm">
            <p>Ensure your TTGO device is powered on and advertising the correct Bluetooth service.</p>
            <p>Service UUID: {TTGO_SERVICE_UUID}</p>
        </footer>
    </div>
  );
};

export default App;

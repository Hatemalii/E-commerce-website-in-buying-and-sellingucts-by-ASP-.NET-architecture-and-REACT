import { useState, useEffect, useRef } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

export const useSignalR = (token) => {
  const [connection, setConnection] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    const connectToHub = async () => {
      try {
        const newConnection = new HubConnectionBuilder()
          .withUrl('http://localhost:5221/notificationHub', { // Correct Backend URL
            accessTokenFactory: () => token
          })
          .withAutomaticReconnect()
          .configureLogging(LogLevel.Information)
          .build();

        newConnection.onreconnecting(error => {
          console.assert(newConnection.state === 'Reconnecting');
          setIsConnected(false);
        });

        newConnection.onreconnected(connectionId => {
          console.assert(newConnection.state === 'Connected');
          setIsConnected(true);
        });

        newConnection.onclose(error => {
          setIsConnected(false);
        });

        await newConnection.start();
        setIsConnected(true);
        setConnection(newConnection);
        connectionRef.current = newConnection;
      } catch (e) {
        console.error('SignalR Connection Error: ', e);
        // Fallback for mock without a real backend: just don't crash
      }
    };

    connectToHub();

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, [token]);

  return { connection, isConnected };
};

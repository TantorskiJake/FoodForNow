import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Typography, Alert } from '@mui/material';
import { BrowserMultiFormatReader } from '@zxing/browser';
import api from '../services/api';

const Scan = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const submitToken = searchParams.get('token');
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!sessionId || !submitToken || !videoRef.current) return;

    codeReaderRef.current = new BrowserMultiFormatReader();
    let active = true;

    const startScanner = async () => {
      try {
        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (!videoInputDevices.length) {
          setError('No camera found. Please allow camera access.');
          return;
        }
        const deviceId = videoInputDevices[0].deviceId;
        codeReaderRef.current.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          async (result, err) => {
            if (!active || scanned) return;
            if (result) {
              setScanned(true);
              try {
                codeReaderRef.current?.reset();
                await api.post(`/scan-session/${sessionId}`, {
                  barcode: result.getText(),
                  token: submitToken,
                });
                setSuccess(true);
              } catch (e) {
                setError(e.response?.data?.error || 'Failed to send barcode');
                setScanned(false);
              }
            }
            if (err && err.name !== 'NotFoundException') {
              setError(err.message || 'Camera error');
            }
          }
        );
      } catch (e) {
        setError(e.message || 'Camera error');
      }
    };
    startScanner();
    return () => {
      active = false;
      try {
        codeReaderRef.current?.reset();
      } catch {}
    };
  }, [sessionId, submitToken, scanned]);

  if (!sessionId || !submitToken) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error">Invalid scan link. Please scan the QR code from the app.</Alert>
      </Box>
    );
  }

  if (success) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          bgcolor: 'success.light',
          color: 'success.contrastText',
        }}
      >
        <Typography variant="h5" gutterBottom>
          ✓ Barcode sent!
        </Typography>
        <Typography variant="body1">
          Check your computer to add the item.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: 2,
        bgcolor: 'background.default',
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
        Scan product barcode
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2, width: '100%', maxWidth: 400 }}>
          {error}
        </Alert>
      )}
      <Box
        sx={{
          width: '100%',
          maxWidth: 400,
          height: 300,
          background: '#000',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <video
          ref={videoRef}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          autoPlay
          muted
          playsInline
        />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
        Point your camera at the product barcode
      </Typography>
    </Box>
  );
};

export default Scan;

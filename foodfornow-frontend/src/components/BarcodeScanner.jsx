import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import api from '../services/api';

// Base URL for QR code - use env var for dev
const getBaseUrl = (manualOverride) => {
  if (manualOverride) return manualOverride.replace(/\/$/, '');
  return import.meta.env.VITE_APP_PUBLIC_URL || window.location.origin;
};

const BarcodeScanner = ({ open, onDetected, onClose }) => {
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const pollRef = useRef(null);
  const [mode, setMode] = useState('type'); // 'type' | 'camera' | 'phone'
  const [error, setError] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [session, setSession] = useState(null);
  const [scanUrl, setScanUrl] = useState('');
  const [baseUrlOverride, setBaseUrlOverride] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');

  // Create scan session when opening in phone mode
  useEffect(() => {
    if (!open || mode !== 'phone') return;
    setError(null);
    setSession(null);
    setScanUrl('');
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.post('/scan-session');
        if (cancelled) return;
        setSession({
          id: data.sessionId,
          token: data.submitToken,
          expiresAt: data.expiresIn ? Date.now() + data.expiresIn * 1000 : null,
        });
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.error || 'Failed to create scan session');
      }
    })();
    return () => { cancelled = true; };
  }, [open, mode]);

  // Build scan URL when we have session (depends on baseUrlOverride)
  useEffect(() => {
    if (!session?.id || !session?.token) return;
    const base = getBaseUrl(baseUrlOverride);
    const query = new URLSearchParams({ session: session.id, token: session.token }).toString();
    setScanUrl(`${base}/scan?${query}`);
  }, [session, baseUrlOverride]);

  // Poll for barcode when session exists
  useEffect(() => {
    if (!open || !session?.id || mode !== 'phone') return;
    const poll = async () => {
      try {
        const { data } = await api.get(`/scan-session/${session.id}`);
        if (data.barcode) {
          onDetected(data.barcode);
          onClose();
        }
      } catch {}
    };
    pollRef.current = setInterval(poll, 1500);
    return () => clearInterval(pollRef.current);
  }, [open, session, mode, onDetected, onClose]);

  // Camera mode
  useEffect(() => {
    if (!open || mode !== 'camera') return;
    setError(null);
    setScanned(false);
    setCameraReady(false);
    codeReaderRef.current = new BrowserMultiFormatReader();
    let active = true;

    const startScanner = async () => {
      try {
        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (!videoInputDevices.length) {
          setError('No camera devices found.');
          return;
        }
        const deviceId = videoInputDevices[0].deviceId;
        codeReaderRef.current.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          (result, err, controls) => {
            if (!active) return;
            if (result && !scanned) {
              setScanned(true);
              controls.stop();
              onDetected(result.getText());
            }
            if (err && err.name !== 'NotFoundException' && !err.message?.includes('detect the code') && !err.message?.includes('MultiFormat')) {
              setError(err.message || 'Camera error');
            }
            setCameraReady(true);
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
  }, [open, mode, onDetected, scanned]);

  const handleClose = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setManualBarcode('');
    onClose();
  };

  const handleManualSubmit = () => {
    const code = String(manualBarcode || '').replace(/\D/g, '');
    if (code.length >= 8) {
      onDetected(code);
      handleClose();
    } else {
      setError('Enter a valid barcode (at least 8 digits)');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Scan Barcode</DialogTitle>
      <DialogContent sx={{ overflowY: 'auto', minHeight: 200 }}>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, v) => v && setMode(v)}
          size="small"
          sx={{ mb: 2 }}
        >
          <ToggleButton value="type">Type barcode</ToggleButton>
          <ToggleButton value="camera">Use camera</ToggleButton>
          <ToggleButton value="phone">Use phone</ToggleButton>
        </ToggleButtonGroup>

        {mode === 'type' ? (
          <Box sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter a product barcode to look it up (e.g. 3017620422003 for Nutella)
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'stretch', flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                size="small"
                fullWidth
                label="Barcode"
                placeholder="3017620422003"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                autoFocus
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.paper',
                    border: '2px solid',
                    borderColor: 'divider',
                  },
                }}
              />
              <Button variant="contained" onClick={handleManualSubmit} disabled={!manualBarcode.trim()} sx={{ minWidth: 100 }}>
                Lookup
              </Button>
            </Box>
          </Box>
        ) : mode === 'phone' ? (
          <>
            {scanUrl ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Scan this QR code with your phone to open the barcode scanner
                </Typography>
                <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2 }}>
                  <QRCodeSVG value={scanUrl} size={220} level="M" />
                </Box>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Then scan the product barcode with your phone camera
                </Typography>
              </Box>
            ) : (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">Creating scan session...</Typography>
              </Box>
            )}
          </>
        ) : (
          <>
            <Box
              sx={{
                width: '100%',
                height: 300,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: '#000',
                borderRadius: 2,
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
            {!cameraReady && !error && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Waiting for camera...
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Point your camera at a product barcode (the lines on packaging). Or use &quot;Type barcode&quot; to enter manually.
            </Typography>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BarcodeScanner;
